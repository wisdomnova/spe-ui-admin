"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DashboardData {
  stats: { members: number; blogs: number; events: number; submissions: number };
  recentBlogs: { id: string; title: string; status: string }[];
  upcomingEvents: { id: string; title: string; date: string }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  const stats = [
    { label: "Total Members", value: String(data?.stats.members ?? 0), trend: "Active" },
    { label: "Blog Posts", value: String(data?.stats.blogs ?? 0), trend: "Published" },
    { label: "Active Events", value: String(data?.stats.events ?? 0), trend: "Upcoming" },
    { label: "Submissions", value: String(data?.stats.submissions ?? 0), trend: "Inbox" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <header className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Overview</h2>
          <p className="text-gray-500 font-medium">Welcome to the SPEUI Administrative Control Center.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all group">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{stat.value}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Content Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">Recent Blogs</p>
                {(data?.recentBlogs ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">No blogs yet</p>
                ) : (
                  data!.recentBlogs.map((blog) => (
                    <div key={blog.id} className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <p className="font-bold text-gray-900 text-sm">{blog.title}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-6">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 pb-2">Upcoming Events</p>
                {(data?.upcomingEvents ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">No upcoming events</p>
                ) : (
                  data!.upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <p className="font-bold text-gray-900 text-sm">{event.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 p-10 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 tracking-tight">Active CMS</h3>
              <p className="text-blue-100 font-bold text-sm">Chapter administrative controls are fully active.</p>
            </div>
            <div className="mt-8 space-y-4 relative z-10">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <span>Media Storage</span>
                <span>Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <span>System Sync</span>
                <span>Real-time</span>
              </div>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
