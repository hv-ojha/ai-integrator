import type { ToolDefinition, ToolCall } from '../core/types';

/**
 * Convert unified tool definitions to Gemini function declarations
 *
 * Gemini format:
 * {
 *   "tools": [{
 *     "functionDeclarations": [{
 *       "name": "get_weather",
 *       "description": "Get current weather",
 *       "parameters": {
 *         "type": "object",
 *         "properties": { "location": { "type": "string" } },
 *         "required": ["location"]
 *       }
 *     }]
 *   }]
 * }
 */
export function toGeminiFunctionDeclarations(tools: ToolDefinition[]): any[] {
  return [{
    functionDeclarations: tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description || '',
      parameters: tool.function.parameters,
    })),
  }];
}

/**
 * Extract tool calls from Gemini response parts
 */
export function fromGeminiResponse(parts: any[]): ToolCall[] {
  return parts
    .filter(part => part.functionCall)
    .map((part, index) => ({
      id: `call_${Date.now()}_${index}`, // Gemini doesn't provide IDs, generate one
      type: 'function' as const,
      function: {
        name: part.functionCall.name,
        arguments: JSON.stringify(part.functionCall.args),
      },
    }));
}
