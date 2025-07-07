
import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVImportProps {
  onDataImported?: () => void;
}

const CSVImport: React.FC<CSVImportProps> = ({ onDataImported }) => {
  return (
    <Card className="opacity-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-500">
          <FileText className="h-5 w-5" />
          CSV Import (Not Available)
        </CardTitle>
        <CardDescription>
          This CRM is designed exclusively for Xero integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            CSV import is not available in this Xero-focused CRM. All customer and invoice data is synchronized directly from your Xero account for accuracy and real-time updates.
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            Use the Xero Integration tab to sync your data
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImport;
