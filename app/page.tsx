"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Users,
  FileText,
  CalendarDays,
  Inbox,
  Eye,
  ThumbsUp,
  Image as ImageIcon,
  Handshake,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  BarChart3,
  Newspaper,
  Megaphone,
  FolderOpen,
  Award,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  stats: {
    members: number;
    blogs: number;
    events: number;
    newSubmissions: number;
    mediaFiles: number;
    totalViews: number;
    totalLikes: number;
    sponsors: number;
  };
  dailyViews: { date: string; views: number }[];
  recentBlogs: { id: string; title: string; status: string; created_at: string; slug: string }[];
  upcomingEvents: { id: string; title: string; date: string; status: string }[];
}

const STAT_CARDS = [
  { key: "totalViews", label: "Total Views", icon: Eye, color: "blue", href: "/analytics" },
  { key: "totalLikes", label: "Total Likes", icon: ThumbsUp, color: "pink", href: "/analytics" },
  { key: "blogs", label: "Published Blogs", icon: FileText, color: "indigo", href: "/blogs" },
  { key: "events", label: "Active Events", icon: CalendarDays, color: "orange", href: "/events" },
  { key: "members", label: "Team Members", icon: Users, color: "emerald", href: "/team" },
  { key: "newSubmissions", label: "New Submissions", icon: Inbox, color: "amber", href: "/submissions" },
  { key: "mediaFiles", label: "Media Files", icon: ImageIcon, color: "purple", href: "/media" },
  { key: "sponsors", label: "Sponsors", icon: Handshake, color: "cyan", href: "/sponsors" },
] as const;

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600" },
  pink:    { bg: "bg-pink-50",    text: "text-pink-600" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600" },
  orange:  { bg: "bg-orange-50",  text: "text-orange-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-600" },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-600" },
};

const STATUS_COLORS: Record<string, string> = {
  Published: "bg-green-50 text-green-700",
  Draft:     "bg-gray-100 text-gray-500",
  Upcoming:  "bg-blue-50 text-blue-700",
  Ongoing:   "bg-orange-50 text-orange-700",
  Completed: "bg-gray-100 text-gray-500",
};

const QUICK_LINKS = [
  { label: "Blogs", href: "/blogs", icon: Newspaper, desc: "Create & manage posts" },
  { label: "Events", href: "/events", icon: Megaphone, desc: "Manage events" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, desc: "View statistics" },
  { label: "Media", href: "/media", icon: FolderOpen, desc: "Upload & browse files" },
  { label: "Team", href: "/team", icon: Users, desc: "Manage members" },
  { label: "Spotlight", href: "/spotlight", icon: Award, desc: "Feature members" },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  const fetchDashboard = () => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user?.role) setRole(d.user.role); })
      .catch(() => {});
  }, []);

  const maxDaily = useMemo(() => {
    if (!data?.dailyViews?.length) return 1;
    return Math.max(...data.dailyViews.map((d) => d.views), 1);
  }, [data?.dailyViews]);

  if (loading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Overview</h2>
            <p className="text-gray-500 font-medium">
              {role
                ? `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}. Here's your dashboard.`
                : "Welcome to the SPEUI Administrative Control Center."}
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="self-start md:self-auto p-3 rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={18} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </header>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {STAT_CARDS.map((card, i) => {
            const c = COLOR_MAP[card.color];
            const value = stats?.[card.key] ?? 0;
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={card.href}
                  className="group block bg-white p-5 sm:p-7 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      {card.label}
                    </p>
                    <div className={`p-2 sm:p-2.5 rounded-xl ${c.bg} ${c.text}`}>
                      <card.icon size={18} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                    {value.toLocaleString()}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Views Chart (last 7 days) */}
        {data?.dailyViews && data.dailyViews.length > 0 && (
          <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm mb-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <TrendingUp size={20} className="text-blue-500" />
                Views This Week
              </h3>
              <Link
                href="/analytics"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                Full Analytics <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="flex items-end gap-[6px] h-40 sm:h-48">
              {data.dailyViews.map((d, i) => {
                const pct = (d.views / maxDaily) * 100;
                const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                });
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center gap-2 group relative"
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
                      animate={{ height: `${Math.max(pct, 4)}%` }}
                      transition={{ delay: i * 0.06, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-xl hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer min-h-[4px]"
                    />
                    <span className="text-[10px] font-bold text-gray-400">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Three Column: Recent Blogs + Events + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Recent Blogs */}
          <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                <FileText size={18} className="text-indigo-500" />
                Recent Blogs
              </h3>
              <Link
                href="/blogs"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            {(!data?.recentBlogs || data.recentBlogs.length === 0) ? (
              <p className="text-sm text-gray-300 font-medium">No blogs yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentBlogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blogs/${blog.id}`}
                    className="group flex items-start gap-3 p-3 -mx-3 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {blog.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[blog.status] || "bg-gray-100 text-gray-500"}`}>
                          {blog.status}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {new Date(blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                <Calendar size={18} className="text-orange-500" />
                Upcoming Events
              </h3>
              <Link
                href="/events"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            {(!data?.upcomingEvents || data.upcomingEvents.length === 0) ? (
              <p className="text-sm text-gray-300 font-medium">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/events"
                    className="group flex items-start gap-3 p-3 -mx-3 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-orange-50 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-orange-600 uppercase leading-none">
                        {event.date
                          ? new Date(event.date).toLocaleDateString("en-US", { month: "short" })
                          : "TBD"}
                      </span>
                      <span className="text-sm font-black text-orange-700 leading-none">
                        {event.date
                          ? new Date(event.date).getDate()
                          : "-"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {event.title}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] || "bg-gray-100 text-gray-500"}`}>
                        {event.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-black mb-1 tracking-tight">Quick Actions</h3>
              <p className="text-blue-200 text-xs font-medium mb-8">Jump to any section</p>

              <div className="grid grid-cols-2 gap-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex flex-col gap-2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all"
                  >
                    <link.icon size={18} className="text-white/80 group-hover:text-white" />
                    <div>
                      <p className="text-xs font-black text-white">{link.label}</p>
                      <p className="text-[10px] font-medium text-blue-200/70">{link.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute right-[-15%] bottom-[-15%] w-56 h-56 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute left-[-10%] top-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          </div>
        </div>

        {/* System Status Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-gray-900">All Systems Operational</p>
                <p className="text-xs font-medium text-gray-400">Media storage, database sync, and CMS are active</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                Media: Active
              </span>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                Sync: Real-time
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
