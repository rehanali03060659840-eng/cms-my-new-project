import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { CustomImage } from "./CustomImage";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { VideoExtension } from "./videoextension";
import { useRef, useState } from "react";
import { Image as ImageIcon, Video, ChevronDown } from "lucide-react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: {
        src: string;
        width?: string;
        height?: string;
      }) => ReturnType;
    };
  }
}
interface Props {
  value: string;
  onChange: (html: string, text: string) => void;
}

const fonts = [
  "Arial",
  "Poppins",
  "Roboto",
  "Inter",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Courier New",
];

import { Extension } from "@tiptap/core";

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,

        attributes: {
          fontSize: {
            default: null,

            parseHTML: (element) => {
              return element.style.fontSize;
            },

            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size:${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

export const RichTextEditor = ({ value, onChange }: Props) => {
  const [zoom, setZoom] = useState(100);
  const [mediaOpen, setMediaOpen] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),

      Underline,

      TextStyle,

      FontSize,

      Color,

      Highlight,

      FontFamily,

      VideoExtension,

      CustomImage,

      Link.configure({
        openOnClick: true,
        autolink: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Placeholder.configure({
        placeholder: "Write your blog content...",
      }),
    ],

    content: value,

    onUpdate({ editor }) {
      onChange(editor.getHTML(), editor.getText());
    },
  });
  // onUpdate({ editor }) {
  //   const html = editor.getHTML();
  //   onChange(html, editor.getText());
  //   console.log("Full page content (HTML):", html);
  // }
  //   })
  // edit mode load

  if (!editor) return null;

  const addLink = () => {
    const previous = editor.getAttributes("link").href;

    const url = window.prompt("Enter URL", previous);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().unsetLink().run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: url,
      })
      .run();
  };

  const addImage = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      editor
        .chain()
        .focus()
        .setImage({
          src: reader.result as string,
          alt: "",
        })
        .run();
    };

    reader.readAsDataURL(file);
  };

  const addVideo = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;

      if (result && typeof result === "string") {
        editor.chain().focus().setVideo({ src: result }).run();
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-3 bg-gray-100 border-b">
        <select
          className="border p-2 rounded-sm"
          onChange={(e) => {
            const val = e.target.value;

            if (val === "p") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({
                  level: Number(val) as 1 | 2 | 3 | 4 | 5 | 6,
                })
                .run();
          }}
        >
          <option value="p">Paragraph</option>

          <option value="1">Heading 1</option>

          <option value="2">Heading 2</option>

          <option value="3">Heading 3</option>

          <option value="4">Heading 4</option>

          <option value="5">Heading 5</option>

          <option value="6">Heading 6</option>
        </select>

        <select
          className="border p-1 rounded-sm"
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
        >
          {fonts.map((font) => (
            <option key={font}>{font}</option>
          ))}
        </select>

        <select
          className="border px-2 py-1 rounded"
          onChange={(e) =>
            editor
              .chain()
              .focus()
              .setMark("textStyle", {
                fontSize: e.target.value,
              })
              .run()
          }
        >
          <option value="12px">12</option>

          <option value="16px">16</option>

          <option value="20px">20</option>

          <option value="24px">24</option>

          <option value="32px">32</option>
        </select>

        <select
          value={zoom}
          className="border px-2 py-1 rounded"
          onChange={(e) => setZoom(Number(e.target.value))}
        >
          {[50, 75, 100, 125, 150, 200].map((z) => (
            <option key={z} value={z}>
              {z}%
            </option>
          ))}
        </select>

        <button
          type="button"
          className="hover:text-red-400"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={17} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={17} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={17} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={17} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight />
        </button>

        <input
          type="color"
          className="w-[50px] h-[40px] "
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
        />

        <button type="button" onClick={addLink}>
          <LinkIcon />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMediaOpen(!mediaOpen)}
            className="flex items-center gap-1 p-2 rounded hover:bg-gray-200"
          >
            <ImageIcon size={17} />
            Media
            <ChevronDown size={15} />
          </button>

          {mediaOpen && (
            <div className="absolute top-10 left-0 bg-white border rounded-lg shadow-lg z-50 w-40">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100"
                onClick={() => {
                  imageRef.current?.click();

                  setMediaOpen(false);
                }}
              >
                <ImageIcon size={16} />
                Image
              </button>

              <button
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100"
                onClick={() => {
                  videoRef.current?.click();

                  setMediaOpen(false);
                }}
              >
                <Video size={16} />
                Video
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo />
        </button>

        <input
          ref={imageRef}
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) addImage(file);
          }}
        />

        <input
          ref={videoRef}
          hidden
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) addVideo(file);
          }}
        />
        <button
          type="button"
          onClick={() => {
            editor
              .chain()
              .focus()
              .updateAttributes("video", {
                width: "300px",
              })
              .run();
          }}
        >
          Small
        </button>

        <button
          type="button"
          onClick={() => {
            editor
              .chain()
              .focus()
              .updateAttributes("video", {
                width: "600px",
              })
              .run();
          }}
        >
          Medium
        </button>

        <button
          type="button"
          onClick={() => {
            editor
              .chain()
              .focus()
              .updateAttributes("video", {
                width: "900px",
              })
              .run();
          }}
        >
          Large
        </button>
      </div>

      <div
        className="p-5 min-h-[350px]"
        style={{
          zoom: `${zoom}%`,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
