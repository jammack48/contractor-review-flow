
import React, { useState } from 'react';
import { Calendar, Filter, RotateCcw, Search, X, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Customer, Invoice, FilterState } from '@/types/crm';
import InvoiceCard from './InvoiceCard';
import InvoiceDetailModal from './InvoiceDetailModal';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  customers: Customer[];
  invoices: Invoice[];
  isRefreshing?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  customers,
  invoices,
  isRefreshing = false
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Debug logging with refresh state
  console.log('🔍 [FilterPanel] Component rendered with:', {
    customersCount: customers.length,
    invoicesCount: invoices.length,
    isRefreshing,
    timestamp: new Date().toISOString(),
    sampleInvoiceKeywords: invoices.slice(0, 3).map(inv => ({
      id: inv.xero_invoice_id,
      keywords: inv.service_keywords
    }))
  });

  const invoiceStatuses = ['PAID', 'AUTHORISED', 'DRAFT', 'SUBMITTED', 'VOIDED'];

  // Extract all unique keywords from invoices and count them
  const keywordCounts = invoices.reduce((acc, invoice) => {
    if (invoice.service_keywords && Array.isArray(invoice.service_keywords)) {
      invoice.service_keywords.forEach(keyword => {
        if (keyword && typeof keyword === 'string') {
          const cleanKeyword = keyword.toLowerCase().trim();
          if (cleanKeyword.length > 0) {
            acc[cleanKeyword] = (acc[cleanKeyword] || 0) + 1;
          }
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 [FilterPanel] Keyword extraction result:', {
    totalKeywords: Object.keys(keywordCounts).length,
    isRefreshing,
    topKeywords: Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => `${keyword} (${count})`)
  });

  // Sort keywords by frequency (most common first)
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([keyword, count]) => ({ keyword, count }));

  // Split into frequent (top 20) and less frequent keywords
  const frequentKeywords = sortedKeywords.slice(0, 20);
  const lessFrequentKeywords = sortedKeywords.slice(20);

  // Get invoices matching selected keywords
  const getMatchingInvoices = () => {
    if (!filters.serviceKeywords || filters.serviceKeywords.length === 0) {
      return [];
    }

    return invoices.filter(invoice => {
      if (!invoice.service_keywords) return false;
      
      // Must match ALL selected keywords
      return filters.serviceKeywords!.every(selectedKeyword =>
        invoice.service_keywords.some(keyword => 
          keyword.toLowerCase().includes(selectedKeyword.toLowerCase())
        )
      );
    });
  };

  const matchingInvoices = getMatchingInvoices();

  const handleKeywordToggle = (keyword: string) => {
    const currentKeywords = filters.serviceKeywords || [];
    const newKeywords = currentKeywords.includes(keyword)
      ? currentKeywords.filter(k => k !== keyword)
      : [...currentKeywords, keyword];
    
    console.log('🎯 [FilterPanel] Keyword toggled:', { keyword, newKeywords });
    
    onFiltersChange({
      ...filters,
      serviceKeywords: newKeywords
    });
  };

  const clearKeywords = () => {
    console.log('🧹 [FilterPanel] Clearing all keywords');
    onFiltersChange({
      ...filters,
      serviceKeywords: []
    });
  };

  const resetFilters = () => {
    console.log('🔄 [FilterPanel] Resetting all filters');
    onFiltersChange({
      invoiceType: '',
      dateRange: { start: '', end: '' },
      invoiceStatus: '',
      searchTerm: '',
      serviceKeywords: []
    });
  };

  const getFilteredResults = () => {
    return customers.filter(customer => {
      const customerInvoices = invoices.filter(invoice => invoice.xero_contact_id === customer.xero_contact_id);
      
      // Apply filters similar to the main filtering logic
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.email_address && customer.email_address.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

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

      if (filters.invoiceStatus) {
        const hasMatchingStatus = customerInvoices.some(invoice => 
          invoice.invoice_status.toLowerCase() === filters.invoiceStatus.toLowerCase()
        );
        if (!hasMatchingStatus) return false;
      }

      // Service keywords filter - must match ALL selected keywords
      if (filters.serviceKeywords && filters.serviceKeywords.length > 0) {
        const hasAllKeywords = filters.serviceKeywords.every(selectedKeyword =>
          customerInvoices.some(invoice => 
            invoice.service_keywords?.some(keyword => 
              keyword.toLowerCase().includes(selectedKeyword.toLowerCase())
            )
          )
        );
        if (!hasAllKeywords) return false;
      }

      return true;
    });
  };

  const filteredCustomers = getFilteredResults();
  const selectedKeywordsCount = filters.serviceKeywords?.length || 0;
  const totalKeywordsCount = sortedKeywords.length;

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const getCustomerForInvoice = (invoice: Invoice) => {
    return customers.find(customer => customer.xero_contact_id === invoice.xero_contact_id) || null;
  };

  // Show loading state while data is being fetched or refreshing
  if ((invoices.length === 0 && customers.length === 0) || isRefreshing) {
    return (
      <div className="space-y-6">
        <Card className="border-green-300 bg-green-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-900">
              {isRefreshing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              Service Keywords Filter
            </CardTitle>
            <CardDescription className="text-green-800">
              {isRefreshing 
                ? "Refreshing keywords after AI extraction..." 
                : "Loading keywords from your invoices..."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-green-50">
            <div className="flex flex-wrap gap-2">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KEYWORD JUMBLE - PRIMARY FILTER */}
      <Card className="border-green-300 bg-green-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Search className="h-5 w-5" />
            Service Keywords Filter
            {isRefreshing && (
              <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
            )}
          </CardTitle>
          <CardDescription className="text-green-800">
            Click keywords to find customers who had those services. Multiple keywords = customers who had ALL selected services.
            {totalKeywordsCount > 0 && (
              <span className="block mt-1 text-sm text-green-700">
                Found {totalKeywordsCount} unique service keywords from {invoices.length} invoices
                {isRefreshing && <span className="text-blue-600 ml-2">(Refreshing...)</span>}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 bg-green-50">
          {/* Selected Keywords Display */}
          {selectedKeywordsCount > 0 && (
            <div className="bg-white border border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-green-900">
                  Selected Keywords ({selectedKeywordsCount})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearKeywords}
                  className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.serviceKeywords?.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="default"
                    className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                    onClick={() => handleKeywordToggle(keyword)}
                  >
                    {keyword} ({keywordCounts[keyword] || 0})
                    <X className="h-3 w-3 ml-2" />
                  </Badge>
                ))}
              </div>
              <div className="mt-3 text-sm text-green-800">
                <strong>Showing:</strong> Customers who had {selectedKeywordsCount === 1 ? 'this service' : 'ALL of these services'}
              </div>
            </div>
          )}

          {/* No Keywords Found State */}
          {totalKeywordsCount === 0 && invoices.length > 0 && !isRefreshing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">
                No service keywords found in your {invoices.length} invoices. 
                Keywords may need to be extracted from invoice descriptions.
              </p>
            </div>
          )}

          {/* Most Common Keywords */}
          {frequentKeywords.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-green-800">Most Common Services</h4>
              <div className="flex flex-wrap gap-2">
                {frequentKeywords.map(({ keyword, count }) => {
                  const isSelected = (filters.serviceKeywords || []).includes(keyword);
                  
                  return (
                    <Badge
                      key={keyword}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer text-sm font-medium px-3 py-2 ${
                        isSelected 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-green-200 hover:bg-green-100 text-green-700'
                      }`}
                      onClick={() => handleKeywordToggle(keyword)}
                    >
                      {keyword} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Less Common Keywords - Expandable */}
          {lessFrequentKeywords.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-800 mb-2">
                View all {lessFrequentKeywords.length} additional keywords ▼
              </summary>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto bg-white p-3 rounded-lg border border-green-300">
                {lessFrequentKeywords.map(({ keyword, count }) => {
                  const isSelected = (filters.serviceKeywords || []).includes(keyword);
                  
                  return (
                    <Badge
                      key={keyword}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer text-xs ${
                        isSelected 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'border-gray-300 hover:bg-green-50 text-gray-700'
                      }`}
                      onClick={() => handleKeywordToggle(keyword)}
                    >
                      {keyword} ({count})
                    </Badge>
                  );
                })}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* INVOICE RESULTS - Show when keywords are selected */}
      {selectedKeywordsCount > 0 && (
        <Card className="border-green-300 bg-green-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <FileText className="h-5 w-5" />
              Invoice Results ({matchingInvoices.length})
            </CardTitle>
            <CardDescription className="text-green-800">
              Invoices containing {selectedKeywordsCount === 1 ? 'the selected keyword' : 'ALL selected keywords'}. 
              Click an invoice to see full details.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-green-50">
            {matchingInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingInvoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    customer={getCustomerForInvoice(invoice)}
                    onClick={() => handleInvoiceClick(invoice)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No invoices found with the selected keyword combination.</p>
                <p className="text-sm mt-1">Try selecting fewer keywords or different combinations.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ADDITIONAL FILTERS */}
      <Card className="border-green-300 bg-green-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Filter className="h-5 w-5" />
            Additional Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-green-50">
          {/* Search and Core Filters in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-green-800">Search Customers</Label>
              <Input
                id="search"
                placeholder="Name or email..."
                value={filters.searchTerm}
                onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                className="mt-1 border-green-300 bg-white"
              />
            </div>

            <div>
              <Label htmlFor="invoiceStatus" className="text-sm font-medium text-green-800">Invoice Status</Label>
              <Select
                value={filters.invoiceStatus}
                onValueChange={(value) => onFiltersChange({ ...filters, invoiceStatus: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="mt-1 border-green-300 bg-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {invoiceStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm font-medium text-green-800">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  placeholder="From date"
                  value={filters.dateRange.start}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                  className="text-xs border-green-300 bg-white"
                />
                <Input
                  type="date"
                  placeholder="To date"
                  value={filters.dateRange.end}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                  className="text-xs border-green-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Results and Reset */}
          <div className="flex justify-between items-center pt-4 border-t border-green-300">
            <div className="text-sm text-green-700">
              Showing <span className="font-semibold text-green-800">{filteredCustomers.length}</span> of {customers.length} customers
              {selectedKeywordsCount > 0 && (
                <span className="text-green-800 ml-2">
                  ({selectedKeywordsCount} keyword{selectedKeywordsCount !== 1 ? 's' : ''} selected)
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-2 border-green-300 hover:bg-green-100 bg-white text-green-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        customer={selectedInvoice ? getCustomerForInvoice(selectedInvoice) : null}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </div>
  );
};

export default FilterPanel;
