import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <Layout variant="auth">
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary-fixed-dim/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-secondary-fixed-dim/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-primary/40 rounded-full" />
            <div className="absolute inset-8 bg-primary rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white">404</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-on-surface-variant mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn btn-primary px-8 py-4 flex items-center gap-2">
              <Home size={20} /> Return to Dashboard
            </Link>
            <Link href="/" className="btn btn-glass px-8 py-4 flex items-center gap-2">
              <Search size={20} /> Search
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}