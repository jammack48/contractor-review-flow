
import React from 'react';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Customer, Invoice } from '@/types/crm';

interface AnalyticsProps {
  customers: Customer[];
  invoices: Invoice[];
}

const Analytics: React.FC<AnalyticsProps> = ({ customers, invoices }) => {
  // Calculate customer spend from invoices
  const customersWithSpend = customers.map(customer => {
    const customerInvoices = invoices.filter(invoice => invoice.xero_contact_id === customer.xero_contact_id);
    const totalSpend = customerInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const jobCount = customerInvoices.length;
    return {
      ...customer,
      totalSpend,
      jobCount
    };
  });

  // Top 10 customers by spend
  const topCustomers = customersWithSpend
    .filter(customer => customer.totalSpend && customer.totalSpend > 0)
    .sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0))
    .slice(0, 10)
    .map(customer => ({
      name: customer.name.length > 15 ? customer.name.substring(0, 15) + '...' : customer.name,
      spend: customer.totalSpend || 0
    }));

  // Invoice types distribution (using invoice_type from Xero)
  const invoiceTypeStats = invoices.reduce((acc, invoice) => {
    const type = invoice.invoice_type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const invoiceTypeData = Object.entries(invoiceTypeStats).map(([name, value]) => ({
    name,
    value
  }));

  // Monthly revenue trend (last 12 months)
  const monthlyRevenue = invoices.reduce((acc, invoice) => {
    if (!invoice.invoice_date) return acc;
    const date = new Date(invoice.invoice_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + (invoice.total || 0);
    return acc;
  }, {} as { [key: string]: number });

  const revenueData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, revenue]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue
    }));

  // Invoice status breakdown
  const invoiceStatusStats = invoices.reduce((acc, invoice) => {
    acc[invoice.invoice_status] = (acc[invoice.invoice_status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const invoiceStatusData = Object.entries(invoiceStatusStats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Colors for charts
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  // Key metrics
  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const unpaidAmount = invoices
    .filter(invoice => invoice.invoice_status !== 'PAID')
    .reduce((sum, invoice) => sum + (invoice.amount_due || 0), 0);
  const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
  const customerRetentionRate = customersWithSpend.filter(c => c.jobCount > 1).length / customers.length * 100;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600">Avg Invoice Value</p>
                <p className="text-2xl font-bold text-slate-800">
                  ${avgInvoiceValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-slate-600">Customer Retention</p>
                <p className="text-2xl font-bold text-slate-800">
                  {customerRetentionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-slate-600">Outstanding</p>
                <p className="text-2xl font-bold text-slate-800">
                  ${unpaidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Customers by Spend</CardTitle>
            <CardDescription>Highest value customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Spend']}
                />
                <Bar dataKey="spend" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Types Distribution</CardTitle>
            <CardDescription>Breakdown of invoice categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Insights */}
      <Card className="bg-gradient-to-r from-orange-50 to-blue-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900">Business Insights</CardTitle>
          <CardDescription className="text-orange-700">
            Key metrics and recommendations for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Performance Highlights</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>• {customers.length} total customers in your database</li>
                <li>• {invoices.length} invoices processed</li>
                <li>• ${totalRevenue.toLocaleString()} in total revenue</li>
                <li>• {customerRetentionRate.toFixed(1)}% customer retention rate</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Action Items</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                {unpaidAmount > 0 && (
                  <li>• Follow up on ${unpaidAmount.toLocaleString()} in outstanding invoices</li>
                )}
                <li>• Focus on your top invoice types for marketing</li>
                <li>• Consider loyalty programs for repeat customers</li>
                <li>• Monitor seasonal trends in your revenue</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
