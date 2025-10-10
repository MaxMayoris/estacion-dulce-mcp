/**
 * Resources export barrel
 */
export * from './products-index.resource';
export * from './recipes-index.resource';
export * from './persons-index.resource';
export * from './movements-last-30d.resource';
export * from './version-manifest.resource';

/**
 * Resource catalog with compact projections
 */
export const RESOURCE_CATALOG = [
  {
    uri: 'mcp://estacion-dulce/products#index',
    name: 'Products Index',
    description: 'Compact product index: id, name, categoryId, price, stock',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/recipes#index',
    name: 'Recipes Index',
    description: 'Compact recipe index: id, name, yield, baseCost, updatedAt',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/persons#index',
    name: 'Persons Index (Redacted)',
    description: 'Redacted persons index: id, displayName, tags (NO PII)',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/movements#last-30d',
    name: 'Movements Last 30 Days',
    description: 'Aggregated movements by date/type: date, type, qty, total',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/version-manifest',
    name: 'Version Manifest',
    description: 'ETags and versions for all resources (for quick invalidation)',
    mimeType: 'application/json',
    version: '1.0.0'
  }
] as const;
