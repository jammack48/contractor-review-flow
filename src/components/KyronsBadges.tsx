import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Crown, Award, Medal, Circle, TrendingUp, TrendingDown, Coins, Mail, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer, Invoice, BankTransaction } from '@/types/crm';
import { useAllBankTransactions } from '@/hooks/useAllBankTransactions';

interface KyronsBadgesProps {
  customers: Customer[];
  invoices: Invoice[];
}

type SortMetric = 'totalIncome' | 'totalExpenses' | 'averageInvoiceValue' | 'invoiceCount' | 'name';
type SortOrder = 'asc' | 'desc';
type BadgeLevel = 'gold' | 'silver' | 'bronze' | 'copper' | 'black';

// Individual customer card component with bank transactions
const CustomerBadgeCard: React.FC<{
  customer: any;
  bankTransactions: BankTransaction[];
  badgeColor: string;
  getBadgeIcon: (level: BadgeLevel) => JSX.Element;
  getBadgeLabel: (level: BadgeLevel) => string;
  getBadgeRange: (level: BadgeLevel) => string;
  phoneNumber: string | null;
  globalRank: number;
  formatMetricValue: (customer: any, metric: SortMetric) => string;
  getCurrentMetricLabel: () => string;
  sortMetric: SortMetric;
  totalCustomers: number;
}> = ({ 
  customer, 
  bankTransactions,
  badgeColor, 
  getBadgeIcon, 
  getBadgeLabel, 
  getBadgeRange, 
  phoneNumber, 
  globalRank, 
  formatMetricValue, 
  getCurrentMetricLabel, 
  sortMetric, 
  totalCustomers 
}) => {
  // Calculate bank transaction totals - Fixed property names
  const bankIncomeTransactions = bankTransactions.filter(t => t.type === 'RECEIVE');
  const bankExpenseTransactions = bankTransactions.filter(t => t.type === 'SPEND');
  
  const bankIncome = bankIncomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const bankExpenses = bankExpenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Add bank transactions to totals
  const totalIncomeWithBank = customer.totalIncome + bankIncome;
  const totalExpensesWithBank = customer.totalExpenses + bankExpenses;

  return (
    <Card className="hover:shadow-lg transition-shadow bg-green-600 border-green-700">
      <CardHeader className="pb-3 bg-green-700 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-white">{customer.name}</CardTitle>
            <CardDescription className="text-green-100">
              {typeof customer.siteAddress === 'string' ? customer.siteAddress : 'No address'}
            </CardDescription>
            
            <div className="grid grid-cols-1 gap-1 mt-2 text-xs">
              <div className="flex items-center gap-1 text-green-100">
                <Mail className="h-3 w-3" />
                <span className="truncate">
                  {customer.email ? customer.email : 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-green-100">
                <Phone className="h-3 w-3" />
                <span>
                  {phoneNumber ? phoneNumber : 'No phone'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`${badgeColor} flex items-center gap-1`}>
              {getBadgeIcon(customer.badgeLevel)}
              {customer.badgeLevel.toUpperCase()}
            </Badge>
            <span className="text-xs text-green-100">{getBadgeLabel(customer.badgeLevel)}</span>
            <span className="text-xs text-green-200">{getBadgeRange(customer.badgeLevel)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
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

        <div className="text-center p-3 bg-white rounded border border-green-300">
          <p className="text-xs text-green-600 mb-1">Current Metric: {getCurrentMetricLabel()}</p>
          <p className="font-bold text-green-800">
            {formatMetricValue(customer, sortMetric)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Global Rank #{globalRank} of {totalCustomers}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const KyronsBadges: React.FC<KyronsBadgesProps> = ({ customers, invoices }) => {
  const [sortMetric, setSortMetric] = useState<SortMetric>('totalIncome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeBadgeFilters, setActiveBadgeFilters] = useState<Set<BadgeLevel>>(
    new Set(['gold', 'silver', 'bronze', 'copper', 'black'])
  );

  // Fetch all bank transactions once
  const { data: allBankTransactions = {} } = useAllBankTransactions();

  // Calculate customer metrics - include ALL customers, no filtering
  const customersWithMetrics = useMemo(() => {
    console.log(`🔍 [BADGES-DEBUG] Including ALL ${customers.length} contacts for calculations`);
    
    return customers.map(customer => {
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
      const averageInvoiceValue = incomeInvoices.length > 0 ? totalIncome / incomeInvoices.length : 0;
      
      return {
        ...customer,
        totalIncome,
        totalExpenses,
        incomeInvoiceCount: incomeInvoices.length,
        expenseInvoiceCount: expenseInvoices.length,
        averageInvoiceValue,
        totalRevenue: totalIncome, // For backwards compatibility
        invoiceCount: incomeInvoices.length, // Default to income invoices for count
        email: customer.email_address,
        siteAddress: customer.addresses && customer.addresses.length > 0 
          ? (customer.addresses[0]?.AddressLine1 || customer.addresses[0])
          : ''
      };
    });
  }, [customers, invoices]);

  // Calculate badges based on current sort metric (dynamic)
  const customersWithBadges = useMemo(() => {
    console.log(`🏆 [BADGES-DEBUG] Badge calculation based on: ${sortMetric}`);
    
    // Separate customers with zero/null values first
    const customersWithZeroValues = customersWithMetrics.filter(customer => {
      let value;
      switch (sortMetric) {
        case 'totalIncome':
          value = customer.totalIncome;
          break;
        case 'totalExpenses':
          value = customer.totalExpenses;
          break;
        case 'averageInvoiceValue':
          value = customer.averageInvoiceValue;
          break;
        case 'invoiceCount':
          value = customer.invoiceCount;
          break;
        case 'name':
          return false; // Names can't be zero/null for badge purposes
        default:
          value = customer.totalIncome;
      }
      return value === 0 || value === null || value === undefined;
    });

    // Get customers with actual values for ranking
    const customersWithValues = customersWithMetrics.filter(customer => {
      let value;
      switch (sortMetric) {
        case 'totalIncome':
          value = customer.totalIncome;
          break;
        case 'totalExpenses':
          value = customer.totalExpenses;
          break;
        case 'averageInvoiceValue':
          value = customer.averageInvoiceValue;
          break;
        case 'invoiceCount':
          value = customer.invoiceCount;
          break;
        case 'name':
          return true; // All names are valid
        default:
          value = customer.totalIncome;
      }
      return value > 0;
    });
    
    // Sort customers with values by the current sort metric for badge calculation
    const sortedForBadges = [...customersWithValues].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortMetric) {
        case 'totalIncome':
          aValue = a.totalIncome;
          bValue = b.totalIncome;
          break;
        case 'totalExpenses':
          aValue = a.totalExpenses;
          bValue = b.totalExpenses;
          break;
        case 'averageInvoiceValue':
          aValue = a.averageInvoiceValue;
          bValue = b.averageInvoiceValue;
          break;
        case 'invoiceCount':
          aValue = a.invoiceCount;
          bValue = b.invoiceCount;
          break;
        case 'name':
          // For name sorting, reverse the order so A-Z gets better badges
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        default:
          aValue = a.totalIncome;
          bValue = b.totalIncome;
      }

      // For numeric metrics, sort descending (highest first)
      return bValue - aValue;
    });

    console.log(`🏆 [BADGES-DEBUG] Ranking ${sortedForBadges.length} customers with values by ${sortMetric}, ${customersWithZeroValues.length} customers with zero/null values get black badges`);

    // Assign badges to customers with values based on their position in the sorted list
    const rankedCustomersWithValues = sortedForBadges.map((customer, index) => {
      let badgeLevel: BadgeLevel;
      const totalCustomers = sortedForBadges.length;
      
      // Calculate percentile: top performers get lower percentile values
      const percentileFromTop = (index / totalCustomers) * 100;
      
      // Updated badge percentiles: Gold 10%, Silver 20%, Bronze 40%, Copper 20%, Black 0%
      if (percentileFromTop < 10) badgeLevel = 'gold';         // Top 10% (0-10%)
      else if (percentileFromTop < 30) badgeLevel = 'silver';  // Next 20% (10-30%)
      else if (percentileFromTop < 70) badgeLevel = 'bronze';  // Next 40% (30-70%)
      else badgeLevel = 'copper';                              // Bottom 20% (70-100%)
      
      return {
        ...customer,
        badgeLevel
      };
    });

    // Assign black badges to customers with zero/null values (changed back from gray to black)
    const customersWithBlackBadges = customersWithZeroValues.map(customer => ({
      ...customer,
      badgeLevel: 'black' as BadgeLevel
    }));

    // Combine all customers
    return [...rankedCustomersWithValues, ...customersWithBlackBadges];
  }, [customersWithMetrics, sortMetric]);

  // Create a global ranking of ALL customers for the current metric (for rank display)
  const globalRankedCustomers = useMemo(() => {
    console.log(`📊 [BADGES-DEBUG] Creating global ranking for ${sortMetric}`);
    
    // Sort ALL customers by the current metric
    const sortedCustomers = [...customersWithBadges].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortMetric) {
        case 'totalIncome':
          aValue = a.totalIncome;
          bValue = b.totalIncome;
          break;
        case 'totalExpenses':
          aValue = a.totalExpenses;
          bValue = b.totalExpenses;
          break;
        case 'averageInvoiceValue':
          aValue = a.averageInvoiceValue;
          bValue = b.averageInvoiceValue;
          break;
        case 'invoiceCount':
          aValue = a.invoiceCount;
          bValue = b.invoiceCount;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.totalIncome;
          bValue = b.totalIncome;
      }

      // Sort descending for all metrics except name
      if (sortMetric === 'name') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return bValue - aValue;
    });

    // Create a map of customer ID to global rank
    const rankMap = new Map();
    sortedCustomers.forEach((customer, index) => {
      rankMap.set(customer.id, index + 1);
    });

    return rankMap;
  }, [customersWithBadges, sortMetric]);

  // Sort customers for DISPLAY based on UI controls (separate from badge calculation)
  const sortedCustomersForDisplay = useMemo(() => {
    return [...customersWithBadges].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortMetric) {
        case 'totalIncome':
          aValue = a.totalIncome;
          bValue = b.totalIncome;
          break;
        case 'totalExpenses':
          aValue = a.totalExpenses;
          bValue = b.totalExpenses;
          break;
        case 'averageInvoiceValue':
          aValue = a.averageInvoiceValue;
          bValue = b.averageInvoiceValue;
          break;
        case 'invoiceCount':
          aValue = a.invoiceCount;
          bValue = b.invoiceCount;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a.totalIncome;
          bValue = b.totalIncome;
        }
      
      // UI sorting logic
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });
  }, [customersWithBadges, sortMetric, sortOrder]);

  // Filter by badge levels only (no search filtering)
  const finalFilteredCustomers = useMemo(() => {
    return sortedCustomersForDisplay.filter(customer => 
      activeBadgeFilters.has(customer.badgeLevel)
    );
  }, [sortedCustomersForDisplay, activeBadgeFilters]);

  // Calculate badge counts for display based on complete dataset
  const badgeCounts = useMemo(() => {
    const counts = { gold: 0, silver: 0, bronze: 0, copper: 0, black: 0 };
    customersWithBadges.forEach(customer => {
      counts[customer.badgeLevel]++;
    });
    return counts;
  }, [customersWithBadges]);

  // Helper function to extract phone number (similar to CustomerList)
  const extractPhoneNumber = (customer: Customer) => {
    if (customer.phone_numbers && customer.phone_numbers.length > 0) {
      const phoneObj = customer.phone_numbers[0];
      if (typeof phoneObj === 'object' && phoneObj.PhoneNumber) {
        return phoneObj.PhoneNumber;
      } else if (typeof phoneObj === 'string') {
        return phoneObj;
      }
    }
    return null;
  };

  const getBadgeColor = (level: BadgeLevel) => {
    switch (level) {
      case 'gold': return 'bg-yellow-500 text-yellow-900 border-yellow-600';
      case 'silver': return 'bg-gray-400 text-gray-900 border-gray-500';
      case 'bronze': return 'bg-amber-600 text-amber-100 border-amber-700';
      case 'copper': return 'bg-orange-600 text-orange-100 border-orange-700';
      case 'black': return 'bg-black text-white border-gray-800'; // Changed back from gray to black
    }
  };

  const getBadgeIcon = (level: BadgeLevel) => {
    switch (level) {
      case 'gold': return <Crown className="h-4 w-4" />;
      case 'silver': return <Award className="h-4 w-4" />;
      case 'bronze': return <Medal className="h-4 w-4" />;
      case 'copper': return <Coins className="h-4 w-4" />;
      case 'black': return <X className="h-4 w-4" />; // Changed back from Circle to X
    }
  };

  const getBadgeLabel = (level: BadgeLevel) => {
    switch (level) {
      case 'gold': return 'Top 10%';
      case 'silver': return 'Next 20%';
      case 'bronze': return 'Next 40%';
      case 'copper': return 'Bottom 20%';
      case 'black': return 'No Data'; // Keep as "No Data"
    }
  };

  const getBadgeRange = (level: BadgeLevel) => {
    switch (level) {
      case 'gold': return '100-90%';
      case 'silver': return '90-70%';
      case 'bronze': return '70-30%';
      case 'copper': return '30-0%';
      case 'black': return '0% or null'; // Changed back from "No activity" to "0% or null"
    }
  };

  const toggleBadgeFilter = (level: BadgeLevel) => {
    setActiveBadgeFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(level)) {
        newFilters.delete(level);
      } else {
        newFilters.add(level);
      }
      return newFilters;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  const formatMetricValue = (customer: any, metric: SortMetric) => {
    switch (metric) {
      case 'totalIncome':
        return `$${customer.totalIncome.toLocaleString()}`;
      case 'totalExpenses':
        return `$${customer.totalExpenses.toLocaleString()}`;
      case 'averageInvoiceValue':
        return `$${customer.averageInvoiceValue.toLocaleString()}`;
      case 'invoiceCount':
        return `${customer.invoiceCount} invoices`;
      case 'name':
        return customer.name;
      default:
        return '';
    }
  };

  const getCurrentMetricLabel = () => {
    switch (sortMetric) {
      case 'totalIncome':
        return 'Total Income';
      case 'totalExpenses':
        return 'Total Expenses';
      case 'averageInvoiceValue':
        return 'Average Invoice Value';
      case 'invoiceCount':
        return 'Invoice Count';
      case 'name':
        return 'Name';
      default:
        return 'Total Income';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-300 bg-green-100">
        <CardHeader>
          {/* Centered Title */}
          <div className="text-center mb-3">
            <CardTitle className="text-green-900 flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              Badges - Customer Rankings
            </CardTitle>
          </div>
          
          {/* Full Width Description */}
          <CardDescription className="text-green-800 text-center mb-4">
            Ranks are global (out of all customers) for the current metric. Use dropdown to sort by income, expenses, or other metrics. Click badges to filter by level.
          </CardDescription>
          
          {/* Bottom Row: Contact Info Left, Controls Right */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700 font-medium">
              Total contacts: {customers.length} | Currently displaying: {finalFilteredCustomers.length}
            </span>
            
            <div className="flex gap-3 items-center">
              <Select value={sortMetric} onValueChange={(value: SortMetric) => setSortMetric(value)}>
                <SelectTrigger className="w-48 border-green-300 bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalIncome">Total Income</SelectItem>
                  <SelectItem value="totalExpenses">Total Expenses</SelectItem>
                  <SelectItem value="averageInvoiceValue">Average Invoice Value</SelectItem>
                  <SelectItem value="invoiceCount">Invoice Count</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="border-green-300 hover:bg-green-100 bg-white text-green-700"
              >
                {sortOrder === 'desc' ? (
                  <ArrowDown className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowUp className="h-4 w-4 mr-2" />
                )}
                {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Interactive Badge Legend */}
      <Card className="border-green-300 bg-green-100">
        <CardContent className="p-4">
          <div className="space-y-3">
            <span className="text-sm font-medium text-green-900 block">
              Click to filter by badge level (based on {getCurrentMetricLabel().toLowerCase()}):
            </span>
            
            {/* Fixed horizontal layout with proper flexbox */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { level: 'gold' as BadgeLevel, icon: Crown, label: 'Gold', range: '100-90%' },
                { level: 'silver' as BadgeLevel, icon: Award, label: 'Silver', range: '90-70%' },
                { level: 'bronze' as BadgeLevel, icon: Medal, label: 'Bronze', range: '70-30%' },
                { level: 'copper' as BadgeLevel, icon: Coins, label: 'Copper', range: '30-0%' },
                { level: 'black' as BadgeLevel, icon: X, label: 'Black', range: '0% or null' }
              ].map(({ level, icon: Icon, label, range }) => (
                <div
                  key={level}
                  onClick={() => toggleBadgeFilter(level)}
                  className={`cursor-pointer p-3 rounded-lg transition-all duration-200 border-2 ${
                    !activeBadgeFilters.has(level) 
                      ? 'opacity-50 border-gray-300 bg-gray-100' 
                      : 'border-green-400 bg-white shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 min-w-[100px]">
                    <Badge className={`${getBadgeColor(level)} flex items-center gap-1 px-3 py-1 min-w-[85px] justify-center`}>
                      <Icon className="h-3 w-3" />
                      {label} ({badgeCounts[level]})
                    </Badge>
                    <div className="text-center">
                      <div className="text-xs text-green-800 font-medium">{getBadgeLabel(level)}</div>
                      <div className="text-xs text-green-700">{range}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid - Updated to use new CustomerBadgeCard component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finalFilteredCustomers.map((customer) => {
          const badgeColor = getBadgeColor(customer.badgeLevel);
          const phoneNumber = extractPhoneNumber(customer);
          const globalRank = globalRankedCustomers.get(customer.id) || 0;
          const bankTransactions = allBankTransactions[customer.xero_contact_id] || [];
          
          return (
            <CustomerBadgeCard
              key={customer.id}
              customer={customer}
              bankTransactions={bankTransactions}
              badgeColor={badgeColor}
              getBadgeIcon={getBadgeIcon}
              getBadgeLabel={getBadgeLabel}
              getBadgeRange={getBadgeRange}
              phoneNumber={phoneNumber}
              globalRank={globalRank}
              formatMetricValue={formatMetricValue}
              getCurrentMetricLabel={getCurrentMetricLabel}
              sortMetric={sortMetric}
              totalCustomers={customers.length}
            />
          );
        })}
      </div>

      {finalFilteredCustomers.length === 0 && (
        <Card className="border-green-200 bg-white">
          <CardContent className="p-8 text-center">
            <p className="text-green-600">
              No customers found with the selected badge filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KyronsBadges;
