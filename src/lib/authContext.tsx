'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { UserProfile, UserPreferences } from '@/types';
import { storage } from './storage';
import { getBrowserClient } from './supabase/client';

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<AuthResult>;
  signUp: (email: string, password?: string, name?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial Session Check & onAuthStateChange Listener
  // Rule: Keep onAuthStateChange strictly synchronous to avoid deadlocks & race conditions
  useEffect(() => {
    const supabase = getBrowserClient();

    // Check active session on mount
    supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }; error: Error | null }) => {
      if (error) {
        console.error('Failed to get initial Supabase session:', error.message);
      }
      const session = data?.session;
      if (session?.user) {
        storage.setActiveUser(session.user.id);
        setSessionUser(session.user);
        setIsAuthenticated(true);
      } else {
        storage.setActiveUser(null);
        setSessionUser(null);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
    });

    // Subscribe to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      // Synchronous state updates only inside callback
      if (session?.user) {
        storage.setActiveUser(session.user.id);
        setSessionUser(session.user);
        setIsAuthenticated(true);
      } else {
        storage.setActiveUser(null);
        setSessionUser(null);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Profile Sync Effect: triggered asynchronously whenever sessionUser changes
  useEffect(() => {
    if (!sessionUser) {
      return;
    }

    let isMounted = true;
    const supabase = getBrowserClient();

    async function loadUserProfile() {
      try {
        const { data: profileRow, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser!.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.warn('Notice fetching profile from Supabase profiles table:', error.message);
        }

        const localProfile = storage.getProfile(sessionUser!.id);
        const displayName =
          profileRow?.name ||
          (sessionUser!.user_metadata?.name as string | undefined) ||
          sessionUser!.email?.split('@')[0] ||
          localProfile.name ||
          'Focus Builder';

        const preferences: UserPreferences = {
          soundEnabled: profileRow?.sound_enabled ?? localProfile.preferences.soundEnabled ?? true,
          autoStartBreak: profileRow?.auto_start_break ?? localProfile.preferences.autoStartBreak ?? true,
          autoStartNextTask: profileRow?.auto_start_next_task ?? localProfile.preferences.autoStartNextTask ?? false,
          defaultWorkDurationMinutes:
            profileRow?.default_work_duration_minutes ??
            localProfile.preferences.defaultWorkDurationMinutes ??
            25,
          defaultBreakDurationMinutes:
            profileRow?.default_break_duration_minutes ??
            localProfile.preferences.defaultBreakDurationMinutes ??
            5,
          themePreference:
            profileRow?.theme_preference ??
            localProfile.preferences.themePreference ??
            'Dark Focus Studio',
        };

        const fullProfile: UserProfile = {
          id: sessionUser!.id,
          email: sessionUser!.email || localProfile.email || '',
          name: displayName,
          avatarUrl: profileRow?.avatar_url || undefined,
          preferences,
          totalFocusedMinutes: localProfile.totalFocusedMinutes || 0,
          completedMiniTasksCount: localProfile.completedMiniTasksCount || 0,
        };

        setUser(fullProfile);
        storage.saveProfile(fullProfile);
        storage.setAuthSession({ email: fullProfile.email, name: fullProfile.name });
      } catch (err) {
        console.error('Error synchronizing user profile:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [sessionUser]);

  // Sign In with Supabase credentials
  const signIn = async (email: string, password?: string): Promise<AuthResult> => {
    setIsLoading(true);
    const supabase = getBrowserClient();

    if (!password) {
      setIsLoading(false);
      return { success: false, error: 'Password is required to sign in.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        storage.setActiveUser(data.user.id);
        setSessionUser(data.user);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
      return { success: false, error: message };
    }
  };

  // Sign Up with Supabase
  const signUp = async (email: string, password?: string, name?: string): Promise<AuthResult> => {
    setIsLoading(true);
    const supabase = getBrowserClient();

    if (!password) {
      setIsLoading(false);
      return { success: false, error: 'Password is required to create an account.' };
    }

    try {
      const trimmedName = name?.trim() || 'Focus Builder';
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: trimmedName,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.session?.user) {
        storage.setActiveUser(data.session.user.id);
        setSessionUser(data.session.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      // If email confirmation is required by Supabase project settings
      if (data.user && !data.session) {
        setIsLoading(false);
        return {
          success: true,
          message: 'Account created! Please check your email to confirm your account before logging in.',
        };
      }

      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign up.';
      return { success: false, error: message };
    }
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    const supabase = getBrowserClient();

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      storage.setActiveUser(null);
      setSessionUser(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      storage.clearAuthSession();
      router.push('/sign-in');
    }
  };

  // Update profile attributes (RLS: authenticated user updates only their own record)
  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user || !sessionUser) return;

    const updated: UserProfile = { ...user, ...updates };
    setUser(updated);
    storage.saveProfile(updated);
    storage.setAuthSession({ email: updated.email, name: updated.name });

    const supabase = getBrowserClient();
    const dbUpdates: Record<string, string | null> = {};

    if (updates.name !== undefined) {
      dbUpdates.name = updates.name.trim();
    }
    if (updates.avatarUrl !== undefined) {
      dbUpdates.avatar_url = updates.avatarUrl;
    }

    if (Object.keys(dbUpdates).length > 0) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', sessionUser.id);

        if (error) {
          console.error('Failed to persist profile update to Supabase:', error.message);
        }
      } catch (err) {
        console.error('Failed to update profile:', err);
      }
    }

    if (updates.name && updates.name.trim()) {
      try {
        await supabase.auth.updateUser({
          data: { name: updates.name.trim() },
        });
      } catch {
        // Ignored if user metadata update is unpermitted
      }
    }
  };

  // Update preferences (RLS: authenticated user updates only their own record)
  const updatePreferences = async (
    prefUpdates: Partial<UserProfile['preferences']>
  ): Promise<void> => {
    if (!user || !sessionUser) return;

    const updatedPrefs: UserPreferences = { ...user.preferences, ...prefUpdates };
    const updated: UserProfile = { ...user, preferences: updatedPrefs };
    setUser(updated);
    storage.saveProfile(updated);

    const supabase = getBrowserClient();
    const dbUpdates: Record<string, boolean | number | string> = {};

    if (prefUpdates.soundEnabled !== undefined) {
      dbUpdates.sound_enabled = prefUpdates.soundEnabled;
    }
    if (prefUpdates.autoStartBreak !== undefined) {
      dbUpdates.auto_start_break = prefUpdates.autoStartBreak;
    }
    if (prefUpdates.autoStartNextTask !== undefined) {
      dbUpdates.auto_start_next_task = prefUpdates.autoStartNextTask;
    }
    if (prefUpdates.defaultWorkDurationMinutes !== undefined) {
      dbUpdates.default_work_duration_minutes = prefUpdates.defaultWorkDurationMinutes;
    }
    if (prefUpdates.defaultBreakDurationMinutes !== undefined) {
      dbUpdates.default_break_duration_minutes = prefUpdates.defaultBreakDurationMinutes;
    }
    if (prefUpdates.themePreference !== undefined) {
      dbUpdates.theme_preference = prefUpdates.themePreference;
    }

    if (Object.keys(dbUpdates).length > 0) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', sessionUser.id);

        if (error) {
          console.error('Failed to persist preferences update to Supabase:', error.message);
        }
      } catch (err) {
        console.error('Failed to update preferences:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
