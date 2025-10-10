/**
 * Resources export barrel
 */
export * from './inventory.resource';
export * from './clients.resource';

/**
 * Resource catalog
 */
export const RESOURCE_CATALOG = [
  {
    uri: 'mcp://estacion-dulce/inventory',
    name: 'Inventory',
    description: 'Complete product inventory with stock levels',
    mimeType: 'application/json',
    version: '1.0.0'
  },
  {
    uri: 'mcp://estacion-dulce/clients',
    name: 'Clients',
    description: 'Client database with contact information',
    mimeType: 'application/json',
    version: '1.0.0'
  }
] as const;
