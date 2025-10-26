/**
 * Strip HTML tags from a string to get plain text
 * Used for previews and excerpts where formatting is not needed
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  const textarea = document.createElement("textarea");
  textarea.innerHTML = withoutTags;

  return textarea.value;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
