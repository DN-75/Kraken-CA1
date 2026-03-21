import Link from "next/link";
import { supabase } from "@/lib/supabaseServer";
import ProfessionalProfileClient, {
  type Professional,
  type TimeSlot,
} from "./ProfessionalProfileClient";

export const revalidate = 0;

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
    const { data, error } = await supabase
      .from("professional_profiles")
      .select(SELECT_QUERY)
      .eq("status", "approved")
      .or(`id.eq.${id},profile_id.eq.${id}`)
      .maybeSingle();

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

async function fetchAvailableSlots(professionalProfileId: string): Promise<TimeSlot[]> {
  try {
    const { data: slots, error: slotsError } = await supabase
      .from("time_slots")
      .select("id, day_of_week, start_time, end_time, is_booked")
      .eq("professional_profile_id", professionalProfileId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (slotsError) {
      return [];
    }

    const { data: paidBookings, error: paidBookingsError } = await supabase
      .from("bookings")
      .select("time_slot_id")
      .eq("professional_profile_id", professionalProfileId)
      .eq("is_paid", true)
      .in("status", ["approved", "completed"]);

    if (paidBookingsError) {
      return [];
    }

    const paidSlotIds = new Set((paidBookings ?? []).map((booking) => booking.time_slot_id));
    return ((slots ?? []).filter((slot) => !slot.is_booked && !paidSlotIds.has(slot.id))) as TimeSlot[];
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function ProfilePageState({ message }: { message: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{
        background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
      }}
    >
      <p className="text-red-400 text-xl drop-shadow-md">{message}</p>
      <Link href="/" className="text-white hover:text-gray-200 transition-colors drop-shadow-md">
        &larr; Back to Home
      </Link>
    </div>
  );
}

export default async function ProfessionalProfilePage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return <ProfilePageState message="No professional ID provided" />;
  }

  const { data: professional, error } = await fetchProfessional(id);

  if (error || !professional) {
    return <ProfilePageState message={error ?? "Profile not found."} />;
  }

  const initialAvailableSlots = await fetchAvailableSlots(professional.id);

  return (
    <ProfessionalProfileClient
      professional={professional}
      routeId={id}
      initialAvailableSlots={initialAvailableSlots}
    />
  );
}
