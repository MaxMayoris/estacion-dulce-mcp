import { z } from 'zod';
import { getFirestore } from './firebase.js';
import { ERROR_CODES, type ErrorCode } from './constants.js';

const AuditEntrySchema = z.object({
  timestamp: z.date(),
  tool: z.string(),
  environment: z.string(),
  callerId: z.string().optional(),
  input: z.record(z.unknown()),
  result: z.object({
    status: z.enum(['success', 'error']),
    error: z.string().optional(),
    errorCode: z.string().optional(),
  }),
  duration: z.number(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

/**
 * Logs an audit entry to the mcp_audit collection
 * @param entry - Audit entry data
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = getFirestore();
    const auditData = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    };
    
    await db.collection('mcp_audit').add(auditData);
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Creates a structured audit entry for successful operations
 */
export function createSuccessAudit(
  tool: string,
  input: Record<string, unknown>,
  duration: number,
  callerId?: string
): AuditEntry {
  return {
    timestamp: new Date(),
    tool,
    environment: process.env.ENV || 'DEV',
    callerId,
    input,
    result: {
      status: 'success',
    },
    duration,
  };
}

/**
 * Creates a structured audit entry for failed operations
 */
export function createErrorAudit(
  tool: string,
  input: Record<string, unknown>,
  error: string,
  errorCode: ErrorCode,
  duration: number,
  callerId?: string
): AuditEntry {
  return {
    timestamp: new Date(),
    tool,
    environment: process.env.ENV || 'DEV',
    callerId,
    input,
    result: {
      status: 'error',
      error,
      errorCode,
    },
    duration,
  };
}

