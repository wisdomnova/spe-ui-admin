"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TiptapLink from "@tiptap/extension-link";
import ResizableImage from "./ResizableImageExtension";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Undo,
  Redo,
  Link as LinkIcon,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Unlink,
  Upload,
  Clock,
} from "lucide-react";

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
        : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
    } disabled:opacity-30`}
  >
    {children}
  </button>
);

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: "Tell your story...",
      }),
      CharacterCount,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
        },
      }),
      ResizableImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-xl max-w-full mx-auto my-6",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg focus:outline-none max-w-none min-h-[400px] text-gray-800 leading-relaxed [&_h1]:text-4xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1",
      },
    },
  });

  // Keeps editor in sync when content changes externally
  // (edit-mode fetch, draft restore, etc.)
  const lastExternalContent = useRef(content);
  useEffect(() => {
    if (!editor) return;
    if (content && content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      // emitUpdate = false → avoids triggering onChange → infinite loop
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowLinkInput(false);
      setLinkUrl("");
      return;
    }

    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl.trim()) return;

    const url = imageUrl.startsWith("http") ? imageUrl : `https://${imageUrl}`;
    editor.chain().focus().setImage({ src: url, alt: imageAlt || "Blog image" }).run();
    setShowImageInput(false);
    setImageUrl("");
    setImageAlt("");
  }, [editor, imageUrl, imageAlt]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) return;
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        editor.chain().focus().setImage({ src: result, alt: file.name }).run();
      };
      reader.readAsDataURL(file);

      // Reset input so re-uploading the same file triggers onChange
      e.target.value = "";
    },
    [editor]
  );

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
    setShowImageInput(false);
  }, [editor]);

  const openImageInput = useCallback(() => {
    setShowImageInput(true);
    setShowLinkInput(false);
    setImageUrl("");
    setImageAlt("");
  }, []);

  if (!editor) return null;

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/20 overflow-hidden">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center gap-1 bg-gray-50/30">
        {/* Headings */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={20} />
        </MenuButton>

        <div className="w-[1px] h-6 bg-gray-200 mx-2" />

        {/* Inline Formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (⌘B)"
        >
          <Bold size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (⌘I)"
        >
          <Italic size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (⌘U)"
        >
          <UnderlineIcon size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code"
        >
          <Code size={20} />
        </MenuButton>

        <div className="w-[1px] h-6 bg-gray-200 mx-2" />

        {/* Lists & Block */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={20} />
        </MenuButton>

        <div className="w-[1px] h-6 bg-gray-200 mx-2" />

        {/* Alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight size={20} />
        </MenuButton>

        <div className="w-[1px] h-6 bg-gray-200 mx-2" />

        {/* Link & Image */}
        <MenuButton
          onClick={openLinkInput}
          isActive={editor.isActive("link")}
          title="Insert Link"
        >
          <LinkIcon size={20} />
        </MenuButton>
        {editor.isActive("link") && (
          <MenuButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink size={20} />
          </MenuButton>
        )}
        <MenuButton onClick={openImageInput} title="Image from URL">
          <ImageIcon size={20} />
        </MenuButton>
        <MenuButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image from Computer"
        >
          <Upload size={20} />
        </MenuButton>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (⌘Z)"
        >
          <Undo size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (⌘⇧Z)"
        >
          <Redo size={18} />
        </MenuButton>
      </div>

      {/* Link Input Bar */}
      {showLinkInput && (
        <div className="px-6 py-3 border-b border-gray-50 bg-blue-50/50 flex items-center gap-3">
          <LinkIcon size={16} className="text-blue-500 shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setLink();
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            placeholder="Paste or type a URL and press Enter..."
            className="flex-1 bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:text-blue-300"
            autoFocus
          />
          <button
            onClick={setLink}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="px-4 py-1.5 text-gray-400 text-xs font-black uppercase tracking-widest rounded-lg hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image Input Bar */}
      {showImageInput && (
        <div className="px-6 py-3 border-b border-gray-50 bg-green-50/50 flex items-center gap-3 flex-wrap">
          <ImageIcon size={16} className="text-green-600 shrink-0" />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addImage();
              if (e.key === "Escape") {
                setShowImageInput(false);
                setImageUrl("");
                setImageAlt("");
              }
            }}
            placeholder="Paste image URL..."
            className="flex-1 min-w-[150px] bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:text-green-300"
            autoFocus
          />
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addImage();
            }}
            placeholder="Alt text"
            className="w-32 bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:text-green-300 border-l border-green-200 pl-3"
          />
          <button
            onClick={addImage}
            className="px-4 py-1.5 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-green-700 transition-colors"
          >
            Insert
          </button>
          <span className="text-gray-300 text-xs font-bold">or</span>
          <button
            onClick={() => {
              setShowImageInput(false);
              fileInputRef.current?.click();
            }}
            className="px-4 py-1.5 bg-gray-800 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <Upload size={12} />
            Upload
          </button>
          <button
            onClick={() => {
              setShowImageInput(false);
              setImageUrl("");
              setImageAlt("");
            }}
            className="px-4 py-1.5 text-gray-400 text-xs font-black uppercase tracking-widest rounded-lg hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-10 px-12 sm:px-16 md:px-20 lg:px-24">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {wordCount} {wordCount === 1 ? "Word" : "Words"}
          </p>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            {charCount} Characters
          </p>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
            <Clock size={10} />
            {currentTime}
          </p>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Auto-saving
          </p>
        </div>
      </div>
    </div>
  );
}
