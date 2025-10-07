/**
 * Product data structure matching Android app ProductDTO
 * 
 * Based on: https://github.com/MaxMayoris/estacion-dulce-android/blob/main/app/src/main/java/com/estaciondulce/app/models/dtos/ProductDTO.kt
 */
export interface Product {
  id: string;
  name: string;
  quantity: number;
  minimumQuantity: number;
  cost: number;
  salePrice: number;
  measure: string;
}

/**
 * Product creation/update input (without id)
 */
export interface ProductInput {
  name: string;
  quantity: number;
  minimumQuantity: number;
  cost: number;
  salePrice: number;
  measure: string;
}
