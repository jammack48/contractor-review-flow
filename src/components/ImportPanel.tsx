
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import XeroIntegration from './XeroIntegration';
import CSVImport from './CSVImport';
import { useDevConsole } from '@/hooks/useDevConsole';
import { getXeroConnection } from '@/lib/xeroConnectionService';
import type { XeroConnection } from '@/lib/xeroConnectionService';

interface ImportPanelProps {
  devConsole?: ReturnType<typeof useDevConsole>;
  onDataImported?: () => void;
  xeroConnection: XeroConnection | null;
  isXeroConnected: boolean;
  isCheckingXeroConnection: boolean;
  onXeroConnectionChange: (connection: XeroConnection | null, connected: boolean) => void;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ 
  devConsole, 
  onDataImported,
  xeroConnection,
  isXeroConnected,
  isCheckingXeroConnection,
  onXeroConnectionChange
}) => {
  // Check Xero connection only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkXeroConnection = async () => {
      console.log('[IMPORT] 🔍 [XERO-CHECK] Checking Xero connection status...');
      
      try {
        const connection = await getXeroConnection();
        console.log('[IMPORT] 🔍 [XERO-CHECK] Connection check result:', !!connection);
        
        if (isMounted) {
          onXeroConnectionChange(connection, !!connection);
        }
      } catch (error) {
        console.error('[IMPORT] ❌ [XERO-CHECK] Failed to check connection:', error);
        if (isMounted) {
          onXeroConnectionChange(null, false);
        }
      }
    };

    // Only check if we haven't checked yet
    if (isCheckingXeroConnection) {
      checkXeroConnection();
    }

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Xero Integration Card */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Xero Integration</CardTitle>
            <CardDescription>
              Connect to Xero to import customers and invoices automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <XeroIntegration 
              devConsole={devConsole} 
              onDataImported={onDataImported}
              xeroConnection={xeroConnection}
              isXeroConnected={isXeroConnected}
              isCheckingXeroConnection={isCheckingXeroConnection}
              onXeroConnectionChange={onXeroConnectionChange}
            />
          </CardContent>
        </Card>

        {/* CSV Import Card */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">CSV Import</CardTitle>
            <CardDescription>
              Import customer and job data from CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CSVImport onDataImported={onDataImported} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportPanel;
