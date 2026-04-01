"use client";

import { motion } from "framer-motion";
import { Briefcase, Search, Trash2, Mail, Calendar, CheckCircle2, Clock, Loader2, User, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SponsorSubmission {
  id: string;
  name: string;
  email: string;
  organization: string;
  created_at: string;
  status: string;
}

export default function SponsorsPage() {
  const [submissions, setSubmissions] = useState<SponsorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/sponsors");
      if (res.ok) setSubmissions(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/sponsors/${id}`, {
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
      const res = await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
      if (res.ok) setSubmissions(submissions.filter(s => s.id !== id));
    } catch {}
  };

  const filteredSubmissions = submissions.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.organization.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Sponsor Requests</h2>
            <p className="text-gray-500 font-medium">Manage brochure download requests from potential sponsors.</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest">
              {submissions.filter(s => s.status === "New").length} New
            </span>
            <span className="px-4 py-2 rounded-2xl bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest">
              {submissions.length} Total
            </span>
          </div>
        </header>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 text-gray-400 focus-within:border-blue-200 transition-colors">
            <Search size={18} />
            <input type="text" placeholder="Search by name, email, or organization..." className="bg-transparent border-0 outline-none text-sm font-bold text-gray-900 w-full placeholder:text-gray-200" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
              <Briefcase size={32} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-300 mb-2">No Sponsor Requests</h3>
            <p className="text-sm font-medium text-gray-300">
              {searchQuery ? "No results match your search." : "Brochure requests from the sponsor page will appear here."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                    <th className="px-6 sm:px-10 py-8">Contact</th>
                    <th className="px-6 sm:px-10 py-8 hidden md:table-cell">Organization</th>
                    <th className="px-6 sm:px-10 py-8 hidden sm:table-cell">Submitted</th>
                    <th className="px-6 sm:px-10 py-8">Status</th>
                    <th className="px-6 sm:px-10 py-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 sm:px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <User size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{sub.name}</p>
                            <p className="text-xs font-medium text-gray-400 truncate">{sub.email}</p>
                            <p className="text-xs font-medium text-gray-300 truncate md:hidden">{sub.organization}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <Building2 size={14} className="text-gray-300" />
                          {sub.organization}
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                          <Clock size={14} className="text-gray-200" />
                          {formatDate(sub.created_at)}
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-6">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                          sub.status === 'New' ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-gray-400 border-gray-100 bg-white'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 sm:px-10 py-6">
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleMarkRead(sub.id)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors" title="Mark as read"><CheckCircle2 size={16} /></button>
                          <button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
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
