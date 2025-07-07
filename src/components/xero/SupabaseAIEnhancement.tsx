
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Database, Play, Square, RefreshCw } from 'lucide-react';

interface ProcessingState {
  isProcessing: boolean;
  processedCount: number;
  totalCount: number;
  enhanced: number;
  skipped: number;
  errors: number;
}

interface AutoProgress {
  totalToProcess: number;
  totalProcessed: number;
  totalUpdated: number;
  currentBatch: number;
  estimatedTimeRemaining: string;
  processingSpeed: number;
}

interface SupabaseAIEnhancementProps {
  processingState: ProcessingState;
  onStartProcessing: () => void;
  disabled?: boolean;
  isAutoMode?: boolean;
  autoProgress?: AutoProgress | null;
}

export const SupabaseAIEnhancement: React.FC<SupabaseAIEnhancementProps> = ({
  processingState,
  onStartProcessing,
  disabled = false,
  isAutoMode = false,
  autoProgress
}) => {
  const progressPercentage = autoProgress && autoProgress.totalToProcess > 0
    ? Math.round((autoProgress.totalProcessed / autoProgress.totalToProcess) * 100)
    : processingState.totalCount > 0 
      ? Math.round((processingState.processedCount / processingState.totalCount) * 100)
      : 0;

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="h-5 w-5" />
          Work Description Extraction
        </CardTitle>
        <CardDescription>
          {isAutoMode 
            ? "Automatically extract work descriptions from ALL invoices using template-based logic"
            : "Extract work descriptions from invoice line items using template-based logic"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-Extraction Progress */}
        {autoProgress && (
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Play className="h-4 w-4" />
              Auto-Extraction Progress
            </h4>
            
            <div className="space-y-3">
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-700">Progress</div>
                  <div className="text-lg">{progressPercentage}%</div>
                </div>
                <div>
                  <div className="font-medium text-green-700">Processed</div>
                  <div className="text-lg">{autoProgress.totalProcessed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-purple-700">Updated</div>
                  <div className="text-lg">{autoProgress.totalUpdated.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-orange-700">Batch #</div>
                  <div className="text-lg">{autoProgress.currentBatch}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">ETA</div>
                  <div className="text-sm">{autoProgress.estimatedTimeRemaining}</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600">
                Processing Speed: {autoProgress.processingSpeed} invoices/sec
              </div>
            </div>
          </div>
        )}

        {/* Regular Processing Stats */}
        {!autoProgress && processingState.totalCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{processingState.processedCount}</div>
              <div className="text-xs text-blue-600">Processed</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{processingState.enhanced}</div>
              <div className="text-xs text-green-600">Enhanced</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{processingState.skipped}</div>
              <div className="text-xs text-yellow-600">Skipped</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{processingState.errors}</div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={processingState.isProcessing ? "default" : "secondary"}>
              {processingState.isProcessing ? "Processing..." : "Ready"}
            </Badge>
            {processingState.totalCount > 0 && (
              <span className="text-sm text-gray-600">
                {processingState.processedCount} / {processingState.totalCount} invoices
              </span>
            )}
          </div>

          <Button
            onClick={onStartProcessing}
            disabled={disabled}
            variant={processingState.isProcessing ? "destructive" : "default"}
            className={processingState.isProcessing 
              ? "" 
              : "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
            }
          >
            {processingState.isProcessing ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Cancel Auto-Extract
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {isAutoMode ? "Auto Extract All" : "Start Processing"}
              </>
            )}
          </Button>
        </div>

        {processingState.isProcessing && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              {isAutoMode ? "Auto-extracting work descriptions..." : "Processing invoices..."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
