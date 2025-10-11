import { z } from 'zod';
import { validateAuth, createAuthError } from '../src/auth.js';
import { validateEnvironment } from '../src/validation.js';
import { createErrorResponse, createHttpErrorResponse, ErrorCode } from '../src/errors/index.js';
import { listProducts, answerInventoryQuery, getClientOrders, getMovement, getKitchenOrders, getPersonDetails } from '../src/tools/index.js';
import { 
  RESOURCE_CATALOG,
  getProductsIndexResource,
  getRecipesIndexResource,
  getPersonsIndexResource,
  getMovementsLast30DResource,
  getVersionManifestResource
} from '../src/resources/index.js';

/**
 * Main MCP server handler for Estación Dulce
 * Handles MCP protocol over HTTP without SDK connection
 */
export default async function handler(req: any, res: any): Promise<void> {
  try {
    // Validate authentication
    if (!validateAuth(req)) {
      console.log('❌ Auth failed');
      const authError = createAuthError();
      res.status(authError.status).json(authError.body);
      return;
    }
    
    // Parse request body
    let body: any;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      body = req;
    }
    
    console.log(`📥 ${body.method} (id: ${body.id})`);

    // Handle MCP methods
    try {
      switch (body.method) {
        case 'initialize': {
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: 'mcp-estacion-dulce',
                version: '1.0.0'
              },
              capabilities: {
                resources: true,
                tools: true
              }
            }
          };
          
          res.status(200).json(response);
          console.log('✅ Initialize: Server capabilities sent');
          return;
        }

        case 'tools/list': {
          const tools = [
            {
              name: 'list_products',
              description: 'List inventory products',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number' },
                  categoryId: { type: 'string' }
                }
              }
            },
            {
              name: 'answer_inventory_query',
              description: 'Query inventory in natural language',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  limit: { type: 'number' }
                },
                required: ['query']
              }
            },
            {
              name: 'get_client_orders',
              description: 'Get client orders',
              inputSchema: {
                type: 'object',
                properties: {
                  clientId: { type: 'string' },
                  limit: { type: 'number' }
                },
                required: ['clientId']
              }
            },
            {
              name: 'get_movement',
              description: 'Get movement details',
              inputSchema: {
                type: 'object',
                properties: {
                  movementId: { type: 'string' }
                },
                required: ['movementId']
              }
            },
            {
              name: 'get_kitchen_orders',
              description: 'Get kitchen orders with filters',
              inputSchema: {
                type: 'object',
                properties: {
                  movementId: { type: 'string' },
                  status: { type: 'string' },
                  limit: { type: 'number' }
                }
              }
            },
            {
              name: 'get_person_details',
              description: 'Get person details with PII (audit logged)',
              inputSchema: {
                type: 'object',
                properties: {
                  personId: { type: 'string' },
                  purpose: { type: 'string' }
                },
                required: ['personId']
              }
            }
          ];
          
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: { tools }
          };
          res.status(200).json(response);
          console.log(`✅ Tools list: ${tools.length} tools available`);
          return;
        }

        case 'tools/call': {
          const toolName = body.params?.name;
          const args = body.params?.arguments || {};
          
          let result: any;
          
          // Validate tool exists before execution
          const validTools = ['list_products', 'answer_inventory_query', 'get_client_orders', 'get_movement', 'get_kitchen_orders', 'get_person_details'];
          
          if (!validTools.includes(toolName)) {
            const errorResponse = {
              jsonrpc: '2.0',
              id: body.id,
              error: {
                code: -32601, // Method not found
                message: `Unknown tool: ${toolName}`,
                data: {
                  validTools,
                  requestedTool: toolName
                }
              }
            };
            
            res.status(200).json(errorResponse);
            console.log(`❌ Tool call: Unknown tool "${toolName}"`);
            return;
          }
          
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
            case 'get_movement':
              result = await getMovement(args);
              break;
            case 'get_kitchen_orders':
              result = await getKitchenOrders(args);
              break;
            case 'get_person_details':
              result = await getPersonDetails(args);
              break;
            default:
              // This should never happen due to validation above
              throw new Error(`Unknown tool: ${toolName}`);
          }
          
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: {
              content: [{
                type: 'text',
                text: result.text || JSON.stringify(result, null, 2)
              }],
              ...(result.references && { references: result.references })
            }
          };
          
          res.status(200).json(response);
          console.log(`✅ Tool call: ${toolName} executed`);
          return;
        }

        case 'resources/list': {
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: { resources: RESOURCE_CATALOG }
          };
          res.status(200).json(response);
          console.log(`✅ Resources list: ${RESOURCE_CATALOG.length} resources available`);
          return;
        }

        case 'resources/read': {
          const uri = body.params?.uri;
          const ifNoneMatch = body.params?._meta?.ifNoneMatch;
          const ifModifiedSince = body.params?._meta?.ifModifiedSince;
          
          let resourceData: any;
          
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
              throw new Error(`Unknown resource: ${uri}`);
          }
          
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: resourceData
          };
          
          res.status(200).json(response);
          console.log(`✅ Resource read: ${uri.split('#')[0].split('/').pop()}`);
          return;
        }

        default:
          throw new Error(`Unknown method: ${body.method}`);
      }
    } catch (methodError) {
      console.error('❌ Method error:', methodError);
      
      // Return JSON-RPC error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32603,
          message: (methodError as Error).message || 'Internal error',
          data: {
            details: (methodError as Error).name
          }
        }
      };
      
      res.status(200).json(errorResponse);
      console.log(`❌ Method error: ${(methodError as Error).message}`);
      return;
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL,
      'Internal Server Error',
      error,
      req.url
    );
    
    res.status(500).json(errorResponse);
  }
}