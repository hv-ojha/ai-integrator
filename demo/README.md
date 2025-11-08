# AI Integrator Demo App

A simple React demo app to test the `@ai-integrator/core` package with Google Gemini.

## Features

- One-page React app with a clean UI
- Text input for prompts
- Real-time AI response display using Google Gemini
- Error handling and loading states
- Express backend using `@ai-integrator/core` library

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

1. Open the React app in your browser (typically http://localhost:5173)
2. Enter a prompt in the textarea (e.g., "Write a haiku about coding")
3. Click "Send Prompt"
4. Wait for the AI response to appear below

## What This Tests

This demo validates that:

1. The `@ai-integrator/core` package is properly built and exportable
2. The package can successfully initialize a Gemini client
3. The package can make chat completion requests to Gemini
4. The response is properly formatted and returned
5. Error handling works correctly
6. The package works in a real-world Node.js + React environment

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

```
┌─────────────────┐
│   React App     │  (Port 5173)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP POST
         │ /api/chat
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
