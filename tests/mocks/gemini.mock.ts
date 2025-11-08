/**
 * Mock for Google Generative AI SDK
 */

import { vi } from 'vitest';

export class MockGoogleGenerativeAI {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getGenerativeModel(config: any) {
    return new MockGenerativeModel(config);
  }
}

class MockGenerativeModel {
  model: string;
  generationConfig: any;

  constructor(config: any) {
    this.model = config.model;
    this.generationConfig = config.generationConfig;
  }

  startChat(config: any) {
    return new MockChatSession(config, this.model);
  }
}

class MockChatSession {
  history: any[];
  systemInstruction?: string;
  model: string;
  sendMessage: ReturnType<typeof vi.fn>;
  sendMessageStream: ReturnType<typeof vi.fn>;

  constructor(config: any, model: string) {
    this.history = config.history || [];
    this.systemInstruction = config.systemInstruction;
    this.model = model;
    this.sendMessage = vi.fn();
    this.sendMessageStream = vi.fn();
  }
}

export function createMockGeminiResponse(content: string = 'Test response') {
  return {
    response: {
      candidates: [
        {
          content: {
            parts: [
              {
                text: content,
              },
            ],
            role: 'model',
          },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30,
      },
    },
  };
}

export async function* createMockGeminiStream(content: string = 'Test stream') {
  const words = content.split(' ');

  for (let i = 0; i < words.length; i++) {
    yield {
      candidates: [
        {
          content: {
            parts: [
              {
                text: i === 0 ? words[i] : ` ${words[i]}`,
              },
            ],
            role: 'model',
          },
          finishReason: i === words.length - 1 ? 'STOP' : undefined,
        },
      ],
    };
  }
}

export function createMockGeminiStreamResult(content: string = 'Test stream') {
  return {
    stream: createMockGeminiStream(content),
  };
}

export function createMockGeminiError(message: string) {
  const error = new Error(message);
  error.name = 'GoogleGenerativeAIError';
  return error;
}
