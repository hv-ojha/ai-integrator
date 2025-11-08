/**
 * Streaming example
 */

import { AIClient } from '@ai-integrator/core';

async function main() {
  const client = new AIClient({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
  });

  console.log('Streaming response:');
  console.log('---');

  const stream = client.chatStream({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'Write a short poem about coding' }
    ],
    temperature: 0.8,
  });

  for await (const chunk of stream) {
    if (chunk.delta.content) {
      process.stdout.write(chunk.delta.content);
    }

    if (chunk.finish_reason) {
      console.log('\n---');
      console.log('Finish reason:', chunk.finish_reason);
    }
  }
}

main().catch(console.error);
