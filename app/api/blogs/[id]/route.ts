import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { processBlogContent, uploadCoverImage, deleteStorageFile } from "@/lib/storage";

/**
 * GET /api/blogs/[id]
 * Get a single blog post by ID.
 * Content is returned EXACTLY as stored - byte-for-byte.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/blogs/[id]
 * Update a blog post. Same content fidelity rules as POST.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Process content - replace any new base64 images with permanent URLs
    if (body.content) {
      body.content = await processBlogContent(body.content);
    }

    // Handle cover image update
    if (body.cover_image_url && body.cover_image_url.startsWith("data:")) {
      body.cover_image_url = await uploadCoverImage(body.cover_image_url);
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/blogs/[id]
 * Delete a blog post and its cover image from Storage.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Get the post first to clean up storage
    const { data: post } = await supabase
      .from("blog_posts")
      .select("cover_image_url")
      .eq("id", id)
      .single();

    if (post?.cover_image_url) {
      await deleteStorageFile(post.cover_image_url).catch(() => {});
    }

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
