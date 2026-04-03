import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/analytics
 * Returns blog analytics data for the admin dashboard.
 *
 * Query params:
 *   - period: "7d" | "30d" | "90d" | "all" (default: "30d")
 *   - blog_id: optional UUID to filter for a specific blog
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";
    const blogId = searchParams.get("blog_id");

    // Calculate date cutoff
    let cutoff: string | null = null;
    const now = new Date();
    if (period === "7d") {
      cutoff = new Date(now.getTime() - 7 * 86400000).toISOString();
    } else if (period === "30d") {
      cutoff = new Date(now.getTime() - 30 * 86400000).toISOString();
    } else if (period === "90d") {
      cutoff = new Date(now.getTime() - 90 * 86400000).toISOString();
    }

    // ── Total views ──
    let totalQuery = supabase.from("blog_views").select("id", { count: "exact", head: true });
    if (cutoff) totalQuery = totalQuery.gte("viewed_at", cutoff);
    if (blogId) totalQuery = totalQuery.eq("blog_id", blogId);
    const { count: totalViews } = await totalQuery;

    // ── Views per day (for chart) ──
    let dailyQuery = supabase.from("blog_views").select("viewed_at");
    if (cutoff) dailyQuery = dailyQuery.gte("viewed_at", cutoff);
    if (blogId) dailyQuery = dailyQuery.eq("blog_id", blogId);
    dailyQuery = dailyQuery.order("viewed_at", { ascending: true });
    const { data: dailyRaw } = await dailyQuery;

    const dailyMap: Record<string, number> = {};
    (dailyRaw || []).forEach((row: { viewed_at: string }) => {
      const day = row.viewed_at.substring(0, 10); // YYYY-MM-DD
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const dailyViews = Object.entries(dailyMap).map(([date, views]) => ({ date, views }));

    // ── Device breakdown ──
    let deviceQuery = supabase.from("blog_views").select("device");
    if (cutoff) deviceQuery = deviceQuery.gte("viewed_at", cutoff);
    if (blogId) deviceQuery = deviceQuery.eq("blog_id", blogId);
    const { data: deviceRaw } = await deviceQuery;

    const deviceMap: Record<string, number> = {};
    (deviceRaw || []).forEach((row: { device: string }) => {
      const d = row.device || "unknown";
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });
    const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

    // ── Top referrers ──
    let refQuery = supabase.from("blog_views").select("referrer");
    if (cutoff) refQuery = refQuery.gte("viewed_at", cutoff);
    if (blogId) refQuery = refQuery.eq("blog_id", blogId);
    const { data: refRaw } = await refQuery;

    const refMap: Record<string, number> = {};
    (refRaw || []).forEach((row: { referrer: string | null }) => {
      if (!row.referrer) return;
      try {
        const host = new URL(row.referrer).hostname || "Direct";
        refMap[host] = (refMap[host] || 0) + 1;
      } catch {
        refMap["Direct"] = (refMap["Direct"] || 0) + 1;
      }
    });
    const referrers = Object.entries(refMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Top blogs by views ──
    let topQuery = supabase.from("blog_views").select("blog_id, slug");
    if (cutoff) topQuery = topQuery.gte("viewed_at", cutoff);
    const { data: topRaw } = await topQuery;

    const blogMap: Record<string, { slug: string; count: number }> = {};
    (topRaw || []).forEach((row: { blog_id: string; slug: string }) => {
      if (!blogMap[row.blog_id]) blogMap[row.blog_id] = { slug: row.slug, count: 0 };
      blogMap[row.blog_id].count++;
    });

    // Fetch blog titles for the top blogs
    const topBlogIds = Object.entries(blogMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id]) => id);

    let topBlogs: { blog_id: string; slug: string; title: string; views: number }[] = [];
    if (topBlogIds.length > 0) {
      const { data: blogData } = await supabase
        .from("blog_posts")
        .select("id, title")
        .in("id", topBlogIds);

      const titleMap: Record<string, string> = {};
      (blogData || []).forEach((b: { id: string; title: string }) => { titleMap[b.id] = b.title; });

      topBlogs = topBlogIds.map((id) => ({
        blog_id: id,
        slug: blogMap[id].slug,
        title: titleMap[id] || blogMap[id].slug,
        views: blogMap[id].count,
      }));
    }

    // ── Per-blog view counts (for blog list page) ──
    const blogViewCounts: Record<string, number> = {};
    Object.entries(blogMap).forEach(([id, { count }]) => {
      blogViewCounts[id] = count;
    });

    // ── Likes ──
    let totalLikesQuery = supabase.from("blog_likes").select("id", { count: "exact", head: true });
    if (blogId) totalLikesQuery = totalLikesQuery.eq("blog_id", blogId);
    const { count: totalLikes } = await totalLikesQuery;

    // Per-blog like counts
    let likesQuery = supabase.from("blog_likes").select("blog_id");
    if (blogId) likesQuery = likesQuery.eq("blog_id", blogId);
    const { data: likesRaw } = await likesQuery;

    const blogLikeCounts: Record<string, number> = {};
    (likesRaw || []).forEach((row: { blog_id: string }) => {
      blogLikeCounts[row.blog_id] = (blogLikeCounts[row.blog_id] || 0) + 1;
    });

    // Attach likes to topBlogs
    const topBlogsWithLikes = topBlogs.map((b) => ({
      ...b,
      likes: blogLikeCounts[b.blog_id] || 0,
    }));

    return NextResponse.json({
      totalViews: totalViews || 0,
      totalLikes: totalLikes || 0,
      dailyViews,
      devices,
      referrers,
      topBlogs: topBlogsWithLikes,
      blogViewCounts,
      blogLikeCounts,
      period,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
