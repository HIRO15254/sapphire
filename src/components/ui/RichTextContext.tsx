import { Typography } from '@mantine/core'

interface RichTextContentProps {
  content: string
}

/**
 * Read-only display component for rich text content.
 *
 * Uses Mantine's Typography to apply theme-aware typography styles
 * to paragraphs, headings, lists, blockquotes, tables, links, etc.
 *
 * Note: dangerouslySetInnerHTML is intentionally used here to render
 * sanitized HTML from Tiptap editor. Content is trusted as it comes
 * from authenticated user input through the RichTextEditor component.
 */
export function RichTextContent({ content }: RichTextContentProps) {
  return (
    <Typography>
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted Tiptap HTML content
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </Typography>
  )
}
