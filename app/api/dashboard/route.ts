import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/dashboard - aggregate stats for the overview page
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Run all count queries in parallel
    const [members, blogs, events, submissions, media] = await Promise.all([
      supabase.from("team_members").select("id", { count: "exact", head: true }),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "Published"),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "Upcoming"),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "New"),
      supabase.from("media_files").select("id", { count: "exact", head: true }),
    ]);

    // Recent blogs (latest 5)
    const { data: recentBlogs } = await supabase
      .from("blog_posts")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Upcoming events (latest 5)
    const { data: upcomingEvents } = await supabase
      .from("events")
      .select("id, title, date, status")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        members: members.count || 0,
        blogs: blogs.count || 0,
        events: events.count || 0,
        newSubmissions: submissions.count || 0,
        mediaFiles: media.count || 0,
      },
      recentBlogs: recentBlogs || [],
      upcomingEvents: upcomingEvents || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
