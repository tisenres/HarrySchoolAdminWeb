import createContextHook from '@nkzw/create-context-hook';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseEnabled } from '@/lib/supabase';

const JOHN_EMAIL = 'john.smith@harry-school.test';
const DEMO_EMAILS = [JOHN_EMAIL, 'student@harryschool.com', 'demo@harry-school.test'];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiBase] = useState<string | null>(process.env.EXPO_PUBLIC_API_BASE_URL ?? null);

  const { user, authUser, isAuthenticated, setAuthUser, setUser } = useAuthStore();

  const setDemoUser = useCallback(async (email: string) => {
    const mapped: User = {
      id: '00000000-0000-0000-0000-000000000002',
      email,
      full_name: email === JOHN_EMAIL ? 'John Smith' : 'Test Student',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      points: 1250,
      coins: 125,
      level: 12,
      rank: 1,
      streak_days: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAuthUser({ id: mapped.id, email: mapped.email });
    setUser(mapped);
    try {
      await AsyncStorage.multiSet([
        ['auth_token', 'demo-token'],
        ['auth_mode', 'demo'],
        ['last_email', email],
      ]);
    } catch {}
  }, [setAuthUser, setUser]);

  const signIn = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      if (apiBase) {
        const apiLogin = await authService.signInStudentSimple(credentials);
        if (apiLogin.ok && apiLogin.student) {
          const s = apiLogin.student as Record<string, unknown>;
          const r = (apiLogin.ranking as Record<string, unknown>) ?? {};
          const mapped: User = {
            id: String(s.id ?? (s as any).student_id ?? 'unknown'),
            email: String((s as any).email ?? credentials.email ?? ''),
            full_name: String((s as any).full_name ?? `${(s as any).first_name ?? 'Student'} ${(s as any).last_name ?? ''}`.trim()),
            avatar_url: String((s as any).profile_image_url ?? ''),
            points: Number((r as any).total_points ?? 0),
            coins: Number((r as any).available_coins ?? 0),
            level: Number((r as any).current_level ?? 1),
            rank: Number((r as any).current_rank ?? 0),
            streak_days: Number((s as any).streak_days ?? 0),
            created_at: String((s as any).created_at ?? new Date().toISOString()),
            updated_at: String((s as any).updated_at ?? new Date().toISOString()),
          };
          setAuthUser({ id: mapped.id, email: mapped.email });
          setUser(mapped);
          try {
            await AsyncStorage.multiSet([
              ['auth_token', apiLogin.token ?? 'api-token'],
              ['auth_mode', 'api'],
              ['last_email', mapped.email ?? ''],
            ]);
          } catch {}
          return true;
        }
      }

      if (isSupabaseEnabled) {
        const { user: authUserResp } = await authService.signIn(credentials);
        if (authUserResp) {
          setAuthUser({ id: authUserResp.id, email: authUserResp.email ?? undefined });
          try {
            await AsyncStorage.multiSet([
              ['auth_token', 'supabase-token'],
              ['auth_mode', 'supabase'],
              ['last_email', authUserResp.email ?? ''],
            ]);
          } catch {}
          return true;
        }
      }

      if (DEMO_EMAILS.includes(credentials.email)) {
        await setDemoUser(credentials.email);
        return true;
      }

      if (!apiBase && !isSupabaseEnabled) {
        await setDemoUser(credentials.email || JOHN_EMAIL);
        return true;
      } else {
        setError('Authentication failed');
      }
      return false;
    } catch (e) {
      if (DEMO_EMAILS.includes(credentials.email) || (!apiBase && !isSupabaseEnabled)) {
        await setDemoUser(credentials.email || JOHN_EMAIL);
        return true;
      }
      setError('Unexpected error during sign in');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, setAuthUser, setUser, setDemoUser]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      if (isSupabaseEnabled) {
        await authService.signOut();
      }
      try { await AsyncStorage.multiRemove(['auth_token', 'auth_mode', 'last_email']); } catch {}
      setAuthUser(null);
      setUser(null);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [setAuthUser, setUser]);

  useEffect(() => {
    const restore = async () => {
      try {
        const [[, token], [, mode], [, lastEmail]] = await AsyncStorage.multiGet(['auth_token', 'auth_mode', 'last_email']);
        if (token) {
          if (mode === 'demo') {
            await setDemoUser(lastEmail || JOHN_EMAIL);
          } else {
            if (apiBase) {
              await setDemoUser(lastEmail || JOHN_EMAIL);
            } else {
              await setDemoUser(lastEmail || JOHN_EMAIL);
            }
          }
        }
      } catch (e) {
        setError('Failed to restore session');
      } finally {
        setIsLoading(false);
      }
    };
    void restore();
  }, [apiBase, setDemoUser]);

  return useMemo(() => ({
    user,
    authUser,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
  }), [user, authUser, isAuthenticated, isLoading, error, signIn, signOut]);
});