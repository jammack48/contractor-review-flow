
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, CheckSquare, Square, Users, DollarSign, Clock, Send, Save, Edit, X, MessageCircle, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSmsTemplates } from '@/hooks/useSmsTemplates';
import { useSmsService, extractPhoneNumber } from '@/hooks/useSmsService';
import { useSmsBalance } from '@/hooks/useSmsBalance';
import { useSmsHistory } from '@/hooks/useSmsHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SmsBalanceCard from '@/components/SmsBalanceCard';
import BulkSmsConfirmDialog from '@/components/BulkSmsConfirmDialog';
import SmsLogDisplay from '@/components/SmsLogDisplay';

interface ReviewsProps {
  customers: any[];
  invoices: any[];
}

interface InvoiceWithCustomer {
  invoiceId: string;
  customerName: string;
  phone: string;
  email: string;
  invoiceAmount: number;
  invoiceDate: string;
  invoiceNumber: string;
  customerId: string;
  googleReviewGiven: boolean;
}

const Reviews: React.FC<ReviewsProps> = ({ customers, invoices }) => {
  const [dateRange, setDateRange] = useState(30); // 30, 60, or 90 days
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  
  // SMS Testing states
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // SMS Templates hook
  const { template, isLoading: templateLoading, isSaving, saveTemplate } = useSmsTemplates();
  
  // SMS Service hook
  const { isSending, sendResults, sendTestSms, sendBulkSms, setSendResults } = useSmsService();
  
  // SMS Balance hook
  const { balance, fetchBalance } = useSmsBalance();

  // SMS History hook
  const { hasRecentSms, getRecentSms, hasRecentSmsForPhone, getDeliveryStatusColor } = useSmsHistory();

  // Load saved message and phone number when template is loaded
  useEffect(() => {
    if (template && !isEditingMessage) {
      setTestMessage(template.message_content);
      setTestPhoneNumber(template.phone_number || '');
      setHasUnsavedChanges(false);
    }
  }, [template, isEditingMessage]);

  // Track unsaved changes
  useEffect(() => {
    if (template) {
      setHasUnsavedChanges(
        testMessage !== template.message_content || 
        testPhoneNumber !== (template.phone_number || '')
      );
    } else {
      setHasUnsavedChanges(testMessage !== '' || testPhoneNumber !== '');
    }
  }, [testMessage, testPhoneNumber, template]);

  // Filter invoices by date range, invoice type (ACCREC only), and combine with customer data
  const filteredInvoicesWithCustomers = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);

    const recentCustomerInvoices = invoices.filter(invoice => {
      // Only include ACCREC (customer) invoices, not supplier invoices
      if (invoice.invoice_type !== 'ACCREC') {
        return false;
      }
      
      if (!invoice.invoice_date) {
        return false;
      }

      const invoiceDate = new Date(invoice.invoice_date);
      const isRecent = invoiceDate >= cutoffDate;

      return isRecent;
    });

    const invoicesWithCustomers = recentCustomerInvoices.map(invoice => {
      const customer = customers.find(c => c.xero_contact_id === invoice.xero_contact_id);

      // Extract first phone number from the JSONB array using improved logic
      const phoneNumbers = customer?.phone_numbers || [];
      const firstPhone = extractPhoneNumber(phoneNumbers);

      return {
        invoiceId: invoice.id,
        customerName: customer?.name || 'Unknown Customer',
        phone: firstPhone,
        email: customer?.email_address || '',
        invoiceAmount: invoice.total || 0,
        invoiceDate: invoice.invoice_date,
        invoiceNumber: invoice.invoice_number || 'N/A',
        customerId: customer?.id || '',
        googleReviewGiven: customer?.google_review_given || false
      } as InvoiceWithCustomer;
    }).sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());

    return invoicesWithCustomers;
  }, [invoices, customers, dateRange]);

  // Get selected customers with valid phone numbers
  const selectedCustomersWithPhones = useMemo(() => {
    const selectedIds = Array.from(selectedInvoices);
    return filteredInvoicesWithCustomers
      .filter(inv => selectedIds.includes(inv.invoiceId) && inv.phone && inv.phone.trim() !== '')
      .map(inv => ({ 
        name: inv.customerName, 
        phone: inv.phone, 
        invoiceId: inv.invoiceId 
      }));
  }, [selectedInvoices, filteredInvoicesWithCustomers]);

  // Calculate estimated cost for bulk send
  const estimatedBulkCost = useMemo(() => {
    if (!balance) return 0;
    return selectedCustomersWithPhones.length * balance.cost_per_text;
  }, [selectedCustomersWithPhones.length, balance]);

  const handleRowSelect = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoicesWithCustomers.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoicesWithCustomers.map(inv => inv.invoiceId)));
    }
  };

  const handleClearSelection = () => {
    setSelectedInvoices(new Set());
  };

  const handleTestSMS = async () => {
    if (!testPhoneNumber || !testMessage) return;
    
    try {
      await sendTestSms(testMessage, testPhoneNumber);
      // Refresh balance after sending
      fetchBalance();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleBulkSmsConfirm = async () => {
    if (selectedCustomersWithPhones.length === 0 || !testMessage) return;
    
    try {
      await sendBulkSms(testMessage, selectedCustomersWithPhones);
      // Refresh balance after sending
      fetchBalance();
      // Clear selection after successful send
      setSelectedInvoices(new Set());
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSaveMessage = async () => {
    await saveTemplate(testMessage, testPhoneNumber);
    setIsEditingMessage(false);
    setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    if (template) {
      setTestMessage(template.message_content);
      setTestPhoneNumber(template.phone_number || '');
    } else {
      setTestMessage('');
      setTestPhoneNumber('');
    }
    setIsEditingMessage(false);
    setHasUnsavedChanges(false);
  };

  const handleStartEdit = () => {
    setIsEditingMessage(true);
  };

  // Handle Google review toggle
  const handleGoogleReviewToggle = async (customerId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ google_review_given: !currentValue })
        .eq('id', customerId);

      if (error) {
        console.error('Error updating Google review status:', error);
        toast({
          title: "Error",
          description: "Failed to update Google review status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Google review status ${!currentValue ? 'marked as given' : 'unmarked'}`,
      });

      // Force a re-render by updating the customers data
      // This will be handled by the parent component's data refresh
    } catch (error) {
      console.error('Error updating Google review status:', error);
      toast({
        title: "Error",
        description: "Failed to update Google review status",
        variant: "destructive",
      });
    }
  };

  const isRowSelected = (invoiceId: string) => selectedInvoices.has(invoiceId);
  const allSelected = selectedInvoices.size === filteredInvoicesWithCustomers.length && filteredInvoicesWithCustomers.length > 0;

  const smsCharacterLimit = 160;
  const charactersLeft = smsCharacterLimit - testMessage.length;
  const isOverLimit = testMessage.length > smsCharacterLimit;

  // Count customers without phone numbers in selection
  const selectedWithoutPhone = Array.from(selectedInvoices).filter(invoiceId => {
    const invoice = filteredInvoicesWithCustomers.find(inv => inv.invoiceId === invoiceId);
    return !invoice?.phone || invoice.phone.trim() === '';
  }).length;

  // Get row styling based on selection, SMS history, and Google review status
  const getRowStyling = (invoice: InvoiceWithCustomer) => {
    // Priority order: Selected (blue) > Google Review Given (gold) > Recent SMS (green)
    if (isRowSelected(invoice.invoiceId)) {
      return 'bg-blue-100 border-blue-300'; // Blue for selected
    }
    
    if (invoice.googleReviewGiven) {
      return 'bg-yellow-50 border-yellow-200'; // Gold for Google review given
    }
    
    if (hasRecentSms(invoice.invoiceId)) {
      return 'bg-green-50 border-green-200'; // Green for recently texted
    }
    
    return 'hover:bg-green-50'; // Default hover
  };

  return (
    <div className="space-y-6">
      {/* SMS Balance Card */}
      <SmsBalanceCard />

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-300 bg-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Date Range</p>
                <p className="text-2xl font-bold text-green-900">{dateRange} Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-300 bg-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Customer Invoices</p>
                <p className="text-2xl font-bold text-green-900">{filteredInvoicesWithCustomers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-300 bg-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Selected</p>
                <p className="text-2xl font-bold text-green-900">{selectedInvoices.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-300 bg-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Total Value</p>
                <p className="text-2xl font-bold text-green-900">
                  ${filteredInvoicesWithCustomers.reduce((sum, inv) => sum + inv.invoiceAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-green-300 bg-green-100">
        <CardHeader>
          <CardTitle className="text-green-900">Review Requests Management</CardTitle>
          <CardDescription className="text-green-800">Select customer invoices to send review requests to customers (suppliers excluded)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-green-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Section - Existing Controls */}
            <div className="space-y-4">
              {/* Date Range Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-green-800">Date Range:</label>
                <div className="flex gap-2">
                  {[30, 60, 90].map((days) => (
                    <Button
                      key={days}
                      variant={dateRange === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange(days)}
                      className={dateRange === days ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700 hover:bg-green-100"}
                    >
                      {days} Days
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-100"
                >
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
                
                {selectedInvoices.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Clear Selection
                  </Button>
                )}

                {selectedInvoices.size > 0 && (
                  <Badge variant="secondary" className="bg-green-200 text-green-900">
                    {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Section - SMS Testing */}
            <div className="space-y-4 border-l border-green-300 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">SMS Testing</h3>
                  <p className="text-sm text-green-700 mb-4">Test SMS messages before sending to customers</p>
                </div>
                {templateLoading && (
                  <div className="text-sm text-green-600">Loading template...</div>
                )}
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="test-phone" className="text-green-800">Phone Number</Label>
                <Input
                  id="test-phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="w-full border-green-300 bg-white"
                  disabled={templateLoading || isSending}
                />
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="test-message" className="text-green-800">Message</Label>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <span className="text-xs text-orange-600">Unsaved changes</span>
                    )}
                    <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-green-600'}`}>
                      {testMessage.length}/{smsCharacterLimit} characters
                      {isOverLimit && ' (Over limit!)'}
                    </span>
                  </div>
                </div>
                <Textarea
                  id="test-message"
                  placeholder="Enter your test message here..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className={`w-full min-h-[100px] border-green-300 bg-white ${isOverLimit ? 'border-red-300 focus:border-red-500' : ''}`}
                  disabled={templateLoading || isSending}
                />
                {charactersLeft >= 0 && charactersLeft <= 20 && !isOverLimit && (
                  <p className="text-xs text-orange-600">
                    {charactersLeft} characters remaining
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Message Management Buttons */}
                {isEditingMessage ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveMessage}
                      disabled={isSaving || isOverLimit || isSending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Template
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={isSaving || isSending}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartEdit}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                    disabled={templateLoading || isSending}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {template ? 'Update Template' : 'Save Template'}
                  </Button>
                )}

                {/* Test SMS Button */}
                <Button
                  onClick={handleTestSMS}
                  disabled={!testPhoneNumber || !testMessage || isOverLimit || isSending || isEditingMessage}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test SMS
                    </>
                  )}
                </Button>
              </div>

              {/* SMS Results Display */}
              {sendResults && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-2">SMS Send Results:</p>
                  <p className="text-sm text-blue-700">
                    Successfully sent: {sendResults.successful}/{sendResults.totalSent}
                  </p>
                  {sendResults.failed > 0 && (
                    <p className="text-sm text-red-600">
                      Failed: {sendResults.failed}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Activity Log */}
      <SmsLogDisplay />

      {/* Invoices Table */}
      <Card className="border-green-300 bg-green-100">
        <CardHeader>
          <CardTitle className="text-green-900">Recent Customer Invoices</CardTitle>
          <CardDescription className="text-green-800">
            Customer invoices from the last {dateRange} days • Click rows to select for review requests • 
            <span className="inline-block ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">Blue = Selected</span>
            <span className="inline-block ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">Gold = Google Review Given</span>
            <span className="inline-block ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded">Green = Recently Texted</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-green-50">
          {filteredInvoicesWithCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No customer invoices found in the last {dateRange} days</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>SMS Status</TableHead>
                  <TableHead>Google Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoicesWithCustomers.map((invoice) => {
                  const recentSms = getRecentSms(invoice.invoiceId);
                  return (
                    <TableRow
                      key={invoice.invoiceId}
                      className={`cursor-pointer transition-colors ${getRowStyling(invoice)}`}
                      onClick={() => handleRowSelect(invoice.invoiceId)}
                    >
                      <TableCell>
                        {isRowSelected(invoice.invoiceId) ? (
                          <CheckSquare className="h-5 w-5 text-blue-700" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{invoice.customerName}</TableCell>
                      <TableCell className="text-gray-600">
                        {invoice.phone || 'No phone'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {invoice.email || 'No email'}
                      </TableCell>
                      <TableCell className="text-gray-600">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="font-semibold">
                        ${invoice.invoiceAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {recentSms ? (
                          <div className="text-xs">
                            <Badge 
                              variant="secondary" 
                              className={`mb-1 ${
                                recentSms.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                recentSms.delivery_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {recentSms.delivery_status}
                            </Badge>
                            <div className="text-gray-500">
                              {new Date(recentSms.sent_at).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No SMS sent</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={invoice.googleReviewGiven}
                            onCheckedChange={() => handleGoogleReviewToggle(invoice.customerId, invoice.googleReviewGiven)}
                            className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                          />
                          {invoice.googleReviewGiven && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Updated Actions Section */}
      {selectedInvoices.size > 0 && (
        <Card className="border-green-300 bg-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900">Ready for Review Requests</p>
                <div className="text-sm text-green-800 space-y-1">
                  <p>{selectedInvoices.size} customer{selectedInvoices.size !== 1 ? 's' : ''} selected</p>
                  {selectedWithoutPhone > 0 && (
                    <p className="text-orange-600">
                      ⚠ {selectedWithoutPhone} customer{selectedWithoutPhone !== 1 ? 's' : ''} without phone numbers will be skipped
                    </p>
                  )}
                  {selectedCustomersWithPhones.length > 0 && balance && (
                    <p>
                      SMS cost: ${estimatedBulkCost.toFixed(2)} {balance.currency} 
                      ({selectedCustomersWithPhones.length} messages)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled className="text-gray-500">
                  Send Email Requests (Coming Soon)
                </Button>
                <Button 
                  onClick={() => setShowBulkConfirm(true)}
                  disabled={selectedCustomersWithPhones.length === 0 || !testMessage || isOverLimit || isSending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send SMS Requests ({selectedCustomersWithPhones.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk SMS Confirmation Dialog */}
      <BulkSmsConfirmDialog
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        recipientCount={selectedCustomersWithPhones.length}
        estimatedCost={estimatedBulkCost}
        currency={balance?.currency || 'NZD'}
        onConfirm={handleBulkSmsConfirm}
      />
    </div>
  );
};

export default Reviews;
