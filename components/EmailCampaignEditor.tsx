"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MediaPickerModal from "@/components/cms/MediaPickerModal";
import {
  Send,
  Eye,
  Code,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  Minus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Users,
  Search,
  X,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
export interface Recipient {
  id: string;
  email: string;
  label?: string;       // e.g. voter name, displayed in the list
  sublabel?: string;    // e.g. "Subscribed Jan 1, 2026" or "300 Level"
  badge?: string;       // e.g. "New" / "Read" / level
  badgeColor?: "green" | "amber" | "blue" | "gray";
}

type EditorMode = "visual" | "html" | "preview";
type CampaignStep = "compose" | "recipients" | "review";

export interface EmailCampaignEditorProps {
  /** Page title */
  title: string;
  /** Subtitle below the title */
  subtitle: string;
  /** Source label for queue (e.g. "newsletter" | "voters") */
  source: string;
  /** Recipients to choose from */
  recipients: Recipient[];
  /** Whether recipients are still loading */
  loadingRecipients: boolean;
  /** Total count text, e.g. "120 newsletter subscribers" */
  recipientCountLabel: string;
  /** Whether to include unsubscribe link in email footer */
  includeUnsubscribe?: boolean;
  /** Callback after successful send — parent can refresh/reset */
  onSendComplete?: () => void;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function EmailCampaignEditor({
  title,
  subtitle,
  source,
  recipients,
  loadingRecipients,
  recipientCountLabel,
  includeUnsubscribe = true,
  onSendComplete,
}: EmailCampaignEditorProps) {
  // Steps
  const [step, setStep] = useState<CampaignStep>("compose");

  // Email content
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("visual");

  // Recipients
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState("");

  // Sending
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ queued: number; total: number; batchId: string } | null>(null);
  const [sendError, setSendError] = useState("");

  // Editor ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync editor content
  const syncFromEditor = useCallback(() => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  }, []);

  // Send campaign — queues emails then kicks off processing
  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim() || selectedIds.size === 0) return;
    setSending(true);
    setSendError("");
    setSendResult(null);

    const wrappedHtml = wrapInEmailTemplate(htmlContent, subject, includeUnsubscribe);

    const selectedRecipients = recipients
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({ id: r.id, email: r.email }));

    try {
      const res = await fetch("/api/email-queue/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          html: wrappedHtml,
          recipients: selectedRecipients,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Failed to queue emails");
      } else {
        setSendResult(data);
        onSendComplete?.();
      }
    } catch {
      setSendError("Network error. Please try again.");
    }
    setSending(false);
  };

  // Filtered recipients
  const filteredRecipients = recipients.filter((r) =>
    r.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    (r.label?.toLowerCase().includes(recipientSearch.toLowerCase()))
  );

  const allFilteredSelected =
    filteredRecipients.length > 0 &&
    filteredRecipients.every((r) => selectedIds.has(r.id));

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredRecipients.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredRecipients.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const canProceedToRecipients = subject.trim() && htmlContent.trim();
  const canProceedToReview = selectedIds.size > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <header className="mb-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{title}</h2>
            <p className="text-gray-500 font-medium">{subtitle}</p>
          </div>
        </header>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["compose", "recipients", "review"] as CampaignStep[]).map((s, i) => {
            const labels = ["Compose", "Recipients", "Review & Send"];
            const icons = [Type, Users, Send];
            const Icon = icons[i];
            const isActive = step === s;
            const stepIdx = ["compose", "recipients", "review"].indexOf(step);
            const isPast = i < stepIdx;

            return (
              <button
                key={s}
                onClick={() => {
                  if (isPast) setStep(s);
                  if (s === "recipients" && canProceedToRecipients) setStep(s);
                  if (s === "review" && canProceedToRecipients && canProceedToReview) setStep(s);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : isPast
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "bg-gray-50 text-gray-300"
                }`}
              >
                <Icon size={14} />
                {labels[i]}
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === "compose" && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ComposeStep
                subject={subject}
                setSubject={setSubject}
                htmlContent={htmlContent}
                setHtmlContent={setHtmlContent}
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                editorRef={editorRef}
                syncFromEditor={syncFromEditor}
              />
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => { syncFromEditor(); setStep("recipients"); }}
                  disabled={!canProceedToRecipients}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next: Pick Recipients
                  <Users size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "recipients" && (
            <motion.div
              key="recipients"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <RecipientStep
                recipients={filteredRecipients}
                totalCount={recipients.length}
                countLabel={recipientCountLabel}
                loading={loadingRecipients}
                selectedIds={selectedIds}
                recipientSearch={recipientSearch}
                setRecipientSearch={setRecipientSearch}
                toggleRecipient={toggleRecipient}
                toggleAll={toggleAll}
                allFilteredSelected={allFilteredSelected}
              />
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep("compose")}
                  className="flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  disabled={!canProceedToReview}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next: Review
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ReviewStep
                subject={subject}
                htmlContent={htmlContent}
                selectedCount={selectedIds.size}
                sending={sending}
                sendResult={sendResult}
                sendError={sendError}
                onSend={handleSend}
              />
              <div className="flex justify-between mt-6">
                {!sendResult && (
                  <button
                    onClick={() => setStep("recipients")}
                    disabled={sending}
                    className="flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                {sendResult && (
                  <button
                    onClick={() => {
                      setSubject("");
                      setHtmlContent("");
                      setSelectedIds(new Set());
                      setSendResult(null);
                      setSendError("");
                      setStep("compose");
                      if (editorRef.current) editorRef.current.innerHTML = "";
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    New Campaign
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 1: COMPOSE
   ═══════════════════════════════════════════════════════ */
function ComposeStep({
  subject,
  setSubject,
  htmlContent,
  setHtmlContent,
  editorMode,
  setEditorMode,
  editorRef,
  syncFromEditor,
}: {
  subject: string;
  setSubject: (v: string) => void;
  htmlContent: string;
  setHtmlContent: (v: string) => void;
  editorMode: EditorMode;
  setEditorMode: (v: EditorMode) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  syncFromEditor: () => void;
}) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncFromEditor();
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    editorRef.current?.focus();
    if (linkText.trim()) {
      const html = `<a href="${linkUrl}" style="color:#2563EB;text-decoration:underline;">${linkText}</a>`;
      document.execCommand("insertHTML", false, html);
    } else {
      document.execCommand("createLink", false, linkUrl);
    }
    syncFromEditor();
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleMediaSelect = (file: { url: string; name: string }) => {
    restoreSelection();
    editorRef.current?.focus();
    const html = `<img src="${file.url}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" />`;
    document.execCommand("insertHTML", false, html);
    syncFromEditor();
    setShowMediaPicker(false);
  };

  const handleModeSwitch = (mode: EditorMode) => {
    if (editorMode === "visual") syncFromEditor();
    if (mode === "visual" && editorRef.current && editorMode === "html") {
      editorRef.current.innerHTML = htmlContent;
    }
    setEditorMode(mode);
  };

  const COLORS = [
    "#111827", "#374151", "#6B7280", "#EF4444", "#F97316", "#EAB308",
    "#22C55E", "#14B8A6", "#3B82F6", "#6366F1", "#A855F7", "#EC4899",
  ];

  return (
    <div className="space-y-6">
      {/* Subject */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">
          Email Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. SPE-UI Monthly Update"
          className="w-full bg-gray-50 border-none rounded-xl px-5 py-4 font-bold text-gray-900 text-lg outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300"
        />
      </div>

      {/* Editor */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Mode Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-1">
            {([
              { key: "visual", label: "Editor", icon: Type },
              { key: "html", label: "HTML", icon: Code },
              { key: "preview", label: "Preview", icon: Eye },
            ] as { key: EditorMode; label: string; icon: typeof Type }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleModeSwitch(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  editorMode === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar (visual mode only) */}
        {editorMode === "visual" && (
          <div className="border-b border-gray-100 px-4 py-2 flex flex-wrap items-center gap-1">
            <ToolbarGroup>
              <ToolbarBtn icon={Undo2} title="Undo" onClick={() => exec("undo")} />
              <ToolbarBtn icon={Redo2} title="Redo" onClick={() => exec("redo")} />
            </ToolbarGroup>
            <ToolbarDivider />
            <ToolbarGroup>
              <ToolbarBtn icon={Bold} title="Bold" onClick={() => exec("bold")} />
              <ToolbarBtn icon={Italic} title="Italic" onClick={() => exec("italic")} />
              <ToolbarBtn icon={Underline} title="Underline" onClick={() => exec("underline")} />
              <ToolbarBtn icon={Strikethrough} title="Strikethrough" onClick={() => exec("strikeThrough")} />
            </ToolbarGroup>
            <ToolbarDivider />
            <ToolbarGroup>
              <ToolbarBtn icon={Heading1} title="Heading 1" onClick={() => exec("formatBlock", "h1")} />
              <ToolbarBtn icon={Heading2} title="Heading 2" onClick={() => exec("formatBlock", "h2")} />
              <ToolbarBtn icon={Heading3} title="Heading 3" onClick={() => exec("formatBlock", "h3")} />
              <ToolbarBtn icon={Type} title="Paragraph" onClick={() => exec("formatBlock", "p")} />
            </ToolbarGroup>
            <ToolbarDivider />
            <ToolbarGroup>
              <ToolbarBtn icon={AlignLeft} title="Align Left" onClick={() => exec("justifyLeft")} />
              <ToolbarBtn icon={AlignCenter} title="Align Center" onClick={() => exec("justifyCenter")} />
              <ToolbarBtn icon={AlignRight} title="Align Right" onClick={() => exec("justifyRight")} />
            </ToolbarGroup>
            <ToolbarDivider />
            <ToolbarGroup>
              <ToolbarBtn icon={List} title="Bullet List" onClick={() => exec("insertUnorderedList")} />
              <ToolbarBtn icon={ListOrdered} title="Numbered List" onClick={() => exec("insertOrderedList")} />
            </ToolbarGroup>
            <ToolbarDivider />
            <ToolbarGroup>
              <ToolbarBtn
                icon={Link2}
                title="Insert Link"
                onClick={() => { saveSelection(); setShowLinkModal(true); }}
              />
              <ToolbarBtn
                icon={ImageIcon}
                title="Insert Image"
                onClick={() => { saveSelection(); setShowMediaPicker(true); }}
              />
              <ToolbarBtn icon={Minus} title="Horizontal Rule" onClick={() => exec("insertHorizontalRule")} />
            </ToolbarGroup>
            <ToolbarDivider />
            <ToolbarGroup>
              <div className="relative">
                <ToolbarBtn
                  icon={Palette}
                  title="Text Color"
                  onClick={() => { saveSelection(); setShowColorPicker(!showColorPicker); }}
                />
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-2 grid grid-cols-6 gap-1 z-50">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { restoreSelection(); exec("foreColor", c); setShowColorPicker(false); }}
                        className="w-6 h-6 rounded-lg border border-gray-100 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ToolbarGroup>
          </div>
        )}

        {/* Editor Content */}
        <div className="min-h-[400px]">
          {editorMode === "visual" && (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncFromEditor}
              onBlur={syncFromEditor}
              className="p-6 sm:p-8 min-h-[400px] outline-none prose prose-sm max-w-none text-gray-800 leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mb-3
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-2
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mb-2
                [&_p]:mb-3 [&_p]:leading-relaxed
                [&_a]:text-blue-600 [&_a]:underline
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
                [&_li]:mb-1
                [&_img]:rounded-lg [&_img]:max-w-full
                [&_hr]:border-gray-200 [&_hr]:my-4"
              data-placeholder="Start typing your email..."
            />
          )}

          {editorMode === "html" && (
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full min-h-[400px] p-6 sm:p-8 font-mono text-sm text-gray-800 bg-gray-50 outline-none resize-y"
              placeholder="<p>Write your HTML here...</p>"
            />
          )}

          {editorMode === "preview" && (
            <div className="p-6 sm:p-8 min-h-[400px]">
              {htmlContent ? (
                <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-900 px-6 py-4">
                    <p className="text-white font-bold text-sm">{subject || "No subject"}</p>
                    <p className="text-gray-400 text-xs mt-1">From: SPE-UI &lt;info@speui.org&gt;</p>
                  </div>
                  <div
                    className="p-6 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-300 font-bold text-sm">
                  Nothing to preview yet. Start composing your email.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <ModalOverlay onClose={() => setShowLinkModal(false)}>
            <h3 className="text-lg font-black text-gray-900 mb-6">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Display Text <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
              <button
                onClick={insertLink}
                disabled={!linkUrl.trim()}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-40 transition-all"
              >
                Insert Link
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 2: RECIPIENTS
   ═══════════════════════════════════════════════════════ */
function RecipientStep({
  recipients,
  totalCount,
  countLabel,
  loading,
  selectedIds,
  recipientSearch,
  setRecipientSearch,
  toggleRecipient,
  toggleAll,
  allFilteredSelected,
}: {
  recipients: Recipient[];
  totalCount: number;
  countLabel: string;
  loading: boolean;
  selectedIds: Set<string>;
  recipientSearch: string;
  setRecipientSearch: (v: string) => void;
  toggleRecipient: (id: string) => void;
  toggleAll: () => void;
  allFilteredSelected: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Selected chips */}
      {selectedIds.size > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Selected Recipients
            </label>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {recipients
              .filter((r) => selectedIds.has(r.id))
              .map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-bold"
                >
                  {r.email}
                  <button
                    onClick={() => toggleRecipient(r.id)}
                    className="p-0.5 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Recipient List */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Recipients
              </label>
              <p className="text-gray-500 text-xs font-medium">
                {countLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  allFilteredSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {allFilteredSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
              type="text"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              placeholder="Search by email..."
              className="w-full bg-gray-50 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300"
            />
            {recipientSearch && (
              <button
                onClick={() => setRecipientSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-gray-300" size={24} />
            </div>
          ) : recipients.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 font-bold text-sm">
                {recipientSearch ? "No recipients match your search" : "No recipients available"}
              </p>
            </div>
          ) : (
            recipients.map((r) => {
              const isSelected = selectedIds.has(r.id);
              const badgeColors = {
                green: "bg-green-50 text-green-600",
                amber: "bg-amber-50 text-amber-600",
                blue: "bg-blue-50 text-blue-600",
                gray: "bg-gray-50 text-gray-500",
              };
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRecipient(r.id)}
                  className={`w-full flex items-center gap-4 px-6 sm:px-8 py-4 text-left transition-all ${
                    isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {r.label || r.email}
                    </p>
                    {r.sublabel && (
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{r.sublabel}</p>
                    )}
                    {r.label && (
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{r.email}</p>
                    )}
                  </div>
                  {r.badge && (
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        badgeColors[r.badgeColor || "gray"]
                      }`}
                    >
                      {r.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {recipients.length > 0 && (
          <div className="px-6 sm:px-8 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-[10px] text-gray-400 font-bold">
              Showing {recipients.length} of {totalCount} recipients
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 3: REVIEW & SEND
   ═══════════════════════════════════════════════════════ */
function ReviewStep({
  subject,
  htmlContent,
  selectedCount,
  sending,
  sendResult,
  sendError,
  onSend,
}: {
  subject: string;
  htmlContent: string;
  selectedCount: number;
  sending: boolean;
  sendResult: { queued: number; total: number; batchId: string } | null;
  sendError: string;
  onSend: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</p>
          <p className="font-bold text-gray-900 text-sm truncate">{subject}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recipients</p>
          <p className="font-bold text-gray-900 text-sm">{selectedCount} recipient{selectedCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From</p>
          <p className="font-bold text-gray-900 text-sm truncate">SPE-UI &lt;info@speui.org&gt;</p>
        </div>
      </div>

      {/* Email Preview */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center gap-2">
          <Eye size={14} className="text-gray-400" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Preview</p>
        </div>
        <div className="p-6 sm:p-8">
          <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-900 px-6 py-4">
              <p className="text-white font-bold text-sm">{subject}</p>
              <p className="text-gray-400 text-xs mt-1">From: SPE-UI &lt;info@speui.org&gt;</p>
            </div>
            <div
              className="p-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>

      {/* Send Button / Result */}
      {!sendResult ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">Ready to send?</p>
              <p className="text-gray-500 text-xs mt-1">
                This will queue {selectedCount} email{selectedCount !== 1 ? "s" : ""} for delivery.
              </p>
            </div>
            <button
              onClick={onSend}
              disabled={sending}
              className="flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Campaign
                </>
              )}
            </button>
          </div>
          {sendError && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              <p className="text-xs font-bold">{sendError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Campaign Queued!</h3>
          <p className="text-gray-500 font-medium mb-2">
            {sendResult.queued} email{sendResult.queued !== 1 ? "s" : ""} queued for delivery.
          </p>
          <p className="text-gray-400 text-xs">
            Emails are being processed in the background. Failed sends will be retried automatically.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════ */

function ToolbarBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: typeof Bold;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all"
    >
      <Icon size={15} />
    </button>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-100 mx-1" />;
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <X size={18} />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EMAIL TEMPLATE WRAPPER
   ═══════════════════════════════════════════════════════ */
function wrapInEmailTemplate(body: string, subject: string, includeUnsubscribe: boolean): string {
  const unsubscribeRow = includeUnsubscribe
    ? `<p style="margin:0; font-size:11px; color:#D1D5DB;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color:#9CA3AF; text-decoration:underline;">Unsubscribe</a> from these emails.
              </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;">
          <tr>
            <td style="padding:0 0 24px;">
              <p style="margin:0; font-size:11px; color:#9CA3AF; font-weight:600;">SPE-UI</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 32px; font-size:14px; color:#374151; line-height:1.6;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #E5E7EB; padding:24px 0 0;">
              <p style="margin:0 0 8px; font-size:12px; color:#9CA3AF;">
                Society of Petroleum Engineers, University of Ibadan Student Chapter
              </p>
              ${unsubscribeRow}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
