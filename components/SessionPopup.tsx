"use client";

import { useState } from "react";
import Image from "next/image";
import { MdContentCopy, MdCheck } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";

const DEFAULT_MOCK_ZOOM_LINK = "https://zoom.us/j/12345678901?pwd=mockSessionLink";

interface SessionPopupProps {
  professionalName: string;
  professionalRole: string;
  profilePhotoUrl?: string | null;
  sessionDate: string;
  sessionTime: string;
  sessionTimeZone: string;
  zoomLink: string;
  onJoinClick?: () => void;
  onClose?: () => void;
}

export default function SessionPopup({
  professionalName,
  professionalRole,
  profilePhotoUrl,
  sessionDate,
  sessionTime,
  sessionTimeZone,
  zoomLink,
  onJoinClick,
  onClose,
}: SessionPopupProps) {
  const [copied, setCopied] = useState(false);
  const effectiveZoomLink = zoomLink?.trim() ? zoomLink : DEFAULT_MOCK_ZOOM_LINK;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveZoomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinZoom = () => {
    if (onJoinClick) {
      onJoinClick();
    } else {
      window.open(effectiveZoomLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card Container */}
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-[rgba(6,60,40,0.7)] to-[rgba(2,28,20,0.8)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <h2 className="mb-6 text-xl font-bold text-white tracking-tight">
          Your Session Details
        </h2>

        {/* Professional Info */}
        <div className="mb-6 flex items-start gap-4">
          {/* Avatar Circle */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
            {profilePhotoUrl ? (
              <Image
                src={profilePhotoUrl}
                alt={professionalName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white">
                {professionalName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Professional Details */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {professionalName}
            </p>
            <p className="text-xs text-white/60">{professionalRole}</p>
          </div>
        </div>

        {/* Session Time */}
        <div className="mb-6 rounded-lg bg-white/5 p-3.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Session Time
          </p>
          <p className="text-sm text-white/90">
            {sessionDate} • {sessionTime} {sessionTimeZone}
          </p>
        </div>

        {/* Zoom Link Section */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Zoom Link
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            <input
              type="text"
              readOnly
              value={effectiveZoomLink}
              className="flex-1 bg-transparent text-xs text-white/80 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className="flex-shrink-0 rounded-md bg-emerald-500/20 p-2 text-emerald-400 transition-all hover:bg-emerald-500/30"
              title="Copy link"
            >
              {copied ? (
                <MdCheck size={16} />
              ) : (
                <MdContentCopy size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoinZoom}
          className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-center font-semibold text-white transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-2"
        >
          Join via Zoom
          <FiArrowRight size={18} />
        </button>

        {/* Optional: Cancel/Close - if you want a close button */}
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-white/10 px-6 py-2 font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
