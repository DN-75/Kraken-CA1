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
  FaLaptopCode,
  FaCalendarAlt,
} from "react-icons/fa";

// 🟢 IMPORTANT: Import your Supabase client here.
// Adjust the path to match your project's setup.
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/* ───────── Types (Matched to Supabase Schema) ───────── */

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

// Formats SQL TIME (e.g. "18:00:00") to "06:00 PM"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProfessional = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetching all related data in a single Supabase query
        const { data, error: fetchError } = await supabase
          .from("professional_profiles")
          .select(`
            id,
            job_title,
            job,
            field,
            price_per_hour,
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
          `)
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Professional not found.");

        setProfessional(data as unknown as Professional);
      } catch (err: any) {
        console.error("Error fetching professional:", err);
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [id]);

  /* ── Derived Data Calculations ── */

  // Safely extract arrays (default to empty if undefined)
  const skills = professional?.professional_skills || [];
  const allTimeSlots = professional?.time_slots || [];
  const reviews = professional?.reviews || [];

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  // Filter out booked slots, then group by day
  const availableSlots = allTimeSlots.filter((slot) => !slot.is_booked);
  const groupedSlots = availableSlots.reduce<Record<string, TimeSlot[]>>(
    (acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
      acc[slot.day_of_week].push(slot);
      return acc;
    },
    {}
  );
  
  // Sort days logically based on DAY_ORDER
  const sortedDays = DAY_ORDER.filter((d) => groupedSlots[d]);

  /* ── Loading / Error States ── */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1c3226] via-[#3d6c53] to-[#15271d] flex items-center justify-center">
        <div className="animate-pulse text-[#467f61] text-xl font-medium drop-shadow-md">
          Loading profile…
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1c3226] via-[#3d6c53] to-[#15271d] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-xl drop-shadow-md">
          {error ?? "Profile not found."}
        </p>
        <Link href="/" className="text-white hover:text-gray-200 transition-colors drop-shadow-md">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const profile = professional.profiles;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c3226] via-[#3d6c53] to-[#15271d] text-white selection:bg-[#467f61] selection:text-white">
      
      {/* ─── Main Content ─── */}
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 relative z-10">
        
        {/* ── Profile Hero Card ── */}
        <section className="rounded-2xl border border-[#234535]/50 bg-[#122b20]/60 backdrop-blur-xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          {profile.profile_photo ? (
            <img
              src={profile.profile_photo}
              alt={profile.name}
              className="h-36 w-36 rounded-2xl object-cover flex-shrink-0 shadow-lg border border-[#234535]"
            />
          ) : (
            <div className="h-36 w-36 rounded-2xl bg-[#0a1812]/80 border border-[#234535] flex items-center justify-center text-4xl font-bold text-[#467f61] flex-shrink-0 shadow-inner">
              {getInitials(profile.name)}
            </div>
          )}

          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">{profile.name}</h1>
            <p className="text-[#61c589] font-medium text-lg drop-shadow-sm">
              {professional.job_title ?? professional.field}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              {avgRating && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#234535]/80 bg-[#0a1812]/80 px-4 py-1.5 text-sm font-medium text-[#a3c4b2] shadow-inner">
                  <FaStar className="text-yellow-400 drop-shadow-sm" /> {avgRating} Stars
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#234535]/80 bg-[#0a1812]/80 px-4 py-1.5 text-sm font-medium text-[#a3c4b2] shadow-inner">
                <FaDollarSign className="text-[#61c589] drop-shadow-sm" /> 
                {professional.price_per_hour}/hr
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 self-center md:mt-4">
            <button className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-[#467f61] hover:bg-[#38664e] transition-all px-8 py-3.5 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgba(70,127,97,0.4)] w-full md:w-auto">
              <FaCalendarAlt /> Book Session
            </button>
          </div>
        </section>

        {/* ── Bio ── */}
        {profile.bio && (
          <section className="rounded-2xl border border-[#234535]/50 bg-[#122b20]/60 backdrop-blur-xl shadow-xl p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4 drop-shadow-sm">
              <FaUser className="text-[#467f61]" /> Bio
            </h2>
            <p className="text-[#a3c4b2] leading-relaxed text-sm md:text-base">{profile.bio}</p>
          </section>
        )}

        {/* ── Skills & Availability Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <section className="rounded-2xl border border-[#234535]/50 bg-[#122b20]/60 backdrop-blur-xl shadow-xl p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-5 drop-shadow-sm">
              <FaLaptopCode className="text-[#467f61]" /> Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.length > 0 ? (
                skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[#234535]/80 bg-[#0a1812]/80 px-4 py-2 text-sm text-[#a3c4b2] shadow-inner"
                  >
                    {s.skill === "Other" ? s.skill_other_label : s.skill}
                  </span>
                ))
              ) : (
                <p className="text-[#a3c4b2] text-sm">No skills listed.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#234535]/50 bg-[#122b20]/60 backdrop-blur-xl shadow-xl p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-5 drop-shadow-sm">
              <FaClock className="text-[#467f61]" /> Availability
            </h2>

            {sortedDays.length === 0 ? (
              <p className="text-[#a3c4b2] text-sm">No available slots right now.</p>
            ) : (
              <div className="space-y-5">
                {sortedDays.map((day) => (
                  <div key={day}>
                    <p className="text-[#61c589] text-xs uppercase tracking-wider font-bold mb-2 drop-shadow-sm">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupedSlots[day].map((slot) => (
                        <span
                          key={slot.id}
                          className="rounded-lg border border-[#234535]/80 bg-[#0a1812]/80 px-3 py-1.5 text-sm text-[#a3c4b2] shadow-inner"
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
          <section className="rounded-2xl border border-[#234535]/50 bg-[#122b20]/60 backdrop-blur-xl shadow-xl p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-6 drop-shadow-sm">
              <FaCommentDots className="text-[#467f61]" /> User Reviews
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => {
                const reviewerName = review.user_profiles?.profiles?.name ?? "Anonymous";
                return (
                  <div
                    key={review.id}
                    className="rounded-xl border border-[#234535]/80 bg-[#0a1812]/60 shadow-inner p-5 space-y-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      {review.user_profiles?.profiles?.profile_photo ? (
                        <img
                          src={review.user_profiles.profiles.profile_photo}
                          alt={reviewerName}
                          className="h-10 w-10 rounded-full object-cover border border-[#234535]"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#122b20] border border-[#234535] text-sm font-bold text-[#a3c4b2]">
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
                              className={i < review.rating ? "text-yellow-400" : "text-[#234535]"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-[#a3c4b2] text-sm leading-relaxed">
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