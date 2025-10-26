"use client";

import { RichTextEditor as MantineRTE, Link as TiptapLink } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  withAsterisk?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "セッション中の重要な出来事や戦略を記録...",
  error,
  label = "メモ",
  withAsterisk = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: updatedEditor }) => {
      const html = updatedEditor.getHTML();
      // Only call onChange if content actually changed
      if (html !== value) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        style: "min-height: 200px; max-height: 400px; overflow-y: auto;",
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {label}
          {withAsterisk && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
        </label>
      )}
      <MantineRTE editor={editor} style={{ ...(error && { borderColor: "var(--mantine-color-error)" }) }}>
        <MantineRTE.Toolbar sticky stickyOffset={60}>
          <MantineRTE.ControlsGroup>
            <MantineRTE.Bold />
            <MantineRTE.Italic />
            <MantineRTE.Underline />
            <MantineRTE.Strikethrough />
          </MantineRTE.ControlsGroup>

          <MantineRTE.ControlsGroup>
            <MantineRTE.H1 />
            <MantineRTE.H2 />
            <MantineRTE.H3 />
          </MantineRTE.ControlsGroup>

          <MantineRTE.ControlsGroup>
            <MantineRTE.BulletList />
            <MantineRTE.OrderedList />
          </MantineRTE.ControlsGroup>

          <MantineRTE.ControlsGroup>
            <MantineRTE.Link />
            <MantineRTE.Unlink />
          </MantineRTE.ControlsGroup>

          <MantineRTE.ControlsGroup>
            <MantineRTE.Undo />
            <MantineRTE.Redo />
          </MantineRTE.ControlsGroup>
        </MantineRTE.Toolbar>

        <MantineRTE.Content />
      </MantineRTE>
      {error && (
        <div style={{ color: "var(--mantine-color-error)", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
