import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

/**
 * GET /api/voters - list all voters with optional search + filter
 *
 * Query params:
 *   search  – text search across name, matric, email
 *   level   – filter by level
 *   limit   – pagination limit (default 500)
 *   offset  – pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const level = searchParams.get("level")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "500", 10), 2000);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("voters")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (level) {
      query = query.eq("level", level);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,matric_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ voters: data || [], total: count || 0 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/voters - add voter(s) to the global pool
 *
 * If Content-Type is multipart/form-data → expects an Excel file
 * If Content-Type is application/json → expects a single voter object
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

    // ── Single voter (JSON) ──
    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (!body.name?.trim() || !body.matric_number?.trim() || !body.email?.trim()) {
        return NextResponse.json({ error: "Name, matric number, and email are required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("voters")
        .insert({
          name: body.name.trim(),
          matric_number: body.matric_number.trim(),
          email: body.email.trim(),
          level: body.level?.trim() || null,
          department: body.department?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("duplicate key") || error.message.includes("unique")) {
          return NextResponse.json({ error: "A voter with this matric number already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
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

    // Normalize headers
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, "_");

    const voters = rows.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[normalizeKey(String(key))] = String(value).trim();
      }

      const name =
        normalized["name"] || normalized["full_name"] || normalized["student_name"] || normalized["fullname"] || "";
      const matric =
        normalized["matric"] || normalized["matric_number"] || normalized["matric_no"] || normalized["matriculation_number"] || "";
      const email =
        normalized["email"] || normalized["email_address"] || normalized["e-mail"] || "";
      const level =
        normalized["level"] || normalized["class"] || normalized["year"] || "";
      const department =
        normalized["department"] || normalized["dept"] || "";

      return { name, matric_number: matric, email, level: level || null, department: department || null };
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

    // Upsert to avoid duplicate matric_number
    const { data, error } = await supabase
      .from("voters")
      .upsert(validVoters, { onConflict: "matric_number" })
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
 * PATCH /api/voters - edit a single voter
 * Body: { id, name?, matric_number?, email?, level?, department? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Voter id is required" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.matric_number !== undefined) updates.matric_number = body.matric_number.trim();
    if (body.email !== undefined) updates.email = body.email.trim();
    if (body.level !== undefined) updates.level = body.level?.trim() || null;
    if (body.department !== undefined) updates.department = body.department?.trim() || null;

    const { data, error } = await supabase
      .from("voters")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate key") || error.message.includes("unique")) {
        return NextResponse.json({ error: "A voter with this matric number already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/voters - delete voter(s) from the global pool
 *
 * Query params:
 *   id    – single voter id to delete
 *   ids   – comma-separated voter ids for bulk delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const singleId = searchParams.get("id");
    const bulkIds = searchParams.get("ids");

    if (bulkIds) {
      const idList = bulkIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) return NextResponse.json({ error: "No ids provided" }, { status: 400 });

      const { error } = await supabase.from("voters").delete().in("id", idList);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: idList.length });
    }

    if (singleId) {
      const { error } = await supabase.from("voters").delete().eq("id", singleId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id or ids parameter required" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
