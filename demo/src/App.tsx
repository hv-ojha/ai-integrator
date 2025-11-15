import { useState } from 'react'
import './App.css'

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useTools, setUseTools] = useState(true)
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [toolsUsed, setToolsUsed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setLoading(true)
    setError('')
    setResponse('')
    setToolCalls([])
    setToolsUsed(false)

    try {
      const endpoint = useTools ? '/api/chat-with-tools' : '/api/chat'
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response from AI')
      }

      const data = await res.json()
      setResponse(data.response)

      if (data.toolsUsed && data.toolCalls) {
        setToolsUsed(true)
        setToolCalls(data.toolCalls)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const examplePrompts = useTools
    ? [
        "What's the weather in Tokyo?",
        "Tell me the weather in London and Paris",
        "How's the weather in New York? Give it to me in Fahrenheit",
      ]
    : [
        "Write a haiku about coding",
        "Explain quantum computing in simple terms",
        "What are the benefits of TypeScript?",
      ]

  return (
    <div className="app-container">
      <h1>🤖 AI Integrator Demo</h1>
      <p className="subtitle">Testing @ai-integrator/core with Google Gemini 2.5 Flash</p>

      <div className="mode-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={useTools}
            onChange={(e) => setUseTools(e.target.checked)}
            disabled={loading}
          />
          <span className="toggle-text">
            {useTools ? '🛠️ Tool Calling Mode (with weather function)' : '💬 Basic Chat Mode'}
          </span>
        </label>
      </div>

      <div className="examples">
        <p className="examples-title">Try these examples:</p>
        <div className="example-buttons">
          {examplePrompts.map((example, idx) => (
            <button
              key={idx}
              className="example-button"
              onClick={() => setPrompt(example)}
              disabled={loading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={useTools ? "Ask about weather in any city..." : "Enter your prompt here..."}
            rows={4}
            className="prompt-input"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Generating...' : 'Send Prompt'}
        </button>
      </form>

      {error && (
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {toolsUsed && toolCalls.length > 0 && (
        <div className="tool-calls-box">
          <h3>🔧 Tools Called:</h3>
          {toolCalls.map((tc, idx) => (
            <div key={idx} className="tool-call">
              <strong>{tc.name}(</strong>
              <code>{JSON.stringify(tc.arguments)}</code>
              <strong>)</strong>
            </div>
          ))}
        </div>
      )}

      {response && (
        <div className="response-box">
          <h3>🤖 AI Response:</h3>
          <div className="response-content">
            {response}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>{useTools ? 'AI is calling tools and thinking...' : 'AI is thinking...'}</p>
        </div>
      )}
    </div>
  )
}

export default App
