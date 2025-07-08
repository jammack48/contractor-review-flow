
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import XeroIntegration from './XeroIntegration';
import CSVImport from './CSVImport';
import { getXeroConnection } from '@/lib/xeroConnectionService';
import type { XeroConnection } from '@/lib/xeroConnectionService';

interface ImportPanelProps {
  onDataImported?: () => void;
  xeroConnection: XeroConnection | null;
  isXeroConnected: boolean;
  isCheckingXeroConnection: boolean;
  onXeroConnectionChange: (connection: XeroConnection | null, connected: boolean) => void;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ 
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
            <XeroIntegration />
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
