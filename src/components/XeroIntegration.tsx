
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, MessageSquare } from 'lucide-react';
import { XeroConnection } from '@/components/xero/XeroConnection';
import { XeroSyncControl } from '@/components/xero/XeroSyncControl';
import { useXeroConnection } from '@/hooks/useXeroConnection';
import { useXeroSync } from '@/hooks/useXeroSync';
import SmsBalanceCard from '@/components/SmsBalanceCard';

const XeroIntegration: React.FC = () => {
  const { connection, isConnected, isConnecting, isDisconnecting, connect, disconnect } = useXeroConnection();
  const { syncState, isSyncing, startSync, continueSync } = useXeroSync();

  return (
    <div className="space-y-6">
      {/* Xero Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Xero Integration
          </CardTitle>
          <CardDescription>
            Connect to your Xero account to import customer and invoice data for review campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <XeroConnection
            isConnected={isConnected}
            connection={connection}
            isConnecting={isConnecting}
            isDisconnecting={isDisconnecting}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </CardContent>
      </Card>

      {/* Data Sync - Only show when connected */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Data Import</CardTitle>
            <CardDescription>
              Import customer and invoice data from Xero for your review campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <XeroSyncControl
              syncState={syncState}
              isSyncing={isSyncing}
              onStartSync={startSync}
              onContinueSync={continueSync}
            />
          </CardContent>
        </Card>
      )}

      {/* SMS Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Configuration
          </CardTitle>
          <CardDescription>
            Check your SMS balance and manage review request campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmsBalanceCard />
        </CardContent>
      </Card>
    </div>
  );
};

export default XeroIntegration;
