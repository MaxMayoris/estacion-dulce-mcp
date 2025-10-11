/**
 * Utility functions for handling Firestore Timestamp conversions
 */

/**
 * Convert Firestore Timestamp or any date format to JavaScript Date
 * Handles: Firestore Timestamp, Date objects, ISO strings, timestamps
 */
export function toDate(value: any): Date {
  if (!value) {
    return new Date(0); // Epoch for null/undefined
  }

  // Firestore Timestamp with toDate() method
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  // Already a Date object
  if (value instanceof Date) {
    return value;
  }

  // ISO string or timestamp number
  return new Date(value);
}

/**
 * Convert Firestore Timestamp to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(value: any): string {
  return toDate(value).toISOString().split('T')[0];
}

/**
 * Convert Firestore Timestamp to full ISO string
 */
export function toISOString(value: any): string {
  return toDate(value).toISOString();
}

/**
 * Convert Firestore Timestamp to locale string
 */
export function toLocaleString(value: any, locales?: string | string[], options?: Intl.DateTimeFormatOptions): string {
  return toDate(value).toLocaleString(locales, options);
}

