import { getFirestore } from '../firebase.js';
import { MeasureIndexProjection } from '../models/projections/measure.projection.js';
import { cacheManager } from '../cache/cache-manager.js';

/**
 * Get measures index resource
 * Returns compact measure list for efficient transfer
 */
export async function getMeasuresIndexResource(
  ifNoneMatch?: string
): Promise<{
  contents: Array<{ type: string; text: string }>;
  etag?: string;
  lastModified?: string;
} | null> {
  try {
    console.log('📁 Fetching measures index resource');
    
    const db = getFirestore();
    
    // Get measures from Firestore
    const measuresSnapshot = await db.collection('measures').get();
    
    // Convert to projection
    const measures: MeasureIndexProjection[] = measuresSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      unit: doc.data().unit || ''
    }));
    
    // Sort by name for consistent ordering
    measures.sort((a, b) => a.name.localeCompare(b.name));
    
    // Compute ETag
    const etag = cacheManager.generateETag(measures);
    
    // Check if client has current version
    if (ifNoneMatch && ifNoneMatch === etag) {
      console.log('📁 Measures index unchanged, returning 304');
      return null; // 304 Not Modified
    }
    
    const response = {
      contents: [{
        type: 'text',
        text: JSON.stringify(measures, null, 2)
      }],
      etag,
      lastModified: new Date().toISOString()
    };
    
    console.log(`📁 Measures index resource ready: ${measures.length} measures`);
    return response;
    
  } catch (error) {
    console.error('Error fetching measures index resource:', error);
    throw error;
  }
}
