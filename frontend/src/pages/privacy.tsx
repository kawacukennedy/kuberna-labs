import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { FileText, ChevronRight, Scale, Shield, Lock, Users } from 'lucide-react';

export default function LegalPage() {
  return (
    <Layout>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-outline/10 fixed h-screen overflow-y-auto hidden lg:block">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-6">Legal</h2>
            <nav className="space-y-1">
              <Link href="/privacy" className="sidebar-item active">
                <Shield size={18} /> Privacy Policy
              </Link>
              <Link href="/terms" className="sidebar-item">
                <Scale size={18} /> Terms of Service
              </Link>
              <Link href="/cookies" className="sidebar-item">
                <Lock size={18} /> Cookie Policy
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-6 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-on-surface-variant">
            <p className="lead">Last updated: January 2024</p>
            
            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">1. Introduction</h2>
            <p>
              At Kuberna Labs, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our platform.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">2. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as when you create an account, 
              use our services, or communicate with us. This may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email, name, wallet address)</li>
              <li>Transaction data (for intent execution)</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences</li>
            </ul>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process transactions and intent execution</li>
              <li>Communicate with you about updates</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data, 
              including TEE-based secure execution for sensitive operations.
            </p>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
            </ul>

            <h2 className="text-xl font-bold text-on-surface mt-8 mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at 
              <a href="mailto:privacy@kuberna.labs" className="text-primary hover:underline"> privacy@kuberna.labs</a>
            </p>
          </div>
        </main>
      </div>
    </Layout>
  );
}