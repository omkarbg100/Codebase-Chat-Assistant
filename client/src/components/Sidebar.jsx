import React, { useState } from 'react';
import { Plus, GitBranch, LogOut, Loader2, Code2, X, Link2, ChevronRight, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { repoService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ repos, selectedRepo, onSelect, onRepoAdded }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const { logout, user } = useAuth();

  const handleAddRepo = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      await repoService.upload(repoUrl);
      setRepoUrl('');
      setShowAdd(false);
      onRepoAdded();
    } catch (err) {
      setAddError(err.response?.data?.error || err.response?.data?.message || 'Failed to index repository.');
    } finally {
      setAdding(false);
    }
  };

  const statusDotClass = (status) => {
    if (status === 'completed') return 'active';
    if (status === 'failed') return 'error';
    return 'pending';
  };

  const statusLabel = (status) => {
    if (status === 'completed') return 'indexed';
    if (status === 'failed') return 'failed';
    return 'processing...';
  };

  const statusColor = (status) => {
    if (status === 'completed') return 'var(--mint)';
    if (status === 'failed') return 'var(--coral)';
    return 'var(--accent)';
  };

  return (
    <>
      <div style={{
        width: 280, flexShrink: 0,
        borderRight: '3px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)',
        height: '100%',
        overflow: 'hidden',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '2px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid var(--ink)', flexShrink: 0 }}>
              <Code2 size={15} color="var(--accent-fg)" strokeWidth={2.8} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Codebase<span style={{ color: 'var(--accent)' }}>Chat</span>
            </span>
          </div>
        </div>

        {/* Add Repo Button */}
        <div style={{ padding: '14px 14px 10px' }}>
          <button
            id="add-repo-btn"
            onClick={() => setShowAdd(true)}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 18px', fontSize: 11 }}
          >
            <Plus size={13} strokeWidth={2.8} />
            Index Repository
          </button>
        </div>

        {/* Repo Label */}
        <div style={{ padding: '10px 18px 8px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-subtle)', margin: 0 }}>
            Repositories ({repos.length})
          </p>
        </div>

        {/* Repo List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          {repos.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center' }}>
              <Database size={28} color="var(--text-subtle)" strokeWidth={1.5} style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>No repositories yet.<br />Add your first one above.</p>
            </div>
          ) : (
            repos.map(repo => {
              const isSelected = selectedRepo?.repoId === repo.repoId;
              return (
                <button
                  key={repo.repoId}
                  id={`repo-${repo.repoId}`}
                  onClick={() => onSelect(repo)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '11px 12px',
                    marginBottom: 4,
                    border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    background: isSelected ? 'var(--selected-repo-bg)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'block',
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--hover-row-bg)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <GitBranch size={12} color={isSelected ? 'var(--accent)' : 'var(--text-subtle)'} strokeWidth={2.3} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {repo.name || 'Repository'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 20 }}>
                    <div className={`status-dot ${statusDotClass(repo.status)}`} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: statusColor(repo.status) }}>
                      {statusLabel(repo.status)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div style={{ padding: '12px 14px', borderTop: '2px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            border: '2px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              background: 'var(--accent)',
              border: '2px solid var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, color: 'var(--accent-fg)',
              fontFamily: 'var(--font-sans)',
            }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{user?.username || 'User'}</p>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{user?.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <ThemeToggle id="sidebar-theme-toggle" />
              <button
                id="logout-btn"
                onClick={logout}
                title="Sign out"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-subtle)', padding: 4, transition: 'color 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
              >
                <LogOut size={14} strokeWidth={2.3} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Repo Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) { setShowAdd(false); setAddError(''); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              style={{
                width: '100%', maxWidth: 460,
                background: 'var(--surface)',
                border: '3px solid var(--border-strong)',
                boxShadow: '10px 10px 0 var(--accent)',
              }}
            >
              {/* Modal Header */}
              <div style={{
                background: 'var(--accent)', borderBottom: '3px solid var(--ink)',
                padding: '18px 22px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--accent-fg)' }}>
                    Index New Repository
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--accent-fg)', opacity: 0.85 }}>
                    Paste any public GitHub URL
                  </p>
                </div>
                <button
                  onClick={() => { setShowAdd(false); setAddError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-fg)', padding: 4, opacity: 0.85 }}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                {addError && (
                  <div style={{
                    background: 'rgba(255,92,77,0.1)', border: '2px solid rgba(255,92,77,0.25)',
                    padding: '10px 14px', marginBottom: 16,
                    fontSize: 12, color: 'var(--coral)',
                  }}>
                    {addError}
                  </div>
                )}

                <form onSubmit={handleAddRepo}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    GitHub Repository URL
                  </label>
                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <Link2 size={14} strokeWidth={2.3} color="var(--text-subtle)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      id="repo-url-input"
                      type="url"
                      className="input"
                      placeholder="https://github.com/author/repo"
                      required
                      value={repoUrl}
                      onChange={e => setRepoUrl(e.target.value)}
                      style={{ paddingLeft: 40 }}
                      autoFocus
                    />
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(var(--accent-rgb), 0.08)', border: '2px solid rgba(var(--accent-rgb), 0.20)', marginBottom: 20 }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      ⚡ We'll clone, chunk, and dual-index with dense + BM25 sparse search. Large repos may take 1–3 minutes.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => { setShowAdd(false); setAddError(''); }}
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                    >
                      Cancel
                    </button>
                    <button
                      id="ingest-submit-btn"
                      type="submit"
                      disabled={adding || !repoUrl.trim()}
                      className="btn btn-primary"
                      style={{
                        flex: 2, justifyContent: 'center', fontSize: 11,
                        opacity: (adding || !repoUrl.trim()) ? 0.7 : 1,
                        cursor: (adding || !repoUrl.trim()) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {adding ? (
                        <><Loader2 size={13} className="animate-spin" /> Indexing...</>
                      ) : (
                        <>Ingest Codebase <ChevronRight size={13} strokeWidth={2.8} /></>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
