import { ProductService } from '../services';

/**
 * Inventory resource handler
 * Provides read-only access to inventory data
 */
export async function getInventoryResource(params?: {
  ifNoneMatch?: string;
  ifModifiedSince?: string;
}): Promise<{
  contents: Array<{ type: string; text: string; uri: string; mimeType: string }>;
  etag?: string;
  lastModified?: string;
}> {
  try {
    const productService = new ProductService();
    const result = await productService.listProducts(50);
    
    if ('error' in result) {
      return {
        contents: [{
          type: 'text',
          text: JSON.stringify({ error: result.error }),
          uri: 'mcp://estacion-dulce/inventory',
          mimeType: 'application/json'
        }]
      };
    }
    
    const products = result.data;
    const etag = `"${Date.now()}"`;
    const lastModified = new Date().toUTCString();
    
    // Check cache
    if (params?.ifNoneMatch === etag) {
      return {
        contents: [{
          type: 'text',
          text: 'Not Modified',
          uri: 'mcp://estacion-dulce/inventory',
          mimeType: 'application/json'
        }],
        etag
      };
    }
    
    return {
      contents: [{
        type: 'text',
        text: JSON.stringify(products, null, 2),
        uri: 'mcp://estacion-dulce/inventory',
        mimeType: 'application/json'
      }],
      etag,
      lastModified
    };
    
  } catch (error) {
    console.error('getInventoryResource error:', error);
    return {
      contents: [{
        type: 'text',
        text: JSON.stringify({ error: 'Internal server error' }),
        uri: 'mcp://estacion-dulce/inventory',
        mimeType: 'application/json'
      }]
    };
  }
}
