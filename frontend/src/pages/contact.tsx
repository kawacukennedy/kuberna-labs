import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Mail, MapPin, Send, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Questions about enterprise? Want to partner? Just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                    <Mail size={24} className="text-on-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Email</h3>
                    <p className="text-on-surface-variant">hello@kuberna.labs</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center">
                    <MapPin size={24} className="text-on-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Location</h3>
                    <p className="text-on-surface-variant">Kigali, Rwanda</p>
                    <p className="text-xs text-on-surface-variant">Headquartered globally distributed</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-surface-container-low rounded-xl">
                <h3 className="font-bold mb-4">Enterprise Sales</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  For enterprise deployments, custom integrations, and partnership opportunities.
                </p>
                <a href="mailto:enterprise@kuberna.labs" className="btn btn-primary w-full">
                  Contact Enterprise Team
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-surface-container-low rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">First Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg focus:ring-0 focus:border-primary" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Last Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg focus:ring-0 focus:border-primary" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg focus:ring-0 focus:border-primary" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Company (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg focus:ring-0 focus:border-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Message</label>
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-3 bg-surface border border-outline/10 rounded-lg focus:ring-0 focus:border-primary" 
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn btn-primary w-full py-4 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>Send Message <Send size={20} /></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}