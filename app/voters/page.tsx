"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Users,
  Search,
  X,
  Upload,
  UserPlus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Pencil,
  Check,
  Filter,
  Mail,
  ArrowLeft,
} from "lucide-react";
import EmailCampaignEditor, { Recipient } from "@/components/EmailCampaignEditor";

/* ── Types ── */
interface Voter {
  id: string;
  name: string;
  matric_number: string;
  email: string;
  level: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export default function VotersPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newVoter, setNewVoter] = useState({ name: "", matric_number: "", email: "", level: "", department: "" });
  const [addingVoter, setAddingVoter] = useState(false);
  const [addError, setAddError] = useState("");

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported?: number; skipped?: number; error?: string } | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Email composer
  const [showEmailEditor, setShowEmailEditor] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", matric_number: "", email: "", level: "", department: "" });
  const [editSaving, setEditSaving] = useState(false);

  const fetchVoters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (levelFilter) params.set("level", levelFilter);
      const res = await fetch(`/api/voters?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVoters(data.voters);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [search, levelFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchVoters, 300);
    return () => clearTimeout(timeout);
  }, [fetchVoters]);

  // Unique levels for filter dropdown
  const uniqueLevels = [...new Set(voters.map((v) => v.level).filter(Boolean))] as string[];

  /* ── Actions ── */
  const handleAddVoter = async () => {
    if (!newVoter.name.trim() || !newVoter.matric_number.trim() || !newVoter.email.trim()) return;
    setAddError("");
    setAddingVoter(true);
    try {
      const res = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVoter),
      });
      if (res.ok) {
        setNewVoter({ name: "", matric_number: "", email: "", level: "", department: "" });
        setShowAdd(false);
        fetchVoters();
      } else {
        const d = await res.json();
        setAddError(d.error || "Failed to add voter");
      }
    } catch {
      setAddError("Failed to add voter");
    }
    setAddingVoter(false);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/voters", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({ imported: data.imported, skipped: data.skipped });
        fetchVoters();
      } else {
        setUploadResult({ error: data.error });
      }
    } catch {
      setUploadResult({ error: "Upload failed" });
    }
    setUploading(false);
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("Delete this voter from the pool? They will be removed from all elections.")) return;
    await fetch(`/api/voters?id=${id}`, { method: "DELETE" });
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    fetchVoters();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} voter${selectedIds.size > 1 ? "s" : ""}? They will be removed from all elections.`))
      return;
    setBulkDeleting(true);
    const ids = [...selectedIds].join(",");
    await fetch(`/api/voters?ids=${ids}`, { method: "DELETE" });
    setSelectedIds(new Set());
    await fetchVoters();
    setBulkDeleting(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === voters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(voters.map((v) => v.id)));
    }
  };

  const startEdit = (voter: Voter) => {
    setEditingId(voter.id);
    setEditData({
      name: voter.name,
      matric_number: voter.matric_number,
      email: voter.email,
      level: voter.level || "",
      department: voter.department || "",
    });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    setEditSaving(true);
    const res = await fetch("/api/voters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editData }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchVoters();
    }
    setEditSaving(false);
  };

  // Map voters to email recipients
  const emailRecipients: Recipient[] = voters
    .filter((v) => v.email)
    .map((v) => ({
      id: v.id,
      email: v.email,
      label: v.name,
      sublabel: [v.level ? `${v.level} Level` : null, v.department].filter(Boolean).join(" · ") || undefined,
      badge: v.level || undefined,
      badgeColor: "blue" as const,
    }));

  if (showEmailEditor) {
    return (
      <div className="p-4 sm:p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
          <button
            onClick={() => setShowEmailEditor(false)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Voters
          </button>
          <EmailCampaignEditor
            title="Email Voters"
            subtitle="Compose and send emails to voters in the pool."
            source="voters"
            recipients={emailRecipients}
            loadingRecipients={loading}
            recipientCountLabel={`${emailRecipients.length} voters with email addresses`}
            includeUnsubscribe={false}
            onSendComplete={() => setShowEmailEditor(false)}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Voters</h2>
              <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{total}</span>
            </div>
            <p className="text-gray-500 font-medium">Manage the global voter pool. Assign voters to elections from here.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEmailEditor(true)}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-colors"
            >
              <Mail size={16} /> Send Email
            </button>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-blue-100 transition-colors">
              <Upload size={16} />
              {uploading ? "Uploading..." : "Upload Excel"}
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
              onClick={() => { setShowAdd(!showAdd); setAddError(""); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <Plus size={18} /> Add Voter
            </button>
          </div>
        </header>

        {/* Upload result */}
        <AnimatePresence>
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              {uploadResult.error ? (
                <div className="flex items-center justify-between gap-2 text-red-600 bg-red-50 p-4 rounded-2xl text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} /> {uploadResult.error}
                  </div>
                  <button onClick={() => setUploadResult(null)} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 text-green-700 bg-green-50 p-4 rounded-2xl text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    {uploadResult.imported} voter{uploadResult.imported !== 1 ? "s" : ""} imported
                    {(uploadResult.skipped ?? 0) > 0 && ` (${uploadResult.skipped} skipped - missing data)`}
                  </div>
                  <button onClick={() => setUploadResult(null)} className="text-green-400 hover:text-green-600">
                    <X size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Voter Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserPlus size={14} className="text-blue-500" /> Add New Voter
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name *</label>
                    <input
                      type="text"
                      value={newVoter.name}
                      onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                      placeholder="Full name"
                      className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matric Number *</label>
                    <input
                      type="text"
                      value={newVoter.matric_number}
                      onChange={(e) => setNewVoter({ ...newVoter, matric_number: e.target.value })}
                      placeholder="e.g. U2020/1234"
                      className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email *</label>
                    <input
                      type="email"
                      value={newVoter.email}
                      onChange={(e) => setNewVoter({ ...newVoter, email: e.target.value })}
                      placeholder="email@example.com"
                      className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</label>
                    <input
                      type="text"
                      value={newVoter.level}
                      onChange={(e) => setNewVoter({ ...newVoter, level: e.target.value })}
                      placeholder="e.g. 300"
                      className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                    <input
                      type="text"
                      value={newVoter.department}
                      onChange={(e) => setNewVoter({ ...newVoter, department: e.target.value })}
                      placeholder="Optional"
                      className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {addError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium mt-4">
                    <AlertCircle size={14} /> {addError}
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => { setShowAdd(false); setAddError(""); }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVoter}
                    disabled={!newVoter.name.trim() || !newVoter.matric_number.trim() || !newVoter.email.trim() || addingVoter}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {addingVoter ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add Voter
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + Filters + Bulk Actions */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              {/* Search */}
              <div className="relative flex-1 w-full">
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

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  showFilters || levelFilter ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <Filter size={14} /> Filter
                {levelFilter && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">1</span>}
              </button>

              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                >
                  {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete {selectedIds.size} selected
                </button>
              )}
            </div>

            {/* Filter row */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</label>
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:border-blue-500 outline-none"
                    >
                      <option value="">All Levels</option>
                      {uniqueLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                    {levelFilter && (
                      <button onClick={() => setLevelFilter("")} className="text-xs font-bold text-red-400 hover:text-red-600">
                        Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[11px] text-gray-400 mb-4 flex items-center gap-1.5">
              <FileSpreadsheet size={12} />
              Excel columns: name, matric (or matric_number), email, level, department
            </p>
          </div>

          {/* Voters table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : voters.length === 0 ? (
            <div className="text-center py-24 px-6">
              <Users size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">
                {search || levelFilter ? "No voters match your search" : "No voters yet"}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                {search || levelFilter
                  ? "Try adjusting your search or filters."
                  : "Upload an Excel file or add voters manually to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b border-gray-100">
                    <th className="px-6 py-3 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedIds.size === voters.length && voters.length > 0
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {selectedIds.size === voters.length && voters.length > 0 && <Check size={12} className="text-white" />}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Matric</th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                    <th className="text-left px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      {/* Checkbox */}
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => toggleSelect(voter.id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            selectedIds.has(voter.id) ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {selectedIds.has(voter.id) && <Check size={12} className="text-white" />}
                        </button>
                      </td>

                      {editingId === voter.id ? (
                        <>
                          <td className="px-6 py-2">
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-blue-300 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              type="text"
                              value={editData.matric_number}
                              onChange={(e) => setEditData({ ...editData, matric_number: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-blue-300 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              type="email"
                              value={editData.email}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-blue-300 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              type="text"
                              value={editData.level}
                              onChange={(e) => setEditData({ ...editData, level: e.target.value })}
                              className="w-20 px-3 py-1.5 rounded-lg border border-blue-300 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              type="text"
                              value={editData.department}
                              onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                              className="w-24 px-3 py-1.5 rounded-lg border border-blue-300 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-2">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={handleEditSave}
                                disabled={editSaving}
                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                              >
                                {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3.5 font-bold text-gray-900">{voter.name}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-600">{voter.matric_number}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-500">{voter.email}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-500">{voter.level || "-"}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-500">{voter.department || "-"}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(voter)}
                                className="p-2 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSingle(voter.id)}
                                className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {voters.length < total && (
                <div className="text-center py-4 text-gray-400 text-xs font-medium border-t border-gray-50">
                  Showing {voters.length} of {total} voters
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
