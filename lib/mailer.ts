import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "info@speui.org",
    pass: process.env.SMTP_PASS || "",
  },
});

const FROM_ADDRESS = `"SPE-UI" <${process.env.SMTP_USER || "info@speui.org"}>`;

/**
 * Send a single email via SMTP.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}

/* ═══════════════════════════════════════════════════════
   QUEUE-BASED EMAIL SYSTEM
   ═══════════════════════════════════════════════════════ */

/**
 * Enqueue emails into the email_queue table and return the batch_id.
 * The emails are NOT sent yet - call processQueue() after.
 */
export async function enqueueEmails({
  recipients,
  subject,
  html,
  source,
}: {
  recipients: { id: string; email: string }[];
  subject: string;
  html: string;
  source: string;
}): Promise<{ batchId: string; queued: number }> {
  const batchId = crypto.randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://speui.org";

  const rows = recipients.map((r) => {
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${r.id}`;
    const personalizedHtml = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

    return {
      to_email: r.email,
      to_id: r.id,
      subject,
      html: personalizedHtml,
      text_body: stripHtmlToText(personalizedHtml),
      source,
      status: "pending" as const,
      batch_id: batchId,
    };
  });

  const { error } = await supabase.from("email_queue").insert(rows);
  if (error) throw new Error(`Failed to enqueue: ${error.message}`);

  return { batchId, queued: rows.length };
}

/**
 * Process pending emails from the queue.
 * Sends up to `limit` emails, marks them sent/failed.
 * Returns counts of what was processed.
 */
export async function processQueue(limit = 50): Promise<{
  sent: number;
  failed: number;
  remaining: number;
}> {
  // Grab a batch of pending emails
  const { data: emails, error } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Queue fetch error: ${error.message}`);
  if (!emails || emails.length === 0) return { sent: 0, failed: 0, remaining: 0 };

  // Mark batch as "sending" to avoid double-processing
  const ids = emails.map((e) => e.id);
  await supabase
    .from("email_queue")
    .update({ status: "sending" })
    .in("id", ids);

  let sent = 0;
  let failed = 0;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://speui.org";

  for (const email of emails) {
    try {
      const unsubscribeUrl = email.to_id
        ? `${baseUrl}/api/unsubscribe?id=${email.to_id}`
        : undefined;

      // ── Inject tracking ──────────────────────────────
      // 1. Rewrite <a href="..."> links for click tracking (skip unsubscribe & mailto links)
      let trackedHtml = email.html.replace(
        /<a\s([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
        (_match: string, before: string, href: string, after: string) => {
          if (
            href.startsWith("mailto:") ||
            href.includes("/api/unsubscribe") ||
            href.includes("/api/track/")
          ) {
            return `<a ${before}href="${href}"${after}>`;
          }
          const tracked = `${baseUrl}/api/track/click?id=${email.id}&url=${encodeURIComponent(href)}`;
          return `<a ${before}href="${tracked}"${after}>`;
        }
      );

      // 2. Append open-tracking pixel just before </body>
      const pixel = `<img src="${baseUrl}/api/track/open?id=${email.id}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
      if (trackedHtml.includes("</body>")) {
        trackedHtml = trackedHtml.replace("</body>", `${pixel}</body>`);
      } else {
        trackedHtml += pixel;
      }

      const headers: Record<string, string> = {};
      if (unsubscribeUrl) {
        headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
        headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
      }

      await transporter.sendMail({
        from: FROM_ADDRESS,
        to: email.to_email,
        subject: email.subject,
        html: trackedHtml,
        text: email.text_body || undefined,
        headers,
      });

      await supabase
        .from("email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", email.id);

      sent++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      await supabase
        .from("email_queue")
        .update({ status: "failed", error: errorMsg })
        .eq("id", email.id);

      failed++;
    }
  }

  // Count remaining pending
  const { count } = await supabase
    .from("email_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return { sent, failed, remaining: count || 0 };
}

/**
 * Strip HTML tags to produce a plain-text fallback.
 */
function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
