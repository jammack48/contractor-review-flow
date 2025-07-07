
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCustomers, fetchInvoices, isDemoMode } from '@/lib/dataService';
import type { Customer, Invoice } from '@/types/crm';
import { toast } from '@/hooks/use-toast';
import { useDevConsole } from './useDevConsole';

// Module-level variable for throttling
let lastLogTime = 0;

export const useSupabaseData = () => {
  const queryClient = useQueryClient();
  const devConsole = useDevConsole();
  const isDemo = isDemoMode();

  // Add demo mode logging - removed devConsole from dependency array to prevent infinite loop
  useEffect(() => {
    if (isDemo) {
      console.log('🎭 [HOOK-DEBUG] Running in DEMO MODE - using local data');
      devConsole.addLog('info', 'Demo Mode Active - Using local sample data', { mode: 'demo' }, 'general');
    } else {
      console.log('🔄 [HOOK-DEBUG] Running in LIVE MODE - using Supabase data');
      devConsole.addLog('info', 'Live Mode Active - Using Supabase database', { mode: 'live' }, 'database');
    }
  }, [isDemo]); // Removed devConsole from dependency array

  // Fetch ALL customers with pagination
  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useQuery({
    queryKey: ['customers', isDemo ? 'demo' : 'live'],
    queryFn: async () => {
      console.log(`🔄 [HOOK-DEBUG] Starting customer fetch - Mode: ${isDemo ? 'DEMO' : 'LIVE'}...`);
      const logPrefix = isDemo ? 'Demo' : 'Supabase';
      devConsole.addLog('info', `Fetching ALL customers from ${logPrefix}`, { mode: isDemo ? 'demo' : 'live' }, 'database');
      try {
        const result = await fetchCustomers();
        console.log(`✅ [HOOK-DEBUG] Customer fetch completed: ${result.length} customers`);
        devConsole.addLog('info', `Successfully fetched ${result.length} customers from ${logPrefix}`, { count: result.length, mode: isDemo ? 'demo' : 'live' }, 'database');
        return result;
      } catch (error) {
        console.error('❌ [HOOK-DEBUG] Customer fetch failed:', error);
        devConsole.addLog('error', `Failed to fetch customers from ${logPrefix}`, error, 'database');
        throw error;
      }
    },
    retry: isDemo ? 0 : 1, // No retries needed for demo mode
    retryDelay: 3000,
    staleTime: isDemo ? Infinity : 30 * 1000, // Demo data never goes stale
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: !isDemo, // Don't refetch on reconnect in demo mode
  });

  // Fetch ALL invoices with pagination
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: ['invoices', isDemo ? 'demo' : 'live'],
    queryFn: async () => {
      console.log(`🔄 [HOOK-DEBUG] Starting invoices fetch - Mode: ${isDemo ? 'DEMO' : 'LIVE'}...`);
      const logPrefix = isDemo ? 'Demo' : 'Supabase';
      devConsole.addLog('info', `Fetching ALL invoices from ${logPrefix}`, { mode: isDemo ? 'demo' : 'live' }, 'database');
      try {
        const result = await fetchInvoices();
        console.log(`✅ [HOOK-DEBUG] Invoices fetch completed: ${result.length} invoices`);
        devConsole.addLog('info', `Successfully fetched ${result.length} invoices from ${logPrefix}`, { count: result.length, mode: isDemo ? 'demo' : 'live' }, 'database');
        return result;
      } catch (error) {
        console.error('❌ [HOOK-DEBUG] Invoices fetch failed:', error);
        devConsole.addLog('error', `Failed to fetch invoices from ${logPrefix}`, error, 'database');
        throw error;
      }
    },
    retry: isDemo ? 0 : 1, // No retries needed for demo mode
    retryDelay: 3000,
    staleTime: isDemo ? Infinity : 30 * 1000, // Demo data never goes stale
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: !isDemo, // Don't refetch on reconnect in demo mode
  });

  // Simplified loading state logging - remove potential loop causes
  useEffect(() => {
    const debugData = {
      customersLoading,
      invoicesLoading,
      customersError: customersError?.message,
      invoicesError: invoicesError?.message,
      customersCount: customers?.length,
      invoicesCount: invoices?.length,
      demoMode: isDemo,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 [HOOK-DEBUG] Loading states:', debugData);
    
    // Only log significant state changes to prevent spam
    const isSignificantChange = customersLoading !== invoicesLoading || 
                               (customers?.length > 0 && invoices?.length > 0);
    
    if (isSignificantChange) {
      // Throttled logging to prevent loops using module-level variable
      const now = Date.now();
      if (now - lastLogTime > 5000) {
        lastLogTime = now;
        // Removed devConsole logging here to prevent infinite loops
      }
    }
  }, [customersLoading, invoicesLoading, customersError, invoicesError, customers?.length, invoices?.length, isDemo]);

  // Enhanced refetch function with cache invalidation
  const refetch = async () => {
    console.log(`🔄 [HOOK-DEBUG] Manual refetch triggered - Mode: ${isDemo ? 'DEMO' : 'LIVE'}...`);
    try {
      if (isDemo) {
        console.log('🎭 [HOOK-DEBUG] Demo mode - refreshing local data cache...');
        await queryClient.invalidateQueries({ queryKey: ['customers', 'demo'] });
        await queryClient.invalidateQueries({ queryKey: ['invoices', 'demo'] });
      } else {
        console.log('🗑️ [HOOK-DEBUG] Live mode - invalidating Supabase cache...');
        await queryClient.invalidateQueries({ queryKey: ['customers', 'live'] });
        await queryClient.invalidateQueries({ queryKey: ['invoices', 'live'] });
      }
      
      // Then refetch the data
      console.log('🔄 [HOOK-DEBUG] Refetching data after cache invalidation...');
      await Promise.all([refetchCustomers(), refetchInvoices()]);
      console.log('✅ [HOOK-DEBUG] Manual refetch completed');
    } catch (error) {
      console.error('❌ [HOOK-DEBUG] Manual refetch failed:', error);
    }
  };

  // Function to force cache invalidation without refetch
  const invalidateCache = async () => {
    console.log(`🗑️ [HOOK-DEBUG] Force invalidating cache - Mode: ${isDemo ? 'DEMO' : 'LIVE'}...`);
    const mode = isDemo ? 'demo' : 'live';
    await queryClient.invalidateQueries({ queryKey: ['customers', mode] });
    await queryClient.invalidateQueries({ queryKey: ['invoices', mode] });
    console.log('✅ [HOOK-DEBUG] Cache invalidation completed');
  };

  const isLoading = customersLoading || invoicesLoading;
  const error = customersError || invoicesError;

  console.log('🎯 [HOOK-DEBUG] Final hook state:', {
    isLoading,
    hasError: !!error,
    customersCount: customers?.length || 0,
    invoicesCount: invoices?.length || 0,
    demoMode: isDemo
  });

  return {
    customers,
    invoices,
    isLoading,
    error,
    refetch,
    invalidateCache,
    devConsole,
    isDemoMode: isDemo
  };
};
