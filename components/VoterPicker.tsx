"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Check,
  Users,
  Loader2,
  UserPlus,
  Filter,
} from "lucide-react";

interface PoolVoter {
  id: string;
  name: string;
  matric_number: string;
  email: string;
  level: string | null;
  department: string | null;
}

interface VoterPickerProps {
  /** IDs of voters already assigned to the election */
  assignedVoterIds: Set<string>;
  /** Called when user confirms selection */
  onAssign: (voterIds: string[]) => Promise<void>;
  /** Close the picker */
  onClose: () => void;
}

export default function VoterPicker({ assignedVoterIds, onAssign, onClose }: VoterPickerProps) {
  const [voters, setVoters] = useState<PoolVoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const fetchVoters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (levelFilter) params.set("level", levelFilter);
      params.set("limit", "1000");
      const res = await fetch(`/api/voters?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVoters(data.voters);
      }
    } catch {}
    setLoading(false);
  }, [search, levelFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchVoters, 300);
    return () => clearTimeout(timeout);
  }, [fetchVoters]);

  // Filter out already assigned voters
  const available = voters.filter((v) => !assignedVoterIds.has(v.id));
  const uniqueLevels = [...new Set(voters.map((v) => v.level).filter(Boolean))] as string[];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === available.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(available.map((v) => v.id)));
    }
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setAssigning(true);
    await onAssign([...selected]);
    setAssigning(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <UserPlus size={18} className="text-blue-500" />
              Assign Voters
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search voters..."
                autoFocus
                className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 outline-none"
            >
              <option value="">All Levels</option>
              {uniqueLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Select all + count */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                disabled={available.length === 0}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-300 transition-colors"
              >
                {selected.size === available.length && available.length > 0 ? "Deselect All" : "Select All"}
              </button>
              <span className="text-xs font-medium text-gray-400">
                {available.length} available · {selected.size} selected
              </span>
            </div>
            {voters.length > 0 && voters.length > available.length && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {voters.length - available.length} already assigned
              </span>
            )}
          </div>
        </div>

        {/* Voter List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Users size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-bold text-sm">
                {voters.length === 0
                  ? "No voters in the pool yet"
                  : search
                  ? "No matching voters available"
                  : "All voters are already assigned"}
              </p>
              <p className="text-gray-300 text-xs mt-1">
                {voters.length === 0
                  ? "Go to Voters page to add voters first."
                  : ""}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {available.map((voter) => (
                <button
                  key={voter.id}
                  onClick={() => toggleSelect(voter.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-blue-50/50 transition-colors ${
                    selected.has(voter.id) ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected.has(voter.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {selected.has(voter.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 truncate">{voter.name}</span>
                      <span className="text-[11px] font-medium text-gray-400">{voter.matric_number}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{voter.email}</span>
                      {voter.level && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          L{voter.level}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={selected.size === 0 || assigning}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
          >
            {assigning ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Assign {selected.size > 0 ? `${selected.size} Voter${selected.size > 1 ? "s" : ""}` : "Voters"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
