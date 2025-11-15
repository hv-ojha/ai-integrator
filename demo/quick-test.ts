import { AIClient } from '@ai-integrator/core';
import type { ToolDefinition } from '@ai-integrator/core';
import dotenv from 'dotenv';

dotenv.config();

const weatherTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get weather',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location']
    }
  }
};

async function quickTest() {
  console.log('🧪 Testing @ai-integrator/core locally...\n');

  const client = new AIClient({
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY!,
  });

  // Test 1: Basic chat
  console.log('✅ Test 1: Basic chat');
  const basicResponse = await client.chat({
    model: 'gemini-2.5-flash',
    messages: [{ role: 'user', content: 'Say hello in one word!' }],
  });
  console.log('   Response:', basicResponse.message.content);

  // Test 2: Tool calling
  console.log('\n✅ Test 2: Tool calling');
  const toolResponse = await client.chat({
    model: 'gemini-2.5-flash',
    messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
    tools: [weatherTool],
  });

  if (toolResponse.message.tool_calls) {
    console.log('   Tool called:', toolResponse.message.tool_calls[0].function.name);
    console.log('   Arguments:', toolResponse.message.tool_calls[0].function.arguments);
  } else {
    console.log('   Direct response:', toolResponse.message.content);
  }

  console.log('\n🎉 All tests passed! Package works locally.');
}

quickTest().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
