'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronRight,
  Send,
  Check,
  Image as ImageIcon,
  Tag,
  Layout,
  Calendar,
  ChevronDown,
  X,
  ArrowLeft,
  Save,
  Link2,
  User,
  Users,
  Hash
} from 'lucide-react';
import BlogEditor from '@/components/cms/BlogEditor';
import MediaPickerModal from '@/components/cms/MediaPickerModal';
import MemberPickerModal from '@/components/cms/MemberPickerModal';
import { useSearchParams } from 'next/navigation';

const DRAFT_KEY = 'spe_blog_draft';

interface DraftData {
  title: string;
  content: string;
  slug: string;
  category: string;
  description: string;
  slugImage: string | null;
  authorName: string;
  authorImageUrl: string | null;
  authorRole: string;
  tags: string[];
  savedAt: string;
}

export default function NewBlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <NewBlogPageContent />
    </Suspense>
  );
}

function NewBlogPageContent() {
  const [isPreview, setIsPreview] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('News');
  const [description, setDescription] = useState('');
  const [slugImage, setSlugImage] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorImageUrl, setAuthorImageUrl] = useState<string | null>(null);
  const [authorRole, setAuthorRole] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const searchParams = useSearchParams();

  // ── Load existing blog when editing ──
  useEffect(() => {
    const id = searchParams.get('edit');
    if (id) {
      setEditId(id);
      setEditLoading(true);
      fetch(`/api/blogs/${id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setTitle(data.title || '');
            setContent(data.content || '');
            setSlug(data.slug || '');
            setCategory(data.category || 'News');
            setDescription(data.description || '');
            setSlugImage(data.cover_image_url || null);
            setAuthorName(data.author_name || data.author || '');
            setAuthorImageUrl(data.author_image_url || null);
            setAuthorRole(data.author_role || '');
            setTags(data.tags || []);
            hasMounted.current = true;
          }
          setEditLoading(false);
        })
        .catch(() => setEditLoading(false));
    }
  }, [searchParams]);

  // Autosave state
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMounted = useRef(false);

  // ── New post: clear any stale draft so we always start fresh ──
  useEffect(() => {
    if (searchParams.get('edit')) { hasMounted.current = true; return; }
    localStorage.removeItem(DRAFT_KEY);
    hasMounted.current = true;
  }, [searchParams]);

  // ── Autosave function ──
  const saveDraft = useCallback(() => {
    setIsSaving(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const draft: DraftData = { title, content, slug, category, description, slugImage, authorName, authorImageUrl, authorRole, tags, savedAt: now };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastSaved(now);
    } catch {}
    // Brief flash of "saving" indicator
    setTimeout(() => setIsSaving(false), 400);
  }, [title, content, slug, category, description, slugImage, authorName, authorImageUrl, authorRole, tags]);

  // ── Debounced autosave on any field change ──
  useEffect(() => {
    if (!hasMounted.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(), 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content, slug, category, description, slugImage, authorName, authorImageUrl, authorRole, tags, saveDraft]);

  // ── Clear draft after successful publish ──
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
  };

  /** Process HTML for preview: fix empty paragraphs & render captions */
  const processContent = (html: string) => {
    let processed = html.replace(/<p><\/p>/g, '<p><br></p>');
    processed = processed.replace(
      /<img\s([^>]*?)data-caption="([^"]*)"([^>]*?)\/?>/g,
      '<figure class="image-figure" data-type="image" style="margin:2rem auto;text-align:center"><img $1$3 style="border-radius:1rem;margin:0 auto"><figcaption style="margin-top:0.5rem;font-size:0.875rem;font-style:italic;color:#6b7280">$2</figcaption></figure>'
    );
    return processed;
  };

  const categories = [
    "News", "Sports", "Interview", "Spotlight", 
    "Events", "Editorial", "Articles", "Others"
  ];

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError("");

    try {
      // Auto-generate slug from title if not set
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const payload = {
        title,
        slug: finalSlug,
        category,
        description,
        content,
        cover_image_url: slugImage,
        author: authorName || "Admin",
        author_name: authorName || "Admin",
        author_image_url: authorImageUrl,
        author_role: authorRole,
        tags,
        status: "Published",
        read_time: `${Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200))} min read`,
      };

      const isEdit = !!editId;
      const res = await fetch(isEdit ? `/api/blogs/${editId}` : "/api/blogs", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setPublishError(data.error || "Failed to publish");
        setIsPublishing(false);
        return;
      }

      setIsPublishing(false);
      setShowConsent(false);
      if (!isEdit) clearDraft();
      setPublishedSlug(finalSlug);
      setShowSuccess(true);
    } catch {
      setPublishError("Connection error");
      setIsPublishing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlugImage(reader.result as string);
      };
      if (file) { reader.readAsDataURL(file); }
    }
  };

  const handleMediaSelect = (file: any) => {
    setSlugImage(file.url);
    setShowMediaPicker(false);
  };

  const handleAuthorFromTeam = (member: any) => {
    setAuthorName(member.name);
    setAuthorImageUrl(member.image_url || null);
    setAuthorRole(member.role || '');
    setShowMemberPicker(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Navigation */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 lg:px-12 py-4 lg:py-6">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <button 
                onClick={() => window.history.back()}
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black text-gray-950 flex items-center gap-3 truncate">
                  {editId ? 'Editing Post' : 'Drafting Post'}
                  {isSaving ? (
                    <Save size={14} className="text-blue-500 animate-pulse" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate">
                  {isSaving ? 'Saving...' : lastSaved ? `Autosaved at ${lastSaved}` : 'Not saved yet'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden sm:flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <button 
                  onClick={() => setIsPreview(false)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isPreview ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Write
                </button>
                <button 
                  onClick={() => setIsPreview(true)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isPreview ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Preview
                </button>
              </div>
              {/* Mobile toggle */}
              <div className="flex sm:hidden bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button 
                  onClick={() => setIsPreview(false)}
                  className={`p-2 rounded-lg transition-all ${!isPreview ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => setIsPreview(true)}
                  className={`p-2 rounded-lg transition-all ${isPreview ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  <Eye size={16} />
                </button>
              </div>
              <button 
                onClick={() => setShowConsent(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <Send size={14} className="opacity-80" />
                <span className="hidden sm:inline">{editId ? 'Update' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-12">
          {editLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="text-sm font-bold text-gray-400">Loading post...</p>
              </div>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {!isPreview ? (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-12"
              >
                <div className="lg:col-span-3 space-y-12">
                  <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm shadow-blue-50/20">
                    <textarea 
                      placeholder="Enter a compelling title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-5xl font-black text-gray-950 placeholder-gray-100 focus:outline-none resize-none bg-transparent leading-[1.1] mb-12"
                      rows={2}
                    />
                    
                    <BlogEditor 
                      content={content} 
                      onChange={setContent} 
                    />
                  </div>
                </div>

                <aside className="lg:col-span-1 space-y-8 h-fit sticky top-36">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm shadow-blue-50/20 space-y-8">
                    <header className="pb-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Settings</h3>
                      <ChevronDown size={14} className="text-gray-400" />
                    </header>

                    <div className="space-y-6">
                      {/* Slug Image Upload */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ImageIcon size={10} className="text-blue-500" />
                          Cover Image
                        </label>
                        <div className="relative group">
                          <div className={`w-full h-40 rounded-2xl border-2 border-dashed ${slugImage ? 'border-blue-200' : 'border-gray-100'} flex flex-col items-center justify-center overflow-hidden bg-gray-50 transition-all hover:bg-white`}>
                            {slugImage ? (
                              <img src={slugImage} alt="Slug Cover" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-4">
                                <Plus className="mx-auto text-gray-300 mb-2" size={24} />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Image</p>
                              </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/10 backdrop-blur-[2px]">
                              <div className="flex flex-col gap-2 p-4 w-full h-full">
                                <button 
                                  onClick={() => setShowMediaPicker(true)}
                                  className="flex-1 bg-white border border-gray-100 rounded-xl font-black text-[9px] uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                                >
                                  Select from Library
                                </button>
                                <label className="flex-1 bg-white border border-gray-100 rounded-xl font-black text-[9px] uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center justify-center cursor-pointer">
                                  Upload Local
                                  <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layout size={10} className="text-blue-500" />
                          Custom Slug
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. innovation-summit-2024" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Tag size={10} className="text-blue-500" />
                          Category
                        </label>
                        <select 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {categories.map((cat) => (
                            <option key={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={10} className="text-blue-500" />
                          Description
                        </label>
                        <textarea 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 h-24 resize-none"
                          placeholder="Snippet for SEO and previews..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>

                      {/* Author */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <User size={10} className="text-blue-500" />
                          Author
                        </label>

                        {authorName && (
                          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            {authorImageUrl ? (
                              <img src={authorImageUrl} alt={authorName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                                {authorName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-gray-900 truncate">{authorName}</p>
                              {authorRole && <p className="text-[10px] font-bold text-gray-400 truncate">{authorRole}</p>}
                            </div>
                            <button onClick={() => { setAuthorName(''); setAuthorImageUrl(null); setAuthorRole(''); }} className="text-gray-300 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setShowMemberPicker(true)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                        >
                          <Users size={12} />
                          Pick from Team
                        </button>

                        <div className="space-y-2">
                          <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 placeholder:text-gray-300"
                            placeholder="Or type author name..."
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                          />
                          <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 placeholder:text-gray-300"
                            placeholder="Author role (e.g. Editor)"
                            value={authorRole}
                            onChange={(e) => setAuthorRole(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Hash size={10} className="text-blue-500" />
                          Tags
                        </label>

                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 placeholder:text-gray-300"
                            placeholder="Add a tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                          />
                          <button
                            onClick={addTag}
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto space-y-12"
              >
                <div className="bg-white px-6 py-10 sm:px-12 sm:py-16 lg:px-20 lg:py-24 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl shadow-blue-100/20 border border-gray-100 min-h-[600px] lg:min-h-[800px]">
                  <div className="flex items-center gap-4 mb-12">
                    <span className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {category}
                    </span>
                    <span className="text-xs font-bold text-gray-300">2 min read</span>
                  </div>

                  <h1 className="text-6xl font-black text-gray-950 leading-[1.1] mb-12 tracking-tight">
                    {title || "Untitled Story"}
                  </h1>

                  {slugImage && (
                    <div className="w-full h-[450px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl">
                      <img src={slugImage} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div 
                    className="prose prose-xl prose-blue max-w-none text-gray-800 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: processContent(content) || "<p class='text-gray-200'>Nothing to preview yet...</p>" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </main>

        {/* Modals */}
        <AnimatePresence>
          {showConsent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isPublishing && setShowConsent(false)}
                className="absolute inset-0 bg-blue-950/40 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800" />
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Send size={32} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-950">{editId ? 'Save changes?' : 'Ready to publish?'}</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      {editId 
                        ? <>Your updates will be <span className="text-blue-600 font-bold">live immediately</span> on the main site.</>
                        : <>This will make your post <span className="text-blue-600 font-bold">visible to everyone</span> on the main site.</>}
                    </p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      disabled={isPublishing}
                      onClick={() => setShowConsent(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 border-2 border-gray-50 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      Wait
                    </button>
                    <button 
                      disabled={isPublishing}
                      onClick={handlePublish}
                      className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPublishing ? (editId ? 'Saving...' : 'Publishing...') : (editId ? 'Save Changes' : 'Go Live')}
                    </button>
                  </div>
                  {publishError && (
                    <p className="text-red-500 text-xs font-bold text-center mt-4">{publishError}</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {showSuccess && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="relative text-center space-y-8"
              >
                <div className="w-32 h-32 bg-green-500 rounded-full mx-auto flex items-center justify-center text-white shadow-2xl shadow-green-500/30">
                  <Check size={64} strokeWidth={3} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-950">{editId ? 'Updated!' : 'Published!'}</h2>
                  <p className="text-gray-500 font-bold">{editId ? 'Your changes are live.' : 'Your story is officially out in the world.'}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => {
                      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://spe-ui.vercel.app').replace(/\/$/, '');
                      const url = `${siteUrl}/blog/${publishedSlug}`;
                      navigator.clipboard.writeText(url);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2500);
                    }}
                    className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${
                      linkCopied 
                        ? 'bg-green-500 text-white shadow-green-200' 
                        : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                    }`}
                  >
                    {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
                    {linkCopied ? 'Link Copied!' : 'Copy Link'}
                  </button>
                  <button 
                    onClick={() => window.location.href = '/blogs'}
                    className="px-10 py-4 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <MediaPickerModal 
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={handleMediaSelect}
        />

        <MemberPickerModal
          isOpen={showMemberPicker}
          onClose={() => setShowMemberPicker(false)}
          onSelect={handleAuthorFromTeam}
        />
      </div>
  );
}
