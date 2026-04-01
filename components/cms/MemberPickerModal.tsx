"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, User, Loader2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
}

interface MemberPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (member: Member) => void;
}

export default function MemberPickerModal({ isOpen, onClose, onSelect }: MemberPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && members.length === 0) {
      setLoading(true);
      fetch("/api/team")
        .then(r => r.ok ? r.json() : [])
        .then(data => setMembers(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Select Member</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 outline-none placeholder-gray-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelect(member)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-blue-50/50 rounded-2xl transition-all group border border-transparent hover:border-blue-100"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{member.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{member.role}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={16} className="text-blue-600" />
                  </div>
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <User size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-300">No members found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
