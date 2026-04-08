import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { id: slotId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
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

    const { data: slot, error: slotError } = await supabase
      .from("time_slots")
      .select("id, professional_profile_id")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Time slot not found" }, { status: 404 });
    }

    if (slot.professional_profile_id !== proProfile.id) {
      return NextResponse.json(
        { error: "You are not authorized to delete this slot" },
        { status: 403 },
      );
    }

    const { count: activeBookingCount, error: activeBookingError } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("time_slot_id", slotId)
      .in("status", ["pending", "approved", "completed"]);

    if (activeBookingError) {
      console.error("Active booking lookup error:", activeBookingError);
      return NextResponse.json(
        { error: "Failed to verify whether this slot has active requests." },
        { status: 500 },
      );
    }

    if ((activeBookingCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete a time slot that still has active requests or paid sessions.",
        },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase
      .from("time_slots")
      .delete()
      .eq("id", slotId);

    if (deleteError) {
      console.error("Delete slot error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete time slot. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        slot_id: slotId,
        message: "Time slot deleted successfully",
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Unexpected error in DELETE /api/professional/time-slots/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
