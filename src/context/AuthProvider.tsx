import React, { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/auth';
import { AuthContext } from './AuthContext';

const LOCAL_STORAGE_OFFLINE_USER_KEY = 'xidaa_auth_offline_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();

  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check local session cache for fast hydration
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_OFFLINE_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => isConfigured);

  const loadUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile && !error) {
        const profileObj: UserProfile = {
          id: userId,
          email,
          username: profile.username || email.split('@')[0],
          fullName: profile.full_name || 'Xidaa Commercial Officer',
          role: profile.role as UserRole,
          mustChangePassword: Boolean(profile.must_change_password),
          avatarUrl: profile.avatar_url,
          phone: profile.phone,
        };
        setUser(profileObj);
        localStorage.setItem(LOCAL_STORAGE_OFFLINE_USER_KEY, JSON.stringify(profileObj));
      } else {
        const fallbackProfile: UserProfile = {
          id: userId,
          email,
          username: email.split('@')[0],
          fullName: 'Xidaa Commercial Officer',
          role: 'admin',
          mustChangePassword: false,
        };
        setUser(fallbackProfile);
        localStorage.setItem(LOCAL_STORAGE_OFFLINE_USER_KEY, JSON.stringify(fallbackProfile));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Load active session from Supabase on mount
  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase getSession warning:', error.message);
        }

        if (session && session.user && isMounted) {
          await loadUserProfile(session.user.id, session.user.email || '');
        } else if (isMounted) {
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session && session.user) {
        await loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_OFFLINE_USER_KEY);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isConfigured, loadUserProfile]);

  /**
   * Log In Handler
   */
  const login = async (
    loginId: string, 
    password: string, 
    _rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // If Supabase is configured, authenticate against Supabase Auth
      if (isConfigured) {
        const email = loginId.includes('@') ? loginId : `${loginId}@xidaamoto.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          await loadUserProfile(data.user.id, data.user.email || email);
          setIsLoading(false);
          return { success: true };
        }
      }

      // If Supabase credentials are not yet set in .env: Provide seamless sandbox / demo authentication
      const isDemoAdmin = loginId.toLowerCase().includes('admin') || loginId === 'xidaa';
      const role: UserRole = isDemoAdmin ? 'admin' : 'sales_rep';
      const email = loginId.includes('@') ? loginId : `${loginId}@xidaamoto.com`;

      const sandboxUser: UserProfile = {
        id: `local-usr-${Date.now()}`,
        email,
        username: loginId.replace('@xidaamoto.com', ''),
        fullName: isDemoAdmin ? 'Xidaa Chief Administrator (Local Session)' : 'Xidaa Commercial Officer',
        role,
        mustChangePassword: false,
      };

      setUser(sandboxUser);
      localStorage.setItem(LOCAL_STORAGE_OFFLINE_USER_KEY, JSON.stringify(sandboxUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login encountered an unexpected error.' };
    }
  };

  /**
   * Log Out Handler
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch {
      // continue
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_OFFLINE_USER_KEY);
      setIsLoading(false);
    }
  };

  /**
   * Change Password (for forced first-time change or security update)
   */
  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      if (isConfigured) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };

        if (user?.id) {
          await supabase
            .from('profiles')
            .update({ must_change_password: false, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      }

      if (user) {
        const updated = { ...user, mustChangePassword: false };
        setUser(updated);
        localStorage.setItem(LOCAL_STORAGE_OFFLINE_USER_KEY, JSON.stringify(updated));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const dismissMustChangePassword = () => {
    if (user) {
      const updated = { ...user, mustChangePassword: false };
      setUser(updated);
      localStorage.setItem(LOCAL_STORAGE_OFFLINE_USER_KEY, JSON.stringify(updated));
    }
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const isSalesRep = user?.role === 'sales_rep';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured,
        mustChangePassword: Boolean(user?.mustChangePassword),
        login,
        logout,
        changePassword,
        dismissMustChangePassword,
        isAdmin,
        isManager,
        isSalesRep,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
