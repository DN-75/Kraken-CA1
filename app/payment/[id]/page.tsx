"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { IoPersonOutline, IoTimeOutline, IoCheckmarkCircle, IoWarningOutline } from "react-icons/io5";
import { supabase } from "@/lib/supabaseClient";
import type { BookingWithDetails } from "@/hooks/useBooking";

type PaymentTimeSlot = {
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
};

type PaymentProfessionalProfile = {
  job_title?: string;
  price_per_hour?: number | null;
  profiles?: {
    name?: string;
    profile_photo?: string | null;
  } | null;
};

type PaymentBookingData = BookingWithDetails & {
  time_slots?: PaymentTimeSlot | PaymentTimeSlot[] | null;
  professional_profiles?: PaymentProfessionalProfile | PaymentProfessionalProfile[] | null;
};

function formatDayTime(dayOfWeek?: string, startTime?: string, endTime?: string) {
  if (!dayOfWeek || !startTime || !endTime) return "Time not available";
  return `${dayOfWeek} • ${startTime} - ${endTime}`;
}

function formatPrice(value?: number | null) {
  if (typeof value !== "number") return "Price not available";
  return `$${value.toFixed(2)}`;
}

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params?.id;

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          booking?: BookingWithDetails;
        };

        if (!response.ok || !result.booking) {
          throw new Error(result.error || "Failed to load booking details");
        }

        setBooking(result.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    void loadBooking();
  }, [bookingId, router]);

  const handlePay = async () => {
    if (!bookingId) return;

    setPaying(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(result.error || "Payment failed");
      }

      setSuccess(result.message || "Payment completed");
      setTimeout(() => {
        router.push(`/session/${bookingId}`);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)" }}>
        <div className="text-white text-lg">Loading payment details...</div>
      </div>
    );
  }

  const normalizedBooking = booking as PaymentBookingData | null;
  const timeSlot = Array.isArray(normalizedBooking?.time_slots)
    ? normalizedBooking.time_slots[0]
    : normalizedBooking?.time_slots;
  const professionalProfile = Array.isArray(normalizedBooking?.professional_profiles)
    ? normalizedBooking.professional_profiles[0]
    : normalizedBooking?.professional_profiles;
  const professional = Array.isArray(professionalProfile?.profiles)
    ? professionalProfile.profiles[0]
    : professionalProfile?.profiles;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)" }}>
      <div
        className="w-full max-w-xl rounded-2xl border border-emerald-500/20 p-6 sm:p-8"
        style={{
          background: "rgba(17, 49, 39, 0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}
      >
        <h1 className="text-2xl font-bold text-white mb-6">Complete Payment</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ background: "rgba(255,59,48,0.2)", borderLeft: "3px solid #FF3B30" }}>
            <IoWarningOutline className="text-red-300" size={18} />
            <span className="text-red-100 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ background: "rgba(16,185,129,0.2)", borderLeft: "3px solid #10B981" }}>
            <IoCheckmarkCircle className="text-emerald-300" size={18} />
            <span className="text-emerald-100 text-sm">{success}</span>
          </div>
        )}

        <div className="flex items-center gap-4 pb-5 mb-5 border-b border-emerald-500/15">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-500/30" style={{ background: "rgba(16,185,129,0.1)" }}>
            {professional?.profile_photo ? (
              <Image
                src={professional.profile_photo}
                alt={professional.name || "Professional"}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <IoPersonOutline size={24} className="text-emerald-400" />
            )}
          </div>
          <div>
            <p className="text-white text-lg font-semibold">{professional?.name || "Professional"}</p>
            <p className="text-sm" style={{ color: "#A7F3D0" }}>{professionalProfile?.job_title || "Expert"}</p>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(16,185,129,0.10)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#10B981" }}>Booked Time</p>
          <div className="flex items-center gap-2">
            <IoTimeOutline size={18} style={{ color: "#6EE7B7" }} />
            <p className="text-white text-sm">
              {formatDayTime(timeSlot?.day_of_week, timeSlot?.start_time, timeSlot?.end_time)}
            </p>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(16,185,129,0.10)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#10B981" }}>Session Price</p>
          <p className="text-white text-lg font-semibold">{formatPrice(professionalProfile?.price_per_hour)}</p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={paying || !booking || booking.is_paid || booking.status !== "approved"}
          className="w-full py-3 rounded-full text-white font-semibold transition-all hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, rgba(28,196,133,0.85), rgba(20,150,100,0.95))",
          }}
        >
          {booking?.is_paid ? "Already Paid" : paying ? "Processing Payment..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
