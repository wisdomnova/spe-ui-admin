"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  Mail,
  UserPlus,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Image as ImageIcon,
  MoreVertical,
  Loader2,
  Upload
} from "lucide-react";
import MediaPickerModal from "@/components/cms/MediaPickerModal";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  linkedin?: string | null;
  twitter?: string | null;
  image_url: string | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "Leadership",
    email: "",
    linkedin: "",
    twitter: "",
    image_url: ""
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) setMembers(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.role) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newMember = await res.json();
        setMembers([newMember, ...members]);
        setShowAddModal(false);
        setFormData({ name: "", role: "", department: "Leadership", email: "", linkedin: "", twitter: "", image_url: "" });
      }
    } catch {} finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (res.ok) setMembers(members.filter(m => m.id !== id));
    } catch {}
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Main Chapter Team</h2>
            <p className="text-gray-500 font-medium">Add or manage members displayed on the public website.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200">
            <UserPlus size={18} />
            Add Team Member
          </button>
        </header>

        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 text-gray-400 mb-10">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or role..." 
            className="bg-transparent border-0 outline-none text-sm font-bold text-gray-900 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <UserPlus size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">No team members</h3>
            <p className="text-gray-400 font-medium mt-1">
              {searchQuery ? "Try adjusting your search." : "Add your first member to get started."}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMembers.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm relative group overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl overflow-hidden mb-4 shadow-lg border-2 border-white group-hover:scale-105 transition-transform">
                  <img src={member.image_url || '/placeholder.png'} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{member.name}</h3>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">{member.role}</p>
                <div className="flex gap-2 mb-6">
                  {member.linkedin && <LinkedinIcon size={16} className="text-gray-300 hover:text-blue-700 cursor-pointer" />}
                  {member.twitter && <TwitterIcon size={16} className="text-gray-300 hover:text-blue-400 cursor-pointer" />}
                  <Mail size={16} className="text-gray-300 hover:text-gray-600 cursor-pointer" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{member.department}</span>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(member.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">New Chapter Member</h3>
                <button onClick={() => setShowAddModal(false)}><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Name</label>
                    <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 font-bold text-sm" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Role</label>
                    <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 font-bold text-sm" placeholder="e.g. President" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Department</label>
                    <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 font-bold text-sm" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      <option>Leadership</option>
                      <option>Engineering</option>
                      <option>Events</option>
                      <option>Communication</option>
                    </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Email</label>
                  <input type="email" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 font-bold text-sm" placeholder="email@speui.org" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Member Image</label>
                  {formData.image_url ? (
                    <div className="relative group w-full h-40 rounded-2xl overflow-hidden border border-gray-100 mb-3">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setFormData({...formData, image_url: ""})} className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"><X size={14} className="text-red-500" /></button>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowMediaPicker(true)} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100 transition-colors">
                      <ImageIcon size={14} />
                      Pick from Library
                    </button>
                    <button type="button" onClick={() => {
                      const url = prompt('Paste image URL (Google Drive, etc.)');
                      if (url) setFormData({...formData, image_url: url});
                    }} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">
                      <Upload size={14} />
                      Paste URL
                    </button>
                  </div>
                  {formData.image_url && (
                    <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3 font-bold text-sm mt-2 text-xs text-gray-400" value={formData.image_url} readOnly />
                  )}
                </div>
                <button onClick={handleAdd} disabled={submitting} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Member'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(file: any) => {
          setFormData({...formData, image_url: file.url});
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}
