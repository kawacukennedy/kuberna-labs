import React from 'react';
import { Seo } from '@/components/seo/Seo';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { Scale, Shield, Lock } from 'lucide-react';

export default function TermsPage() {
  return (
    <Layout>
      <Seo
        title="Terms of Service"
        description="Kuberna Labs terms of service: the agreement governing use of the agentic Web3 platform, SDK, and services."
        path="/terms"
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
              <Link href="/terms" className="sidebar-item active">
                <Scale size={18} /> Terms of Service
              </Link>
              <Link href="/cookies" className="sidebar-item">
                <Lock size={18} /> Cookie Policy
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 px-6 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <div className="prose prose-lg max-w-none text-on-surface-variant">
            <p className="lead">Last updated: January 2024</p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Kuberna Labs platform, website, SDK, or any related services
              ("Services"), you agree to be bound by these Terms of Service. If you do not agree,
              you may not use the Services.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">2. Use of Services</h2>
            <p>You agree to use the Services only for lawful purposes and in accordance with these Terms. You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials and private keys</li>
              <li>All activity that occurs under your account</li>
              <li>Complying with all applicable laws and regulations</li>
            </ul>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">3. Smart Contracts &amp; Autonomy</h2>
            <p>
              Kuberna Labs enables autonomous AI agents to interact with blockchain networks. You acknowledge that
              blockchain transactions are irreversible, and that agent actions executed under your configuration
              are your responsibility. We do not control or operate the underlying decentralized networks.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">4. SDK License</h2>
            <p>
              The Kuberna SDK is provided under the MIT license. You may use, modify, and distribute it subject to
              the terms of that license.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Kuberna Labs shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
              directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">6. Changes to These Terms</h2>
            <p>
              We may revise these Terms from time to time. The most current version will always be posted on this page.
              Continued use of the Services after changes constitutes acceptance of the revised Terms.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">7. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
              <a href="mailto:legal@kuberna.labs" className="text-primary hover:underline"> legal@kuberna.labs</a>.
            </p>
          </div>
        </main>
      </div>
    </Layout>
  );
}