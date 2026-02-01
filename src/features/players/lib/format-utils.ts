/**
 * Format date for player display (e.g., 2025/12/29).
 */
export function formatPlayerDate(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
