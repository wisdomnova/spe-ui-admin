"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Edit2, Copy, Trash2, Eye, Loader2, Check, Link2, FileText, BarChart3, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface Blog {
  id: string;
  title: string;
  author: string;
  created_at: string;
  status: "Published" | "Draft";
  category: string;
  read_time: string;
  slug: string;
  tags: string[];
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Published" | "Draft">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBlogs();
    fetchViewCounts();
  }, []);

  const fetchViewCounts = async () => {
    try {
      const res = await fetch("/api/analytics?period=all");
      if (res.ok) {
        const data = await res.json();
        setViewCounts(data.blogViewCounts || {});
        setLikeCounts(data.blogLikeCounts || {});
      }
    } catch {}
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch {
      console.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs(blogs.filter(b => b.id !== id));
      }
    } catch {
      console.error("Failed to delete blog");
    }
  };

  const filtered = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Blogs</h2>
            <p className="text-gray-500 font-medium">Manage, edit, and publish your narratives.</p>
          </div>
          
          <Link href="/blogs/new" className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} />
            Create Story
          </Link>
        </header>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 text-gray-400 focus-within:border-blue-200 transition-colors">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search stories..." 
              className="bg-transparent border-0 outline-none text-sm font-bold text-gray-900 w-full placeholder:text-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`bg-white border px-6 py-4 rounded-2xl transition-colors flex items-center gap-3 font-bold text-sm ${
                statusFilter !== "All" ? "border-blue-200 text-blue-600" : "border-gray-100 text-gray-400 hover:text-gray-900"
              }`}
            >
              <Filter size={18} />
              {statusFilter === "All" ? "Filters" : statusFilter}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {(["All", "Published", "Draft"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(status); setShowFilters(false); }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${
                        statusFilter === status ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-gray-300" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">No stories found</h3>
            <p className="text-gray-400 font-medium mt-1">
              {search || statusFilter !== "All" ? "Try adjusting your search or filters." : "Create your first post to get started."}
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          {filtered.map((blog, i) => (
            <motion.div 
              key={blog.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8"
            >
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                    blog.status === 'Published' ? 'text-green-600 border-green-100 bg-green-50' : 'text-orange-600 border-orange-100 bg-orange-50'
                  }`}>
                    {blog.status}
                  </span>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{blog.category}</span>
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors max-w-2xl leading-tight">{blog.title}</h3>
                
                <div className="flex flex-wrap items-center gap-8 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2">{blog.author}</span>
                  <span className="flex items-center gap-2">{formatDate(blog.created_at)}</span>
                  <span className="flex items-center gap-2 text-blue-500/50">{blog.read_time}</span>
                  <span className="flex items-center gap-1.5 text-green-600">
                    <Eye size={12} />
                    {(viewCounts[blog.id] || 0).toLocaleString()} view{viewCounts[blog.id] !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5 text-pink-500">
                    <ThumbsUp size={12} />
                    {(likeCounts[blog.id] || 0).toLocaleString()} like{likeCounts[blog.id] !== 1 ? "s" : ""}
                  </span>
                </div>

                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {blog.tags.map((tag) => (
                      <span key={tag} className="inline-block bg-blue-50 text-blue-500 rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 md:border-l md:border-gray-50 md:pl-8">
                <Link href={`/analytics/${blog.id}`} className="p-4 text-gray-300 hover:text-green-600 hover:bg-green-50 transition-all rounded-2xl" title="Analytics">
                  <BarChart3 size={20} />
                </Link>
                <Link href={`/blogs/new?edit=${blog.id}`} className="p-4 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-2xl" title="Edit">
                  <Edit2 size={20} />
                </Link>
                <button 
                  onClick={() => {
                    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://spe-ui.vercel.app').replace(/\/$/, '');
                    navigator.clipboard.writeText(`${siteUrl}/blog/${blog.slug}`);
                    setCopiedId(blog.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }} 
                  className={`p-4 transition-all rounded-2xl ${copiedId === blog.id ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-blue-600 hover:bg-blue-50'}`} 
                  title="Copy Link"
                >
                  {copiedId === blog.id ? <Check size={20} /> : <Link2 size={20} />}
                </button>
                <button onClick={() => handleDelete(blog.id)} className="p-4 text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all rounded-2xl" title="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </motion.div>
    </div>
  );
}
