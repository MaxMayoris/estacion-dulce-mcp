import { z } from 'zod';
import { ProductService } from '../services';
import { ApiResponse, Product } from '../models';

/**
 * Input validation schema for list_products tool
 */
const ListProductsSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  categoryId: z.string().optional(),
});

/**
 * MCP tool for listing products
 * 
 * @param args - Tool arguments
 * @returns Promise<{text: string, references?: Array<{uri: string, title: string, mimeType: string}>}>
 */
export async function listProducts(args: unknown): Promise<{
  text: string;
  references?: Array<{uri: string, title: string, mimeType: string}>;
}> {
  try {
    // Validate input
    const validatedInput = ListProductsSchema.parse(args);
    
    // Use ProductService to get data
    const productService = new ProductService();
    const result = await productService.listProducts(validatedInput.limit, validatedInput.categoryId);
    
    if ('error' in result) {
      return {
        text: `Error: ${result.error}${result.details ? ` - ${result.details}` : ''}`,
        references: []
      };
    }
    
    const products = result.data;
    const productList = products.map(p => 
      `${p.name} - Stock: ${p.quantity} ${p.measure} - Precio: $${p.salePrice}`
    ).join('\n');
    
    return {
      text: `Productos encontrados (${products.length}):\n${productList}`,
      references: [
        {
          uri: `mcp://estacion-dulce/products${validatedInput.categoryId ? `?category=${validatedInput.categoryId}` : ''}`,
          title: `Products List${validatedInput.categoryId ? ` - Category: ${validatedInput.categoryId}` : ''}`,
          mimeType: 'application/json'
        }
      ]
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('list_products validation error:', errorMessage);
      
      return {
        text: `Validation error: ${errorMessage}`,
        references: []
      };
    }
    
    // Handle other errors
    console.error('list_products error:', error);
    return {
      text: `Error: ${(error as Error).message || 'Unknown error'}`,
      references: []
    };
  }
}
