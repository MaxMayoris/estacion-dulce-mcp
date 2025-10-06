/**
 * Allowed Firestore collections for Estación Dulce
 */
export const ALLOWED_COLLECTIONS = {
  READ: ['products', 'recipes', 'categories', 'mcp_audit'] as const,
  WRITE: ['products', 'mcp_audit'] as const,
} as const;

/**
 * Allowed fields for write operations per collection
 */
export const ALLOWED_FIELDS = {
  products: ['suggestedPrice', 'updatedAt'] as const,
} as const;

/**
 * Environment types
 */
export const ENV_TYPES = ['DEV', 'PROD'] as const;

/**
 * Error codes for structured error responses
 */
export const ERROR_CODES = {
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  NOT_FOUND: 'NOT_FOUND',
  BUSINESS: 'BUSINESS',
} as const;

/**
 * Default limits for operations
 */
export const LIMITS = {
  DEFAULT_LIST_LIMIT: 50,
  MAX_LIST_LIMIT: 100,
  PRICE_DECIMALS: 2,
} as const;

export type AllowedCollection = typeof ALLOWED_COLLECTIONS.READ[number];
export type WritableCollection = typeof ALLOWED_COLLECTIONS.WRITE[number];
export type EnvType = typeof ENV_TYPES[number];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

