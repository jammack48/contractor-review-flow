
import React from 'react';

interface XeroStatsProps {
  lastSync: Date | null;
  lastSyncStats: {customers: number, invoices: number} | null;
  lastEnhancement: Date | null;
  lastEnhancementStats: {enhanced: number, processed: number} | null;
}

export const XeroStats: React.FC<XeroStatsProps> = ({
  lastSync,
  lastSyncStats,
  lastEnhancement,
  lastEnhancementStats
}) => {
  return (
    <div className="space-y-2">
      {lastSync && (
        <div className="text-sm text-gray-600 space-y-1">
          <div>Last import: {lastSync.toLocaleString()}</div>
          {lastSyncStats && (
            <div className="text-xs text-gray-500">
              {lastSyncStats.customers} customers, {lastSyncStats.invoices} invoices imported
            </div>
          )}
        </div>
      )}

      {lastEnhancement && (
        <div className="text-sm text-gray-600 space-y-1">
          <div>Last AI enhancement: {lastEnhancement.toLocaleString()}</div>
          {lastEnhancementStats && (
            <div className="text-xs text-purple-600">
              {lastEnhancementStats.enhanced} of {lastEnhancementStats.processed} descriptions enhanced
            </div>
          )}
        </div>
      )}
    </div>
  );
};
