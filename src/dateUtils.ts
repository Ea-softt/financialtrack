/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the start of the week (Monday) for a given date in YYYY-MM-DD format.
 */
export const getStartOfWeek = (date: Date | string | number): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for ISO week (starts Monday)
  const start = new Date(d.setDate(diff));
  return start.toISOString().split('T')[0];
};

/**
 * Returns a string key for the month (e.g., "2024-05").
 */
export const getMonthKey = (date: Date | string | number): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Validates if a value is a valid date.
 */
export const isValidDate = (date: any): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};