import Link from "next/link";
import { supabase } from "@/lib/supabaseServer";
import ProfessionalProfileClient, {
  type Professional,
  type TimeSlot,
} from "./ProfessionalProfileClient";

const SELECT_QUERY = `
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

async function fetchProfessional(id: string): Promise<{ data: Professional | null; error: string | null }> {
  try {
    let { data, error } = await supabase
      .from("professional_profiles")
      .select(SELECT_QUERY)
      .eq("id", id)
      .maybeSingle();

    if (!data && !error) {
      const fallback = await supabase
        .from("professional_profiles")
        .select(SELECT_QUERY)
        .eq("profile_id", id)
        .maybeSingle();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Professional not found." };
    }

    return { data: data as unknown as Professional, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load profile.",
    };
  }
}

async function fetchAvailableSlots(id: string): Promise<TimeSlot[]> {
  try {
    let { data: professional, error } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();

    if (!professional && !error) {
      const fallback = await supabase
        .from("professional_profiles")
        .select("id")
        .eq("profile_id", id)
        .eq("status", "approved")
        .maybeSingle();

      professional = fallback.data;
      error = fallback.error;
    }

    if (error || !professional) {
      return [];
    }

    const { data: slots, error: slotsError } = await supabase
      .from("time_slots")
      .select("id, day_of_week, start_time, end_time, is_booked")
      .eq("professional_profile_id", professional.id)
      .eq("is_booked", false)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (slotsError) {
      return [];
    }

    return (slots ?? []) as TimeSlot[];
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfessionalProfilePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
        }}
      >
        <p className="text-red-400 text-xl drop-shadow-md">No professional ID provided</p>
        <Link href="/" className="text-white hover:text-gray-200 transition-colors drop-shadow-md">
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  const [{ data: professional, error }, initialAvailableSlots] = await Promise.all([
    fetchProfessional(id),
    fetchAvailableSlots(id),
  ]);

  if (error || !professional) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
        }}
      >
        <p className="text-red-400 text-xl drop-shadow-md">{error ?? "Profile not found."}</p>
        <Link href="/" className="text-white hover:text-gray-200 transition-colors drop-shadow-md">
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  return (
    <ProfessionalProfileClient
      professional={professional}
      routeId={id}
      initialAvailableSlots={initialAvailableSlots}
    />
  );
}
