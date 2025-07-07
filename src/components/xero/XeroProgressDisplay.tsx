
import React from 'react';

interface XeroProgressDisplayProps {
  isSyncing: boolean;
  isEnhancing: boolean;
  syncProgress: string[];
  enhanceProgress: string[];
  currentPhase: string;
}

export const XeroProgressDisplay: React.FC<XeroProgressDisplayProps> = ({
  isSyncing,
  isEnhancing,
  syncProgress,
  enhanceProgress,
  currentPhase
}) => {
  if (!isSyncing && !(isEnhancing && enhanceProgress.length > 0)) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="p-4 border rounded-lg bg-blue-50">
        <div className="text-sm text-blue-800 font-medium mb-2">
          {isSyncing ? 'Step 1: Chunked Data Import Progress:' : 'Step 2: AI Enhancement Details:'}
        </div>
        <div className="text-sm text-blue-600 mb-3">{currentPhase}</div>
      </div>
      
      {/* Live Progress Log */}
      {((isSyncing && syncProgress.length > 0) || (isEnhancing && enhanceProgress.length > 0)) && (
        <div className="p-3 border rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
          <div className="text-xs text-gray-600 font-medium mb-2">Live Progress Steps:</div>
          <div className="text-xs text-gray-600 space-y-1">
            {(isSyncing ? syncProgress : enhanceProgress).map((progress, index) => (
              <div key={index} className={`font-mono text-xs ${
                progress.includes('PHASE 1') || progress.includes('PHASE 2') ? 'text-purple-700 font-bold' :
                progress.includes('🤖') || progress.includes('AI') ? 'text-purple-600 font-medium' :
                progress.includes('✅') ? 'text-green-600' :
                progress.includes('⚠️') || progress.includes('❌') ? 'text-red-600' :
                progress.includes('📡') || progress.includes('📋') || progress.includes('📄') || progress.includes('💾') ? 'text-blue-600 font-medium' :
                'text-gray-600'
              }`}>
                {progress}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
