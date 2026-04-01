"use client";

import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <header className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Overview</h2>
          <p className="text-gray-500 font-medium">Welcome to the SPEUI Administrative Control Center.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Total Members", value: "482", trend: "+12%" },
            { label: "Active Resources", value: "128", trend: "+4%" },
            { label: "Events Scheduled", value: "8", trend: "Upcoming" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all group">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{stat.value}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">New member joined</p>
                    <p className="text-sm text-gray-400">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-600 p-10 rounded-[2.5rem] shadow-xl shadow-blue-200 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">System Status</h3>
              <p className="text-blue-100 font-medium opacity-80 text-sm">All administrative modules are currently online and operational.</p>
            </div>
            <div className="mt-8 flex gap-4">
              <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-sm">Server: Stable</div>
              <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-sm">Database: Sync</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
