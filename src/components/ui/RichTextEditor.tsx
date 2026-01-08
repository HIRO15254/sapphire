'use client'

import { Link, RichTextEditor as MantineRichTextEditor } from '@mantine/tiptap'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'

interface RichTextEditorProps {
  content: string
  onChange: (value: string) => void
  /** Use bubble menu instead of sticky toolbar */
  variant?: 'toolbar' | 'bubble'
  /** Placeholder text when empty */
  placeholder?: string
}

/**
 * Rich text editor component using Tiptap with Mantine styling.
 *
 * Features: Bold, Italic, Strikethrough, Link, Bullet List, Ordered List, Highlight
 *
 * Variants:
 * - toolbar: Shows a sticky toolbar at the top (default)
 * - bubble: Shows a floating toolbar when text is selected
 */
export function RichTextEditor({
  content,
  onChange,
  variant = 'toolbar',
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: variant === 'bubble',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content',
      },
    },
  })

  if (variant === 'bubble') {
    return (
      <MantineRichTextEditor editor={editor}>
        {editor && (
          <BubbleMenu editor={editor}>
            <MantineRichTextEditor.ControlsGroup>
              <MantineRichTextEditor.Bold />
              <MantineRichTextEditor.Italic />
              <MantineRichTextEditor.Strikethrough />
              <MantineRichTextEditor.Highlight />
              <MantineRichTextEditor.Link />
            </MantineRichTextEditor.ControlsGroup>
          </BubbleMenu>
        )}
        <MantineRichTextEditor.Content />
      </MantineRichTextEditor>
    )
  }

  return (
    <MantineRichTextEditor editor={editor}>
      <MantineRichTextEditor.Toolbar sticky stickyOffset={60}>
        <MantineRichTextEditor.ControlsGroup>
          <MantineRichTextEditor.H2 />
          <MantineRichTextEditor.H3 />
          <MantineRichTextEditor.H4 />
        </MantineRichTextEditor.ControlsGroup>

        <MantineRichTextEditor.ControlsGroup>
          <MantineRichTextEditor.Bold />
          <MantineRichTextEditor.Italic />
          <MantineRichTextEditor.Strikethrough />
          <MantineRichTextEditor.Highlight />
        </MantineRichTextEditor.ControlsGroup>

        <MantineRichTextEditor.ControlsGroup>
          <MantineRichTextEditor.BulletList />
          <MantineRichTextEditor.OrderedList />
        </MantineRichTextEditor.ControlsGroup>

        <MantineRichTextEditor.ControlsGroup>
          <MantineRichTextEditor.Link />
          <MantineRichTextEditor.Unlink />
        </MantineRichTextEditor.ControlsGroup>
      </MantineRichTextEditor.Toolbar>

      <MantineRichTextEditor.Content />
    </MantineRichTextEditor>
  )
}
