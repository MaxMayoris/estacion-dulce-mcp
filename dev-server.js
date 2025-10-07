const http = require('http');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import the MCP tools directly
const { listProducts } = require('./dist/src/tools/index.js');
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
          if (requestData.method === 'tools/call' && requestData.params?.name === 'list_products') {
            const result = await listProducts(requestData.params.arguments || {});
            
            const response = {
              jsonrpc: '2.0',
              id: requestData.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                  }
                ]
              }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Invalid request',
              message: 'Only list_products tool is supported'
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
