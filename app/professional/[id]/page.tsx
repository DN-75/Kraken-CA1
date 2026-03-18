"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FaStar,
  FaUser,
  FaClock,
  FaCommentDots,
  FaDollarSign,
  FaLaptopCode,
  FaCalendarAlt,
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaGlobe,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

/* ───────── Types ───────── */

interface Skill {
  skill: string;
  skill_other_label: string | null;
}

interface TimeSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
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

interface Professional {
  id: string;
  job_title: string | null;
  job: string | null;
  field: string;
  price_per_hour: number;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  portfolio: string | null;
  profiles: {
    name: string;
    profile_photo: string | null;
    bio: string | null;
    time_zone: string;
  };
  professional_skills: Skill[];
  time_slots: TimeSlot[];
  reviews: Review[];
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProfessionalProfilePage({ params }: PageProps) {
  // Use React.use() to unwrap the params promise (Next.js 15+ pattern)
  const { id } = use(params);

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Prevent double fetching and ensure id is available
    if (!id || hasFetched) return;

    const fetchProfessional = async () => {
      try {
        setLoading(true);
        setError(null);

        const selectQuery = `
          id,
          job_title,
          job,
          field,
          price_per_hour,
          linkedin,
          instagram,
          facebook,
          portfolio,
          profiles (
            name,
            profile_photo,
            bio,
            time_zone
          ),
          professional_skills (
            skill,
            skill_other_label
          ),
          time_slots (
            id,
            day_of_week,
            start_time,
            end_time,
            is_booked
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            user_profiles (
              profiles (
                name,
                profile_photo
              )
            )
          )
        `;

        // Try fetching by professional_profiles.id first
        let { data, error: fetchError } = await supabase
          .from("professional_profiles")
          .select(selectQuery)
          .eq("id", id)
          .maybeSingle();

        // If not found by id, try by profile_id (user's auth ID)
        if (!data && !fetchError) {
          const result = await supabase
            .from("professional_profiles")
            .select(selectQuery)
            .eq("profile_id", id)
            .maybeSingle();
          
          data = result.data;
          fetchError = result.error;
        }

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Professional not found.");

        setProfessional(data as unknown as Professional);
        setHasFetched(true);
      } catch (err: any) {
        console.error("Error fetching professional:", err);
        setError(err.message || "Failed to load profile.");
        setHasFetched(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [id, hasFetched]);

  /* ── Derived Data ── */
  const skills = professional?.professional_skills || [];
  const allTimeSlots = professional?.time_slots || [];
  const reviews = professional?.reviews || [];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const availableSlots = allTimeSlots.filter((slot) => !slot.is_booked);
  const groupedSlots = availableSlots.reduce<Record<string, TimeSlot[]>>(
    (acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
      acc[slot.day_of_week].push(slot);
      return acc;
    },
    {}
  );
  const sortedDays = DAY_ORDER.filter((d) => groupedSlots[d]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
        }}
      >
        <div className="animate-pulse text-emerald-400 text-xl font-medium drop-shadow-md">
          Loading profile...
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error || !professional) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
        }}
      >
        <p className="text-red-400 text-xl drop-shadow-md">
          {error ?? "Profile not found."}
        </p>
        <Link href="/" className="text-white hover:text-gray-200 transition-colors drop-shadow-md">
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  // Handle null profiles (RLS may block access to profiles table)
  const profile = professional.profiles ?? {
    name: "Unknown",
    profile_photo: null,
    bio: null,
    time_zone: "Asia/Colombo"
  };

  /* ── Render ── */
  return (
    <div
      className="min-h-screen text-white selection:bg-emerald-400 selection:text-white"
      style={{
        background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
      }}
    >
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 relative z-10">
        
        {/* ── Profile Hero Card ── */}
        <section className="w-full rounded-2xl border border-emerald-500/15 bg-[rgba(17,49,39,0.55)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-2xl sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {profile.profile_photo ? (
            <Image
              src={profile.profile_photo}
              alt={profile.name}
              height={145}
              width={145}
              className=" rounded-full object-cover w-[145px] h-[145px] overflow-hidden border-3 border-green-500 shadow-lg"
            />
          ) : (
            <div className="h-36 w-36 rounded-full bg-[rgba(28,144,74,0.45)] border border-emerald-500/15 flex items-center justify-center text-4xl font-bold text-emerald-400 flex-shrink-0 shadow-inner">
              {getInitials(profile.name)}
            </div>
          )}

          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">{profile.name}</h1>
            <p className="text-emerald-400 font-medium text-lg drop-shadow-sm">
              {professional.job_title ?? professional.field}
            </p>
            {professional.job && (
              <p className="text-white/60 text-sm">
                {professional.job}
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              {avgRating && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-[rgba(2,44,34,0.45)] px-4 py-1.5 text-sm font-medium text-[#649c8c] shadow-inner">
                  <FaStar className="text-yellow-400 drop-shadow-sm" /> {avgRating} Stars
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-green-800 px-8 py-1.5 text-lg font-bold text-white shadow-inner">
                Rs.{professional.price_per_hour}/hr
              </span>
            </div>

            {/* Social Links */}
            {(professional.linkedin || professional.instagram || professional.facebook || professional.portfolio) && (
              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                {professional.linkedin && (
                  <a
                    href={professional.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-[rgba(2,44,34,0.45)] px-3 py-1.5 text-sm text-[#649c8c] hover:bg-emerald-400/20 transition-colors"
                  >
                    <FaLinkedin className="text-blue-400" />
                  </a>
                )}
                {professional.instagram && (
                  <a
                    href={professional.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-[rgba(2,44,34,0.45)] px-3 py-1.5 text-sm text-[#649c8c] hover:bg-emerald-400/20 transition-colors"
                  >
                    <FaInstagram className="text-pink-400" />
                  </a>
                )}
                {professional.facebook && (
                  <a
                    href={professional.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-[rgba(2,44,34,0.45)] px-3 py-1.5 text-sm text-[#649c8c] hover:bg-emerald-400/20 transition-colors"
                  >
                    <FaFacebook className="text-blue-500" />
                  </a>
                )}
                {professional.portfolio && (
                  <a
                    href={professional.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-[rgba(2,44,34,0.45)] px-3 py-1.5 text-sm text-[#649c8c] hover:bg-emerald-400/20 transition-colors"
                  >
                    <FaGlobe className="text-emerald-400" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 self-center md:mt-4">
            <button className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-emerald-400 to-emerald-600 py-3 px-8 text-white font-semibold text-sm shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(16,185,129,0.45)] w-full md:w-auto">
              <FaCalendarAlt /> Book Session
            </button>
          </div>
        </section>

        {/* ── Bio ── */}
        {profile.bio && (
          <section className="w-full rounded-2xl border border-emerald-500/15 bg-[rgba(17,49,39,0.55)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-2xl sm:p-8 md:p-10">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4 drop-shadow-sm">
              <FaUser className="text-emerald-400" /> Bio
            </h2>
            <p className="text-white/90 leading-relaxed text-sm md:text-base">{profile.bio}</p>
          </section>
        )}

        {/* ── Skills & Availability ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <section className="w-full rounded-2xl border border-emerald-500/15 bg-[rgba(17,49,39,0.55)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-2xl sm:p-8 md:p-10">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-5 drop-shadow-sm">
              <FaLaptopCode className="text-emerald-400" /> Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.length > 0 ? (
                skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-emerald-500/15 bg-emerald-400/10 px-4 py-2 text-sm text-[#649c8c] shadow-sm transition-colors hover:bg-emerald-400/20 cursor-default"
                  >
                    {s.skill === "Other" ? s.skill_other_label : s.skill}
                  </span>
                ))
              ) : (
                <p className="text-[#649c8c] text-sm">No skills listed.</p>
              )}
            </div>
          </section>

          <section className="w-full rounded-2xl border border-emerald-500/15 bg-[rgba(17,49,39,0.55)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-2xl sm:p-8 md:p-10">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-5 drop-shadow-sm">
              <FaClock className="text-emerald-400" /> Availability
            </h2>

            {sortedDays.length === 0 ? (
              <p className="text-[#649c8c] text-sm">No available slots right now.</p>
            ) : (
              <div className="space-y-5">
                {sortedDays.map((day) => (
                  <div key={day}>
                    <p className="text-emerald-400 text-xs uppercase tracking-wider font-bold mb-2 drop-shadow-sm">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupedSlots[day].map((slot) => (
                        <span
                          key={slot.id}
                          className="rounded-lg border border-emerald-500/15 bg-[rgba(2,44,34,0.45)] px-3 py-1.5 text-sm text-[#649c8c] shadow-sm"
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

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <section className="w-full rounded-2xl border border-emerald-500/15 bg-[rgba(17,49,39,0.55)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_40px_rgba(16,185,129,0.05)] backdrop-blur-2xl sm:p-8 md:p-10">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-6 drop-shadow-sm">
              <FaCommentDots className="text-emerald-400" /> User Reviews ({reviews.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => {
                const reviewerName = review.user_profiles?.profiles?.name ?? "Anonymous";
                return (
                  <div
                    key={review.id}
                    className="rounded-xl border border-emerald-500/10 bg-[rgba(2,44,34,0.45)] shadow-inner p-5 space-y-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      {review.user_profiles?.profiles?.profile_photo ? (
                        <img
                          src={review.user_profiles.profiles.profile_photo}
                          alt={reviewerName}
                          className="h-10 w-10 rounded-full object-cover border border-emerald-500/15"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(17,49,39,0.55)] border border-emerald-500/15 text-sm font-bold text-[#649c8c]">
                          {getInitials(reviewerName)}
                        </span>
                      )}

                      <div>
                        <p className="font-semibold text-white text-sm drop-shadow-sm">
                          {reviewerName}
                        </p>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                              key={i}
                              size={12}
                              className={i < review.rating ? "text-yellow-500" : "text-emerald-500/20"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-white/80 text-sm leading-relaxed">
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
