import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AIClient } from '@ai-integrator/core';

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', provider: 'gemini' });
});

// Chat endpoint
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

    // Call AI using the @ai-integrator/core library
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`Provider: Gemini`);
  console.log(`GEMINI_API_KEY configured: ${!!process.env.GEMINI_API_KEY}`);
});
