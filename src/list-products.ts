import { z } from 'zod';
import { getFirestore } from './firebase.js';

/**
 * Schema for list_products tool input validation
 */
const ListProductsSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  categoryId: z.string().optional(),
});

/**
 * Product data structure returned by list_products
 */
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  cost: number;
  suggestedPrice: number;
  updatedAt: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  code: 'VALIDATION' | 'INTERNAL';
}

/**
 * Success response structure
 */
export interface SuccessResponse {
  success: boolean;
  data: Product[];
}

/**
 * Main response type for list_products
 */
export type ListProductsResponse = SuccessResponse | ErrorResponse;

/**
 * Lists products from Firestore with optional category filtering
 * @param limit - Maximum number of products to return (1-50, default 20)
 * @param categoryId - Optional category ID to filter by
 * @returns Array of products with id, name, categoryId, cost, suggestedPrice, updatedAt
 */
export async function listProducts(
  limit?: number,
  categoryId?: string
): Promise<ListProductsResponse> {
  try {
    // Validate input parameters
    const validatedInput = ListProductsSchema.parse({ limit, categoryId });
    
    const db = getFirestore();
    
    // Build query for products collection (hardcoded)
    let query: any = db.collection('products');
    
    // Apply category filter if provided
    if (validatedInput.categoryId) {
      query = query.where('categoryId', '==', validatedInput.categoryId);
    }
    
    // Apply limit
    query = query.limit(validatedInput.limit);
    
    // Execute query
    const snapshot = await query.get();
    
    // Convert documents to Product array
    const products: Product[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name || '',
        categoryId: data.categoryId || '',
        cost: data.cost || 0,
        suggestedPrice: data.suggestedPrice || 0,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    return {
      success: true,
      data: products,
    };
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      
      return {
        error: errorMessage,
        code: 'VALIDATION',
      };
    }
    
    // Handle Firestore and other errors
    console.error('list_products error:', error);
    return {
      error: 'Internal server error',
      code: 'INTERNAL',
    };
  }
}
