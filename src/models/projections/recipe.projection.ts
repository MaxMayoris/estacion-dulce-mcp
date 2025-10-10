import { Recipe } from '../dtos/recipe.dto';

/**
 * Compact recipe projection for recipes#index resource
 */
export interface RecipeIndexProjection {
  id: string;
  name: string;
  yield: number;
  baseCost: number;
  updatedAt: string;
}

/**
 * Convert Recipe DTO to compact index projection
 */
export function toRecipeIndexProjection(recipe: Recipe): RecipeIndexProjection {
  return {
    id: recipe.id,
    name: recipe.name,
    yield: recipe.unit,
    baseCost: recipe.cost,
    updatedAt: new Date().toISOString() // Would come from Firestore timestamp
  };
}

/**
 * Sort recipes deterministically for stable ETags
 */
export function sortRecipesForIndex(recipes: RecipeIndexProjection[]): RecipeIndexProjection[] {
  return recipes.sort((a, b) => a.id.localeCompare(b.id));
}
