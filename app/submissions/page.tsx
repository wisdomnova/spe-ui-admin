"use client";

import { motion } from "framer-motion";
import { Inbox, Search, Trash2, Mail, Calendar, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Submission {
  id: string;
  email: string;
  created_at: string;
  status: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) setSubmissions(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Read" }),
      });
      if (res.ok) {
        setSubmissions(submissions.map(s => s.id === id ? { ...s, status: "Read" } : s));
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      if (res.ok) setSubmissions(submissions.filter(s => s.id !== id));
    } catch {}
  };

  const filteredSubmissions = submissions.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Submissions</h2>
            <p className="text-gray-500 font-medium">Manage newsletter and contact form entries.</p>
          </div>
        </header>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 text-gray-400 focus-within:border-blue-200 transition-colors">
            <Search size={18} />
            <input type="text" placeholder="Search by email..." className="bg-transparent border-0 outline-none text-sm font-bold text-gray-900 w-full placeholder:text-gray-200" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Quick Newsletter Sign-up Preview Section */}
        <div className="mb-12 bg-blue-600 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h3 className="text-3xl font-black mb-4">Stay Connected!</h3>
            <p className="text-blue-100 font-bold mb-8">This is how your visitors see the subscription form.</p>
            
            <div className="flex gap-4 mb-4">
              <input 
                type="email" 
                placeholder="Enter Your Email" 
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 font-bold text-sm placeholder:text-white/40 outline-none focus:bg-white/20 transition-all"
                disabled
              />
              <button 
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                disabled
              >
                Submit
              </button>
            </div>
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none">
              By Clicking Submit, you acknowledge that we are trust worthy
            </p>
          </div>
          <Mail className="absolute right-[-5%] bottom-[-10%] w-96 h-96 text-white/5 rotate-12" />
        </div>

        {/* Submission List */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <Inbox size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">No submissions yet</h3>
            <p className="text-gray-400 font-medium mt-1">
              {searchQuery ? "No results match your search." : "Newsletter sign-ups will appear here."}
            </p>
          </div>
        ) : (
        <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                  <th className="px-10 py-8">User Email</th>
                  <th className="px-10 py-8">Submitted On</th>
                  <th className="px-10 py-8">Status</th>
                  <th className="px-10 py-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3 font-bold text-gray-900">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                           <Mail size={14} />
                        </div>
                        {sub.email}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                         <Clock size={14} className="text-gray-200" />
                         {formatDate(sub.created_at)}
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                         sub.status === 'New' ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-gray-400 border-gray-100 bg-white'
                       }`}>
                         {sub.status}
                       </span>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleMarkRead(sub.id)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><CheckCircle2 size={16} /></button>
                         <button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </motion.div>
    </div>
  );
}
