import { describe, it, expect } from 'vitest';
import {
  toAnthropicTools,
  toAnthropicToolChoice,
  fromAnthropicResponse
} from '../../../src/utils/anthropic-tool-transformer';
import {
  toGeminiFunctionDeclarations,
  fromGeminiResponse
} from '../../../src/utils/gemini-tool-transformer';
import type { ToolDefinition } from '../../../src/core/types';

describe('Anthropic Tool Transformer', () => {
  const sampleTool: ToolDefinition = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    }
  };

  describe('toAnthropicTools', () => {
    it('should convert tools to Anthropic format', () => {
      const result = toAnthropicTools([sampleTool]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('get_weather');
      expect(result[0].description).toBe('Get weather for a location');
      expect(result[0].input_schema.type).toBe('object');
      expect(result[0].input_schema.properties.location.type).toBe('string');
      expect(result[0].input_schema.required).toEqual(['location']);
    });

    it('should handle multiple tools', () => {
      const tool2: ToolDefinition = {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'Perform calculation',
          parameters: { type: 'object', properties: {} }
        }
      };

      const result = toAnthropicTools([sampleTool, tool2]);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('get_weather');
      expect(result[1].name).toBe('calculate');
    });

    it('should handle tools without description', () => {
      const toolNoDesc: ToolDefinition = {
        type: 'function',
        function: {
          name: 'test',
          parameters: { type: 'object', properties: {} }
        }
      };

      const result = toAnthropicTools([toolNoDesc]);
      expect(result[0].description).toBe('');
    });
  });

  describe('toAnthropicToolChoice', () => {
    it('should return undefined for auto', () => {
      expect(toAnthropicToolChoice('auto')).toBeUndefined();
      expect(toAnthropicToolChoice()).toBeUndefined();
    });

    it('should convert none to disable parallel', () => {
      const result = toAnthropicToolChoice('none');
      expect(result).toEqual({ type: 'auto', disable_parallel_tool_use: true });
    });

    it('should convert required to any', () => {
      const result = toAnthropicToolChoice('required');
      expect(result).toEqual({ type: 'any' });
    });

    it('should convert specific tool', () => {
      const result = toAnthropicToolChoice({
        type: 'function',
        function: { name: 'get_weather' }
      });
      expect(result).toEqual({ type: 'tool', name: 'get_weather' });
    });

    it('should return undefined for invalid tool choice format', () => {
      const result = toAnthropicToolChoice({
        type: 'invalid',
        someOtherProp: 'value'
      } as any);
      expect(result).toBeUndefined();
    });
  });

  describe('fromAnthropicResponse', () => {
    it('should extract tool calls from content', () => {
      const content = [
        { type: 'text', text: 'Let me check the weather' },
        {
          type: 'tool_use',
          id: 'toolu_123',
          name: 'get_weather',
          input: { location: 'San Francisco', unit: 'celsius' }
        }
      ];

      const result = fromAnthropicResponse(content);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('toolu_123');
      expect(result[0].type).toBe('function');
      expect(result[0].function.name).toBe('get_weather');
      expect(JSON.parse(result[0].function.arguments)).toEqual({
        location: 'San Francisco',
        unit: 'celsius'
      });
    });

    it('should handle multiple tool calls', () => {
      const content = [
        { type: 'tool_use', id: 'tool1', name: 'func1', input: {} },
        { type: 'tool_use', id: 'tool2', name: 'func2', input: {} }
      ];

      const result = fromAnthropicResponse(content);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tool1');
      expect(result[1].id).toBe('tool2');
    });

    it('should filter out non-tool blocks', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'tool_use', id: 'tool1', name: 'func1', input: {} }
      ];

      const result = fromAnthropicResponse(content);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tool1');
    });

    it('should return empty array for no tool calls', () => {
      const content = [
        { type: 'text', text: 'Hello' }
      ];

      const result = fromAnthropicResponse(content);
      expect(result).toHaveLength(0);
    });
  });
});

describe('Gemini Tool Transformer', () => {
  const sampleTool: ToolDefinition = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location']
      }
    }
  };

  describe('toGeminiFunctionDeclarations', () => {
    it('should convert to Gemini format', () => {
      const result = toGeminiFunctionDeclarations([sampleTool]);

      expect(result).toHaveLength(1);
      expect(result[0].functionDeclarations).toHaveLength(1);
      expect(result[0].functionDeclarations[0].name).toBe('get_weather');
      expect(result[0].functionDeclarations[0].description).toBe('Get weather');
      expect(result[0].functionDeclarations[0].parameters.type).toBe('object');
    });

    it('should handle multiple tools', () => {
      const tool2: ToolDefinition = {
        type: 'function',
        function: {
          name: 'calculate',
          parameters: { type: 'object', properties: {} }
        }
      };

      const result = toGeminiFunctionDeclarations([sampleTool, tool2]);
      expect(result[0].functionDeclarations).toHaveLength(2);
      expect(result[0].functionDeclarations[0].name).toBe('get_weather');
      expect(result[0].functionDeclarations[1].name).toBe('calculate');
    });

    it('should handle tools without description', () => {
      const toolNoDesc: ToolDefinition = {
        type: 'function',
        function: {
          name: 'test',
          parameters: { type: 'object', properties: {} }
        }
      };

      const result = toGeminiFunctionDeclarations([toolNoDesc]);
      expect(result[0].functionDeclarations[0].description).toBe('');
    });
  });

  describe('fromGeminiResponse', () => {
    it('should extract function calls from parts', () => {
      const parts = [
        { text: 'Checking weather...' },
        {
          functionCall: {
            name: 'get_weather',
            args: { location: 'Tokyo' }
          }
        }
      ];

      const result = fromGeminiResponse(parts);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('function');
      expect(result[0].function.name).toBe('get_weather');
      expect(JSON.parse(result[0].function.arguments)).toEqual({ location: 'Tokyo' });
      expect(result[0].id).toMatch(/^call_/); // Generated ID
    });

    it('should generate unique IDs', () => {
      const parts = [
        { functionCall: { name: 'func1', args: {} } },
        { functionCall: { name: 'func2', args: {} } }
      ];

      const result = fromGeminiResponse(parts);
      expect(result[0].id).not.toBe(result[1].id);
      expect(result[0].id).toMatch(/^call_\d+_0$/);
      expect(result[1].id).toMatch(/^call_\d+_1$/);
    });

    it('should filter out non-function blocks', () => {
      const parts = [
        { text: 'Hello' },
        { functionCall: { name: 'func1', args: {} } }
      ];

      const result = fromGeminiResponse(parts);
      expect(result).toHaveLength(1);
    });

    it('should return empty array for no function calls', () => {
      const parts = [
        { text: 'Hello' }
      ];

      const result = fromGeminiResponse(parts);
      expect(result).toHaveLength(0);
    });

    it('should handle empty args object', () => {
      const parts = [
        { functionCall: { name: 'test', args: {} } }
      ];

      const result = fromGeminiResponse(parts);
      expect(JSON.parse(result[0].function.arguments)).toEqual({});
    });
  });
});
