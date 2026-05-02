import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

function createTransport(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    pool: true,
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || "3", 10),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES_PER_CONNECTION || "100", 10),
    rateDelta: 1000,
    rateLimit: parseInt(process.env.SMTP_RATE_LIMIT_PER_SECOND || "5", 10),
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

const primaryTransporter = createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: String(process.env.SMTP_SECURE || "true") !== "false",
  user: process.env.SMTP_USER || "info@speui.org",
  pass: process.env.SMTP_PASS || "",
});

const backupHost = process.env.SMTP_BACKUP_HOST || "";
const backupUser = process.env.SMTP_BACKUP_USER || "";
const backupPass = process.env.SMTP_BACKUP_PASS || "";
const backupPort = parseInt(process.env.SMTP_BACKUP_PORT || "587", 10);
const backupSecure = String(process.env.SMTP_BACKUP_SECURE || "false") === "true";

const backupTransporter =
  backupHost && backupUser && backupPass
    ? createTransport({
        host: backupHost,
        port: backupPort,
        secure: backupSecure,
        user: backupUser,
        pass: backupPass,
      })
    : null;

const FROM_ADDRESS = `"SPE-UI" <${process.env.SMTP_USER || "info@speui.org"}>`;
const MAX_SEND_RETRIES = Math.max(1, parseInt(process.env.SMTP_MAX_SEND_RETRIES || "3", 10));
const BASE_RETRY_DELAY_MS = Math.max(500, parseInt(process.env.SMTP_RETRY_BASE_DELAY_MS || "1500", 10));
let verifyPromise: Promise<void> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientSmtpError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  const code = (err as { code?: string } | undefined)?.code?.toLowerCase() || "";
  const responseCode = (err as { responseCode?: number } | undefined)?.responseCode;

  const transientCodes = new Set([
    "etimedout",
    "esocket",
    "econnreset",
    "econnrefused",
    "ehostunreach",
    "enetunreach",
    "eai_again",
  ]);

  if (transientCodes.has(code)) return true;
  if (typeof responseCode === "number" && [421, 425, 429, 450, 451, 452].includes(responseCode)) return true;

  return (
    msg.includes("timed out") ||
    msg.includes("timeout") ||
    msg.includes("connection closed") ||
    msg.includes("greeting never received") ||
    msg.includes("try again later") ||
    msg.includes("rate limit")
  );
}

async function verifyTransporter() {
  if (!verifyPromise) {
    verifyPromise = primaryTransporter.verify().then(() => undefined).catch((err) => {
      verifyPromise = null;
      throw err;
    });
  }
  return verifyPromise;
}

async function sendMailWithFailover(mailOptions: Record<string, unknown>) {
  try {
    await primaryTransporter.sendMail(mailOptions);
  } catch (err) {
    if (!backupTransporter || !isTransientSmtpError(err)) {
      throw err;
    }
    await backupTransporter.sendMail(mailOptions);
  }
}

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
  await sendMailWithFailover({
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
  await verifyTransporter();

  // Recover stale rows that were left in "sending" due to crashed/timeout workers.
  // We use created_at as a fallback timestamp since this table has no updated_at.
  const staleCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes
  await supabase
    .from("email_queue")
    .update({ status: "pending", error: "Recovered from stale sending state" })
    .eq("status", "sending")
    .lt("created_at", staleCutoff);

  // Atomically claim a batch: update pending → sending AND return claimed rows
  // This eliminates any race window between two concurrent cron calls
  const { data: emails, error } = await supabase.rpc("claim_email_batch", {
    batch_limit: limit,
  });

  if (error) {
    // Fallback: if the RPC doesn't exist yet, use the old select-then-update approach
    if (error.code === "PGRST202") {
      const { data: fallbackEmails, error: fbErr } = await supabase
        .from("email_queue")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(limit);

      if (fbErr) throw new Error(`Queue fetch error: ${fbErr.message}`);
      if (!fallbackEmails || fallbackEmails.length === 0) return { sent: 0, failed: 0, remaining: 0 };

      const fbIds = fallbackEmails.map((e) => e.id);
      await supabase
        .from("email_queue")
        .update({ status: "sending" })
        .in("id", fbIds);

      return sendBatch(fallbackEmails);
    }
    throw new Error(`Queue fetch error: ${error.message}`);
  }

  if (!emails || emails.length === 0) return { sent: 0, failed: 0, remaining: 0 };

  return sendBatch(emails);
}

async function sendBatch(emails: Array<Record<string, string>>): Promise<{
  sent: number;
  failed: number;
  remaining: number;
}> {

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

      let lastError: unknown = null;
      for (let attempt = 1; attempt <= MAX_SEND_RETRIES; attempt++) {
        try {
          await sendMailWithFailover({
            from: FROM_ADDRESS,
            to: email.to_email,
            subject: email.subject,
            html: trackedHtml,
            text: email.text_body || undefined,
            headers,
          });
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          const transient = isTransientSmtpError(err);
          if (!transient || attempt >= MAX_SEND_RETRIES) break;
          const backoffMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await sleep(backoffMs);
        }
      }

      if (lastError) throw lastError;

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
 * Reset failed rows for a campaign batch to pending so processQueue can send them again.
 */
export async function retryFailedEmailsForBatch(batchId: string): Promise<{ retried: number }> {
  const { data, error } = await supabase
    .from("email_queue")
    .update({ status: "pending", error: null })
    .eq("batch_id", batchId)
    .eq("status", "failed")
    .select("id");

  if (error) throw new Error(error.message);
  return { retried: data?.length ?? 0 };
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
