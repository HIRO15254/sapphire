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
 *
 * This handles the common case where a session ends after midnight
 * (e.g., start at 22:00, end at 02:00 the next day).
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
