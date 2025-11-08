/**
 * Vercel Edge Function example with streaming
 */

import { AIClient } from '@ai-integrator/core';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, stream = false } = await req.json();

    const client = new AIClient({
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    if (stream) {
      // Streaming response
      const streamResponse = client.chatStream({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'user', content: message }
        ],
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const content = chunk.delta.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // Non-streaming response
      const response = await client.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'user', content: message }
        ],
      });

      return new Response(JSON.stringify({
        success: true,
        response: response.message.content,
        provider: response.provider,
        model: response.model,
        usage: response.usage,
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
