"use client";

import { useMemo, useState } from "react";
import { FaCalendarAlt, FaClock, FaUser } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";

interface BookingSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface BookingSessionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (timeSlotId: string) => Promise<void>;
  professionalName: string;
  professionalRole: string;
  professionalField: string;
  timeZone: string;
  pricePerHour: number;
  slots: BookingSlot[];
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
}

export default function BookingSessionPopup({
  isOpen,
  onClose,
  onConfirm,
  professionalName,
  professionalRole,
  professionalField,
  timeZone,
  pricePerHour,
  slots,
  isSubmitting,
  errorMessage,
  successMessage,
}: BookingSessionPopupProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");


  const groupedSlots = useMemo(() => {
    return slots.reduce<Record<string, BookingSlot[]>>((acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {});
  }, [slots]);

  const sortedDays = useMemo(
    () => DAY_ORDER.filter((day) => groupedSlots[day]),
    [groupedSlots]
  );

  if (!isOpen) return null;

  const canSubmit = Boolean(selectedSlotId) && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-emerald-500/15 bg-[rgba(7,35,26,0.95)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Book a Session</h2>
            <p className="mt-1 text-sm text-white/70">Select your preferred time slot and send a booking request.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border border-emerald-500/10 bg-[rgba(2,44,34,0.55)] p-4 text-sm text-white/85 sm:grid-cols-2">
          <p className="inline-flex items-center gap-2"><FaUser className="text-emerald-400" /> {professionalName}</p>
          <p>{professionalRole}</p>
          <p><span className="text-white/60">Field:</span> {professionalField}</p>
          <p><span className="text-white/60">Rate:</span> Rs.{pricePerHour}/hr</p>
          <p className="sm:col-span-2"><span className="text-white/60">Time zone:</span> {timeZone}</p>
        </div>

        <div className="mt-5 rounded-xl border border-emerald-500/10 bg-[rgba(2,44,34,0.35)] p-4">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <FaCalendarAlt /> Available Time Slots
          </p>

          {sortedDays.length === 0 ? (
            <p className="text-sm text-white/70">No available slots at the moment. Please try another professional or check back later.</p>
          ) : (
            <div className="space-y-4">
              {sortedDays.map((day) => (
                <div key={day}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/70">{day}</p>
                  <div className="flex flex-wrap gap-2">
                    {groupedSlots[day].map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-400/20 text-white"
                              : "border-emerald-500/15 bg-[rgba(2,44,34,0.45)] text-[#9ec0b8] hover:bg-emerald-400/10"
                          }`}
                        >
                          <FaClock className="text-xs" />
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{successMessage}</p>
        )}

        <button
          type="button"
          onClick={() => onConfirm(selectedSlotId)}
          disabled={!canSubmit}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="animate-spin" /> Sending Request...
            </>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </div>
    </div>
  );
}

