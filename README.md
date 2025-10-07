# MCP Estación Dulce - Servidor Remoto

Servidor MCP (Model Context Protocol) para desplegar en Vercel Functions con integración a Firebase Firestore.

## 🚀 Quick Start

### Prerequisitos
- Node.js 20.x
- Cuenta de Vercel
- Proyecto Firebase con Firestore

### Instalación
```bash
npm install
```

### Variables de Entorno
Crea `.env.local` con:
```bash
MCP_API_KEY=tu-clave-api
ENV=DEV
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Desarrollo Local
```bash
# Compilar
npm run build

# Servidor local
node dev-server.js

# O con Vercel
npx vercel dev
```

### Deploy
```bash
# Desarrollo
npm run deploy

# Producción
npm run deploy:prod
```

## 🛠️ Herramientas Disponibles

### `list_products`
Lista productos con filtros opcionales.

**Parámetros:**
- `limit` (number, optional): Máximo de productos (1-50, default: 20)
- `categoryId` (string, optional): ID de categoría para filtrar

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Huevos",
      "quantity": 123,
      "minimumQuantity": 1,
      "cost": 4500,
      "salePrice": 0,
      "measure": "kg"
    }
  ]
}
```

## 🧪 Testing

### Con Postman
```
POST http://localhost:3000/api/server
Headers: 
  Content-Type: application/json
  Authorization: Bearer tu-api-key

Body:
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

## 🏗️ Arquitectura

```
src/
├── dtos/           # Interfaces de datos
├── services/       # Lógica de negocio
├── tools/          # Herramientas MCP
├── auth.ts         # Autenticación
├── firebase.ts     # Configuración Firebase
└── validation.ts   # Esquemas Zod
```

## 📋 Reglas de Desarrollo

Ver `.cursor/rules/develope-rules.mdc` para las reglas completas del proyecto.

### Principios Clave:
- **TypeScript strict mode**
- **Validación con Zod**
- **Autenticación por API Key**
- **Logs de auditoría**
- **No hardcoded secrets**

## 🔗 URLs

- **Local**: `http://localhost:3000/api/server`
- **Desarrollo**: `https://mcp-estacion-dulce-*.vercel.app/api/server`
- **Producción**: `https://mcp-estacion-dulce.vercel.app/api/server`

## 📝 Scripts

- `npm run build` - Compilar TypeScript
- `npm run dev` - Servidor de desarrollo
- `npm run deploy` - Deploy a desarrollo
- `npm run deploy:prod` - Deploy a producción
- `npm run type-check` - Verificar tipos
- `npm run clean` - Limpiar build

## 🔧 Tecnologías

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **Database**: Firebase Firestore
- **Deploy**: Vercel Functions
- **Validation**: Zod