import { Product } from '../dtos/product.dto';

/**
 * Compact product projection for products#index resource
 * Only essential fields for AI reasoning
 */
export interface ProductIndexProjection {
  id: string;
  name: string;
  categoryId?: string;
  price: number;
  stock: number;
}

/**
 * Convert Product DTO to compact index projection
 */
export function toProductIndexProjection(product: Product): ProductIndexProjection {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.measure, // Using measure as category placeholder
    price: product.salePrice || product.cost,
    stock: product.quantity
  };
}

/**
 * Sort products deterministically for stable ETags
 */
export function sortProductsForIndex(products: ProductIndexProjection[]): ProductIndexProjection[] {
  return products.sort((a, b) => a.id.localeCompare(b.id));
}
