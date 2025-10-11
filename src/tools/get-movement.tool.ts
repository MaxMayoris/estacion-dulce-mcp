import { z } from 'zod';
import { getFirestore } from '../firebase.js';
import { Movement } from '../models/dtos/movement.dto.js';
import { Person } from '../models/dtos/person.dto.js';
import { Product } from '../models/dtos/product.dto.js';
import { Recipe } from '../models/dtos/recipe.dto.js';
import { Measure } from '../models/dtos/measure.dto.js';

/**
 * Get detailed movement data with enriched information
 * Fetches person, products/recipes with units, and delivery details
 */
export async function getMovement(args: any): Promise<any> {
  const schema = z.object({
    movementId: z.string().min(1, 'Movement ID is required')
  });

  const { movementId } = schema.parse(args);

  try {
    console.log(`🔍 Fetching movement detail: ${movementId}`);
    
    const db = getFirestore();
    
    // Get movement document
    const movementDoc = await db.collection('movements').doc(movementId).get();
    
    if (!movementDoc.exists) {
      return {
        text: `Movement with ID "${movementId}" not found`,
        references: []
      };
    }

    const movementData = movementDoc.data() as Movement;

    // Fetch person details
    let personName = 'Unknown';
    if (movementData.personId) {
      const personDoc = await db.collection('persons').doc(movementData.personId).get();
      if (personDoc.exists) {
        const personData = personDoc.data() as Person;
        personName = `${personData.name} ${personData.lastName}`.trim();
      }
    }

    // Collect product and recipe IDs from items
    const productIds = new Set<string>();
    const recipeIds = new Set<string>();
    
    movementData.items?.forEach(item => {
      if (item.collection === 'products') {
        productIds.add(item.collectionId);
      } else if (item.collection === 'recipes') {
        recipeIds.add(item.collectionId);
      }
    });

    // Fetch products in parallel
    const productPromises = Array.from(productIds).map(async (productId) => {
      const productDoc = await db.collection('products').doc(productId).get();
      if (productDoc.exists) {
        return { id: productDoc.id, ...productDoc.data() } as Product;
      }
      return null;
    });

    // Fetch recipes in parallel
    const recipePromises = Array.from(recipeIds).map(async (recipeId) => {
      const recipeDoc = await db.collection('recipes').doc(recipeId).get();
      if (recipeDoc.exists) {
        return { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
      }
      return null;
    });

    const [products, recipes] = await Promise.all([
      Promise.all(productPromises),
      Promise.all(recipePromises)
    ]);

    const validProducts = products.filter(p => p !== null) as Product[];
    const validRecipes = recipes.filter(r => r !== null) as Recipe[];

    // Fetch measures for products
    const measureIds = new Set<string>();
    validProducts.forEach(product => {
      if (product.measure) {
        measureIds.add(product.measure);
      }
    });

    const measurePromises = Array.from(measureIds).map(async (measureId) => {
      const measureDoc = await db.collection('measures').doc(measureId).get();
      if (measureDoc.exists) {
        return { id: measureDoc.id, ...measureDoc.data() } as Measure;
      }
      return null;
    });

    const measures = (await Promise.all(measurePromises)).filter(m => m !== null) as Measure[];

    // Create lookup maps
    const productMap = new Map(validProducts.map(p => [p.id, p]));
    const recipeMap = new Map(validRecipes.map(r => [r.id, r]));
    const measureMap = new Map(measures.map(m => [m.id, m]));

    // Build detailed response
    let response = `${'='.repeat(60)}\n`;
    response += `📋 MOVEMENT DETAILS\n`;
    response += `${'='.repeat(60)}\n\n`;

    // Basic info
    response += `🆔 ID: ${movementDoc.id}\n`;
    response += `📅 Date: ${new Date(movementData.movementDate).toLocaleString()}\n`;
    response += `🏷️  Type: ${movementData.type || 'Unknown'}\n`;
    response += `👤 Person: ${personName}\n`;
    response += `💰 Total Amount: $${movementData.totalAmount.toFixed(2)}\n`;
    
    if (movementData.detail) {
      response += `📝 Detail: ${movementData.detail}\n`;
    }
    
    if (movementData.kitchenOrderStatus) {
      response += `🍳 Kitchen Order Status: ${movementData.kitchenOrderStatus}\n`;
    }
    
    if (movementData.isStock !== undefined) {
      response += `📦 Affects Stock: ${movementData.isStock ? 'Yes' : 'No'}\n`;
    }
    
    if (movementData.appliedAt) {
      response += `✅ Applied At: ${new Date(movementData.appliedAt).toLocaleString()}\n`;
    }

    // Items section
    if (movementData.items && movementData.items.length > 0) {
      response += `\n${'='.repeat(60)}\n`;
      response += `📦 ITEMS (${movementData.items.length})\n`;
      response += `${'='.repeat(60)}\n\n`;

      movementData.items.forEach((item, index) => {
        response += `${index + 1}. `;
        
        if (item.collection === 'products') {
          const product = productMap.get(item.collectionId);
          if (product) {
            const measure = measureMap.get(product.measure);
            const unit = measure ? measure.unit : 'units';
            response += `📦 ${product.name}\n`;
            response += `   Quantity: ${item.quantity} ${unit}\n`;
          } else {
            response += `📦 Product ${item.collectionId}\n`;
            response += `   Quantity: ${item.quantity}\n`;
          }
        } else if (item.collection === 'recipes') {
          const recipe = recipeMap.get(item.collectionId);
          if (recipe) {
            response += `🍰 ${recipe.name}\n`;
            response += `   Quantity: ${item.quantity} units\n`;
          } else {
            response += `🍰 Recipe ${item.collectionId}\n`;
            response += `   Quantity: ${item.quantity}\n`;
          }
        } else {
          response += `${item.customName || 'Custom Item'}\n`;
          response += `   Quantity: ${item.quantity}\n`;
        }
        
        response += `   Cost: $${item.cost.toFixed(2)}\n`;
        response += `   Total: $${(item.cost * item.quantity).toFixed(2)}\n\n`;
      });
    }

    // Delivery section
    if (movementData.delivery) {
      response += `${'='.repeat(60)}\n`;
      response += `🚚 DELIVERY INFORMATION\n`;
      response += `${'='.repeat(60)}\n\n`;
      
      response += `📦 Type: ${movementData.delivery.type}\n`;
      response += `📅 Date: ${new Date(movementData.delivery.date).toLocaleString()}\n`;
      response += `📊 Status: ${movementData.delivery.status}\n`;
      
      if (movementData.delivery.shipment) {
        response += `\n📍 Shipment Details:\n`;
        response += `   Address: ${movementData.delivery.shipment.formattedAddress}\n`;
        response += `   Location: ${movementData.delivery.shipment.lat}, ${movementData.delivery.shipment.lng}\n`;
        response += `   Cost: $${movementData.delivery.shipment.cost.toFixed(2)}\n`;
        response += `   Calculated Cost: $${movementData.delivery.shipment.calculatedCost.toFixed(2)}\n`;
      }
      response += `\n`;
    }

    // Reference images
    if (movementData.referenceImages && movementData.referenceImages.length > 0) {
      response += `${'='.repeat(60)}\n`;
      response += `📸 REFERENCE IMAGES\n`;
      response += `${'='.repeat(60)}\n`;
      response += `${movementData.referenceImages.length} image(s) attached\n\n`;
    }

    response += `${'='.repeat(60)}\n`;

    return {
      text: response,
      references: [
        {
          uri: `mcp://estacion-dulce/movements/${movementDoc.id}`,
          title: `Movement ${movementDoc.id} - ${movementData.type}`,
          mimeType: 'application/json'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching movement detail:', error);
    return {
      text: `Error fetching movement detail: ${(error as Error).message}`,
      references: []
    };
  }
}
