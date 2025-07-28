import { createContext } from 'react';
import { User, LoginDto } from '../types/api';

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: UserPermission[];
  assignedAt: string;
  expiresAt?: string;
  context?: any;
}

export interface UserPermission {
  id: string;
  module: string;
  action: string;
  resource?: string;
  scope: 'ALL' | 'OWN' | 'GROUP' | 'DEPARTMENT' | 'ASSIGNED';
  description?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRoles: UserRole[];
  userPermissions: UserPermission[];
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  hasRole: (role: User['role']) => boolean;
  hasAnyRole: (roles: User['role'][]) => boolean;
  hasPermission: (module: string, action: string, options?: {
    resource?: string;
    scope?: string;
  }) => boolean;
  hasAnyPermission: (permissions: Array<{
    module: string;
    action: string;
    resource?: string;
    scope?: string;
  }>) => boolean;
  refreshPermissions: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
