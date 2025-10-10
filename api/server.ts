import { z } from 'zod';
import { validateAuth, createAuthError } from '../src/auth.js';
import { validateEnvironment } from '../src/validation.js';
import { createErrorResponse, createHttpErrorResponse, ErrorCode } from '../src/errors/index.js';
import { listProducts, answerInventoryQuery, getClientOrders } from '../src/tools/index.js';
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
async function handler(request: any): Promise<Response> {
  try {
    // Log incoming request
    console.log('📥 Incoming request:', {
      method: request.method,
      url: request.url,
      hasAuthHeader: !!(request.headers?.get ? request.headers.get('authorization') : request.headers?.authorization),
      bodyType: typeof request.body,
      hasBody: !!request.body
    });

    // Validate authentication
    if (!validateAuth(request)) {
      console.log('❌ Auth failed - returning 401');
      return createAuthError();
    }
    
    console.log('✅ Auth successful');
    
    // Validate environment
    const env = validateEnvironment();
    console.log(`MCP Server running in ${env} mode`);

    // Parse request body
    const body = request.body || request;
    console.log('📦 Request body:', { method: body.method, id: body.id });

    // Handle MCP methods
    try {
      switch (body.method) {
        case 'initialize': {
          console.log('🔧 Initialize request');
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
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        case 'tools/list': {
          console.log('🛠️ Tools list request');
          const tools = [
            {
              name: 'list_products',
              description: 'List products from inventory with optional filtering',
              inputSchema: {
                type: 'object',
                properties: {
                  limit: { type: 'number', description: 'Max products (1-50, default: 20)' },
                  categoryId: { type: 'string', description: 'Optional category filter' }
                }
              }
            },
            {
              name: 'answer_inventory_query',
              description: 'Answer natural language queries about inventory status',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Natural language query' },
                  limit: { type: 'number', description: 'Max products (default: 20)' }
                },
                required: ['query']
              }
            },
            {
              name: 'get_client_orders',
              description: 'Get orders for a specific client',
              inputSchema: {
                type: 'object',
                properties: {
                  clientId: { type: 'string', description: 'Client ID' },
                  limit: { type: 'number', description: 'Max orders (default: 10)' }
                },
                required: ['clientId']
              }
            }
          ];
          
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: { tools }
          };
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        case 'tools/call': {
          const toolName = body.params?.name;
          const args = body.params?.arguments || {};
          console.log(`🔧 Tool call: ${toolName}`, args);
          console.log(`🔍 Validating tool: ${toolName}`);
          
          let result: any;
          
          // Validate tool exists before execution
          const validTools = ['list_products', 'answer_inventory_query', 'get_client_orders'];
          console.log(`📋 Valid tools:`, validTools);
          console.log(`✅ Tool is valid:`, validTools.includes(toolName));
          
          if (!validTools.includes(toolName)) {
            console.error(`❌ Unknown tool requested: ${toolName}`);
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
            
            console.log('📤 Returning tool not found error:', JSON.stringify(errorResponse));
            console.log('🚀 About to return Response...');
            
            const response = new Response(JSON.stringify(errorResponse), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('✅ Response created, returning now');
            return response;
          }
          
          console.log(`✅ Tool validated, executing: ${toolName}`);
          
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
          
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        case 'resources/list': {
          console.log('📁 Resources list request');
          const response = {
            jsonrpc: '2.0',
            id: body.id,
            result: { resources: RESOURCE_CATALOG }
          };
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        case 'resources/read': {
          const uri = body.params?.uri;
          const ifNoneMatch = body.params?._meta?.ifNoneMatch;
          const ifModifiedSince = body.params?._meta?.ifModifiedSince;
          
          console.log(`📖 Resource read: ${uri}`, { ifNoneMatch, ifModifiedSince });
          
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
          
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
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
      
      console.log('📤 Returning error response:', errorResponse);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 200, // JSON-RPC errors use 200 with error object
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL,
      'Internal Server Error',
      error,
      request.url
    );
    
    return createHttpErrorResponse(errorResponse, 500);
  }
}

export default handler;