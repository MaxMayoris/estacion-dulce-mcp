import { getFirestore } from '../firebase';

/**
 * Clients resource handler
 * Provides read-only access to clients data
 */
export async function getClientsResource(params?: {
  ifNoneMatch?: string;
  ifModifiedSince?: string;
}): Promise<{
  contents: Array<{ type: string; text: string; uri: string; mimeType: string }>;
  etag?: string;
  lastModified?: string;
}> {
  try {
    const db = getFirestore();
    
    const clientsSnapshot = await db
      .collection('persons')
      .where('type', '==', 'client')
      .limit(50)
      .get();
    
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const etag = `"${Date.now()}"`;
    const lastModified = new Date().toUTCString();
    
    // Check cache
    if (params?.ifNoneMatch === etag) {
      return {
        contents: [{
          type: 'text',
          text: 'Not Modified',
          uri: 'mcp://estacion-dulce/clients',
          mimeType: 'application/json'
        }],
        etag
      };
    }
    
    return {
      contents: [{
        type: 'text',
        text: JSON.stringify(clients, null, 2),
        uri: 'mcp://estacion-dulce/clients',
        mimeType: 'application/json'
      }],
      etag,
      lastModified
    };
    
  } catch (error) {
    console.error('getClientsResource error:', error);
    return {
      contents: [{
        type: 'text',
        text: JSON.stringify({ error: 'Internal server error' }),
        uri: 'mcp://estacion-dulce/clients',
        mimeType: 'application/json'
      }]
    };
  }
}
