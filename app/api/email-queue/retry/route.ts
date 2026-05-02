import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processQueue, retryFailedEmailsForBatch } from "@/lib/mailer";

/**
 * POST /api/email-queue/retry
 * Body: { batch_id: string }
 *
 * Re-queues all failed emails in that batch (status → pending), then processes
 * up to min(retried, 100) messages so delivery starts immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const batchId = typeof body?.batch_id === "string" ? body.batch_id.trim() : "";
    if (!batchId) {
      return NextResponse.json({ error: "batch_id is required" }, { status: 400 });
    }

    const { retried } = await retryFailedEmailsForBatch(batchId);
    if (retried === 0) {
      return NextResponse.json({ retried: 0, message: "No failed emails for this batch" });
    }

    let sent = 0;
    let failed = 0;
    const perRound = 100;
    const maxRounds = Math.min(15, Math.max(1, Math.ceil(retried / perRound)));
    for (let i = 0; i < maxRounds; i++) {
      const r = await processQueue(perRound);
      sent += r.sent;
      failed += r.failed;
      if (r.sent === 0 && r.failed === 0) break;
    }

    return NextResponse.json({ retried, sent, failed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retry queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
