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
  { id: 1, emojis: "🦁👑", answer: "The Lion King", category: "Movies", alternates: ["lion king"] },
  { id: 2, emojis: "🕷️🧑", answer: "Spider-Man", category: "Movies", alternates: ["spiderman", "spider man"] },
  { id: 3, emojis: "🧊🚢💔", answer: "Titanic", category: "Movies" },
  { id: 4, emojis: "👻👻🔫", answer: "Ghostbusters", category: "Movies" },
  { id: 5, emojis: "🌍🦍", answer: "King Kong", category: "Movies" },
  { id: 6, emojis: "🧙‍♂️💍🌋", answer: "Lord of the Rings", category: "Movies", alternates: ["lotr"] },
  { id: 7, emojis: "🦈🌊", answer: "Jaws", category: "Movies" },
  { id: 8, emojis: "⭐🔫🚀", answer: "Star Wars", category: "Movies" },
  { id: 9, emojis: "🤖👍⏰", answer: "Terminator", category: "Movies", alternates: ["the terminator"] },
  { id: 10, emojis: "🏴‍☠️🚢⚓", answer: "Pirates of the Caribbean", category: "Movies", alternates: ["pirates of the carribean"] },
  { id: 11, emojis: "👨‍🚀🌑🚀", answer: "Interstellar", category: "Movies" },
  { id: 12, emojis: "🥊🏆🇮🇹", answer: "Rocky", category: "Movies" },
  { id: 13, emojis: "🦖🏝️🧬", answer: "Jurassic Park", category: "Movies", alternates: ["jurassic world"] },
  { id: 14, emojis: "🔵👤🌿🏹", answer: "Avatar", category: "Movies" },
  { id: 15, emojis: "🧊❄️👸⛄", answer: "Frozen", category: "Movies" },
  { id: 16, emojis: "🃏😈🦇", answer: "The Dark Knight", category: "Movies", alternates: ["dark knight", "batman"] },
  { id: 17, emojis: "🐀👨‍🍳🇫🇷", answer: "Ratatouille", category: "Movies" },
  { id: 18, emojis: "💀🌹🏴‍☠️", answer: "Black Panther", category: "Movies" },
  { id: 19, emojis: "🧪🔬🦎", answer: "The Amazing Spider-Man", category: "Movies", alternates: ["amazing spiderman", "the lizard"] },
  { id: 20, emojis: "🏠🔑👦🎄", answer: "Home Alone", category: "Movies" },
  { id: 21, emojis: "🐉🗡️🔥👸", answer: "Game of Thrones", category: "TV Shows", alternates: ["got"] },
  { id: 22, emojis: "🤠🏜️💊", answer: "Breaking Bad", category: "TV Shows" },
  { id: 23, emojis: "👽🔦🚲", answer: "Stranger Things", category: "TV Shows" },
  { id: 24, emojis: "🏝️💰🎰", answer: "Squid Game", category: "TV Shows" },
  { id: 25, emojis: "👑💎🇬🇧", answer: "The Crown", category: "TV Shows", alternates: ["crown"] },
  { id: 26, emojis: "🎵👦🔥🌧️", answer: "Let It Rain", category: "Songs" },
  { id: 27, emojis: "💃🌟🎤", answer: "Single Ladies", category: "Songs" },
  { id: 28, emojis: "🎸⚡🤘", answer: "Thunderstruck", category: "Songs" },
  { id: 29, emojis: "🌅🎶🏖️", answer: "Summer of 69", category: "Songs", alternates: ["summer of sixty nine"] },
  { id: 30, emojis: "🎤👩‍🦰🔥🏠", answer: "Girl on Fire", category: "Songs" },
  { id: 31, emojis: "🌍🤝✌️", answer: "We Are the World", category: "Songs" },
  { id: 32, emojis: "💜🌧️🎵🕺", answer: "Purple Rain", category: "Songs" },
  { id: 33, emojis: "🚗💨🏎️", answer: "Fast Car", category: "Songs" },
  { id: 34, emojis: "🕺💃🌙", answer: "Dancing in the Moonlight", category: "Songs", alternates: ["dance in the moonlight"] },
  { id: 35, emojis: "🎵😢💔🌧️", answer: "Crying in the Rain", category: "Songs" },
  { id: 36, emojis: "🍕🏛️🎭🇮🇹", answer: "Italy", category: "Countries" },
  { id: 37, emojis: "🗼🥐🍷🇫🇷", answer: "France", category: "Countries" },
  { id: 38, emojis: "🏯🍣🌸🗾", answer: "Japan", category: "Countries" },
  { id: 39, emojis: "🐨🦘🏏", answer: "Australia", category: "Countries" },
  { id: 40, emojis: "🌍🟢⚪🟢", answer: "Nigeria", category: "Countries" },
  { id: 41, emojis: "🗽🦅🏈", answer: "America", category: "Countries", alternates: ["usa", "united states", "us"] },
  { id: 42, emojis: "🐂🏟️💃🌞", answer: "Spain", category: "Countries" },
  { id: 43, emojis: "🍁🏒🦫", answer: "Canada", category: "Countries" },
  { id: 44, emojis: "🏏🍛🕌🐅", answer: "India", category: "Countries" },
  { id: 45, emojis: "🐪🏜️🛢️💰", answer: "Saudi Arabia", category: "Countries", alternates: ["saudi"] },
  { id: 46, emojis: "🎭🐘🌴🥁", answer: "Ghana", category: "Countries" },
  { id: 47, emojis: "🐉🏯🥢🧧", answer: "China", category: "Countries" },
  { id: 48, emojis: "⚽🎉🏖️☕", answer: "Brazil", category: "Countries" },
  { id: 49, emojis: "🍚🍅🥩🔥", answer: "Jollof Rice", category: "Foods", alternates: ["jollof"] },
  { id: 50, emojis: "🌽🫘🥘", answer: "Adalu", category: "Foods", alternates: ["beans and corn"] },
  { id: 51, emojis: "🥟🍲🌿", answer: "Egusi Soup", category: "Foods", alternates: ["egusi"] },
  { id: 52, emojis: "🍜🥩🧅🌶️", answer: "Pepper Soup", category: "Foods" },
  { id: 53, emojis: "🍕🧀🍅", answer: "Pizza", category: "Foods" },
  { id: 54, emojis: "🍔🍟🥤", answer: "Burger", category: "Foods", alternates: ["hamburger"] },
  { id: 55, emojis: "🍣🐟🍚", answer: "Sushi", category: "Foods" },
  { id: 56, emojis: "🫔🌶️🧅🥩", answer: "Suya", category: "Foods" },
  { id: 57, emojis: "🥘🍚🌿🐟", answer: "Fisherman Soup", category: "Foods" },
  { id: 58, emojis: "🫓🥜🍲", answer: "Groundnut Soup", category: "Foods", alternates: ["peanut soup"] },
  { id: 59, emojis: "🥞🍯🧈", answer: "Pancakes", category: "Foods", alternates: ["pancake"] },
  { id: 60, emojis: "🍝🍅🧀🌿", answer: "Spaghetti", category: "Foods" },
  { id: 61, emojis: "🐘🏠", answer: "Elephant in the Room", category: "Phrases" },
  { id: 62, emojis: "☁️9️⃣", answer: "Cloud Nine", category: "Phrases", alternates: ["on cloud nine"] },
  { id: 63, emojis: "💔🧊", answer: "Break the Ice", category: "Phrases" },
  { id: 64, emojis: "🌧️🐱🐶", answer: "Raining Cats and Dogs", category: "Phrases" },
  { id: 65, emojis: "🎯🐂👁️", answer: "Bullseye", category: "Phrases", alternates: ["bulls eye", "bull's eye"] },
  { id: 66, emojis: "⏰💣", answer: "Time Bomb", category: "Phrases", alternates: ["ticking time bomb"] },
  { id: 67, emojis: "🐝🦵", answer: "Bees Knees", category: "Phrases", alternates: ["the bees knees", "bee's knees"] },
  { id: 68, emojis: "🍰🧁🎂", answer: "Piece of Cake", category: "Phrases" },
  { id: 69, emojis: "👀🐑", answer: "Black Sheep", category: "Phrases", alternates: ["the black sheep"] },
  { id: 70, emojis: "🎒🐒", answer: "Monkey on Your Back", category: "Phrases" },
  { id: 71, emojis: "💡💡💡", answer: "Bright Idea", category: "Phrases" },
  { id: 72, emojis: "🐔🥚", answer: "Chicken or the Egg", category: "Phrases", alternates: ["chicken and egg"] },
  { id: 73, emojis: "🟢⚪🟢🦅", answer: "Nigerian Flag", category: "Nigerian Culture", alternates: ["nigeria flag"] },
  { id: 74, emojis: "🎵🥁💃🇳🇬", answer: "Afrobeats", category: "Nigerian Culture", alternates: ["afrobeat"] },
  { id: 75, emojis: "🛣️🚗🚕😤", answer: "Lagos Traffic", category: "Nigerian Culture", alternates: ["go slow", "traffic"] },
  { id: 76, emojis: "⚡🔦🕯️😒", answer: "NEPA", category: "Nigerian Culture", alternates: ["phcn", "power outage", "no light"] },
  { id: 77, emojis: "💰📱🏦❌", answer: "Transfer Failed", category: "Nigerian Culture", alternates: ["failed transaction"] },
  { id: 78, emojis: "🎓📚😴💤", answer: "Night Class", category: "Nigerian Culture", alternates: ["reading at night"] },
  { id: 79, emojis: "🚌🏃‍♂️💨🚏", answer: "Danfo", category: "Nigerian Culture", alternates: ["molue", "bus"] },
  { id: 80, emojis: "🍛🏪💵🔥", answer: "Mama Put", category: "Nigerian Culture", alternates: ["buka"] },
  { id: 81, emojis: "📱💬🤳👥", answer: "WhatsApp Group", category: "Nigerian Culture", alternates: ["whatsapp"] },
  { id: 82, emojis: "🎉🥳🎶🌙", answer: "Owambe", category: "Nigerian Culture", alternates: ["party"] },
  { id: 83, emojis: "👨‍🏫📖🏫😰", answer: "JAMB", category: "Nigerian Culture", alternates: ["utme"] },
  { id: 84, emojis: "⛪🕌🙏🌅", answer: "Sunday Service", category: "Nigerian Culture", alternates: ["church"] },
  { id: 85, emojis: "⚽🏟️🏆🌍", answer: "World Cup", category: "Sports", alternates: ["fifa world cup"] },
  { id: 86, emojis: "🏀🏀💨🔥", answer: "Basketball", category: "Sports" },
  { id: 87, emojis: "🏎️🏁💨", answer: "Formula 1", category: "Sports", alternates: ["f1", "formula one"] },
  { id: 88, emojis: "🏊‍♂️🚴‍♂️🏃‍♂️", answer: "Triathlon", category: "Sports" },
  { id: 89, emojis: "🥊🔔🏆", answer: "Boxing", category: "Sports" },
  { id: 90, emojis: "🎾🏟️🍓🥛", answer: "Wimbledon", category: "Sports" },
  { id: 91, emojis: "🏈🏟️🎵🇺🇸", answer: "Super Bowl", category: "Sports", alternates: ["superbowl"] },
  { id: 92, emojis: "⛳🏌️‍♂️🟩🕳️", answer: "Golf", category: "Sports" },
  { id: 93, emojis: "🐢🥷🍕", answer: "Teenage Mutant Ninja Turtles", category: "Animals", alternates: ["ninja turtles", "tmnt"] },
  { id: 94, emojis: "🐧❄️🕺🎵", answer: "Happy Feet", category: "Animals" },
  { id: 95, emojis: "🐠🔍🌊", answer: "Finding Nemo", category: "Animals" },
  { id: 96, emojis: "🐝🍯🧸", answer: "Winnie the Pooh", category: "Animals", alternates: ["winnie the pooh bear"] },
  { id: 97, emojis: "🐺🌕🗡️", answer: "Wolverine", category: "Animals" },
  { id: 98, emojis: "🦇🌙🏰", answer: "Dracula", category: "Animals" },
  { id: 99, emojis: "🐒🍌🌴", answer: "Tarzan", category: "Animals" },
  { id: 100, emojis: "🐁👂🏰✨", answer: "Mickey Mouse", category: "Animals" },
  { id: 101, emojis: "🧙‍♂️⚡👓📚", answer: "Harry Potter", category: "Books" },
  { id: 102, emojis: "🕳️🐇🎩☕", answer: "Alice in Wonderland", category: "Books", alternates: ["alice's adventures in wonderland"] },
  { id: 103, emojis: "🫖🍰🎩🐇", answer: "Mad Hatter", category: "Books", alternates: ["the mad hatter"] },
  { id: 104, emojis: "📖🕊️🗡️😇", answer: "The Bible", category: "Books", alternates: ["bible"] },
  { id: 105, emojis: "🧪👨‍🔬🧟‍♂️🌙", answer: "Frankenstein", category: "Books" },
  { id: 106, emojis: "🏝️📕👦🐚", answer: "Lord of the Flies", category: "Books" },
  { id: 107, emojis: "🕵️‍♂️🔍💀🏚️", answer: "Sherlock Holmes", category: "Books", alternates: ["sherlock"] },
  { id: 108, emojis: "🌹👸🐻🏰", answer: "Beauty and the Beast", category: "Books" },
  { id: 109, emojis: "🛢️⛽📊🔧", answer: "Petroleum Engineer", category: "Occupations" },
  { id: 110, emojis: "💉🩺🏥👨‍⚕️", answer: "Doctor", category: "Occupations", alternates: ["physician"] },
  { id: 111, emojis: "✈️🧑‍✈️☁️🌍", answer: "Pilot", category: "Occupations" },
  { id: 112, emojis: "👨‍🍳🔥🍳🧂", answer: "Chef", category: "Occupations", alternates: ["cook"] },
  { id: 113, emojis: "⚖️👨‍💼📜🏛️", answer: "Lawyer", category: "Occupations", alternates: ["attorney"] },
  { id: 114, emojis: "🚀👨‍🚀🌙⭐", answer: "Astronaut", category: "Occupations" },
  { id: 115, emojis: "🎨🖌️🖼️✨", answer: "Artist", category: "Occupations", alternates: ["painter"] },
  { id: 116, emojis: "💻👨‍💻🐛🔧", answer: "Software Engineer", category: "Occupations", alternates: ["programmer", "developer"] },
  { id: 117, emojis: "🗽🇺🇸🌊", answer: "Statue of Liberty", category: "Landmarks" },
  { id: 118, emojis: "🏛️🇬🇷🏔️", answer: "Parthenon", category: "Landmarks", alternates: ["acropolis"] },
  { id: 119, emojis: "🗼✨🇫🇷🌙", answer: "Eiffel Tower", category: "Landmarks" },
  { id: 120, emojis: "🧱🐉🏔️🇨🇳", answer: "Great Wall of China", category: "Landmarks", alternates: ["great wall"] },
  { id: 121, emojis: "🏰🧜‍♀️🇩🇰", answer: "Little Mermaid Statue", category: "Landmarks", alternates: ["little mermaid"] },
  { id: 122, emojis: "🕌💎🇮🇳🤍", answer: "Taj Mahal", category: "Landmarks" },
  { id: 123, emojis: "🏜️🔺🐫🇪🇬", answer: "Pyramids of Giza", category: "Landmarks", alternates: ["pyramids", "great pyramid"] },
  { id: 124, emojis: "🌉🌫️🔴", answer: "Golden Gate Bridge", category: "Landmarks" },
  { id: 125, emojis: "👩‍🦰🧜‍♀️🌊🐠", answer: "The Little Mermaid", category: "Movies", alternates: ["little mermaid"] },
  { id: 126, emojis: "🤴⚔️🏰🐴", answer: "Braveheart", category: "Movies" },
  { id: 127, emojis: "🎭🎵🌹👻", answer: "Phantom of the Opera", category: "Movies", alternates: ["the phantom of the opera"] },
  { id: 128, emojis: "🧞‍♂️🪄🏜️👸", answer: "Aladdin", category: "Movies" },
  { id: 129, emojis: "🌹🐻🏰☕", answer: "Beauty and the Beast", category: "Movies" },
  { id: 130, emojis: "💀🌮🎸🇲🇽", answer: "Coco", category: "Movies" },
  { id: 131, emojis: "🔥👖", answer: "Liar Liar Pants on Fire", category: "Phrases", alternates: ["liar liar"] },
  { id: 132, emojis: "🐦🪱⏰", answer: "Early Bird Gets the Worm", category: "Phrases", alternates: ["early bird"] },
  { id: 133, emojis: "🏠❤️", answer: "Home Sweet Home", category: "Phrases" },
  { id: 134, emojis: "💡🔚🚇", answer: "Light at the End of the Tunnel", category: "Phrases", alternates: ["light at end of tunnel"] },
  { id: 135, emojis: "🐎💀", answer: "Dead Horse", category: "Phrases", alternates: ["beating a dead horse"] },
  { id: 136, emojis: "🧊🧊👶", answer: "Ice Ice Baby", category: "Phrases" },
  { id: 137, emojis: "💰🗣️", answer: "Money Talks", category: "Phrases" },
  { id: 138, emojis: "👁️👁️🗡️", answer: "Eye for an Eye", category: "Phrases", alternates: ["an eye for an eye"] },
  { id: 139, emojis: "🐍✈️", answer: "Snakes on a Plane", category: "Phrases" },
  { id: 140, emojis: "🌈🦄✨", answer: "Over the Rainbow", category: "Phrases", alternates: ["somewhere over the rainbow"] },
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
