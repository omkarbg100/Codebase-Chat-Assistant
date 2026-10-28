import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await authService.register(formData);
      }
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}>

      {/* Nav bar */}
      <nav style={{ padding: '16px 32px', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <ArrowLeft size={14} color="var(--text-secondary)" strokeWidth={2.5} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            Back to Home
          </span>
        </Link>
        <ThemeToggle id="login-nav-theme-toggle" />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <motion.div
          key={isRegister ? 'register' : 'login'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Card */}
          <div style={{
            background: 'var(--surface)',
            border: '3px solid var(--border-strong)',
            boxShadow: '8px 8px 0 var(--accent)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          }}>
            {/* Header */}
            <div style={{
              background: 'var(--accent)',
              borderBottom: '3px solid var(--ink)',
              padding: '24px 28px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 34, height: 34,
                  background: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Code2 size={17} color="var(--accent)" strokeWidth={2.8} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-fg)', letterSpacing: '-0.02em' }}>
                  Codebase<span style={{ opacity: 0.9 }}>Chat</span>
                </span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.04em', lineHeight: 1.1,
                color: 'var(--accent-fg)', margin: 0,
              }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--accent-fg)', opacity: 0.85, marginTop: 6 }}>
                {isRegister ? 'Start exploring any GitHub repo with AI.' : 'Sign in to access your indexed repositories.'}
              </p>
            </div>

            <div style={{ padding: '28px' }}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: 'rgba(255,92,77,0.10)',
                      border: '2px solid rgba(255,92,77,0.30)',
                      padding: '12px 14px',
                      marginBottom: 20,
                      fontSize: 13, color: 'var(--coral)',
                    }}
                  >
                    <AlertCircle size={15} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                      Username
                    </label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={15} strokeWidth={2.3} color="var(--text-subtle)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        id="username"
                        type="text"
                        className="input"
                        placeholder="your_username"
                        required
                        value={formData.username}
                        onChange={e => updateField('username', e.target.value)}
                        style={{ paddingLeft: 42 }}
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} strokeWidth={2.3} color="var(--text-subtle)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      id="email"
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      required
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} strokeWidth={2.3} color="var(--text-subtle)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      required
                      value={formData.password}
                      onChange={e => updateField('password', e.target.value)}
                      style={{ paddingLeft: 42, paddingRight: 46 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 4 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%', justifyContent: 'center',
                    marginTop: 6,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
                    : (isRegister ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              <div style={{
                marginTop: 22,
                paddingTop: 18,
                borderTop: '2px solid var(--border)',
                textAlign: 'center',
                fontSize: 13, color: 'var(--text-muted)',
              }}>
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  onClick={() => { setIsRegister(v => !v); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-sans)', textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 3, padding: 0 }}
                >
                  {isRegister ? 'Sign In' : 'Create One'}
                </button>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            Secured · JWT Auth · No data shared
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
