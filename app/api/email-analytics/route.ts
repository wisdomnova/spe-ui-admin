import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/email-analytics
 *
 * Returns email campaign analytics.
 *
 * Query params:
 *   source   – filter by source (e.g. "newsletter", "voters")
 *   batch_id – filter by specific batch
 *   days     – lookback period in days (default: 30)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source");
    const batchId = searchParams.get("batch_id");
    const days = parseInt(searchParams.get("days") || "30", 10);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // ── 1. Fetch campaigns (grouped by batch_id) ──
    let query = supabase
      .from("email_queue")
      .select("id, batch_id, subject, source, status, to_email, created_at, sent_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (source) query = query.eq("source", source);
    if (batchId) query = query.eq("batch_id", batchId);

    const { data: emails, error: emailErr } = await query;
    if (emailErr) throw new Error(emailErr.message);
    if (!emails || emails.length === 0) {
      return NextResponse.json({ campaigns: [], totals: getEmptyTotals() });
    }

    // ── 2. Fetch all opens for matching queue IDs ──
    const queueIds = emails.map((e) => e.id);
    const { data: opens } = await supabase
      .from("email_opens")
      .select("queue_id, opened_at")
      .in("queue_id", queueIds);

    // ── 3. Fetch all clicks for matching queue IDs ──
    const { data: clicks } = await supabase
      .from("email_clicks")
      .select("queue_id, url, clicked_at")
      .in("queue_id", queueIds);

    // ── 4. Build per-campaign stats ──
    const opensMap = new Map<string, number>();
    const uniqueOpensMap = new Map<string, Set<string>>();
    for (const o of opens || []) {
      opensMap.set(o.queue_id, (opensMap.get(o.queue_id) || 0) + 1);
      if (!uniqueOpensMap.has(o.queue_id)) uniqueOpensMap.set(o.queue_id, new Set());
      uniqueOpensMap.get(o.queue_id)!.add(o.queue_id);
    }

    const clicksMap = new Map<string, number>();
    const clickUrlsMap = new Map<string, Map<string, number>>();
    for (const c of clicks || []) {
      clicksMap.set(c.queue_id, (clicksMap.get(c.queue_id) || 0) + 1);
      if (!clickUrlsMap.has(c.queue_id)) clickUrlsMap.set(c.queue_id, new Map());
      const urlMap = clickUrlsMap.get(c.queue_id)!;
      urlMap.set(c.url, (urlMap.get(c.url) || 0) + 1);
    }

    // Group by batch_id
    const batchGroups = new Map<
      string,
      {
        batch_id: string;
        subject: string;
        source: string;
        created_at: string;
        total: number;
        sent: number;
        failed: number;
        pending: number;
        opens: number;
        uniqueOpens: number;
        clicks: number;
        topLinks: { url: string; count: number }[];
      }
    >();

    for (const e of emails) {
      if (!batchGroups.has(e.batch_id)) {
        batchGroups.set(e.batch_id, {
          batch_id: e.batch_id,
          subject: e.subject,
          source: e.source,
          created_at: e.created_at,
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          opens: 0,
          uniqueOpens: 0,
          clicks: 0,
          topLinks: [],
        });
      }

      const group = batchGroups.get(e.batch_id)!;
      group.total++;
      if (e.status === "sent") group.sent++;
      else if (e.status === "failed") group.failed++;
      else group.pending++;

      group.opens += opensMap.get(e.id) || 0;
      if (uniqueOpensMap.has(e.id)) group.uniqueOpens++;
      group.clicks += clicksMap.get(e.id) || 0;
    }

    // Compute top links per campaign
    for (const [batchId, group] of batchGroups) {
      const batchEmails = emails.filter((e) => e.batch_id === batchId);
      const linkCounts = new Map<string, number>();
      for (const e of batchEmails) {
        const urlMap = clickUrlsMap.get(e.id);
        if (urlMap) {
          for (const [url, count] of urlMap) {
            linkCounts.set(url, (linkCounts.get(url) || 0) + count);
          }
        }
      }
      group.topLinks = [...linkCounts.entries()]
        .map(([url, count]) => ({ url, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    const campaigns = [...batchGroups.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // ── 5. Overall totals ──
    const totals = {
      totalSent: campaigns.reduce((s, c) => s + c.sent, 0),
      totalFailed: campaigns.reduce((s, c) => s + c.failed, 0),
      totalPending: campaigns.reduce((s, c) => s + c.pending, 0),
      totalOpens: campaigns.reduce((s, c) => s + c.opens, 0),
      totalUniqueOpens: campaigns.reduce((s, c) => s + c.uniqueOpens, 0),
      totalClicks: campaigns.reduce((s, c) => s + c.clicks, 0),
      totalCampaigns: campaigns.length,
      avgOpenRate:
        campaigns.length > 0
          ? campaigns.reduce((s, c) => s + (c.sent > 0 ? c.uniqueOpens / c.sent : 0), 0) / campaigns.length
          : 0,
      avgClickRate:
        campaigns.length > 0
          ? campaigns.reduce((s, c) => s + (c.sent > 0 ? c.clicks / c.sent : 0), 0) / campaigns.length
          : 0,
    };

    // ── 6. Daily send volume (last N days) ──
    const dailyMap = new Map<string, { sent: number; opens: number; clicks: number }>();
    for (const e of emails) {
      const day = e.created_at.slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, { sent: 0, opens: 0, clicks: 0 });
      const d = dailyMap.get(day)!;
      if (e.status === "sent") d.sent++;
      d.opens += opensMap.get(e.id) || 0;
      d.clicks += clicksMap.get(e.id) || 0;
    }

    const daily = [...dailyMap.entries()]
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ campaigns, totals, daily });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getEmptyTotals() {
  return {
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    totalOpens: 0,
    totalUniqueOpens: 0,
    totalClicks: 0,
    totalCampaigns: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  };
}
