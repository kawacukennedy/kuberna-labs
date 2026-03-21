import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-glass-border py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-xl font-bold text-primary">
            KUBERNA LABS
          </Link>
          <p className="text-sm text-text-secondary max-w-xs">
            Architecting the Agentic Web3 Economy with Cross-Chain Intents and Secure Execution.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">Platform</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link href="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
            <li><Link href="/agents" className="hover:text-primary transition-colors">Agents</Link></li>
            <li><Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
            <li><Link href="/docs" className="hover:text-primary transition-colors">Developer Docs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
        <p>&copy; 2026 Kuberna Labs. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary">Twitter</a>
          <a href="#" className="hover:text-primary">Discord</a>
          <a href="#" className="hover:text-primary">GitHub</a>
          <a href="#" className="hover:text-primary">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
};
