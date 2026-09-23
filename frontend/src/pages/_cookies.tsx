import React from 'react';
import { Seo } from '@/components/seo/Seo';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { Scale, Shield, Lock } from 'lucide-react';

export default function CookiesPage() {
  return (
    <Layout>
      <Seo
        title="Cookie Policy"
        description="Kuberna Labs cookie policy: how we use cookies and similar technologies on the agentic Web3 platform."
        path="/cookies"
        noindex
      />
      <div className="flex min-h-screen">
        <aside className="w-64 bg-surface border-r border-outline/10 fixed h-screen overflow-y-auto hidden lg:block">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-6">Legal</h2>
            <nav className="space-y-1">
              <Link href="/privacy" className="sidebar-item">
                <Shield size={18} /> Privacy Policy
              </Link>
              <Link href="/terms" className="sidebar-item">
                <Scale size={18} /> Terms of Service
              </Link>
              <Link href="/cookies" className="sidebar-item active">
                <Lock size={18} /> Cookie Policy
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 px-6 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

          <div className="prose prose-lg max-w-none text-on-surface-variant">
            <p className="lead">Last updated: January 2024</p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">1. What Are Cookies</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They are widely used
              to make websites work efficiently and to provide information to site owners.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">2. How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential cookies:</strong> required for authentication and to keep you signed in to your wallet-backed session</li>
              <li><strong>Analytics cookies:</strong> to understand how visitors use our site so we can improve it</li>
              <li><strong>Preference cookies:</strong> to remember your settings and preferences</li>
            </ul>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">3. Third-Party Cookies</h2>
            <p>
              Some third-party services (such as analytics providers and social media platforms) may set their own
              cookies when you interact with our site. We do not control these cookies.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">4. Managing Cookies</h2>
            <p>
              You can control and delete cookies through your browser settings. Disabling certain cookies may
              affect the functionality of the Services, such as persistent login sessions.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">5. Contact</h2>
            <p>
              Questions about our cookie practices? Contact us at{' '}
              <a href="mailto:privacy@kuberna.labs" className="text-primary hover:underline"> privacy@kuberna.labs</a>.
            </p>
          </div>
        </main>
      </div>
    </Layout>
  );
}