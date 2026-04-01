import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { deleteStorageFile } from "@/lib/storage";

/**
 * DELETE /api/media/[id] - delete media file from Storage + DB
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Get file URL first for storage cleanup
    const { data: file } = await supabase
      .from("media_files")
      .select("url")
      .eq("id", id)
      .single();

    if (file?.url) {
      await deleteStorageFile(file.url).catch(() => {});
    }

    const { error } = await supabase
      .from("media_files")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
