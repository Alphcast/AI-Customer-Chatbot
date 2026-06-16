'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'agent':
          router.replace('/agent');
          break;
        case 'business_owner':
          router.replace('/business');
          break;
        default:
          router.replace('/chat');
      }
    } else if (!isAuthenticated && !isLoading) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
