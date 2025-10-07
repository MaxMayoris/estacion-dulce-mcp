import { getFirestore } from '../firebase';
import { Product, ApiResponse } from '../dtos';

/**
 * Product service for Firestore operations
 */
export class ProductService {
  private readonly collectionName = 'products';

  /**
   * List products with optional filtering
   */
  async listProducts(limit: number = 20, categoryId?: string): Promise<ApiResponse<Product[]>> {
    try {
      const db = getFirestore();
      let query: any = db.collection(this.collectionName);
      
      // Apply category filter if provided
      if (categoryId) {
        query = query.where('categoryId', '==', categoryId);
      }
      
      // Apply limit
      query = query.limit(limit);
      
      // Execute query
      const snapshot = await query.get();
      
      // Convert documents to Product array
      const products: Product[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || '',
          quantity: data.quantity || 0.0,
          minimumQuantity: data.minimumQuantity || 0.0,
          cost: data.cost || 0.0,
          salePrice: data.salePrice || 0.0,
          measure: data.measure || '',
        });
      });
      
      return {
        success: true,
        data: products,
      };
    } catch (error) {
      console.error('ProductService.listProducts error:', error);
      return {
        error: 'Internal server error',
        code: 'INTERNAL',
        details: (error as Error).message || 'Unknown error'
      };
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const db = getFirestore();
      const doc = await db.collection(this.collectionName).doc(id).get();
      
      if (!doc.exists) {
        return {
          error: 'Product not found',
          code: 'NOT_FOUND'
        };
      }
      
      const data = doc.data();
      const product: Product = {
        id: doc.id,
        name: data?.name || '',
        quantity: data?.quantity || 0.0,
        minimumQuantity: data?.minimumQuantity || 0.0,
        cost: data?.cost || 0.0,
        salePrice: data?.salePrice || 0.0,
        measure: data?.measure || '',
      };
      
      return {
        success: true,
        data: product,
      };
    } catch (error) {
      console.error('ProductService.getProduct error:', error);
      return {
        error: 'Internal server error',
        code: 'INTERNAL',
        details: (error as Error).message || 'Unknown error'
      };
    }
  }
}
