/**
 * Category data structure matching Android app Category DTO
 * 
 * Based on: https://github.com/MaxMayoris/estacion-dulce-android
 */
export interface Category {
  id: string;
  name: string;
}

/**
 * Category creation/update input (without id)
 */
export interface CategoryInput {
  name: string;
}
