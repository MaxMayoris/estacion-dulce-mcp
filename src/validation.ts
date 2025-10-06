import { z } from 'zod';
import { ALLOWED_COLLECTIONS, ALLOWED_FIELDS, LIMITS, ERROR_CODES, type EnvType } from './constants.js';

/**
 * Validates environment type
 */
export function validateEnvironment(): EnvType {
  const env = process.env.ENV;
  if (!env || !['DEV', 'PROD'].includes(env)) {
    throw new Error('ENV must be set to DEV or PROD');
  }
  return env as EnvType;
}

/**
 * Validates collection name against allowlist
 */
export function validateCollection(collection: string, isWrite = false): string {
  const allowedCollections = isWrite ? ALLOWED_COLLECTIONS.WRITE : ALLOWED_COLLECTIONS.READ;
  
  if (!allowedCollections.includes(collection as any)) {
    throw new Error(`Collection '${collection}' is not allowed`);
  }
  
  return collection;
}

/**
 * Validates field name against allowlist for a specific collection
 */
export function validateField(collection: string, field: string): string {
  const allowedFields = ALLOWED_FIELDS[collection as keyof typeof ALLOWED_FIELDS];
  
  if (!allowedFields || !allowedFields.includes(field as any)) {
    throw new Error(`Field '${field}' is not allowed for collection '${collection}'`);
  }
  
  return field;
}

/**
 * Rounds price to specified decimal places
 */
export function roundPrice(price: number): number {
  return Math.round(price * Math.pow(10, LIMITS.PRICE_DECIMALS)) / Math.pow(10, LIMITS.PRICE_DECIMALS);
}

/**
 * Validates price constraints
 */
export function validatePrice(price: number): number {
  if (price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (price > 999999.99) {
    throw new Error('Price exceeds maximum allowed value');
  }
  return roundPrice(price);
}

/**
 * Creates structured error response
 */
export function createErrorResponse(message: string, code: keyof typeof ERROR_CODES): {
  error: string;
  code: string;
} {
  return {
    error: message,
    code: ERROR_CODES[code],
  };
}

/**
 * Schema for common tool parameters
 */
export const CommonParamsSchema = z.object({
  limit: z.number().min(1).max(LIMITS.MAX_LIST_LIMIT).default(LIMITS.DEFAULT_LIST_LIMIT),
  dryRun: z.boolean().default(true),
});

/**
 * Schema for write operations requiring confirmation in PROD
 */
export const WriteParamsSchema = z.object({
  confirm: z.boolean().default(false),
  dryRun: z.boolean().default(true),
}).refine((data) => {
  const env = process.env.ENV;
  if (env === 'PROD' && !data.dryRun && !data.confirm) {
    return false;
  }
  return true;
}, {
  message: 'PROD write operations require confirm=true when not dryRun',
});

/**
 * Schema for ID parameter validation
 */
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
});

