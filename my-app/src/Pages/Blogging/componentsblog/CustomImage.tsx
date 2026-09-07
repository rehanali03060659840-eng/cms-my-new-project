
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: {
        src: string;
        alt?: string;
        width?: string;
        align?: "left" | "center" | "right";
      }) => ReturnType;
    };
  }
}

// ---------- NodeView component (the actual UI you see in the editor) ----------
const ImageNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { src, alt, width, align } = node.attrs;
  const [altOpen, setAltOpen] = useState(false);
  const [altValue, setAltValue] = useState(alt || "");
  const resizingRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setAltValue(alt || "");
    // console.log("this image src is:", src);
  }, [alt, src]);

  const setAlign = (value: "left" | "center" | "right") => {
    updateAttributes({ align: value });
  };

  const saveAlt = () => {
    updateAttributes({ alt: altValue });
    setAltOpen(false);
    // console.log("alt save:", altValue)
  };

  // simple corner-drag resize
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      startX: e.clientX,
      startWidth: parseInt(width || "300", 10),
    };
    window.addEventListener("mousemove", onResize);
    window.addEventListener("mouseup", stopResize);
  };
  const onResize = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const delta = e.clientX - resizingRef.current.startX;
    const newWidth = Math.max(60, resizingRef.current.startWidth + delta);
    updateAttributes({ width: `${newWidth}px` });
  };
  const stopResize = () => {
    resizingRef.current = null;
    window.removeEventListener("mousemove", onResize);
    window.removeEventListener("mouseup", stopResize);
  };

  const justify =
    align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <NodeViewWrapper
      as="div"
      style={{ display: "flex", justifyContent: justify, position: "relative" }}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Floating toolbar: only visible in editor, only when image selected */}
        {selected && (
          <div
            contentEditable={false}
            className="absolute -top-10 left-0 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-2 py-1 z-50"
          >
            <button type="button" onClick={() => setAlign("left")} className="p-1 hover:bg-gray-100 rounded">
              <AlignLeft size={16} />
            </button>
            <button type="button" onClick={() => setAlign("center")} className="p-1 hover:bg-gray-100 rounded">
              <AlignCenter size={16} />
            </button>
            <button type="button" onClick={() => setAlign("right")} className="p-1 hover:bg-gray-100 rounded">
              <AlignRight size={16} />
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => setAltOpen((v) => !v)}
              className={`flex items-center gap-1 p-1 rounded text-xs ${
                alt ? "text-blue-600" : "text-slate-500"
              } hover:bg-gray-100`}
              title="Alt text (editor only, not shown to readers unless image fails to load)"
            >
              <Type size={16} />
              Alt
            </button>

            {altOpen && (
              <div className="absolute top-9 left-0 bg-white border border-slate-200 rounded-md shadow-lg p-2 flex items-center gap-2 w-64">
                <input
                  autoFocus
                  type="text"
                  value={altValue}
                  onChange={(e) => setAltValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveAlt()}
                  placeholder="Describe this image..."
                  className="border border-slate-300 rounded px-2 py-1 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={saveAlt}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        )}

        <img
          src={src}
          alt={alt || ""}
          style={{ width: width || "300px", display: "block" }}
          draggable={false}
        />

        {/* resize handle, editor-only */}
        {selected && (
          <div
            contentEditable={false}
            onMouseDown={startResize}
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 rounded-sm cursor-nwse-resize"
            style={{ transform: "translate(50%, 50%)" }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

// ---------- Node definition ----------
export const CustomImage = Node.create({
  name: "image",
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      width: {
        default: "300px",
        parseHTML: (element) => element.getAttribute("data-width") || "300px",
        renderHTML: (attributes) => ({ "data-width": attributes.width }),
      },
      align: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-align") || "left",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { align, width } = node.attrs;
    const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
    return [
      "div",
      { style: `display:flex;justify-content:${justify};` },
      ["img", mergeAttributes(HTMLAttributes, { style: `width:${width || "300px"};display:block;` })],
    ];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});