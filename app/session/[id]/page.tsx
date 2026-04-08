"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionPopup from "@/components/SessionPopup";
import { supabase } from "@/lib/supabaseClient";
import type { BookingWithDetails } from "@/hooks/useBooking";

const MOCK_ZOOM_LINK = "https://zoom.us/j/12345678901?pwd=mockSessionLink";

function formatTo12Hour(time?: string): string {
  if (!time) return "--.--";

  const [hourPart = "0", minutePart = "00"] = time.split(":");
  const hour = Number.parseInt(hourPart, 10);
  const minute = Number.parseInt(minutePart, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return "--.--";

  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minuteText = String(minute).padStart(2, "0");

  return `${hour12}.${minuteText} ${period}`;
}

function formatDayLabel(day?: string): string {
  if (!day) return "Day not set";
  return `${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()}`;
}

type SessionBookingData = BookingWithDetails & {
  time_slots?:
    | {
        day_of_week?: string;
        start_time?: string;
        end_time?: string;
      }
    | Array<{
        day_of_week?: string;
        start_time?: string;
        end_time?: string;
      }>
    | null;
  professional_profiles?:
    | {
        job_title?: string;
        profiles?:
          | {
              name?: string;
              profile_photo?: string | null;
            }
          | Array<{
              name?: string;
              profile_photo?: string | null;
            }>
          | null;
      }
    | Array<{
        job_title?: string;
        profiles?:
          | {
              name?: string;
              profile_photo?: string | null;
            }
          | Array<{
              name?: string;
              profile_photo?: string | null;
            }>
          | null;
      }>
    | null;
};

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params?.id;

  const [booking, setBooking] = useState<SessionBookingData | null>(null);
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

        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const result = (await response.json()) as {
          error?: string;
          booking?: SessionBookingData;
        };

        if (!response.ok || !result.booking) {
          throw new Error(result.error || "Failed to load session");
        }

        if (!result.booking.is_paid) {
          router.replace(`/payment/${bookingId}`);
          return;
        }

        setBooking(result.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
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
            onClick={() => router.push("/user?tab=sessions")}
            className="w-full rounded-full py-2.5 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, rgba(28,196,133,0.85), rgba(20,150,100,0.95))" }}
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const timeSlot = normalizeSingle(booking.time_slots);
  const professionalProfile = normalizeSingle(booking.professional_profiles);
  const professional = normalizeSingle(professionalProfile?.profiles);
  const dayLabel = formatDayLabel(timeSlot?.day_of_week);
  const startLabel = formatTo12Hour(timeSlot?.start_time);
  const endLabel = formatTo12Hour(timeSlot?.end_time);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)" }}>
      <SessionPopup
        professionalName={professional?.name || "Professional"}
        professionalRole={professionalProfile?.job_title || "Expert"}
        profilePhotoUrl={professional?.profile_photo || null}
        sessionDate={dayLabel}
        sessionTime={`${startLabel} to ${endLabel}`}
        sessionTimeZone="Asia/Colombo"
        zoomLink={booking.zoom_link || MOCK_ZOOM_LINK}
        onClose={() => router.push("/user?tab=sessions")}
      />
    </div>
  );
}
