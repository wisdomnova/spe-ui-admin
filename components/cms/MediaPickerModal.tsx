"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  Check, 
  Image as ImageIcon,
  Grid,
  List as ListIcon,
  Filter,
  CheckCircle2,
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

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile) => void;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect }: MediaPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && files.length === 0) {
      setLoading(true);
      fetch("/api/media")
        .then(r => r.ok ? r.json() : [])
        .then(data => setFiles(data.map((f: any) => ({ ...f, tags: f.tags || [], file_group: f.file_group || "All" }))))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const groups = ["All", "Events", "Team", "Blog Assets"];

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            file.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesGroup = selectedGroup === "All" || file.file_group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [searchQuery, selectedGroup, files]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-blue-950/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <header className="px-12 py-10 border-b border-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <ImageIcon size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tight">Select Media</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Pick an asset for your project</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-950 hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>
            </header>

            {/* Content Body */}
            <div className="flex-1 flex min-h-0">
              {/* Left Column: Filter & Search + Grid */}
              <div className="flex-1 flex flex-col min-h-0 border-r border-gray-50">
                <div className="p-10 space-y-6 shrink-0 bg-white shadow-sm shadow-gray-50/50 z-10">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search assets..." 
                      className="w-full bg-gray-50 border-none rounded-3xl pl-14 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-500/10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {groups.map(group => (
                      <button
                        key={group}
                        onClick={() => setSelectedGroup(group)}
                        className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${selectedGroup === group ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredFiles.map((file) => (
                      <motion.div
                        key={file.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFile(file)}
                        className={`group relative rounded-[2rem] overflow-hidden border-2 cursor-pointer transition-all ${selectedFile?.id === file.id ? "border-blue-600 p-1.5 shadow-xl shadow-blue-500/10" : "border-gray-50"}`}
                      >
                        <div className={`aspect-square rounded-[1.5rem] overflow-hidden relative ${selectedFile?.id === file.id ? "" : ""}`}>
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          {selectedFile?.id === file.id && (
                            <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center backdrop-blur-[2px]">
                              <CheckCircle2 size={32} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight truncate">{file.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Preview & Metadata */}
              <div className="w-[340px] shrink-0 bg-[#fafafa] flex flex-col">
                <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                  {selectedFile ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      <div className="aspect-square w-full rounded-3xl overflow-hidden shadow-2xl shadow-gray-200">
                        <img src={selectedFile.url} alt="Selection" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight break-all">{selectedFile.name}</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">Size</p>
                            <p className="text-[10px] font-bold text-gray-600">{selectedFile.size}</p>
                          </div>
                          <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">Created</p>
                            <p className="text-[10px] font-bold text-gray-600">{new Date(selectedFile.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                          <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">Tags</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedFile.tags.map(tag => (
                                <span key={tag} className="text-[8px] font-bold px-1.5 py-0.5 bg-gray-50 rounded italic text-gray-400">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                      <ImageIcon size={48} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select a file to<br/>see details</p>
                    </div>
                  )}
                </div>

                <div className="p-10 bg-white border-t border-gray-50">
                  <button 
                    disabled={!selectedFile}
                    onClick={() => selectedFile && onSelect(selectedFile)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Select File
                    <Check size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
