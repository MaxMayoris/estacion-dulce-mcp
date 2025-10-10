import { cacheManager } from '../cache';

const RESOURCE_URI = 'mcp://estacion-dulce/version-manifest';

/**
 * Version manifest resource
 * Returns ETags and versions for all cached resources for quick invalidation
 */
export async function getVersionManifestResource(): Promise<{
  contents: Array<{ type: string; text: string; uri: string; mimeType: string }>;
  etag?: string;
  lastModified?: string;
}> {
  try {
    const manifest = cacheManager.getVersionManifest();
    const stats = cacheManager.getStats();

    const response = {
      manifest,
      stats,
      generatedAt: new Date().toISOString()
    };

    const etag = cacheManager.generateETag(response);
    const lastModified = new Date().toUTCString();

    return {
      contents: [{
        type: 'text',
        text: JSON.stringify(response, null, 2),
        uri: RESOURCE_URI,
        mimeType: 'application/json'
      }],
      etag,
      lastModified
    };

  } catch (error) {
    console.error('getVersionManifestResource error:', error);
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
