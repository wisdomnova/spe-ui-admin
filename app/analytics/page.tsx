"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  TrendingUp,
  Calendar,
  Loader2,
  ArrowUpRight,
  ThumbsUp,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  totalLikes: number;
  dailyViews: { date: string; views: number }[];
  devices: { device: string; count: number }[];
  referrers: { source: string; count: number }[];
  topBlogs: { blog_id: string; slug: string; title: string; views: number; likes: number }[];
  period: string;
}

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

const DeviceIcon = ({ device }: { device: string }) => {
  if (device === "mobile") return <Smartphone size={16} />;
  if (device === "tablet") return <Tablet size={16} />;
  return <Monitor size={16} />;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  // Chart: compute max for scale
  const maxDaily = useMemo(() => {
    if (!data?.dailyViews.length) return 1;
    return Math.max(...data.dailyViews.map((d) => d.views), 1);
  }, [data?.dailyViews]);

  // Per-device totals
  const totalDeviceViews = useMemo(() => {
    if (!data?.devices.length) return 1;
    return data.devices.reduce((sum, d) => sum + d.count, 0) || 1;
  }, [data?.devices]);

  if (loading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Analytics</h2>
            </div>
            <p className="text-gray-500 font-medium">Track blog performance and audience insights.</p>
          </div>

          {/* Period Selector + Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className={`p-3 rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-95 ${loading ? "animate-spin" : ""}`}
              title="Refresh stats"
            >
              <RefreshCw size={18} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p.value
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-gray-300" size={32} />
          </div>
        ) : !data ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">Failed to load analytics data.</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <StatCard
                label="Total Views"
                value={data.totalViews.toLocaleString()}
                icon={<Eye size={20} />}
                color="blue"
              />
              <StatCard
                label="Unique Visitors"
                value={data.uniqueViews.toLocaleString()}
                icon={<Users size={20} />}
                color="purple"
              />
              <StatCard
                label="Revisit Rate"
                value={
                  data.totalViews > 0
                    ? `${Math.round(((data.totalViews - data.uniqueViews) / data.totalViews) * 100)}%`
                    : "0%"
                }
                icon={<TrendingUp size={20} />}
                color="green"
              />
              <StatCard
                label="Total Likes"
                value={data.totalLikes.toLocaleString()}
                icon={<ThumbsUp size={20} />}
                color="orange"
              />
              <StatCard
                label="Top Device"
                value={
                  data.devices.length
                    ? data.devices.sort((a, b) => b.count - a.count)[0].device
                    : "-"
                }
                icon={<Monitor size={20} />}
                color="purple"
              />
              <StatCard
                label="Top Referrer"
                value={
                  data.referrers.length
                    ? data.referrers[0].source.replace(/^www\./, "")
                    : "Direct"
                }
                icon={<Globe size={20} />}
                color="blue"
              />
            </div>

            {/* Views Chart */}
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm mb-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <Calendar size={20} className="text-blue-500" />
                  Daily Views
                </h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {data.dailyViews.length} day{data.dailyViews.length !== 1 ? "s" : ""}
                </span>
              </div>

              {data.dailyViews.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-gray-300 font-bold">
                  No views recorded yet for this period.
                </div>
              ) : (
                <div className="flex items-end gap-[3px] h-52 sm:h-64">
                  {data.dailyViews.map((d, i) => {
                    const pct = (d.views / maxDaily) * 100;
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {d.views} view{d.views !== 1 ? "s" : ""}
                          <br />
                          {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, 2)}%` }}
                          transition={{ delay: i * 0.02, duration: 0.4 }}
                          className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer min-h-[3px]"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Two Column: Devices + Referrers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Devices */}
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                  <Monitor size={20} className="text-purple-500" />
                  Devices
                </h3>
                {data.devices.length === 0 ? (
                  <p className="text-gray-300 font-medium text-sm">No data yet.</p>
                ) : (
                  <div className="space-y-5">
                    {data.devices
                      .sort((a, b) => b.count - a.count)
                      .map((d) => (
                        <div key={d.device} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-700 capitalize">
                              <DeviceIcon device={d.device} />
                              {d.device}
                            </div>
                            <span className="text-sm font-black text-gray-900">
                              {d.count}{" "}
                              <span className="text-gray-400 font-bold text-xs">
                                ({Math.round((d.count / totalDeviceViews) * 100)}%)
                              </span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(d.count / totalDeviceViews) * 100}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full bg-purple-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Referrers */}
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                  <Globe size={20} className="text-orange-500" />
                  Top Referrers
                </h3>
                {data.referrers.length === 0 ? (
                  <p className="text-gray-300 font-medium text-sm">No referrer data yet. Visits may be direct.</p>
                ) : (
                  <div className="space-y-4">
                    {data.referrers.map((r, i) => (
                      <div
                        key={r.source}
                        className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-gray-300 w-6">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-bold text-gray-700">
                            {r.source.replace(/^www\./, "")}
                          </span>
                        </div>
                        <span className="text-sm font-black text-gray-900">
                          {r.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Blogs */}
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                <TrendingUp size={20} className="text-green-500" />
                Top Performing Blogs
              </h3>
              {data.topBlogs.length === 0 ? (
                <p className="text-gray-300 font-medium text-sm">No blog views recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.topBlogs.map((blog, i) => (
                    <div
                      key={blog.blog_id}
                      className="flex items-center justify-between py-4 px-5 rounded-2xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span
                          className={`text-sm font-black w-8 h-8 rounded-xl flex items-center justify-center ${
                            i === 0
                              ? "bg-yellow-50 text-yellow-600"
                              : i === 1
                              ? "bg-gray-100 text-gray-500"
                              : i === 2
                              ? "bg-orange-50 text-orange-500"
                              : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {blog.title}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            /{blog.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5 text-sm font-black text-blue-600" title="Views">
                          <Eye size={14} />
                          {blog.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-black text-pink-500" title="Likes">
                          <ThumbsUp size={14} />
                          {blog.likes.toLocaleString()}
                        </span>
                        <Link
                          href={`/analytics/${blog.blog_id}`}
                          className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="View details"
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </div>
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

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-7 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-gray-900 capitalize">{value}</p>
    </div>
  );
}
