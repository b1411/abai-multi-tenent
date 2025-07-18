import React, { useEffect, useState, ReactNode } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { User, LoginDto } from '../types/api';
import authService from '../services/authService';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        authService.initializeFromStorage();
        const savedUser = authService.getUser();
        if (savedUser && authService.isAuthenticated()) {
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (role: User['role']): boolean => {
    return authService.hasRole(role);
  };

  const hasAnyRole = (roles: User['role'][]): boolean => {
    return authService.hasAnyRole(roles);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
