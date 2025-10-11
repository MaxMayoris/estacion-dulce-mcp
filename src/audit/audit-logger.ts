import { getFirestore } from '../firebase.js';

/**
 * Audit log entry for compliance tracking
 */
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId: string;
  accessedFields: string[];
  requester: string;
  purpose: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit logger for GDPR/Ley 25.326 compliance
 */
export class AuditLogger {
  private db = getFirestore();

  /**
   * Log PII data access
   */
  async logPIIAccess(
    action: string,
    resourceType: string,
    resourceId: string,
    accessedFields: string[],
    requester: string,
    purpose: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const auditLog: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      resourceType,
      resourceId,
      accessedFields,
      requester,
      purpose,
      success,
      errorMessage
    };

    try {
      await this.db.collection('audit_logs').add(auditLog);
      console.log(`📋 Audit logged: ${action} on ${resourceType}/${resourceId}`);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit failure shouldn't break main operation
    }
  }

  /**
   * Log data deletion (GDPR right to erasure)
   */
  async logDataDeletion(
    resourceType: string,
    resourceId: string,
    deletedFields: string[],
    requester: string
  ): Promise<void> {
    await this.logPIIAccess(
      'DELETE_PII',
      resourceType,
      resourceId,
      deletedFields,
      requester,
      'GDPR Article 17 - Right to erasure',
      true
    );
  }

  /**
   * Log data modification
   */
  async logDataModification(
    resourceType: string,
    resourceId: string,
    modifiedFields: string[],
    requester: string,
    purpose: string
  ): Promise<void> {
    await this.logPIIAccess(
      'MODIFY_PII',
      resourceType,
      resourceId,
      modifiedFields,
      requester,
      purpose,
      true
    );
  }

  /**
   * Get audit trail for a resource
   */
  async getAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    const snapshot = await this.db
      .collection('audit_logs')
      .where('resourceType', '==', resourceType)
      .where('resourceId', '==', resourceId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as AuditLogEntry);
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
