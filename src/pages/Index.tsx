import React, { useState, useMemo } from 'react';
import { Wrench, Upload, Users, Filter, Download, BarChart3, Code, LogOut, Crown, Star, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImportPanel from '@/components/ImportPanel';
import CustomerList from '@/components/CustomerList';
import FilterPanel from '@/components/FilterPanel';
import Analytics from '@/components/Analytics';
import KyronsBadges from '@/components/KyronsBadges';
import Reviews from '@/pages/Reviews';
import { DevConsole } from '@/components/DevConsole';
import { FilterState } from '@/types/crm';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { getXeroConnection, getValidAccessToken, deleteXeroConnection } from '@/lib/xeroConnectionService';
import { exitDemoMode } from '@/lib/demoConfig';
import type { XeroConnection } from '@/lib/xeroConnectionService';
import DemoTutorialDialog from '@/components/DemoTutorialDialog';
import { useDemoTutorial } from '@/hooks/useDemoTutorial';
import ProfitCalculator from '@/components/ProfitCalculator';

const Index = () => {
  console.log('🟢 [INDEX-DEBUG] Index component rendering at:', new Date().toISOString());
  
  const queryClient = useQueryClient();
  
  // Xero connection state managed at app level
  const [xeroConnection, setXeroConnection] = useState<XeroConnection | null>(null);
  const [isXeroConnected, setIsXeroConnected] = useState(false);
  const [isCheckingXeroConnection, setIsCheckingXeroConnection] = useState(true);

  // Data version tracking for forcing FilterPanel refresh - more robust tracking
  const [dataVersion, setDataVersion] = useState(0);
  const [isRefreshingAfterExtraction, setIsRefreshingAfterExtraction] = useState(false);
  const [lastExtractionTime, setLastExtractionTime] = useState<Date | null>(null);

  console.log('🟢 [INDEX-DEBUG] About to call useSupabaseData...');
  const { customers, invoices, isLoading, error, devConsole, refetch, invalidateCache, isDemoMode: isDemo } = useSupabaseData();
  console.log('🟢 [INDEX-DEBUG] useSupabaseData completed, result:', { 
    customersLength: customers?.length, 
    invoicesLength: invoices?.length, 
    isLoading,
    error,
    isDemoMode: isDemo,
    timestamp: new Date().toISOString()
  });

  console.log('🟢 [INDEX-DEBUG] About to call useAuth...');
  const { user, signOut } = useAuth();
  console.log('🟢 [INDEX-DEBUG] useAuth completed, user:', user?.username || 'No user');

  const [filters, setFilters] = useState<FilterState>({
    invoiceStatus: '',
    dateRange: { start: '', end: '' },
    searchTerm: '',
    invoiceType: '',
    serviceKeywords: []
  });

  // Tutorial hooks for each screen
  const customersTutorial = useDemoTutorial('customers');
  const badgesTutorial = useDemoTutorial('badges');
  const analyticsTutorial = useDemoTutorial('analytics');
  const filtersTutorial = useDemoTutorial('filters');
  const reviewsTutorial = useDemoTutorial('reviews');
  const setupTutorial = useDemoTutorial('setup');
  const consoleTutorial = useDemoTutorial('console');
  const profitTutorial = useDemoTutorial('profit');

  console.log('🔍 [INDEX-DEBUG] Loading states:', { 
    isLoading, 
    customersCount: customers?.length || 0, 
    invoicesCount: invoices?.length || 0,
    user: user?.username || 'No user',
    userRole: user?.role || 'No role',
    isXeroConnected,
    dataVersion,
    isRefreshingAfterExtraction,
    lastExtractionTime: lastExtractionTime?.toISOString() || 'Never',
    isDemoMode: isDemo,
    timestamp: new Date().toISOString()
  });

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.searchTerm ||
      filters.invoiceStatus ||
      filters.invoiceType ||
      filters.dateRange.start ||
      filters.dateRange.end ||
      (filters.serviceKeywords && filters.serviceKeywords.length > 0)
    );
  }, [filters]);

  const filteredCustomers = useMemo(() => {
    if (!hasActiveFilters) {
      console.log('🔍 [INDEX-DEBUG] No active filters, showing all customers:', customers.length);
      return customers;
    }

    console.log('🔍 [INDEX-DEBUG] Active filters detected, filtering customers...');
    const filtered = customers.filter(customer => {
      const customerInvoices = invoices.filter(invoice => invoice.xero_contact_id === customer.xero_contact_id);

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.email_address && customer.email_address.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Invoice type filter
      if (filters.invoiceType) {
        const hasInvoiceType = customerInvoices.some(invoice => 
          invoice.invoice_type.toLowerCase().includes(filters.invoiceType!.toLowerCase())
        );
        if (!hasInvoiceType) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const hasInvoiceInRange = customerInvoices.some(invoice => {
          if (!invoice.invoice_date) return false;
          const invoiceDate = new Date(invoice.invoice_date);
          const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : new Date('1900-01-01');
          const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : new Date('2100-01-01');
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
        if (!hasInvoiceInRange) return false;
      }

      // Invoice status filter
      if (filters.invoiceStatus) {
        const hasMatchingStatus = customerInvoices.some(invoice => 
          invoice.invoice_status.toLowerCase() === filters.invoiceStatus.toLowerCase()
        );
        if (!hasMatchingStatus) return false;
      }

      // Service keywords filter
      if (filters.serviceKeywords && filters.serviceKeywords.length > 0) {
        const hasMatchingKeywords = customerInvoices.some(invoice => 
          invoice.service_keywords?.some(keyword => 
            filters.serviceKeywords!.includes(keyword)
          )
        );
        if (!hasMatchingKeywords) return false;
      }

      return true;
    });
    
    console.log('🔍 [INDEX-DEBUG] Filtered results:', filtered.length);
    return filtered;
  }, [customers, invoices, filters, hasActiveFilters]);

  const handleSignOut = async () => {
    try {
      if (isDemo) {
        // Exit demo mode and return to login
        exitDemoMode();
      } else {
        // Normal logout for authenticated users
        await signOut();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Enhanced data update handler with proper cache invalidation
  const handleDataUpdated = async () => {
    console.log('🔄 [INDEX-DEBUG] handleDataUpdated called - starting cache invalidation and refresh...');
    setIsRefreshingAfterExtraction(true);
    const extractionStartTime = new Date();
    
    try {
      // Step 1: Force cache invalidation first
      console.log('🗑️ [INDEX-DEBUG] Step 1: Invalidating React Query cache...');
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Step 2: Wait a moment for cache to clear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Trigger fresh data fetch
      console.log('🔄 [INDEX-DEBUG] Step 2: Triggering fresh data fetch...');
      await refetch();
      
      // Step 4: Force FilterPanel to re-render with enhanced version tracking
      setDataVersion(prev => {
        const newVersion = prev + 1;
        console.log('📊 [INDEX-DEBUG] Data version incremented:', { 
          oldVersion: prev, 
          newVersion,
          extractionTime: extractionStartTime.toISOString(),
          timestamp: new Date().toISOString()
        });
        return newVersion;
      });
      
      // Update last extraction time for better tracking
      setLastExtractionTime(extractionStartTime);
      
      // Step 5: Additional cache invalidation to ensure FilterPanel gets fresh data
      setTimeout(async () => {
        console.log('🔄 [INDEX-DEBUG] Step 3: Final cache invalidation for FilterPanel...');
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }, 1000);
      
      console.log('✅ [INDEX-DEBUG] Cache invalidation and data refresh completed successfully');
    } catch (error) {
      console.error('❌ [INDEX-DEBUG] Cache invalidation and data refresh failed:', error);
    } finally {
      // Reset loading state after ensuring proper refresh
      setTimeout(() => {
        setIsRefreshingAfterExtraction(false);
        console.log('🎯 [INDEX-DEBUG] Refresh loading state cleared');
      }, 2000); // Increased delay to ensure complete refresh
    }
  };

  // Check if user has access to developer/import tabs - role-based access
  const hasDevAccess = user?.role === 'admin' || user?.role === 'developer';
  console.log('🔍 [INDEX-DEBUG] DevConsole access:', { userRole: user?.role, hasDevAccess });

  // ======== Improved Loading/Error UI ========
  if (isLoading) {
    console.log('⏳ [INDEX-DEBUG] Showing loading screen at:', new Date().toISOString());
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-green-600">
            {isDemo ? 'Loading demo data...' : 'Loading your CRM data...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {isDemo ? 'Preparing sample customers and invoices' : 'Fetching customers and invoices from database'}
          </p>
          {isDemo && (
            <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg inline-block">
              🎭 Demo Mode Active
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">Debug: {new Date().toISOString()}</p>
        </div>
      </div>
    );
  }

  if (!isLoading && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 text-red-400">⚠️</div>
          <p className="text-red-600 font-bold">
            {isDemo ? 'Failed to load demo data.' : 'Failed to load data.'}
          </p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          <Button
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
            onClick={refetch}
          >
            Try Again
          </Button>
          <p className="text-xs text-gray-400 mt-4">Debug: {new Date().toISOString()}</p>
        </div>
      </div>
    );
  }
  // ======== End Improved Loading/Error UI ========

  console.log('✅ [INDEX-DEBUG] Rendering main content at:', new Date().toISOString());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Demo Mode Banner */}
        {isDemo && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎭</span>
                <div>
                  <p className="text-blue-800 font-semibold">Demo Mode Active</p>
                  <p className="text-blue-600 text-sm">
                    You're viewing sample data to explore ToolBox CRM features
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-800 text-sm font-medium">
                  {customers?.length || 0} sample customers • {invoices?.length || 0} sample invoices
                </p>
                <p className="text-blue-600 text-xs">
                  All data is local and safe to explore
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-green-800">
                  ToolBox CRM {isDemo && <span className="text-blue-600">Demo</span>}
                </h1>
                <p className="text-green-600">
                  {isDemo ? 'Explore our business-focused service extraction' : 'Business-focused service extraction'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back</p>
                <p className="font-semibold text-green-800">
                  {isDemo ? 'Demo User' : user?.username}
                </p>
                <p className="text-xs text-gray-500">
                  Role: {isDemo ? 'Viewer' : user?.role}
                </p>
              </div>
              
              {/* Always show logout/exit button */}
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isDemo ? 'Exit Demo' : 'Sign Out'}
              </Button>
            </div>
          </div>
          
          {/* Updated Data Overview with accurate counts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-green-600">
                      {isDemo ? 'Sample' : 'Total'} Customers
                    </p>
                    <p className="text-2xl font-bold text-green-800">{customers?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-green-600">
                      {isDemo ? 'Sample' : 'Total'} Invoices
                    </p>
                    <p className="text-2xl font-bold text-green-800">{invoices?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-green-600">
                      {hasActiveFilters ? 'Filtered Results' : isDemo ? 'All Sample Data' : 'All Customers'}
                    </p>
                    <p className="text-2xl font-bold text-green-800">{filteredCustomers?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-green-600">
                      {isDemo ? 'Sample' : 'Total'} Revenue
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      ${invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0).toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className={`grid w-full ${hasDevAccess && !isDemo ? 'grid-cols-8' : 'grid-cols-6'} lg:w-fit bg-white border-green-200`}>
            <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Crown className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Filter className="h-4 w-4" />
              Filters
              {isRefreshingAfterExtraction && (
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse ml-1" />
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="profit" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Calculator className="h-4 w-4" />
              Profit Calc
            </TabsTrigger>
            {hasDevAccess && !isDemo && (
              <TabsTrigger value="setup" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Upload className="h-4 w-4" />
                Set Up
              </TabsTrigger>
            )}
            {hasDevAccess && !isDemo && (
              <TabsTrigger 
                value="console" 
                className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <Code className="h-4 w-4" />
                Developers
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="customers" className="space-y-6">
            <CustomerList 
              customers={filteredCustomers || []} 
              invoices={invoices || []}
              filters={filters}
              onFiltersChange={setFilters}
            />
            
            {/* Tutorial Dialog */}
            {customersTutorial.content && (
              <DemoTutorialDialog
                isOpen={customersTutorial.isOpen}
                onClose={customersTutorial.closeTutorial}
                title={customersTutorial.content.title}
                description={customersTutorial.content.description}
              />
            )}
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <KyronsBadges customers={customers || []} invoices={invoices || []} />
            
            {/* Tutorial Dialog */}
            {badgesTutorial.content && (
              <DemoTutorialDialog
                isOpen={badgesTutorial.isOpen}
                onClose={badgesTutorial.closeTutorial}
                title={badgesTutorial.content.title}
                description={badgesTutorial.content.description}
              />
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Analytics customers={customers || []} invoices={invoices || []} />
            
            {/* Tutorial Dialog */}
            {analyticsTutorial.content && (
              <DemoTutorialDialog
                isOpen={analyticsTutorial.isOpen}
                onClose={analyticsTutorial.closeTutorial}
                title={analyticsTutorial.content.title}
                description={analyticsTutorial.content.description}
              />
            )}
          </TabsContent>

          <TabsContent value="filters" className="space-y-6">
            <FilterPanel 
              key={`filter-panel-${dataVersion}-${lastExtractionTime?.getTime() || 0}-${invoices.length}`}
              filters={filters} 
              onFiltersChange={setFilters}
              customers={customers || []}
              invoices={invoices || []}
              isRefreshing={isRefreshingAfterExtraction}
            />
            
            {/* Tutorial Dialog */}
            {filtersTutorial.content && (
              <DemoTutorialDialog
                isOpen={filtersTutorial.isOpen}
                onClose={filtersTutorial.closeTutorial}
                title={filtersTutorial.content.title}
                description={filtersTutorial.content.description}
              />
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Reviews customers={customers || []} invoices={invoices || []} />
            
            {/* Tutorial Dialog */}
            {reviewsTutorial.content && (
              <DemoTutorialDialog
                isOpen={reviewsTutorial.isOpen}
                onClose={reviewsTutorial.closeTutorial}
                title={reviewsTutorial.content.title}
                description={reviewsTutorial.content.description}
              />
            )}
          </TabsContent>

          <TabsContent value="profit" className="space-y-6">
            <ProfitCalculator />
            
            {/* Tutorial Dialog */}
            {profitTutorial.content && (
              <DemoTutorialDialog
                isOpen={profitTutorial.isOpen}
                onClose={profitTutorial.closeTutorial}
                title={profitTutorial.content.title}
                description={profitTutorial.content.description}
              />
            )}
          </TabsContent>

          {hasDevAccess && !isDemo && (
            <TabsContent value="setup" className="space-y-6">
              <ImportPanel 
                devConsole={devConsole} 
                onDataImported={refetch}
                xeroConnection={xeroConnection}
                isXeroConnected={isXeroConnected}
                isCheckingXeroConnection={isCheckingXeroConnection}
                onXeroConnectionChange={(connection, connected) => {
                  setXeroConnection(connection);
                  setIsXeroConnected(connected);
                  setIsCheckingXeroConnection(false);
                }}
              />
              
              {/* Tutorial Dialog */}
              {setupTutorial.content && (
                <DemoTutorialDialog
                  isOpen={setupTutorial.isOpen}
                  onClose={setupTutorial.closeTutorial}
                  title={setupTutorial.content.title}
                  description={setupTutorial.content.description}
                />
              )}
            </TabsContent>
          )}

          {hasDevAccess && !isDemo && (
            <TabsContent value="console" className="space-y-6">
              <DevConsole 
                customersCount={customers?.length || 0}
                invoicesCount={invoices?.length || 0}
                onDataCleared={refetch}
                onDataUpdated={handleDataUpdated}
              />
              
              {/* Tutorial Dialog */}
              {consoleTutorial.content && (
                <DemoTutorialDialog
                  isOpen={consoleTutorial.isOpen}
                  onClose={consoleTutorial.closeTutorial}
                  title={consoleTutorial.content.title}
                  description={consoleTutorial.content.description}
                />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
