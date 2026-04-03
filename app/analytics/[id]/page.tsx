"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Calendar,
  Loader2,
  ThumbsUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  totalLikes: number;
  dailyViews: { date: string; views: number }[];
  devices: { device: string; count: number }[];
  referrers: { source: string; count: number }[];
  period: string;
}

interface BlogInfo {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  created_at: string;
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

export default function BlogAnalyticsPage() {
  const params = useParams();
  const blogId = params?.id as string;

  const [blog, setBlog] = useState<BlogInfo | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    if (!blogId) return;
    fetchBlog();
  }, [blogId]);

  useEffect(() => {
    if (!blogId) return;
    fetchAnalytics();
  }, [blogId, period]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}`);
      if (res.ok) setBlog(await res.json());
    } catch {}
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}&blog_id=${blogId}`);
      if (res.ok) setData(await res.json());
    } catch {
      console.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const maxDaily = useMemo(() => {
    if (!data?.dailyViews.length) return 1;
    return Math.max(...data.dailyViews.map((d) => d.views), 1);
  }, [data?.dailyViews]);

  const totalDeviceViews = useMemo(() => {
    if (!data?.devices.length) return 1;
    return data.devices.reduce((sum, d) => sum + d.count, 0) || 1;
  }, [data?.devices]);

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Analytics
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <BarChart3 size={24} className="text-blue-600" />
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  {blog?.title || "Blog Analytics"}
                </h2>
              </div>
              {blog && (
                <div className="flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <span className={`px-3 py-1 rounded-lg border ${blog.status === "Published" ? "text-green-600 border-green-100 bg-green-50" : "text-orange-600 border-orange-100 bg-orange-50"}`}>
                    {blog.status}
                  </span>
                  <span>{blog.category}</span>
                  <span>/{blog.slug}</span>
                </div>
              )}
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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

        {loading && !data ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6">
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                  <Eye size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                    Total Views ({PERIODS.find((p) => p.value === period)?.label})
                  </p>
                  <p className="text-4xl font-black text-gray-900">{data.totalViews.toLocaleString()}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    {data.uniqueViews.toLocaleString()} unique visitor{data.uniqueViews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6">
                <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                    Revisit Rate
                  </p>
                  <p className="text-4xl font-black text-gray-900">
                    {data.uniqueViews > 0 ? Math.round(((data.totalViews - data.uniqueViews) / data.totalViews) * 100) : 0}%
                  </p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6">
                <div className="p-4 bg-pink-50 rounded-2xl text-pink-500">
                  <ThumbsUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                    Total Likes
                  </p>
                  <p className="text-4xl font-black text-gray-900">{data.totalLikes.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm mb-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                  <Calendar size={18} className="text-blue-500" />
                  Daily Views
                </h3>
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
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {d.views} view{d.views !== 1 ? "s" : ""}
                          <br />
                          {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

            {/* Devices + Referrers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Devices */}
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                  <Monitor size={18} className="text-purple-500" />
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
                  <Globe size={18} className="text-orange-500" />
                  Top Referrers
                </h3>
                {data.referrers.length === 0 ? (
                  <p className="text-gray-300 font-medium text-sm">No referrer data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {data.referrers.map((r, i) => (
                      <div
                        key={r.source}
                        className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-gray-300 w-6">{String(i + 1).padStart(2, "0")}</span>
                          <span className="text-sm font-bold text-gray-700">{r.source.replace(/^www\./, "")}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{r.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
