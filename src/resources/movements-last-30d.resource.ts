import { getFirestore } from '../firebase';
import { cacheManager } from '../cache';
import { aggregateMovements, filterLast30Days } from '../models/projections';
import { Movement } from '../models';

const RESOURCE_URI = 'mcp://estacion-dulce/movements#last-30d';
const MAX_SIZE_BYTES = 512 * 1024;

/**
 * Movements last 30 days resource with caching
 * Aggregated by date and type: date, type, qty, total
 */
export async function getMovementsLast30DResource(params?: {
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

    // Fetch movements from last 30 days
    const db = getFirestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db
      .collection('movements')
      .where('movementDate', '>=', thirtyDaysAgo)
      .orderBy('movementDate', 'desc')
      .limit(500)
      .get();

    const movements: Movement[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        movementDate: data.movementDate?.toDate?.()?.toISOString() || new Date().toISOString(),
        appliedAt: data.appliedAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      } as Movement;
    });

    // Filter and aggregate
    const filtered = filterLast30Days(movements);
    const aggregated = aggregateMovements(filtered);

    // Check size limit
    const sizeBytes = JSON.stringify(aggregated).length;
    if (sizeBytes > MAX_SIZE_BYTES) {
      console.warn(`⚠️ Resource ${RESOURCE_URI} exceeds size limit: ${sizeBytes}B > ${MAX_SIZE_BYTES}B`);
    }

    // Cache the result
    const cacheEntry = cacheManager.set(RESOURCE_URI, aggregated);

    const computeMs = Date.now() - startTime;
    console.log(`Resource ${RESOURCE_URI}: cacheHit=false, computeMs=${computeMs}, sizeBytes=${sizeBytes}`);

    if (computeMs > 1000) {
      console.warn(`⚠️ Slow resource computation: ${RESOURCE_URI} took ${computeMs}ms`);
    }

    return {
      contents: [{
        type: 'text',
        text: JSON.stringify(aggregated, null, 2),
        uri: RESOURCE_URI,
        mimeType: 'application/json'
      }],
      etag: cacheEntry.etag,
      lastModified: cacheEntry.lastModified,
      dataVersion: cacheEntry.dataVersion
    };

  } catch (error) {
    console.error(`getMovementsLast30DResource error:`, error);
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
