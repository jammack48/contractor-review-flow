
import React, { useState } from 'react';
import { Search, X, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchInvoicesSemanticAI } from '@/lib/supabaseService';
import type { Invoice, Customer } from '@/types/crm';

interface InvoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  customers: Customer[];
}

const InvoiceSearchModal: React.FC<InvoiceSearchModalProps> = ({
  isOpen,
  onClose,
  invoices,
  customers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Invoice[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchInvoicesSemanticAI(searchTerm, invoices);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getCustomerName = (xeroContactId: string) => {
    const customer = customers.find(c => c.xero_contact_id === xeroContactId);
    return customer?.name || 'Unknown Customer';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'authorised':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getLineItemsCount = (invoice: Invoice) => {
    return invoice.line_items?.length || 0;
  };

  const getLineItemsSummary = (invoice: Invoice) => {
    if (!invoice.line_items || invoice.line_items.length === 0) {
      return 'No line items';
    }
    
    const firstItems = invoice.line_items.slice(0, 2);
    const summary = firstItems
      .map(item => item.Description || 'Unnamed item')
      .join(', ');
    
    if (invoice.line_items.length > 2) {
      return `${summary}... (+${invoice.line_items.length - 2} more)`;
    }
    
    return summary;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AI Invoice Search
          </DialogTitle>
          <DialogDescription>
            Search through your invoices using AI-powered semantic search
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search invoices by description, customer, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <ScrollArea className="h-96">
            {searchResults.length === 0 && searchTerm && !isSearching && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No invoices found matching your search.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try different keywords or check your spelling.
                </p>
              </div>
            )}

            {!searchTerm && !isSearching && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Enter a search term to find invoices</p>
                <p className="text-sm text-gray-400 mt-1">
                  Use AI-powered search to find invoices by content, customer, or description.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {searchResults.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {invoice.invoice_number || 'No Number'}
                      </h3>
                      <p className="text-gray-600">{getCustomerName(invoice.xero_contact_id)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(invoice.total)}
                      </div>
                      <Badge variant={getStatusBadgeVariant(invoice.invoice_status)}>
                        {invoice.invoice_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'No date'}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {invoice.work_description && (
                      <div className="text-sm">
                        <strong>Work:</strong> <span className="text-gray-700">{invoice.work_description}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600">
                      <strong>Line Items ({getLineItemsCount(invoice)}):</strong> {getLineItemsSummary(invoice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceSearchModal;
