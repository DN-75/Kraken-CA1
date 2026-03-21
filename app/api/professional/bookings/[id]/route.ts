import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email/sendEmail";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["approve", "reject"]),
  zoom_link: z.string().url().optional(),
  payment_link: z.string().url().optional(),
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

function normalizeSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

type BookingSlotRef = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

type BookingUserProfileRef = {
  id: string;
  profile_id: string | null;
  profiles:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { id: bookingId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, zoom_link, payment_link } = parsed.data;

    const { data: callerProfile, error: callerError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerError || !callerProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (callerProfile.role !== "professional") {
      return NextResponse.json(
        { error: "Only professionals can approve or reject bookings" },
        { status: 403 },
      );
    }

    const { data: proProfile, error: proProfileError } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (proProfileError || !proProfile) {
      return NextResponse.json(
        { error: "Professional profile not found" },
        { status: 404 },
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        is_paid,
        user_profile_id,
        professional_profile_id,
        time_slot_id,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        user_profiles (
          id,
          profile_id,
          profiles (
            name
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.professional_profile_id !== proProfile.id) {
      return NextResponse.json(
        { error: "You are not authorized to manage this booking" },
        { status: 403 },
      );
    }

    if (booking.status !== "pending") {
      const messages: Record<string, string> = {
        approved: "This booking has already been approved.",
        rejected: "This booking has already been rejected.",
        cancelled: "This booking was cancelled by the user.",
        completed: "This session has already been completed.",
      };

      return NextResponse.json(
        { error: messages[booking.status] ?? "This booking cannot be modified" },
        { status: 400 },
      );
    }

    const normalizedUserProfile = normalizeSingle(
      booking.user_profiles as BookingUserProfileRef | BookingUserProfileRef[] | null,
    );
    const normalizedTimeSlot = normalizeSingle(
      booking.time_slots as BookingSlotRef | BookingSlotRef[] | null,
    );

    const userProfileId = normalizedUserProfile?.profile_id;

    const { data: userEmailData } = userProfileId
      ? await supabase
          .from("profiles_with_email")
          .select("email, name")
          .eq("id", userProfileId)
          .single()
      : { data: null };

    const { data: proEmailData } = await supabase
      .from("profiles_with_email")
      .select("name")
      .eq("id", user.id)
      .single();

    if (action === "approve") {
      const { data: slotState, error: slotStateError } = await supabase
        .from("time_slots")
        .select("id, is_booked")
        .eq("id", booking.time_slot_id)
        .single();

      if (slotStateError || !slotState) {
        return NextResponse.json({ error: "Time slot not found" }, { status: 404 });
      }

      if (slotState.is_booked) {
        return NextResponse.json(
          {
            error: "This time slot is no longer available because another user has already paid for it.",
          },
          { status: 409 },
        );
      }

      const generatedPaymentLink =
        payment_link ?? `${process.env.NEXT_PUBLIC_SITE_URL}/payment/${bookingId}`;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "approved",
          payment_link: generatedPaymentLink,
          zoom_link: zoom_link ?? null,
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Approve update error:", updateError);
        return NextResponse.json(
          { error: "Failed to approve booking. Please try again." },
          { status: 500 },
        );
      }

      if (userEmailData?.email && normalizedTimeSlot) {
        sendApprovalEmail({
          to: userEmailData.email,
          userName: userEmailData.name ?? "there",
          professionalName: proEmailData?.name ?? "Your expert",
          day: normalizedTimeSlot.day_of_week,
          startTime: normalizedTimeSlot.start_time,
          endTime: normalizedTimeSlot.end_time,
          paymentLink: generatedPaymentLink,
          bookingId,
        }).catch((err) => console.error("Approval email failed (non-critical):", err));
      }

      if (userEmailData?.email) {
        await supabase.from("email_logs").insert({
          recipient: userEmailData.email,
          subject: "Your booking has been approved",
          related_id: bookingId,
          type: "booking_approved",
        });
      }

      return NextResponse.json(
        {
          success: true,
          action: "approved",
          booking_id: bookingId,
          payment_link: generatedPaymentLink,
          message: "Booking approved. Payment link sent to user.",
        },
        { status: 200 },
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "rejected" })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Reject update error:", updateError);
      return NextResponse.json(
        { error: "Failed to reject booking. Please try again." },
        { status: 500 },
      );
    }

    if (userEmailData?.email && normalizedTimeSlot) {
      sendRejectionEmail({
        to: userEmailData.email,
        userName: userEmailData.name ?? "there",
        professionalName: proEmailData?.name ?? "The professional",
        day: normalizedTimeSlot.day_of_week,
        startTime: normalizedTimeSlot.start_time,
        bookingId,
      }).catch((err) => console.error("Rejection email failed (non-critical):", err));
    }

    if (userEmailData?.email) {
      await supabase.from("email_logs").insert({
        recipient: userEmailData.email,
        subject: "Your booking request was not accepted",
        related_id: bookingId,
        type: "booking_rejected",
      });
    }

    return NextResponse.json(
      {
        success: true,
        action: "rejected",
        booking_id: bookingId,
        message: "Booking rejected. User has been notified.",
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Unexpected error in PATCH /api/professional/bookings/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { id: bookingId } = await params;

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
      return NextResponse.json(
        { error: "Professional profile not found" },
        { status: 404 },
      );
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
        professional_profile_id,
        time_slots (
          id,
          day_of_week,
          start_time,
          end_time
        ),
        user_profiles (
          id,
          status,
          profiles (
            name,
            profile_photo,
            bio,
            time_zone
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.professional_profile_id !== proProfile.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this booking" },
        { status: 403 },
      );
    }

    return NextResponse.json({ booking }, { status: 200 });
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/professional/bookings/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
