import type { ToolDefinition, ToolCall, ToolChoice } from '../core/types';

/**
 * Convert unified tool definitions to Anthropic format
 *
 * Anthropic format:
 * {
 *   "name": "get_weather",
 *   "description": "Get current weather",
 *   "input_schema": {
 *     "type": "object",
 *     "properties": { "location": { "type": "string" } },
 *     "required": ["location"]
 *   }
 * }
 */
export function toAnthropicTools(tools: ToolDefinition[]): any[] {
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description || '',
    input_schema: tool.function.parameters, // Already matches Anthropic format
  }));
}

/**
 * Convert unified tool_choice to Anthropic format
 */
export function toAnthropicToolChoice(choice?: ToolChoice): any {
  if (!choice || choice === 'auto') {
    return undefined; // Default behavior
  }

  if (choice === 'none') {
    return { type: 'auto', disable_parallel_tool_use: true };
  }

  if (choice === 'required') {
    return { type: 'any' }; // Force tool use
  }

  if (typeof choice === 'object' && 'function' in choice) {
    return { type: 'tool', name: choice.function.name };
  }

  return undefined;
}

/**
 * Extract tool calls from Anthropic response content blocks
 */
export function fromAnthropicResponse(content: any[]): ToolCall[] {
  return content
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      id: block.id,
      type: 'function' as const,
      function: {
        name: block.name,
        arguments: JSON.stringify(block.input),
      },
    }));
}
