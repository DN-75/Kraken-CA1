import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { supabase as adminSupabase, createSupabaseServerClient } from "@/lib/supabaseServer";

type FinalizePaymentResult = {
  booking_id: string;
  time_slot_id: string;
  professional_profile_id: string;
  already_paid: boolean;
};

type PaymentRouteError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

type BookingPaymentRecord = {
  id: string;
  user_profile_id: string;
  professional_profile_id: string;
  time_slot_id: string;
  status: string;
  is_paid: boolean;
};

type TimeSlotPaymentRecord = {
  id: string;
  is_booked: boolean;
};

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

function getPaymentErrorMessage(error: PaymentRouteError | null): { status: number; error: string } {
  const message = error?.message ?? "UNKNOWN_PAYMENT_ERROR";

  if (message.includes("BOOKING_NOT_FOUND")) {
    return { status: 404, error: "Booking not found" };
  }

  if (message.includes("FORBIDDEN")) {
    return { status: 403, error: "Forbidden" };
  }

  if (message.includes("ONLY_APPROVED_BOOKINGS_CAN_BE_PAID")) {
    return { status: 400, error: "Only approved bookings can be paid" };
  }

  if (message.includes("TIME_SLOT_NOT_FOUND")) {
    return { status: 404, error: "Time slot not found" };
  }

  if (message.includes("TIME_SLOT_ALREADY_BOOKED")) {
    return {
      status: 409,
      error: "This time slot is no longer available. Another user has already completed payment.",
    };
  }

  return { status: 500, error: "Failed to finalize payment" };
}

function isMissingFinalizePaymentRpc(error: PaymentRouteError | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    message.includes("finalize_booking_payment") &&
    (
      message.includes("could not find the function") ||
      message.includes("schema cache") ||
      message.includes("does not exist")
    )
  );
}

function isSlotConflictError(error: PaymentRouteError | null): boolean {
  const message = error?.message ?? "";
  return error?.code === "23505" || message.includes("unique_paid_slot_booking");
}

async function finalizePaymentWithoutRpc(
  bookingId: string,
  userProfileId: string,
): Promise<{ data: FinalizePaymentResult | null; error: PaymentRouteError | null }> {
  const { data: booking, error: bookingError } = await adminSupabase
    .from("bookings")
    .select("id, user_profile_id, professional_profile_id, time_slot_id, status, is_paid")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    return { data: null, error: bookingError };
  }

  const bookingRecord = booking as BookingPaymentRecord | null;

  if (!bookingRecord) {
    return { data: null, error: { message: "BOOKING_NOT_FOUND" } };
  }

  if (bookingRecord.user_profile_id !== userProfileId) {
    return { data: null, error: { message: "FORBIDDEN" } };
  }

  if (bookingRecord.status !== "approved") {
    return { data: null, error: { message: "ONLY_APPROVED_BOOKINGS_CAN_BE_PAID" } };
  }

  const { data: slot, error: slotError } = await adminSupabase
    .from("time_slots")
    .select("id, is_booked")
    .eq("id", bookingRecord.time_slot_id)
    .maybeSingle();

  if (slotError) {
    return { data: null, error: slotError };
  }

  const slotRecord = slot as TimeSlotPaymentRecord | null;

  if (!slotRecord) {
    return { data: null, error: { message: "TIME_SLOT_NOT_FOUND" } };
  }

  if (bookingRecord.is_paid) {
    if (!slotRecord.is_booked) {
      const { error: slotUpdateError } = await adminSupabase
        .from("time_slots")
        .update({ is_booked: true })
        .eq("id", bookingRecord.time_slot_id);

      if (slotUpdateError) {
        console.warn("Time slot backfill failed for already-paid booking:", slotUpdateError);
      }
    }

    return {
      data: {
        booking_id: bookingRecord.id,
        time_slot_id: bookingRecord.time_slot_id,
        professional_profile_id: bookingRecord.professional_profile_id,
        already_paid: true,
      },
      error: null,
    };
  }

  if (slotRecord.is_booked) {
    return { data: null, error: { message: "TIME_SLOT_ALREADY_BOOKED" } };
  }

  const { data: updatedBooking, error: updateError } = await adminSupabase
    .from("bookings")
    .update({ is_paid: true })
    .eq("id", bookingRecord.id)
    .eq("user_profile_id", userProfileId)
    .eq("status", "approved")
    .eq("is_paid", false)
    .select("id, professional_profile_id, time_slot_id")
    .maybeSingle();

  if (updateError) {
    if (isSlotConflictError(updateError)) {
      return { data: null, error: { message: "TIME_SLOT_ALREADY_BOOKED" } };
    }

    return { data: null, error: updateError };
  }

  if (!updatedBooking) {
    const { data: latestBooking, error: latestBookingError } = await adminSupabase
      .from("bookings")
      .select("id, professional_profile_id, time_slot_id, is_paid")
      .eq("id", bookingRecord.id)
      .maybeSingle();

    if (latestBookingError) {
      return { data: null, error: latestBookingError };
    }

    if (latestBooking?.is_paid) {
      return {
        data: {
          booking_id: latestBooking.id,
          time_slot_id: latestBooking.time_slot_id,
          professional_profile_id: latestBooking.professional_profile_id,
          already_paid: true,
        },
        error: null,
      };
    }

    return { data: null, error: { message: "FAILED_TO_MARK_BOOKING_PAID" } };
  }

  const { error: slotUpdateError } = await adminSupabase
    .from("time_slots")
    .update({ is_booked: true })
    .eq("id", bookingRecord.time_slot_id);

  if (slotUpdateError) {
    console.warn("Time slot update failed after payment finalize:", slotUpdateError);
  }

  return {
    data: {
      booking_id: updatedBooking.id,
      time_slot_id: updatedBooking.time_slot_id,
      professional_profile_id: updatedBooking.professional_profile_id,
      already_paid: false,
    },
    error: null,
  };
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

    let finalizeResult: any = null;
    let finalizeError: any = null;

    const rpcRes = await adminSupabase.rpc(
      "finalize_booking_payment",
      {
        p_booking_id: bookingId,
        p_user_profile_id: userProfile.id,
      },
    );
    finalizeResult = rpcRes.data;
    finalizeError = rpcRes.error;

    if (isMissingFinalizePaymentRpc(finalizeError)) {
      console.warn("finalize_booking_payment RPC unavailable, using API fallback:", finalizeError);

      const fallback = await finalizePaymentWithoutRpc(bookingId, userProfile.id);
      finalizeResult = fallback.data;
      finalizeError = fallback.error;
    }

    if (finalizeError || !finalizeResult) {
      const mapped = getPaymentErrorMessage(finalizeError);
      console.error("finalize_booking_payment error:", finalizeError);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    const result = finalizeResult as FinalizePaymentResult;

    const { data: professionalProfile } = await adminSupabase
      .from("professional_profiles")
      .select("profile_id")
      .eq("id", result.professional_profile_id)
      .maybeSingle();

    revalidatePath(`/professional/${result.professional_profile_id}`);

    if (professionalProfile?.profile_id) {
      revalidatePath(`/professional/${professionalProfile.profile_id}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: result.already_paid
          ? "Booking already paid"
          : "Payment completed. Your session is confirmed.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/bookings/[id]/pay error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
