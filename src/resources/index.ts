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
    name: 'Products',
    description: 'Product index',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/recipes#index',
    name: 'Recipes',
    description: 'Recipe index',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/persons#index',
    name: 'Persons',
    description: 'Person index',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/movements#last-30d',
    name: 'Movements',
    description: 'Last 30 days',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/version-manifest',
    name: 'Versions',
    description: 'ETags manifest',
    mimeType: 'application/json',
    version: '1.0.0'
  }
] as const;
