/**
 * Currency formatting utilities for Japanese Yen (JPY)
 */

/**
 * Formats a number as Japanese Yen currency
 * @param amount - The amount to format (in JPY)
 * @returns Formatted currency string (e.g., "¥10,000")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

/**
 * Parses a numeric string to a number (for database NUMERIC type)
 * @param value - The numeric string from the database
 * @returns Parsed number value
 */
export function parseNumeric(value: string): number {
  return Number.parseFloat(value);
}

/**
 * Calculates profit from buy-in and cash-out amounts
 * @param cashOut - Amount cashed out
 * @param buyIn - Amount bought in
 * @returns Profit (positive) or loss (negative)
 */
export function calculateProfit(cashOut: number, buyIn: number): number {
  return cashOut - buyIn;
}
