
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface XeroConnection {
  id: string;
  user_id: string;
  tenant_id: string;
  tenant_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const useXeroConnection = () => {
  const [connection, setConnection] = useState<XeroConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      console.log('Starting Xero connection...');
      
      // Call the Xero auth edge function
      const { data, error } = await supabase.functions.invoke('xero-auth', {
        body: { action: 'connect' }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to connect to Xero');
      }
      
      if (data?.authUrl) {
        // Redirect to Xero for authentication
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Xero connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect to Xero',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      console.log('Disconnecting from Xero...');
      
      // Call the disconnect endpoint
      const { error } = await supabase.functions.invoke('xero-auth', {
        body: { action: 'disconnect' }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to disconnect from Xero');
      }
      
      setConnection(null);
      setIsConnected(false);
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Xero",
      });
    } catch (error) {
      console.error('Xero disconnect error:', error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : 'Failed to disconnect from Xero',
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  return {
    connection,
    isConnected,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect
  };
};
