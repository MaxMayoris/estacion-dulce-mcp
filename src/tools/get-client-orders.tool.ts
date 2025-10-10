import { z } from 'zod';
import { getFirestore } from '../firebase';

/**
 * Input validation schema for get_client_orders tool
 */
const GetClientOrdersSchema = z.object({
  clientId: z.string().min(1, 'Client ID cannot be empty'),
  limit: z.number().min(1).max(50).default(10),
});

/**
 * Gets orders for a specific client
 * 
 * @param args - Tool arguments with clientId
 * @returns Client orders with references
 */
export async function getClientOrders(args: unknown): Promise<{
  text: string;
  references?: Array<{ uri: string; name: string }>;
  error?: { error: string; code: string };
}> {
  try {
    const validatedInput = GetClientOrdersSchema.parse(args);
    
    const db = getFirestore();
    
    // Query orders for client
    const ordersSnapshot = await db
      .collection('movements')
      .where('personId', '==', validatedInput.clientId)
      .where('type', '==', 'sale')
      .limit(validatedInput.limit)
      .get();
    
    if (ordersSnapshot.empty) {
      return {
        text: `No orders found for client ${validatedInput.clientId}`
      };
    }
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Generate natural language response
    let response = `Found ${orders.length} orders for client ${validatedInput.clientId}:\n\n`;
    
    orders.forEach((order: any, index) => {
      response += `${index + 1}. Order ${order.id}\n`;
      response += `   Date: ${order.date || 'N/A'}\n`;
      response += `   Total: $${order.total || 0}\n`;
      response += `   Status: ${order.status || 'pending'}\n\n`;
    });
    
    // Generate references
    const references = orders.map((order: any) => ({
      uri: `mcp://estacion-dulce/orders/${order.id}`,
      name: `Order ${order.id}`
    }));
    
    return {
      text: response,
      references
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        text: `Validation error: ${errorMessage}`,
        error: { error: errorMessage, code: 'VALIDATION' }
      };
    }
    
    console.error('get_client_orders error:', error);
    return {
      text: 'Internal server error',
      error: { error: 'Internal server error', code: 'INTERNAL' }
    };
  }
}
