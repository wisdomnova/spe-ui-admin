"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Star, Trash2, Edit2, Share2, Search, Filter, X, Check, Loader2 } from "lucide-react";
import MemberPickerModal from "@/components/cms/MemberPickerModal";

interface Spotlight {
  id: string;
  team_member_id: string;
  tags: string[];
  created_at: string;
  team_member: {
    id: string;
    name: string;
    role: string;
    department: string;
    image_url: string | null;
  } | null;
}

export default function SpotlightPage() {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formTags, setFormTags] = useState("");

  useEffect(() => {
    fetchSpotlights();
  }, []);

  const fetchSpotlights = async () => {
    try {
      const res = await fetch("/api/spotlight");
      if (res.ok) setSpotlights(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setShowMemberPicker(false);
  };

  const handleCreate = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_member_id: selectedMember.id,
          tags: formTags.split(",").map((t: string) => t.trim()).filter((t: string) => t),
        }),
      });
      if (res.ok) {
        const newSpotlight = await res.json();
        setSpotlights([newSpotlight, ...spotlights]);
        setShowCreateModal(false);
        setSelectedMember(null);
        setFormTags("");
      }
    } catch {} finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/spotlight/${id}`, { method: "DELETE" });
      if (res.ok) setSpotlights(spotlights.filter(s => s.id !== id));
    } catch {}
  };

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
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Spotlight</h2>
            <p className="text-gray-500 font-medium">Showcase exceptional members of our community.</p>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all outline-none"
          >
            <Plus size={18} />
            New Spotlight
          </button>
        </header>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 text-gray-400 focus-within:border-blue-200 transition-colors">
            <Search size={18} />
            <input type="text" placeholder="Search members..." className="bg-transparent border-0 outline-none text-sm font-bold text-gray-900 w-full placeholder:text-gray-200" />
          </div>
        </div>

        {spotlights.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <Star size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">No spotlights yet</h3>
            <p className="text-gray-400 font-medium mt-1">Showcase an exceptional member to get started.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spotlights.map((spotlight, i) => (
            <motion.div 
              key={spotlight.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-blue-200/20 transition-all group flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Profile Image */}
              <div className="w-32 h-32 rounded-[3.5rem] bg-blue-50 relative mb-6 overflow-hidden border-4 border-white shadow-xl shadow-blue-100/50">
                 {spotlight.team_member?.image_url ? (
                   <img src={spotlight.team_member.image_url} alt={spotlight.team_member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={48} /></div>
                 )}
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-2xl font-black text-gray-900 leading-none">{spotlight.team_member?.name || "Unknown"}</h3>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{spotlight.team_member?.role || ""}</p>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{spotlight.team_member?.department || ""}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {(spotlight.tags || []).map(tag => (
                  <span key={tag} className="text-[9px] font-black text-gray-400 border border-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{tag}</span>
                ))}
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2 pt-6 border-t border-gray-50 w-full justify-center">
                <button className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-2xl outline-none">
                  <Edit2 size={16} />
                </button>
                <button className="p-3 text-gray-300 hover:text-green-600 hover:bg-green-50 transition-all rounded-2xl outline-none">
                   <Share2 size={16} />
                </button>
                <button onClick={() => handleDelete(spotlight.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all rounded-2xl outline-none">
                   <Trash2 size={16} />
                </button>
              </div>

              {/* Spotlight Badge */}
              <div className="absolute top-6 right-6 text-blue-100 group-hover:text-blue-600 transition-colors">
                 <Star size={24} fill="currentColor" />
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </motion.div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900">New Spotlight</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 outline-none">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowMemberPicker(true)}
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex items-center gap-4 hover:bg-blue-50/50 hover:border-blue-100 transition-all outline-none"
                  >
                    {selectedMember?.image_url ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img src={selectedMember.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <User size={20} />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
                        {selectedMember?.name || "Pick Member"}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        {selectedMember?.role || "Click to browse team"}
                      </p>
                    </div>
                  </button>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tags (Comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Design, Frontend, UI" 
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none placeholder-gray-300"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCreate}
                  disabled={submitting || !selectedMember}
                  className="w-full bg-gray-900 text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl outline-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Confirm Spotlight'}
                  {!submitting && <Check size={16} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MemberPickerModal 
        isOpen={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        onSelect={handleMemberSelect}
      />
    </div>
  );
}

