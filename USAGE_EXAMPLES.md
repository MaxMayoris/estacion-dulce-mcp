# MCP Estación Dulce - Usage Examples

This document provides practical examples of how to use the MCP server for Estación Dulce.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your actual values
```

3. **Start development server:**
```bash
npm run dev
```

## API Examples

### 1. List Products

Get a list of products with optional category filter:

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_products",
      "arguments": {
        "limit": 10,
        "categoryId": "beverages"
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"data\": [\n    {\n      \"id\": \"coffee-001\",\n      \"name\": \"Premium Coffee\",\n      \"suggestedPrice\": 4.50,\n      \"categoryId\": \"beverages\"\n    }\n  ]\n}"
      }
    ]
  }
}
```

### 2. Get Product by ID

Retrieve a specific product:

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_product",
      "arguments": {
        "id": "coffee-001"
      }
    }
  }'
```

### 3. Update Product Price (Dry Run)

Preview price changes without applying them:

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "update_product_price",
      "arguments": {
        "id": "coffee-001",
        "newPrice": 5.25,
        "dryRun": true
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"data\": {\n    \"dryRun\": true,\n    \"intendedChanges\": {\n      \"id\": \"coffee-001\",\n      \"field\": \"suggestedPrice\",\n      \"oldValue\": 4.50,\n      \"newValue\": 5.25\n    }\n  }\n}"
      }
    ]
  }
}
```

### 4. Update Product Price (Production)

Apply price changes in production (requires confirm=true):

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "update_product_price",
      "arguments": {
        "id": "coffee-001",
        "newPrice": 5.25,
        "dryRun": false,
        "confirm": true
      }
    }
  }'
```

### 5. Recalculate Recipe Cost

Calculate the total cost of a recipe based on current product prices:

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "recalculate_recipe_cost",
      "arguments": {
        "recipeId": "latte-recipe-001",
        "dryRun": true
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"data\": {\n    \"recipeId\": \"latte-recipe-001\",\n    \"totalCost\": 3.25,\n    \"itemCosts\": [\n      {\n        \"productId\": \"coffee-001\",\n        \"quantity\": 1,\n        \"unitPrice\": 4.50,\n        \"itemCost\": 4.50\n      },\n      {\n        \"productId\": \"milk-001\",\n        \"quantity\": 0.5,\n        \"unitPrice\": 2.00,\n        \"itemCost\": 1.00\n      }\n    ],\n    \"dryRun\": true,\n    \"calculatedAt\": \"2024-01-15T10:30:00.000Z\"\n  }\n}"
      }
    ]
  }
}
```

### 6. Get Recipe

Retrieve a specific recipe:

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "get_recipe",
      "arguments": {
        "id": "latte-recipe-001"
      }
    }
  }'
```

## Error Handling

### Authentication Error

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_product",
      "arguments": {
        "id": "coffee-001"
      }
    }
  }'
```

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Valid API key required in Authorization header"
}
```

### Validation Error

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "update_product_price",
      "arguments": {
        "id": "coffee-001",
        "newPrice": -5.00
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"error\": \"Validation error\",\n  \"code\": \"VALIDATION\",\n  \"details\": \"newPrice: Price cannot be negative\"\n}"
      }
    ]
  }
}
```

### Not Found Error

```bash
curl -X POST http://localhost:3000/api/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_product",
      "arguments": {
        "id": "non-existent-product"
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": false,\n  \"error\": {\n    \"error\": \"Product not found\",\n    \"code\": \"NOT_FOUND\"\n  }\n}"
      }
    ]
  }
}
```

## Environment Variables

### Development (.env.local)
```bash
MCP_API_KEY=dev-api-key-123
ENV=DEV
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Production (Vercel Dashboard)
```bash
MCP_API_KEY=prod-secure-api-key-456
ENV=PROD
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Deployment

1. **Connect repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy:**
```bash
npm run deploy:prod
```

The production endpoint will be available at:
`https://your-project-name.vercel.app/api/server`

