
import { supabase } from '@/integrations/supabase/client';

export interface XeroConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  tenant_id: string;
  tenant_name: string;
  expires_at: string;
  refresh_expires_at: string;
  created_at: string;
  updated_at: string;
}

export const getXeroConnection = async (): Promise<XeroConnection | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('xero_connections')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No connection found
      return null;
    }
    throw new Error(`Failed to get Xero connection: ${error.message}`);
  }

  return data;
};

export const isTokenExpired = (connection: XeroConnection): boolean => {
  const now = new Date();
  const expiresAt = new Date(connection.expires_at);
  
  // Check if token expires within the next 5 minutes
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  return expiresAt <= fiveMinutesFromNow;
};

export const isRefreshTokenExpired = (connection: XeroConnection): boolean => {
  const now = new Date();
  const refreshExpiresAt = new Date(connection.refresh_expires_at);
  
  return refreshExpiresAt <= now;
};

export const refreshXeroToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('xero-token-refresh', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(`Token refresh failed: ${data.error}`);
  }

  return data.accessToken;
};

export const getValidAccessToken = async (): Promise<{ accessToken: string; tenantId: string } | null> => {
  const connection = await getXeroConnection();
  
  if (!connection) {
    return null;
  }

  if (isRefreshTokenExpired(connection)) {
    // Refresh token is expired, need to re-authorize
    return null;
  }

  if (isTokenExpired(connection)) {
    // Access token is expired, refresh it
    try {
      const newAccessToken = await refreshXeroToken();
      return {
        accessToken: newAccessToken,
        tenantId: connection.tenant_id
      };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return {
    accessToken: connection.access_token,
    tenantId: connection.tenant_id
  };
};

export const deleteXeroConnection = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('xero_connections')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete Xero connection: ${error.message}`);
  }
};
