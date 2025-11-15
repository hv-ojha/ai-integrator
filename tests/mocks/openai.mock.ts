/**
 * Mock for OpenAI SDK
 */

import { vi } from 'vitest';

export class MockOpenAI {
  apiKey: string;
  baseURL?: string;
  organization?: string;

  chat: {
    completions: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  constructor(config: any) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.organization = config.organization;

    this.chat = {
      completions: {
        create: vi.fn(),
      },
    };
  }
}

export function createMockOpenAIResponse(content: string = 'Test response') {
  return {
    id: 'chatcmpl-test-123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  };
}

export async function* createMockOpenAIStream(content: string = 'Test stream') {
  const words = content.split(' ');

  for (let i = 0; i < words.length; i++) {
    yield {
      id: `chatcmpl-test-${i}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          delta: {
            content: i === 0 ? words[i] : ` ${words[i]}`,
            role: i === 0 ? 'assistant' : undefined,
          },
          finish_reason: i === words.length - 1 ? 'stop' : null,
        },
      ],
    };
  }
}

export function createMockOpenAIError(statusCode: number, message: string) {
  const error: any = new Error(message);
  error.status = statusCode;
  error.response = { status: statusCode };
  return error;
}

export function createMockOpenAIResponseWithToolCalls(toolCalls: any[]) {
  return {
    id: 'chatcmpl-test-tool-123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        },
        finish_reason: 'tool_calls',
      },
    ],
    usage: {
      prompt_tokens: 15,
      completion_tokens: 25,
      total_tokens: 40,
    },
  };
}

export async function* createMockOpenAIStreamWithToolCalls(toolCalls: any[]) {
  // First chunk with role
  yield {
    id: 'chatcmpl-test-tool-0',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        delta: {
          role: 'assistant',
        },
        finish_reason: null,
      },
    ],
  };

  // Chunks with tool calls
  for (let i = 0; i < toolCalls.length; i++) {
    yield {
      id: `chatcmpl-test-tool-${i + 1}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: i,
                id: toolCalls[i].id,
                type: toolCalls[i].type,
                function: toolCalls[i].function,
              },
            ],
          },
          finish_reason: null,
        },
      ],
    };
  }

  // Final chunk with finish_reason
  yield {
    id: 'chatcmpl-test-tool-final',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: 'tool_calls',
      },
    ],
  };
}
