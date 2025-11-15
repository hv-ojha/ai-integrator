# Migration Guide: functions → tools

## Overview

The `functions` parameter has been deprecated in favor of the more flexible `tools` API. This guide will help you migrate your code to use the modern tool calling API.

## Why Migrate?

- **Parallel Execution**: Tools API supports calling multiple tools in parallel (OpenAI)
- **Better Type Safety**: Improved TypeScript support with `ToolDefinition` types
- **Future-Proof**: `functions` will be removed in v1.0.0
- **Consistency**: Same API across all providers (OpenAI, Anthropic, Gemini)
- **Enhanced Features**: More control with `tool_choice` options

## Timeline

- **v0.2.0** (Current): Both APIs work, `functions` deprecated
- **v0.3.0 - v0.9.x** (6-12 months): Transition period with deprecation warnings
- **v1.0.0** (Future): `functions` removed (breaking change)

## Migration Steps

### Step 1: Update Tool Definitions

**Before** (deprecated):
```typescript
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'What is the weather?' }],
  functions: [{
    name: 'get_weather',
    description: 'Get weather',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  }],
  function_call: 'auto',
});
```

**After** (modern):
```typescript
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'What is the weather?' }],
  tools: [{
    type: 'function', // ✨ NEW: Required
    function: {       // ✨ NEW: Wrapped in 'function' object
      name: 'get_weather',
      description: 'Get weather',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        },
        required: ['location']
      }
    }
  }],
  tool_choice: 'auto', // ✨ NEW: Renamed from function_call
});
```

### Step 2: Update Response Handling

**Before**:
```typescript
if (response.message.function_call) {
  const functionName = response.message.function_call.name;
  const args = JSON.parse(response.message.function_call.arguments);
  // Execute function...
}
```

**After**:
```typescript
if (response.message.tool_calls) {
  // ✨ NEW: Array instead of single object
  response.message.tool_calls.forEach(toolCall => {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    // Execute function...
  });
}
```

### Step 3: Update Tool Results

**Before**:
```typescript
{
  role: 'function',
  name: 'get_weather',
  content: JSON.stringify(result)
}
```

**After**:
```typescript
{
  role: 'tool', // ✨ NEW: Changed from 'function'
  tool_call_id: toolCall.id, // ✨ NEW: Required ID
  content: JSON.stringify(result)
}
```

### Step 4: Update Tool Choice

| Old (`function_call`) | New (`tool_choice`) |
|----------------------|---------------------|
| `'auto'` | `'auto'` |
| `'none'` | `'none'` |
| `{ name: 'foo' }` | `{ type: 'function', function: { name: 'foo' } }` |
| N/A | `'required'` (OpenAI only, force tool use) |

### Step 5: Handle Parallel Tool Calls (OpenAI)

**New Feature**:
```typescript
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Weather in SF, NYC, and LA?' }],
  tools,
  parallel_tool_calls: true, // ✨ NEW: Default true for OpenAI
});

// Response may contain multiple tool calls
if (response.message.tool_calls) {
  console.log(`Calling ${response.message.tool_calls.length} tools`);
}
```

## Complete Example

### Before (Deprecated)

```typescript
import { AIClient } from '@ai-integrator/core';

const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});

const step1 = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Weather in SF?' }],
  functions: [{ name: 'get_weather', parameters: { /* ... */ } }],
  function_call: 'auto',
});

if (step1.message.function_call) {
  const result = getWeather(/* ... */);

  const step2 = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'Weather in SF?' },
      step1.message,
      {
        role: 'function',
        name: 'get_weather',
        content: JSON.stringify(result)
      }
    ],
    functions: [{ name: 'get_weather', parameters: { /* ... */ } }],
  });
}
```

### After (Modern)

```typescript
import { AIClient } from '@ai-integrator/core';
import type { ToolDefinition } from '@ai-integrator/core';

const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});

const tools: ToolDefinition[] = [{
  type: 'function',
  function: {
    name: 'get_weather',
    parameters: { /* ... */ }
  }
}];

const step1 = await client.chat({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Weather in SF?' }],
  tools,
  tool_choice: 'auto',
});

if (step1.message.tool_calls) {
  const toolCall = step1.message.tool_calls[0];
  const result = getWeather(/* ... */);

  const step2 = await client.chat({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: 'Weather in SF?' },
      step1.message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      }
    ],
    tools,
  });
}
```

## Testing Your Migration

1. **Enable debug mode** to see deprecation warnings:
```typescript
const client = new AIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  debug: true, // Shows deprecation warnings
});
```

2. **Run your tests** to ensure functionality is preserved

3. **Update your code** to use the new API

4. **Remove `debug: true`** once migration is complete

## Type Safety

Use TypeScript types for better development experience:

```typescript
import type { ToolDefinition, ToolChoice, ToolCall } from '@ai-integrator/core';

const tools: ToolDefinition[] = [/* ... */];
const toolChoice: ToolChoice = 'auto';

if (response.message.tool_calls) {
  response.message.tool_calls.forEach((toolCall: ToolCall) => {
    // TypeScript will help with autocomplete
  });
}
```

## Provider-Specific Notes

### OpenAI
- Supports `parallel_tool_calls` (default: `true`)
- Supports `tool_choice: 'required'` to force tool use
- Best support for parallel function execution

### Anthropic (Claude)
- Supports all tool choice options
- Excellent multi-turn tool conversations
- Complex content blocks with text + tools

### Google Gemini
- Does NOT support parallel tool calls
- Function declarations are wrapped differently internally
- Streaming works well with tool calling

## Troubleshooting

### Issue: "Property 'tool_calls' does not exist"

**Solution**: Update your TypeScript types:
```typescript
import type { ChatResponse } from '@ai-integrator/core';

const response: ChatResponse = await client.chat(/* ... */);
if (response.message.tool_calls) {
  // Now TypeScript knows about tool_calls
}
```

### Issue: "tool_call_id is required"

**Solution**: Always include the tool call ID when sending results:
```typescript
{
  role: 'tool',
  tool_call_id: toolCall.id, // ← Required!
  content: JSON.stringify(result)
}
```

### Issue: Deprecation warnings in console

**Solution**: Migrate to the `tools` API. Warnings only show when `debug: true`.

## Need Help?

- [GitHub Issues](https://github.com/hv-ojha/ai-integrator/issues)
- [Examples](./examples/)
- [Documentation](./README.md#functiontool-calling)

## Breaking Changes in v1.0.0

When v1.0.0 is released, the following will be removed:

- ❌ `functions` parameter
- ❌ `function_call` parameter
- ❌ `message.function_call` field
- ❌ `role: 'function'` (use `role: 'tool'` instead)

Make sure to migrate before upgrading to v1.0.0!
