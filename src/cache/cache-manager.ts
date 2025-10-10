import crypto from 'crypto';

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: any;
  etag: string;
  lastModified: string;
  dataVersion: number;
  timestamp: number;
  sizeBytes: number;
}

/**
 * TTL configuration per resource type (in milliseconds)
 */
const TTL_CONFIG = {
  'products#index': 60 * 1000,        // 60s
  'recipes#index': 5 * 60 * 1000,     // 5min
  'persons#index': 15 * 60 * 1000,    // 15min
  'movements#last-30d': 1 * 60 * 1000, // 1min
  'inventory_snapshot': 2 * 60 * 1000, // 2min
  'low_stock': 2 * 60 * 1000,         // 2min
} as const;

/**
 * In-memory cache store
 */
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private dirtyFlags: Set<string> = new Set();
  private dataVersions: Map<string, number> = new Map();

  /**
   * Generate ETag from data
   */
  generateETag(data: any): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `"${hash}"`;
  }

  /**
   * Get cache entry if valid
   */
  get(uri: string, ifNoneMatch?: string): CacheEntry | null {
    const entry = this.cache.get(uri);
    
    if (!entry) {
      return null;
    }

    // Check if dirty
    if (this.dirtyFlags.has(uri)) {
      return null;
    }

    // Check TTL
    const ttl = this.getTTL(uri);
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(uri);
      return null;
    }

    // Check ETag match
    if (ifNoneMatch && entry.etag === ifNoneMatch) {
      return entry;
    }

    return entry;
  }

  /**
   * Set cache entry
   */
  set(uri: string, data: any): CacheEntry {
    const etag = this.generateETag(data);
    const lastModified = new Date().toUTCString();
    const dataVersion = this.incrementVersion(uri);
    const sizeBytes = JSON.stringify(data).length;

    const entry: CacheEntry = {
      data,
      etag,
      lastModified,
      dataVersion,
      timestamp: Date.now(),
      sizeBytes
    };

    this.cache.set(uri, entry);
    this.dirtyFlags.delete(uri);

    // Log cache metrics
    console.log(`Cache SET: ${uri}, etag: ${etag}, size: ${sizeBytes}B, version: ${dataVersion}`);

    // Alert if size is too large
    if (sizeBytes > 400 * 1024) {
      console.warn(`⚠️ Large cache entry: ${uri} (${sizeBytes}B > 400KB)`);
    }

    return entry;
  }

  /**
   * Mark resource as dirty (needs refresh)
   */
  markDirty(uri: string): void {
    this.dirtyFlags.add(uri);
    console.log(`Cache DIRTY: ${uri}`);
  }

  /**
   * Get TTL for resource type
   */
  private getTTL(uri: string): number {
    const resourceType = uri.split('//')[1]?.split('/').pop() || '';
    return TTL_CONFIG[resourceType as keyof typeof TTL_CONFIG] || 60 * 1000;
  }

  /**
   * Increment and get data version
   */
  private incrementVersion(uri: string): number {
    const current = this.dataVersions.get(uri) || 0;
    const next = current + 1;
    this.dataVersions.set(uri, next);
    return next;
  }

  /**
   * Get version manifest (all URIs with their ETags)
   */
  getVersionManifest(): Record<string, { etag: string; dataVersion: number; lastModified: string }> {
    const manifest: Record<string, any> = {};
    
    this.cache.forEach((entry, uri) => {
      manifest[uri] = {
        etag: entry.etag,
        dataVersion: entry.dataVersion,
        lastModified: entry.lastModified
      };
    });

    return manifest;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.dirtyFlags.clear();
    console.log('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    totalSize: number;
    dirtyCount: number;
  } {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.sizeBytes;
    });

    return {
      entries: this.cache.size,
      totalSize,
      dirtyCount: this.dirtyFlags.size
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
