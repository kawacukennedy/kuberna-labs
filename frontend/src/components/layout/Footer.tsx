import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  return (
    <footer className="bg-surface border-t border-glass-border pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
        {/* Brand + Newsletter */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Link href="/" className="text-xl font-bold text-primary font-heading tracking-tight">
            KUBERNA<span className="text-text-primary">LABS</span>
          </Link>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Architecting the Agentic Web3 Enterprise — cross‑chain intents, TEE security, and zero&#8209;knowledge privacy.
          </p>

          {/* Newsletter */}
          <div className="mt-2">
            <p className="text-sm font-semibold mb-2">Stay in the loop</p>
            <form onSubmit={(e) => { e.preventDefault(); setEmail(''); }} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-grow bg-background border border-glass-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-colors"
                required
              />
              <button type="submit" className="btn btn-primary py-2.5 px-4">
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 className="font-semibold mb-4 font-heading">Platform</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
            <li><Link href="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
            <li><Link href="/enterprise" className="hover:text-primary transition-colors">Enterprise</Link></li>
            <li><Link href="/docs" className="hover:text-primary transition-colors">Developer Docs</Link></li>
            <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="font-semibold mb-4 font-heading">Resources</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            <li><a href="https://discord.gg/kuberna" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Community</a></li>
            <li><Link href="/support" className="hover:text-primary transition-colors">Support</Link></li>
            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold mb-4 font-heading">Legal</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-text-secondary">
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
        <p>&copy; 2026 Kuberna Labs. All rights reserved. Kigali, Rwanda.</p>
        <div className="flex items-center gap-5">
          {/* Twitter/X */}
          <a href="https://twitter.com/Arnaud_Kennedy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Twitter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          {/* Discord */}
          <a href="https://discord.gg/kuberna" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Discord">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.32 4.37a19.79 19.79 0 00-4.93-1.52.07.07 0 00-.08.04c-.21.38-.45.87-.61 1.25a18.27 18.27 0 00-5.41 0 12.64 12.64 0 00-.62-1.25.08.08 0 00-.08-.04 19.74 19.74 0 00-4.93 1.52.07.07 0 00-.03.03C1.07 8.93.32 13.36.79 17.73a.08.08 0 00.03.06 19.9 19.9 0 005.99 3.04.08.08 0 00.08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 00-.04-.11 13.1 13.1 0 01-1.87-.9.08.08 0 01-.01-.13c.13-.1.25-.19.37-.29a.08.08 0 01.08-.01c3.93 1.79 8.18 1.79 12.07 0a.08.08 0 01.08.01c.12.1.25.2.37.29a.08.08 0 01-.01.13c-.6.35-1.22.65-1.87.9a.08.08 0 00-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 00.08.03 19.84 19.84 0 006-3.04.08.08 0 00.03-.05c.56-5.78-.93-10.17-3.95-14.37a.06.06 0 00-.03-.03zM8.02 15.07c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/></svg>
          </a>
          {/* GitHub */}
          <a href="https://github.com/kuberna-labs" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="GitHub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.57 21.8 24 17.31 24 12 24 5.37 18.63 0 12 0z"/></svg>
          </a>
          {/* LinkedIn */}
          <a href="https://github.com/kawacukennedy/kuberna-labs" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          {/* YouTube */}
          <a href="https://youtube.com/@kuberna" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          {/* Telegram */}
          <a href="https://t.me/Arnaud_Kennedy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Telegram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
};
