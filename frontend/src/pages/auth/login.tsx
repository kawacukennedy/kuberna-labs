import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { Mail, Lock, Loader2, Eye, EyeOff, Wallet } from 'lucide-react';
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
    <Layout variant="auth">
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold tracking-tighter text-on-surface mb-2">
              Kuberna Labs
            </Link>
            <p className="text-on-surface-variant text-sm font-medium tracking-wide">SECURE DECENTRALIZED COMPUTE</p>
          </div>

          <div className="glass-panel rounded-xl p-8 border border-outline/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/50 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-xl font-medium text-on-surface mb-6">Log In</h2>
              
              {error && (
                <div className="bg-error-container text-error p-3.5 rounded-lg mb-6 text-sm flex items-center gap-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-container-low border-0 rounded-lg py-4 pl-12 pr-4 text-on-surface focus:ring-0 focus:bg-surface-container-lowest focus:shadow-glow transition-all"
                      placeholder="name@domain.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block" htmlFor="password">Password</label>
                    <Link href="/auth/forgot-password" className="text-xs text-primary hover:text-primary-container font-medium">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low border-0 rounded-lg py-4 pl-12 pr-4 text-on-surface focus:ring-0 focus:bg-surface-container-lowest focus:shadow-glow transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white font-medium py-4 px-6 rounded-lg btn-spring mt-2 shadow-glow flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Log In'}
                </button>
              </form>

              <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-surface-container-high flex-1" />
                <span className="text-xs font-medium text-outline uppercase tracking-wider">Or</span>
                <div className="h-px bg-surface-container-high flex-1" />
              </div>

              <button
                onClick={() => connect()}
                className="w-full bg-surface-container-low text-on-surface font-medium py-4 px-6 rounded-lg btn-spring mb-4 hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
              >
                <Wallet size={20} className="text-secondary" />
                Connect Wallet
              </button>

              <div className="grid grid-cols-3 gap-4">
                <button className="bg-surface-container-low py-3 rounded-lg hover:bg-surface-container-highest transition-colors flex justify-center btn-spring" title="Google">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
                <button className="bg-surface-container-low py-3 rounded-lg hover:bg-surface-container-highest transition-colors flex justify-center btn-spring" title="GitHub">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.57 21.8 24 17.31 24 12 24 5.37 18.63 0 12 0z"/>
                  </svg>
                </button>
                <button className="bg-surface-container-low py-3 rounded-lg hover:bg-surface-container-highest transition-colors flex justify-center btn-spring" title="Discord">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.32 4.37a19.79 19.79 0 00-4.93-1.52.07.07 0 00-.08.04c-.21.38-.45.87-.61 1.25a18.27 18.27 0 00-5.41 0 12.64 12.64 0 00-.62-1.25.08.08 0 00-.08-.04 19.74 19.74 0 00-4.93 1.52.07.07 0 00-.03.03C1.07 8.93.32 13.36.79 17.73a.08.08 0 00.03.06 19.9 19.9 0 005.99 3.04.08.08 0 00.08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 00-.04-.11 13.1 13.1 0 01-1.87-.9.08.08 0 01-.01-.13c.13-.1.25-.19.37-.29a.08.08 0 01.08-.01c3.93 1.79 8.18 1.79 12.07 0a.08.08 0 01.08.01c.12.1.25.2.37.29a.08.08 0 01-.01.13c-.6.35-1.22.65-1.87.9a.08.08 0 00-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 00.08.03 19.84 19.84 0 006-3.04.08.08 0 00.03-.05c.56-5.78-.93-10.17-3.95-14.37a.06.06 0 00-.03-.03zM8.02 15.07c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/>
                  </svg>
                </button>
              </div>

              <p className="text-center mt-8 text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary font-medium hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-outline tracking-wider uppercase font-bold">© 2024 Kuberna Labs</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}