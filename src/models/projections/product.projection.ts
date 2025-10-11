import { Product } from '../dtos/product.dto';

/**
 * Compact product projection for products#index resource
 * Only essential data - use get_product_detail tool for full details
 */
export interface ProductIndexProjection {
  id: string;
  name: string;
  quantity: number;
  minimumQuantity: number;
  cost: number;
  salePrice: number;
  isLowStock: boolean;
}

/**
 * Convert Product DTO to compact index projection
 */
export function toProductIndexProjection(product: Product): ProductIndexProjection {
  return {
    id: product.id,
    name: product.name,
    quantity: product.quantity,
    minimumQuantity: product.minimumQuantity,
    cost: product.cost,
    salePrice: product.salePrice,
    isLowStock: product.quantity <= product.minimumQuantity
  };
}

/**
 * Sort products deterministically for stable ETags
 */
export function sortProductsForIndex(products: ProductIndexProjection[]): ProductIndexProjection[] {
  return products.sort((a, b) => a.id.localeCompare(b.id));
}
