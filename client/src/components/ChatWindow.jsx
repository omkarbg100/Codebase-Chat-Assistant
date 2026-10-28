import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, User, FileText, Sparkles, Loader2, GitBranch, Zap, Search, AlertTriangle } from 'lucide-react';
import { chatService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const SUGGESTED_QUERIES = [
  'How does authentication work?',
  'Explain the main entry point',
  'Where are API routes defined?',
  'How is the database connection handled?',
];

const ThinkingDots = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--accent)',
        animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

const ChatWindow = ({ selectedRepo, onViewSource, activeSourceId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const scrollRef = useRef();
  const inputRef = useRef();
  const { isDark } = useTheme();

  useEffect(() => {
    if (selectedRepo) {
      setMessages([]);
      setLoadError('');
      loadHistory();
    }
  }, [selectedRepo?.repoId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await chatService.getHistory(selectedRepo.repoId);
      setMessages(res.data.messages || []);
    } catch (err) {
      setLoadError('Could not load conversation history.');
    }
  };

  const handleSend = async (query) => {
    const q = typeof query === 'string' ? query : input;
    if (!q.trim() || !selectedRepo || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.ask(selectedRepo.repoId, q);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ **Error:** Failed to get a response. Please try again.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <div style={{ margin: '12px 0', overflow: 'hidden', border: '2px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'var(--code-header)',
            borderBottom: '2px solid var(--border-subtle)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
              {match?.[1] || 'code'}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(String(children))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            {...props}
            children={String(children).replace(/\n$/, '')}
            style={isDark ? vscDarkPlus : vs}
            language={match?.[1] || 'javascript'}
            PreTag="div"
            customStyle={{ margin: 0, padding: '14px 16px', background: 'var(--code-bg)', fontSize: '12.5px', lineHeight: '1.65' }}
          />
        </div>
      ) : (
        <code {...props} style={{
          background: 'rgba(var(--accent-rgb), 0.12)',
          border: '1.5px solid rgba(var(--accent-rgb), 0.25)',
          color: 'var(--accent)',
          padding: '2px 7px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12.5px',
        }}>
          {children}
        </code>
      );
    },
    p: ({ children }) => <p style={{ marginBottom: 10, lineHeight: 1.7, color: 'inherit' }}>{children}</p>,
    ul: ({ children }) => <ul style={{ marginLeft: 18, marginBottom: 10, paddingLeft: 2 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ marginLeft: 18, marginBottom: 10, paddingLeft: 2 }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: 4, paddingLeft: 4 }}>{children}</li>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', textDecorationThickness: 1.5, textUnderlineOffset: 3 }}>{children}</a>,
    h1: ({ children }) => <h1 style={{ fontSize: 19, fontWeight: 800, margin: '20px 0 8px', letterSpacing: '-0.03em', color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 6px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 700, margin: '12px 0 4px', color: 'var(--text-secondary)' }}>{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote style={{ borderLeft: '4px solid var(--accent)', paddingLeft: 14, margin: '10px 0', background: 'rgba(var(--accent-rgb), 0.06)', paddingTop: 8, paddingBottom: 8, paddingRight: 8, color: 'var(--text-secondary)' }}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => <div style={{ overflowX: 'auto', margin: '10px 0' }}><table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--border)' }}>{children}</table></div>,
    th: ({ children }) => <th style={{ border: '1px solid var(--border)', padding: '8px 12px', background: 'var(--surface-2)', color: 'var(--text-primary)', fontWeight: 700, textAlign: 'left', fontSize: 12 }}>{children}</th>,
    td: ({ children }) => <td style={{ border: '1px solid var(--border)', padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{children}</td>,
    strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{children}</strong>,
  }), [isDark]);

  // ── Empty state ──────────────────────────────────────────────
  if (!selectedRepo) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center',
        background: 'var(--bg)',
      }}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72, height: 72, marginBottom: 24,
            background: 'rgba(var(--accent-rgb), 0.08)',
            border: '3px solid rgba(var(--accent-rgb), 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Sparkles size={32} color="var(--accent)" strokeWidth={1.8} />
        </motion.div>
        <h2 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', margin: '0 0 10px', color: 'var(--text-primary)' }}>
          Select a repository
        </h2>
        <p style={{ fontSize: 13, maxWidth: 340, lineHeight: 1.65, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          Choose an indexed repository from the sidebar or add a new one to start chatting with your code.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-subtle)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          <Search size={11} />
          Hybrid BM25 + Dense · Reciprocal Rank Fusion
        </div>
      </div>
    );
  }

  // ── Main Chat ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
        flexShrink: 0,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'rgba(var(--accent-rgb), 0.10)',
            border: '2px solid rgba(var(--accent-rgb), 0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={17} color="var(--accent)" strokeWidth={2.3} />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', margin: 0, color: 'var(--text-primary)' }}>
              {selectedRepo.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div className="status-dot active" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--mint)' }}>
                Hybrid Search Active
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            background: 'rgba(52,211,153,0.08)',
            border: '1.5px solid rgba(52,211,153,0.20)',
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mint)',
          }}>
            <Zap size={10} strokeWidth={2.5} />
            BM25 + Dense
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            background: 'rgba(124,58,237,0.08)',
            border: '1.5px solid rgba(124,58,237,0.25)',
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--violet-light)',
          }}>
            <GitBranch size={10} strokeWidth={2.5} />
            {selectedRepo.status === 'completed' ? 'Indexed' : 'Indexing...'}
          </div>
          <ThemeToggle id="chat-header-theme-toggle" />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {loadError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,92,77,0.08)', border: '2px solid rgba(255,92,77,0.2)', marginBottom: 16, fontSize: 12, color: 'var(--coral)' }}>
            <AlertTriangle size={13} />
            {loadError}
          </div>
        )}

        {/* Suggested queries if no messages */}
        {messages.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 12 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 14 }}>
              Suggested Questions
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  style={{
                    textAlign: 'left', padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '2px solid var(--border)',
                    cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)',
                    transition: 'all 0.12s ease', fontFamily: 'var(--font-sans)',
                    lineHeight: 1.45,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--surface)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 20,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, flexShrink: 0,
                border: msg.role === 'user' ? '2px solid rgba(124,58,237,0.35)' : '2px solid rgba(var(--accent-rgb), 0.35)',
                background: msg.role === 'user' ? 'rgba(124,58,237,0.12)' : 'rgba(var(--accent-rgb), 0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.role === 'user' ? 'var(--violet-light)' : 'var(--accent)',
              }}>
                {msg.role === 'user'
                  ? <User size={13} strokeWidth={2.5} />
                  : <Bot size={13} strokeWidth={2.5} />
                }
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '80%',
                display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8,
              }}>
                <div style={{
                  padding: '12px 16px',
                  fontSize: 13, lineHeight: 1.65,
                  border: msg.role === 'user'
                    ? '2px solid rgba(124,58,237,0.25)'
                    : '2px solid var(--border)',
                  background: msg.role === 'user'
                    ? 'rgba(124,58,237,0.10)'
                    : 'var(--surface)',
                  color: 'var(--text-primary)',
                  boxShadow: msg.role === 'user' ? 'none' : '2px 2px 0 var(--border)',
                }}>
                  {msg.role === 'user'
                    ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    : <div style={{ fontSize: 13 }}><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.content}</ReactMarkdown></div>
                  }
                </div>

                {/* Source chips */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {msg.sources.map((src, idx) => {
                      const isActive = activeSourceId === src.file_path;
                      return (
                        <button
                          key={idx}
                          onClick={() => onViewSource(src)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px',
                            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                            cursor: 'pointer',
                            border: isActive ? '2px solid var(--accent)' : '2px solid var(--border)',
                            background: isActive ? 'rgba(var(--accent-rgb), 0.14)' : 'var(--surface-2)',
                            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                            transition: 'all 0.12s ease',
                            transform: isActive ? 'scale(1.03)' : 'scale(1)',
                          }}
                          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                        >
                          <FileText size={9} strokeWidth={2.5} />
                          {src.file_path?.split('/').pop()}
                          {src.lines && (
                            <span style={{ opacity: 0.65 }}>:{src.lines}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 12, marginBottom: 20 }}
          >
            <div style={{
              width: 30, height: 30, flexShrink: 0,
              border: '2px solid rgba(var(--accent-rgb), 0.35)',
              background: 'rgba(var(--accent-rgb), 0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <Bot size={13} strokeWidth={2.5} />
            </div>
            <div style={{
              padding: '12px 16px',
              border: '2px solid var(--border)',
              background: 'var(--surface)',
            }}>
              <ThinkingDots />
            </div>
          </motion.div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '14px 20px 16px',
        borderTop: '2px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            border: '3px solid var(--border-strong)',
            background: 'var(--bg)',
            padding: '6px 6px 6px 16px',
            transition: 'border-color 0.15s ease',
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        >
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about auth, routing, data flow, or any function..."
            disabled={loading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              paddingTop: 8, paddingBottom: 8,
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            id="send-message-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary btn-sm"
            style={{
              flexShrink: 0, alignSelf: 'flex-end', padding: '9px 16px',
              opacity: (loading || !input.trim()) ? 0.5 : 1,
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-subtle)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Powered by LiteLLM · Gemini 2.5 Flash · Groq LLaMA 3.3 70B
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
