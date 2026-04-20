import React, { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Mail, ArrowForward, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <Layout variant="auth">
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary-fixed opacity-30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary-fixed opacity-20 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="relative z-10 w-full max-w-md p-8 md:p-12 bg-glass rounded-xl shadow-ambient border border-outline/20 mx-4"
        >
          {!submitted ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-[1.75rem] font-semibold text-on-surface tracking-tight leading-tight mb-2">Kuberna Labs</h1>
                <h2 className="text-[1.125rem] font-medium text-on-surface-variant">Recover Access</h2>
              </div>
              <p className="text-[1rem] text-on-surface-variant mb-8 text-center">
                Enter the email address associated with your account to receive a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2 pl-2" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low text-on-surface rounded-lg border-none focus:ring-0 focus:bg-surface-container-lowest focus:shadow-glow transition-all"
                      placeholder="agent@kuberna.os"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-lg bg-primary text-white font-medium tracking-wide spring-300-20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      Send Reset Link <ArrowForward size={20} />
                    </>
                  )}
                </button>
              </form>
              <div className="mt-8 text-center">
                <Link href="/auth/login" className="text-sm font-medium text-primary hover:text-primary-container transition-colors">
                  Return to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-container text-secondary flex items-center justify-center mx-auto mb-6">
                <Mail size={32} />
              </div>
              <h1 className="text-xl font-semibold text-on-surface mb-4">Check Your Email</h1>
              <p className="text-on-surface-variant mb-8">
                We&apos;ve sent a password reset link to<br />
                <span className="font-medium text-on-surface">{email}</span>
              </p>
              <Link href="/auth/login" className="text-sm font-medium text-primary hover:text-primary-container transition-colors">
                Return to Login
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}