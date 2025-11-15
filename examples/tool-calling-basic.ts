import { AIClient } from '../src';
import type { ToolDefinition } from '../src';

// Basic tool calling example
async function main() {
  const client = new AIClient({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    debug: true,
  });

  // Define a simple weather tool
  const tools: ToolDefinition[] = [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name, e.g., "San Francisco"'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit'
          }
        },
        required: ['location']
      }
    }
  }];

  console.log('=== Basic Tool Calling Example ===\n');

  // Step 1: Send request with tools
  console.log('Sending request: "What is the weather in Tokyo?"\n');

  const response = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'What is the weather in Tokyo?' }
    ],
    tools,
    tool_choice: 'auto',
  });

  // Step 2: Check if model wants to call tools
  if (response.message.tool_calls) {
    console.log('✅ Tool calling works!');
    console.log('Model requested tool calls:');
    response.message.tool_calls.forEach(tc => {
      console.log(`  - ${tc.function.name}(${tc.function.arguments})`);
      console.log(`    ID: ${tc.id}`);
      console.log(`    Type: ${tc.type}`);
    });
    console.log(`\nFinish reason: ${response.finish_reason}`);
    console.log(`Provider: ${response.provider}`);
  } else {
    console.log('❌ No tool calls received');
    console.log('Response:', response.message.content);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
