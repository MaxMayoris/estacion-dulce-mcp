import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ImageContent,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { validateAuth, createAuthError } from '../src/auth.js';
import { validateEnvironment } from '../src/validation.js';
import { listProducts } from '../src/list-products.js';

// Single read-only tool definition
const tools: Tool[] = [
  {
    name: 'list_products',
    description: 'List products from Estación Dulce with optional category filtering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { 
          type: 'number', 
          description: 'Maximum number of products to return (1-50, default: 20)' 
        },
        categoryId: { 
          type: 'string', 
          description: 'Optional category ID to filter by exact match' 
        }
      },
      required: []
    }
  }
];

/**
 * Main MCP server handler for Estación Dulce
 * @param request - HTTP request object
 * @returns HTTP response with MCP protocol data
 */
export default async function handler(request: Request): Promise<Response> {
  // Validate authentication
  if (!validateAuth(request)) {
    return createAuthError();
  }

  try {
    // Validate environment
    const env = validateEnvironment();
    console.log(`MCP Server running in ${env} mode`);

    // Create MCP server
    const server = new Server(
      {
        name: 'mcp-estacion-dulce',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Handle tool listing
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'list_products') {
          const result = await listProducts(args?.limit as number, args?.categoryId as string);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              } as TextContent
            ]
          };
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                error: (error as Error).message || 'Internal error',
                code: 'VALIDATION'
              }, null, 2)
            } as TextContent
          ]
        };
      }
    });

    // Process request using MCP server
    const body = await request.json() as any;
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
        code: 'VALIDATION',
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
