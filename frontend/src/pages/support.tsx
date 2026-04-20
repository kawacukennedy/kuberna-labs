import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Search, HelpCircle, MessageCircle, ChevronDown, ChevronUp, Mail, ExternalLink } from 'lucide-react';

const faqs = [
  { q: 'How do I deploy an agent?', a: 'Navigate to the Agents page and click "Create Agent". Follow the wizard to configure and deploy your agent.' },
  { q: 'What chains are supported?', a: 'We support Ethereum, Arbitrum, Polygon, Optimism, BNB Chain, Solana, and more. Check our docs for the full list.' },
  { q: 'How does TEE deployment work?', a: 'TEE deployment runs your agent in an isolated execution environment with remote attestation. Your private keys never leave the enclave.' },
  { q: 'What are cross-chain intents?', a: 'Intents are declarative instructions that solvers execute on your behalf across multiple chains.' },
  { q: 'How do I get paid for completing intents?', a: 'Link your wallet and completed intents automatically settle rewards to your address.' },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest mb-6 inline-flex">
            Support
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Help <span className="text-primary">Center</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
          
          <div className="max-w-xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input 
                type="text" 
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-4 bg-surface-container border border-outline/10 rounded-xl text-lg focus:ring-0 focus:border-primary" 
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="bg-surface-container-low rounded-xl overflow-hidden"
                  >
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-5 flex items-center justify-between text-left"
                    >
                      <span className="font-bold">{faq.q}</span>
                      {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {openFaq === idx && (
                      <div className="px-5 pb-5 text-on-surface-variant">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Still Need Help?</h2>
              <div className="bg-surface-container-low rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                    <MessageCircle size={24} className="text-on-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Open a Ticket</h3>
                    <p className="text-sm text-on-surface-variant">We typically respond within 24 hours</p>
                  </div>
                </div>
                <form className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Subject"
                    className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg" 
                  />
                  <textarea 
                    rows={4}
                    placeholder="Describe your issue..."
                    className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg" 
                  />
                  <button className="btn btn-primary w-full">
                    Submit Ticket
                  </button>
                </form>
              </div>

              <div className="mt-6 p-6 bg-surface-container-low rounded-xl flex items-center gap-4">
                <Mail size={24} className="text-primary" />
                <div>
                  <p className="font-bold">Email Support</p>
                  <a href="mailto:support@kuberna.labs" className="text-sm text-primary hover:underline">
                    support@kuberna.labs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}