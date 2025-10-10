import { z } from 'zod';

const AuthSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
});

export function validateAuth(request: Request | { headers: any }): boolean {
  try {
    const authHeader = request.headers.get ? 
      request.headers.get('authorization') : 
      request.headers.authorization;
    
    console.log('🔑 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No auth header found');
      return false;
    }

    AuthSchema.parse({ authorization: authHeader });
    
    const apiKey = authHeader.replace('Bearer ', '');
    const expectedApiKey = process.env.MCP_API_KEY;
    
    console.log('🔑 API Key length:', apiKey.length);
    console.log('🔑 Expected key configured:', !!expectedApiKey);
    
    if (!expectedApiKey) {
      console.error('❌ MCP_API_KEY environment variable is required');
      throw new Error('MCP_API_KEY environment variable is required');
    }

    const isValid = apiKey === expectedApiKey;
    console.log('🔑 API Key valid:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Auth validation error:', error);
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

