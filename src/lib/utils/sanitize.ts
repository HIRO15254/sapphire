import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Server-side DOMPurify setup with JSDOM
const window = new JSDOM("").window;
// biome-ignore lint/suspicious/noExplicitAny: DOMPurify type compatibility with JSDOM
const purify = DOMPurify(window as any);

// Allowed HTML tags for rich text memos
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "blockquote",
];

// Allowed attributes (flat list for DOMPurify)
const ALLOWED_ATTR = ["href", "rel", "target"];

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Used on the server-side before saving to database
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string or null if input is empty
 */
export function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html || html.trim() === "") {
    return null;
  }

  const sanitized = purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  return sanitized || null;
}
