"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FaStar,
  FaUser,
  FaClock,
  FaCommentDots,
  FaDollarSign,
  FaSearch,
  FaHome,
  FaInfoCircle,
  FaEnvelope,
  FaLaptopCode,
  FaCalendarAlt,
} from "react-icons/fa";

/* ───────── Types ───────── */

interface Professional {
  id: string;
  profile_id: string;
  job_title: string | null;
  job: string | null;
  field: string;
  price_per_hour: number;
  profiles: {
    id: string;
    name: string;
    profile_photo: string | null;
    bio: string | null;
    time_zone: string;
  };
}

interface Skill {
  skill: string;
  skill_other_label: string | null;
}

interface TimeSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_profiles: {
    profiles: {
      name: string;
      profile_photo: string | null;
    };
  };
}

/* ───────── Helpers ───────── */

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ───────── Component ───────── */

export default function ProfessionalProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    if (id === "1") {
      setProfessional({
        id: "1",
        profile_id: "1",
        job_title: "Senior Full-Stack Developer",
        job: "TechNova Inc.",
        field: "Software Engineering",
        price_per_hour: 85,
        profiles: {
          id: "1",
          name: "Alex Johnson",
          profile_photo: null,
          bio: "Passionate full-stack developer with 10+ years of experience building scalable web applications. Specializing in React, Next.js, and Node.js. I love mentoring junior developers and helping teams adopt best practices.",
          time_zone: "America/New_York",
        },
      });

      setSkills([
        { skill: "React", skill_other_label: null },
        { skill: "Next.js", skill_other_label: null },
        { skill: "TypeScript", skill_other_label: null },
        { skill: "Node.js", skill_other_label: null },
        { skill: "PostgreSQL", skill_other_label: null },
        { skill: "Other", skill_other_label: "Supabase" },
      ]);

      setTimeSlots([
        { id: "ts1", day_of_week: "Monday", start_time: "09:00:00", end_time: "10:00:00" },
        { id: "ts2", day_of_week: "Monday", start_time: "10:00:00", end_time: "11:00:00" },
        { id: "ts3", day_of_week: "Wednesday", start_time: "14:00:00", end_time: "15:00:00" },
        { id: "ts4", day_of_week: "Wednesday", start_time: "15:00:00", end_time: "16:00:00" },
        { id: "ts5", day_of_week: "Friday", start_time: "11:00:00", end_time: "12:00:00" },
      ]);

      setReviews([
        {
          id: "r1",
          rating: 5,
          comment: "Alex was incredibly helpful and explained complex concepts in a way that was easy to understand. Highly recommend!",
          created_at: "2026-02-20T10:00:00Z",
          user_profiles: { profiles: { name: "Sarah Miller", profile_photo: null } },
        },
        {
          id: "r2",
          rating: 4,
          comment: "Great session on database optimization. Very knowledgeable and patient.",
          created_at: "2026-01-15T14:30:00Z",
          user_profiles: { profiles: { name: "David Chen", profile_photo: null } },
        },
      ]);
    } else {
      setError("Professional profile not found.");
    }

    setLoading(false);
  }, [id]);

  /* Derived */
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const groupedSlots = timeSlots.reduce<Record<string, TimeSlot[]>>(
    (acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
      acc[slot.day_of_week].push(slot);
      return acc;
    },
    {}
  );
  const sortedDays = DAY_ORDER.filter((d) => groupedSlots[d]);

  /* ── Loading / Error ── */

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a5c43] via-[#132d20] to-[#0b1c13] flex items-center justify-center">
        <div className="animate-pulse text-[#558b6e] text-xl font-medium">
          Loading profile…
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a5c43] via-[#132d20] to-[#0b1c13] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-xl">
          {error ?? "Profile not found."}
        </p>
        <Link href="/" className="text-[#83a893] hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const profile = professional.profiles;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a5c43] via-[#132d20] to-[#0b1c13] text-white selection:bg-[#558b6e] selection:text-white">
      
      {/* ─── Navbar ─── */}
      <nav className="bg-transparent pt-6 pb-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#558b6e]">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                 <circle cx="12" cy="6" r="2.5" />
                 <circle cx="6" cy="12" r="2.5" />
                 <circle cx="12" cy="18" r="2.5" />
                 <circle cx="18" cy="12" r="2.5" />
                 <circle cx="12" cy="12" r="2.5" />
              </svg>
            </span>
            <span className="text-white font-bold text-xl tracking-wide">
              ExpertConnect
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-[#83a893] font-medium">
            <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors">
              <FaHome /> Home
            </Link>
            <Link href="#" className="flex items-center gap-2 hover:text-white transition-colors">
              <FaInfoCircle /> About Us
            </Link>
            <Link href="#" className="flex items-center gap-2 hover:text-white transition-colors">
              <FaEnvelope /> Contact Us
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-[#83a893] hover:text-white transition-colors">
              <FaSearch size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#83a893] hidden sm:inline font-medium">
                {profile.name}
              </span>
              {profile.profile_photo ? (
                <img
                  src={profile.profile_photo}
                  alt={profile.name}
                  className="h-10 w-10 rounded-full object-cover bg-[#0d1b14]"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b14] text-xs font-bold text-[#83a893]">
                  {getInitials(profile.name)}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 relative z-10">
        
        {/* ── Profile Hero Card ── */}
        <section className="rounded-2xl border border-[#224030] bg-[#172c21] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-lg">
          {profile.profile_photo ? (
            <img
              src={profile.profile_photo}
              alt={profile.name}
              className="h-40 w-40 rounded-2xl object-cover flex-shrink-0 border border-[#224030]"
            />
          ) : (
            <div className="h-40 w-40 rounded-2xl bg-[#0d1b14] border border-[#224030] flex items-center justify-center text-5xl font-bold text-[#558b6e] flex-shrink-0">
              {getInitials(profile.name)}
            </div>
          )}

          <div className="flex-1 text-center md:text-left space-y-4 pt-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">{profile.name}</h1>
            <p className="text-[#558b6e] font-medium text-lg">
              {professional.job_title ?? professional.field}
            </p>
            {professional.job && (
              <p className="text-[#83a893] text-sm">at {professional.job}</p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              {avgRating && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#0d1b14] px-4 py-2 text-sm font-medium text-[#83a893]">
                  <FaStar className="text-yellow-500" /> {avgRating} Stars
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0d1b14] px-4 py-2 text-sm font-medium text-[#83a893]">
                <FaDollarSign className="text-[#558b6e]" /> 
                {professional.price_per_hour}/hr
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 self-center md:mt-6">
            <button className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[#558b6e] hover:bg-[#43755b] transition-colors px-6 py-3 text-white font-semibold text-sm w-full md:w-auto">
              <FaCalendarAlt /> Book Session
            </button>
          </div>
        </section>

        {/* ── Bio ── */}
        {profile.bio && (
          <section className="rounded-2xl border border-[#224030] bg-[#172c21] p-6 md:p-8 shadow-lg">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-4">
              <FaUser className="text-[#83a893]" /> Bio
            </h2>
            <p className="text-[#83a893] leading-relaxed text-sm md:text-base">{profile.bio}</p>
          </section>
        )}

        {/* ── Skills & Availability Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <section className="rounded-2xl border border-[#224030] bg-[#172c21] p-6 md:p-8 shadow-lg">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6">
              <FaLaptopCode className="text-[#83a893]" /> Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-[#0d1b14] px-4 py-2.5 text-sm text-[#83a893]"
                >
                  {s.skill === "Other" ? s.skill_other_label : s.skill}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#224030] bg-[#172c21] p-6 md:p-8 shadow-lg">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6">
              <FaClock className="text-[#83a893]" /> Availability
            </h2>

            {sortedDays.length === 0 ? (
              <p className="text-[#83a893] text-sm">No available slots right now.</p>
            ) : (
              <div className="space-y-6">
                {sortedDays.map((day) => (
                  <div key={day}>
                    <p className="text-[#558b6e] text-xs uppercase tracking-wider font-bold mb-3">{day}</p>
                    <div className="flex flex-wrap gap-3">
                      {groupedSlots[day].map((slot) => (
                        <span
                          key={slot.id}
                          className="rounded-lg bg-[#0d1b14] px-4 py-2.5 text-sm text-[#83a893]"
                        >
                          {formatTime(slot.start_time)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── User Reviews ── */}
        {reviews.length > 0 && (
          <section className="rounded-2xl border border-[#224030] bg-[#172c21] p-6 md:p-8 shadow-lg">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6">
              <FaCommentDots className="text-[#83a893]" /> User Reviews
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => {
                const reviewerName = review.user_profiles?.profiles?.name ?? "Anonymous";
                return (
                  <div
                    key={review.id}
                    className="rounded-xl bg-[#0d1b14] p-6 space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      {review.user_profiles?.profiles?.profile_photo ? (
                        <img
                          src={review.user_profiles.profiles.profile_photo}
                          alt={reviewerName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#172c21] text-sm font-bold text-[#83a893]">
                          {getInitials(reviewerName)}
                        </span>
                      )}

                      <div>
                        <p className="font-semibold text-white text-base">
                          {reviewerName}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                              key={i}
                              size={14}
                              className={i < review.rating ? "text-yellow-500" : "text-[#224030]"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-[#83a893] text-sm leading-relaxed">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}