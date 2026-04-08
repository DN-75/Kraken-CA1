import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PRIVATE_SUPABASE_ANON_KEY!,
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    let { data: professional, error } = await supabase
      .from("professional_profiles")
      .select("id, profile_id, status")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();

    if (!professional && !error) {
      const fallback = await supabase
        .from("professional_profiles")
        .select("id, profile_id, status")
        .eq("profile_id", id)
        .eq("status", "approved")
        .maybeSingle();

      professional = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!professional) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const { data: slots, error: slotsError } = await supabase
      .from("time_slots")
      .select("id, day_of_week, start_time, end_time, is_booked")
      .eq("professional_profile_id", professional.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (slotsError) {
      return NextResponse.json({ error: slotsError.message }, { status: 500 });
    }

    const { data: paidBookings, error: paidBookingsError } = await supabase
      .from("bookings")
      .select("time_slot_id")
      .eq("professional_profile_id", professional.id)
      .eq("is_paid", true)
      .in("status", ["approved", "completed"]);

    if (paidBookingsError) {
      return NextResponse.json({ error: paidBookingsError.message }, { status: 500 });
    }

    const paidSlotIds = new Set((paidBookings ?? []).map((booking) => booking.time_slot_id));
    const availableSlots = (slots ?? []).filter((slot) => !slot.is_booked && !paidSlotIds.has(slot.id));

    return NextResponse.json(
      {
        professional_id: professional.id,
        slots: availableSlots,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        }
      },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
