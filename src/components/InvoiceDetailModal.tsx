import React, { useState } from 'react';
import { Calendar, DollarSign, FileText, Package, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Invoice, Customer, LineItem } from '@/types/crm';
import { useInvoiceLineItems } from '@/hooks/useInvoiceLineItems';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  customer,
  isOpen,
  onClose
}) => {
  const [showLineItems, setShowLineItems] = useState(false);
  
  // Use the custom hook for lazy loading line items
  const { lineItems, isLoading: lineItemsLoading, loadLineItems, hasLoaded } = useInvoiceLineItems(invoice?.id || null);

  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PAID': 'bg-green-500 text-white',
      'AUTHORISED': 'bg-blue-500 text-white',
      'DRAFT': 'bg-gray-500 text-white',
      'SUBMITTED': 'bg-yellow-500 text-white',
      'DELETED': 'bg-red-500 text-white',
      'VOIDED': 'bg-purple-500 text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatLineItemAmount = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return formatCurrency(amount);
  };

  // Check if we have work description
  const hasWorkDescription = invoice.work_description && invoice.work_description.trim() !== '';

  // Format work description - simply split by pipe character
  const formatWorkDescription = (description: string) => {
    if (!description) return '';
    
    // Split by pipe character, trim each segment, and join with newlines
    const lines = description.split('|').map(line => line.trim());
    
    return lines.join('\n');
  };

  const handleToggleLineItems = () => {
    if (!showLineItems) {
      // If we're showing line items for the first time, load them
      loadLineItems();
    }
    setShowLineItems(!showLineItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Invoice Card: {invoice.invoice_number || 'No Number'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{customer?.name || 'Unknown Customer'}</p>
                  {customer?.email_address && (
                    <p className="text-sm text-gray-600">{customer.email_address}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className={getStatusColor(invoice.invoice_status)}>
                    {invoice.invoice_status}
                  </Badge>
                  <p className="text-sm text-gray-600">Type: {invoice.invoice_type}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Description - Show formatted version if available */}
          {hasWorkDescription && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Work Description</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLineItems}
                    className="flex items-center gap-2"
                    disabled={lineItemsLoading}
                  >
                    {lineItemsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : showLineItems ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {lineItemsLoading ? 'Loading...' : showLineItems ? 'Hide Line Items' : 'Show Line Items'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {formatWorkDescription(invoice.work_description)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items - Only show when requested and loaded */}
          {showLineItems && hasLoaded && lineItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Package className="h-4 w-4" />
                  Line Items ({lineItems.length})
                  <Badge variant="secondary" className="text-xs">
                    Raw Data
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {lineItems.map((item: LineItem, index: number) => (
                      <div key={item.LineItemID || index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.Description || 'Unnamed Item'}
                            </h4>
                            <div className="flex gap-4 text-sm text-gray-600 mt-1">
                              {item.ItemCode && (
                                <span>Code: <strong>{item.ItemCode}</strong></span>
                              )}
                              {item.AccountCode && (
                                <span>Account: <strong>{item.AccountCode}</strong></span>
                              )}
                              {item.TaxType && (
                                <span>Tax: <strong>{item.TaxType}</strong></span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatLineItemAmount(item.LineAmount)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            Qty: <strong>{item.Quantity || 1}</strong>
                          </span>
                          <span>
                            Unit: <strong>{formatLineItemAmount(item.UnitAmount)}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Show loading state for line items */}
          {showLineItems && lineItemsLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-500" />
                <p className="text-gray-500">Loading line items...</p>
              </CardContent>
            </Card>
          )}

          {/* Show empty state if no line items when loaded */}
          {showLineItems && hasLoaded && lineItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                <p>No line items found for this invoice card.</p>
              </CardContent>
            </Card>
          )}

          {/* Show a message if no work description */}
          {!hasWorkDescription && !showLineItems && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Work Details</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLineItems}
                    className="flex items-center gap-2"
                    disabled={lineItemsLoading}
                  >
                    {lineItemsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {lineItemsLoading ? 'Loading...' : 'Show Line Items'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8 text-gray-500">
                <p>No work description available for this invoice card.</p>
                <p className="text-sm mt-1">Click "Show Line Items" to view raw invoice data.</p>
              </CardContent>
            </Card>
          )}

          {/* Financial Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.sub_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(invoice.total_tax)}</span>
                </div>
                {invoice.total_discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.total_discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount Paid</p>
                    <p className="font-medium text-green-600">{formatCurrency(invoice.amount_paid)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount Due</p>
                    <p className="font-medium text-red-600">{formatCurrency(invoice.amount_due)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Credited</p>
                    <p className="font-medium">{formatCurrency(invoice.amount_credited)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailModal;
