import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { supabase as adminSupabase, createSupabaseServerClient } from "@/lib/supabaseServer";

type FinalizePaymentResult = {
  booking_id: string;
  time_slot_id: string;
  professional_profile_id: string;
  already_paid: boolean;
};

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

function getPaymentErrorMessage(error: { message?: string } | null): { status: number; error: string } {
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

    const { data: finalizeResult, error: finalizeError } = await adminSupabase.rpc(
      "finalize_booking_payment",
      {
        p_booking_id: bookingId,
        p_user_profile_id: userProfile.id,
      },
    );

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
