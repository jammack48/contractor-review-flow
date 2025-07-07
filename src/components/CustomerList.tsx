import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, Phone, Mail, MapPin, Calendar, Eye, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer, Invoice, FilterState, BankTransaction } from '@/types/crm';
import { useAllBankTransactions } from '@/hooks/useAllBankTransactions';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import InvoiceDetailModal from '@/components/InvoiceDetailModal';

interface CustomerListProps {
  customers: Customer[];
  invoices: Invoice[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

// Component to handle individual customer card with bank transactions
const CustomerCard: React.FC<{
  customer: Customer & {
    totalIncome: number;
    totalExpenses: number;
    incomeInvoiceCount: number;
    expenseInvoiceCount: number;
    totalInvoices: number;
    lastInvoiceDate: string | null;
  };
  bankTransactions: BankTransaction[];
  onCustomerClick: (customer: Customer) => void;
  cleanCustomerName: (name: string) => string;
  extractPhoneNumber: (phoneData: any) => string;
  extractAddress: (addressData: any) => string;
}> = ({ customer, bankTransactions, onCustomerClick, cleanCustomerName, extractPhoneNumber, extractAddress }) => {
  const primaryEmail = customer.email_address;
  const primaryPhone = customer.phone_numbers && customer.phone_numbers.length > 0 
    ? extractPhoneNumber(customer.phone_numbers)
    : '';
  const primaryAddress = customer.addresses && customer.addresses.length > 0
    ? extractAddress(customer.addresses[0])
    : '';

  // Calculate bank transaction totals
  const bankIncomeTransactions = bankTransactions.filter(t => t.transaction_type === 'RECEIVE');
  const bankExpenseTransactions = bankTransactions.filter(t => t.transaction_type === 'SPEND');
  
  const bankIncome = bankIncomeTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const bankExpenses = bankExpenseTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

  // Add bank transactions to totals
  const totalIncomeWithBank = customer.totalIncome + bankIncome;
  const totalExpensesWithBank = customer.totalExpenses + bankExpenses;

  // Calculate total transactions including bank transactions
  const totalTransactions = customer.totalInvoices + bankTransactions.length;

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer bg-green-600 border-green-700 hover:bg-green-700 text-white"
      onClick={() => onCustomerClick(customer)}
    >
      <CardHeader className="pb-3 bg-green-700 rounded-t-lg min-h-[140px] flex flex-col justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg text-white">{cleanCustomerName(customer.name)}</CardTitle>
          <div className="mt-2 space-y-1">
            {/* Address - always reserve space */}
            <CardDescription className="flex items-center gap-1 text-green-100 min-h-[16px]">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {primaryAddress || 'No address'}
              </span>
            </CardDescription>
            
            {/* Contact info grid - fixed height */}
            <div className="grid grid-cols-1 gap-1 text-xs min-h-[32px]">
              <div className="flex items-center gap-1 text-green-100 min-h-[16px]">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {primaryEmail || 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-green-100 min-h-[16px]">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>
                  {primaryPhone || 'No phone'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Income and Expenses - including bank transactions */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-white rounded border border-green-300">
            <p className="text-xs text-green-600">Income</p>
            <p className="font-semibold text-green-700">
              ${totalIncomeWithBank.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 bg-white rounded border border-red-300">
            <p className="text-xs text-red-600">Expenses</p>
            <p className="font-semibold text-red-700">
              ${totalExpensesWithBank.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Invoice Counts */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-white rounded border border-green-300">
            <p className="text-xs text-green-600">Income Invoices</p>
            <p className="font-semibold text-green-700">{customer.incomeInvoiceCount}</p>
          </div>
          <div className="text-center p-2 bg-white rounded border border-red-300">
            <p className="text-xs text-red-600">Expense Invoices</p>
            <p className="font-semibold text-red-700">{customer.expenseInvoiceCount}</p>
          </div>
        </div>

        {/* Bank Transactions Box */}
        <div className="text-center p-2 bg-white rounded border border-blue-300">
          <p className="text-xs text-blue-600">Bank Transactions</p>
          <p className="font-semibold text-blue-700">{bankTransactions.length}</p>
        </div>

        {/* Stacked Folder Icon Section */}
        <div className="text-center p-3 bg-white rounded border border-green-300 hover:bg-green-50 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <Layers className="h-6 w-6 text-green-600" />
            <p className="text-xs text-green-600 font-medium">View All Details</p>
            <p className="text-xs text-green-500">
              {totalTransactions} total transactions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CustomerList: React.FC<CustomerListProps> = ({ 
  customers, 
  invoices, 
  filters, 
  onFiltersChange 
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'totalSpend' | 'lastInvoiceDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch all bank transactions once
  const { data: allBankTransactions = {}, isLoading: isBankTransactionsLoading } = useAllBankTransactions();

  // Helper function to clean customer names for display
  const cleanCustomerName = (name: string): string => {
    if (!name) return '';
    
    // Check if name starts with 4 digits followed by letters
    const match = name.match(/^(\d{4})([A-Za-z].*)$/);
    if (match) {
      // Return the name without the 4-digit prefix
      return match[2].trim();
    }
    
    // Return original name if no 4-digit prefix found
    return name;
  };

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

  // Calculate customer metrics from invoices - similar to KyronsBadges
  const customersWithMetrics = customers.map(customer => {
    // ACCREC invoices (money coming IN from customers) - Income
    const incomeInvoices = invoices.filter(invoice => 
      invoice.xero_contact_id === customer.xero_contact_id && 
      invoice.invoice_type === 'ACCREC'
    );
    
    // ACCPAY invoices (money going OUT to suppliers/expenses) - Expenses
    const expenseInvoices = invoices.filter(invoice => 
      invoice.xero_contact_id === customer.xero_contact_id && 
      invoice.invoice_type === 'ACCPAY'
    );

    const totalIncome = incomeInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const totalExpenses = expenseInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const incomeInvoiceCount = incomeInvoices.length;
    const expenseInvoiceCount = expenseInvoices.length;
    const totalInvoices = incomeInvoiceCount + expenseInvoiceCount;
    
    const lastInvoiceDate = totalInvoices > 0 
      ? Math.max(...invoices
          .filter(inv => inv.xero_contact_id === customer.xero_contact_id)
          .map(inv => new Date(inv.invoice_date || '').getTime()))
      : 0;
    
    return {
      ...customer,
      totalIncome,
      totalExpenses,
      incomeInvoiceCount,
      expenseInvoiceCount,
      totalInvoices,
      totalSpend: totalIncome, // For backwards compatibility with sorting
      invoiceCount: totalInvoices,
      lastInvoiceDate: lastInvoiceDate > 0 ? new Date(lastInvoiceDate).toISOString() : null
    };
  });

  const getCustomerInvoices = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    return invoices.filter(invoice => invoice.xero_contact_id === customer.xero_contact_id);
  };

  const getCustomerBankTransactions = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    return allBankTransactions[customer.xero_contact_id] || [];
  };

  const handleSort = (field: 'name' | 'totalSpend' | 'lastInvoiceDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedCustomers = [...customersWithMetrics].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'totalSpend':
        aValue = a.totalSpend || 0;
        bValue = b.totalSpend || 0;
        break;
      case 'lastInvoiceDate':
        aValue = a.lastInvoiceDate ? new Date(a.lastInvoiceDate).getTime() : 0;
        bValue = b.lastInvoiceDate ? new Date(b.lastInvoiceDate).getTime() : 0;
        break;
      default:
        // Use cleaned names for sorting
        aValue = cleanCustomerName(a.name).toLowerCase();
        bValue = cleanCustomerName(b.name).toLowerCase();
    }

    if (sortOrder === 'desc') {
      return aValue < bValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  const filteredCustomers = sortedCustomers.filter(customer => {
    if (!filters.searchTerm) return true;
    const searchTerm = filters.searchTerm.toLowerCase();
    const cleanedName = cleanCustomerName(customer.name);
    return (
      customer.name.toLowerCase().includes(searchTerm) ||
      cleanedName.toLowerCase().includes(searchTerm) ||
      customer.email_address?.toLowerCase().includes(searchTerm) ||
      customer.contact_status?.toLowerCase().includes(searchTerm)
    );
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Income', 'Expenses', 'Total Invoices', 'Last Invoice Date'];
    
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(customer => {
        const primaryPhone = customer.phone_numbers && customer.phone_numbers.length > 0 
          ? extractPhoneNumber(customer.phone_numbers)
          : '';
        
        return [
          `"${cleanCustomerName(customer.name)}"`,
          `"${customer.email_address || ''}"`,
          `"${primaryPhone}"`,
          `"${customer.contact_status || ''}"`,
          customer.totalIncome || 0,
          customer.totalExpenses || 0,
          customer.totalInvoices || 0,
          customer.lastInvoiceDate || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInvoiceClick = (invoice: Invoice, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const getSelectedInvoiceCustomer = () => {
    if (!selectedInvoice) return null;
    return customers.find(c => c.xero_contact_id === selectedInvoice.xero_contact_id) || null;
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <Card className="border-green-200 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400" />
                <Input
                  placeholder="Search customers..."
                  value={filters.searchTerm}
                  onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                  className="pl-10 border-green-200 focus:border-green-400"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('name')}
                className={`border-green-200 ${sortBy === 'name' ? 'bg-green-50 text-green-700' : 'hover:bg-green-50'}`}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('totalSpend')}
                className={`border-green-200 ${sortBy === 'totalSpend' ? 'bg-green-50 text-green-700' : 'hover:bg-green-50'}`}
              >
                Total {sortBy === 'totalSpend' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('lastInvoiceDate')}
                className={`border-green-200 ${sortBy === 'lastInvoiceDate' ? 'bg-green-50 text-green-700' : 'hover:bg-green-50'}`}
              >
                Last Invoice {sortBy === 'lastInvoiceDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button onClick={exportToCSV} className="bg-green-500 hover:bg-green-600 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid - Updated to use new CustomerCard component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            bankTransactions={allBankTransactions[customer.xero_contact_id] || []}
            onCustomerClick={setSelectedCustomer}
            cleanCustomerName={cleanCustomerName}
            extractPhoneNumber={extractPhoneNumber}
            extractAddress={extractAddress}
          />
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="border-green-200 bg-white">
          <CardContent className="p-8 text-center">
            <p className="text-green-600">No customers found matching your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          invoices={getCustomerInvoices(selectedCustomer.id)}
          bankTransactions={getCustomerBankTransactions(selectedCustomer.id)}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        customer={getSelectedInvoiceCustomer()}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </div>
  );
};

export default CustomerList;
