/**
 * Strip HTML tags from a string to get plain text
 * Used for previews and excerpts where formatting is not needed
 * Works in both server and client environments
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  // Check if we're in a browser environment
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = withoutTags;
    return textarea.value;
  }

  // Server-side fallback: decode common HTML entities manually
  return withoutTags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
}
