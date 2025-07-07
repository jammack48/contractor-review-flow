
import React from 'react';
import { X, Phone, Mail, MapPin, DollarSign, Calendar, FileText, CreditCard, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Customer, Invoice, BankTransaction } from '@/types/crm';

interface CustomerDetailModalProps {
  customer: Customer;
  invoices: Invoice[];
  bankTransactions: BankTransaction[];
  onClose: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  invoices,
  bankTransactions,
  onClose
}) => {
  // Improved helper function to safely extract phone number from phone array
  const extractPhoneNumber = (phoneData: any): string => {
    if (!phoneData) return '';
    
    // If it's already a string, return it
    if (typeof phoneData === 'string') return phoneData;
    
    // If it's an array of phone objects
    if (Array.isArray(phoneData)) {
      // First, try to find a mobile number with a non-empty PhoneNumber
      for (const phone of phoneData) {
        if (phone && typeof phone === 'object' && 
            phone.PhoneType === 'MOBILE' && 
            phone.PhoneNumber && 
            phone.PhoneNumber.trim() !== '') {
          return phone.PhoneNumber.trim();
        }
      }
      
      // If no mobile found, look for any non-empty phone number
      for (const phone of phoneData) {
        if (phone && typeof phone === 'object' && 
            phone.PhoneNumber && 
            phone.PhoneNumber.trim() !== '') {
          return phone.PhoneNumber.trim();
        }
      }
    }
    
    // If it's a single object, try to extract the phone number
    if (typeof phoneData === 'object') {
      return phoneData.PhoneNumber || phoneData.phoneNumber || '';
    }
    
    return '';
  };

  // Helper function to safely extract address from address object
  const extractAddress = (addressData: any): string => {
    if (!addressData) return '';
    
    // If it's already a string, return it
    if (typeof addressData === 'string') return addressData;
    
    // If it's an object, try to extract the address
    if (typeof addressData === 'object') {
      return addressData.AddressLine1 || addressData.addressLine1 || addressData.Address || '';
    }
    
    return '';
  };

  // Format work description - split by pipe character
  const formatWorkDescription = (description: string) => {
    if (!description) return '';
    
    // Split by pipe character, trim each segment, and join with newlines
    const lines = description.split('|').map(line => line.trim());
    
    return lines.join('\n');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getInvoiceTypeColor = (invoiceType: string) => {
    const colors: { [key: string]: string } = {
      'accrec': 'bg-blue-100 text-blue-800',
      'accpay': 'bg-purple-100 text-purple-800',
      'receipt': 'bg-green-100 text-green-800',
      'payment': 'bg-orange-100 text-orange-800'
    };
    
    const type = invoiceType.toLowerCase();
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getBankTransactionTypeColor = (transactionType: string) => {
    const colors: { [key: string]: string } = {
      'receive': 'bg-green-100 text-green-800',
      'spend': 'bg-red-100 text-red-800'
    };
    
    const type = transactionType?.toLowerCase() || '';
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Calculate total spend and unpaid amount
  const totalSpend = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const unpaidAmount = invoices
    .filter(invoice => invoice.invoice_status !== 'PAID')
    .reduce((sum, invoice) => sum + (invoice.amount_due || 0), 0);

  // Sort invoices by date
  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(b.invoice_date || '').getTime() - new Date(a.invoice_date || '').getTime()
  );

  // Sort bank transactions by date
  const sortedBankTransactions = [...bankTransactions].sort((a, b) => 
    new Date(b.transaction_date || '').getTime() - new Date(a.transaction_date || '').getTime()
  );

  // Helper function to check if a field has meaningful content
  const hasContent = (field: string | null | undefined) => {
    return field && field.trim() !== '';
  };

  // Extract phone and email from Xero arrays using improved logic
  const primaryEmail = customer.email_address;
  const primaryPhone = customer.phone_numbers && customer.phone_numbers.length > 0 
    ? extractPhoneNumber(customer.phone_numbers)
    : '';
  const primaryAddress = customer.addresses && customer.addresses.length > 0
    ? extractAddress(customer.addresses[0])
    : '';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-4 sm:p-6 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <span className="truncate">{customer.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Contact Information - Always visible */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasContent(primaryEmail) && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-medium break-all">{primaryEmail}</p>
                        </div>
                      </div>
                    )}
                    {hasContent(primaryPhone) && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="text-sm font-medium">{primaryPhone}</p>
                        </div>
                      </div>
                    )}
                    {hasContent(primaryAddress) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="text-sm font-medium break-words">{primaryAddress}</p>
                        </div>
                      </div>
                    )}
                    {!hasContent(primaryEmail) && !hasContent(primaryPhone) && !hasContent(primaryAddress) && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No contact information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hasContent(customer.contact_status) && (
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-medium text-sm sm:text-base">{customer.contact_status}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700">
                          ${totalSpend.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Invoices</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700">{invoices.length}</p>
                      </div>
                      {unpaidAmount > 0 && (
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">Outstanding</p>
                          <p className="text-xl sm:text-2xl font-bold text-red-700">
                            ${unpaidAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction History */}
              <div className="lg:col-span-2 space-y-4">
                {/* Invoice History */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Invoice History</CardTitle>
                    <CardDescription>
                      {invoices.length} invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[30vh] overflow-y-auto">
                      {sortedInvoices.map((invoice) => (
                        <div key={invoice.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={`${getInvoiceTypeColor(invoice.invoice_type)} text-xs`}
                              >
                                {invoice.invoice_type}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={`${getStatusColor(invoice.invoice_status)} text-xs`}
                              >
                                {invoice.invoice_status}
                              </Badge>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-semibold text-base sm:text-lg">
                                ${(invoice.total || 0).toLocaleString()}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {invoice.invoice_number || 'No number'}
                              </p>
                            </div>
                          </div>

                          {/* Show work description if available */}
                          {invoice.work_description && invoice.work_description.trim() !== '' && (
                            <div className="bg-blue-50 p-3 rounded-lg border">
                              <p className="text-xs text-gray-600 mb-1">Work Description:</p>
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                                {formatWorkDescription(invoice.work_description)}
                              </pre>
                            </div>
                          )}

                          <div className="text-sm text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              {invoice.invoice_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm">
                                    {new Date(invoice.invoice_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {invoice.due_date && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs sm:text-sm text-orange-600">
                                    Due: {new Date(invoice.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {invoice.amount_due > 0 && (
                            <div className="bg-red-50 p-2 rounded">
                              <p className="text-sm text-red-700">
                                Amount Due: ${invoice.amount_due.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {invoices.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No invoices found for this customer.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bank Transactions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      Bank Transactions
                    </CardTitle>
                    <CardDescription>
                      {bankTransactions.length} transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[30vh] overflow-y-auto">
                      {sortedBankTransactions.map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={`${getBankTransactionTypeColor(transaction.transaction_type)} text-xs`}
                              >
                                {transaction.transaction_type === 'RECEIVE' ? (
                                  <div className="flex items-center gap-1">
                                    <ArrowDownCircle className="h-3 w-3" />
                                    RECEIVE
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <ArrowUpCircle className="h-3 w-3" />
                                    SPEND
                                  </div>
                                )}
                              </Badge>
                              {transaction.status && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.status}
                                </Badge>
                              )}
                              {transaction.is_reconciled && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  Reconciled
                                </Badge>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              <p className={`font-semibold text-base sm:text-lg ${
                                transaction.transaction_type === 'RECEIVE' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.transaction_type === 'RECEIVE' ? '+' : '-'}${Math.abs(transaction.total_amount || 0).toLocaleString()}
                              </p>
                              {transaction.bank_account_name && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {transaction.bank_account_name}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Transaction details */}
                          <div className="space-y-2">
                            {transaction.particulars && (
                              <div className="bg-blue-50 p-3 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">Description:</p>
                                <p className="text-sm text-gray-800">{transaction.particulars}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                              {transaction.reference && (
                                <span>Ref: <strong>{transaction.reference}</strong></span>
                              )}
                              {transaction.code && (
                                <span>Code: <strong>{transaction.code}</strong></span>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              {transaction.transaction_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm">
                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {transaction.sub_total !== transaction.total_amount && transaction.total_tax > 0 && (
                            <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                              <span>Subtotal: ${(transaction.sub_total || 0).toLocaleString()}</span>
                              <span>Tax: ${(transaction.total_tax || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {bankTransactions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No bank transactions found for this customer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailModal;
