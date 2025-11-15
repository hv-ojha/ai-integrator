import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AIClient } from '@ai-integrator/core';
import type { ToolDefinition } from '@ai-integrator/core';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI Client with Gemini
const client = new AIClient({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY || '',
  debug: true,
});

// Mock function to simulate getting weather data
function getWeather(location: string, unit: string = 'celsius'): object {
  // Simulate API call with mock data
  const weatherData: Record<string, { celsius: number; fahrenheit: number; condition: string }> = {
    'tokyo': { celsius: 22, fahrenheit: 72, condition: 'sunny' },
    'london': { celsius: 15, fahrenheit: 59, condition: 'cloudy' },
    'new york': { celsius: 18, fahrenheit: 64, condition: 'rainy' },
    'paris': { celsius: 20, fahrenheit: 68, condition: 'partly cloudy' },
    'sydney': { celsius: 25, fahrenheit: 77, condition: 'sunny' },
  };

  const locationKey = location.toLowerCase();
  const data = weatherData[locationKey] || { celsius: 20, fahrenheit: 68, condition: 'clear' };

  return {
    location,
    temperature: unit === 'celsius' ? data.celsius : data.fahrenheit,
    unit,
    condition: data.condition,
    humidity: 65,
    timestamp: new Date().toISOString(),
  };
}

// Define weather tool
const weatherTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name, e.g., "Tokyo", "London", "New York"'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit (default: celsius)'
        }
      },
      required: ['location']
    }
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', provider: 'gemini', toolCalling: true });
});

// Basic chat endpoint (without tools)
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    console.log('Received prompt:', prompt);

    const response = await client.chat({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    console.log('AI Response:', response.message.content);

    res.json({
      response: response.message.content,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    console.error('Error calling AI:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Tool calling endpoint (with weather function)
app.post('/api/chat-with-tools', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    console.log('\n=== Tool Calling Demo ===');
    console.log('User prompt:', prompt);

    // Step 1: Send request with tools
    const step1Response = await client.chat({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt }
      ],
      tools: [weatherTool],
      tool_choice: 'auto',
    });

    console.log('Step 1 - Model response:', {
      hasToolCalls: !!step1Response.message.tool_calls,
      toolCallsCount: step1Response.message.tool_calls?.length || 0,
      finishReason: step1Response.finish_reason,
    });

    // Check if model wants to use tools
    if (!step1Response.message.tool_calls || step1Response.message.tool_calls.length === 0) {
      // No tools needed, return direct response
      console.log('No tool calls needed, returning direct response');
      return res.json({
        response: step1Response.message.content,
        provider: step1Response.provider,
        model: step1Response.model,
        toolsUsed: false,
      });
    }

    // Step 2: Execute tool calls
    console.log('Tool calls requested:');
    const toolResults = step1Response.message.tool_calls.map(toolCall => {
      console.log(`  - ${toolCall.function.name}(${toolCall.function.arguments})`);

      const args = JSON.parse(toolCall.function.arguments);
      const result = getWeather(args.location, args.unit);

      console.log(`  Result:`, result);

      return {
        role: 'tool' as const,
        content: JSON.stringify(result),
        tool_call_id: toolCall.id,
      };
    });

    // Step 3: Send tool results back to get final response
    console.log('Step 3 - Sending tool results back to model');
    const step2Response = await client.chat({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'user', content: prompt },
        step1Response.message, // Assistant's message with tool calls
        ...toolResults,        // Tool execution results
      ],
      tools: [weatherTool],
    });

    console.log('Final response:', step2Response.message.content);
    console.log('=== End Tool Calling Demo ===\n');

    res.json({
      response: step2Response.message.content,
      provider: step2Response.provider,
      model: step2Response.model,
      toolsUsed: true,
      toolCalls: step1Response.message.tool_calls.map(tc => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    });
  } catch (error) {
    console.error('Error in tool calling:', error);
    res.status(500).json({
      error: 'Failed to process tool calling',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - POST http://localhost:${PORT}/api/chat (basic)`);
  console.log(`  - POST http://localhost:${PORT}/api/chat-with-tools (with tool calling)`);
  console.log(`  - GET  http://localhost:${PORT}/api/health`);
  console.log(`Provider: Gemini 2.5 Flash`);
  console.log(`Tool Calling: Enabled ✅`);
  console.log(`GEMINI_API_KEY configured: ${!!process.env.GEMINI_API_KEY}`);
});
