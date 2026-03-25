import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { connect } = useWallet();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/login`, {
        email,
        password,
      });

      login(response.data.token, response.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[88vh] flex">
        {/* ── Left Panel: Branded Illustration ── */}
        <div className="hidden lg:flex lg:w-1/2 auth-panel-gradient relative overflow-hidden items-center justify-center p-12">
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          {/* Floating illustration */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 max-w-md"
          >
            <img
              src="/images/auth-panel.png"
              alt="Futuristic developer workspace"
              className="w-full rounded-3xl shadow-2xl"
            />
          </motion.div>
          {/* Bottom text */}
          <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
            <h2 className="text-3xl font-bold font-heading mb-3 leading-tight">
              Build the Future<br />of Autonomous Finance
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Join 50,000+ developers building revenue‑generating AI agents on decentralized infrastructure.
            </p>
          </div>
        </div>

        {/* ── Right Panel: Login Form ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="max-w-md w-full"
          >
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold tracking-tight text-primary font-heading inline-block mb-10">
              KUBERNA<span className="text-text-primary">LABS</span>
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold mb-2 font-heading tracking-tight">Welcome back</h1>
            <p className="text-text-secondary mb-8">Enter your details to access your dashboard</p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-6 text-sm border border-red-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-xs">!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold ml-0.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-0.5">
                  <label className="text-sm font-semibold">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-11"
                    placeholder="min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3.5 mt-1 flex items-center justify-center gap-2 text-base"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-text-secondary font-semibold tracking-wider">Or continue with</span>
              </div>
            </div>

            {/* OAuth + Wallet buttons */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => connect()}
                className="btn btn-glass py-3 flex items-center justify-center"
                title="MetaMask"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.5 3L13.5 9.75L15.19 5.81L22.5 3Z" fill="#E17726"/><path d="M1.5 3L10.42 9.81L8.81 5.81L1.5 3Z" fill="#E27625"/><path d="M19.31 17.07L16.91 20.79L22.03 22.21L23.52 17.14L19.31 17.07Z" fill="#E27625"/><path d="M0.49 17.14L1.97 22.21L7.09 20.79L4.69 17.07L0.49 17.14Z" fill="#E27625"/><path d="M6.82 10.58L5.38 12.76L10.47 12.99L10.29 7.5L6.82 10.58Z" fill="#E27625"/><path d="M17.18 10.58L13.67 7.44L13.53 13L18.62 12.76L17.18 10.58Z" fill="#E27625"/><path d="M7.09 20.79L10.14 19.29L7.5 17.17L7.09 20.79Z" fill="#E27625"/><path d="M13.86 19.29L16.91 20.79L16.5 17.17L13.86 19.29Z" fill="#E27625"/></svg>
              </button>
              <button className="btn btn-glass py-3 flex items-center justify-center" title="Google">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </button>
              <button className="btn btn-glass py-3 flex items-center justify-center" title="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.57 21.8 24 17.31 24 12 24 5.37 18.63 0 12 0z"/></svg>
              </button>
              <button className="btn btn-glass py-3 flex items-center justify-center" title="Discord">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.32 4.37a19.79 19.79 0 00-4.93-1.52.07.07 0 00-.08.04c-.21.38-.45.87-.61 1.25a18.27 18.27 0 00-5.41 0 12.64 12.64 0 00-.62-1.25.08.08 0 00-.08-.04 19.74 19.74 0 00-4.93 1.52.07.07 0 00-.03.03C1.07 8.93.32 13.36.79 17.73a.08.08 0 00.03.06 19.9 19.9 0 005.99 3.04.08.08 0 00.08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 00-.04-.11 13.1 13.1 0 01-1.87-.9.08.08 0 01-.01-.13c.13-.1.25-.19.37-.29a.08.08 0 01.08-.01c3.93 1.79 8.18 1.79 12.07 0a.08.08 0 01.08.01c.12.1.25.2.37.29a.08.08 0 01-.01.13c-.6.35-1.22.65-1.87.9a.08.08 0 00-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 00.08.03 19.84 19.84 0 006-3.04.08.08 0 00.03-.05c.56-5.78-.93-10.17-3.95-14.37a.06.06 0 00-.03-.03zM8.02 15.07c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/></svg>
              </button>
            </div>

            <p className="text-center mt-8 text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary font-bold hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
