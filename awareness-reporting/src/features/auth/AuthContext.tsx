import React, { createContext, useState, useEffect } from 'react';
import type { AuthContextType, User } from '../../types';
import { authApi } from '../../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const restoredUser = authApi.restoreSession();
    if (restoredUser) {
      setUser(restoredUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const user = await authApi.login(email, password);
    setUser(user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
