import { supabase, Profile } from './supabase';
import { AuthError, User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  profile?: Profile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role?: 'student' | 'teacher' | 'admin';
}

class AuthService {
  private cachedOrgId: string | null = null;
  private apiBaseUrl: string | null = process.env.EXPO_PUBLIC_API_BASE_URL ?? null;

  private serializeError(err: unknown): string {
    try {
      if (err instanceof Error) return `${err.name}: ${err.message}`;
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      console.log('Attempting to sign in with:', credentials.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Sign in error:', this.serializeError(error));
        return { user: null, error };
      }

      if (data.user) {
        const profile = await this.getUserProfile(data.user.id);
        const userWithProfile: AuthUser = {
          ...data.user,
          profile: profile || undefined,
        };

        console.log('Sign in successful:', { id: userWithProfile.id, email: userWithProfile.email });
        return { user: userWithProfile, error: null };
      }

      return { user: null, error: null };
    } catch (err) {
      console.error('Sign in exception:', this.serializeError(err));
      return { user: null, error: err as AuthError };
    }
  }

  async signInStudentSimple(credentials: LoginCredentials): Promise<{
    ok: boolean;
    token?: string;
    student?: any;
    ranking?: any;
    error?: string;
  }> {
    try {
      if (!this.apiBaseUrl) {
        console.warn('[auth] Missing EXPO_PUBLIC_API_BASE_URL env for student-simple auth');
        return { ok: false, error: 'Missing API base URL' };
      }

      const url = `${this.apiBaseUrl.replace(/\/$/, '')}/api/auth/student-simple`;
      console.log('[auth] Calling:', url);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('[auth] student-simple failed:', resp.status, txt);
        return { ok: false, error: `Auth failed (${resp.status})` };
      }

      const json = await resp.json();
      console.log('[auth] student-simple success for', credentials.email);
      return {
        ok: true,
        token: json.token as string | undefined,
        student: json.student,
        ranking: json.ranking,
      };
    } catch (err) {
      console.error('[auth] student-simple exception:', this.serializeError(err));
      return { ok: false, error: 'Unexpected error' };
    }
  }

  async signUp(userData: SignUpData): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      console.log('Attempting to sign up with:', userData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role || 'student',
          },
        },
      });

      if (error) {
        console.error('Sign up error:', this.serializeError(error));
        return { user: null, error };
      }

      if (data.user) {
        // Do not proceed with profile creation until email is confirmed
        console.log('Sign up pending email confirmation');
        return { user: data.user as AuthUser, error: null };
      }

      return { user: null, error: null };
    } catch (err) {
      console.error('Sign up exception:', this.serializeError(err));
      return { user: null, error: err as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      console.log('Sign out successful');
      return { error: null };
    } catch (err) {
      console.error('Sign out exception:', err);
      return { error: err as AuthError };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('No current user found');
        return null;
      }

      const profile = await this.getUserProfile(user.id);
      const userWithProfile: AuthUser = {
        ...user,
        profile: profile || undefined,
      };
      
      console.log('Current user:', userWithProfile);
      return userWithProfile;
    } catch (err) {
      console.error('Get current user exception:', err);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get profile error:', this.serializeError(error));
        return null;
      }

      return data;
    } catch (err) {
      console.error('Get profile exception:', this.serializeError(err));
      return null;
    }
  }

  async createUserProfile(userId: string, profileData: Partial<Profile>): Promise<Profile | null> {
    try {
      const orgId = await this.getDefaultOrganizationId();
      if (!orgId) {
        console.error('Create profile error: No organization found');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          organization_id: orgId,
          ...profileData,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Create profile error:', this.serializeError(error));
        return null;
      }

      return data;
    } catch (err) {
      console.error('Create profile exception:', this.serializeError(err));
      return null;
    }
  }

  // Helper function to create test user (for development)
  async createTestUser(): Promise<{ user: AuthUser | null; error: any }> {
    try {
      console.log('Creating test user...');
      
      const testEmail = 'student@harryschool.com';
      const testPassword = 'HarrySchool2024!';

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test Student',
            role: 'student',
          },
        },
      });

      if (error) {
        console.error('Test user creation error:', this.serializeError(error));
        return { user: null, error };
      }

      if (data.user) {
        console.log('Test user sign-up pending email confirmation');
        return { user: data.user as AuthUser, error: null };
      }

      return { user: null, error: null };
    } catch (err) {
      console.error('Create test user exception:', this.serializeError(err));
      return { user: null, error: err };
    }
  }

  async createStudentRecord(userId: string, studentData: any): Promise<any> {
    try {
      const orgId = await this.getDefaultOrganizationId();
      if (!orgId) {
        console.error('Create student record error: No organization found');
        return null;
      }

      const { data, error } = await supabase
        .from('students')
        .upsert({
          id: userId,
          organization_id: orgId,
          date_of_birth: '2005-01-01',
          ...studentData,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Create student record error:', this.serializeError(error));
        return null;
      }

      return data;
    } catch (err) {
      console.error('Create student record exception:', this.serializeError(err));
      return null;
    }
  }

  async createInitialRanking(studentId: string): Promise<any> {
    try {
      const orgId = await this.getDefaultOrganizationId();
      if (!orgId) {
        console.error('Create initial ranking error: No organization found');
        return null;
      }

      const { data, error } = await supabase
        .from('student_rankings')
        .upsert({
          organization_id: orgId,
          student_id: studentId,
          total_points: 1250,
          available_coins: 125,
          spent_coins: 0,
          current_level: 12,
          current_rank: 1,
          last_activity_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,student_id' })
        .select()
        .single();

      if (error) {
        console.error('Create initial ranking error:', this.serializeError(error));
        return null;
      }

      return data;
    } catch (err) {
      console.error('Create initial ranking exception:', this.serializeError(err));
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Update profile exception:', err);
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);
        const userWithProfile: AuthUser = {
          ...session.user,
          profile: profile || undefined,
        };
        callback(userWithProfile);
      } else {
        callback(null);
      }
    });
  }

  async resendEmailConfirmation(email: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        console.error('Resend confirmation error:', this.serializeError(error));
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      console.error('Resend confirmation exception:', this.serializeError(err));
      return { ok: false, error: 'Unexpected error' };
    }
  }

  private async getDefaultOrganizationId(): Promise<string | null> {
    if (this.cachedOrgId) return this.cachedOrgId;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Get default organization error:', this.serializeError(error));
        return null;
      }
      const id = data?.id ?? null;
      this.cachedOrgId = id;
      return id;
    } catch (err) {
      console.error('Get default organization exception:', this.serializeError(err));
      return null;
    }
  }
}

export const authService = new AuthService();