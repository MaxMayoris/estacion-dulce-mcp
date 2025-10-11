/**
 * Resources export barrel
 */
export * from './products-index.resource';
export * from './recipes-index.resource';
export * from './persons-index.resource';
export * from './movements-last-30d.resource';
export * from './categories-index.resource';
export * from './measures-index.resource';
export * from './clients-recent.resource';
export * from './version-manifest.resource';

/**
 * Resource catalog with compact projections
 */
export const RESOURCE_CATALOG = [
  {
    uri: 'mcp://estacion-dulce/products#index',
    name: 'Products',
    description: 'Products',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/recipes#index',
    name: 'Recipes',
    description: 'Recipes',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/persons#index',
    name: 'Persons',
    description: 'Persons',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/movements#last-30d',
    name: 'Movements',
    description: 'Last 30d',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/categories#index',
    name: 'Categories',
    description: 'Categories',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/measures#index',
    name: 'Measures',
    description: 'Units',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/clients#recent',
    name: 'Recent Clients',
    description: 'Last 30d buyers',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/version-manifest',
    name: 'Versions',
    description: 'ETags',
    mimeType: 'application/json',
    version: '1.0.0'
  }
] as const;
