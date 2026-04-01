"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Search,
  Trash2,
  Loader2,
  Crown,
  Zap,
  Smile,
  Filter,
  Clock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  game: "reaction" | "emoji";
  player_name: string;
  score: number;
  created_at: string;
}

type GameFilter = "all" | "reaction" | "emoji";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) setEntries(await res.json());
    } catch {
      console.error("Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this leaderboard entry?")) return;
    try {
      const res = await fetch(`/api/leaderboard?id=${id}`, { method: "DELETE" });
      if (res.ok) setEntries(entries.filter((e) => e.id !== id));
    } catch {
      console.error("Failed to delete entry");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  /* ── Filtering + Sorting ── */
  const filtered = entries
    .filter((e) => {
      const matchesGame = gameFilter === "all" || e.game === gameFilter;
      const matchesSearch = e.player_name.toLowerCase().includes(search.toLowerCase());
      return matchesGame && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by best score: reaction = lower is better, emoji = higher is better
      if (gameFilter === "reaction") return a.score - b.score;
      if (gameFilter === "emoji") return b.score - a.score;
      // "all" - group by game, then sort within
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  /* ── Stats ── */
  const reactionEntries = entries.filter((e) => e.game === "reaction");
  const emojiEntries = entries.filter((e) => e.game === "emoji");
  const bestReaction = reactionEntries.length
    ? reactionEntries.reduce((best, e) => (e.score < best.score ? e : best))
    : null;
  const bestEmoji = emojiEntries.length
    ? emojiEntries.reduce((best, e) => (e.score > best.score ? e : best))
    : null;
  const uniquePlayers = new Set(entries.map((e) => e.player_name.toLowerCase())).size;

  if (loading)
    return (
      <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Leaderboard</h2>
            <p className="text-gray-500 font-medium">All-time scores from Reaction Speed Test and Emoji Decode.</p>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <Link
              href="/leaderboard/answers"
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors"
            >
              <BookOpen size={14} />
              Answer Key
            </Link>
            <span className="px-4 py-2 rounded-2xl bg-rose-50 text-rose-600 font-black text-xs uppercase tracking-widest">
              {reactionEntries.length} Reaction
            </span>
            <span className="px-4 py-2 rounded-2xl bg-violet-50 text-violet-600 font-black text-xs uppercase tracking-widest">
              {emojiEntries.length} Emoji
            </span>
            <span className="px-4 py-2 rounded-2xl bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest">
              {uniquePlayers} Players
            </span>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-rose-600" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Fastest Reaction</p>
            </div>
            {bestReaction ? (
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {bestReaction.score.toFixed(0)}<span className="text-sm text-gray-400 ml-1">ms</span>
                </p>
                <p className="text-xs font-bold text-gray-400 mt-1">by {bestReaction.player_name}</p>
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-300">No scores yet</p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Smile size={16} className="text-violet-600" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Top Emoji Score</p>
            </div>
            {bestEmoji ? (
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {bestEmoji.score}<span className="text-sm text-gray-400 ml-1">pts</span>
                </p>
                <p className="text-xs font-bold text-gray-400 mt-1">by {bestEmoji.player_name}</p>
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-300">No scores yet</p>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-amber-500" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Plays</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{entries.length}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{uniquePlayers} unique players</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 text-gray-400 focus-within:border-blue-200 transition-colors">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by player name..."
              className="bg-transparent border-0 outline-none text-sm font-bold text-gray-900 w-full placeholder:text-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-300 shrink-0" />
            {(["all", "reaction", "emoji"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGameFilter(g)}
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  gameFilter === g
                    ? g === "reaction"
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
                      : g === "emoji"
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                        : "bg-gray-900 text-white shadow-lg"
                    : "bg-white border border-gray-100 text-gray-400 hover:text-gray-900"
                }`}
              >
                {g === "all" ? "All" : g === "reaction" ? "Reaction" : "Emoji"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
              <Trophy size={32} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-300 mb-2">No Entries</h3>
            <p className="text-sm font-medium text-gray-300 max-w-sm">
              {search
                ? "No players match your search."
                : "No leaderboard entries yet. Scores will appear here as people play the games on the public site."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Player</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Game</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Score</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((entry, i) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-black ${
                              i === 0 && gameFilter !== "all"
                                ? "text-amber-500"
                                : i === 1 && gameFilter !== "all"
                                  ? "text-gray-400"
                                  : i === 2 && gameFilter !== "all"
                                    ? "text-amber-700"
                                    : "text-gray-300"
                            }`}
                          >
                            {i === 0 && gameFilter !== "all" ? (
                              <Crown size={14} />
                            ) : (
                              i + 1
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">{entry.player_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              entry.game === "reaction"
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-violet-50 text-violet-600 border border-violet-100"
                            }`}
                          >
                            {entry.game === "reaction" ? <Zap size={10} /> : <Smile size={10} />}
                            {entry.game}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-gray-900">
                            {entry.game === "reaction"
                              ? `${entry.score.toFixed(0)} ms`
                              : `${entry.score} pts`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                            <Clock size={12} />
                            {formatDate(entry.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((entry, i) => (
                <div key={entry.id} className="p-4 flex items-center gap-4">
                  <span
                    className={`text-xs font-black w-6 text-center shrink-0 ${
                      i === 0 && gameFilter !== "all"
                        ? "text-amber-500"
                        : "text-gray-300"
                    }`}
                  >
                    {i === 0 && gameFilter !== "all" ? <Crown size={14} className="mx-auto" /> : i + 1}
                  </span>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{entry.player_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          entry.game === "reaction"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-violet-50 text-violet-600"
                        }`}
                      >
                        {entry.game === "reaction" ? <Zap size={8} /> : <Smile size={8} />}
                        {entry.game}
                      </span>
                      <span className="text-[10px] font-medium text-gray-300">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-900 shrink-0">
                    {entry.game === "reaction" ? `${entry.score.toFixed(0)}ms` : `${entry.score}pts`}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
