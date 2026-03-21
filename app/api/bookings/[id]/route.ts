import { NextRequest, NextResponse } from "next/server";
import { supabase as adminSupabase, createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

type Nullable<T> = T | null;

type TimeSlotShape = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

type ProfessionalShape = {
  id: string;
  job_title: string | null;
  price_per_hour: number | null;
  profiles: {
    name: string | null;
    profile_photo: string | null;
    bio: string | null;
  } | null;
};

const updateBookingSchema = z.object({
  action: z.enum(["cancel"]),
});

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : null;

  if (bearerToken) {
    return bearerToken;
  }

  return req.cookies.get("ec_access_token")?.value ?? null;
}

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: bookingId } = await params;
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(accessToken);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data: userProfile, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        is_paid,
        time_slot_id,
        user_profile_id
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json(
        { error: "You are not authorized to modify this booking" },
        { status: 403 },
      );
    }

    if (booking.status !== "pending") {
      const messages: Record<string, string> = {
        approved: "This booking has already been approved. Contact the professional to cancel.",
        completed: "This session has already been completed.",
        rejected: "This booking has already been rejected.",
        cancelled: "This booking is already cancelled.",
      };

      return NextResponse.json(
        { error: messages[booking.status] ?? "This booking cannot be cancelled" },
        { status: 400 },
      );
    }

    const { error: cancelError } = await adminSupabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("status", "pending");

    if (cancelError) {
      console.error("Booking cancel error:", cancelError);
      return NextResponse.json(
        { error: "Failed to cancel booking. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking_id: bookingId,
        message: "Booking cancelled successfully.",
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Unexpected error in PATCH /api/bookings/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: bookingId } = await params;
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(accessToken);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        is_paid,
        payment_link,
        zoom_link,
        created_at,
        updated_at,
        user_profile_id,
        time_slot_id,
        professional_profile_id,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        professional_profiles (
          id,
          job_title,
          price_per_hour,
          profiles (
            name,
            profile_photo,
            bio
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this booking" },
        { status: 403 },
      );
    }

    const bookingRecord = booking as unknown as Record<string, unknown> & {
      time_slots?: TimeSlotShape | TimeSlotShape[] | null;
      professional_profiles?: ProfessionalShape | ProfessionalShape[] | null;
      time_slot_id?: string | null;
      professional_profile_id?: string | null;
    };

    const bookingWithFallbacks: Record<string, unknown> & {
      time_slots: Nullable<TimeSlotShape>;
      professional_profiles: Nullable<ProfessionalShape>;
    } = {
      ...bookingRecord,
      time_slots: normalizeSingle(bookingRecord.time_slots),
      professional_profiles: normalizeSingle(bookingRecord.professional_profiles),
    };

    if (!bookingWithFallbacks.time_slots && bookingRecord.time_slot_id) {
      const { data: slotData } = await adminSupabase
        .from("time_slots")
        .select("id, day_of_week, start_time, end_time")
        .eq("id", bookingRecord.time_slot_id)
        .single();

      bookingWithFallbacks.time_slots = slotData as Nullable<TimeSlotShape>;
    }

    if (!bookingWithFallbacks.professional_profiles && bookingRecord.professional_profile_id) {
      const { data: proData } = await adminSupabase
        .from("professional_profiles")
        .select(`
          id,
          job_title,
          price_per_hour,
          profiles (
            name,
            profile_photo,
            bio
          )
        `)
        .eq("id", bookingRecord.professional_profile_id)
        .single();

      if (proData) {
        const profileRef = (
          proData as {
            profiles?: ProfessionalShape["profiles"] | ProfessionalShape["profiles"][] | null;
          }
        ).profiles;

        bookingWithFallbacks.professional_profiles = {
          ...(proData as Omit<ProfessionalShape, "profiles">),
          profiles: normalizeSingle(profileRef),
        };
      }
    }

    if (bookingWithFallbacks.professional_profiles) {
      bookingWithFallbacks.professional_profiles = {
        ...bookingWithFallbacks.professional_profiles,
        profiles: normalizeSingle(bookingWithFallbacks.professional_profiles.profiles),
      };
    }

    return NextResponse.json({ booking: bookingWithFallbacks }, { status: 200 });
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/bookings/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
