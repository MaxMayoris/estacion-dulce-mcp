/**
 * Recipe data structure matching Android app RecipeDTO
 * 
 * Based on: https://github.com/MaxMayoris/estacion-dulce-android
 */
export interface Recipe {
  id: string;
  name: string;
  cost: number;
  onSale: boolean;
  onSaleQuery: boolean;
  customizable: boolean;
  salePrice: number;
  suggestedPrice: number;
  profitPercentage: number;
  unit: number;
  images: string[];
  description: string;
  detail: string;
  categories: string[];
  sections: RecipeSection[];
  recipes: RecipeNested[];
}

/**
 * Recipe section structure
 */
export interface RecipeSection {
  id: string;
  name: string;
  products: RecipeProduct[];
}

/**
 * Recipe product structure
 */
export interface RecipeProduct {
  productId: string;
  quantity: number;
}

/**
 * Nested recipe structure
 */
export interface RecipeNested {
  recipeId: string;
  quantity: number;
}

/**
 * Recipe creation/update input (without id)
 */
export interface RecipeInput {
  name: string;
  cost: number;
  onSale: boolean;
  onSaleQuery: boolean;
  customizable: boolean;
  salePrice: number;
  suggestedPrice: number;
  profitPercentage: number;
  unit: number;
  images: string[];
  description: string;
  detail: string;
  categories: string[];
  sections: RecipeSection[];
  recipes: RecipeNested[];
}
