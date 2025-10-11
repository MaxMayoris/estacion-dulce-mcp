import { z } from 'zod';
import { getFirestore } from '../firebase.js';
import { Recipe } from '../models/dtos/recipe.dto.js';
import { Product } from '../models/dtos/product.dto.js';
import { Measure } from '../models/dtos/measure.dto.js';

/**
 * Get recipe detail with product names and measure units
 * Enriches recipe data by fetching related products and measures
 */
export async function getRecipeDetail(args: any): Promise<any> {
  const schema = z.object({
    recipeId: z.string().min(1, 'Recipe ID is required')
  });

  const { recipeId } = schema.parse(args);

  try {
    const db = getFirestore();

    // Fetch recipe
    const recipeDoc = await db.collection('recipes').doc(recipeId).get();
    if (!recipeDoc.exists) {
      return { 
        text: `Recipe with ID "${recipeId}" not found`, 
        references: [] 
      };
    }

    const recipeData = recipeDoc.data() as Recipe;

    // Collect all product IDs from sections
    const productIds = new Set<string>();
    recipeData.sections?.forEach(section => {
      section.products?.forEach(product => {
        productIds.add(product.productId);
      });
    });

    // Fetch all products in parallel
    const productPromises = Array.from(productIds).map(async (productId) => {
      const productDoc = await db.collection('products').doc(productId).get();
      if (productDoc.exists) {
        return {
          id: productDoc.id,
          ...productDoc.data()
        } as Product;
      }
      return null;
    });

    const products = (await Promise.all(productPromises)).filter(p => p !== null) as Product[];

    // Collect all measure IDs
    const measureIds = new Set<string>();
    products.forEach(product => {
      if (product.measure) {
        measureIds.add(product.measure);
      }
    });

    // Fetch all measures in parallel
    const measurePromises = Array.from(measureIds).map(async (measureId) => {
      const measureDoc = await db.collection('measures').doc(measureId).get();
      if (measureDoc.exists) {
        return {
          id: measureDoc.id,
          ...measureDoc.data()
        } as Measure;
      }
      return null;
    });

    const measures = (await Promise.all(measurePromises)).filter(m => m !== null) as Measure[];

    // Create lookup maps
    const productMap = new Map(products.map(p => [p.id, p]));
    const measureMap = new Map(measures.map(m => [m.id, m]));

    // Build enriched recipe response with ALL details
    let response = `${'='.repeat(60)}\n`;
    response += `📝 RECIPE DETAILS\n`;
    response += `${'='.repeat(60)}\n\n`;
    
    // Basic info
    response += `🏷️  Name: ${recipeData.name}\n`;
    response += `💰 Cost: $${recipeData.cost.toFixed(2)}\n`;
    response += `💵 Sale Price: $${recipeData.salePrice.toFixed(2)}\n`;
    response += `📊 Profit: ${recipeData.profitPercentage.toFixed(2)}%\n`;
    response += `🎯 Suggested Price: $${recipeData.suggestedPrice.toFixed(2)}\n`;
    response += `📦 Unit/Yield: ${recipeData.unit}\n`;
    response += `✅ On Sale: ${recipeData.onSale ? 'Yes' : 'No'}\n`;
    response += `🔍 Query Available: ${recipeData.onSaleQuery ? 'Yes' : 'No'}\n`;
    response += `🎨 Customizable: ${recipeData.customizable ? 'Yes' : 'No'}\n`;
    
    // Categories
    if (recipeData.categories && recipeData.categories.length > 0) {
      response += `🏷️  Categories: ${recipeData.categories.join(', ')}\n`;
    }
    
    // Images
    if (recipeData.images && recipeData.images.length > 0) {
      response += `📸 Images: ${recipeData.images.length} available\n`;
    }
    
    // Description and details
    if (recipeData.description) {
      response += `\n📄 Description:\n${recipeData.description}\n`;
    }
    
    if (recipeData.detail) {
      response += `\n📋 Details:\n${recipeData.detail}\n`;
    }
    
    response += `\n${'='.repeat(60)}\n`;
    response += `🥘 INGREDIENTS BY SECTION\n`;
    response += `${'='.repeat(60)}\n\n`;

    recipeData.sections?.forEach(section => {
      response += `📦 ${section.name}\n`;
      response += `${'-'.repeat(50)}\n`;
      
      let sectionCost = 0;
      
      section.products?.forEach(recipeProduct => {
        const product = productMap.get(recipeProduct.productId);
        if (product) {
          const measure = measureMap.get(product.measure);
          const unit = measure ? measure.unit : 'units';
          const itemCost = (product.cost || 0) * recipeProduct.quantity;
          sectionCost += itemCost;
          
          response += `  • ${product.name}: ${recipeProduct.quantity} ${unit}`;
          if (product.cost > 0) {
            response += ` ($${itemCost.toFixed(2)})`;
          }
          response += `\n`;
        } else {
          response += `  • Unknown product (${recipeProduct.productId}): ${recipeProduct.quantity}\n`;
        }
      });
      
      if (sectionCost > 0) {
        response += `${'-'.repeat(50)}\n`;
        response += `  💵 Section Cost: $${sectionCost.toFixed(2)}\n`;
      }
      
      response += `\n`;
    });

    // Handle nested recipes if any
    if (recipeData.recipes && recipeData.recipes.length > 0) {
      response += `\n${'='.repeat(60)}\n`;
      response += `🔗 NESTED RECIPES\n`;
      response += `${'='.repeat(60)}\n\n`;
      
      let nestedTotalCost = 0;
      
      for (const nestedRecipe of recipeData.recipes) {
        const nestedDoc = await db.collection('recipes').doc(nestedRecipe.recipeId).get();
        if (nestedDoc.exists) {
          const nestedData = nestedDoc.data();
          const nestedCost = (nestedData?.cost || 0) * nestedRecipe.quantity;
          nestedTotalCost += nestedCost;
          
          response += `  • ${nestedData?.name || nestedRecipe.recipeId}\n`;
          response += `    Quantity: ${nestedRecipe.quantity}x\n`;
          response += `    Cost per unit: $${(nestedData?.cost || 0).toFixed(2)}\n`;
          response += `    Total: $${nestedCost.toFixed(2)}\n\n`;
        }
      }
      
      if (nestedTotalCost > 0) {
        response += `${'-'.repeat(50)}\n`;
        response += `💵 Total Nested Recipes Cost: $${nestedTotalCost.toFixed(2)}\n`;
      }
    }
    
    // Summary
    response += `\n${'='.repeat(60)}\n`;
    response += `📊 COST SUMMARY\n`;
    response += `${'='.repeat(60)}\n`;
    response += `💰 Total Recipe Cost: $${recipeData.cost.toFixed(2)}\n`;
    response += `💵 Sale Price: $${recipeData.salePrice.toFixed(2)}\n`;
    response += `📈 Profit Margin: $${(recipeData.salePrice - recipeData.cost).toFixed(2)} (${recipeData.profitPercentage.toFixed(2)}%)\n`;
    response += `${'='.repeat(60)}\n`;

    return {
      text: response,
      references: [
        {
          uri: `mcp://estacion-dulce/recipes/${recipeId}`,
          title: `Recipe: ${recipeData.name}`,
          mimeType: 'application/json'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching recipe detail:', error);
    return { 
      text: `Error fetching recipe detail: ${(error as Error).message}`, 
      references: [] 
    };
  }
}
