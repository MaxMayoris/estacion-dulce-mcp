import { getFirestore } from '../firebase.js';
import { CategoryIndexProjection } from '../models/projections/category.projection.js';
import { cacheManager } from '../cache/cache-manager.js';

/**
 * Get categories index resource
 * Returns compact category list for efficient transfer
 */
export async function getCategoriesIndexResource(
  ifNoneMatch?: string
): Promise<{
  contents: Array<{ type: string; text: string }>;
  etag?: string;
  lastModified?: string;
} | null> {
  try {
    console.log('📁 Fetching categories index resource');
    
    const db = getFirestore();
    
    // Get categories from Firestore
    const categoriesSnapshot = await db.collection('categories').get();
    
    // Convert to projection
    const categories: CategoryIndexProjection[] = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || ''
    }));
    
    // Sort by name for consistent ordering
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Compute ETag
    const etag = cacheManager.generateETag(categories);
    
    // Check if client has current version
    if (ifNoneMatch && ifNoneMatch === etag) {
      console.log('📁 Categories index unchanged, returning 304');
      return null; // 304 Not Modified
    }
    
    const response = {
      contents: [{
        type: 'text',
        text: JSON.stringify(categories, null, 2)
      }],
      etag,
      lastModified: new Date().toISOString()
    };
    
    console.log(`📁 Categories index resource ready: ${categories.length} categories`);
    return response;
    
  } catch (error) {
    console.error('Error fetching categories index resource:', error);
    throw error;
  }
}
