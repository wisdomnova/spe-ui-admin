import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processQueue } from "@/lib/mailer";

/**
 * POST /api/email-queue/process
 *
 * Processes pending emails from the queue.
 * Can be called:
 *   - By a Vercel Cron job (with CRON_SECRET header)
 *   - By an admin manually from the UI
 *
 * Query params:
 *   limit  – max emails to process in this batch (default 50)
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: either admin session or cron secret
    const cronSecret =
      req.headers.get("x-cron-secret") ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;

    if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
      // Authorized via cron secret or Vercel Cron
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const result = await processQueue(limit);

    return NextResponse.json(result);
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
