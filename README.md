# MCP Estación Dulce

Remote MCP server for Estación Dulce bakery management system.

## Quick Start

### Installation
```bash
npm install
```

### Environment Variables
```bash
MCP_API_KEY=your-api-key
ENV=DEV
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Development
```bash
npm run build
node dev-server.js
```

### Deploy
```bash
npm run deploy        # Preview
npm run deploy:prod   # Production
```

## API Endpoint

**Local:** `http://localhost:3000/api/server`  
**Production:** `https://mcp-estacion-dulce.vercel.app/api/server`

## Authentication

All requests require:
```
Authorization: Bearer your-api-key
```

## MCP Protocol

### Tools
- `list_products` - List products with filters
- `answer_inventory_query` - Natural language inventory queries
- `get_client_orders` - Get client orders

### Resources
- `mcp://estacion-dulce/products#index` - Products index
- `mcp://estacion-dulce/recipes#index` - Recipes index
- `mcp://estacion-dulce/persons#index` - Persons index (no PII)
- `mcp://estacion-dulce/movements#last-30d` - Movements aggregated
- `mcp://estacion-dulce/version-manifest` - Cache manifest

## Example Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_products",
    "arguments": {"limit": 10}
  }
}
```

## Development Rules

See `.cursor/rules/develope-rules.mdc` for complete project guidelines.

## Tech Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **Database**: Firebase Firestore
- **Deploy**: Vercel Functions (São Paulo region)
- **Validation**: Zod