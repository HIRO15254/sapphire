/**
 * Combine date and time string into a Date object.
 */
export function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return result
}

/**
 * Combine date and end time, adjusting for next day if end time is before start time.
 */
export function combineEndDateTime(
  date: Date,
  startTimeStr: string,
  endTimeStr: string,
): Date {
  const startTime = combineDateAndTime(date, startTimeStr)
  const endTime = combineDateAndTime(date, endTimeStr)

  // If end time is before start time, it's the next day
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1)
  }

  return endTime
}

/**
 * Extract time string (HH:mm) from a Date object.
 */
export function extractTimeString(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Get date part only from a Date object (without time).
 */
export function getDateOnly(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
