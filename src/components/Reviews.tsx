
import React, { useState, useMemo } from 'react';
import { Calendar, MessageSquare, Users, Filter, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Customer, Invoice } from '@/types/crm';
import SmsBalanceCard from '@/components/SmsBalanceCard';
import BulkSmsConfirmDialog from '@/components/BulkSmsConfirmDialog';
import SmsLogDisplay from '@/components/SmsLogDisplay';
import { useSmsHistory } from '@/hooks/useSmsHistory';
import { extractPhoneNumber } from '@/hooks/useSmsService';

interface ReviewsProps {
  customers: Customer[];
  invoices: Invoice[];
}

const Reviews: React.FC<ReviewsProps> = ({ customers, invoices }) => {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<string>('30');
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const { hasRecentSms, getRecentSms } = useSmsHistory();

  // Filter customers based on recent invoices and phone numbers
  const eligibleCustomers = useMemo(() => {
    const days = parseInt(dateFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get customers with recent invoices
    const customersWithRecentInvoices = new Set<string>();
    invoices
      .filter(invoice => 
        invoice.invoice_type === 'ACCREC' && // Only customer invoices, not supplier bills
        invoice.invoice_date && 
        new Date(invoice.invoice_date) >= cutoffDate
      )
      .forEach(invoice => {
        customersWithRecentInvoices.add(invoice.xero_contact_id);
      });

    // Filter customers who have recent invoices and phone numbers
    return customers.filter(customer => {
      // Must have recent invoice
      if (!customersWithRecentInvoices.has(customer.xero_contact_id)) return false;
      
      // Must have phone number
      const phoneNumber = extractPhoneNumber(customer.phone_numbers);
      if (!phoneNumber) return false;

      return true;
    }).map(customer => {
      // Add recent SMS status
      const recentInvoices = invoices.filter(inv => 
        inv.xero_contact_id === customer.xero_contact_id &&
        inv.invoice_type === 'ACCREC' &&
        inv.invoice_date && 
        new Date(inv.invoice_date) >= cutoffDate
      );

      const totalValue = recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const latestInvoice = recentInvoices.sort((a, b) => 
        new Date(b.invoice_date || 0).getTime() - new Date(a.invoice_date || 0).getTime()
      )[0];

      // Check if any invoice has been texted recently
      const hasBeenTexted = recentInvoices.some(inv => hasRecentSms(inv.id));
      const recentSms = recentInvoices.map(inv => getRecentSms(inv.id)).find(sms => sms);

      return {
        ...customer,
        recentInvoiceCount: recentInvoices.length,
        totalRecentValue: totalValue,
        latestInvoiceDate: latestInvoice?.invoice_date,
        hasBeenTexted,
        recentSms,
        phoneNumber: extractPhoneNumber(customer.phone_numbers)
      };
    });
  }, [customers, invoices, dateFilter, hasRecentSms, getRecentSms]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(eligibleCustomers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const getSelectedCustomers = () => {
    return eligibleCustomers.filter(customer => selectedCustomers.has(customer.id));
  };

  const selectedCount = selectedCustomers.size;
  const totalValue = getSelectedCustomers().reduce((sum, customer) => sum + customer.totalRecentValue, 0);

  return (
    <div className="space-y-6">
      {/* SMS Balance */}
      <SmsBalanceCard />

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Review Campaign Filters
          </CardTitle>
          <CardDescription>
            Select customers with recent invoices to send Google review requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium">Recent Invoices:</label>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              Found {eligibleCustomers.length} eligible customers
            </div>
          </div>

          {eligibleCustomers.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedCount === eligibleCustomers.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Select All ({eligibleCustomers.length} customers)
                </span>
              </div>
              
              {selectedCount > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {selectedCount} selected • ${totalValue.toLocaleString()} total value
                  </div>
                  <Button
                    onClick={() => setShowSmsDialog(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Review Requests
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Eligible Customers
          </CardTitle>
          <CardDescription>
            Customers with recent invoices and phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eligibleCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No eligible customers found for the selected date range.</p>
              <p className="text-sm mt-1">Try extending the date range or ensure customers have phone numbers.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligibleCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    selectedCustomers.has(customer.id)
                      ? 'bg-blue-50 border-blue-200'
                      : customer.hasBeenTexted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={selectedCustomers.has(customer.id)}
                    onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        ${customer.totalRecentValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.recentInvoiceCount} invoice{customer.recentInvoiceCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">
                        {customer.latestInvoiceDate ? 
                          new Date(customer.latestInvoiceDate).toLocaleDateString() : 
                          'No date'
                        }
                      </div>
                      <div className="text-xs text-gray-500">Latest invoice</div>
                    </div>
                    
                    <div className="text-center">
                      {customer.hasBeenTexted ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Recently Texted
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Not Contacted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS History */}
      <SmsLogDisplay />

      {/* SMS Dialog */}
      <BulkSmsConfirmDialog
        open={showSmsDialog}
        onOpenChange={setShowSmsDialog}
        recipientCount={getSelectedCustomers().length}
        estimatedCost={totalValue * 0.1}
        currency="NZD"
        onConfirm={() => {
          setShowSmsDialog(false);
          setSelectedCustomers(new Set());
        }}
      />
    </div>
  );
};

export default Reviews;
