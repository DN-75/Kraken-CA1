import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { supabase as adminSupabase, createSupabaseServerClient } from "@/lib/supabaseServer";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(accessToken);
    const { id: bookingId } = await params;

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
      .select("id, user_profile_id, professional_profile_id, status, is_paid, time_slot_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_profile_id !== userProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved bookings can be paid" },
        { status: 400 },
      );
    }

    if (booking.is_paid) {
      return NextResponse.json(
        { success: true, message: "Booking already paid" },
        { status: 200 },
      );
    }

    const { data: slot, error: slotError } = await supabase
      .from("time_slots")
      .select("id, is_booked")
      .eq("id", booking.time_slot_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Time slot not found" }, { status: 404 });
    }

    if (slot.is_booked) {
      return NextResponse.json(
        {
          error: "This time slot is no longer available. Another user has already completed payment.",
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ is_paid: true })
      .eq("id", bookingId);

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error: "This time slot is no longer available. Another user has already completed payment.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "Failed to mark payment" }, { status: 500 });
    }

    // Explicitly mark the slot as booked as an immediate backup to the DB trigger.
    const { data: updatedSlot, error: slotUpdateError } = await adminSupabase
      .from("time_slots")
      .update({ is_booked: true })
      .eq("id", booking.time_slot_id)
      .select("id, is_booked")
      .single();

    if (slotUpdateError) {
      console.error("Failed to mark paid slot as booked:", slotUpdateError);

      await supabase
        .from("bookings")
        .update({ is_paid: false })
        .eq("id", bookingId);

      return NextResponse.json(
        { error: "Payment could not be finalized because the time slot was not updated." },
        { status: 500 },
      );
    }

    if (!updatedSlot?.is_booked) {
      console.error("Paid slot update returned without setting is_booked=true:", updatedSlot);

      await supabase
        .from("bookings")
        .update({ is_paid: false })
        .eq("id", bookingId);

      return NextResponse.json(
        { error: "Payment could not be finalized because the time slot remained available." },
        { status: 500 },
      );
    }

    const { data: professionalProfile } = await adminSupabase
      .from("professional_profiles")
      .select("profile_id")
      .eq("id", booking.professional_profile_id)
      .maybeSingle();

    revalidatePath(`/professional/${booking.professional_profile_id}`);

    if (professionalProfile?.profile_id) {
      revalidatePath(`/professional/${professionalProfile.profile_id}`);
    }

    return NextResponse.json(
      { success: true, message: "Payment completed. Your session is confirmed." },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/bookings/[id]/pay error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
