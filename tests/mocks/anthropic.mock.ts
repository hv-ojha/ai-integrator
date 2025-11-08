/**
 * Mock for Anthropic SDK
 */

import { vi } from 'vitest';

export class MockAnthropic {
  apiKey: string;
  baseURL?: string;

  messages: {
    create: ReturnType<typeof vi.fn>;
  };

  constructor(config: any) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;

    this.messages = {
      create: vi.fn(),
    };
  }
}

export function createMockAnthropicResponse(content: string = 'Test response') {
  return {
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: content,
      },
    ],
    model: 'claude-3-5-sonnet-20241022',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 20,
    },
  };
}

export async function* createMockAnthropicStream(content: string = 'Test stream') {
  const words = content.split(' ');

  yield {
    type: 'message_start',
    message: {
      id: 'msg_test123',
      type: 'message',
      role: 'assistant',
      content: [],
      model: 'claude-3-5-sonnet-20241022',
    },
  };

  yield {
    type: 'content_block_start',
    index: 0,
    content_block: {
      type: 'text',
      text: '',
    },
  };

  for (let i = 0; i < words.length; i++) {
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text: i === 0 ? words[i] : ` ${words[i]}`,
      },
    };
  }

  yield {
    type: 'content_block_stop',
    index: 0,
  };

  yield {
    type: 'message_stop',
  };
}

export function createMockAnthropicError(statusCode: number, message: string) {
  const error: any = new Error(message);
  error.status = statusCode;
  error.response = { status: statusCode };
  error.error = { message };
  return error;
}
