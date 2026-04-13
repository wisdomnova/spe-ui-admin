"use client";

import { useState, useEffect } from "react";
import EmailCampaignEditor, { Recipient } from "@/components/EmailCampaignEditor";

interface Submission {
  id: string;
  email: string;
  status: string;
  created_at: string;
  subscribed?: boolean;
}

export default function NewsletterPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data: Submission[] = await res.json();
        const subscribed = data.filter((s) => s.subscribed !== false);
        setRecipients(
          subscribed.map((s) => ({
            id: s.id,
            email: s.email,
            sublabel: `Subscribed ${new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`,
            badge: s.status,
            badgeColor: s.status === "Read" ? ("green" as const) : ("amber" as const),
          }))
        );
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  return (
    <EmailCampaignEditor
      title="Newsletter"
      subtitle="Compose and send email campaigns to your subscribers."
      source="newsletter"
      recipients={recipients}
      loadingRecipients={loading}
      recipientCountLabel={`${recipients.length} subscribers from newsletter signups`}
      includeUnsubscribe={true}
      onSendComplete={fetchSubscribers}
    />
  );
}
