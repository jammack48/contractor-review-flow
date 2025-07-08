
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'developer' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to validate role
const isValidRole = (role: string): role is 'admin' | 'developer' | 'user' => {
  return ['admin', 'developer', 'user'].includes(role);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Initializing auth...');
    
    // Check if we're in demo mode - if so, skip all auth
    // Remove all references to isDemoMode and demo mode logic in the component

    console.log('[AuthProvider] Live mode - setting up auth listeners');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state change:', event, session?.user?.email);
        
        if (session) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, role')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              // Validate and assign role with fallback
              const userRole = isValidRole(profile.role) ? profile.role : 'user';
              
              const authUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                username: profile.username || session.user.email || '',
                role: userRole
              };
              console.log('[AuthProvider] Setting user:', authUser);
              setUser(authUser);
              setSession(session);
            }
          } catch (error) {
            console.error('[AuthProvider] Error fetching profile:', error);
          }
        } else {
          console.log('[AuthProvider] No session - clearing user');
          setUser(null);
          setSession(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session check:', session?.user?.email || 'No session');
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthProvider] Attempting sign in for:', email);
    
    // Double check we're not in demo mode
    // Remove all references to isDemoMode and demo mode logic in the component

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AuthProvider] Sign in error:', error);
      throw error;
    }

    console.log('[AuthProvider] Sign in successful:', data.user?.email);
  };

  const signOut = async () => {
    console.log('[AuthProvider] Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthProvider] Sign out error:', error);
      throw error;
    }
    console.log('[AuthProvider] Sign out successful');
  };

  const value: AuthContextType = {
    user,
    session,
    signIn,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
