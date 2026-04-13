import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { enqueueEmails, processQueue } from "@/lib/mailer";

/**
 * POST /api/email-queue/send
 * Body: { subject, html, recipients: { id, email }[], source }
 *
 * Queues all emails into the email_queue table, then immediately
 * starts processing the queue. If the request times out mid-send,
 * remaining emails stay "pending" and can be picked up by the
 * /api/email-queue/process cron endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, html, recipients, source } = body;

    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!html?.trim()) {
      return NextResponse.json({ error: "Email body is required" }, { status: 400 });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    const validRecipients = recipients.filter(
      (r: { id?: string; email?: string }) => r.id && r.email
    );

    if (validRecipients.length === 0) {
      return NextResponse.json({ error: "No valid recipients" }, { status: 400 });
    }

    // Step 1: Queue all emails
    const { batchId, queued } = await enqueueEmails({
      recipients: validRecipients,
      subject: subject.trim(),
      html,
      source: source || "newsletter",
    });

    // Step 2: Immediately start processing (best-effort)
    // If this times out, the cron route will pick up remaining emails
    processQueue(queued).catch(() => {
      // Swallow — cron will handle remaining
    });

    return NextResponse.json({
      batchId,
      queued,
      total: validRecipients.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to queue emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
