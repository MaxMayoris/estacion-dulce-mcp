import { Recipe } from '../dtos/recipe.dto';

/**
 * Compact recipe projection for recipes#index resource
 * Only essential data - use get_recipe_detail tool for full details
 */
export interface RecipeIndexProjection {
  id: string;
  name: string;
  cost: number;
  salePrice: number;
  onSale: boolean;
  unit: number;
  profitPercentage: number;
  hasImages: boolean;
  categories: string[];
}

/**
 * Convert Recipe DTO to compact index projection
 */
export function toRecipeIndexProjection(recipe: Recipe): RecipeIndexProjection {
  return {
    id: recipe.id,
    name: recipe.name,
    cost: recipe.cost,
    salePrice: recipe.salePrice,
    onSale: recipe.onSale,
    unit: recipe.unit,
    profitPercentage: recipe.profitPercentage,
    hasImages: recipe.images && recipe.images.length > 0,
    categories: recipe.categories || []
  };
}

/**
 * Sort recipes deterministically for stable ETags
 */
export function sortRecipesForIndex(recipes: RecipeIndexProjection[]): RecipeIndexProjection[] {
  return recipes.sort((a, b) => a.id.localeCompare(b.id));
}
