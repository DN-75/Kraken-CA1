import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

const bookingSchema = z.object({
  time_slot_id: z.string().uuid("Invalid time slot ID"),
  professional_profile_id: z.string().uuid("Invalid professional ID"),
});

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : null;

  if (bearerToken) {
    return bearerToken;
  }

  return req.cookies.get("ec_access_token")?.value ?? null;
}

async function getEligibleUserProfileId(supabase: ReturnType<typeof createSupabaseServerClient>, userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      userProfileId: null,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }

  if (profile.role === "professional") {
    return {
      userProfileId: null,
      response: NextResponse.json(
        { error: "Professional accounts cannot book other professionals." },
        { status: 403 },
      ),
    };
  }

  if (profile.role === "admin") {
    return {
      userProfileId: null,
      response: NextResponse.json(
        { error: "Admin accounts cannot book professionals." },
        { status: 403 },
      ),
    };
  }

  const { data: userProfile, error: userProfileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (userProfileError || !userProfile) {
    return {
      userProfileId: null,
      response: NextResponse.json({ error: "User profile not found" }, { status: 404 }),
    };
  }

  return { userProfileId: userProfile.id, response: null };
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json(
        { error: "You must be logged in to book a session" },
        { status: 401 },
      );
    }

    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to book a session" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { time_slot_id, professional_profile_id } = parsed.data;

    const eligibility = await getEligibleUserProfileId(supabase, user.id);
    if (eligibility.response) {
      return eligibility.response;
    }

    const userProfileId = eligibility.userProfileId!;

    const { data: slot, error: slotError } = await supabase
      .from("time_slots")
      .select("id, is_booked, professional_profile_id")
      .eq("id", time_slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Time slot not found" }, { status: 404 });
    }

    if (slot.professional_profile_id !== professional_profile_id) {
      return NextResponse.json(
        { error: "Time slot does not belong to this professional" },
        { status: 400 },
      );
    }

    if (slot.is_booked) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 },
      );
    }

    const { data: professional, error: proError } = await supabase
      .from("professional_profiles")
      .select(`
        id,
        status,
        profiles (
          name
        )
      `)
      .eq("id", professional_profile_id)
      .single();

    if (proError || !professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    if (professional.status !== "approved") {
      return NextResponse.json(
        { error: "This professional is not available for bookings" },
        { status: 400 },
      );
    }

    const { data: proProfileCheck } = await supabase
      .from("professional_profiles")
      .select("profile_id")
      .eq("id", professional_profile_id)
      .single();

    if (proProfileCheck?.profile_id === user.id) {
      return NextResponse.json(
        { error: "You cannot book your own profile" },
        { status: 400 },
      );
    }

    const { data: existingBookings, error: existingBookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_profile_id", userProfileId)
      .eq("time_slot_id", time_slot_id)
      .in("status", ["pending", "approved"])
      .limit(1);

    if (existingBookingError) {
      console.error("Existing booking lookup error:", existingBookingError);
      return NextResponse.json(
        { error: "Failed to verify your existing requests. Please try again." },
        { status: 500 },
      );
    }

    if ((existingBookings?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "You already have an active request for this time slot" },
        { status: 409 },
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_profile_id: userProfileId,
        professional_profile_id,
        time_slot_id,
        status: "pending",
        is_paid: false,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Booking insert error:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking_id: booking.id,
        message: "Booking request sent successfully",
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error("Unexpected error in POST /api/bookings:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

    const eligibility = await getEligibleUserProfileId(supabase, user.id);
    if (eligibility.response) {
      return eligibility.response;
    }

    const userProfileId = eligibility.userProfileId!;

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        is_paid,
        payment_link,
        zoom_link,
        created_at,
        updated_at,
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
            profile_photo
          )
        )
      `)
      .eq("user_profile_id", userProfileId)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Bookings fetch error:", bookingsError);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }

    const grouped = {
      pending: bookings?.filter((booking) => booking.status === "pending") ?? [],
      approved: bookings?.filter((booking) => booking.status === "approved") ?? [],
      completed: bookings?.filter((booking) => booking.status === "completed") ?? [],
      rejected: bookings?.filter((booking) => booking.status === "rejected") ?? [],
      cancelled: bookings?.filter((booking) => booking.status === "cancelled") ?? [],
    };

    return NextResponse.json(
      {
        bookings: bookings ?? [],
        grouped,
        total: bookings?.length ?? 0,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/bookings:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
