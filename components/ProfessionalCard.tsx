"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProfessionalCardData } from "@/hooks/useProProfiles";

interface ProfessionalCardProps {
  professional: ProfessionalCardData;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { id, name, profile_photo, job_title, job, price_per_hour, avg_rating, session_count } = professional;

  // Build display role (job_title at job)
  const displayRole = job_title && job
    ? `${job_title} at ${job}`
    : job_title || job || "Professional";

  // Split name for styling (first name bold, rest normal)
  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)]">
      {/* Profile Image */}
      {profile_photo ? (
        <Image
          src={profile_photo}
          alt={name}
          width={400}
          height={200}
          className="w-full h-[200px] object-cover"
        />
      ) : (
        <div className="w-full h-[200px] bg-gradient-to-br from-[rgba(16,185,129,0.2)] to-[rgba(6,60,40,0.4)] flex items-center justify-center">
          <span className="text-5xl font-bold text-white/60">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Info Section */}
      <div className="p-5 max-sm:p-4">
        <p className="text-[1.05rem] font-bold text-white">
          {firstName}{" "}
          {lastName && <span className="font-normal text-white/60">{lastName}</span>}
        </p>
        <p className="text-xs text-white/45 mt-0.5">{displayRole}</p>
        <p className="text-[0.8rem] text-white/50 mt-1.5">
          <span className="text-yellow-400">★</span>{" "}
          {avg_rating !== null ? `${avg_rating}` : "No ratings"}{" "}
          ({session_count} sessions)
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-3.5 px-5 max-sm:py-3 max-sm:px-4 border-t border-[var(--card-border)]">
        <span className="text-base font-bold text-white">
          Rs.{price_per_hour}/<span className="text-xs font-normal text-white/45">hr</span>
        </span>
        <Link
          href={`/professional/${id}`}
          className="text-[0.8rem] text-[var(--emerald-primary)] hover:text-[var(--emerald-glow)] bg-none border-none cursor-pointer font-semibold transition-colors duration-200"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}
