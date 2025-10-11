import { z } from 'zod';
import { getFirestore } from '../firebase.js';
import { Person } from '../models/dtos/person.dto.js';
import { auditLogger } from '../audit/index.js';

/**
 * Get detailed person data with audit logging for PII compliance
 * @param args - Tool arguments
 * @returns Person details with addresses subcollection + audit log
 */
export async function getPersonDetails(args: any): Promise<any> {
  const schema = z.object({
    personId: z.string().min(1, 'Person ID is required'),
    purpose: z.string().optional().default('Business operations - customer service')
  });

  const { personId, purpose } = schema.parse(args);

  try {
    console.log(`🔍 Fetching person details: ${personId}`);
    
    const db = getFirestore();
    
    // Get person document
    const personDoc = await db.collection('persons').doc(personId).get();
    
    if (!personDoc.exists) {
      return {
        text: `Person with ID "${personId}" not found`,
        references: []
      };
    }

    const personData = personDoc.data() as Person;
    
    // Get addresses subcollection
    const addressesSnapshot = await db
      .collection('persons')
      .doc(personId)
      .collection('addresses')
      .get();
    
    const addresses = addressesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt,
      updatedAt: doc.data()?.updatedAt?.toDate?.() || doc.data()?.updatedAt
    }));

    // Log PII access for compliance
    await auditLogger.logPIIAccess(
      'READ_PERSON_PII',
      'person',
      personId,
      ['name', 'lastName', 'phones', 'addresses'],
      'mcp-client', // In real app, this would be user/API key
      purpose,
      true
    );

    // Format person details
    const personDetails = {
      id: personDoc.id,
      name: personData.name,
      lastName: personData.lastName,
      type: personData.type,
      phones: personData.phones,
      addresses: addresses,
      // Audit info
      _audit: {
        accessedAt: new Date().toISOString(),
        purpose: purpose
      }
    };

    return {
      text: `Person Details (PII - Audit Logged):\n${JSON.stringify(personDetails, null, 2)}`,
      references: [
        {
          uri: `mcp://estacion-dulce/persons/${personId}`,
          title: `Person ${personId} - Full Details`,
          mimeType: 'application/json'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching person details:', error);
    return {
      text: `Error fetching person details: ${(error as Error).message}`,
      references: []
    };
  }
}
