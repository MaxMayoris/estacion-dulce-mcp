const http = require('http');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import the MCP tools and resources
const { listProducts, answerInventoryQuery, getClientOrders } = require('./dist/src/tools/index.js');
const { 
  RESOURCE_CATALOG,
  getProductsIndexResource,
  getRecipesIndexResource,
  getPersonsIndexResource,
  getMovementsLast30DResource,
  getVersionManifestResource
} = require('./dist/src/resources/index.js');
const { validateAuth, createAuthError } = require('./dist/src/auth.js');
const { validateEnvironment } = require('./dist/src/validation.js');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle POST requests to /api/server
  if (req.method === 'POST' && req.url === '/api/server') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          // Validate authentication
          if (!validateAuth({ headers: req.headers })) {
            const errorResponse = createAuthError();
            res.writeHead(errorResponse.status, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
              error: 'Unauthorized',
              message: 'Valid API key required in Authorization header'
            }));
            return;
          }

          // Parse request body
          const requestData = JSON.parse(body);
          
          // Handle MCP requests
          let result;
          
          if (requestData.method === 'tools/call') {
            const toolName = requestData.params?.name;
            const args = requestData.params?.arguments || {};
            
            switch (toolName) {
              case 'list_products':
                result = await listProducts(args);
                break;
              case 'answer_inventory_query':
                result = await answerInventoryQuery(args);
                break;
              case 'get_client_orders':
                result = await getClientOrders(args);
                break;
              default:
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Unknown tool',
                  message: `Tool ${toolName} not found`
                }));
                return;
            }
            
            const response = {
              jsonrpc: '2.0',
              id: requestData.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: result.text || JSON.stringify(result, null, 2)
                  }
                ],
                ...(result.references && { references: result.references })
              }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } else if (requestData.method === 'resources/list') {
            const response = {
              jsonrpc: '2.0',
              id: requestData.id,
              result: {
                resources: RESOURCE_CATALOG
              }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } else if (requestData.method === 'resources/read') {
            const uri = requestData.params?.uri;
            const ifNoneMatch = req.headers['if-none-match'];
            const ifModifiedSince = req.headers['if-modified-since'];
            
            let resourceData;
            
            switch (uri) {
              case 'mcp://estacion-dulce/products#index':
                resourceData = await getProductsIndexResource({ ifNoneMatch, ifModifiedSince });
                break;
              case 'mcp://estacion-dulce/recipes#index':
                resourceData = await getRecipesIndexResource({ ifNoneMatch, ifModifiedSince });
                break;
              case 'mcp://estacion-dulce/persons#index':
                resourceData = await getPersonsIndexResource({ ifNoneMatch, ifModifiedSince });
                break;
              case 'mcp://estacion-dulce/movements#last-30d':
                resourceData = await getMovementsLast30DResource({ ifNoneMatch, ifModifiedSince });
                break;
              case 'mcp://estacion-dulce/version-manifest':
                resourceData = await getVersionManifestResource();
                break;
              default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Resource not found',
                  message: `Resource ${uri} not found`
                }));
                return;
            }
            
            const response = {
              jsonrpc: '2.0',
              id: requestData.id,
              result: resourceData
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Invalid request',
              message: 'Unsupported method'
            }));
          }
        } catch (error) {
          console.error('Handler error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
        }
      });
    } catch (error) {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: req.url, method: req.method }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 MCP Server running on http://localhost:${PORT}`);
});
