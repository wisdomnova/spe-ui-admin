"use client";

import { useState, useEffect } from "react";
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
  Upload,
  UserPlus,
  Search,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Briefcase,
} from "lucide-react";

/* ── Types ── */
interface Election {
  id: string;
  title: string;
  description: string | null;
  status: "Draft" | "Active" | "Completed";
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

interface Voter {
  id: string;
  election_id: string;
  name: string;
  matric_number: string;
  email: string;
  level: string | null;
  has_voted: boolean;
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
};

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ElectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

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
    setCreating(true);
    try {
      const res = await fetch("/api/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDesc("");
        setShowCreate(false);
        fetchElections();
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

  const refreshDetail = () => {
    if (selected) openElection(selected.id);
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
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowCreate(false)}
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
              {elections.map((election) => (
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
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${STATUS_COLORS[election.status]}`}>
                          {election.status}
                        </span>
                      </div>
                      {election.description && (
                        <p className="text-sm text-gray-400 font-medium truncate mb-3">{election.description}</p>
                      )}
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <Briefcase size={13} /> {election.positions_count} position{election.positions_count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <Crown size={13} /> {election.candidates_count} candidate{election.candidates_count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <Users size={13} /> {election.voters_count} voter{election.voters_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
              ))}
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
  const [tab, setTab] = useState<"positions" | "candidates" | "voters">("positions");
  const [status, setStatus] = useState(election.status);
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    setStatus(newStatus as Election["status"]);
    await fetch(`/api/elections/${election.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
  };

  const TABS = [
    { key: "positions" as const, label: "Positions", icon: Briefcase, count: election.positions.length },
    { key: "candidates" as const, label: "Candidates", icon: Crown, count: election.candidates.length },
    { key: "voters" as const, label: "Voters", icon: Users, count: election.voters.length },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        {/* Back + Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Elections
        </button>

        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{election.title}</h2>
            {election.description && <p className="text-gray-500 font-medium mt-1">{election.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-0 cursor-pointer ${STATUS_COLORS[status]} ${saving ? "opacity-50" : ""}`}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </header>

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
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : "bg-gray-100"}`}>
                {t.count}
              </span>
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
      </motion.div>
    </div>
  );
}

/* ── Positions Tab ── */
function PositionsTab({ electionId, positions, onRefresh }: { electionId: string; positions: Position[]; onRefresh: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    await fetch(`/api/elections/${electionId}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: desc.trim() || null, sort_order: positions.length }),
    });
    setTitle("");
    setDesc("");
    setAdding(false);
    onRefresh();
  };

  const handleDelete = async (positionId: string) => {
    if (!confirm("Delete this position and all its candidates?")) return;
    await fetch(`/api/elections/${electionId}/positions?position_id=${positionId}`, { method: "DELETE" });
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
      </div>

      {/* Positions list */}
      {positions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
          <Briefcase size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold text-sm">No positions added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((pos, i) => (
            <div key={pos.id} className="bg-white p-6 rounded-[1.5rem] border border-gray-50 shadow-sm group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-300">#{i + 1}</span>
                  <h4 className="font-bold text-gray-900">{pos.title}</h4>
                </div>
                <button
                  onClick={() => handleDelete(pos.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {pos.description && <p className="text-xs text-gray-400 font-medium">{pos.description}</p>}
            </div>
          ))}
        </div>
      )}
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
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [positionId, setPositionId] = useState(positions[0]?.id || "");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !positionId) return;
    setAdding(true);
    await fetch(`/api/elections/${electionId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), matric_number: matric.trim() || null, position_id: positionId }),
    });
    setName("");
    setMatric("");
    setAdding(false);
    onRefresh();
  };

  const handleDelete = async (candidateId: string) => {
    if (!confirm("Remove this candidate?")) return;
    await fetch(`/api/elections/${electionId}/candidates?candidate_id=${candidateId}`, { method: "DELETE" });
    onRefresh();
  };

  // Group candidates by position
  const grouped = positions.map((pos) => ({
    position: pos,
    candidates: candidates.filter((c) => c.position_id === pos.id),
  }));

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Add Candidate</h3>
        {positions.length === 0 ? (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl text-sm font-medium">
            <AlertCircle size={16} />
            Add positions first before adding candidates.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 outline-none"
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Candidate name *"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              placeholder="Matric number"
              className="w-40 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !positionId || adding}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shrink-0"
            >
              {adding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Add
            </button>
          </div>
        )}
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
                <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                      {c.matric_number && (
                        <p className="text-[11px] font-medium text-gray-400">{c.matric_number}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
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
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported?: number; skipped?: number; error?: string } | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newVoter, setNewVoter] = useState({ name: "", matric_number: "", email: "", level: "" });
  const [addingVoter, setAddingVoter] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/elections/${electionId}/voters`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({ imported: data.imported, skipped: data.skipped });
        onRefresh();
      } else {
        setUploadResult({ error: data.error });
      }
    } catch (e) {
      setUploadResult({ error: "Upload failed" });
    }
    setUploading(false);
  };

  const handleAddVoter = async () => {
    if (!newVoter.name.trim() || !newVoter.matric_number.trim() || !newVoter.email.trim()) return;
    setAddingVoter(true);
    try {
      const res = await fetch(`/api/elections/${electionId}/voters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVoter),
      });
      if (res.ok) {
        setNewVoter({ name: "", matric_number: "", email: "", level: "" });
        setShowAdd(false);
        onRefresh();
      }
    } catch {}
    setAddingVoter(false);
  };

  const handleDeleteVoter = async (voterId: string) => {
    await fetch(`/api/elections/${electionId}/voters?voter_id=${voterId}`, { method: "DELETE" });
    onRefresh();
  };

  const handleClearAll = async () => {
    if (!confirm(`Remove all ${voters.length} voters from this election?`)) return;
    await fetch(`/api/elections/${electionId}/voters?clear=true`, { method: "DELETE" });
    onRefresh();
  };

  const filtered = voters.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.matric_number.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Upload + Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Import Voters</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload Excel File"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
          >
            <UserPlus size={16} /> Add Single Voter
          </button>
          {voters.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-600 transition-colors ml-auto"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {/* Upload result */}
        <AnimatePresence>
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              {uploadResult.error ? (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-medium">
                  <AlertCircle size={16} /> {uploadResult.error}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-xl text-sm font-medium">
                  <CheckCircle size={16} />
                  {uploadResult.imported} voter{uploadResult.imported !== 1 ? "s" : ""} imported
                  {(uploadResult.skipped ?? 0) > 0 && ` (${uploadResult.skipped} skipped — missing data)`}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single voter add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  value={newVoter.name}
                  onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                  placeholder="Name *"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newVoter.matric_number}
                  onChange={(e) => setNewVoter({ ...newVoter, matric_number: e.target.value })}
                  placeholder="Matric *"
                  className="w-32 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  value={newVoter.email}
                  onChange={(e) => setNewVoter({ ...newVoter, email: e.target.value })}
                  placeholder="Email *"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newVoter.level}
                  onChange={(e) => setNewVoter({ ...newVoter, level: e.target.value })}
                  placeholder="Level"
                  className="w-20 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddVoter}
                  disabled={!newVoter.name || !newVoter.matric_number || !newVoter.email || addingVoter}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shrink-0"
                >
                  {addingVoter ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
          <FileSpreadsheet size={12} />
          Excel columns: name, matric (or matric_number), email, level
        </p>
      </div>

      {/* Search + Voters List */}
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
            <p className="text-gray-400 font-bold text-sm">No voters imported yet</p>
            <p className="text-gray-300 text-xs mt-1">Upload an Excel file or add voters manually above.</p>
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
                  <tr key={voter.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{voter.name}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-600">{voter.matric_number}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-500">{voter.email}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-500">{voter.level || "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${voter.has_voted ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {voter.has_voted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleDeleteVoter(voter.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
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
    </div>
  );
}
