# MCP Estación Dulce - Servidor Remoto

Servidor MCP (Model Context Protocol) para desplegar en Vercel Functions con integración a Firebase Firestore.

## Project Context

This repository hosts a remote MCP server deployed on Vercel Functions (Node runtime, not Edge).

Language: TypeScript targeting Node 20.

Core libs: @modelcontextprotocol/sdk, firebase-admin, zod.

Primary endpoint: /api/server exposing MCP tools (HTTP/SSE).

Backend data store: Firestore via firebase-admin with service account credentials loaded from environment variables.

Goal: read/write limited Firestore collections for Estación Dulce (e.g., products, recipes, categories) with strict validation and safety.

## Code Style

All code, identifiers, comments, and docs must be in English.

Use TypeScript strict mode and clear types; prefer unknown over any.

Prefer small, composable modules and pure functions where possible.

No unnecessary comments.

Write JSDoc for exported functions, tool handlers, and public utilities (purpose, params, returns, errors).

Use inline comments only when essential for clarity.

Keep imports minimal and sorted. Avoid dead code.

Return structured objects with clear shapes; do not throw for expected validation errors.

## Security & Secrets

Never hardcode secrets. Always read from environment variables.

Enforce an API key check via the Authorization: Bearer header (MCP_API_KEY). Reject missing/invalid keys with 401.

Use an allowlist for writable collections and fields. Never accept arbitrary collection/field names from inputs.

In PROD, write operations must require confirm: true. Prefer dryRun: true by default for sensitive mutations.

Log all mutations to an audit collection (e.g., mcp_audit): who/what/when/input/result, avoiding storing secrets.

## Validation & Errors

Validate every tool input with zod. Reject on invalid input with a concise, user-friendly message.

Coerce/round numeric fields when needed (e.g., prices to 2 decimals).

For business constraints (e.g., max price), return a structured error { error: string, code?: string }.

Do not leak internal stack traces. Convert internal errors to safe messages and log full details server-side.

## Firestore Access Policy

Collections: products, recipes, categories (extend only with explicit approval).

Read tools can fetch by id or list with safe pagination/limits.

Write tools:

Only update allowed fields (e.g., products.suggestedPrice, not arbitrary paths).

Must enforce ENV check (DEV vs PROD).

Round currency to 2 decimals. Use server timestamps for updatedAt.

Avoid N+1 reads. Batch or aggregate when needed.

## Endpoint & Runtime

Single MCP entrypoint at /api/server using Vercel Functions (Node 20).

Do not use Edge runtime. firebase-admin requires Node.

Stream responses when the MCP SDK supports it, otherwise return compact JSON.

## Tool Catalog (MVP)

Read

get_product(id: string)

get_recipe(id: string)

list_products(limit: number, categoryId?: string)

Write

update_product_price(id: string, newPrice: number, confirm?: boolean, dryRun?: boolean)

(Optional) recalculate_recipe_cost(recipeId: string, dryRun?: boolean) — reads nested items and returns the computed cost; only writes if not dryRun and confirm in PROD.

Each tool: concise description, strict zod schema, safe return shape, and JSDoc.

## Logging & Observability

Log request metadata (tool name, caller id if available, environment) and duration.

Send write logs to mcp_audit. Never log secrets.

Prefer structured logs (JSON).

## Environment Variables

FIREBASE_SERVICE_ACCOUNT_JSON (one-line JSON content)

MCP_API_KEY

ENV ∈ { DEV, PROD }

Document local usage with vercel dev and production setup in Vercel settings.

## Testing & Local Dev

Provide a short README section explaining:

How to run vercel dev.

How to call the MCP endpoint locally with the Authorization header.

A dry-run example for write tools.

Add minimal sample data or fixtures only for local dev; do not commit secrets.

## Performance

Enforce sensible limits for list operations (e.g., default limit <= 50).

Prefer indexed queries; avoid client-side filtering over large sets.

Consider batching for multiple reads/writes.

## Git & CI

Do not commit service account files; .gitignore must exclude secrets.

Keep PRs small and self-contained. Require that new tools include:

Input/output zod schemas,

JSDoc,

Negative-path tests or examples (invalid inputs),

Audit coverage for writes.

## Output & UX

Tool responses must be terse, structured, and deterministic.

Include dryRun outputs detailing intended changes (no side effects).

For errors, prefer: { error: "message", code?: "VALIDATION|AUTH|NOT_FOUND|BUSINESS" }.

## Non-Goals

No client SDK for mobile/web in this repo (optional later).

No direct public endpoints besides /api/server.

No schema-less writes or dynamic collection access.

## Características

- ✅ Servidor MCP remoto usando `@modelcontextprotocol/sdk`
- ✅ Runtime Node.js 20 (requerido por firebase-admin)
- ✅ Autenticación por API Key via header `Authorization: Bearer`
- ✅ Integración con Firebase Firestore
- ✅ Validación de datos con Zod
- ✅ TypeScript con configuración estricta
- ✅ Sistema de auditoría para operaciones de escritura
- ✅ Allowlist de colecciones y campos permitidos
- ✅ Verificación de entorno DEV/PROD

## Instalación

```bash
npm install
```

**Nota:** El proyecto usa las versiones más recientes de las dependencias principales:
- `@modelcontextprotocol/sdk`: ^1.19.1 (última versión estable)
- `firebase-admin`: ^13.5.0 (última versión estable)
- `zod`: ^3.23.8 (versión 3.x estable, evitando breaking changes de v4)
- `typescript`: ^5.9.3 (última versión estable)
- `vercel`: ^48.2.2 (última versión con vulnerabilidades resueltas)

Las vulnerabilidades reportadas por `npm audit` están en dependencias de desarrollo de Vercel y no afectan el runtime del servidor en producción.

## Variables de Entorno

Crea un archivo `.env.local` basado en `env.example`:

```bash
cp env.example .env.local
```

Configura las siguientes variables:

- `MCP_API_KEY`: Clave API para autenticación
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo de la service account de Firebase

## Scripts Disponibles

```bash
# Desarrollo local
npm run dev

# Build del proyecto
npm run build

# Deploy a Vercel
npm run deploy

# Deploy a producción
npm run deploy:prod

# Type checking
npm run type-check

# Limpiar dist
npm run clean
```

## Available Tools

### `list_products`

Read-only tool that lists products from Estación Dulce with optional category filtering.

**Parameters:**
- `limit` (number, optional): Maximum number of products to return (1-50, default: 20)
- `categoryId` (string, optional): Optional category ID to filter by exact match

**Returns:**
Array of products with fields: `id`, `name`, `categoryId`, `cost`, `suggestedPrice`, `updatedAt`

**Error Codes:**
- `VALIDATION`: Input validation failed
- `INTERNAL`: Firestore or server error

## Testing list_products

### Required Environment Variables

Set up your `.env.local` file with:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
MCP_API_KEY=your-secure-api-key
ENV=DEV
```

### Running the Development Server

```bash
npm run dev
```

The MCP endpoint will be available at `http://localhost:3000/api/server`

### Calling the MCP Endpoint

As an MCP host, you can call the `list_products` tool using the MCP protocol. The request structure is:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_products",
    "arguments": {
      "limit": 10
    }
  }
}
```

**Example Inputs:**

1. **Default limit (20 products):**
```json
{
  "name": "list_products",
  "arguments": {}
}
```

2. **Custom limit:**
```json
{
  "name": "list_products", 
  "arguments": {
    "limit": 10
  }
}
```

3. **With category filter:**
```json
{
  "name": "list_products",
  "arguments": {
    "limit": 5,
    "categoryId": "cakes"
  }
}
```

### Expected Response Shape

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Premium Coffee",
      "categoryId": "beverages", 
      "cost": 2.50,
      "suggestedPrice": 4.50,
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "limit: Number must be less than or equal to 50",
  "code": "VALIDATION"
}
```

**Empty Result:**
```json
{
  "success": true,
  "data": []
}
```

## Local Development

### Running with Vercel Dev

```bash
npm run dev
```

The endpoint will be available at `http://localhost:3000/api/server`

### Calling the MCP Endpoint

Include the Authorization header in all requests:

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
        "id": "product-123"
      }
    }
  }'
```

### Dry-Run Example for Write Tools

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
        "id": "product-123",
        "newPrice": 25.99,
        "dryRun": true
      }
    }
  }'
```

### Production Endpoint

Deploy to Vercel and access at: `https://your-project.vercel.app/api/server`

### Authentication

All requests must include the Authorization header:

```
Authorization: Bearer your-api-key
```

### Example Request

```json
{
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
}
```

## Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Ejecuta `npm run deploy:prod`

## Estructura del Proyecto

```
├── api/
│   └── server.ts          # Endpoint principal MCP
├── src/
│   ├── auth.ts           # Validación de autenticación
│   └── firebase.ts       # Configuración Firebase
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```
