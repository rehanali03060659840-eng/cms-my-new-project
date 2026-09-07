import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const EDITOR_EXTENSIONS = [
  StarterKit,
  
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }), 
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Placeholder.configure({
    placeholder: "Write something...",
  }),
];

export const TipTapRichTextEditor = ({ value, onChange }: Props) => {

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-[300px] focus:outline-none prose max-w-none p-4 bg-white",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const setCustomLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };


  
  const btnClass = (isActive: boolean) =>
    `px-2.5 py-1 text-sm rounded transition-colors hover:bg-gray-200 ${
      isActive
        ? "bg-gray-300 text-black font-bold"
        : "text-gray-600 bg-transparent"
    }`;

  return (
    <div className="border rounded-lg bg-white overflow-hidden shadow-sm">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2.5 border-b bg-gray-50 select-none">
        {/* Dropdown elements */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === "paragraph") editor.chain().focus().setParagraph().run();
            if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
            if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "paragraph"
          }
          className="border rounded px-2 py-1 text-sm bg-white text-gray-700 outline-none cursor-pointer"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* Action Controls elements */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}>abc̶</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))}>U</button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" onClick={setCustomLink} className={btnClass(editor.isActive("link"))} title="Add Text Hyperlink">🔗 Link</button>
        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>1 List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>"</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="px-2.5 py-1 text-sm text-gray-600 rounded hover:bg-gray-200">—</button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btnClass(editor.isActive({ textAlign: "left" }))}>Left</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btnClass(editor.isActive({ textAlign: "center" }))}>Center</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btnClass(editor.isActive({ textAlign: "right" }))}>Right</button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        {/* Text Color Selector */}
        <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 bg-white" title="Text Color">
          <span className="text-xs font-semibold text-gray-500">Text:</span>
          <input
            type="color"
            value={editor.getAttributes("textStyle").color || "#000000"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-5 h-5 p-0 border-0 cursor-pointer bg-transparent"
          />
        </div>

        {/* Background / Highlight Color Control */}
        <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 bg-white" title="Background Color">
          <span className="text-xs font-semibold text-gray-500">BG:</span>
          <input
            type="color"
            value={editor.getAttributes("highlight").color || "#ffffff"}
            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
            className="w-5 h-5 p-0 border-0 cursor-pointer bg-transparent"
          />
          {editor.isActive("highlight") && (
            <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="text-xs ml-1 text-red-500 font-bold">X</button>
          )}
        </div>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30">↶</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30">↷</button>
      </div>

      {/* Editor Main Text Input Block */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
