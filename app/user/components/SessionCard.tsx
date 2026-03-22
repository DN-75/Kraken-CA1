"use client";

import Image from "next/image";
import { IoPersonOutline, IoTimeOutline, IoMailOutline } from "react-icons/io5";
import type { BookingWithDetails } from "@/hooks/useBooking";

interface SessionCardProps {
  booking: BookingWithDetails;
  status: "pending" | "approved" | "completed";
  onCancel?: (bookingId: string) => void;
  onViewSession?: (bookingId: string) => void;
  loadingSession?: boolean;
}

export function SessionCard({ booking, status, onCancel, onViewSession, loadingSession = false }: SessionCardProps) {
  const { time_slots, professional_profiles } = booking;
  const professional = professional_profiles?.profiles;
  const jobTitle = professional_profiles?.job_title;

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "approved":
        return "#10B981";
      case "completed":
        return "#10B981";
      default:
        return "#10B981";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "pending":
        return "PENDING";
      case "approved":
        return "APPROVED";
      case "completed":
        return "COMPLETED";
      default:
        return "PENDING";
    }
  };

  const formatDayTime = (dayOfWeek?: string, startTime?: string, endTime?: string) => {
    if (!dayOfWeek || !startTime || !endTime) return "Time not available";
    return `${dayOfWeek} • ${startTime} - ${endTime}`;
  };

  return (
    <div
      className="rounded-2xl p-6 border border-emerald-500/15"
      style={{
        background: "rgba(17, 49, 39, 0.40)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.05)",
      }}
    >
      {/* Header with Professional Info */}
      <div className="flex items-start gap-4 mb-4 pb-4 border-b border-emerald-500/10">
        <div
          className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-emerald-500/30"
          style={{ background: "rgba(16, 185, 129, 0.1)" }}
        >
          {professional?.profile_photo ? (
            <Image
              src={professional.profile_photo}
              alt={professional.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <IoPersonOutline size={24} className="text-emerald-400" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{professional?.name || "Professional"}</h3>
          <p style={{ color: "#649c8c" }} className="text-sm">
            {jobTitle || "Expert"}
          </p>
          <div className="mt-2">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={{ background: `${getStatusColor()}33`, color: getStatusColor() }}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <IoTimeOutline size={18} style={{ color: "#649c8c" }} />
          <p style={{ color: "#649c8c" }} className="text-sm">
            {formatDayTime(time_slots?.day_of_week, time_slots?.start_time, time_slots?.end_time)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <IoMailOutline size={18} style={{ color: "#649c8c" }} />
          <p style={{ color: "#649c8c" }} className="text-sm">
            Requested on {new Date(booking.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Buttons based on status */}
      <div className="flex gap-3">
        {status === "pending" && (
          <div className="p-[1px] rounded-full w-full" style={{ background: "rgba(220, 38, 38, 0.2)" }}>
            <button
              onClick={() => onCancel?.(booking.id)}
              className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
              style={{
                color: "#FF6B6B",
                background: "transparent",
              }}
            >
              Cancel Request
            </button>
          </div>
        )}

        {status === "approved" && (
          <>
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(250, 204, 21, 0.2)" }}>
              <button
                onClick={() => {
                  window.location.href = `/payment/${booking.id}`;
                }}
                disabled={booking.is_paid}
                className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
                style={{
                  color: booking.is_paid ? "#A3A3A3" : "#FBBF24",
                  background: "transparent",
                  opacity: booking.is_paid ? 0.7 : 1,
                }}
              >
                {booking.is_paid ? "Payment Completed" : "Pay Now"}
              </button>
            </div>
            <div className="p-[1px] rounded-full flex-1" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
              <button
                onClick={() => {
                  if (booking.is_paid) {
                    onViewSession?.(booking.id);
                  }
                }}
                disabled={!booking.is_paid || loadingSession}
                className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
                style={{
                  color: booking.is_paid ? "#10B981" : "#A3A3A3",
                  background: "transparent",
                  opacity: booking.is_paid && !loadingSession ? 1 : 0.7,
                }}
              >
                {booking.is_paid ? (loadingSession ? "Opening..." : "View Session") : "Pay to View Session"}
              </button>
            </div>
          </>
        )}

        {status === "completed" && (
          <div className="p-[1px] rounded-full w-full" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
            <button
              className="w-full py-2.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
              style={{
                color: "#10B981",
                background: "transparent",
              }}
            >
              Rate Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
