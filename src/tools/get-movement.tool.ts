import { z } from 'zod';
import { getFirestore } from '../firebase.js';
import { Movement } from '../models/dtos/movement.dto.js';

/**
 * Get movement data by ID (without kitchenOrders subcollection)
 * @param args - Tool arguments
 * @returns Movement details
 */
export async function getMovement(args: any): Promise<any> {
  const schema = z.object({
    movementId: z.string().min(1, 'Movement ID is required')
  });

  const { movementId } = schema.parse(args);

  try {
    console.log(`🔍 Fetching movement: ${movementId}`);
    
    const db = getFirestore();
    
    // Get movement document
    const movementDoc = await db.collection('movements').doc(movementId).get();
    
    if (!movementDoc.exists) {
      return {
        text: `Movement with ID "${movementId}" not found`,
        references: []
      };
    }

    const movementData = movementDoc.data() as Movement;

    return {
      text: `Movement Details:\n${JSON.stringify({
        ...movementData,
        id: movementDoc.id
      }, null, 2)}`,
      references: [
        {
          uri: `mcp://estacion-dulce/movements/${movementId}`,
          title: `Movement ${movementId}`,
          mimeType: 'application/json'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching movement:', error);
    return {
      text: `Error fetching movement: ${(error as Error).message}`,
      references: []
    };
  }
}
