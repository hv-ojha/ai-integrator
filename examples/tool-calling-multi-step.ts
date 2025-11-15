import { AIClient } from '../src';
import type { ToolDefinition } from '../src';

// Mock weather function
function getWeather(location: string, unit: string = 'celsius') {
  // Simulate API call
  const temps = {
    'Tokyo': { celsius: 22, fahrenheit: 72 },
    'London': { celsius: 15, fahrenheit: 59 },
    'New York': { celsius: 18, fahrenheit: 64 },
  };

  const temp = temps[location as keyof typeof temps] || { celsius: 20, fahrenheit: 68 };

  return {
    location,
    temperature: unit === 'celsius' ? temp.celsius : temp.fahrenheit,
    unit,
    condition: 'partly cloudy',
    humidity: 65
  };
}

// Multi-step tool calling example
async function main() {
  const client = new AIClient({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
  });

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
            description: 'City name, e.g., "Tokyo", "London"'
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

  console.log('=== Multi-Step Tool Calling Example ===\n');

  // Step 1: Initial request
  console.log('User: What is the weather in Tokyo?\n');

  const step1 = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'What is the weather in Tokyo?' }
    ],
    tools,
  });

  if (!step1.message.tool_calls) {
    console.log('No tool calls requested');
    console.log('Response:', step1.message.content);
    return;
  }

  // Step 2: Execute tool calls
  console.log('Assistant requested tool calls:');
  step1.message.tool_calls.forEach(tc => {
    const args = JSON.parse(tc.function.arguments);
    console.log(`  - ${tc.function.name}(${JSON.stringify(args)})`);
  });
  console.log();

  const toolResults = step1.message.tool_calls.map(toolCall => {
    const args = JSON.parse(toolCall.function.arguments);
    const result = getWeather(args.location, args.unit);

    console.log(`Executed ${toolCall.function.name}:`, result);

    return {
      role: 'tool' as const,
      content: JSON.stringify(result),
      tool_call_id: toolCall.id,
    };
  });
  console.log();

  // Step 3: Send tool results back
  const step2 = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'What is the weather in Tokyo?' },
      step1.message, // Assistant's message with tool calls
      ...toolResults,   // Tool execution results
    ],
    tools,
  });

  console.log('Assistant:', step2.message.content);
  console.log(`\nFinish reason: ${step2.finish_reason}`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
