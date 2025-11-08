# Quick Start Guide - AI Integrator Demo

## Prerequisites

1. **Get a Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy it for the next step

## Setup (First Time Only)

```bash
# 1. Navigate to the demo directory
cd demo

# 2. Create .env file from example
cp .env.example .env

# 3. Edit .env and add your GEMINI_API_KEY
# Replace "your_gemini_api_key_here" with your actual key
nano .env  # or use your preferred editor

# 4. Install dependencies (already done if you followed the README)
npm install
```

## Running the Demo

Open **TWO TERMINAL WINDOWS** in the `demo` directory:

### Terminal 1 - Backend Server
```bash
npm run server
```

Expected output:
```
Server running on http://localhost:3001
API endpoint: http://localhost:3001/api/chat
Provider: Gemini
GEMINI_API_KEY configured: true
```

### Terminal 2 - Frontend React App
```bash
npm run dev
```

Expected output:
```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Testing

1. Open your browser to http://localhost:5173
2. You should see: **"AI Integrator Demo"**
3. Try these test prompts:

### Test 1: Basic Response
```
Write a haiku about coding
```

### Test 2: Longer Response
```
Explain what React hooks are in simple terms
```

### Test 3: Technical Question
```
What's the difference between TypeScript and JavaScript?
```

## What Success Looks Like

When everything works:
1. You enter a prompt
2. The "Send Prompt" button shows "Generating..."
3. A spinner appears with "AI is thinking..."
4. After a few seconds, you see:
   - **AI Response:** header in purple
   - The actual response from Gemini in a styled box
5. The response should be relevant to your prompt

## Troubleshooting

### Error: "GEMINI_API_KEY not configured"
- Check `.env` file exists in `demo` directory
- Verify the API key is on the correct line: `GEMINI_API_KEY=your_key`
- No quotes needed around the key
- Restart the server after adding the key

### Error: "Failed to get response from AI"
- Backend server might not be running
- Check Terminal 1 shows server is running on port 3001
- Try accessing http://localhost:3001/api/health in browser

### Error: Network error / Connection refused
- Make sure BOTH servers are running (terminals 1 and 2)
- Check if something else is using port 3001 or 5173
- Try restarting both servers

### Nothing happens when clicking "Send Prompt"
- Check browser console for errors (F12)
- Verify both servers are running
- Check that you entered a prompt (button is disabled when empty)

## Validating the Package

This demo tests:
- ✅ Package builds correctly (`dist/` folder in parent directory)
- ✅ Package exports `AIClient` properly
- ✅ `AIClient` can initialize with Gemini provider
- ✅ Chat completion requests work
- ✅ Responses are properly formatted
- ✅ Error handling works
- ✅ Package works in a real Node.js application

## Next Steps

After successful testing:
1. Try different prompts
2. Modify `server.ts` to use different models (e.g., `gemini-1.5-pro`)
3. Test with other providers (OpenAI, Anthropic) by changing the provider in `server.ts`
4. Experiment with temperature, max_tokens, and other parameters

## File Structure

```
demo/
├── .env                 # Your API keys (create this)
├── .env.example         # Template for .env
├── server.ts            # Express backend using @ai-integrator/core
├── package.json         # Dependencies and scripts
├── src/
│   ├── App.tsx          # React UI component
│   └── App.css          # Styling
└── README.md           # Full documentation
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the full README.md
3. Check the parent directory's documentation
4. Verify your Gemini API key is valid and has quota
