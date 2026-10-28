import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GitBranch, Zap, MessageSquare, Code2, Search, Shield, RefreshCw, ChevronRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const TICKER_ITEMS = [
  'Hybrid BM25 + Dense Search',
  'Gemini 2.5 Flash',
  'Groq LLaMA 3.3 70B Failover',
  'Source File Citations',
  'Multi-turn Conversations',
  'Reciprocal Rank Fusion',
  'ChromaDB Vector Store',
  'Self-healing Index',
];

const FEATURES = [
  {
    icon: Search,
    label: 'Hybrid Search',
    color: 'var(--accent)',
    desc: 'BM25Plus sparse search + dense vector embeddings fused with Reciprocal Rank Fusion for pinpoint code retrieval.',
  },
  {
    icon: Zap,
    label: 'Multi-Provider LLM',
    color: 'var(--coral)',
    desc: 'Gemini 2.5 Flash as primary with automatic failover to Groq LLaMA 3.3 70B — zero downtime.',
  },
  {
    icon: Code2,
    label: 'Language-Aware Chunks',
    color: 'var(--violet-light)',
    desc: 'AST-level code chunking respects function and class boundaries, tracking exact start and end line numbers.',
  },
  {
    icon: MessageSquare,
    label: 'Conversational Memory',
    color: 'var(--mint)',
    desc: 'Multi-turn chat with per-repository history stored in MongoDB — picks up right where you left off.',
  },
  {
    icon: GitBranch,
    label: 'Source Citations',
    color: 'var(--cyan)',
    desc: 'Every answer cites the exact file, line range, and code snippet with an interactive side-drawer inspector.',
  },
  {
    icon: RefreshCw,
    label: 'Self-Healing Index',
    color: 'var(--accent)',
    desc: 'If the vector store is purged, the system detects the 404 and automatically re-indexes the repo on the fly.',
  },
];

const STATS = [
  { value: '2', label: 'LLM Providers', sublabel: 'Gemini + Groq' },
  { value: '∞', label: 'Repos Supported', sublabel: 'Any public GitHub URL' },
  { value: '0', label: 'Setup Required', sublabel: 'Just paste & ask' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const Home = () => {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-primary)', transition: 'background-color 0.2s ease, color 0.2s ease' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav style={{
        borderBottom: '3px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(20px)',
        background: 'var(--nav-bg)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--ink)',
              boxShadow: '3px 3px 0 var(--border-strong)',
            }}>
              <Code2 size={18} color="var(--accent-fg)" strokeWidth={2.8} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
              Codebase<span style={{ color: 'var(--accent)' }}>Chat</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle variant="pill" id="home-nav-theme-toggle" />
            <a
              href="https://github.com/omkarbg100/codebase-chat-assistant"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s',
              }}
              className="hidden-sm"
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              GitHub
            </a>
            <Link to="/login" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: 11 }}>
              Get Started <ArrowRight size={13} strokeWidth={2.8} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Ticker ──────────────────────────────────────────── */}
      <div className="ticker-wrap" style={{ borderTop: 'none' }}>
        <div className="ticker-track" style={{ padding: '8px 0' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              whiteSpace: 'nowrap', padding: '0 28px',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--accent-fg)',
            }}>
              {item}
              <span style={{ fontSize: 6, opacity: 0.5 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left */}
          <div>
            <motion.div {...fadeUp(0)} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
              <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'rgba(var(--accent-rgb), 0.10)' }}>
                ⚡ Hybrid RAG
              </span>
              <span className="badge" style={{ color: 'var(--mint)', borderColor: 'var(--mint)', background: 'rgba(52,211,153,0.10)' }}>
                🤖 LiteLLM Gateway
              </span>
            </motion.div>

            <motion.h1 {...fadeUp(0.08)} style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              marginBottom: 28,
              margin: '0 0 28px',
              color: 'var(--text-primary)',
            }}>
              Talk to<br />
              <span style={{
                display: 'inline-block',
                background: 'var(--accent)',
                color: 'var(--accent-fg)',
                padding: '2px 16px',
                border: '3px solid var(--ink)',
                boxShadow: '6px 6px 0 var(--border-strong)',
              }}>
                any repo
              </span>
              <br />
              <span style={{ color: 'var(--coral)' }}>instantly.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.15)} style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.65, maxWidth: 480, margin: '24px 0 36px' }}>
              Paste a GitHub URL. Ask questions in plain English. Get answers with exact file and line citations — powered by Hybrid Search and multi-provider AI.
            </motion.p>

            <motion.div {...fadeUp(0.22)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/login" className="btn btn-primary">
                Start Exploring <ArrowRight size={15} strokeWidth={2.8} />
              </Link>
              <a
                href="https://github.com/omkarbg100/codebase-chat-assistant"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <GitBranch size={14} strokeWidth={2.5} />
                View on GitHub
              </a>
            </motion.div>
          </div>

          {/* Right — mock terminal */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ position: 'relative' }}
          >
            <div style={{
              border: '3px solid var(--border-strong)',
              background: 'var(--surface)',
              boxShadow: '8px 8px 0 var(--accent)',
            }}>
              {/* Terminal bar */}
              <div style={{
                background: 'var(--surface-2)',
                borderBottom: '2px solid var(--border)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {['var(--coral)', 'var(--accent)', 'var(--mint)'].map((c, i) => (
                    <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, border: '2px solid rgba(0,0,0,0.2)' }} />
                  ))}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-subtle)', letterSpacing: '0.12em' }}>
                  facebook/react
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div className="status-dot active" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mint)' }}>INDEXED</span>
                </span>
              </div>

              {/* Messages */}
              <div style={{ padding: '20px 18px', minHeight: 260 }}>
                {/* User message */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <div style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: '2px solid rgba(124,58,237,0.3)',
                    padding: '10px 14px',
                    maxWidth: '78%',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                  }}>
                    How does the reconciliation algorithm work?
                  </div>
                </div>
                {/* AI message */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 28, height: 28, flexShrink: 0,
                    background: 'rgba(var(--accent-rgb), 0.15)',
                    border: '2px solid rgba(var(--accent-rgb), 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11,
                  }}>AI</div>
                  <div style={{
                    background: 'var(--surface-2)',
                    border: '2px solid var(--border)',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    flex: 1,
                  }}>
                    React's reconciler uses a <strong style={{ color: 'var(--accent)' }}>diffing algorithm</strong> based on two heuristics — same element type and stable keys...
                    <div style={{
                      marginTop: 10, padding: '8px 12px',
                      background: 'var(--bg)',
                      border: '2px solid var(--border)',
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)',
                    }}>
                      // packages/react-reconciler/src/ReactChildFiber.js
                    </div>
                  </div>
                </div>
                {/* Source chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {['ReactChildFiber.js', 'ReactFiber.js', 'reconciler.js'].map((f, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      padding: '4px 10px',
                      background: 'rgba(var(--accent-rgb), 0.12)',
                      border: '2px solid rgba(var(--accent-rgb), 0.28)',
                      color: 'var(--accent)',
                      letterSpacing: '0.05em',
                    }}>
                      📄 {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating label */}
            <div style={{
              position: 'absolute', bottom: -14, right: 20,
              background: 'var(--coral)',
              color: '#fff',
              border: '3px solid var(--ink)',
              padding: '5px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              transform: 'rotate(2deg)',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.5)',
            }}>
              Hybrid RRF Search
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 72px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            border: '3px solid var(--border-strong)',
            boxShadow: '6px 6px 0 var(--accent)',
            background: 'var(--surface)',
          }}
        >
          {STATS.map((stat, i) => (
            <div key={i} style={{
              padding: '32px',
              borderRight: i < STATS.length - 1 ? '3px solid var(--border)' : 'none',
              transition: 'background 0.15s',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 700, lineHeight: 1, color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.10em', marginTop: 8, color: 'var(--text-primary)' }}>{stat.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sublabel}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 48 }}
        >
          <p className="section-label" style={{ marginBottom: 12 }}>⚙ What's Inside</p>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, margin: 0, color: 'var(--text-primary)' }}>
            Built for developers,<br />by developers.
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="brutal-card"
              style={{ padding: '28px 24px' }}
            >
              <div style={{
                width: 44, height: 44, marginBottom: 16,
                background: `rgba(var(--accent-rgb), 0.12)`,
                border: `2px solid var(--accent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <feat.icon size={20} color={feat.color} strokeWidth={2.3} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', marginBottom: 8, margin: '0 0 10px', color: 'var(--text-primary)' }}>{feat.label}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────── */}
      <section style={{ borderTop: '3px solid var(--border)', borderBottom: '3px solid var(--border)', padding: '72px 32px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 48 }}
          >
            <p className="section-label" style={{ marginBottom: 12 }}>⚡ How It Works</p>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, margin: 0, color: 'var(--text-primary)' }}>
              Three steps to understanding<br />
              <span style={{ color: 'var(--accent)' }}>any codebase.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { num: '01', title: 'Paste a GitHub URL', desc: 'Drop in any public repository URL. We clone, chunk, and dual-index it with dense vectors and BM25 sparse search — both at once.' },
              { num: '02', title: 'Ask Anything', desc: 'Type questions in plain English. Our Hybrid Retriever runs dense and sparse search in parallel, then fuses results with Reciprocal Rank Fusion.' },
              { num: '03', title: 'Get Cited Answers', desc: 'Receive grounded answers with exact source file paths, line numbers, and code snippets. Click any citation to inspect the full file.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                style={{
                  padding: '36px 28px',
                  border: '3px solid var(--border)',
                  borderRight: i < 2 ? 'none' : '3px solid var(--border)',
                  transition: 'background 0.15s',
                  background: 'var(--bg)',
                  cursor: 'default',
                }}
                className="brutal-card-step"
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 52, fontWeight: 700, lineHeight: 1,
                  color: 'rgba(var(--accent-rgb), 0.25)',
                  marginBottom: 24, letterSpacing: '-0.03em',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', margin: '0 0 12px', color: 'var(--text-primary)' }}>{step.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            border: '3px solid var(--accent)',
            background: 'var(--surface)',
            padding: '64px 40px',
            boxShadow: '8px 8px 0 var(--accent)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220,
            background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.10) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            display: 'inline-block',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '6px 18px',
            border: '2px solid var(--ink)',
            marginBottom: 24,
          }}>
            Free to use
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 20px', color: 'var(--text-primary)' }}>
            Ready to explore<br />your first repo?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.65 }}>
            No setup. No config. Just paste a GitHub URL and start chatting with your code.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ fontSize: 13, padding: '14px 36px' }}>
            Launch the App <ChevronRight size={16} strokeWidth={2.8} />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        borderTop: '3px solid var(--border)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--ink)' }}>
            <Code2 size={13} color="var(--accent-fg)" strokeWidth={2.8} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>
            CodebaseChat
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', margin: 0 }}>
          Powered by LiteLLM · ChromaDB · BM25Plus · RRF
        </p>
      </footer>
    </div>
  );
};

export default Home;
