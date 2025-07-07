
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDevConsole } from '@/hooks/useDevConsole';
import { XeroConnection } from './xero/XeroConnection';
import { XeroSyncControl } from './xero/XeroSyncControl';
import { XeroProgressDisplay } from './xero/XeroProgressDisplay';
import { supabase } from '@/integrations/supabase/client';
import { getXeroConnection, deleteXeroConnection, getValidAccessToken } from '@/lib/xeroConnectionService';
import type { XeroConnection as XeroConnectionType } from '@/lib/xeroConnectionService';
import { toast } from '@/components/ui/use-toast';

interface XeroIntegrationProps {
  devConsole?: ReturnType<typeof useDevConsole>;
  onDataImported?: () => void;
  xeroConnection: XeroConnectionType | null;
  isXeroConnected: boolean;
  isCheckingXeroConnection: boolean;
  onXeroConnectionChange: (connection: XeroConnectionType | null, connected: boolean) => void;
}

interface SyncState {
  hasMore: boolean;
  nextStartPage: number;
  nextInvoicePage: number;
  totalCustomers: number;
  totalInvoices: number;
}

const XeroIntegration: React.FC<XeroIntegrationProps> = ({ 
  devConsole, 
  onDataImported,
  xeroConnection,
  isXeroConnected,
  isCheckingXeroConnection,
  onXeroConnectionChange
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [syncState, setSyncState] = useState<SyncState>({
    hasMore: false,
    nextStartPage: 1,
    nextInvoicePage: 1,
    totalCustomers: 0,
    totalInvoices: 0
  });

  // Fixed: Remove automatic AI extraction on mount to prevent infinite loops
  useEffect(() => {
    console.log('[XERO-INTEGRATION] Component mounted, auto-extraction disabled to prevent loops');
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    devConsole?.addLog('info', '🔗 Starting Xero connection...', null, 'xero');
    
    const redirectUri = `${window.location.origin}/xero-callback`;
    const clientId = "8a6c5fb7-b2ef-4ad4-8fc7-bc5b5b6f4f77";
    const scope = "accounting.transactions accounting.contacts accounting.settings";
    
    const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=xero_auth`;
    
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!xeroConnection) return;
    
    setIsDisconnecting(true);
    devConsole?.addLog('info', '🔌 Disconnecting from Xero...', null, 'xero');
    
    try {
      await deleteXeroConnection();
      onXeroConnectionChange(null, false);
      
      devConsole?.addLog('success', '✅ Disconnected from Xero successfully', null, 'xero');
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Xero.",
      });
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      devConsole?.addLog('error', `❌ Disconnect failed: ${error.message}`, error, 'xero');
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const performSync = async (startCustomerPage = 1, startInvoicePage = 1) => {
    console.log(`🚀 [XERO-SYNC] Starting sync from customer page ${startCustomerPage}, invoice page ${startInvoicePage}...`);
    
    // Get a valid access token (will refresh if needed)
    const tokenData = await getValidAccessToken();
    
    if (!tokenData) {
      devConsole?.addLog('error', '❌ Unable to get valid Xero access token. Please reconnect to Xero.', null, 'xero');
      throw new Error('Unable to get valid Xero access token. Please reconnect to Xero.');
    }

    const { data, error } = await supabase.functions.invoke('xero-sync', {
      body: { 
        accessToken: tokenData.accessToken,
        tenantId: tokenData.tenantId,
        startCustomerPage,
        startInvoicePage,
        maxCustomerPages: 50, // Process up to 50 pages per chunk
        maxInvoicePages: 50
      }
    });

    if (error) {
      console.error('❌ [XERO-SYNC] Sync failed:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }

    return data;
  };

  const handleStartSync = async () => {
    if (!xeroConnection || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress([]);
    setCurrentPhase('Starting fresh sync...');
    
    // Reset sync state for fresh start
    setSyncState({
      hasMore: false,
      nextStartPage: 1,
      nextInvoicePage: 1,
      totalCustomers: 0,
      totalInvoices: 0
    });

    devConsole?.addLog('info', '🚀 Starting fresh Xero data sync...', null, 'xero');

    try {
      await performFullSync(1, 1);
    } catch (error: any) {
      console.error('Sync failed:', error);
      devConsole?.addLog('error', `❌ Sync failed: ${error.message}`, error, 'xero');
      
      // Check if it's a token issue and suggest reconnection
      if (error.message.includes('access token')) {
        toast({
          title: "Authentication Required",
          description: "Your Xero connection has expired. Please disconnect and reconnect to Xero.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sync Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsSyncing(false);
      setCurrentPhase('');
    }
  };

  const handleContinueSync = async () => {
    if (!xeroConnection || isSyncing || !syncState.hasMore) return;

    setIsSyncing(true);
    setCurrentPhase('Continuing sync...');

    try {
      await performFullSync(syncState.nextStartPage, syncState.nextInvoicePage);
    } catch (error: any) {
      console.error('Continue sync failed:', error);
      devConsole?.addLog('error', `❌ Continue sync failed: ${error.message}`, error, 'xero');
      
      // Check if it's a token issue and suggest reconnection
      if (error.message.includes('access token')) {
        toast({
          title: "Authentication Required",
          description: "Your Xero connection has expired. Please disconnect and reconnect to Xero.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Continue Sync Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsSyncing(false);
      setCurrentPhase('');
    }
  };

  const performFullSync = async (startCustomerPage: number, startInvoicePage: number) => {
    let currentCustomerPage = startCustomerPage;
    let currentInvoicePage = startInvoicePage;
    let cumulativeCustomers = syncState.totalCustomers;
    let cumulativeInvoices = syncState.totalInvoices;
    let chunkCount = 0;

    while (true) {
      chunkCount++;
      setCurrentPhase(`Processing chunk ${chunkCount}... (Customer page: ${currentCustomerPage}, Invoice page: ${currentInvoicePage})`);
      
      console.log(`🔄 [XERO-SYNC] Starting chunk ${chunkCount}...`);
      
      const result = await performSync(currentCustomerPage, currentInvoicePage);
      
      if (!result) {
        throw new Error('No data returned from sync function');
      }

      // Update progress log
      if (result.progress) {
        setSyncProgress(prev => [...prev, ...result.progress]);
      }

      // Update cumulative totals
      cumulativeCustomers += result.totalCustomers || 0;
      cumulativeInvoices += result.totalInvoices || 0;

      // Update sync state
      setSyncState({
        hasMore: result.hasMore || false,
        nextStartPage: result.nextStartPage || currentCustomerPage,
        nextInvoicePage: result.nextInvoicePage || currentInvoicePage,
        totalCustomers: cumulativeCustomers,
        totalInvoices: cumulativeInvoices
      });

      console.log(`📊 [XERO-SYNC] Chunk ${chunkCount} complete:`, {
        chunkCustomers: result.totalCustomers,
        chunkInvoices: result.totalInvoices,
        cumulativeCustomers,
        cumulativeInvoices,
        hasMore: result.hasMore
      });

      // Log chunk completion
      devConsole?.addLog('info', `✅ Chunk ${chunkCount} complete: +${result.totalCustomers} customers, +${result.totalInvoices} invoices (Total: ${cumulativeCustomers} customers, ${cumulativeInvoices} invoices)`, result, 'xero');

      // If no more data, we're done
      if (!result.hasMore) {
        setCurrentPhase('Sync completed successfully!');
        devConsole?.addLog('success', `🎉 Complete sync finished! Total: ${cumulativeCustomers} customers and ${cumulativeInvoices} invoices imported`, result, 'xero');
        
        toast({
          title: "Sync Complete!",
          description: `Successfully imported ${cumulativeCustomers} customers and ${cumulativeInvoices} invoices from Xero.`,
        });

        if (onDataImported) {
          onDataImported();
        }
        break;
      }

      // Update for next iteration
      currentCustomerPage = result.nextStartPage || currentCustomerPage;
      currentInvoicePage = result.nextInvoicePage || currentInvoicePage;

      // Small delay between chunks to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Xero Integration</CardTitle>
        <CardDescription>
          Import customers and invoices from your Xero account with chunked processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <XeroConnection
          isConnected={isXeroConnected}
          connection={xeroConnection}
          isConnecting={isConnecting}
          isDisconnecting={isDisconnecting}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          disabled={isSyncing}
        />

        {isXeroConnected && (
          <>
            <XeroSyncControl
              syncState={syncState}
              isSyncing={isSyncing}
              onStartSync={handleStartSync}
              onContinueSync={handleContinueSync}
              disabled={isCheckingXeroConnection}
            />

            <XeroProgressDisplay
              isSyncing={isSyncing}
              isEnhancing={false}
              syncProgress={syncProgress}
              enhanceProgress={[]}
              currentPhase={currentPhase}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default XeroIntegration;
