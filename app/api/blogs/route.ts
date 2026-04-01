import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { processBlogContent, uploadCoverImage } from "@/lib/storage";

/**
 * GET /api/blogs
 * List all blog posts (admin sees drafts too).
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/blogs
 * Create a new blog post.
 * 
 * CRITICAL: Blog content fidelity
 * - HTML content from TipTap is stored EXACTLY as received
 * - Base64 embedded images are extracted, uploaded to Storage, 
 *   and replaced with permanent URLs BEFORE saving
 * - All HTML tags, classes, attributes, styles are preserved byte-for-byte
 * - Cover images are uploaded to Storage and stored as permanent URLs
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Process blog content - replace base64 images with permanent Storage URLs
    if (body.content) {
      body.content = await processBlogContent(body.content);
    }

    // Upload cover image if it's base64
    if (body.cover_image_url && body.cover_image_url.startsWith("data:")) {
      body.cover_image_url = await uploadCoverImage(body.cover_image_url);
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: body.title,
        slug: body.slug,
        category: body.category,
        description: body.description || "",
        content: body.content || "",
        cover_image_url: body.cover_image_url || null,
        author: body.author,
        author_name: body.author_name || "",
        author_image_url: body.author_image_url || null,
        author_role: body.author_role || "",
        tags: body.tags || [],
        status: body.status || "Draft",
        read_time: body.read_time || "1 min read",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
