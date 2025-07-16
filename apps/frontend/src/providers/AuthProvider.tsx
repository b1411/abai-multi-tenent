import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService, { User, LoginResponse } from '../api/authService';
import { LoginDto } from '../api/Api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  hasRole: (role: User['role']) => boolean;
  hasAnyRole: (roles: User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Инициализация при загрузке приложения
    const initializeAuth = () => {
      try {
        authService.initializeFromStorage();
        const savedUser = authService.getUser();
        if (savedUser && authService.isAuthenticated()) {
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Очищаем некорректные данные
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
      const response: LoginResponse = await authService.login(credentials);
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
