import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Client-side gate for admin-only pages.
 *
 * IMPORTANT: because the app is a static export there is no server to enforce
 * this, so it is a UX / defence-in-depth control only. It hides privileged UI
 * from non-admins and prevents accidental exposure of admin data, but it is
 * NOT a security boundary — every admin API must independently enforce the
 * ADMIN role (see the backend `requireRoles('ADMIN')` guards). Never rely on
 * this component to protect data.
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes('ADMIN');

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
