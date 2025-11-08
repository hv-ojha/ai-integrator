/**
 * Fallback providers example
 */

import { AIClient } from '@ai-integrator/core';

async function main() {
  const client = new AIClient({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
    fallbacks: [
      {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key',
        priority: 1,
      },
      {
        provider: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || 'your-gemini-key',
        priority: 2,
      },
    ],
    debug: true, // Enable debug mode to see fallback in action
  });

  console.log('Configured providers:', client.getProviders());
  console.log('---');

  try {
    const response = await client.chat({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Explain what a fallback provider is' }
      ],
    });

    console.log('Response from:', response.provider);
    console.log('Message:', response.message.content);
  } catch (error) {
    console.error('All providers failed:', error);
  }
}

main().catch(console.error);
