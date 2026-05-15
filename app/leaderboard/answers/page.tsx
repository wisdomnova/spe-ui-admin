"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, Smile, Hash } from "lucide-react";
import Link from "next/link";

/* ── Emoji puzzle data (mirrored from spe-ui) ── */
interface Puzzle {
  id: number;
  emojis: string;
  answer: string;
  category: string;
  alternates?: string[];
}

const CATEGORIES = [
  "Movies",
  "TV Shows",
  "Songs",
  "Countries",
  "Foods",
  "Phrases",
  "Nigerian Culture",
  "Sports",
  "Animals",
  "Books",
  "Occupations",
  "Landmarks",
] as const;

const PUZZLES: Puzzle[] = [
// ── Movies ──────────────────────────────────────────────
  { id: 1, emojis: "🚗💨🏁🔥", answer: "Fast and Furious", category: "Movies", alternates: ["fast & furious", "the fast and the furious"] },
  { id: 2, emojis: "🎯🏹🔥👧", answer: "The Hunger Games", category: "Movies", alternates: ["hunger games"] },
  { id: 3, emojis: "👻📞🔪", answer: "Scream", category: "Movies" },
  { id: 4, emojis: "🎈🏠👴👦", answer: "Up", category: "Movies" },
  { id: 5, emojis: "🧛‍♂️🩸🌙💔", answer: "Twilight", category: "Movies" },
  { id: 6, emojis: "🔪🚿😱", answer: "Psycho", category: "Movies" },
  { id: 7, emojis: "🚗⏱️⚡88", answer: "Back to the Future", category: "Movies", alternates: ["back to future"] },
  { id: 8, emojis: "🦸‍♂️👨‍👩‍👧‍👦🦸‍♀️", answer: "The Incredibles", category: "Movies", alternates: ["incredibles"] },
  { id: 9, emojis: "🏃‍♂️🍫🌲🪶", answer: "Forrest Gump", category: "Movies", alternates: ["forrest gump"] },
  { id: 10, emojis: "🎃🎄👻🎅", answer: "The Nightmare Before Christmas", category: "Movies", alternates: ["nightmare before christmas"] },
  { id: 11, emojis: "🤖❤️👦🎈", answer: "Big Hero 6", category: "Movies", alternates: ["big hero six"] },
  { id: 12, emojis: "🦇🌃🃏🦹", answer: "The Batman", category: "Movies", alternates: ["batman", "dark knight"] },
  { id: 13, emojis: "🧞‍♀️🌊💙", answer: "Moana", category: "Movies" },
  { id: 14, emojis: "🎸🤘🏫🎤", answer: "School of Rock", category: "Movies" },
  { id: 15, emojis: "👽🛸🌍💥", answer: "Independence Day", category: "Movies" },
  { id: 16, emojis: "🐀🎻🧀🇫🇷", answer: "Ratatouille", category: "Movies" },
  { id: 17, emojis: "🧙‍♀️👠🐕🌪️", answer: "The Wizard of Oz", category: "Movies", alternates: ["wizard of oz"] },
  { id: 18, emojis: "🎭🎤🌟👑", answer: "The Greatest Showman", category: "Movies", alternates: ["greatest showman"] },
  { id: 19, emojis: "🦈🩸🏖️", answer: "Jaws", category: "Movies" },
  { id: 20, emojis: "🧊👸⛄❄️", answer: "Frozen", category: "Movies" },

  // ── TV Shows ──────────────────────────────────────────
  { id: 21, emojis: "👑🐉🔥⚔️", answer: "House of the Dragon", category: "TV Shows", alternates: ["house of dragon", "hotd"] },
  { id: 22, emojis: "🧪💊😷🌵", answer: "Better Call Saul", category: "TV Shows", alternates: ["better call saul"] },
  { id: 23, emojis: "🃏🤡🏙️", answer: "Joker", category: "Movies", alternates: ["the joker"] },
  { id: 24, emojis: "🎮🟥🟩💀", answer: "Squid Game", category: "TV Shows" },
  { id: 25, emojis: "👨‍🍳🔪🍳⭐", answer: "The Bear", category: "TV Shows", alternates: ["bear"] },
  { id: 26, emojis: "🕵️‍♀️👠💄🏙️", answer: "Emily in Paris", category: "TV Shows" },
  { id: 27, emojis: "🧟‍♂️🚶‍♂️🏹", answer: "The Walking Dead", category: "TV Shows", alternates: ["walking dead"] },
  { id: 28, emojis: "👑📺🇬🇧👸", answer: "The Crown", category: "TV Shows", alternates: ["crown"] },
  { id: 29, emojis: "🎓🎤👯‍♀️", answer: "Glee", category: "TV Shows" },
  { id: 30, emojis: "🏢📎☕😂", answer: "The Office", category: "TV Shows", alternates: ["office"] },

  // ── Songs ───────────────────────────────────────────────
  { id: 31, emojis: "🌊👁️🌊", answer: "Ocean Eyes", category: "Songs", alternates: ["ocean eyes billie eilish"] },
  { id: 32, emojis: "☀️👓😎", answer: "Sunglasses at Night", category: "Songs" },
  { id: 33, emojis: "🎤👑💃🐝", answer: "Crazy in Love", category: "Songs", alternates: ["crazy in love beyonce"] },
  { id: 34, emojis: "🌙🚶‍♂️🎸", answer: "Blinding Lights", category: "Songs", alternates: ["blinding lights the weeknd"] },
  { id: 35, emojis: "💃🕺🪩", answer: "Levitating", category: "Songs" },
  { id: 36, emojis: "🔥🔥🔥🎤", answer: "We Didn't Start the Fire", category: "Songs", alternates: ["we didnt start the fire"] },
  { id: 37, emojis: "🌧️☔😢", answer: "Set Fire to the Rain", category: "Songs", alternates: ["set fire to the rain adele"] },
  { id: 38, emojis: "🎸🤠🤠", answer: "Old Town Road", category: "Songs", alternates: ["old town road lil nas x"] },
  { id: 39, emojis: "💔📞☎️", answer: "Call Me Maybe", category: "Songs" },
  { id: 40, emojis: "🌍🎶🕊️", answer: "Heal the World", category: "Songs", alternates: ["heal the world michael jackson"] },
  { id: 41, emojis: "🎤🌟⭐", answer: "Starboy", category: "Songs" },
  { id: 42, emojis: "🦁🌙🎵", answer: "Circle of Life", category: "Songs", alternates: ["circle of life lion king"] },

  // ── Countries ───────────────────────────────────────────
  { id: 43, emojis: "🗼🥖🍷", answer: "France", category: "Countries" },
  { id: 44, emojis: "🍕🍝🏛️", answer: "Italy", category: "Countries" },
  { id: 45, emojis: "🌮🌯🎺", answer: "Mexico", category: "Countries" },
  { id: 46, emojis: "🏯🍱🗻", answer: "Japan", category: "Countries" },
  { id: 47, emojis: "🦘🐨🏄", answer: "Australia", category: "Countries" },
  { id: 48, emojis: "⚽🎭🌴", answer: "Brazil", category: "Countries" },
  { id: 49, emojis: "🕌🌶️🐘", answer: "India", category: "Countries" },
  { id: 50, emojis: "🍁🍂🏒", answer: "Canada", category: "Countries" },
  { id: 51, emojis: "🦁🐘🥁", answer: "Kenya", category: "Countries" },
  { id: 52, emojis: "🌍🟢⚪🟢", answer: "Nigeria", category: "Countries" },
  { id: 53, emojis: "🐉🥡🧧", answer: "China", category: "Countries" },
  { id: 54, emojis: "🎭🥁🌴", answer: "Ghana", category: "Countries" },
  { id: 55, emojis: "🗽🍔🦅", answer: "United States", category: "Countries", alternates: ["usa", "america", "us"] },
  { id: 56, emojis: "🏴󠁧󠁢󠁥󠁮󠁧󠁿☕👑", answer: "United Kingdom", category: "Countries", alternates: ["uk", "britain", "england"] },

  // ── Foods ───────────────────────────────────────────────
  { id: 57, emojis: "🍚🍅🔥", answer: "Jollof Rice", category: "Foods", alternates: ["jollof"] },
  { id: 58, emojis: "🥩🌶️🍢", answer: "Suya", category: "Foods" },
  { id: 59, emojis: "🥘🍲🌿", answer: "Egusi Soup", category: "Foods", alternates: ["egusi"] },
  { id: 60, emojis: "🍩🔥🛢️", answer: "Puff Puff", category: "Foods", alternates: ["puff puff"] },
  { id: 61, emojis: "🌽🫘", answer: "Adalu", category: "Foods", alternates: ["beans and corn"] },
  { id: 62, emojis: "🍜🌶️🥩", answer: "Pepper Soup", category: "Foods" },
  { id: 63, emojis: "🍔🍟", answer: "Burger and Fries", category: "Foods", alternates: ["burger", "hamburger"] },
  { id: 64, emojis: "🍣🐟", answer: "Sushi", category: "Foods" },
  { id: 65, emojis: "🥞🍯", answer: "Pancakes", category: "Foods", alternates: ["pancake"] },
  { id: 66, emojis: "🍕🧀", answer: "Pizza", category: "Foods" },
  { id: 67, emojis: "🌮🥑", answer: "Tacos", category: "Foods", alternates: ["taco"] },
  { id: 68, emojis: "🍛🥄", answer: "Fried Rice", category: "Foods" },

  // ── Phrases ───────────────────────────────────────────
  { id: 69, emojis: "🐘🏠", answer: "Elephant in the Room", category: "Phrases" },
  { id: 70, emojis: "🍰✨👌", answer: "Piece of Cake", category: "Phrases" },
  { id: 71, emojis: "🌧️🐱🐶", answer: "Raining Cats and Dogs", category: "Phrases" },
  { id: 72, emojis: "💔🧊", answer: "Break the Ice", category: "Phrases" },
  { id: 73, emojis: "🐦🪱⏰", answer: "Early Bird Gets the Worm", category: "Phrases", alternates: ["early bird"] },
  { id: 74, emojis: "🏠❤️", answer: "Home Sweet Home", category: "Phrases" },
  { id: 75, emojis: "👁️🍎", answer: "Apple of My Eye", category: "Phrases" },
  { id: 76, emojis: "🐢🏁", answer: "Slow and Steady Wins the Race", category: "Phrases", alternates: ["slow and steady"] },
  { id: 77, emojis: "🌧️🌈", answer: "Every Cloud Has a Silver Lining", category: "Phrases", alternates: ["silver lining"] },
  { id: 78, emojis: "🐺🐑👕", answer: "Wolf in Sheep's Clothing", category: "Phrases", alternates: ["wolf in sheeps clothing"] },
  { id: 79, emojis: "🎯🎯", answer: "Hit the Nail on the Head", category: "Phrases", alternates: ["hit the nail on the head"] },
  { id: 80, emojis: "🧊🥶", answer: "Cold Shoulder", category: "Phrases", alternates: ["give the cold shoulder"] },

  // ── Nigerian Culture ────────────────────────────────────
  { id: 81, emojis: "🎵🥁🇳🇬", answer: "Afrobeats", category: "Nigerian Culture", alternates: ["afrobeat"] },
  { id: 82, emojis: "🚦🚗😤", answer: "Lagos Traffic", category: "Nigerian Culture", alternates: ["go slow", "traffic"] },
  { id: 83, emojis: "⚡❌🕯️", answer: "NEPA", category: "Nigerian Culture", alternates: ["phcn", "no light", "power outage"] },
  { id: 84, emojis: "🎉🥳🌙", answer: "Owambe", category: "Nigerian Culture", alternates: ["party"] },
  { id: 85, emojis: "🚌🟡💨", answer: "Danfo", category: "Nigerian Culture", alternates: ["molue", "yellow bus"] },
  { id: 86, emojis: "📱💬👥", answer: "WhatsApp Group", category: "Nigerian Culture", alternates: ["whatsapp"] },
  { id: 87, emojis: "🍛🏪🔥", answer: "Mama Put", category: "Nigerian Culture", alternates: ["buka"] },
  { id: 88, emojis: "📚😰✏️", answer: "JAMB", category: "Nigerian Culture", alternates: ["utme"] },
  { id: 89, emojis: "💰📱❌", answer: "Transfer Failed", category: "Nigerian Culture", alternates: ["failed transfer", "opay failed"] },
  { id: 90, emojis: "🎓🎉🎊", answer: "Convocation", category: "Nigerian Culture", alternates: ["graduation"] },
  { id: 91, emojis: "👔🤵💃", answer: "Aso Ebi", category: "Nigerian Culture", alternates: ["aso-ebi"] },
  { id: 92, emojis: "🛒🌧️☂️", answer: "Market Day", category: "Nigerian Culture", alternates: ["market"] },

  // ── Sports ──────────────────────────────────────────────
  { id: 93, emojis: "⚽🏆🌍", answer: "World Cup", category: "Sports", alternates: ["fifa world cup"] },
  { id: 94, emojis: "🏀🏀🔥", answer: "Basketball", category: "Sports" },
  { id: 95, emojis: "🏎️🏁", answer: "Formula 1", category: "Sports", alternates: ["f1", "formula one"] },
  { id: 96, emojis: "🥊🥊", answer: "Boxing", category: "Sports" },
  { id: 97, emojis: "🎾🍓", answer: "Wimbledon", category: "Sports" },
  { id: 98, emojis: "🏏🇮🇳", answer: "Cricket", category: "Sports" },
  { id: 99, emojis: "🏊🚴🏃", answer: "Triathlon", category: "Sports" },
  { id: 100, emojis: "⛳🏌️", answer: "Golf", category: "Sports" },
  { id: 101, emojis: "🏈🏟️", answer: "American Football", category: "Sports", alternates: ["football nfl", "nfl"] },
  { id: 102, emojis: "🤾‍♂️🥅", answer: "Handball", category: "Sports" },

  // ── Animals (titles / characters) ───────────────────────
  { id: 103, emojis: "🐧🎵❄️", answer: "Happy Feet", category: "Animals" },
  { id: 104, emojis: "🐠🔎🌊", answer: "Finding Nemo", category: "Animals" },
  { id: 105, emojis: "🦁👑🌅", answer: "The Lion King", category: "Animals", alternates: ["lion king"] },
  { id: 106, emojis: "🐒🍌🌴", answer: "Tarzan", category: "Animals" },
  { id: 107, emojis: "🦇🧛", answer: "Dracula", category: "Animals" },
  { id: 108, emojis: "🐝🍯🧸", answer: "Winnie the Pooh", category: "Animals", alternates: ["winnie the pooh"] },
  { id: 109, emojis: "🐢🥷🍕", answer: "Teenage Mutant Ninja Turtles", category: "Animals", alternates: ["tmnt", "ninja turtles"] },
  { id: 110, emojis: "🐺🌕", answer: "Werewolf", category: "Animals", alternates: ["wolf"] },

  // ── Books ───────────────────────────────────────────────
  { id: 111, emojis: "⚡👓🪄", answer: "Harry Potter", category: "Books" },
  { id: 112, emojis: "🐇🎩🕳️", answer: "Alice in Wonderland", category: "Books" },
  { id: 113, emojis: "🧪⚗️🧟", answer: "Frankenstein", category: "Books" },
  { id: 114, emojis: "🔍🎩🐕", answer: "Sherlock Holmes", category: "Books", alternates: ["sherlock"] },
  { id: 115, emojis: "🌹🐻🏰", answer: "Beauty and the Beast", category: "Books" },
  { id: 116, emojis: "🏝️👦📕", answer: "Lord of the Flies", category: "Books" },
  { id: 117, emojis: "📖✝️", answer: "The Bible", category: "Books", alternates: ["bible"] },
  { id: 118, emojis: "🐉🔥👧", answer: "Eragon", category: "Books" },

  // ── Occupations ─────────────────────────────────────────
  { id: 119, emojis: "💻⌨️🐛", answer: "Software Engineer", category: "Occupations", alternates: ["programmer", "developer"] },
  { id: 120, emojis: "🩺💉", answer: "Doctor", category: "Occupations", alternates: ["physician", "medical doctor"] },
  { id: 121, emojis: "✈️👨‍✈️", answer: "Pilot", category: "Occupations" },
  { id: 122, emojis: "👨‍🍳🔥", answer: "Chef", category: "Occupations", alternates: ["cook"] },
  { id: 123, emojis: "⚖️📜", answer: "Lawyer", category: "Occupations", alternates: ["attorney", "barrister"] },
  { id: 124, emojis: "🚀👨‍🚀", answer: "Astronaut", category: "Occupations" },
  { id: 125, emojis: "🛢️⚙️", answer: "Petroleum Engineer", category: "Occupations" },
  { id: 126, emojis: "🎨🖌️", answer: "Artist", category: "Occupations", alternates: ["painter"] },
  { id: 127, emojis: "📐🏗️", answer: "Architect", category: "Occupations" },
  { id: 128, emojis: "📰🎤", answer: "Journalist", category: "Occupations", alternates: ["reporter"] },

  // ── Landmarks ───────────────────────────────────────────
  { id: 129, emojis: "🗼🇫🇷", answer: "Eiffel Tower", category: "Landmarks" },
  { id: 130, emojis: "🗽🗽", answer: "Statue of Liberty", category: "Landmarks" },
  { id: 131, emojis: "🧱🐉", answer: "Great Wall of China", category: "Landmarks", alternates: ["great wall"] },
  { id: 132, emojis: "🕌💎", answer: "Taj Mahal", category: "Landmarks" },
  { id: 133, emojis: "🔺🏜️", answer: "Pyramids of Giza", category: "Landmarks", alternates: ["pyramids", "great pyramid"] },
  { id: 134, emojis: "🌉🌁", answer: "Golden Gate Bridge", category: "Landmarks" },
  { id: 135, emojis: "🏛️🇬🇷", answer: "Parthenon", category: "Landmarks", alternates: ["acropolis"] },
  { id: 136, emojis: "🗿🌊", answer: "Easter Island", category: "Landmarks", alternates: ["moai"] },

  // ── More Movies & mixed ───────────────────────────────
  { id: 137, emojis: "🧙‍♂️💍🌋", answer: "Lord of the Rings", category: "Movies", alternates: ["lotr", "lord of the rings"] },
  { id: 138, emojis: "⭐⚔️🚀", answer: "Star Wars", category: "Movies" },
  { id: 139, emojis: "🕷️🕸️🧑", answer: "Spider-Man", category: "Movies", alternates: ["spiderman", "spider man"] },
  { id: 140, emojis: "💀🌮🎸", answer: "Coco", category: "Movies" },
];

/* ── Category colors ── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Movies:             { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100" },
  "TV Shows":         { bg: "bg-purple-50",  text: "text-purple-600",  border: "border-purple-100" },
  Songs:              { bg: "bg-pink-50",    text: "text-pink-600",    border: "border-pink-100" },
  Countries:          { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  Foods:              { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-100" },
  Phrases:            { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100" },
  "Nigerian Culture": { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-100" },
  Sports:             { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-100" },
  Animals:            { bg: "bg-teal-50",    text: "text-teal-600",    border: "border-teal-100" },
  Books:              { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-100" },
  Occupations:        { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-100" },
  Landmarks:          { bg: "bg-cyan-50",    text: "text-cyan-600",    border: "border-cyan-100" },
};

export default function AnswersPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    let list = PUZZLES;
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.answer.toLowerCase().includes(q) ||
          p.emojis.includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.alternates?.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, Puzzle[]> = {};
    for (const p of filtered) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    return map;
  }, [filtered]);

  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emoji Decode - Answer Key</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              All {PUZZLES.length} puzzles &middot; {CATEGORIES.length} categories &middot; Reference only
            </p>
          </div>
        </div>
      </div>

      {/* Search + Category filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by answer, emoji, or category..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              activeCategory === "All"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
            }`}
          >
            All ({PUZZLES.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = PUZZLES.filter((p) => p.category === cat).length;
            const colors = CATEGORY_COLORS[cat] ?? { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-100" };
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
        <Hash size={12} />
        {filtered.length} puzzle{filtered.length !== 1 ? "s" : ""} shown
      </div>

      {/* Puzzle cards grouped by category */}
      {Object.entries(grouped).map(([category, puzzles]) => {
        const colors = CATEGORY_COLORS[category] ?? { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-100" };
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className={`px-5 py-3 border-b ${colors.border} ${colors.bg} flex items-center gap-2`}>
              <Smile size={14} className={colors.text} />
              <h2 className={`text-xs font-black uppercase tracking-widest ${colors.text}`}>{category}</h2>
              <span className={`ml-auto text-[10px] font-bold ${colors.text} opacity-60`}>{puzzles.length} puzzles</span>
            </div>

            <div className="divide-y divide-gray-50">
              {puzzles.map((puzzle) => (
                <div key={puzzle.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <span className="text-[10px] font-mono font-bold text-gray-300 w-6 text-right shrink-0">
                    #{puzzle.id}
                  </span>
                  <span className="text-2xl shrink-0 w-28 text-center">{puzzle.emojis}</span>
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-bold text-gray-900 truncate">{puzzle.answer}</p>
                    {puzzle.alternates && puzzle.alternates.length > 0 && (
                      <p className="text-[11px] text-gray-400 truncate">
                        Also accepted: {puzzle.alternates.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Smile size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">No puzzles match your search.</p>
        </div>
      )}
    </div>
  );
}
