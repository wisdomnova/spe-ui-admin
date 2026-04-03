"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const handleSide = useRef<"left" | "right">("right");

  const { src, alt, title, width, caption } = node.attrs;

  const onMouseDown = useCallback(
    (side: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSide.current = side;
      startX.current = e.clientX;
      startWidth.current = imgRef.current?.offsetWidth || 0;
      setResizing(true);
    },
    []
  );

  useEffect(() => {
    if (!resizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const diff = handleSide.current === "right"
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const newWidth = Math.max(100, startWidth.current + diff);
      updateAttributes({ width: newWidth });
    };

    const onMouseUp = () => {
      setResizing(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizing, updateAttributes]);

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "1.5rem 0" }}
    >
      <div
        className="resizable-image-container"
        style={{
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
          width: width ? `${width}px` : undefined,
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          title={title || ""}
          draggable={false}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "0.75rem",
          }}
        />

        {/* Resize handles - visible when selected or resizing */}
        {(selected || resizing) && (
          <>
            {/* Selection outline */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "2px solid #3b82f6",
                borderRadius: "0.75rem",
                pointerEvents: "none",
              }}
            />

            {/* Left handle */}
            <div
              onMouseDown={onMouseDown("left")}
              style={{
                position: "absolute",
                left: -4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 40,
                borderRadius: 4,
                background: "#3b82f6",
                cursor: "ew-resize",
                zIndex: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            />

            {/* Right handle */}
            <div
              onMouseDown={onMouseDown("right")}
              style={{
                position: "absolute",
                right: -4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 40,
                borderRadius: 4,
                background: "#3b82f6",
                cursor: "ew-resize",
                zIndex: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            />

            {/* Width label */}
            <div
              style={{
                position: "absolute",
                bottom: -28,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#1e293b",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {width ? `${Math.round(width)}px` : "auto"}
            </div>
          </>
        )}
      </div>

      {/* Editable caption */}
      <input
        type="text"
        value={caption || ""}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder="Add a caption…"
        style={{
          width: width ? `${width}px` : "100%",
          maxWidth: "100%",
          marginTop: 8,
          padding: "4px 8px",
          textAlign: "center",
          fontSize: 13,
          fontStyle: "italic",
          color: caption ? "#6b7280" : "#d1d5db",
          background: "transparent",
          border: "none",
          borderBottom: selected ? "1px dashed #93c5fd" : "1px dashed transparent",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderBottom = "1px dashed #93c5fd";
        }}
        onBlur={(e) => {
          if (!selected) {
            e.currentTarget.style.borderBottom = "1px dashed transparent";
          }
        }}
      />
    </NodeViewWrapper>
  );
}
