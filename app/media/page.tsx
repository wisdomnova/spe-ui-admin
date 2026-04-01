"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Search, 
  Filter, 
  MoreVertical, 
  Image as ImageIcon, 
  X, 
  Check, 
  Trash2, 
  Download,
  Plus,
  Grid,
  List as ListIcon,
  FolderPlus,
  Tag as TagIcon,
  Loader2
} from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  tags: string[];
  file_group: string;
  created_at: string;
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const groups = ["All", "Events", "Team", "Blog Assets", "Manuals"];

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.map((f: any) => ({
          ...f,
          tags: f.tags || [],
          file_group: f.file_group || "All"
        })));
      }
    } catch {} finally { setLoading(false); }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          file.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGroup = selectedGroup === "All" || file.file_group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    if (uploadedFiles.length > 5) {
      alert("Please upload a maximum of 5 files at once.");
      return;
    }

    setIsUploading(true);
    try {
      for (const file of Array.from(uploadedFiles)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("file_group", selectedGroup === "All" ? "General" : selectedGroup);
        const res = await fetch("/api/media", { method: "POST", body: fd });
        if (res.ok) {
          const newFile = await res.json();
          setFiles(prev => [{ ...newFile, tags: newFile.tags || [], file_group: newFile.file_group || "General" }, ...prev]);
        }
      }
    } catch {} finally { setIsUploading(false); e.target.value = ""; }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (res.ok) setFiles(files.filter(f => f.id !== id));
    } catch {}
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-950 tracking-tight">Media Library</h2>
            <p className="text-gray-500 font-bold mt-2">Manage your assets, images and documents.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <ListIcon size={18} />
              </button>
            </div>
            
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 cursor-pointer">
              <Upload size={18} />
              {isUploading ? "Uploading..." : "Upload Media"}
              <input type="file" multiple onChange={handleUpload} className="hidden" accept="image/*,application/pdf" />
            </label>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or tags..." 
              className="w-full bg-gray-50 border-none rounded-3xl pl-14 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300 transition-all text-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
             {groups.map(group => (
               <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${selectedGroup === group ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
               >
                 {group}
               </button>
             ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-4"}>
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file, i) => (
              <motion.div
                layout
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className={`group bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 ${viewMode === "list" ? "flex items-center p-4 gap-6" : ""}`}
              >
                <div className={`${viewMode === "grid" ? "aspect-[4/3] w-full" : "w-20 h-20 rounded-2xl shrink-0"} relative overflow-hidden bg-gray-100`}>
                  {file.type.startsWith("image") ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <a href={file.url} download className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center hover:scale-110 transition-transform"><Download size={18} /></a>
                    <button onClick={() => handleDelete(file.id)} className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                  </div>
                </div>

                <div className={`p-6 ${viewMode === "list" ? "flex-1 p-0 flex items-center justify-between" : ""}`}>
                  <div className={viewMode === "list" ? "" : "mb-4"}>
                    <p className="text-sm font-black text-gray-950 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{file.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{file.size} • {formatDate(file.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {file.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-lg border border-gray-100 flex items-center gap-1">
                        <TagIcon size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <ImageIcon size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-950">No assets found</h3>
            <p className="text-gray-400 font-medium">Try adjusting your search or filters.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
