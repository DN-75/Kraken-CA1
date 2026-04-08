"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionPopup from "@/components/SessionPopup";
import { supabase } from "@/lib/supabaseClient";

type ProfessionalSessionBooking = {
  id: string;
  is_paid: boolean;
  zoom_link: string | null;
  time_slots:
    | {
        day_of_week?: string;
        start_time?: string;
        end_time?: string;
      }
    | {
        day_of_week?: string;
        start_time?: string;
        end_time?: string;
      }[]
    | null;
  user_profiles:
    | {
        profiles:
          | {
              name?: string;
              profile_photo?: string | null;
            }
          | {
              name?: string;
              profile_photo?: string | null;
            }[]
          | null;
      }
    | {
        profiles:
          | {
              name?: string;
              profile_photo?: string | null;
            }
          | {
              name?: string;
              profile_photo?: string | null;
            }[]
          | null;
      }[]
    | null;
};

const MOCK_ZOOM_LINK = "https://zoom.us/j/12345678901?pwd=mockSessionLink";

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatTo12Hour(time?: string): string {
  if (!time) return "--.--";

  const [hourPart = "0", minutePart = "00"] = time.split(":");
  const hour = Number.parseInt(hourPart, 10);
  const minute = Number.parseInt(minutePart, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return "--.--";

  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}.${String(minute).padStart(2, "0")} ${period}`;
}

function formatDayLabel(day?: string): string {
  if (!day) return "Day not set";
  return `${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()}`;
}

export default function ProfessionalSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params?.id;

  const [booking, setBooking] = useState<ProfessionalSessionBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        setError("Booking ID not found");
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(`/api/professional/bookings/${bookingId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const result = (await response.json()) as {
          error?: string;
          booking?: ProfessionalSessionBooking;
        };

        if (!response.ok || !result.booking) {
          throw new Error(result.error || "Failed to load session details");
        }

        if (!result.booking.is_paid) {
          throw new Error("Session is not paid yet");
        }

        setBooking(result.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session details");
      } finally {
        setLoading(false);
      }
    };

    void loadBooking();
  }, [bookingId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)" }}>
        <div className="text-white text-lg">Loading session...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)" }}>
        <div className="w-full max-w-lg rounded-2xl border border-red-500/20 p-6" style={{ background: "rgba(17,49,39,0.45)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}>
          <p className="text-red-200 font-semibold mb-2">Unable to open session</p>
          <p className="text-white/80 text-sm mb-4">{error || "Session data is unavailable."}</p>
          <button
            type="button"
            onClick={() => router.push("/professional")}
            className="w-full rounded-full py-2.5 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, rgba(28,196,133,0.85), rgba(20,150,100,0.95))" }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const timeSlot = normalizeSingle(booking.time_slots);
  const userProfile = normalizeSingle(booking.user_profiles);
  const user = normalizeSingle(userProfile?.profiles);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)" }}>
      <SessionPopup
        professionalName={user?.name || "User"}
        professionalRole="Booked User"
        profilePhotoUrl={user?.profile_photo || null}
        sessionDate={formatDayLabel(timeSlot?.day_of_week)}
        sessionTime={`${formatTo12Hour(timeSlot?.start_time)} to ${formatTo12Hour(timeSlot?.end_time)}`}
        sessionTimeZone="Asia/Colombo"
        zoomLink={booking.zoom_link || MOCK_ZOOM_LINK}
        onClose={() => router.push("/professional")}
      />
    </div>
  );
}
