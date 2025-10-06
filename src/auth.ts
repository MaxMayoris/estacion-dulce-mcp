import { z } from 'zod';

const AuthSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
});

export function validateAuth(request: Request): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return false;
    }

    AuthSchema.parse({ authorization: authHeader });
    
    const apiKey = authHeader.replace('Bearer ', '');
    const expectedApiKey = process.env.MCP_API_KEY;
    
    if (!expectedApiKey) {
      throw new Error('MCP_API_KEY environment variable is required');
    }

    return apiKey === expectedApiKey;
  } catch (error) {
    console.error('Auth validation error:', error);
    return false;
  }
}

export function createAuthError(): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Valid API key required in Authorization header' 
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer',
      },
    }
  );
}

