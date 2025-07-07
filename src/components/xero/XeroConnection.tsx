
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Database, RefreshCw, Trash2, BarChart3 } from 'lucide-react';
import type { XeroConnection as XeroConnectionType } from '@/lib/xeroConnectionService';

interface XeroConnectionProps {
  isConnected: boolean;
  connection: XeroConnectionType | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  disabled?: boolean;
}

export const XeroConnection: React.FC<XeroConnectionProps> = ({
  isConnected,
  connection,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
  disabled = false
}) => {
  if (!isConnected) {
    return (
      <div className="text-center space-y-4">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            SIMPLIFIED PROCESSING: AI enhancement now uses simplified state management with timeout protection and circuit breaker patterns.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={onConnect} 
          disabled={isConnecting || disabled}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Connecting to Xero...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Connect to Xero (Simplified Processing)
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-green-800">Connected to Xero</div>
            <div className="text-sm text-green-600">{connection?.tenant_name}</div>
            {connection && (
              <div className="text-xs text-green-500">
                Auto-refresh: {new Date(connection.expires_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <BarChart3 className="h-3 w-3 mr-1" />
          Simplified
        </Badge>
      </div>

      <Button 
        onClick={onDisconnect}
        disabled={isDisconnecting || disabled}
        variant="outline"
        className="w-full"
      >
        {isDisconnecting ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Disconnecting...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Disconnect
          </>
        )}
      </Button>
    </div>
  );
};
