import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { Search, Bell, User, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/courses', label: 'Courses' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/enterprise', label: 'Enterprise' },
    { href: '/docs', label: 'Docs' },
  ];

  return (
    <nav className={`sticky top-0 z-50 w-full px-6 py-3.5 flex items-center justify-between transition-all duration-300 ${
      scrolled
        ? 'glass shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary font-heading">
          KUBERNA<span className="text-text-primary">LABS</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center bg-surface px-3 py-1.5 rounded-full border border-glass-border">
          <Search size={16} className="text-text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none px-2 text-sm w-32 focus:w-48 transition-all"
          />
        </div>

        {isConnected ? (
          <>
            <button className="p-2 hover:bg-surface rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-semibold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <span className="text-[10px] text-text-secondary cursor-pointer hover:text-primary" onClick={disconnect}>Disconnect</span>
              </div>
              <Link href="/dashboard" className="p-2 bg-surface rounded-full border border-glass-border">
                <User size={20} />
              </Link>
            </div>
          </>
        ) : (
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/auth/login" className="btn btn-ghost text-sm py-2 px-5">
              Log In
            </Link>
            <Link href="/auth/register" className="btn btn-primary text-sm py-2 px-5">
              Sign Up
            </Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 hover:bg-surface rounded-full transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 glass border-t border-glass-border p-6 md:hidden animate-slide-down">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!isConnected && (
              <div className="flex flex-col gap-2 pt-4 border-t border-glass-border">
                <Link href="/auth/login" className="btn btn-ghost w-full py-2.5" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
                <Link href="/auth/register" className="btn btn-primary w-full py-2.5" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
