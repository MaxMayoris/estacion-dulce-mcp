import { getFirestore } from '../firebase.js';
import { cacheManager } from '../cache/cache-manager.js';
import { Movement } from '../models/dtos/movement.dto.js';
import { Person } from '../models/dtos/person.dto.js';
import { aggregateClientPurchases, sortClientsByRecent } from '../models/projections/client.projection.js';

/**
 * Get recent clients resource
 * Returns clients who made purchases in the last 30 days with statistics
 */
export async function getClientsRecentResource(
  ifNoneMatch?: string
): Promise<{
  contents: Array<{ type: string; text: string }>;
  etag?: string;
  lastModified?: string;
} | null> {
  try {
    console.log('📁 Fetching recent clients resource');
    
    const db = getFirestore();
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get movements from last 30 days (sales only)
    const movementsSnapshot = await db
      .collection('movements')
      .where('type', '==', 'SALE')
      .where('movementDate', '>=', thirtyDaysAgo)
      .get();
    
    const movements: Movement[] = movementsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Movement));
    
    // Get unique person IDs
    const personIds = new Set<string>();
    movements.forEach(m => {
      if (m.personId) personIds.add(m.personId);
    });
    
    // Fetch all persons in parallel
    const personPromises = Array.from(personIds).map(async (personId) => {
      const personDoc = await db.collection('persons').doc(personId).get();
      if (personDoc.exists) {
        return {
          id: personDoc.id,
          ...personDoc.data()
        } as Person;
      }
      return null;
    });
    
    const persons = (await Promise.all(personPromises)).filter(p => p !== null) as Person[];
    const personsMap = new Map(persons.map(p => [p.id, p]));
    
    // Aggregate client purchases
    const clients = aggregateClientPurchases(personsMap, movements);
    const sorted = sortClientsByRecent(clients);
    
    // Compute ETag
    const etag = cacheManager.generateETag(sorted);
    
    // Check if client has current version
    if (ifNoneMatch && ifNoneMatch === etag) {
      console.log('📁 Recent clients unchanged, returning 304');
      return null; // 304 Not Modified
    }
    
    const response = {
      contents: [{
        type: 'text',
        text: JSON.stringify(sorted, null, 2)
      }],
      etag,
      lastModified: new Date().toISOString()
    };
    
    console.log(`📁 Recent clients resource ready: ${sorted.length} clients`);
    return response;
    
  } catch (error) {
    console.error('Error fetching recent clients resource:', error);
    throw error;
  }
}

