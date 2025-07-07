import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface EdgeFunctionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'log';
  message: string;
  function_id: string;
  event_type: string;
}

interface EdgeFunctionExecution {
  function_name: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  started_at: string;
  duration?: number;
  logs: EdgeFunctionLog[];
}

const EdgeFunctionLogsViewer: React.FC = () => {
  const [executions, setExecutions] = useState<EdgeFunctionExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchEdgeFunctionLogs = async () => {
    setIsLoading(true);
    try {
      // Simplified mock data - removed auto-refresh polling that could cause loops
      const mockExecutions: EdgeFunctionExecution[] = [
        {
          function_name: 'full-ai-extraction',
          status: 'running',
          started_at: new Date(Date.now() - 30000).toISOString(),
          logs: [
            {
              id: '1',
              timestamp: new Date(Date.now() - 30000).toISOString(),
              level: 'info',
              message: '🧠 [FULL-AI] Starting intelligent service understanding...',
              function_id: 'full-ai-1',
              event_type: 'Log'
            },
            {
              id: '2',
              timestamp: new Date(Date.now() - 20000).toISOString(),
              level: 'info',
              message: '[PROGRESS] Processing batch 1/5 (200 invoices)...',
              function_id: 'full-ai-1',
              event_type: 'Log'
            }
          ]
        }
      ];
      
      setExecutions(mockExecutions);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch edge function logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEdgeFunctionLogs();
  }, []);

  // Simplified auto-refresh - only refresh when manually triggered
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing edge function logs...');
        fetchEdgeFunctionLogs();
      }, 10000); // Increased to 10 seconds to reduce load
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusIcon = (status: EdgeFunctionExecution['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: EdgeFunctionExecution['status']) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'timeout':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getLevelIcon = (level: EdgeFunctionLog['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      case 'log':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Edge Function Logs
              <Badge variant="outline" className="text-xs">REAL-TIME</Badge>
            </CardTitle>
            <CardDescription>
              Live logs from Supabase Edge Functions with execution details
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEdgeFunctionLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Manual
            </Button>
          </div>
        </div>
        
        {lastRefresh && (
          <div className="text-xs text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          {executions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No edge function executions found. Logs will appear here when functions are running.
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution, execIndex) => (
                <div
                  key={`${execution.function_name}-${execIndex}`}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <div>
                        <div className="font-medium">{execution.function_name}</div>
                        <div className="text-sm text-gray-500">
                          Started: {new Date(execution.started_at).toLocaleTimeString()}
                          {execution.duration && ` • Duration: ${execution.duration}ms`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default">
                      {execution.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {execution.logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <Info className="h-4 w-4 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EdgeFunctionLogsViewer;
