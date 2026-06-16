'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types';

const rolePrefixMap: Record<UserRole, string> = {
  admin: '/admin',
  business_owner: '/business',
  agent: '/agent',
  customer: '/chat',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user) {
      const expectedPrefix = rolePrefixMap[user.role] || '/chat';
      if (!pathname.startsWith(expectedPrefix)) {
        router.replace(expectedPrefix);
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const role = user.role;

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:relative lg:translate-x-0`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          role={role}
        />
      </div>

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <Header onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
