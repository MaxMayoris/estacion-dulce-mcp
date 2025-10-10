import { z } from 'zod';
import { ProductService } from '../services';
import { ApiResponse, Product } from '../models';

/**
 * Input validation schema for answer_inventory_query tool
 */
const AnswerInventoryQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  limit: z.number().min(1).max(50).default(20),
});

/**
 * Answers inventory queries in natural language
 * 
 * @param args - Tool arguments with query string
 * @returns Natural language response with product references
 */
export async function answerInventoryQuery(args: unknown): Promise<{
  text: string;
  references?: Array<{ uri: string; name: string }>;
  error?: { error: string; code: string };
}> {
  try {
    const validatedInput = AnswerInventoryQuerySchema.parse(args);
    
    const productService = new ProductService();
    const result = await productService.listProducts(validatedInput.limit);
    
    if ('error' in result) {
      return {
        text: `Error querying inventory: ${result.error}`,
        error: result
      };
    }
    
    const products = result.data;
    
    // Generate natural language response
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity < p.minimumQuantity);
    const totalValue = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
    
    let response = `Found ${totalProducts} products in inventory.\n\n`;
    
    if (lowStockProducts.length > 0) {
      response += `⚠️ ${lowStockProducts.length} products below minimum stock:\n`;
      lowStockProducts.forEach(p => {
        response += `- ${p.name}: ${p.quantity} (min: ${p.minimumQuantity})\n`;
      });
      response += '\n';
    }
    
    response += `Total inventory value: $${totalValue.toFixed(2)}`;
    
    // Generate references to resources
    const references = [
      {
        uri: 'mcp://estacion-dulce/products#index',
        name: 'Products Index'
      },
      {
        uri: 'mcp://estacion-dulce/version-manifest',
        name: 'Version Manifest'
      }
    ];
    
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
    
    console.error('answer_inventory_query error:', error);
    return {
      text: 'Internal server error',
      error: { error: 'Internal server error', code: 'INTERNAL' }
    };
  }
}
