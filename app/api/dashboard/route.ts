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

    // 7-day cutoff for recent analytics
    const cutoff7d = new Date(Date.now() - 7 * 86400000).toISOString();

    // Run all count queries in parallel
    const [members, blogs, events, submissions, media, totalViewsRes, totalLikesRes, viewsRaw, recentBlogsRes, upcomingEventsRes, sponsorsRes] = await Promise.all([
      supabase.from("team_members").select("id", { count: "exact", head: true }),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "Published"),
      supabase.from("events").select("id", { count: "exact", head: true }).in("status", ["Upcoming", "Ongoing"]),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "New"),
      supabase.from("media_files").select("id", { count: "exact", head: true }),
      // Analytics
      supabase.from("blog_views").select("id", { count: "exact", head: true }),
      supabase.from("blog_likes").select("id", { count: "exact", head: true }),
      // Last 7 days views for chart
      supabase.from("blog_views").select("viewed_at").gte("viewed_at", cutoff7d).order("viewed_at", { ascending: true }),
      // Recent blogs (latest 5)
      supabase.from("blog_posts").select("id, title, status, created_at, slug").order("created_at", { ascending: false }).limit(5),
      // Upcoming events (only Upcoming or Ongoing status)
      supabase.from("events").select("id, title, date, status").in("status", ["Upcoming", "Ongoing"]).order("date", { ascending: true }).limit(5),
      // Sponsors count
      supabase.from("sponsors").select("id", { count: "exact", head: true }),
    ]);

    // Build daily views for last 7 days
    const dailyMap: Record<string, number> = {};
    // Pre-fill all 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyMap[d.toISOString().substring(0, 10)] = 0;
    }
    (viewsRaw.data || []).forEach((row: { viewed_at: string }) => {
      const day = row.viewed_at.substring(0, 10);
      if (dailyMap[day] !== undefined) dailyMap[day]++;
    });
    const dailyViews = Object.entries(dailyMap).map(([date, views]) => ({ date, views }));

    return NextResponse.json({
      stats: {
        members: members.count || 0,
        blogs: blogs.count || 0,
        events: events.count || 0,
        newSubmissions: submissions.count || 0,
        mediaFiles: media.count || 0,
        totalViews: totalViewsRes.count || 0,
        totalLikes: totalLikesRes.count || 0,
        sponsors: sponsorsRes.count || 0,
      },
      dailyViews,
      recentBlogs: recentBlogsRes.data || [],
      upcomingEvents: upcomingEventsRes.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
