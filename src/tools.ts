import { z } from 'zod';
import { getFirestore } from './firebase.js';
import { validateCollection, validateField, validatePrice, createErrorResponse } from './validation.js';
import { logAudit, createSuccessAudit, createErrorAudit } from './audit.js';
import { ALLOWED_FIELDS } from './constants.js';

/**
 * Gets a product by ID
 * @param id - Product ID
 * @returns Product data or error
 */
export async function getProduct(id: string): Promise<{ success: boolean; data?: unknown; error?: { error: string; code: string } }> {
  const startTime = Date.now();
  
  try {
    validateCollection('products');
    
    const db = getFirestore();
    const doc = await db.collection('products').doc(id).get();
    
    if (!doc.exists) {
      const error = createErrorResponse('Product not found', 'NOT_FOUND');
      await logAudit(createErrorAudit('get_product', { id }, error.error, 'NOT_FOUND', Date.now() - startTime));
      return { success: false, error };
    }
    
    const data = { id: doc.id, ...doc.data() };
    await logAudit(createSuccessAudit('get_product', { id }, Date.now() - startTime));
    
    return { success: true, data };
  } catch (error) {
    const errorResponse = createErrorResponse((error as Error).message || 'Internal error', 'VALIDATION');
    await logAudit(createErrorAudit('get_product', { id }, errorResponse.error, 'VALIDATION', Date.now() - startTime));
    return { success: false, error: errorResponse };
  }
}

/**
 * Gets a recipe by ID
 * @param id - Recipe ID
 * @returns Recipe data or error
 */
export async function getRecipe(id: string): Promise<{ success: boolean; data?: unknown; error?: { error: string; code: string } }> {
  const startTime = Date.now();
  
  try {
    validateCollection('recipes');
    
    const db = getFirestore();
    const doc = await db.collection('recipes').doc(id).get();
    
    if (!doc.exists) {
      const error = createErrorResponse('Recipe not found', 'NOT_FOUND');
      await logAudit(createErrorAudit('get_recipe', { id }, error.error, 'NOT_FOUND', Date.now() - startTime));
      return { success: false, error };
    }
    
    const data = { id: doc.id, ...doc.data() };
    await logAudit(createSuccessAudit('get_recipe', { id }, Date.now() - startTime));
    
    return { success: true, data };
  } catch (error) {
    const errorResponse = createErrorResponse((error as Error).message || 'Internal error', 'VALIDATION');
    await logAudit(createErrorAudit('get_recipe', { id }, errorResponse.error, 'VALIDATION', Date.now() - startTime));
    return { success: false, error: errorResponse };
  }
}

/**
 * Lists products with optional category filter
 * @param limit - Maximum number of products to return
 * @param categoryId - Optional category ID filter
 * @returns List of products or error
 */
export async function listProducts(limit: number, categoryId?: string): Promise<{ success: boolean; data?: unknown; error?: { error: string; code: string } }> {
  const startTime = Date.now();
  
  try {
    validateCollection('products');
    
    const db = getFirestore();
    let query = db.collection('products').limit(limit);
    
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }
    
    const snapshot = await query.get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    await logAudit(createSuccessAudit('list_products', { limit, categoryId }, Date.now() - startTime));
    
    return { success: true, data: products };
  } catch (error) {
    const errorResponse = createErrorResponse((error as Error).message || 'Internal error', 'VALIDATION');
    await logAudit(createErrorAudit('list_products', { limit, categoryId }, errorResponse.error, 'VALIDATION', Date.now() - startTime));
    return { success: false, error: errorResponse };
  }
}

/**
 * Updates product price with validation and audit logging
 * @param id - Product ID
 * @param newPrice - New price value
 * @param confirm - Confirmation flag for PROD
 * @param dryRun - Whether to perform a dry run
 * @returns Update result or error
 */
export async function updateProductPrice(
  id: string, 
  newPrice: number, 
  confirm = false, 
  dryRun = true
): Promise<{ success: boolean; data?: unknown; error?: { error: string; code: string } }> {
  const startTime = Date.now();
  
  try {
    validateCollection('products', true);
    validateField('products', 'suggestedPrice');
    
    const validatedPrice = validatePrice(newPrice);
    
    const db = getFirestore();
    
    // Check if product exists
    const productDoc = await db.collection('products').doc(id).get();
    if (!productDoc.exists) {
      const error = createErrorResponse('Product not found', 'NOT_FOUND');
      await logAudit(createErrorAudit('update_product_price', { id, newPrice, confirm, dryRun }, error.error, 'NOT_FOUND', Date.now() - startTime));
      return { success: false, error };
    }
    
    const currentPrice = productDoc.data()?.suggestedPrice;
    const updateData = {
      suggestedPrice: validatedPrice,
      updatedAt: new Date().toISOString(),
    };
    
    if (dryRun) {
      const result = {
        dryRun: true,
        intendedChanges: {
          id,
          field: 'suggestedPrice',
          oldValue: currentPrice,
          newValue: validatedPrice,
        },
      };
      
      await logAudit(createSuccessAudit('update_product_price', { id, newPrice, confirm, dryRun }, Date.now() - startTime));
      return { success: true, data: result };
    }
    
    // Perform actual update
    await db.collection('products').doc(id).update(updateData);
    
    const result = {
      id,
      field: 'suggestedPrice',
      oldValue: currentPrice,
      newValue: validatedPrice,
      updatedAt: updateData.updatedAt,
    };
    
    await logAudit(createSuccessAudit('update_product_price', { id, newPrice, confirm, dryRun }, Date.now() - startTime));
    
    return { success: true, data: result };
  } catch (error) {
    const errorResponse = createErrorResponse((error as Error).message || 'Internal error', 'VALIDATION');
    await logAudit(createErrorAudit('update_product_price', { id, newPrice, confirm, dryRun }, errorResponse.error, 'VALIDATION', Date.now() - startTime));
    return { success: false, error: errorResponse };
  }
}

/**
 * Recalculates recipe cost by reading nested items
 * @param recipeId - Recipe ID
 * @param dryRun - Whether to perform a dry run
 * @returns Calculated cost or error
 */
export async function recalculateRecipeCost(
  recipeId: string, 
  dryRun = true
): Promise<{ success: boolean; data?: unknown; error?: { error: string; code: string } }> {
  const startTime = Date.now();
  
  try {
    validateCollection('recipes');
    
    const db = getFirestore();
    
    // Get recipe
    const recipeDoc = await db.collection('recipes').doc(recipeId).get();
    if (!recipeDoc.exists) {
      const error = createErrorResponse('Recipe not found', 'NOT_FOUND');
      await logAudit(createErrorAudit('recalculate_recipe_cost', { recipeId, dryRun }, error.error, 'NOT_FOUND', Date.now() - startTime));
      return { success: false, error };
    }
    
    const recipe = recipeDoc.data();
    const items = recipe?.items || [];
    
    if (!Array.isArray(items) || items.length === 0) {
      const error = createErrorResponse('Recipe has no items to calculate cost', 'BUSINESS');
      await logAudit(createErrorAudit('recalculate_recipe_cost', { recipeId, dryRun }, error.error, 'BUSINESS', Date.now() - startTime));
      return { success: false, error };
    }
    
    // Batch read all product prices
    const productIds = items.map((item: any) => item.productId).filter(Boolean);
    const productPromises = productIds.map((productId: string) => 
      db.collection('products').doc(productId).get()
    );
    
    const productDocs = await Promise.all(productPromises);
    const productPrices = new Map();
    
    productDocs.forEach((doc, index) => {
      if (doc.exists) {
        const product = doc.data();
        productPrices.set(productIds[index], product?.suggestedPrice || 0);
      }
    });
    
    // Calculate total cost
    let totalCost = 0;
    const itemCosts = items.map((item: any) => {
      const price = productPrices.get(item.productId) || 0;
      const itemCost = price * (item.quantity || 0);
      totalCost += itemCost;
      return {
        productId: item.productId,
        quantity: item.quantity || 0,
        unitPrice: price,
        itemCost,
      };
    });
    
    const result = {
      recipeId,
      totalCost: Math.round(totalCost * 100) / 100,
      itemCosts,
      dryRun,
      calculatedAt: new Date().toISOString(),
    };
    
    await logAudit(createSuccessAudit('recalculate_recipe_cost', { recipeId, dryRun }, Date.now() - startTime));
    
    return { success: true, data: result };
  } catch (error) {
    const errorResponse = createErrorResponse((error as Error).message || 'Internal error', 'VALIDATION');
    await logAudit(createErrorAudit('recalculate_recipe_cost', { recipeId, dryRun }, errorResponse.error, 'VALIDATION', Date.now() - startTime));
    return { success: false, error: errorResponse };
  }
}

