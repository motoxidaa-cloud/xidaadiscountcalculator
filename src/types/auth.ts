export type UserRole = 'admin' | 'manager' | 'sales_rep';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
  avatarUrl?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
}
