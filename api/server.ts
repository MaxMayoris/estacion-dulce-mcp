import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  InitializeRequestSchema,
  Tool,
  Resource,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { validateAuth, createAuthError } from '../src/auth.js';
import { validateEnvironment } from '../src/validation.js';
import { listProducts, answerInventoryQuery, getClientOrders } from '../src/tools/index.js';
import { 
  RESOURCE_CATALOG,
  getProductsIndexResource,
  getRecipesIndexResource,
  getPersonsIndexResource,
  getMovementsLast30DResource,
  getVersionManifestResource
} from '../src/resources/index.js';

// Tools catalog
const tools: Tool[] = [
  {
    name: 'list_products',
    description: 'List products from inventory with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max products (1-50, default: 20)' },
        categoryId: { type: 'string', description: 'Optional category filter' }
      },
      required: []
    }
  },
  {
    name: 'answer_inventory_query',
    description: 'Answer natural language queries about inventory status',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query about inventory' },
        limit: { type: 'number', description: 'Max products to analyze (default: 20)' }
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

// Resources catalog
const resources: Resource[] = RESOURCE_CATALOG.map(r => ({
  uri: r.uri,
  name: r.name,
  description: r.description,
  mimeType: r.mimeType
}));

/**
 * Main MCP server handler for Estación Dulce
 * @param request - HTTP request object
 * @returns HTTP response with MCP protocol data
 */
async function handler(request: Request): Promise<Response> {
  // Log incoming request
  console.log('📥 Incoming request:', {
    method: request.method,
    url: request.url,
    hasAuthHeader: !!request.headers.get('authorization')
  });

  // Validate authentication
  if (!validateAuth(request)) {
    console.log('❌ Auth failed - returning 401');
    return createAuthError();
  }
  
  console.log('✅ Auth successful');

  try {
    // Validate environment
    const env = validateEnvironment();

    // Create MCP server
    const server = new Server(
      {
        name: 'mcp-estacion-dulce',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Store client info for logging
    let clientInfo: any = null;

    // Handle initialize
    server.setRequestHandler(InitializeRequestSchema, async (request) => {
      clientInfo = request.params.clientInfo;
      console.log('Client connected:', clientInfo?.name || 'Unknown');
      
      return {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'mcp-estacion-dulce',
          version: '1.0.0'
        },
        capabilities: {
          resources: true,
          tools: true
        }
      };
    });

    // Handle tools/list
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Handle tools/call
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      try {
        let result: any;
        
        switch (name) {
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
            throw new Error(`Unknown tool: ${name}`);
        }
        
        const duration = Date.now() - startTime;
        console.log(`Tool ${name} executed in ${duration}ms`);
        
        // Format response based on result type
        if (result.text) {
          // Natural language response with optional references
          return {
            content: [
              {
                type: 'text',
                text: result.text
              } as TextContent
            ],
            ...(result.references && { isError: false })
          };
        } else {
          // Structured data response
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              } as TextContent
            ]
          };
        }
      } catch (error) {
        console.error(`Tool ${name} error:`, error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                error: (error as Error).message || 'Internal error',
                code: 'INTERNAL'
              }, null, 2)
            } as TextContent
          ],
          isError: true
        };
      }
    });

    // Handle resources/list
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources };
    });

    // Handle resources/read
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let resourceData: any;
        
        switch (uri) {
          case 'mcp://estacion-dulce/products#index':
            resourceData = await getProductsIndexResource({
              ifNoneMatch: request.params._meta?.ifNoneMatch as string,
              ifModifiedSince: request.params._meta?.ifModifiedSince as string
            });
            break;
            
          case 'mcp://estacion-dulce/recipes#index':
            resourceData = await getRecipesIndexResource({
              ifNoneMatch: request.params._meta?.ifNoneMatch as string,
              ifModifiedSince: request.params._meta?.ifModifiedSince as string
            });
            break;
            
          case 'mcp://estacion-dulce/persons#index':
            resourceData = await getPersonsIndexResource({
              ifNoneMatch: request.params._meta?.ifNoneMatch as string,
              ifModifiedSince: request.params._meta?.ifModifiedSince as string
            });
            break;
            
          case 'mcp://estacion-dulce/movements#last-30d':
            resourceData = await getMovementsLast30DResource({
              ifNoneMatch: request.params._meta?.ifNoneMatch as string,
              ifModifiedSince: request.params._meta?.ifModifiedSince as string
            });
            break;
            
          case 'mcp://estacion-dulce/version-manifest':
            resourceData = await getVersionManifestResource();
            break;
            
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
        
        return resourceData;
      } catch (error) {
        console.error(`Resource ${uri} error:`, error);
        return {
          contents: [{
            type: 'text',
            text: JSON.stringify({ error: (error as Error).message }),
            uri,
            mimeType: 'application/json'
          }]
        };
      }
    });

    // Process request using MCP server
    const body = await request.json() as any;
    
    // Pass If-None-Match header to MCP request if present
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifModifiedSince = request.headers.get('If-Modified-Since');
    
    if (body.params && (ifNoneMatch || ifModifiedSince)) {
      body.params._meta = {
        ...(body.params._meta || {}),
        ifNoneMatch,
        ifModifiedSince
      };
    }
    
    const response = await server.request(body, z.object({}));

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        code: 'INTERNAL',
        message: (error as Error).message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export default handler;