/**
 * Compare responses from different providers
 */

import { AIClient } from '@ai-integrator/core';

async function compareProviders() {
  const prompt = 'Explain what TypeScript is in one sentence.';

  const providers = [
    {
      name: 'OpenAI',
      config: {
        provider: 'openai' as const,
        apiKey: process.env.OPENAI_API_KEY || 'your-openai-key',
      },
      model: 'gpt-4o-mini',
    },
    {
      name: 'Anthropic',
      config: {
        provider: 'anthropic' as const,
        apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key',
      },
      model: 'claude-3-5-sonnet-20241022',
    },
    {
      name: 'Gemini',
      config: {
        provider: 'gemini' as const,
        apiKey: process.env.GEMINI_API_KEY || 'your-gemini-key',
      },
      model: 'gemini-2.0-flash-exp',
    },
  ];

  console.log(`Prompt: "${prompt}"\n`);
  console.log('='.repeat(80));

  for (const provider of providers) {
    try {
      const client = new AIClient(provider.config);

      const startTime = Date.now();
      const response = await client.chat({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      const duration = Date.now() - startTime;

      console.log(`\n${provider.name} (${provider.model}):`);
      console.log('-'.repeat(80));
      console.log(response.message.content);
      console.log(`\nStats:`);
      console.log(`- Duration: ${duration}ms`);
      console.log(`- Tokens: ${response.usage?.total_tokens || 'N/A'}`);
      console.log(`- Finish reason: ${response.finish_reason}`);
    } catch (error) {
      console.error(`\n${provider.name}: Error -`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n' + '='.repeat(80));
}

compareProviders().catch(console.error);
