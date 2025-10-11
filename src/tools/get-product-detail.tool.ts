import { z } from 'zod';
import { getFirestore } from '../firebase.js';
import { Product } from '../models/dtos/product.dto.js';
import { Measure } from '../models/dtos/measure.dto.js';

/**
 * Get product detail with measure unit
 * Enriches product data by fetching related measure
 */
export async function getProductDetail(args: any): Promise<any> {
  const schema = z.object({
    productId: z.string().min(1, 'Product ID is required')
  });

  const { productId } = schema.parse(args);

  try {
    const db = getFirestore();

    // Fetch product
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      return { 
        text: `Product with ID "${productId}" not found`, 
        references: [] 
      };
    }

    const productData = productDoc.data() as Product;

    // Fetch measure if available
    let measureData: Measure | null = null;
    let measureUnit = 'units';
    
    if (productData.measure) {
      const measureDoc = await db.collection('measures').doc(productData.measure).get();
      if (measureDoc.exists) {
        measureData = {
          id: measureDoc.id,
          ...measureDoc.data()
        } as Measure;
        measureUnit = measureData.unit;
      }
    }

    // Build detailed product response
    let response = `${'='.repeat(60)}\n`;
    response += `📦 PRODUCT DETAILS\n`;
    response += `${'='.repeat(60)}\n\n`;
    
    // Basic info
    response += `🏷️  Name: ${productData.name}\n`;
    response += `🆔 ID: ${productDoc.id}\n`;
    
    // Stock info
    response += `\n📊 INVENTORY\n`;
    response += `${'-'.repeat(50)}\n`;
    response += `📦 Current Stock: ${productData.quantity} ${measureUnit}\n`;
    response += `⚠️  Minimum Stock: ${productData.minimumQuantity} ${measureUnit}\n`;
    
    const stockStatus = productData.quantity <= productData.minimumQuantity ? '🔴 LOW STOCK' : '✅ OK';
    const stockPercentage = productData.minimumQuantity > 0 
      ? ((productData.quantity / productData.minimumQuantity) * 100).toFixed(0)
      : 'N/A';
    
    response += `📈 Stock Status: ${stockStatus}`;
    if (stockPercentage !== 'N/A') {
      response += ` (${stockPercentage}% of minimum)`;
    }
    response += `\n`;
    
    // Pricing info
    response += `\n💰 PRICING\n`;
    response += `${'-'.repeat(50)}\n`;
    response += `💵 Cost per ${measureUnit}: $${productData.cost.toFixed(2)}\n`;
    response += `💰 Sale Price per ${measureUnit}: $${productData.salePrice.toFixed(2)}\n`;
    
    const profit = productData.salePrice - productData.cost;
    const profitPercentage = productData.cost > 0 
      ? ((profit / productData.cost) * 100).toFixed(2)
      : '0';
    
    response += `📈 Profit Margin: $${profit.toFixed(2)} per ${measureUnit} (${profitPercentage}%)\n`;
    
    // Total value
    response += `\n💎 INVENTORY VALUE\n`;
    response += `${'-'.repeat(50)}\n`;
    const totalCost = productData.cost * productData.quantity;
    const totalValue = productData.salePrice * productData.quantity;
    const totalProfit = totalValue - totalCost;
    
    response += `💵 Total Cost: $${totalCost.toFixed(2)}\n`;
    response += `💰 Total Sale Value: $${totalValue.toFixed(2)}\n`;
    response += `📈 Potential Profit: $${totalProfit.toFixed(2)}\n`;
    
    // Measure info
    if (measureData) {
      response += `\n📏 MEASURE UNIT\n`;
      response += `${'-'.repeat(50)}\n`;
      response += `📐 Unit: ${measureData.unit}\n`;
      response += `🏷️  Measure Name: ${measureData.name}\n`;
      response += `🆔 Measure ID: ${measureData.id}\n`;
    }
    
    response += `\n${'='.repeat(60)}\n`;

    return {
      text: response,
      references: [
        {
          uri: `mcp://estacion-dulce/products/${productDoc.id}`,
          title: `Product: ${productData.name}`,
          mimeType: 'application/json'
        }
      ]
    };

  } catch (error) {
    console.error('Error fetching product detail:', error);
    return { 
      text: `Error fetching product detail: ${(error as Error).message}`, 
      references: [] 
    };
  }
}
