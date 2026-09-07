import { Node, mergeAttributes } from "@tiptap/core";

export const VideoExtension = Node.create({
  name: "video",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },

      width: {
        default: "600px",
      },

      height: {
        default: "350px",
      },

      align: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",

      {
        style: `
        text-align:${HTMLAttributes.align};
        width:100%;
        `,
      },

      [
        "video",

        mergeAttributes(HTMLAttributes, {
          controls: true,

          style: `
            width:${HTMLAttributes.width};
            height:${HTMLAttributes.height};
            border-radius:12px;
            max-width:100%;
            `,
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: "video",

            attrs: {
              src: options.src,

              width: "600px",

              height: "350px",

              align: "center",
            },
          });
        },

      updateVideo:
        (attrs: any) =>
        ({ commands }: any) => {
          return commands.updateAttributes("video", attrs);
        },
    };
  },
});
