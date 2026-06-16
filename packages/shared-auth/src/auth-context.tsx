import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest } from '@shared/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  onLogin?: (data: LoginRequest) => Promise<User>;
  onRegister?: (data: RegisterRequest) => Promise<User>;
  onLogout?: () => Promise<void>;
  onGetProfile?: () => Promise<User>;
}

export function AuthProvider({
  children,
  initialUser = null,
  onLogin,
  onRegister,
  onLogout,
  onGetProfile,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (onGetProfile) {
      onGetProfile()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [onGetProfile]);

  const login = useCallback(async (data: LoginRequest) => {
    if (!onLogin) throw new Error('Login handler not provided');
    const loggedInUser = await onLogin(data);
    setUser(loggedInUser);
  }, [onLogin]);

  const register = useCallback(async (data: RegisterRequest) => {
    if (!onRegister) throw new Error('Register handler not provided');
    const registeredUser = await onRegister(data);
    setUser(registeredUser);
  }, [onRegister]);

  const logout = useCallback(async () => {
    try {
      await onLogout?.();
    } finally {
      setUser(null);
    }
  }, [onLogout]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
