/**
 * Cloudflare Workers example
 */

import { AIClient } from '@ai-integrator/core';

interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const { message } = await request.json() as { message: string };

      const client = new AIClient({
        provider: 'openai',
        apiKey: env.OPENAI_API_KEY,
      });

      const response = await client.chat({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: message }
        ],
      });

      return new Response(JSON.stringify({
        success: true,
        response: response.message.content,
        provider: response.provider,
        model: response.model,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
