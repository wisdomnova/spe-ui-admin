import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processQueue } from "@/lib/mailer";

/**
 * POST /api/email-queue/process
 *
 * Processes pending emails from the queue.
 * Can be called:
 *   - By a Vercel/Supabase Cron (with secret in header or query param)
 *   - By an admin manually from the UI
 *
 * Query params:
 *   limit  – max emails to process in this batch (default 50)
 *   key    – cron secret (alternative to header auth)
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: cron secret (header or query param) or admin session
    const cronSecret =
      req.headers.get("x-cron-secret") ||
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.nextUrl.searchParams.get("key");
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
      // Authorized via cron secret
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const rounds = Math.min(parseInt(searchParams.get("rounds") || "1", 10), 10);

    let totalSent = 0;
    let totalFailed = 0;
    let remaining = 0;

    for (let i = 0; i < rounds; i++) {
      const result = await processQueue(limit);
      totalSent += result.sent;
      totalFailed += result.failed;
      remaining = result.remaining;

      if (result.sent === 0 && result.failed === 0) break;
      if (remaining <= 0) break;
    }

    return NextResponse.json({
      sent: totalSent,
      failed: totalFailed,
      remaining,
      rounds,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/email-queue/process
 * Returns the current queue status (counts by status).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import supabase here to avoid circular dependency issues
    const { supabase } = await import("@/lib/supabase");

    const [pending, sending, sent, failed] = await Promise.all([
      supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "sending"),
      supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "sent"),
      supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    ]);

    return NextResponse.json({
      pending: pending.count || 0,
      sending: sending.count || 0,
      sent: sent.count || 0,
      failed: failed.count || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch queue status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
