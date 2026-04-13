"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Eye,
  MousePointerClick,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Send,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Campaign {
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

interface Totals {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  totalOpens: number;
  totalUniqueOpens: number;
  totalClicks: number;
  totalCampaigns: number;
  avgOpenRate: number;
  avgClickRate: number;
}

interface DailyPoint {
  date: string;
  sent: number;
  opens: number;
  clicks: number;
}

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function EmailAnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");
  const [days, setDays] = useState(30);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source) params.set("source", source);
      params.set("days", String(days));
      const res = await fetch(`/api/email-analytics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setTotals(data.totals || null);
        setDaily(data.daily || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [source, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fmt = (n: number) => n.toLocaleString();
  const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "—");

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Email Analytics</h2>
            </div>
            <p className="text-gray-500 font-medium">
              Track open rates, click rates, and delivery metrics across campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Source filter */}
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 focus:border-blue-500 outline-none"
            >
              <option value="">All Sources</option>
              <option value="newsletter">Newsletter</option>
              <option value="voters">Voters</option>
            </select>

            {/* Days filter */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 focus:border-blue-500 outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-blue-100 transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        {loading && !totals ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-blue-600" size={36} />
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            {totals && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <KpiCard
                  icon={Send}
                  label="Sent"
                  value={fmt(totals.totalSent)}
                  color="blue"
                />
                <KpiCard
                  icon={Eye}
                  label="Opens"
                  value={fmt(totals.totalUniqueOpens)}
                  sub={`${(totals.avgOpenRate * 100).toFixed(1)}% avg rate`}
                  color="emerald"
                />
                <KpiCard
                  icon={MousePointerClick}
                  label="Clicks"
                  value={fmt(totals.totalClicks)}
                  sub={`${(totals.avgClickRate * 100).toFixed(1)}% avg rate`}
                  color="violet"
                />
                <KpiCard
                  icon={AlertTriangle}
                  label="Failed"
                  value={fmt(totals.totalFailed)}
                  color="red"
                />
                <KpiCard
                  icon={BarChart3}
                  label="Campaigns"
                  value={fmt(totals.totalCampaigns)}
                  color="amber"
                />
              </div>
            )}

            {/* ── Sparkline Chart ── */}
            {daily.length > 1 && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
                  Daily Activity
                </h3>
                <MiniChart data={daily} />
              </div>
            )}

            {/* ── Campaign List ── */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-gray-50">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" /> Campaigns
                </h3>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-20">
                  <Mail size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold">No campaigns found</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Send your first email campaign to see analytics here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {campaigns.map((c) => (
                    <CampaignRow
                      key={c.batch_id}
                      campaign={c}
                      expanded={expandedBatch === c.batch_id}
                      onToggle={() =>
                        setExpandedBatch(expandedBatch === c.batch_id ? null : c.batch_id)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════ */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "emerald" | "violet" | "red" | "amber";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMPAIGN ROW
   ═══════════════════════════════════════════════════════ */
function CampaignRow({
  campaign: c,
  expanded,
  onToggle,
}: {
  campaign: Campaign;
  expanded: boolean;
  onToggle: () => void;
}) {
  const openRate = c.sent > 0 ? ((c.uniqueOpens / c.sent) * 100).toFixed(1) : "0";
  const clickRate = c.sent > 0 ? ((c.clicks / c.sent) * 100).toFixed(1) : "0";

  const sourceColors: Record<string, string> = {
    newsletter: "bg-blue-50 text-blue-600",
    voters: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors flex items-start gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h4 className="font-bold text-gray-900 truncate">{c.subject}</h4>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                sourceColors[c.source] || "bg-gray-100 text-gray-500"
              }`}
            >
              {c.source}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(c.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Send size={11} />
              {c.sent}/{c.total} delivered
            </span>
            {c.failed > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle size={11} />
                {c.failed} failed
              </span>
            )}
            {c.pending > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Loader2 size={11} />
                {c.pending} pending
              </span>
            )}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="flex items-center gap-6 text-center shrink-0">
          <div>
            <p className="text-lg font-black text-gray-900">{openRate}%</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Opens</p>
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">{clickRate}%</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Clicks</p>
          </div>
          <div className="text-gray-300">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MiniStat icon={Send} label="Delivered" value={String(c.sent)} color="text-blue-500" />
                <MiniStat icon={Eye} label="Unique Opens" value={String(c.uniqueOpens)} color="text-emerald-500" />
                <MiniStat icon={Eye} label="Total Opens" value={String(c.opens)} color="text-emerald-400" />
                <MiniStat icon={MousePointerClick} label="Total Clicks" value={String(c.clicks)} color="text-violet-500" />
              </div>

              {/* Top Links */}
              {c.topLinks.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Top Clicked Links
                  </h5>
                  <div className="space-y-2">
                    {c.topLinks.map((link, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ExternalLink size={12} className="text-gray-300 shrink-0" />
                          <span className="text-sm text-gray-600 truncate">{link.url}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 ml-4">{link.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MINI STAT
   ═══════════════════════════════════════════════════════ */
function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MINI CHART (pure CSS bar chart)
   ═══════════════════════════════════════════════════════ */
function MiniChart({ data }: { data: DailyPoint[] }) {
  const maxSent = Math.max(...data.map((d) => d.sent), 1);
  const maxOpens = Math.max(...data.map((d) => d.opens), 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-xs font-bold text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500" /> Sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Opens
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-violet-500" /> Clicks
        </span>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const sentH = (d.sent / maxSent) * 100;
          const openH = (d.opens / maxSent) * 100;
          const clickH = (d.clicks / maxSent) * 100;

          return (
            <div
              key={i}
              className="flex-1 flex items-end gap-px group relative"
              title={`${d.date}: ${d.sent} sent, ${d.opens} opens, ${d.clicks} clicks`}
            >
              <div
                className="flex-1 bg-blue-200 group-hover:bg-blue-500 rounded-t transition-colors"
                style={{ height: `${Math.max(sentH, 2)}%` }}
              />
              <div
                className="flex-1 bg-emerald-200 group-hover:bg-emerald-500 rounded-t transition-colors"
                style={{ height: `${Math.max(openH, 2)}%` }}
              />
              <div
                className="flex-1 bg-violet-200 group-hover:bg-violet-500 rounded-t transition-colors"
                style={{ height: `${Math.max(clickH, 2)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels (first, middle, last) */}
      {data.length > 2 && (
        <div className="flex justify-between text-[10px] text-gray-300 font-medium">
          <span>{data[0].date}</span>
          <span>{data[Math.floor(data.length / 2)].date}</span>
          <span>{data[data.length - 1].date}</span>
        </div>
      )}
    </div>
  );
}
