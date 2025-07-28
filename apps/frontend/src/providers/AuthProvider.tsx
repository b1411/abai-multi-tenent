import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { AuthContext, AuthContextType, UserRole, UserPermission } from '../contexts/AuthContext';
import { User, LoginDto } from '../types/api';
import authService from '../services/authService';
import rbacService from '../services/rbacService';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

  const loadUserPermissions = useCallback(async (userId: number) => {
    try {
      console.log(`🔄 AuthProvider: Загрузка разрешений для пользователя ${userId}`);
      const roles = await rbacService.getUserRoles(userId);
      const permissions = rbacService.extractPermissionsFromRoles(roles);
      
      console.log(`👥 AuthProvider: Загружено ролей: ${roles.length}`, roles.map(r => r.name));
      console.log(`🔐 AuthProvider: Извлечено разрешений: ${permissions.length}`, 
        permissions.map(p => `${p.module}:${p.action}:${p.scope}`)
      );
      
      setUserRoles(roles);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('❌ AuthProvider: Ошибка загрузки разрешений:', error);
      setUserRoles([]);
      setUserPermissions([]);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        authService.initializeFromStorage();
        const savedUser = authService.getUser();
        if (savedUser && authService.isAuthenticated()) {
          setUser(savedUser);
          // Загружаем разрешения пользователя
          await loadUserPermissions(savedUser.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [loadUserPermissions]);

  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      
      // Загружаем разрешения после успешного входа
      await loadUserPermissions(response.user.id);
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
    setUserRoles([]);
    setUserPermissions([]);
  };

  const hasRole = (role: User['role']): boolean => {
    return authService.hasRole(role);
  };

  const hasAnyRole = (roles: User['role'][]): boolean => {
    return authService.hasAnyRole(roles);
  };

  const hasPermission = (
    module: string, 
    action: string, 
    options?: {
      resource?: string;
      scope?: string;
    }
  ): boolean => {
    return rbacService.hasPermission(userPermissions, module, action, options);
  };

  const hasAnyPermission = (permissions: Array<{
    module: string;
    action: string;
    resource?: string;
    scope?: string;
  }>): boolean => {
    return rbacService.hasAnyPermission(userPermissions, permissions);
  };

  const refreshPermissions = async (): Promise<void> => {
    if (user) {
      await loadUserPermissions(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    userRoles,
    userPermissions,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    refreshPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
