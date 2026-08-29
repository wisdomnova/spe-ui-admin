import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/spotlight - list all spotlights with team member data
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("spotlights")
      .select("*, team_member:team_members(*)")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Map custom spotlights to fit the standard spotlight schema structure
    const formatted = data?.map((s) => {
      if (!s.team_member_id) {
        return {
          ...s,
          team_member: {
            id: s.id, // simulated id
            name: s.name,
            role: s.role,
            department: s.department,
            image_url: s.image_url,
          },
        };
      }
      return s;
    });

    return NextResponse.json(formatted || []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/spotlight - create a new spotlight
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const { data, error } = await supabase
      .from("spotlights")
      .insert({
        team_member_id: body.team_member_id || null,
        name: body.name || null,
        role: body.role || null,
        department: body.department || null,
        image_url: body.image_url || null,
        tags: body.tags || [],
      })
      .select("*, team_member:team_members(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data.team_member_id) {
      const formatted = {
        ...data,
        team_member: {
          id: data.id,
          name: data.name,
          role: data.role,
          department: data.department,
          image_url: data.image_url,
        },
      };
      return NextResponse.json(formatted, { status: 201 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
