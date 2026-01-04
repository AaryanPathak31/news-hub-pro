import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/async';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roles, error } = await withTimeout(
        supabase.from('user_roles').select('role').eq('user_id', userId),
        8_000,
        'Role check timed out'
      );

      if (error) return;

      if (roles) {
        setIsAdmin(roles.some((r) => r.role === 'admin'));
        setIsEditor(roles.some((r) => r.role === 'editor' || r.role === 'admin'));
      }
    } catch {
      // Ignore role errors (keeps app usable even if backend is temporarily unavailable)
    }
  };

  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      setLoading(false);
    }, 5_000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsEditor(false);
      }
    });

    withTimeout(supabase.auth.getSession(), 5_000, 'Session init timed out')
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        }
      })
      .catch(() => {
        setLoading(false);
      })
      .finally(() => {
        window.clearTimeout(safetyTimer);
      });

    return () => {
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        12_000,
        'Login timed out'
      );
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName },
          },
        }),
        12_000,
        'Signup timed out'
      );
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 10_000, 'Sign out timed out');
    } finally {
      setIsAdmin(false);
      setIsEditor(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isEditor, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

