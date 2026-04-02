import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { uploadFile, deleteStorageFile } from "@/lib/storage";

/**
 * GET /api/media - list all media files
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("media_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/media - upload file(s) to Storage + record in DB
 * Accepts multipart/form-data with "files" field.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    // Support both "file" (single) and "files" (multi) field names
    const files = [
      ...formData.getAll("file") as File[],
      ...formData.getAll("files") as File[],
    ].filter(f => f instanceof File);
    const group = (formData.get("group") as string) || (formData.get("file_group") as string) || "All";
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      // Upload to Supabase Storage
      const url = await uploadFile(file, "uploads");

      // Format file size
      const sizeKB = (file.size / 1024).toFixed(1);
      const size = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${sizeKB} KB`;

      // Record in DB
      const { data, error } = await supabase
        .from("media_files")
        .insert({
          name: file.name,
          url,
          size,
          type: file.type,
          tags,
          file_group: group,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      results.push(data);
    }

    return NextResponse.json(results, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
