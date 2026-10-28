import React, { useState } from 'react';
import { X, Copy, Check, Code2, ChevronRight, Hash, Info } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const EXT_TO_LANG = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', sh: 'bash',
  yml: 'yaml', yaml: 'yaml', json: 'json', md: 'markdown',
  html: 'html', css: 'css', scss: 'scss', sql: 'sql',
};

function detectLang(filePath) {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  return EXT_TO_LANG[ext] || 'text';
}

const SourceViewer = ({ source, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  if (!source) return null;

  const fileName = source.file_path?.split('/').pop() || 'source';
  const language = source.language || detectLang(source.file_path) || 'text';
  const content = source.content || '// No content available.';

  const copyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = source.lines;
  const startLine = source.start_line;
  const endLine = source.end_line;

  // Score info
  const hasScores = source.rrf_score != null;
  const denseRank = source.dense_rank;
  const sparseRank = source.sparse_rank;
  const rrfScore = source.rrf_score;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--code-bg)',
        borderLeft: '3px solid var(--border)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '3px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {/* Icon */}
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          background: 'rgba(var(--accent-rgb), 0.10)',
          border: '2px solid rgba(var(--accent-rgb), 0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Code2 size={14} color="var(--accent)" strokeWidth={2.5} />
        </div>

        {/* File name + path */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
              {fileName}
            </h4>
            {(lines || (startLine && endLine)) && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                padding: '2px 7px',
                background: 'rgba(var(--accent-rgb), 0.12)',
                border: '1.5px solid rgba(var(--accent-rgb), 0.30)',
                color: 'var(--accent)',
                flexShrink: 0,
              }}>
                <Hash size={8} />
                {lines || `${startLine}–${endLine}`}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
            {source.file_path}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={copyCode}
            title="Copy code"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px',
              border: copied ? '2px solid var(--mint)' : '2px solid var(--border-strong)',
              background: copied ? 'rgba(52,211,153,0.1)' : 'var(--surface-2)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: copied ? 'var(--mint)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2.3} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28,
              border: '2px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,92,77,0.12)'; e.currentTarget.style.color = 'var(--coral)'; e.currentTarget.style.borderColor = 'rgba(255,92,77,0.30)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-subtle)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* RRF Score row (if available) */}
      {hasScores && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '2px solid var(--border-subtle)',
          background: 'rgba(var(--accent-rgb), 0.04)',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Info size={10} color="var(--text-subtle)" strokeWidth={2.3} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-subtle)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              Retrieval
            </span>
          </div>
          {denseRank != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>
              Dense <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>#{denseRank}</span>
            </span>
          )}
          {sparseRank != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>
              Sparse <span style={{ color: 'var(--violet-light)', fontWeight: 700 }}>#{sparseRank}</span>
            </span>
          )}
          {rrfScore != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>
              RRF <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Number(rrfScore).toFixed(5)}</span>
            </span>
          )}
        </div>
      )}

      {/* Code */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          showLineNumbers
          customStyle={{
            margin: 0, padding: '20px 0',
            background: 'transparent',
            fontSize: '12.5px', lineHeight: '1.65',
          }}
          lineNumberStyle={{
            minWidth: '3.5em', paddingRight: '1.2em',
            color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)',
            borderRight: '2px solid var(--border-subtle)',
            marginRight: '1em',
          }}
          wrapLines
          lineProps={lineNumber => {
            const isHighlighted = startLine && endLine
              ? (lineNumber >= startLine && lineNumber <= endLine)
              : false;
            return {
              style: isHighlighted
                ? { background: 'rgba(var(--accent-rgb), 0.10)', borderLeft: '3px solid var(--accent)', paddingLeft: 12 }
                : {},
            };
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '2px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-subtle)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {language.toUpperCase()}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-subtle)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Hybrid Match · RRF Ranked
        </span>
      </div>
    </motion.div>
  );
};

export default SourceViewer;
