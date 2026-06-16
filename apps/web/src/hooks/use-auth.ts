'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RegisterDto } from '@/types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchUser,
    setUser,
    clearError,
  } = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    if (!user && isAuthenticated) {
      fetchUser();
    }
  }, [user, isAuthenticated, fetchUser]);

  const loginWithRedirect = async (email: string, password: string) => {
    await login(email, password);
    router.push('/chat');
  };

  const registerWithRedirect = async (data: RegisterDto) => {
    await register(data);
    router.push('/chat');
  };

  const logoutWithRedirect = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginWithRedirect,
    register: registerWithRedirect,
    logout: logoutWithRedirect,
    fetchUser,
    setUser,
    clearError,
  };
}
