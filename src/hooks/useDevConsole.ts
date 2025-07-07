
import { useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  data?: any;
  category?: 'import' | 'ai' | 'database' | 'general' | 'xero' | 'full-ai';
}

export const useDevConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // Always enabled for debugging - user role controls UI display
  const [isEnabled, setIsEnabled] = useState(true);

  const addLog = useCallback((level: LogEntry['level'], message: string, data?: any, category: LogEntry['category'] = 'general') => {
    if (!isEnabled) return;

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      data,
      category
    };

    setLogs(prev => [entry, ...prev].slice(0, 1000)); // Keep last 1000 logs
    
    // Also log to browser console with category prefix
    const consoleMethod = level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log';
    const categoryPrefix = category ? `[${category.toUpperCase()}]` : '[DevConsole]';
    console[consoleMethod](`${categoryPrefix} ${message}`, data || '');
  }, [isEnabled]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const downloadLogs = useCallback(() => {
    const logData = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      category: log.category,
      message: log.message,
      data: log.data
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dev-console-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }, [logs]);

  const getLogsByCategory = useCallback((category: LogEntry['category']) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  const getImportStats = useCallback(() => {
    const importLogs = logs.filter(log => log.category === 'import');
    const errors = importLogs.filter(log => log.level === 'error').length;
    const warnings = importLogs.filter(log => log.level === 'warn').length;
    const successes = importLogs.filter(log => log.level === 'success').length;
    
    return { total: importLogs.length, errors, warnings, successes };
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    downloadLogs,
    isEnabled,
    getLogsByCategory,
    getImportStats
  };
};
