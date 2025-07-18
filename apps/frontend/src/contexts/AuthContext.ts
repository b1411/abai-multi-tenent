import { createContext } from 'react';
import { User, LoginDto } from '../types/api';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  hasRole: (role: User['role']) => boolean;
  hasAnyRole: (roles: User['role'][]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
