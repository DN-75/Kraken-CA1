'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Simple markdown-ish renderer: bold, links, newlines
function renderContent(text: string) {
  // Split by lines first
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    if (line.trim() === '') {
      elements.push(<br key={`br-${lineIdx}`} />)
      return
    }

    // Process inline formatting: **bold** and [text](url)
    const parts: React.ReactNode[] = []
    let remaining = line
    let partIdx = 0

    while (remaining.length > 0) {
      // Check for [text](url) link
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
      // Check for **bold**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)

      const linkIdx = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity
      const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity

      if (linkMatch && linkIdx <= boldIdx) {
        // Text before the link
        if (linkIdx > 0) {
          parts.push(<span key={`t-${partIdx++}`}>{remaining.slice(0, linkIdx)}</span>)
        }
        const href = linkMatch[2]
        const isInternal = href.startsWith('/')
        parts.push(
          isInternal ? (
            <Link
              key={`l-${partIdx++}`}
              href={href}
              className="chat-link"
            >
              {linkMatch[1]}
            </Link>
          ) : (
            <a
              key={`l-${partIdx++}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-link"
            >
              {linkMatch[1]}
            </a>
          )
        )
        remaining = remaining.slice(linkIdx + linkMatch[0].length)
      } else if (boldMatch && boldIdx < Infinity) {
        if (boldIdx > 0) {
          parts.push(<span key={`t-${partIdx++}`}>{remaining.slice(0, boldIdx)}</span>)
        }
        parts.push(<strong key={`b-${partIdx++}`}>{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldIdx + boldMatch[0].length)
      } else {
        parts.push(<span key={`t-${partIdx++}`}>{remaining}</span>)
        remaining = ''
      }
    }

    // Detect list items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
      elements.push(
        <div key={`li-${lineIdx}`} className="chat-list-item">
          {parts}
        </div>
      )
    } else {
      elements.push(
        <p key={`p-${lineIdx}`} className="chat-para">
          {parts}
        </p>
      )
    }
  })

  return elements
}

const SUGGESTIONS = [
  'Who can help me with entrepreneurship?',
  'I need a career coach',
  'Find me a web development mentor',
  'Who teaches data science?',
]

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `👋 Hi! I'm your **ExpertConnect AI Assistant**.

Tell me what you want to learn or improve — like *"I want to start a business"* or *"I need help with web development"* — and I'll match you with the perfect mentor!`,
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  // Show unread dot after first welcome message if chat never opened
  useEffect(() => {
    const t = setTimeout(() => {
      if (!open) setHasUnread(true)
    }, 3000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    const userMsg: Message = { role: 'user', content: userText }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        const errMsg = data.error ?? 'Something went wrong. Please try again.'
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }])
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        .chat-widget-bubble {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          font-family: var(--font-inter, Inter, sans-serif);
        }

        /* Panel */
        .chat-panel {
          width: 380px;
          height: 520px;
          max-height: calc(100vh - 100px);
          display: flex;
          flex-direction: column;
          background: #071a10;
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(16,185,129,0.08);
          transform-origin: bottom right;
          animation: chat-open 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        @keyframes chat-open {
          from { opacity: 0; transform: scale(0.85) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #0a2b1a 0%, #071a10 100%);
          border-bottom: 1px solid rgba(16,185,129,0.15);
          flex-shrink: 0;
        }

        .chat-header-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10B981, #34D399);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(16,185,129,0.4);
        }

        .chat-header-info {
          flex: 1;
        }

        .chat-header-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }

        .chat-header-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #34D399;
          margin-top: 2px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34D399;
          animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .chat-close-btn {
          background: rgba(255,255,255,0.06);
          border: none;
          border-radius: 8px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #9ca3af;
          transition: background 0.2s, color 0.2s;
          flex-shrink: 0;
        }
        .chat-close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

        /* Messages with custom scrollbar */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
        }
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }

        /* Bubble */
        .chat-bubble {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          max-width: 100%;
        }

        .chat-bubble.user { flex-direction: row-reverse; }

        .bubble-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .bubble-avatar.ai {
          background: linear-gradient(135deg, #10B981, #34D399);
          box-shadow: 0 0 8px rgba(16,185,129,0.3);
        }

        .bubble-avatar.user-av {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bubble-content {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.55;
          word-break: break-word;
        }

        .bubble-content.ai {
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.15);
          color: #d1fae5;
          border-top-left-radius: 4px;
        }

        .bubble-content.user {
          background: linear-gradient(135deg, #10B981, #059669);
          color: #fff;
          border-top-right-radius: 4px;
        }

        .chat-para { margin: 0 0 4px; }
        .chat-para:last-child { margin-bottom: 0; }
        .chat-list-item {
          padding-left: 12px;
          margin: 2px 0;
          position: relative;
        }
        .chat-list-item::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #34D399;
        }

        .chat-link {
          color: #34D399;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .chat-link:hover { color: #6ee7b7; }

        /* Typing indicator */
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34D399;
          animation: typing-bounce 1.2s infinite ease-in-out;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        /* Suggestions */
        .chat-suggestions {
          padding: 0 14px 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex-shrink: 0;
        }

        .suggestion-chip {
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11.5px;
          color: #6ee7b7;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          font-family: inherit;
          white-space: nowrap;
        }
        .suggestion-chip:hover {
          background: rgba(16,185,129,0.16);
          border-color: rgba(16,185,129,0.4);
          color: #a7f3d0;
        }

        /* Input area */
        .chat-input-area {
          padding: 12px 14px;
          border-top: 1px solid rgba(16,185,129,0.1);
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: #071a10;
          flex-shrink: 0;
        }

        .chat-textarea {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 12px;
          padding: 9px 12px;
          color: #e5e7eb;
          font-size: 13.5px;
          font-family: inherit;
          resize: none;
          outline: none;
          min-height: 40px;
          max-height: 120px;
          line-height: 1.5;
          transition: border-color 0.2s;
        }
        .chat-textarea::placeholder { color: #4b5563; }
        .chat-textarea:focus { border-color: rgba(16,185,129,0.5); }

        .chat-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: opacity 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .chat-send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* FAB trigger button */
        .chat-fab {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(16,185,129,0.4), 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
          color: #fff;
          position: relative;
        }
        .chat-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 32px rgba(16,185,129,0.5), 0 2px 8px rgba(0,0,0,0.3);
        }
        .chat-fab:active { transform: scale(0.96); }

        .chat-fab-icon {
          transition: transform 0.2s, opacity 0.15s;
        }

        .unread-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #041008;
          animation: pulse-red 1.5s infinite;
        }

        @keyframes pulse-red {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        /* Tooltip label */
        .chat-fab-label {
          position: absolute;
          right: 68px;
          bottom: 14px;
          background: #0a2b1a;
          border: 1px solid rgba(16,185,129,0.2);
          color: #d1fae5;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          animation: label-in 0.3s ease both;
        }

        @keyframes label-in {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 440px) {
          .chat-panel { width: calc(100vw - 32px); }
          .chat-widget-bubble { bottom: 16px; right: 16px; }
          .chat-fab-label { display: none; }
        }
      `}</style>

      <div className="chat-widget-bubble">
        {/* Panel */}
        {open && (
          <div className="chat-panel">
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-avatar">🤖</div>
              <div className="chat-header-info">
                <div className="chat-header-title">ExpertConnect AI</div>
                <div className="chat-header-status">
                  <span className="status-dot" />
                  Online · Find your perfect mentor
                </div>
              </div>
              <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <div className={`bubble-avatar ${msg.role === 'assistant' ? 'ai' : 'user-av'}`}>
                    {msg.role === 'assistant' ? '✨' : '👤'}
                  </div>
                  <div className={`bubble-content ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                    {msg.role === 'assistant'
                      ? renderContent(msg.content)
                      : msg.content
                    }
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-bubble">
                  <div className="bubble-avatar ai">✨</div>
                  <div className="bubble-content ai">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestion chips — only show when just welcome message */}
            {messages.length === 1 && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-textarea"
                placeholder="Ask me anything about our mentors…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className="chat-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* FAB */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {!open && hasUnread && (
            <div className="chat-fab-label">Ask our AI to find your mentor ✨</div>
          )}
          <button
            className="chat-fab"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close chat' : 'Open chat'}
          >
            {hasUnread && !open && <span className="unread-dot" />}
            <span className="chat-fab-icon">
              {open ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
