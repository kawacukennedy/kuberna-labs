import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  DollarSign,
  Settings,
  Users,
  Shield,
  BarChart3,
  Layers,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Activity,
  Home,
  FileText,
  Users as UsersIcon,
  MessageSquare,
  Briefcase,
  UserCircle
} from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, label, badge, active }) => {
  const router = useRouter();
  const isActive = router.asPath === href || router.asPath.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
    >
      {icon}
      <span className="flex-grow">{label}</span>
      {badge && (
        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <ChevronRight size={14} className={`transition-transform ${isActive ? 'rotate-90' : ''}`} />
    </Link>
  );
};

interface SidebarProps {
  type?: 'user' | 'admin' | 'instructor';
}

export const Sidebar: React.FC<SidebarProps> = ({ type = 'user' }) => {
  const userMenu: SidebarItemProps[] = [
    { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/courses', icon: <BookOpen size={18} />, label: 'My Courses' },
    { href: '/agents', icon: <Bot size={18} />, label: 'My Agents', badge: 2 },
    { href: '/marketplace', icon: <DollarSign size={18} />, label: 'Marketplace' },
    { href: '/profile', icon: <UserCircle size={18} />, label: 'Profile' },
    { href: '/settings', icon: <Settings size={18} />, label: 'Account Settings' },
  ];

  const adminMenu: SidebarItemProps[] = [
    { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Admin Dashboard' },
    { href: '/admin/users', icon: <Users size={18} />, label: 'User Management' },
    { href: '/admin/courses', icon: <BookOpen size={18} />, label: 'Course Management' },
    { href: '/admin/agents', icon: <Bot size={18} />, label: 'Agent Fleet' },
    { href: '/admin/tee', icon: <Shield size={18} />, label: 'TEE Nodes' },
    { href: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  ];

  const menu = type === 'admin' ? adminMenu : userMenu;

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen sticky top-0 hidden lg:flex flex-col">
      <div className="p-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-primary">KUBERNA</span>
          <span className="text-text-primary font-normal">LABS</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menu.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/support" className="sidebar-item">
          <HelpCircle size={18} />
          <span>Help & Support</span>
        </Link>
        <Link href="/" className="sidebar-item text-red-500 hover:text-red-600 hover:bg-red-50">
          <LogOut size={18} />
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  type?: 'user' | 'admin' | 'instructor';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, type = 'user' }) => {
  return (
    <div className="min-h-screen flex">
      <Sidebar type={type} />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
};