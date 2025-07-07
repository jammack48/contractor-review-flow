
import React from 'react';
import { Calendar, DollarSign, FileText, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Invoice, Customer } from '@/types/crm';

interface InvoiceCardProps {
  invoice: Invoice;
  customer: Customer | null;
  onClick?: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, customer, onClick }) => {
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
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer border-green-200" 
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {invoice.invoice_number || 'No Number'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="h-3 w-3" />
              {customer?.name || 'Unknown Customer'}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(invoice.invoice_status)}>
            {invoice.invoice_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Work Description Preview */}
        {invoice.work_description && (
          <div className="bg-gray-50 p-3 rounded border">
            <p className="text-sm text-gray-700">
              {truncateText(invoice.work_description.replace(/\|/g, ' | '), 120)}
            </p>
          </div>
        )}

        {/* Service Keywords */}
        {invoice.service_keywords && invoice.service_keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {invoice.service_keywords.slice(0, 3).map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs border-green-300 text-green-700">
                {keyword}
              </Badge>
            ))}
            {invoice.service_keywords.length > 3 && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                +{invoice.service_keywords.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Financial and Date Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-green-600 font-semibold">{formatCurrency(invoice.total)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-blue-600 font-semibold">{formatDate(invoice.invoice_date)}</p>
              <p className="text-xs text-gray-500">Invoice Date</p>
            </div>
          </div>
        </div>

        {/* Amount Due if applicable */}
        {invoice.amount_due > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-red-700 text-sm font-medium">
              Amount Due: {formatCurrency(invoice.amount_due)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;
