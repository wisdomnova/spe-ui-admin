"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Vote,
  Users,
  Crown,
  ChevronRight,
  ArrowLeft,
  UserPlus,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Calendar,
  Clock,
  Timer,
  Pencil,
  BarChart3,
  Trophy,
  TrendingUp,
  Minus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Upload,
  FileDown,
} from "lucide-react";
import VoterPicker from "@/components/VoterPicker";
import MediaPickerModal from "@/components/cms/MediaPickerModal";

/* ── Types ── */
interface Election {
  id: string;
  title: string;
  description: string | null;
  status: "Draft" | "Active" | "Completed";
  is_open: boolean;
  election_date: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  positions_count: number;
  candidates_count: number;
  voters_count: number;
}

interface Position {
  id: string;
  election_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface Candidate {
  id: string;
  election_id: string;
  position_id: string;
  name: string;
  matric_number: string | null;
  image_url: string | null;
  manifesto: string | null;
}

interface MediaFile {
  id: string;
  name: string;
  url: string;
}

interface CandidateDraft {
  id: string;
  name: string;
  image_url: string;
  bio: string;
}

interface Voter {
  assignment_id: string;
  election_id: string;
  voter_id: string;
  name: string;
  matric_number: string;
  email: string;
  level: string | null;
  department: string | null;
  has_voted: boolean;
  assigned_at: string;
}

interface ElectionDetail extends Election {
  positions: Position[];
  candidates: Candidate[];
  voters: Voter[];
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Active: "bg-green-50 text-green-700",
  Completed: "bg-blue-50 text-blue-700",
  Ongoing: "bg-emerald-50 text-emerald-700",
  Scheduled: "bg-amber-50 text-amber-700",
};

/* ── Helpers ── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatTime12(time24: string) {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function formatDateNice(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Computes a live display status based on date+time */
function computeDisplayStatus(election: { status: string; election_date: string | null; start_time: string | null; end_time: string | null }) {
  // Respect explicit admin override to Completed
  if (election.status === "Completed") return "Completed";
  if (!election.election_date || !election.start_time || !election.end_time) return election.status;

  const today = todayStr();
  const now = nowTimeStr();

  if (election.election_date > today) return "Scheduled";
  if (election.election_date < today) return "Completed";
  // election_date === today
  if (now < election.start_time) return "Scheduled";
  if (now >= election.start_time && now < election.end_time) return "Ongoing";
  return "Completed";
}

/** Client-side validation for date/time */
function validateSchedule(date: string, startTime: string, endTime: string): string | null {
  if (!date || !startTime || !endTime) return "All schedule fields are required.";
  const today = todayStr();
  if (date < today) return "Election date cannot be in the past.";
  if (startTime === endTime) return "Start and end time cannot be the same.";
  if (endTime <= startTime) return "End time must be after start time.";
  if (date === today) {
    const now = nowTimeStr();
    if (startTime < now) return "Start time has already passed. Pick a future time or a later date.";
  }
  return null;
}

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ElectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/elections");
      if (res.ok) setElections(await res.json());
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreateError("");

    // Validate schedule if any field is filled
    if (newDate || newStartTime || newEndTime) {
      const err = validateSchedule(newDate, newStartTime, newEndTime);
      if (err) { setCreateError(err); return; }
    }

    setCreating(true);
    try {
      const res = await fetch("/api/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          election_date: newDate || null,
          start_time: newStartTime || null,
          end_time: newEndTime || null,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        setNewDate("");
        setNewStartTime("");
        setNewEndTime("");
        setCreateError("");
        setShowCreate(false);
        fetchElections();
      } else {
        const d = await res.json();
        setCreateError(d.error || "Failed to create");
      }
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this election and all its data? This cannot be undone.")) return;
    await fetch(`/api/elections/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    fetchElections();
  };

  const openElection = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/elections/${id}`);
      if (res.ok) setSelected(await res.json());
    } catch {}
    setDetailLoading(false);
  };

  const refreshDetail = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/elections/${selected.id}`);
      if (res.ok) setSelected(await res.json());
    } catch {}
  };

  // ── LIST VIEW ──
  if (!selected) {
    return (
      <div className="p-4 sm:p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Elections</h2>
              </div>
              <p className="text-gray-500 font-medium">Manage electoral sessions, candidates, and voter rolls.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <Plus size={18} /> New Election
            </button>
          </header>

          {/* Create Dialog */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6">Create Election</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title *</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. 2026 Executive Election"
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Optional description..."
                        rows={2}
                        className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>

                    {/* Schedule Fields */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={10} /> Schedule
                        <span className="text-gray-300 normal-case font-medium">(optional - set later)</span>
                      </label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400">Date</label>
                          <input
                            type="date"
                            value={newDate}
                            min={todayStr()}
                            onChange={(e) => { setNewDate(e.target.value); setCreateError(""); }}
                            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400">Start Time</label>
                          <input
                            type="time"
                            value={newStartTime}
                            onChange={(e) => { setNewStartTime(e.target.value); setCreateError(""); }}
                            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400">End Time</label>
                          <input
                            type="time"
                            value={newEndTime}
                            onChange={(e) => { setNewEndTime(e.target.value); setCreateError(""); }}
                            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Validation error */}
                    {createError && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium">
                        <AlertCircle size={14} /> {createError}
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => { setShowCreate(false); setCreateError(""); }}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!newTitle.trim() || creating}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Elections List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : elections.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <Vote size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">No elections yet</p>
              <p className="text-gray-300 text-sm mt-1">Create your first electoral session to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {elections.map((election) => {
                const displayStatus = computeDisplayStatus(election);
                return (
                <motion.div
                  key={election.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openElection(election.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {election.title}
                        </h3>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${STATUS_COLORS[displayStatus] || STATUS_COLORS.Draft}`}>
                          {displayStatus}
                        </span>
                      </div>
                      {election.description && (
                        <p className="text-sm text-gray-400 font-medium truncate mb-3">{election.description}</p>
                      )}
                      <div className="flex items-center gap-6 flex-wrap">
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <Briefcase size={13} /> {election.positions_count} position{election.positions_count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <Crown size={13} /> {election.candidates_count} candidate{election.candidates_count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <Users size={13} /> {election.voters_count} voter{election.voters_count !== 1 ? "s" : ""}
                        </span>
                        {election.election_date && election.start_time && election.end_time && (
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                            <Calendar size={13} /> {formatDateNice(election.election_date)} · {formatTime12(election.start_time)} – {formatTime12(election.end_time)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setTogglingId(election.id);
                          const newVal = !election.is_open;
                          setElections((prev) => prev.map((el) => el.id === election.id ? { ...el, is_open: newVal } : el));
                          try {
                            await fetch(`/api/elections/${election.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ is_open: newVal }),
                            });
                          } catch {}
                          setTogglingId(null);
                        }}
                        disabled={togglingId === election.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          election.is_open
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        } ${togglingId === election.id ? "opacity-50 pointer-events-none" : ""}`}
                        title={election.is_open ? "Close election" : "Open election"}
                      >
                        {togglingId === election.id ? <Loader2 size={18} className="animate-spin" /> : election.is_open ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {election.is_open ? "Open" : "Closed"}
                      </button>
                      <button
                        onClick={() => handleDelete(election.id)}
                        className="p-2.5 rounded-xl text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => openElection(election.id)}
                        className="p-2.5 rounded-xl text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Manage"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (detailLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <ElectionDetail
      election={selected}
      onBack={() => { setSelected(null); fetchElections(); }}
      onRefresh={refreshDetail}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ELECTION DETAIL VIEW
   ══════════════════════════════════════════════════════════════════════ */

function ElectionDetail({
  election,
  onBack,
  onRefresh,
}: {
  election: ElectionDetail;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"positions" | "candidates" | "voters" | "results">("positions");
  const [status, setStatus] = useState(election.status);
  const [isOpen, setIsOpen] = useState(election.is_open ?? false);
  const [saving, setSaving] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [schedDate, setSchedDate] = useState(election.election_date || "");
  const [schedStart, setSchedStart] = useState(election.start_time?.slice(0, 5) || "");
  const [schedEnd, setSchedEnd] = useState(election.end_time?.slice(0, 5) || "");
  const [schedError, setSchedError] = useState("");
  const [schedSaving, setSchedSaving] = useState(false);

  // Sync local state when election prop updates (from silent refresh)
  useEffect(() => {
    setStatus(election.status);
    setIsOpen(election.is_open ?? false);
    if (!editingSchedule) {
      setSchedDate(election.election_date || "");
      setSchedStart(election.start_time?.slice(0, 5) || "");
      setSchedEnd(election.end_time?.slice(0, 5) || "");
    }
  }, [election]);

  const displayStatus = useMemo(() => computeDisplayStatus(election), [election]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    setStatus(newStatus as Election["status"]);
    try {
      await fetch(`/api/elections/${election.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch {}
    setSaving(false);
  };

  const handleToggleOpen = async () => {
    setTogglingOpen(true);
    const newVal = !isOpen;
    setIsOpen(newVal);
    try {
      await fetch(`/api/elections/${election.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: newVal }),
      });
      onRefresh();
    } catch {}
    setTogglingOpen(false);
  };

  const handleScheduleSave = async () => {
    setSchedError("");
    const err = validateSchedule(schedDate, schedStart, schedEnd);
    if (err) { setSchedError(err); return; }

    setSchedSaving(true);
    const res = await fetch(`/api/elections/${election.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_date: schedDate, start_time: schedStart, end_time: schedEnd }),
    });
    if (res.ok) {
      setEditingSchedule(false);
      setSchedError("");
      onRefresh();
    } else {
      const d = await res.json();
      setSchedError(d.error || "Failed to update schedule");
    }
    setSchedSaving(false);
  };

  const handleClearSchedule = async () => {
    setSchedSaving(true);
    const res = await fetch(`/api/elections/${election.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_date: null, start_time: null, end_time: null }),
    });
    if (res.ok) {
      setSchedDate("");
      setSchedStart("");
      setSchedEnd("");
      setEditingSchedule(false);
      onRefresh();
    }
    setSchedSaving(false);
  };

  const TABS = [
    { key: "positions" as const, label: "Positions", icon: Briefcase, count: election.positions.length },
    { key: "candidates" as const, label: "Candidates", icon: Crown, count: election.candidates.length },
    { key: "voters" as const, label: "Voters", icon: Users, count: election.voters.length },
    { key: "results" as const, label: "Results", icon: BarChart3, count: null },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        {/* Back + Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Elections
        </button>

        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{election.title}</h2>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${STATUS_COLORS[displayStatus] || STATUS_COLORS.Draft}`}>
                {displayStatus}
              </span>
            </div>
            {election.description && <p className="text-gray-500 font-medium mt-1">{election.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOpen}
              disabled={togglingOpen}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                isOpen
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              } ${togglingOpen ? "opacity-50 pointer-events-none" : ""}`}
            >
              {togglingOpen ? <Loader2 size={18} className="animate-spin" /> : isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {isOpen ? "Open" : "Closed"}
            </button>
            <select
              value={status}
              disabled={saving}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-0 cursor-pointer ${STATUS_COLORS[status]} ${saving ? "opacity-50 pointer-events-none" : ""}`}
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </header>

        {/* Schedule Card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Timer size={14} className="text-blue-500" /> Schedule
            </h3>
            {!editingSchedule && (
              <button
                onClick={() => {
                  setSchedDate(election.election_date || "");
                  setSchedStart(election.start_time?.slice(0, 5) || "");
                  setSchedEnd(election.end_time?.slice(0, 5) || "");
                  setSchedError("");
                  setEditingSchedule(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Pencil size={12} /> {election.election_date ? "Edit" : "Set Schedule"}
              </button>
            )}
          </div>

          {!editingSchedule ? (
            election.election_date && election.start_time && election.end_time ? (
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{formatDateNice(election.election_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{formatTime12(election.start_time.slice(0, 5))}</span>
                  <span className="text-gray-400">–</span>
                  <span className="text-sm font-bold text-gray-700">{formatTime12(election.end_time.slice(0, 5))}</span>
                </div>
                {displayStatus === "Ongoing" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full animate-pulse">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Live Now
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium">No schedule set. Click &quot;Set Schedule&quot; to pick a date and time.</p>
            )
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400">Election Date</label>
                  <input
                    type="date"
                    value={schedDate}
                    min={todayStr()}
                    onChange={(e) => { setSchedDate(e.target.value); setSchedError(""); }}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400">Start Time</label>
                  <input
                    type="time"
                    value={schedStart}
                    onChange={(e) => { setSchedStart(e.target.value); setSchedError(""); }}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400">End Time</label>
                  <input
                    type="time"
                    value={schedEnd}
                    onChange={(e) => { setSchedEnd(e.target.value); setSchedError(""); }}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {schedError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium">
                  <AlertCircle size={14} /> {schedError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleScheduleSave}
                  disabled={schedSaving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {schedSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Save Schedule
                </button>
                <button
                  onClick={() => { setEditingSchedule(false); setSchedError(""); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {election.election_date && (
                  <button
                    onClick={handleClearSchedule}
                    disabled={schedSaving}
                    className="ml-auto text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                  >
                    Clear Schedule
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm mb-8 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.count !== null && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-gray-100"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "positions" && (
          <PositionsTab electionId={election.id} positions={election.positions} onRefresh={onRefresh} />
        )}
        {tab === "candidates" && (
          <CandidatesTab electionId={election.id} positions={election.positions} candidates={election.candidates} onRefresh={onRefresh} />
        )}
        {tab === "voters" && (
          <VotersTab electionId={election.id} voters={election.voters} onRefresh={onRefresh} />
        )}
        {tab === "results" && (
          <ResultsTab electionId={election.id} />
        )}
      </motion.div>
    </div>
  );
}

/* ── Positions Tab ── */
function PositionsTab({ electionId, positions, onRefresh }: { electionId: string; positions: Position[]; onRefresh: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [items, setItems] = useState<Position[]>(positions);
  const [editing, setEditing] = useState<Position | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setItems(positions);
  }, [positions]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/elections/${electionId}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: desc.trim() || null, sort_order: items.length }),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      setTitle("");
      setDesc("");
      onRefresh();
    }
    setAdding(false);
  };

  const handleDelete = async (positionId: string) => {
    if (!confirm("Delete this position and all its candidates?")) return;
    const prevItems = items;
    setItems((prev) => prev.filter((pos) => pos.id !== positionId));
    const res = await fetch(`/api/elections/${electionId}/positions?position_id=${positionId}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prevItems);
      return;
    }
    onRefresh();
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    setEditTitle(pos.title);
    setEditDesc(pos.description || "");
  };

  const handleEditSave = async () => {
    if (!editing || !editTitle.trim()) return;
    setSavingEdit(true);
    const payload = {
      position_id: editing.id,
      title: editTitle.trim(),
      description: editDesc.trim() || null,
    };
    const prevItems = items;
    setItems((prev) =>
      prev.map((pos) => (pos.id === editing.id ? { ...pos, title: payload.title, description: payload.description } : pos))
    );
    const res = await fetch(`/api/elections/${electionId}/positions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setItems(prevItems);
      setSavingEdit(false);
      return;
    }
    setEditing(null);
    setSavingEdit(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Add Position</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. President"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!title.trim() || adding}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shrink-0"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>
        {items.length > 0 && (
          <p className="text-xs text-gray-400 font-medium mt-3">
            Use the edit and delete actions on each position card to manage existing positions.
          </p>
        )}
      </div>

      {/* Positions list */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
          <Briefcase size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold text-sm">No positions added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((pos, i) => (
            <div key={pos.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-50 shadow-sm group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-300">#{i + 1}</span>
                  <h4 className="font-bold text-gray-900">{pos.title}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(pos)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Edit position"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(pos.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Delete position"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {pos.description && <p className="text-xs text-gray-400 font-medium">{pos.description}</p>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-gray-900">Edit Position</h3>
                <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Position Title *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={!editTitle.trim() || savingEdit}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Candidates Tab ── */
function CandidatesTab({
  electionId,
  positions,
  candidates,
  onRefresh,
}: {
  electionId: string;
  positions: Position[];
  candidates: Candidate[];
  onRefresh: () => void;
}) {
  const [items, setItems] = useState<Candidate[]>(candidates);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [positionId, setPositionId] = useState(positions[0]?.id || "");
  const [drafts, setDrafts] = useState<CandidateDraft[]>([
    { id: crypto.randomUUID(), name: "", image_url: "", bio: "" },
  ]);
  const [activeMediaDraftId, setActiveMediaDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(candidates);
  }, [candidates]);

  useEffect(() => {
    if (!positionId && positions[0]?.id) {
      setPositionId(positions[0].id);
    }
  }, [positions, positionId]);

  const resetForm = () => {
    setEditingId(null);
    setPositionId(positions[0]?.id || "");
    setDrafts([{ id: crypto.randomUUID(), name: "", image_url: "", bio: "" }]);
    setActiveMediaDraftId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setPositionId(candidate.position_id);
    setDrafts([
      {
        id: crypto.randomUUID(),
        name: candidate.name,
        image_url: candidate.image_url || "",
        bio: candidate.manifesto || "",
      },
    ]);
    setShowModal(true);
  };

  const addDraftRow = () => {
    setDrafts((prev) => [...prev, { id: crypto.randomUUID(), name: "", image_url: "", bio: "" }]);
  };

  const removeDraftRow = (draftId: string) => {
    setDrafts((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== draftId)));
  };

  const updateDraft = (draftId: string, patch: Partial<CandidateDraft>) => {
    setDrafts((prev) => prev.map((row) => (row.id === draftId ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    if (!positionId) return;
    setSaving(true);
    const validDrafts = drafts
      .map((row) => ({
        ...row,
        name: row.name.trim(),
        image_url: row.image_url.trim(),
        bio: row.bio.trim(),
      }))
      .filter((row) => row.name);

    if (!editingId) {
      if (validDrafts.length === 0) {
        setSaving(false);
        return;
      }
      const createRequests = validDrafts.map((row) =>
        fetch(`/api/elections/${electionId}/candidates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position_id: positionId,
            name: row.name,
            image_url: row.image_url || null,
            manifesto: row.bio || null,
          }),
        })
      );
      const results = await Promise.all(createRequests);
      if (!results.every((res) => res.ok)) {
        setSaving(false);
        return;
      }
      const createdItems = await Promise.all(results.map((res) => res.json()));
      setItems((prev) => [...prev, ...createdItems]);
    } else {
      const single = validDrafts[0];
      if (!single) {
        setSaving(false);
        return;
      }
      const prevItems = items;
      const patch = {
        position_id: positionId,
        name: single.name,
        image_url: single.image_url || null,
        manifesto: single.bio || null,
      };
      setItems((prev) => prev.map((cand) => (cand.id === editingId ? { ...cand, ...patch } : cand)));
      const res = await fetch(`/api/elections/${electionId}/candidates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: editingId, ...patch }),
      });
      if (!res.ok) {
        setItems(prevItems);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setShowModal(false);
    resetForm();
    onRefresh();
  };

  const handleDelete = async (candidateId: string) => {
    if (!confirm("Remove this candidate?")) return;
    const prevItems = items;
    setItems((prev) => prev.filter((cand) => cand.id !== candidateId));
    const res = await fetch(`/api/elections/${electionId}/candidates?candidate_id=${candidateId}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prevItems);
      return;
    }
    onRefresh();
  };

  // Group candidates by position
  const normalizedSearch = search.trim().toLowerCase();
  const grouped = positions
    .filter((pos) => positionFilter === "all" || pos.id === positionFilter)
    .map((pos) => ({
    position: pos,
    candidates: items.filter((c) => {
      if (c.position_id !== pos.id) return false;
      if (!normalizedSearch) return true;
      return c.name.toLowerCase().includes(normalizedSearch) || (c.manifesto || "").toLowerCase().includes(normalizedSearch);
    }),
  }));

  const selectedPositionCandidates = useMemo(
    () => items.filter((cand) => cand.position_id === positionId),
    [items, positionId]
  );

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Candidates</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Add and manage candidates per position.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 focus:border-blue-500 outline-none"
            >
              <option value="all">All Positions</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates"
                className="pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={openCreateModal}
              disabled={positions.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
            >
              <UserPlus size={14} /> Add Candidate
            </button>
          </div>
        </div>
        {positions.length === 0 ? (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl text-sm font-medium mt-4">
            <AlertCircle size={16} />
            Add positions first before adding candidates.
          </div>
        ) : null}
      </div>

      {/* Candidates grouped by position */}
      {grouped.map(({ position, candidates: posCandidates }) => (
        <div key={position.id} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-50 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Briefcase size={14} className="text-blue-500" />
            {position.title}
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">
              {posCandidates.length}
            </span>
          </h3>
          {posCandidates.length === 0 ? (
            <p className="text-sm text-gray-300 font-medium py-4">No candidates for this position yet.</p>
          ) : (
            <div className="space-y-2">
              {posCandidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                      <p className="text-[11px] font-medium text-gray-400 truncate">{c.manifesto || "No bio yet"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="Edit candidate"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete candidate"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {positions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
          <Crown size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold text-sm">Add positions first to manage candidates.</p>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">{editingId ? "Edit Candidate" : "Add Candidate"}</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Election Position *</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 outline-none"
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {!editingId && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Existing Candidates in This Position</p>
                    {selectedPositionCandidates.length === 0 ? (
                      <p className="text-xs text-gray-400 font-medium">No candidates added for this position yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPositionCandidates.map((cand) => (
                          <div key={`existing-${cand.id}`} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {cand.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {drafts.map((draft, idx) => (
                    <div key={draft.id} className="border border-gray-100 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                          {editingId ? "Candidate Details" : `Candidate ${idx + 1}`}
                        </p>
                        {!editingId && (
                          <button
                            type="button"
                            onClick={() => removeDraftRow(draft.id)}
                            className="text-[11px] font-bold text-red-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name of Candidate *</label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => updateDraft(draft.id, { name: e.target.value })}
                          placeholder="Enter candidate name"
                          className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image</label>
                        {draft.image_url ? (
                          <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-gray-100 mb-3">
                            <img src={draft.image_url} alt="Candidate preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => updateDraft(draft.id, { image_url: "" })}
                              className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >
                              <X size={14} className="text-red-500" />
                            </button>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMediaDraftId(draft.id);
                              setShowMediaPicker(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <ImageIcon size={14} />
                            Pick from Library
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt("Paste image URL");
                              if (url) updateDraft(draft.id, { image_url: url });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Upload size={14} />
                            Paste URL
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bio</label>
                        <textarea
                          value={draft.bio}
                          onChange={(e) => updateDraft(draft.id, { bio: e.target.value })}
                          rows={4}
                          placeholder="Candidate bio or manifesto..."
                          className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}

                  {!editingId && (
                    <button
                      type="button"
                      onClick={addDraftRow}
                      className="w-full border border-dashed border-blue-200 bg-blue-50/60 text-blue-700 rounded-xl py-2.5 text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-colors"
                    >
                      + Add Another Candidate Row
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    !positionId ||
                    drafts.every((row) => !row.name.trim()) ||
                    saving
                  }
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {editingId ? "Save Changes" : "Add Candidates"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(file: MediaFile) => {
          if (activeMediaDraftId) {
            updateDraft(activeMediaDraftId, { image_url: file.url });
          }
          setShowMediaPicker(false);
          setActiveMediaDraftId(null);
        }}
      />
    </div>
  );
}

/* ── Voters Tab ── */
function VotersTab({
  electionId,
  voters,
  onRefresh,
}: {
  electionId: string;
  voters: Voter[];
  onRefresh: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  const assignedVoterIds = useMemo(() => new Set(voters.map((v) => v.voter_id)), [voters]);

  const handleAssign = async (voterIds: string[]) => {
    await fetch(`/api/elections/${electionId}/voters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter_ids: voterIds }),
    });
    setShowPicker(false);
    onRefresh();
  };

  const handleUnassign = async (voterId: string) => {
    await fetch(`/api/elections/${electionId}/voters?voter_id=${voterId}`, { method: "DELETE" });
    onRefresh();
  };

  const handleClearAll = async () => {
    if (!confirm(`Unassign all ${voters.length} voters from this election?`)) return;
    await fetch(`/api/elections/${electionId}/voters?clear=true`, { method: "DELETE" });
    onRefresh();
  };

  const filtered = voters.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.matric_number.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
  });

  const votedCount = voters.filter((v) => v.has_voted).length;

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">Assigned Voters</h3>
            <p className="text-xs text-gray-400 font-medium">
              Pick voters from the global pool to assign to this election.
              {voters.length > 0 && ` ${votedCount} of ${voters.length} have voted.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <UserPlus size={16} /> Assign Voters
            </button>
            {voters.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Voted progress */}
        {voters.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voting Progress</span>
              <span className="text-xs font-bold text-gray-500">
                {votedCount}/{voters.length} ({voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${voters.length > 0 ? (votedCount / voters.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Voter list */}
      <div className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Voter Roll
              <span className="text-gray-400 font-bold ml-2">({voters.length})</span>
            </h3>
          </div>
          {voters.length > 0 && (
            <div className="relative mb-4">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, matric, or email..."
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {voters.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Users size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bold text-sm">No voters assigned yet</p>
            <p className="text-gray-300 text-xs mt-1">Click &quot;Assign Voters&quot; to pick from the global voter pool.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Matric</th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                  <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Voted</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((voter) => (
                  <tr key={voter.assignment_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{voter.name}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-600">{voter.matric_number}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-500">{voter.email}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-500">{voter.level || "-"}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${voter.has_voted ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {voter.has_voted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleUnassign(voter.voter_id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Unassign from election"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {search && filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm font-medium">
                No voters matching &quot;{search}&quot;
              </div>
            )}
            {search && filtered.length > 0 && filtered.length < voters.length && (
              <div className="text-center py-3 text-gray-400 text-xs font-medium">
                Showing {filtered.length} of {voters.length} voters
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voter Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <VoterPicker
            assignedVoterIds={assignedVoterIds}
            onAssign={handleAssign}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   RESULTS TAB - Anonymous election progress & analytics
   ══════════════════════════════════════════════════════════════════════ */

interface ResultsData {
  election: { id: string; title: string; status: string; election_date: string | null; start_time: string | null; end_time: string | null };
  turnout: { total_voters: number; voted: number; not_voted: number; percentage: number };
  positions: PositionResult[];
  timeline: { time: string; count: number }[];
  total_votes: number;
}

interface PositionResult {
  id: string;
  title: string;
  sort_order: number;
  total_votes: number;
  candidates: CandidateResult[];
  leader: CandidateResult | null;
  is_tied: boolean;
}

interface CandidateResult {
  id: string;
  name: string;
  image_url: string | null;
  votes: number;
  percentage: number;
}

function ResultsTab({ electionId }: { electionId: string }) {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [resultsView, setResultsView] = useState<"chart" | "list">("chart");

  const fetchResults = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`/api/elections/${electionId}/results`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  const exportResultsPdf = () => {
    if (!data) return;
    const electionDate = data.election.election_date ? formatDateNice(data.election.election_date) : "Not set";
    const votingPeriod =
      data.election.election_date && data.election.start_time && data.election.end_time
        ? `${formatDateNice(data.election.election_date)}, ${formatTime12(data.election.start_time.slice(0, 5))} - ${formatTime12(data.election.end_time.slice(0, 5))}`
        : "Not set";

    const perPositionSections = data.positions
      .map((pos) => {
        const rows = (pos.candidates.length ? pos.candidates : [{ id: "none", name: "No candidates yet", image_url: null, votes: 0, percentage: 0 }])
          .map(
            (cand, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${cand.name}</td>
                <td>${cand.votes}</td>
                <td>${cand.percentage}%</td>
              </tr>
            `
          )
          .join("");

        return `
          <section class="page-break">
            <h2>${pos.title.toUpperCase()} ELECTION RESULT</h2>
            <p><strong>Total Votes:</strong> ${pos.total_votes}</p>
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Candidate Name</th>
                  <th>Votes Received</th>
                  <th>Percentage (%)</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </section>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>Election Result - ${data.election.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 6px; }
            h2 { font-size: 16px; margin: 18px 0 8px; }
            .muted { color: #6b7280; margin-bottom: 20px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f3f4f6; }
            .page-break { page-break-before: always; }
            @media print {
              body { padding: 14px; }
              .page-break:first-of-type { page-break-before: auto; }
            }
          </style>
        </head>
        <body>
          <h1>ELECTION RESULT</h1>
          <p class="muted">${data.election.title}</p>
          <div class="card">
            <h2>ELECTION OVERVIEW</h2>
            <p><strong>Election Title:</strong> ${data.election.title}</p>
            <p><strong>Election Date:</strong> ${electionDate}</p>
            <p><strong>Total Registered Voters:</strong> ${data.turnout.total_voters}</p>
            <p><strong>Voter Turnout:</strong> ${data.turnout.voted}</p>
            <p><strong>Voting Period:</strong> ${votingPeriod}</p>
          </div>
          ${perPositionSections || `<p>No positions configured yet.</p>`}
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  useEffect(() => {
    fetchResults();
    // Auto-refresh every 30 seconds
    const iv = setInterval(() => fetchResults(true), 30000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  const syncPositions = data?.positions || [];
  useEffect(() => {
    if (!syncPositions.length) {
      setSelectedPositionId("");
      return;
    }
    if (!selectedPositionId || !syncPositions.some((pos) => pos.id === selectedPositionId)) {
      setSelectedPositionId(syncPositions[0].id);
    }
  }, [syncPositions, selectedPositionId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
        <AlertCircle size={32} className="mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 font-bold text-sm">Failed to load results</p>
      </div>
    );
  }

  const { turnout, positions, timeline, total_votes } = data;
  const maxTimelineCount = Math.max(...timeline.map((t) => t.count), 1);
  const selectedPosition = positions.find((pos) => pos.id === selectedPositionId) || positions[0] || null;
  const displayCandidates = selectedPosition?.candidates?.length
    ? selectedPosition.candidates
    : [
        {
          id: "placeholder",
          name: "No candidates yet",
          image_url: null,
          votes: 0,
          percentage: 0,
        },
      ];
  const maxSelectedVotes = Math.max(...displayCandidates.map((cand) => cand.votes), 1);
  const chartMaxValue = Math.max(maxSelectedVotes, 5);
  const chartTicks = [chartMaxValue, Math.round((chartMaxValue * 3) / 4), Math.round(chartMaxValue / 2), Math.round(chartMaxValue / 4), 0];

  return (
    <div className="space-y-6">
      {/* Refresh bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">
          Results auto-refresh every 30s. All data is anonymous.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={exportResultsPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <FileDown size={14} /> Export PDF
          </button>
          <button
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Turnout Overview */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-500" /> Turnout Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-black text-gray-900">{turnout.percentage}%</p>
            <p className="text-xs font-bold text-gray-400 mt-1">Voter Turnout</p>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-600">{turnout.voted}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">Voted</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-400">{turnout.not_voted}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">Haven&apos;t Voted</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-600">{total_votes}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">Total Ballots Cast</p>
          </div>
        </div>

        {/* Turnout bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-bold text-gray-500">{turnout.voted}/{turnout.total_voters}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${turnout.percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Position pills + selected-position results */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-50 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Briefcase size={14} className="text-blue-500" /> Positions
        </h3>
        {positions.length === 0 ? (
          <p className="text-sm text-gray-400 font-medium">No positions configured yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {positions.map((pos) => (
              <button
                key={pos.id}
                onClick={() => setSelectedPositionId(pos.id)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  selectedPosition?.id === pos.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {pos.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-500" />
            {selectedPosition ? `${selectedPosition.title} Results` : "Candidate Results"}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setResultsView("chart")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                  resultsView === "chart" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setResultsView("list")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                  resultsView === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}
              >
                List
              </button>
            </div>
            {selectedPosition && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {selectedPosition.total_votes} vote{selectedPosition.total_votes !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {selectedPosition && selectedPosition.candidates.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedPosition.candidates.map((cand) => (
              <div
                key={`pill-candidate-${cand.id}`}
                className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 border ${
                  cand.id === "none_of_above"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                {cand.id === "none_of_above" ? (
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">
                    Ø
                  </div>
                ) : cand.image_url ? (
                  <img src={cand.image_url} alt={cand.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                    {cand.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`text-[11px] font-bold ${cand.id === "none_of_above" ? "text-amber-700" : "text-gray-600"}`}>
                  {cand.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {resultsView === "chart" ? (
          <div className="border border-gray-100 rounded-2xl p-4 sm:p-5">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Votes</div>
            <div className="grid grid-cols-[40px_1fr] gap-3">
              <div className="h-64 flex flex-col justify-between text-[10px] font-bold text-gray-400">
                {chartTicks.map((tick, idx) => (
                  <span key={`tick-${idx}`}>{tick}</span>
                ))}
              </div>
              <div className="relative h-64 border-l border-b border-gray-200">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {chartTicks.map((_, idx) => (
                    <div key={`gridline-${idx}`} className="border-t border-gray-100" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-end justify-around gap-3 px-3 pb-2">
                  {displayCandidates.map((cand, idx) => {
                    const isPlaceholder = cand.id === "placeholder";
                    const isNoneOfAbove = cand.id === "none_of_above";
                    const barHeight = Math.max((cand.votes / chartMaxValue) * 100, 3);
                    return (
                      <div key={`${cand.id}-${idx}`} className="flex-1 max-w-28 flex flex-col items-center justify-end">
                        <span
                          className={`text-[11px] font-black mb-1 ${
                            isPlaceholder ? "text-gray-400" : isNoneOfAbove ? "text-amber-700" : "text-gray-700"
                          }`}
                        >
                          {cand.votes}
                        </span>
                        <div className="w-full h-44 flex items-end relative group">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap">
                            {cand.name}: {cand.votes} vote{cand.votes !== 1 ? "s" : ""} ({cand.percentage}%)
                          </div>
                          <motion.div
                            className={`w-full rounded-t-md ${
                              isPlaceholder
                                ? "bg-gray-300"
                                : isNoneOfAbove
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                            }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                          />
                        </div>
                        <div className="mt-2 flex flex-col items-center gap-1">
                          {isPlaceholder ? (
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-black">-</div>
                          ) : isNoneOfAbove ? (
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">
                              Ø
                            </div>
                          ) : cand.image_url ? (
                            <img src={cand.image_url} alt={cand.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                              {cand.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`text-[10px] font-bold text-center leading-tight ${
                              isPlaceholder ? "text-gray-400" : isNoneOfAbove ? "text-amber-700" : "text-gray-600"
                            }`}
                          >
                            {cand.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Candidate</span>
              <span>Votes</span>
              <span>Percent</span>
            </div>
            <div className="divide-y divide-gray-100">
              {displayCandidates.map((cand, idx) => {
                const isPlaceholder = cand.id === "placeholder";
                const isNoneOfAbove = cand.id === "none_of_above";
                return (
                  <div key={`${cand.id}-list-${idx}`} className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      {isPlaceholder ? (
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-black">-</div>
                      ) : isNoneOfAbove ? (
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">Ø</div>
                      ) : cand.image_url ? (
                        <img src={cand.image_url} alt={cand.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                          {cand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`text-sm font-bold truncate ${isPlaceholder ? "text-gray-400" : isNoneOfAbove ? "text-amber-700" : "text-gray-700"}`}>
                        {cand.name}
                      </span>
                    </div>
                    <span className={`text-sm font-black text-right ${isNoneOfAbove ? "text-amber-700" : "text-gray-800"}`}>{cand.votes}</span>
                    <span className="text-xs font-bold text-gray-500 text-right">{cand.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Voting Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-50 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock size={14} className="text-blue-500" /> Voting Activity
          </h3>
          <div className="flex items-end gap-1 h-32">
            {timeline.map((bucket, i) => {
              const height = (bucket.count / maxTimelineCount) * 100;
              const timeLabel = new Date(bucket.time).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-10">
                    {bucket.count} vote{bucket.count !== 1 ? "s" : ""} at {timeLabel}
                  </div>
                  <motion.div
                    className="w-full bg-blue-500 rounded-t-md min-h-[2px]"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
            {timeline.length > 0 && (
              <>
                <span>{new Date(timeline[0].time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                <span>{new Date(timeline[timeline.length - 1].time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state note when no votes at all */}
      {total_votes === 0 && (
        <div className="text-center py-8 bg-white rounded-[2rem] border border-dashed border-gray-200">
          <p className="text-gray-400 font-bold text-sm">No votes cast yet.</p>
          <p className="text-gray-300 text-xs mt-1">The chart stays visible and will update as ballots are submitted.</p>
        </div>
      )}
    </div>
  );
}
