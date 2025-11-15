# AI Integrator Demo App

A simple React demo app to test the `@ai-integrator/core` package with Google Gemini 2.5 Flash, showcasing both basic chat and advanced tool calling capabilities.

## Features

- ✅ One-page React app with a clean, modern UI
- ✅ **Dual mode:** Basic chat & Tool calling (NEW!)
- ✅ Real-time AI response display using Google Gemini
- ✅ **Tool calling demo** with weather function
- ✅ Example prompts for quick testing
- ✅ Visual tool call display showing functions executed
- ✅ Error handling and loading states
- ✅ Express backend using `@ai-integrator/core` library

## Setup

1. **Create a `.env` file** in this directory:

```bash
cp .env.example .env
```

2. **Add your Gemini API key** to the `.env` file:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

3. **Install dependencies** (if not already done):

```bash
npm install
```

## Running the Demo

You need to run two processes:

### Terminal 1 - Start the backend server:

```bash
npm run server
```

This starts the Express server on http://localhost:3001

### Terminal 2 - Start the React app:

```bash
npm run dev
```

This starts the Vite dev server (usually on http://localhost:5173)

## How to Use

### Basic Chat Mode

1. Open the React app in your browser (typically http://localhost:5173)
2. **Uncheck** the "Tool Calling Mode" toggle
3. Click on example prompts or enter your own
4. Click "Send Prompt" and see the AI response

### Tool Calling Mode (NEW!)

1. Ensure the "Tool Calling Mode" toggle is **checked** (default)
2. Click on weather-related example prompts or ask about weather:
   - "What's the weather in Tokyo?"
   - "Tell me the weather in London and Paris"
   - "How's the weather in New York? Give it to me in Fahrenheit"
3. Click "Send Prompt"
4. Watch the AI:
   - Decide to call the weather tool
   - Execute the function
   - Use the results to formulate a natural response
5. See the **Tools Called** section showing which functions were executed

## What This Tests

This demo validates that:

### Core Functionality
1. ✅ The `@ai-integrator/core` package is properly built and exportable
2. ✅ The package can successfully initialize a Gemini client
3. ✅ The package can make chat completion requests to Gemini
4. ✅ The response is properly formatted and returned
5. ✅ Error handling works correctly
6. ✅ The package works in a real-world Node.js + React environment

### NEW: Tool Calling (v0.2.0)
7. ✅ **Tool definition** - Define functions with proper schemas
8. ✅ **Tool discovery** - AI model can detect when to use tools
9. ✅ **Tool execution** - Backend executes the requested function
10. ✅ **Multi-step flow** - Request → Tool call → Tool result → Final response
11. ✅ **Response integration** - AI uses tool results to generate natural responses
12. ✅ **Cross-provider support** - Tool calling works with Gemini (also supports OpenAI & Anthropic)

## Troubleshooting

**"GEMINI_API_KEY not configured" error:**
- Make sure you created a `.env` file in the `demo` directory
- Verify your API key is valid
- Restart the server after adding the API key

**Connection errors:**
- Make sure both the server and frontend are running
- Check that the server is on port 3001
- Verify CORS is enabled in the server

**Package not found:**
- Run `npm run build` in the parent directory to rebuild the package
- Run `npm install` in the demo directory to reinstall dependencies

## Architecture

### Basic Chat Flow
```
┌─────────────────┐
│   React App     │  (Port 5173)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP POST /api/chat
         ↓
┌─────────────────┐
│  Express Server │  (Port 3001)
│   (Backend)     │
└────────┬────────┘
         │ Uses
         ↓
┌─────────────────┐
│ @ai-integrator/ │
│      core       │
└────────┬────────┘
         │ Calls
         ↓
┌─────────────────┐
│  Google Gemini  │
│      API        │
└─────────────────┘
```

### Tool Calling Flow (NEW!)
```
┌─────────────────┐
│   React App     │  1. User asks about weather
│   (Frontend)    │
└────────┬────────┘
         │ HTTP POST /api/chat-with-tools
         ↓
┌─────────────────┐
│  Express Server │  2. Sends request with tool definitions
│   (Backend)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ @ai-integrator/ │  3. Forwards request to Gemini
│      core       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Google Gemini  │  4. Returns tool_calls (not final answer)
│      API        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Express Server │  5. Executes get_weather() function
│  (get_weather)  │     Returns: {temp: 22, condition: "sunny"}
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ @ai-integrator/ │  6. Sends tool results back to Gemini
│      core       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Google Gemini  │  7. Returns final natural language response
│      API        │     "The weather in Tokyo is sunny with 22°C"
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   React App     │  8. Displays response + tool calls used
│   (Frontend)    │
└─────────────────┘
```
