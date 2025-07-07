
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Database, RefreshCw } from 'lucide-react';

interface SyncState {
  hasMore: boolean;
  nextStartPage: number;
  nextInvoicePage: number;
  totalCustomers: number;
  totalInvoices: number;
}

interface XeroSyncControlProps {
  syncState: SyncState;
  isSyncing: boolean;
  onStartSync: () => void;
  onContinueSync: () => void;
  disabled?: boolean;
}

export const XeroSyncControl: React.FC<XeroSyncControlProps> = ({
  syncState,
  isSyncing,
  onStartSync,
  onContinueSync,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      {syncState.hasMore && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            More data available to sync. Continue from customer page {syncState.nextStartPage}, invoice page {syncState.nextInvoicePage}.
            Total so far: {syncState.totalCustomers} customers, {syncState.totalInvoices} invoices.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button 
          onClick={onStartSync} 
          disabled={isSyncing || disabled}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Step 1: Start Import
            </>
          )}
        </Button>

        {syncState.hasMore && (
          <Button 
            onClick={onContinueSync} 
            disabled={isSyncing || disabled}
            variant="secondary"
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            Continue Import
          </Button>
        )}
      </div>
    </div>
  );
};
