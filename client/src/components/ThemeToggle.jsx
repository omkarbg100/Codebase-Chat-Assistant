import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

/**
 * Neo-Brutalist Theme Toggle button
 * Supports:
 * - 'icon' (compact square button with icon)
 * - 'pill' (toggle switch with label)
 * - 'button' (labeled brutalist button)
 */
const ThemeToggle = ({
  variant = 'icon',
  className = '',
  id = 'theme-toggle-btn',
  style = {},
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        id={id}
        onClick={toggleTheme}
        type="button"
        role="switch"
        aria-checked={!isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          background: 'var(--surface-2)',
          border: '2px solid var(--border-strong)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          transition: 'all 0.15s ease',
          userSelect: 'none',
          ...style,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.transform = 'translate(-1px, -1px)';
          e.currentTarget.style.boxShadow = '3px 3px 0 var(--accent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          borderRadius: 3,
          background: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(245,158,11,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? 'var(--accent)' : '#d97706',
        }}>
          {isDark ? <Moon size={12} strokeWidth={2.5} /> : <Sun size={12} strokeWidth={2.5} />}
        </div>
        <span>{isDark ? 'Dark' : 'Light'}</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        id={id}
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        className={`btn btn-secondary ${className}`}
        style={{
          padding: '10px 16px',
          fontSize: 11,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          ...style,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {isDark ? (
              <Moon size={13} strokeWidth={2.5} color="var(--accent)" />
            ) : (
              <Sun size={13} strokeWidth={2.5} color="#d97706" />
            )}
          </motion.div>
        </AnimatePresence>
        <span>{isDark ? 'Theme: Dark' : 'Theme: Light'}</span>
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <button
      id={id}
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={className}
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-2)',
        border: '2px solid var(--border-strong)',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.color = isDark ? 'var(--accent)' : '#d97706';
        e.currentTarget.style.transform = 'translate(-1.5px, -1.5px)';
        e.currentTarget.style.boxShadow = '3px 3px 0 var(--accent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ rotate: -70, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 70, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark ? (
            <Moon size={14} strokeWidth={2.3} />
          ) : (
            <Sun size={14} strokeWidth={2.3} />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
