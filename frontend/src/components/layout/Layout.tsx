import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'dashboard' | 'auth';
  sidebarType?: 'user' | 'admin' | 'instructor';
}

export const Layout: React.FC<LayoutProps> = ({ children, variant = 'default', sidebarType = 'user' }) => {
  if (variant === 'dashboard') {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar type={sidebarType} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar variant="glass" />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  if (variant === 'auth') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar variant="glass" />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="transparent" />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};
