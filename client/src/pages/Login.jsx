import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        // Simplified register logic for brevity
        await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-10 rounded-3xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-xl shadow-lg shadow-primary/20 mb-4">
            <Code2 className="text-white w-7 h-7" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-400 text-sm">
            {isRegister ? 'Join the future of code analysis' : 'Sign in to access your repositories'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Username"
                className="input-field pl-12"
                required
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              placeholder="Email address"
              className="input-field pl-12"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              className="input-field pl-12"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-12 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-primary font-semibold hover:underline"
          >
            {isRegister ? 'Sign In' : 'Create One'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
