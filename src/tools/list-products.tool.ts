import { z } from 'zod';
import { ProductService } from '../services';
import { ApiResponse, Product } from '../dtos';

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
 * @returns Promise<ApiResponse<Product[]>>
 */
export async function listProducts(args: unknown): Promise<ApiResponse<Product[]>> {
  try {
    // Validate input
    const validatedInput = ListProductsSchema.parse(args);
    
    // Use ProductService to get data
    const productService = new ProductService();
    return await productService.listProducts(validatedInput.limit, validatedInput.categoryId);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('list_products validation error:', errorMessage);
      
      return {
        error: `Validation error: ${errorMessage}`,
        code: 'VALIDATION',
      };
    }
    
    // Handle other errors
    console.error('list_products error:', error);
    return {
      error: 'Internal server error',
      code: 'INTERNAL',
      details: (error as Error).message || 'Unknown error'
    };
  }
}
