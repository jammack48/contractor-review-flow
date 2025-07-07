
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginScreen from './LoginScreen';
import { supabase, projectRef } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demoConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'developer' | 'user')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['admin', 'developer', 'user']
}) => {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);

  // Check if we're in demo mode first - if so, bypass all authentication
  if (isDemoMode()) {
    console.log('[ProtectedRoute] Demo mode detected - bypassing authentication');
    return <>{children}</>;
  }

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (loading) {
      timer = setTimeout(() => setTimedOut(true), 60000);
    } else {
      setTimedOut(false);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading]);

  const clearSupabaseIndexedDb = async () => {
    try {
      if (window.indexedDB?.databases) {
        const dbs = await indexedDB.databases();
        dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
      }
      indexedDB.deleteDatabase(`sb-${projectRef}-auth-token`);
    } catch (e) {}
  };

  const clearAllStorage = async () => {
    // Clear all localStorage and sessionStorage
    try {
      localStorage.removeItem(`sb-${projectRef}-auth-token`);
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    // Remove all cookies
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split("; ");
      for (const c of cookies) {
        const d = window.location.hostname.split(".");
        while (d.length > 0) {
          const cookieBase = encodeURIComponent(c.split(";")[0].split("=")[0]);
          const domain = d.join(".");
          document.cookie = `${cookieBase}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/`;
          d.shift();
        }
      }
    }
    await clearSupabaseIndexedDb();
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await clearAllStorage();
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Retry failed:', error);
      window.location.reload();
    }
  };

  console.log('[ProtectedRoute] render - loading:', loading, 'user:', user);

  if (loading) {
    if (timedOut) {
      console.log('[ProtectedRoute] Authentication timed out');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Authentication timed out</p>
            <button
              onClick={handleRetry}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
              disabled={retrying}
            >
              {retrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        </div>
      );
    }

    console.log('[ProtectedRoute] Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-green-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to login');
    return <LoginScreen />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] User role not allowed:', user.role);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
