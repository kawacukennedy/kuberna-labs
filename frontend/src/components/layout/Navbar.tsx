import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { Search, Bell, User, Menu, X, ChevronDown } from 'lucide-react';

interface NavbarProps {
  variant?: 'transparent' | 'glass';
}

export const Navbar: React.FC<NavbarProps> = ({ variant = 'transparent' }) => {
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

  const shouldGlass = variant === 'glass' || scrolled;

  return (
    <nav className={`sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between transition-all duration-300 ${
      shouldGlass
        ? 'glass shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="flex items-center gap-10">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">KUBERNA</span>
          <span className="text-text-primary font-normal">LABS</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search..."
              className="w-40 lg:w-56 bg-surface/80 border border-border rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:w-56 lg:focus:w-72 transition-all"
            />
          </div>
        </div>

        {isConnected ? (
          <>
            <button className="p-2.5 hover:bg-surface rounded-full transition-colors relative">
              <Bell size={20} className="text-text-secondary" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
            </button>
            <Link href="/dashboard" className="hidden lg:flex items-center gap-3 p-1.5 pr-4 bg-surface/80 rounded-full border border-border">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <span className="text-[10px] text-text-secondary">View Dashboard</span>
              </div>
            </Link>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="btn btn-ghost text-sm py-2.5 px-6">
              Log In
            </Link>
            <Link href="/auth/register" className="btn btn-primary text-sm py-2.5 px-6">
              Sign Up
            </Link>
          </div>
        )}

        <button
          className="md:hidden p-2.5 hover:bg-surface rounded-full transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

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
