/**
 * Basic usage example
 */

import { AIClient } from '@ai-integrator/core';

async function main() {
  // Initialize client with OpenAI
  const client = new AIClient({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
  });

  // Simple chat completion
  const response = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'What is the capital of France?' }
    ],
  });

  console.log('Response:', response.message.content);
  console.log('Model:', response.model);
  console.log('Provider:', response.provider);
  console.log('Tokens used:', response.usage?.total_tokens);
}

main().catch(console.error);
