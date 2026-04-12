import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/elections/[id]/voters - list all voters for the election
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;

    const { data, error } = await supabase
      .from("election_voters")
      .select("*")
      .eq("election_id", id)
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/elections/[id]/voters - upload voters from Excel or add single voter
 *
 * If Content-Type is multipart/form-data → expects an Excel file
 * If Content-Type is application/json → expects a single voter object
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const contentType = req.headers.get("content-type") || "";

    // ── Single voter (JSON) ──
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { data, error } = await supabase
        .from("election_voters")
        .insert({
          election_id: id,
          name: body.name,
          matric_number: body.matric_number,
          email: body.email,
          level: body.level || null,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data, { status: 201 });
    }

    // ── Excel upload (multipart/form-data) ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    // Normalize headers: lowercase + trim
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, "_");

    const voters = rows.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[normalizeKey(String(key))] = String(value).trim();
      }

      // Try common header variations
      const name =
        normalized["name"] || normalized["full_name"] || normalized["student_name"] || normalized["fullname"] || "";
      const matric =
        normalized["matric"] || normalized["matric_number"] || normalized["matric_no"] || normalized["matriculation_number"] || "";
      const email =
        normalized["email"] || normalized["email_address"] || normalized["e-mail"] || "";
      const level =
        normalized["level"] || normalized["class"] || normalized["year"] || "";

      return { election_id: id, name, matric_number: matric, email, level };
    });

    // Filter out rows with missing required fields
    const validVoters = voters.filter((v) => v.name && v.matric_number && v.email);
    const skipped = voters.length - validVoters.length;

    if (validVoters.length === 0) {
      return NextResponse.json(
        {
          error: "No valid rows found. Ensure columns include: name, matric (or matric_number), email, level",
          skipped: voters.length,
        },
        { status: 400 }
      );
    }

    // Upsert to avoid duplicate matric_number per election
    const { data, error } = await supabase
      .from("election_voters")
      .upsert(validVoters, { onConflict: "election_id,matric_number" })
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      imported: data?.length || 0,
      skipped,
      total_rows: rows.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/elections/[id]/voters?voter_id=... or ?clear=true to remove all
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const voterId = searchParams.get("voter_id");
    const clearAll = searchParams.get("clear") === "true";

    if (clearAll) {
      const { error } = await supabase.from("election_voters").delete().eq("election_id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "All voters cleared" });
    }

    if (!voterId) return NextResponse.json({ error: "voter_id or clear=true required" }, { status: 400 });

    const { error } = await supabase.from("election_voters").delete().eq("id", voterId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
