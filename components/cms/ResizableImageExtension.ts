import TiptapImage from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageView from "./ResizableImageView";

/**
 * Custom Image extension with inline resize handles.
 *
 * Adds a `width` attribute that is stored as an inline style
 * (`style="width: Xpx"`) so the dimension survives
 * save → reload → public-site render.
 */
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          // Try inline style first, fall back to width attribute
          const styleWidth = el.style?.width;
          if (styleWidth && styleWidth.endsWith("px")) {
            return parseFloat(styleWidth);
          }
          const attrWidth = el.getAttribute("width");
          if (attrWidth) {
            return parseFloat(attrWidth);
          }
          return null;
        },
        renderHTML: (attrs) => {
          if (!attrs.width) return {};
          return {
            width: Math.round(attrs.width),
            style: `width: ${Math.round(attrs.width)}px`,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
