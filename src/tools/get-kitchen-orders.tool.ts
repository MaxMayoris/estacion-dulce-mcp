import { z } from 'zod';
import { getFirestore } from '../firebase.js';

/**
 * Get kitchen orders with optional filters
 * @param args - Tool arguments
 * @returns Kitchen orders with optional filtering
 */
export async function getKitchenOrders(args: any): Promise<any> {
  const schema = z.object({
    movementId: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional()
  });

  const { movementId, status, limit = 50 } = schema.parse(args);

  try {
    const db = getFirestore();
    let kitchenOrders: any[] = [];
    
    if (movementId) {
      // Get kitchen orders for specific movement
      console.log(`🔍 Fetching kitchen orders for movement: ${movementId}`);
      
      let collectionRef = db
        .collection('movements')
        .doc(movementId)
        .collection('kitchenOrders');
      
      // Apply status filter if provided
      if (status) {
        collectionRef = collectionRef.where('status', '==', status) as any;
      }
      
      const snapshot = await collectionRef.limit(limit).get();
      kitchenOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        movementId,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt,
        updatedAt: doc.data()?.updatedAt?.toDate?.() || doc.data()?.updatedAt
      }));
      
    } else {
      // Get all kitchen orders across all movements (with status filter)
      console.log(`🔍 Fetching all kitchen orders${status ? ` with status: ${status}` : ''}`);
      
      // This is more complex - we need to query across all movements
      const movementsSnapshot = await db.collection('movements').get();
      
      for (const movementDoc of movementsSnapshot.docs) {
        let collectionRef = db
          .collection('movements')
          .doc(movementDoc.id)
          .collection('kitchenOrders');
        
        if (status) {
          collectionRef = collectionRef.where('status', '==', status) as any;
        }
        
        const kitchenOrdersSnapshot = await collectionRef.limit(limit).get();
        
        kitchenOrders.push(...kitchenOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          movementId: movementDoc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt,
          updatedAt: doc.data()?.updatedAt?.toDate?.() || doc.data()?.updatedAt
        })));
        
        if (kitchenOrders.length >= limit) break;
      }
    }
    
    if (kitchenOrders.length === 0) {
      const message = movementId 
        ? `No kitchen orders found for movement "${movementId}"${status ? ` with status "${status}"` : ''}`
        : `No kitchen orders found${status ? ` with status "${status}"` : ''}`;
      
      return {
        text: message,
        references: []
      };
    }
    
    const title = movementId 
      ? `Kitchen Orders - Movement ${movementId}`
      : `Kitchen Orders${status ? ` - Status: ${status}` : ''}`;

    return {
      text: `${title}:\n${JSON.stringify(kitchenOrders, null, 2)}`,
      references: [
        {
          uri: movementId 
            ? `mcp://estacion-dulce/movements/${movementId}/kitchenOrders`
            : `mcp://estacion-dulce/kitchenOrders${status ? `?status=${status}` : ''}`,
          title,
          mimeType: 'application/json'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return {
      text: `Error fetching kitchen orders: ${(error as Error).message}`,
      references: []
    };
  }
}
