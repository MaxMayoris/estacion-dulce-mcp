import { getFirestore } from '../firebase';
import { cacheManager } from '../cache';
import { toRecipeIndexProjection, sortRecipesForIndex } from '../models/projections';
import { Recipe } from '../models';

const RESOURCE_URI = 'mcp://estacion-dulce/recipes#index';
const MAX_SIZE_BYTES = 512 * 1024;

/**
 * Recipes index resource with caching
 * Compact projection: id, name, yield, baseCost, updatedAt
 */
export async function getRecipesIndexResource(params?: {
  ifNoneMatch?: string;
  ifModifiedSince?: string;
}): Promise<{
  contents: Array<{ type: string; text: string; uri: string; mimeType: string }>;
  etag?: string;
  lastModified?: string;
  dataVersion?: number;
}> {
  const startTime = Date.now();

  try {
    // Check cache
    const cached = cacheManager.get(RESOURCE_URI, params?.ifNoneMatch);
    
    if (cached && params?.ifNoneMatch === cached.etag) {
      console.log(`Cache HIT: ${RESOURCE_URI}, etag: ${cached.etag}`);
      return {
        contents: [{
          type: 'text',
          text: 'Not Modified',
          uri: RESOURCE_URI,
          mimeType: 'application/json'
        }],
        etag: cached.etag,
        lastModified: cached.lastModified,
        dataVersion: cached.dataVersion
      };
    }

    if (cached) {
      console.log(`Cache HIT: ${RESOURCE_URI}, returning cached data`);
      const computeMs = Date.now() - startTime;
      console.log(`Resource ${RESOURCE_URI}: cacheHit=true, computeMs=${computeMs}, sizeBytes=${cached.sizeBytes}`);
      
      return {
        contents: [{
          type: 'text',
          text: JSON.stringify(cached.data, null, 2),
          uri: RESOURCE_URI,
          mimeType: 'application/json'
        }],
        etag: cached.etag,
        lastModified: cached.lastModified,
        dataVersion: cached.dataVersion
      };
    }

    console.log(`Cache MISS: ${RESOURCE_URI}, fetching from Firestore`);

    // Fetch from Firestore
    const db = getFirestore();
    const snapshot = await db.collection('recipes').limit(100).get();

    const recipes: Recipe[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Recipe));

    // Project to compact format
    const projections = recipes.map(toRecipeIndexProjection);
    const sorted = sortRecipesForIndex(projections);

    // Check size limit
    const sizeBytes = JSON.stringify(sorted).length;
    if (sizeBytes > MAX_SIZE_BYTES) {
      console.warn(`⚠️ Resource ${RESOURCE_URI} exceeds size limit: ${sizeBytes}B > ${MAX_SIZE_BYTES}B`);
    }

    // Cache the result
    const cacheEntry = cacheManager.set(RESOURCE_URI, sorted);

    const computeMs = Date.now() - startTime;
    console.log(`Resource ${RESOURCE_URI}: cacheHit=false, computeMs=${computeMs}, sizeBytes=${sizeBytes}`);

    if (computeMs > 1000) {
      console.warn(`⚠️ Slow resource computation: ${RESOURCE_URI} took ${computeMs}ms`);
    }

    return {
      contents: [{
        type: 'text',
        text: JSON.stringify(sorted, null, 2),
        uri: RESOURCE_URI,
        mimeType: 'application/json'
      }],
      etag: cacheEntry.etag,
      lastModified: cacheEntry.lastModified,
      dataVersion: cacheEntry.dataVersion
    };

  } catch (error) {
    console.error(`getRecipesIndexResource error:`, error);
    return {
      contents: [{
        type: 'text',
        text: JSON.stringify({ error: 'Internal server error' }),
        uri: RESOURCE_URI,
        mimeType: 'application/json'
      }]
    };
  }
}
