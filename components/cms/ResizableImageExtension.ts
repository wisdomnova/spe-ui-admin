import TiptapImage from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageView from "./ResizableImageView";

/**
 * Custom Image extension with inline resize handles + captions.
 *
 * Adds `width` (stored as inline style) and `caption` (stored as
 * `data-caption` attribute) so both survive save → reload → public render.
 *
 * `allowBase64: true` ensures base64 images survive `setContent()` parsing
 * (needed when restoring drafts from localStorage before they're uploaded).
 */
const ResizableImage = TiptapImage.extend({

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const img = el.tagName === "FIGURE" ? el.querySelector("img") : el;
          if (!img) return null;
          const styleWidth = (img as HTMLElement).style?.width;
          if (styleWidth && styleWidth.endsWith("px")) {
            return parseFloat(styleWidth);
          }
          const attrWidth = img.getAttribute("width");
          if (attrWidth) {
            return parseFloat(attrWidth);
          }
          return null;
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.width) return {};
          return {
            width: Math.round(attrs.width as number),
            style: `width: ${Math.round(attrs.width as number)}px`,
          };
        },
      },
      caption: {
        default: "",
        parseHTML: (el: HTMLElement) => {
          // <figure> wrapper → read from <figcaption>
          if (el.tagName === "FIGURE") {
            const fc = el.querySelector("figcaption");
            return fc?.textContent || "";
          }
          // plain <img> → fall back to data-caption
          return el.getAttribute("data-caption") || "";
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.caption) return {};
          return { "data-caption": attrs.caption as string };
        },
      },
    };
  },

  // Support both <figure data-type="image"> (new) and plain <img> (legacy)
  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
        getAttrs: (dom: HTMLElement) => {
          const img = dom.querySelector("img");
          if (!img) return false;
          return { src: img.getAttribute("src") };
        },
      },
      {
        tag: "img[src]",
      },
    ];
  },

  // Serialize: wrap in <figure> when caption exists for semantic HTML
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const { caption, ...imgAttrs } = HTMLAttributes;

    if (caption) {
      return [
        "figure",
        { "data-type": "image", class: "image-figure" },
        ["img", imgAttrs],
        ["figcaption", {}, caption as string],
      ];
    }

    return ["img", imgAttrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
