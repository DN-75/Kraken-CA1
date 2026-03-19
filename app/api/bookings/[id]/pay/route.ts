import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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
      .select("id, user_profile_id, status, is_paid")
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

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ is_paid: true })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to mark payment" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: "Payment completed" },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/bookings/[id]/pay error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
