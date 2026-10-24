import { createContext, useContext } from 'react';
import type { UserProfile } from '../types/auth';

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  mustChangePassword: boolean;
  login: (loginId: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  dismissMustChangePassword: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isSalesRep: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
