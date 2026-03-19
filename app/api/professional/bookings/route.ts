import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type TimeSlotRef = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

type ProfileRef = {
  name: string | null;
  profile_photo: string | null;
  bio: string | null;
  time_zone: string | null;
};

type UserProfileRef = {
  id: string;
  status: string;
  profile_id: string | null;
  profiles: ProfileRef | ProfileRef[] | null;
};

type BookingRow = {
  id: string;
  status: string;
  is_paid: boolean;
  payment_link: string | null;
  zoom_link: string | null;
  created_at: string;
  updated_at: string;
  professional_profile_id: string;
  user_profile_id: string | null;
  time_slot_id: string | null;
  time_slots: TimeSlotRef | TimeSlotRef[] | null;
  user_profiles: UserProfileRef | UserProfileRef[] | null;
};

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : null;

  if (bearerToken) return bearerToken;
  return req.cookies.get("ec_access_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: proProfile, error: proError } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (proError || !proProfile) {
      return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });
    }

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        is_paid,
        payment_link,
        zoom_link,
        created_at,
        updated_at,
        professional_profile_id,
        user_profile_id,
        time_slot_id,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        user_profiles (
          id,
          status,
          profile_id,
          profiles (
            name,
            profile_photo,
            bio,
            time_zone
          )
        )
      `)
      .eq("professional_profile_id", proProfile.id)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    const rawBookings = (bookingsData ?? []) as BookingRow[];
    const normalizedBookings = await Promise.all(
      rawBookings.map(async (booking) => {
        const normalizedTimeSlot = normalizeSingle(booking.time_slots);
        const normalizedUserProfile = normalizeSingle(booking.user_profiles);
        const normalizedProfile = normalizeSingle(normalizedUserProfile?.profiles);

        let resolvedTimeSlot = normalizedTimeSlot;
        let resolvedUserProfile = normalizedUserProfile;
        let resolvedProfile = normalizedProfile;

        if (!resolvedTimeSlot && booking.time_slot_id) {
          const { data: slotData } = await supabase
            .from("time_slots")
            .select("id, day_of_week, start_time, end_time")
            .eq("id", booking.time_slot_id)
            .single();

          resolvedTimeSlot = (slotData as TimeSlotRef | null) ?? null;
        }

        if (!resolvedUserProfile && booking.user_profile_id) {
          const { data: userProfileData } = await supabase
            .from("user_profiles")
            .select("id, status, profile_id")
            .eq("id", booking.user_profile_id)
            .single();

          resolvedUserProfile =
            (userProfileData as Omit<UserProfileRef, "profiles"> | null)
              ? { ...(userProfileData as Omit<UserProfileRef, "profiles">), profiles: null }
              : null;
        }

        if (!resolvedProfile && resolvedUserProfile?.profile_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, profile_photo, bio, time_zone")
            .eq("id", resolvedUserProfile.profile_id)
            .single();

          resolvedProfile = (profileData as ProfileRef | null) ?? null;
        }

        return {
          ...booking,
          time_slots: resolvedTimeSlot,
          user_profiles: resolvedUserProfile
            ? {
                ...resolvedUserProfile,
                profiles: resolvedProfile,
              }
            : null,
        };
      }),
    );

    return NextResponse.json({ bookings: normalizedBookings }, { status: 200 });
  } catch (error) {
    console.error("GET /api/professional/bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
