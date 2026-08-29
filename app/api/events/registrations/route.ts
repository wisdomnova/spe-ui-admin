import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/events/registrations - list all event registrations for admin
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const eventName = searchParams.get("event");

    let query = supabase
      .from("event_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventName) {
      query = query.eq("event_name", eventName);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/events/registrations - update attendance / day claiming checkboxes
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, day1_claimed, day2_claimed, day3_claimed } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing registration ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_registrations")
      .update({
        day1_claimed: day1_claimed ?? false,
        day2_claimed: day2_claimed ?? false,
        day3_claimed: day3_claimed ?? false,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
