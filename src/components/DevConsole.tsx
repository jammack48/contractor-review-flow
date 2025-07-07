import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Database, Download, Trash2, FileText, Wrench, Play, Square, Tags, DollarSign, Zap, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDevConsole } from '@/hooks/useDevConsole';
import { toast } from '@/components/ui/use-toast';

interface DevConsoleProps {
  customersCount: number;
  invoicesCount: number;
  onDataCleared?: () => void;
  onDataUpdated?: () => void;
}

interface ExtractionStats {
  remainingCount: number;
  totalProcessed: number;
  totalUpdated: number;
  isComplete: boolean;
}

interface AutoProgress {
  totalToProcess: number;
  totalProcessed: number;
  totalUpdated: number;
  currentBatch: number;
  estimatedTimeRemaining: string;
  processingSpeed: number;
  elapsedTime: string;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
}

interface KeywordAutoProgress {
  totalToProcess: number;
  totalProcessed: number;
  totalUpdated: number;
  totalKeywords: number;
  currentBatch: number;
  estimatedTimeRemaining: string;
  processingSpeed: number;
  elapsedTime: string;
  totalCost: number;
  filterStats?: {
    totalFiltered: number;
    filterPercentage: number;
  };
}

export const DevConsole: React.FC<DevConsoleProps> = ({
  customersCount,
  invoicesCount,
  onDataCleared,
  onDataUpdated
}) => {
  const { logs, addLog, clearLogs, downloadLogs } = useDevConsole();
  const [isClearing, setIsClearing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAutoExtracting, setIsAutoExtracting] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [isAutoExtractingKeywords, setIsAutoExtractingKeywords] = useState(false);
  const [isAiWorkDescExtracting, setIsAiWorkDescExtracting] = useState(false);
  const [isAutoAiWorkDescExtracting, setIsAutoAiWorkDescExtracting] = useState(false);
  const autoExtractCancelRef = useRef(false);
  const autoKeywordCancelRef = useRef(false);
  const autoAiWorkDescCancelRef = useRef(false);

  const [extractionStats, setExtractionStats] = useState<ExtractionStats | null>(null);
  const [autoProgress, setAutoProgress] = useState<AutoProgress | null>(null);
  const [keywordTokenUsage, setKeywordTokenUsage] = useState<TokenUsage | null>(null);
  const [keywordAutoProgress, setKeywordAutoProgress] = useState<KeywordAutoProgress | null>(null);
  const [aiWorkDescTokenUsage, setAiWorkDescTokenUsage] = useState<TokenUsage | null>(null);
  const [aiWorkDescAutoProgress, setAiWorkDescAutoProgress] = useState<KeywordAutoProgress | null>(null);

  // Stabilize the callback to prevent rendering loops
  const handleDataCleared = useCallback(() => {
    if (onDataCleared) {
      onDataCleared();
    }
  }, [onDataCleared]);

  const handleDatabaseClear = async () => {
    setIsClearing(true);
    addLog('warn', '⚠️ Starting database clear...', null, 'database');

    try {
      const { error: invoicesError } = await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (invoicesError) throw invoicesError;
      addLog('info', 'Invoices table cleared', null, 'database');

      const { error: customersError } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (customersError) throw customersError;
      addLog('info', 'Customers table cleared', null, 'database');

      addLog('success', '✅ Database cleared successfully!', null, 'database');
      toast({
        title: "Database Cleared",
        description: "All customers and invoices have been removed.",
      });

      handleDataCleared();
    } catch (error: any) {
      console.error('Database clear error:', error);
      addLog('error', `Database clear failed: ${error.message}`, error, 'database');
      toast({
        title: "Database Clear Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExtractWorkDescriptions = async (isResume = false) => {
    setIsExtracting(true);
    const startTime = Date.now();
    addLog('info', `🚀 ${isResume ? 'Resuming' : 'Starting'} work description extraction...`, null, 'database');
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-work-description', {
        body: { 
          batchSize: 250,
          maxProcessing: 500,
          skipCompleted: true
        }
      });

      if (error) {
        addLog('error', `Work description extraction failed: ${error.message}`, error, 'database');
        toast({
          title: "Extraction Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.progress) {
        data.progress.forEach((message: string) => {
          addLog('info', message, null, 'database');
        });
      }

      setExtractionStats({
        remainingCount: data.remainingCount || 0,
        totalProcessed: data.totalProcessed || 0,
        totalUpdated: data.totalUpdated || 0,
        isComplete: data.isComplete || false
      });

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const statusMessage = data.isComplete 
        ? `✅ Work description extraction completed! Processed ${data.totalProcessed} invoices, updated ${data.totalUpdated} in ${elapsedTime}s`
        : `⏸️ Batch completed! Processed ${data.totalProcessed} invoices, updated ${data.totalUpdated} in ${elapsedTime}s. ${data.remainingCount} remaining.`;

      addLog('success', statusMessage, data, 'database');
      
      toast({
        title: data.isComplete ? "Extraction Complete" : "Batch Complete",
        description: data.isComplete 
          ? `Updated ${data.totalUpdated} invoices with work descriptions in ${elapsedTime}s`
          : `Updated ${data.totalUpdated} invoices in ${elapsedTime}s. ${data.remainingCount} remaining.`,
      });

      if (data.totalUpdated > 0 && onDataUpdated) {
        onDataUpdated();
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during extraction';
      addLog('error', `Work description extraction failed: ${errorMessage}`, err, 'database');
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAutoExtractAll = async () => {
    if (isAutoExtracting) return;

    setIsAutoExtracting(true);
    autoExtractCancelRef.current = false;
    const overallStartTime = Date.now();
    addLog('info', '🤖 Starting automatic work description extraction...', null, 'database');

    let totalProcessedOverall = 0;
    let totalUpdatedOverall = 0;
    let batchCount = 0;
    let initialRemainingCount = 0;

    try {
      const firstResult = await handleExtractWorkDescriptions(false);
      if (!firstResult || autoExtractCancelRef.current) return;

      totalProcessedOverall += firstResult.totalProcessed || 0;
      totalUpdatedOverall += firstResult.totalUpdated || 0;
      initialRemainingCount = (firstResult.remainingCount || 0) + (firstResult.totalProcessed || 0);
      batchCount = 1;

      const formatElapsedTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      };

      setAutoProgress({
        totalToProcess: initialRemainingCount,
        totalProcessed: totalProcessedOverall,
        totalUpdated: totalUpdatedOverall,
        currentBatch: batchCount,
        estimatedTimeRemaining: 'Calculating...',
        processingSpeed: 0,
        elapsedTime: formatElapsedTime(Date.now() - overallStartTime)
      });

      while (!firstResult.isComplete && !autoExtractCancelRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (autoExtractCancelRef.current) break;

        try {
          const result = await handleExtractWorkDescriptions(true);
          if (!result) break;

          batchCount++;
          totalProcessedOverall += result.totalProcessed || 0;
          totalUpdatedOverall += result.totalUpdated || 0;

          const elapsedTime = (Date.now() - overallStartTime) / 1000;
          const processingSpeed = totalProcessedOverall / elapsedTime;
          const remainingInvoices = result.remainingCount || 0;
          const estimatedSecondsRemaining = remainingInvoices / processingSpeed;
          const estimatedTimeRemaining = estimatedSecondsRemaining > 60 
            ? `${Math.ceil(estimatedSecondsRemaining / 60)} minutes`
            : `${Math.ceil(estimatedSecondsRemaining)} seconds`;

          setAutoProgress({
            totalToProcess: initialRemainingCount,
            totalProcessed: totalProcessedOverall,
            totalUpdated: totalUpdatedOverall,
            currentBatch: batchCount,
            estimatedTimeRemaining,
            processingSpeed: Math.round(processingSpeed * 100) / 100,
            elapsedTime: formatElapsedTime(Date.now() - overallStartTime)
          });

          addLog('info', `🔄 Auto-batch ${batchCount} complete: ${result.totalUpdated} updated, ${remainingInvoices} remaining`, null, 'database');

          if (result.isComplete) {
            const totalElapsedTime = formatElapsedTime(Date.now() - overallStartTime);
            addLog('success', `🎉 Auto-extraction complete! Total: ${totalUpdatedOverall} invoices updated in ${batchCount} batches (${totalElapsedTime})`, null, 'database');
            toast({
              title: "Auto-Extraction Complete!",
              description: `Successfully updated ${totalUpdatedOverall} invoices with work descriptions in ${batchCount} batches (${totalElapsedTime}).`,
            });
            break;
          }

        } catch (batchError) {
          addLog('error', `❌ Auto-extraction batch ${batchCount} failed`, batchError, 'database');
          toast({
            title: "Auto-extraction Error",
            description: `Batch ${batchCount} failed. Auto-extraction stopped.`,
            variant: "destructive"
          });
          break;
        }
      }

      if (autoExtractCancelRef.current) {
        const totalElapsedTime = formatElapsedTime(Date.now() - overallStartTime);
        addLog('warn', `⏹️ Auto-extraction cancelled by user after ${batchCount} batches (${totalElapsedTime})`, null, 'database');
        toast({
          title: "Auto-Extraction Cancelled",
          description: `Stopped after ${batchCount} batches (${totalElapsedTime}). ${totalUpdatedOverall} invoices were updated.`,
        });
      }

      if (totalUpdatedOverall > 0 && onDataUpdated) {
        onDataUpdated();
      }

    } catch (error) {
      addLog('error', '❌ Auto-extraction failed to start', error, 'database');
      toast({
        title: "Auto-Extraction Failed",
        description: "Failed to start automatic extraction process.",
        variant: "destructive"
      });
    } finally {
      setIsAutoExtracting(false);
      setAutoProgress(null);
      autoExtractCancelRef.current = false;
    }
  };

  const cancelAutoExtraction = () => {
    autoExtractCancelRef.current = true;
    addLog('warn', '⏹️ Auto-extraction cancellation requested...', null, 'database');
  };

  const handleExtractServiceKeywords = async (batchOnly = true) => {
    setIsExtractingKeywords(true);
    const startTime = Date.now();
    addLog('info', '🏷️ Starting OPTIMIZED AI keyword extraction (test batch of 10)...', null, 'ai');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-extract-keywords', {
        body: { 
          testBatch: batchOnly,
          batchSize: 10,
          offset: 0
        }
      });

      if (error) {
        addLog('error', `AI service keyword extraction failed: ${error.message}`, error, 'ai');
        toast({
          title: "AI Keyword Extraction Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.tokenUsage) {
        setKeywordTokenUsage(data.tokenUsage);
      }

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const filterInfo = data.filterStats ? ` (${data.filterStats.filterPercentage}% filtered)` : '';
      const statusMessage = `✅ OPTIMIZED AI extraction completed! Updated ${data.updated} invoices with ${data.totalKeywords} keywords in ${elapsedTime}s${filterInfo}. Cost: $${data.tokenUsage?.cost.toFixed(5) || '0.00000'}`;

      addLog('success', statusMessage, null, 'ai');
      
      toast({
        title: "Optimized AI Extraction Complete",
        description: `Updated ${data.updated} invoices with ${data.totalKeywords} keywords in ${elapsedTime}s. Cost: $${data.tokenUsage?.cost.toFixed(5) || '0.00000'}${filterInfo}`,
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during AI keyword extraction';
      addLog('error', `AI service keyword extraction failed: ${errorMessage}`, err, 'ai');
      toast({
        title: "AI Keyword Extraction Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsExtractingKeywords(false);
    }
  };

  const handleAutoExtractAllKeywords = async () => {
    if (isAutoExtractingKeywords) return;

    setIsAutoExtractingKeywords(true);
    autoKeywordCancelRef.current = false;
    const overallStartTime = Date.now();
    addLog('info', '🚀 Starting OPTIMIZED auto keyword extraction (10x faster, 90% cheaper)...', null, 'ai');

    let totalProcessedOverall = 0;
    let totalUpdatedOverall = 0;
    let totalKeywordsOverall = 0;
    let totalCostOverall = 0;
    let totalFilteredOverall = 0;
    let batchCount = 0;
    let currentOffset = 0;
    let initialRemainingCount = 0;

    try {
      const formatElapsedTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      };

      const firstResult = await invokeKeywordExtraction(false, 250, currentOffset);
      if (!firstResult || autoKeywordCancelRef.current) return;

      batchCount = 1;
      totalProcessedOverall += firstResult.processed || 0;
      totalUpdatedOverall += firstResult.updated || 0;
      totalKeywordsOverall += firstResult.totalKeywords || 0;
      totalCostOverall += firstResult.tokenUsage?.cost || 0;
      totalFilteredOverall += firstResult.filterStats?.filtered || 0;
      currentOffset = firstResult.nextOffset || 0;
      initialRemainingCount = firstResult.remainingCount + totalProcessedOverall;

      setKeywordAutoProgress({
        totalToProcess: initialRemainingCount,
        totalProcessed: totalProcessedOverall,
        totalUpdated: totalUpdatedOverall,
        totalKeywords: totalKeywordsOverall,
        currentBatch: batchCount,
        estimatedTimeRemaining: 'Calculating...',
        processingSpeed: 0,
        elapsedTime: formatElapsedTime(Date.now() - overallStartTime),
        totalCost: totalCostOverall,
        filterStats: {
          totalFiltered: totalFilteredOverall,
          filterPercentage: Math.round((totalFilteredOverall / Math.max(totalProcessedOverall, 1)) * 100)
        }
      });

      const filterInfo = firstResult.filterStats ? ` (${firstResult.filterStats.filterPercentage}% filtered)` : '';
      addLog('info', `🚀 Optimized batch ${batchCount}: ${firstResult.updated} updated, ${firstResult.remainingCount} remaining${filterInfo}`, null, 'ai');

      while (firstResult.hasMore && !autoKeywordCancelRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay due to faster processing

        if (autoKeywordCancelRef.current) break;

        try {
          const result = await invokeKeywordExtraction(false, 250, currentOffset);
          if (!result) break;

          batchCount++;
          totalProcessedOverall += result.processed || 0;
          totalUpdatedOverall += result.updated || 0;
          totalKeywordsOverall += result.totalKeywords || 0;
          totalCostOverall += result.tokenUsage?.cost || 0;
          totalFilteredOverall += result.filterStats?.filtered || 0;
          currentOffset = result.nextOffset || 0;

          const elapsedTime = (Date.now() - overallStartTime) / 1000;
          const processingSpeed = totalProcessedOverall / elapsedTime;
          const remainingInvoices = result.remainingCount || 0;
          const estimatedSecondsRemaining = remainingInvoices / processingSpeed;
          const estimatedTimeRemaining = estimatedSecondsRemaining > 60 
            ? `${Math.ceil(estimatedSecondsRemaining / 60)} minutes`
            : `${Math.ceil(estimatedSecondsRemaining)} seconds`;

          setKeywordAutoProgress({
            totalToProcess: initialRemainingCount,
            totalProcessed: totalProcessedOverall,
            totalUpdated: totalUpdatedOverall,
            totalKeywords: totalKeywordsOverall,
            currentBatch: batchCount,
            estimatedTimeRemaining,
            processingSpeed: Math.round(processingSpeed * 100) / 100,
            elapsedTime: formatElapsedTime(Date.now() - overallStartTime),
            totalCost: totalCostOverall,
            filterStats: {
              totalFiltered: totalFilteredOverall,
              filterPercentage: Math.round((totalFilteredOverall / Math.max(totalProcessedOverall, 1)) * 100)
            }
          });

          const resultFilterInfo = result.filterStats ? ` (${result.filterStats.filterPercentage}% filtered)` : '';
          addLog('info', `🚀 Optimized batch ${batchCount}: ${result.updated} updated, ${remainingInvoices} remaining${resultFilterInfo}`, null, 'ai');

          if (!result.hasMore) {
            const totalElapsedTime = formatElapsedTime(Date.now() - overallStartTime);
            const overallFilterPercentage = Math.round((totalFilteredOverall / Math.max(totalProcessedOverall, 1)) * 100);
            addLog('success', `🎉 OPTIMIZED auto keyword extraction complete! Updated ${totalUpdatedOverall} invoices with ${totalKeywordsOverall} keywords (${totalElapsedTime}). Cost: $${totalCostOverall.toFixed(5)} (${overallFilterPercentage}% filtered)`, null, 'ai');
            
            toast({
              title: "🚀 Optimized Auto Extraction Complete!",
              description: `Updated ${totalUpdatedOverall} invoices with ${totalKeywordsOverall} keywords (${totalElapsedTime}). Cost: $${totalCostOverall.toFixed(5)} - 90% cheaper!`,
            });
            break;
          }

        } catch (batchError) {
          addLog('error', `❌ Optimized auto keyword extraction batch ${batchCount} failed`, batchError, 'ai');
          toast({
            title: "Auto Keyword Extraction Error",
            description: `Batch ${batchCount} failed. Auto-extraction stopped.`,
            variant: "destructive"
          });
          break;
        }
      }

      if (autoKeywordCancelRef.current) {
        const totalElapsedTime = formatElapsedTime(Date.now() - overallStartTime);
        addLog('warn', `⏹️ Optimized auto keyword extraction cancelled by user after ${batchCount} batches (${totalElapsedTime})`, null, 'ai');
        toast({
          title: "Auto Keyword Extraction Cancelled",
          description: `Stopped after ${batchCount} batches (${totalElapsedTime}). ${totalUpdatedOverall} invoices were updated.`,
        });
      }

      if (totalCostOverall > 0) {
        setKeywordTokenUsage(prev => prev ? {
          ...prev,
          cost: totalCostOverall
        } : {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost: totalCostOverall
        });
      }

    } catch (error) {
      addLog('error', '❌ Optimized auto keyword extraction failed', error, 'ai');
      toast({
        title: "Auto Keyword Extraction Failed",
        description: "Failed to start automatic keyword extraction process.",
        variant: "destructive"
      });
    } finally {
      setIsAutoExtractingKeywords(false);
      setKeywordAutoProgress(null);
      autoKeywordCancelRef.current = false;
    }
  };

  const invokeKeywordExtraction = async (testBatch: boolean, batchSize: number = 250, offset: number = 0) => {
    const { data, error } = await supabase.functions.invoke('ai-extract-keywords', {
      body: { 
        testBatch,
        batchSize,
        offset
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const cancelAutoKeywordExtraction = () => {
    autoKeywordCancelRef.current = true;
    addLog('warn', '⏹️ Optimized auto keyword extraction cancellation requested...', null, 'ai');
  };
  
  // NEW AI Work Description Extraction Functions
  const handleAiWorkDescExtract = async (batchOnly = true) => {
    setIsAiWorkDescExtracting(true);
    const startTime = Date.now();
    addLog('info', '🧠 Starting AI work description extraction (test batch of 10)...', null, 'ai-work-desc');
    
    try {
      const { data, error } = await supabase.functions.invoke('work-desc-ai-extraction', {
        body: { 
          testBatch: batchOnly,
          batchSize: 10,
          offset: 0
        }
      });

      if (error) {
        addLog('error', `AI work description extraction failed: ${error.message}`, error, 'ai-work-desc');
        toast({
          title: "AI Work Description Extraction Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.tokenUsage) {
        setAiWorkDescTokenUsage(data.tokenUsage);
      }

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const statusMessage = `✅ AI work description extraction completed! Updated ${data.updated} invoices with intelligent work descriptions in ${elapsedTime}s. Cost: $${data.tokenUsage?.cost.toFixed(5) || '0.00000'}`;

      addLog('success', statusMessage, null, 'ai-work-desc');
      
      toast({
        title: "AI Work Description Extraction Complete",
        description: statusMessage,
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during AI work description extraction';
      addLog('error', `AI work description extraction failed: ${errorMessage}`, err, 'ai-work-desc');
      toast({
        title: "AI Work Description Extraction Failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsAiWorkDescExtracting(false);
    }
  };

  const handleAutoAiWorkDescExtractAll = async () => {
    if (isAutoAiWorkDescExtracting) return;

    setIsAutoAiWorkDescExtracting(true);
    autoAiWorkDescCancelRef.current = false;
    const overallStartTime = Date.now();
    addLog('info', '🧠 Starting AI auto work description extraction (intelligent work understanding)...', null, 'ai-work-desc');

    let totalProcessedOverall = 0;
    let totalUpdatedOverall = 0;
    let totalCostOverall = 0;
    let batchCount = 0;
    let currentOffset = 0;
    let initialRemainingCount = 0;

    try {
      const formatElapsedTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      };

      const firstResult = await invokeAiWorkDescExtraction(false, 200, currentOffset);
      if (!firstResult || autoAiWorkDescCancelRef.current) return;

      batchCount = 1;
      totalProcessedOverall += firstResult.processed || 0;
      totalUpdatedOverall += firstResult.updated || 0;
      totalCostOverall += firstResult.tokenUsage?.cost || 0;
      currentOffset = firstResult.nextOffset || 0;
      initialRemainingCount = firstResult.remaining + totalProcessedOverall;

      setAiWorkDescAutoProgress({
        totalToProcess: initialRemainingCount,
        totalProcessed: totalProcessedOverall,
        totalUpdated: totalUpdatedOverall,
        totalKeywords: 0, // Not applicable for work descriptions
        currentBatch: batchCount,
        estimatedTimeRemaining: 'Calculating...',
        processingSpeed: 0,
        elapsedTime: formatElapsedTime(Date.now() - overallStartTime),
        totalCost: totalCostOverall
      });

      addLog('info', `🧠 AI work desc batch ${batchCount}: ${firstResult.updated} updated, ${firstResult.remaining} remaining`, null, 'ai-work-desc');

      while (firstResult.hasMore && !autoAiWorkDescCancelRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (autoAiWorkDescCancelRef.current) break;

        try {
          const result = await invokeAiWorkDescExtraction(false, 200, currentOffset);
          if (!result) break;

          batchCount++;
          totalProcessedOverall += result.processed || 0;
          totalUpdatedOverall += result.updated || 0;
          totalCostOverall += result.tokenUsage?.cost || 0;
          currentOffset = result.nextOffset || 0;

          const elapsedTime = (Date.now() - overallStartTime) / 1000;
          const processingSpeed = totalProcessedOverall / elapsedTime;
          const remainingInvoices = result.remaining || 0;
          const estimatedSecondsRemaining = remainingInvoices / processingSpeed;
          const estimatedTimeRemaining = estimatedSecondsRemaining > 60 
            ? `${Math.ceil(estimatedSecondsRemaining / 60)} minutes`
            : `${Math.ceil(estimatedSecondsRemaining)} seconds`;

          setAiWorkDescAutoProgress({
            totalToProcess: initialRemainingCount,
            totalProcessed: totalProcessedOverall,
            totalUpdated: totalUpdatedOverall,
            totalKeywords: 0,
            currentBatch: batchCount,
            estimatedTimeRemaining,
            processingSpeed: Math.round(processingSpeed * 100) / 100,
            elapsedTime: formatElapsedTime(Date.now() - overallStartTime),
            totalCost: totalCostOverall
          });

          addLog('info', `🧠 AI work desc batch ${batchCount}: ${result.updated} updated, ${remainingInvoices} remaining`, null, 'ai-work-desc');

          if (!result.hasMore) {
            const totalElapsedTime = formatElapsedTime(Date.now() - overallStartTime);
            addLog('success', `🎉 AI work description auto extraction complete! Updated ${totalUpdatedOverall} invoices with intelligent work descriptions (${totalElapsedTime}). Cost: $${totalCostOverall.toFixed(5)}`, null, 'ai-work-desc');
            
            toast({
              title: "🧠 AI Work Description Auto Extraction Complete!",
              description: `Updated ${totalUpdatedOverall} invoices with intelligent work descriptions (${totalElapsedTime}). Cost: $${totalCostOverall.toFixed(5)}`,
            });
            break;
          }

        } catch (batchError) {
          addLog('error', `❌ AI work desc auto extraction batch ${batchCount} failed`, batchError, 'ai-work-desc');
          toast({
            title: "Auto AI Work Desc Extraction Error",
            description: `Batch ${batchCount} failed. Auto-extraction stopped.`,
            variant: "destructive"
          });
          break;
        }
      }

      if (autoAiWorkDescCancelRef.current) {
        const totalElapsedTime = formatElapsedTime(Date.now() - overallStartTime);
        addLog('warn', `⏹️ AI work desc auto extraction cancelled by user after ${batchCount} batches (${totalElapsedTime})`, null, 'ai-work-desc');
        toast({
          title: "Auto AI Work Desc Extraction Cancelled",
          description: `Stopped after ${batchCount} batches (${totalElapsedTime}). ${totalUpdatedOverall} invoices were updated.`,
        });
      }

      if (totalCostOverall > 0) {
        setAiWorkDescTokenUsage(prev => prev ? {
          ...prev,
          cost: totalCostOverall
        } : {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost: totalCostOverall
        });
      }

    } catch (error) {
      addLog('error', '❌ AI work desc auto extraction failed', error, 'ai-work-desc');
      toast({
        title: "Auto AI Work Desc Extraction Failed",
        description: "Failed to start automatic AI work description extraction process.",
        variant: "destructive"
      });
    } finally {
      setIsAutoAiWorkDescExtracting(false);
      setAiWorkDescAutoProgress(null);
      autoAiWorkDescCancelRef.current = false;
    }
  };

  const invokeAiWorkDescExtraction = async (
    testBatch: boolean,
    batchSize: number = 200,
    offset: number = 0
  ) => {
    const { data, error } = await supabase.functions.invoke('work-desc-ai-extraction', {
      body: { 
        testBatch,
        batchSize,
        offset
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const cancelAutoAiWorkDescExtraction = () => {
    autoAiWorkDescCancelRef.current = true;
    addLog('warn', '⏹️ AI work desc auto extraction cancellation requested...', null, 'ai-work-desc');
  };

  const progressPercentage = autoProgress 
    ? Math.round((autoProgress.totalProcessed / autoProgress.totalToProcess) * 100)
    : 0;

  const keywordProgressPercentage = keywordAutoProgress 
    ? Math.round((keywordAutoProgress.totalProcessed / keywordAutoProgress.totalToProcess) * 100)
    : 0;

  const fullAiProgressPercentage = aiWorkDescAutoProgress 
    ? Math.round((aiWorkDescAutoProgress.totalProcessed / aiWorkDescAutoProgress.totalToProcess) * 100)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Developer Console
          <Badge variant="destructive" className="text-xs">
            DEVELOPER ACCESS
          </Badge>
        </CardTitle>
        <CardDescription>
          Advanced database operations and system monitoring for developers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Database Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{customersCount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{invoicesCount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Invoices</div>
          </div>
        </div>

        {/* AI Work Description Token Usage Stats */}
        {aiWorkDescTokenUsage && (
          <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
            <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              🧠 AI Work Description Extraction - Token Usage
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-purple-700">Total Tokens</div>
                <div className="text-lg">{aiWorkDescTokenUsage.total_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Input Tokens</div>
                <div className="text-lg">{aiWorkDescTokenUsage.prompt_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-indigo-700">Output Tokens</div>
                <div className="text-lg">{aiWorkDescTokenUsage.completion_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-red-700">Total Cost</div>
                <div className="text-lg font-bold">${aiWorkDescTokenUsage.cost.toFixed(5)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Optimized Token Usage Stats */}
        {keywordTokenUsage && (
          <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
            <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              🚀 OPTIMIZED AI Keyword Extraction - Token Usage (90% Cheaper!)
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-700">Total Tokens</div>
                <div className="text-lg">{keywordTokenUsage.total_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Input Tokens</div>
                <div className="text-lg">{keywordTokenUsage.prompt_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-purple-700">Output Tokens</div>
                <div className="text-lg">{keywordTokenUsage.completion_tokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-red-700">Total Cost</div>
                <div className="text-lg font-bold">${keywordTokenUsage.cost.toFixed(5)}</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Work Description Auto-Extraction Progress */}
        {aiWorkDescAutoProgress && (
          <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50">
            <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              🧠 AI Work Description Auto-Extraction (Intelligent Work Understanding)
            </h4>
            
            <div className="space-y-3">
              <Progress value={Math.round((aiWorkDescAutoProgress.totalProcessed / aiWorkDescAutoProgress.totalToProcess) * 100)} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
                <div>
                  <div className="font-medium text-purple-700">Progress</div>
                  <div className="text-lg font-bold">{Math.round((aiWorkDescAutoProgress.totalProcessed / aiWorkDescAutoProgress.totalToProcess) * 100)}%</div>
                </div>
                <div>
                  <div className="font-medium text-blue-700">Processed</div>
                  <div className="text-lg">{aiWorkDescAutoProgress.totalProcessed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-green-700">Updated</div>
                  <div className="text-lg">{aiWorkDescAutoProgress.totalUpdated.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-indigo-700">Work Descs</div>
                  <div className="text-lg">{aiWorkDescAutoProgress.totalUpdated.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-orange-700">Batch #</div>
                  <div className="text-lg">{aiWorkDescAutoProgress.currentBatch}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">ETA</div>
                  <div className="text-sm">{aiWorkDescAutoProgress.estimatedTimeRemaining}</div>
                </div>
                <div>
                  <div className="font-medium text-red-700">Cost</div>
                  <div className="text-sm font-bold">${aiWorkDescAutoProgress.totalCost.toFixed(5)}</div>
                </div>
              </div>
              
              <div className="text-xs text-purple-600 font-medium">
                🧠 Speed: {aiWorkDescAutoProgress.processingSpeed} invoices/sec | Elapsed: {aiWorkDescAutoProgress.elapsedTime} | Intelligent work analysis
              </div>
            </div>
          </div>
        )}

        {/* Auto-Extraction Progress */}
        {autoProgress && (
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Play className="h-4 w-4" />
              Auto-Extraction Progress
            </h4>
            
            <div className="space-y-3">
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
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
                <div>
                  <div className="font-medium text-indigo-700">Elapsed</div>
                  <div className="text-sm">{autoProgress.elapsedTime}</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600">
                Processing Speed: {autoProgress.processingSpeed} invoices/sec
              </div>
            </div>
          </div>
        )}

        {/* Extraction Progress */}
        {extractionStats && !autoProgress && (
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium text-blue-800 mb-2">Work Description Extraction Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-700">Processed</div>
                <div className="text-lg">{extractionStats.totalProcessed.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-green-700">Updated</div>
                <div className="text-lg">{extractionStats.totalUpdated.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-orange-700">Remaining</div>
                <div className="text-lg">{extractionStats.remainingCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-purple-700">Status</div>
                <div className="text-lg">{extractionStats.isComplete ? '✅ Complete' : '⏸️ In Progress'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Operations */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Operations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={isAutoExtracting ? cancelAutoExtraction : handleAutoExtractAll}
                disabled={isExtracting && !isAutoExtracting}
                variant={isAutoExtracting ? "destructive" : "default"}
                className="justify-start bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
              >
                {isAutoExtracting ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Cancel Auto-Extract
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Extract All Work Descriptions (Old)
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleExtractWorkDescriptions(false)}
                disabled={isExtracting || isAutoExtracting}
                variant="outline"
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isExtracting ? 'Extracting...' : 'Extract Work Descriptions (Batch)'}
              </Button>

              <Button
                onClick={isAutoAiWorkDescExtracting ? cancelAutoAiWorkDescExtraction : handleAutoAiWorkDescExtractAll}
                disabled={isAiWorkDescExtracting && !isAutoAiWorkDescExtracting}
                variant={isAutoAiWorkDescExtracting ? "destructive" : "default"}
                className="justify-start bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isAutoAiWorkDescExtracting ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Cancel AI Work Desc Extract
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    🧠 AI Extract Work Descriptions (New) (Step 1)
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleAiWorkDescExtract(true)}
                disabled={isAiWorkDescExtracting || isExtractingKeywords || isExtracting || isAutoExtracting || isAutoExtractingKeywords || isAutoAiWorkDescExtracting}
                variant="outline"
                className="justify-start"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isAiWorkDescExtracting ? 'AI Extracting...' : '🧠 AI Extract Work Descriptions (Test 10)'}
              </Button>

              <Button
                onClick={isAutoExtractingKeywords ? cancelAutoKeywordExtraction : handleAutoExtractAllKeywords}
                disabled={isExtractingKeywords && !isAutoExtractingKeywords}
                variant={isAutoExtractingKeywords ? "destructive" : "default"}
                className="justify-start bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                {isAutoExtractingKeywords ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Cancel OPTIMIZED Extract
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    🚀 AI OPTIMIZED Extract ALL Keywords (step 2)
                  </>
                )}
              </Button>

              <Button
                onClick={handleDatabaseClear}
                disabled={isClearing || isAutoExtracting}
                variant="destructive"
                className="justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {isClearing ? 'Clearing...' : 'COMPLETE DB CLEAR'}
              </Button>
            </div>
          </div>

          {/* Log Management */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Log Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button onClick={clearLogs} variant="outline" className="justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
              <Button onClick={downloadLogs} variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Download Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Live Console Logs */}
        <div className="space-y-2">
          <h3 className="font-medium">Live Console Logs</h3>
          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {logs.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No logs yet. Perform actions to see logs appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="text-sm font-mono"
                      >
                        <Badge
                          variant="secondary"
                          className="mr-2"
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className={
                          log.message.includes('✅') || log.message.includes('🚀') || log.message.includes('🧠') ? 'text-green-600' :
                          log.message.includes('⚠️') || log.message.includes('❌') ? 'text-red-600' :
                          ''
                        }>
                          {log.message}
                        </span>
                        {log.data && (
                          <details className="mt-1">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              View Data
                            </summary>
                            <pre className="bg-gray-100 p-2 rounded-md text-xs">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default DevConsole;
