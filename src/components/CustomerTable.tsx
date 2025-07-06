
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/types/customer";

interface CustomerTableProps {
  customers: Customer[];
  selectedCustomers: string[];
  onToggleCustomer: (customerId: string) => void;
}

export const CustomerTable = ({ customers, selectedCustomers, onToggleCustomer }: CustomerTableProps) => {
  const getRowClassName = (customer: Customer) => {
    let baseClass = "border-b border-border hover:bg-muted/50 transition-colors";
    
    if (selectedCustomers.includes(customer.id)) {
      baseClass += " bg-primary/10 border-primary/20";
    } else if (customer.reviewGiven) {
      baseClass += " bg-gold/10 border-gold/20";
    } else if (customer.recentlySent) {
      baseClass += " bg-success/10 border-success/20";
    }
    
    return baseClass;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="text-left text-sm text-muted-foreground">
            <th className="p-4 w-12">
              <span className="sr-only">Select</span>
            </th>
            <th className="p-4">Customer</th>
            <th className="p-4">Phone</th>
            <th className="p-4">Invoice Date</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className={getRowClassName(customer)}>
              <td className="p-4">
                <Checkbox
                  checked={selectedCustomers.includes(customer.id)}
                  onCheckedChange={() => onToggleCustomer(customer.id)}
                  disabled={customer.reviewGiven || customer.recentlySent}
                />
              </td>
              <td className="p-4">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </td>
              <td className="p-4 text-sm">{customer.phone}</td>
              <td className="p-4 text-sm">{customer.invoiceDate}</td>
              <td className="p-4 text-sm font-medium">${customer.invoiceAmount.toLocaleString()}</td>
              <td className="p-4">
                <div className="flex gap-2">
                  {customer.reviewGiven && (
                    <Badge variant="secondary" className="bg-gold/20 text-gold-foreground">
                      Review Given
                    </Badge>
                  )}
                  {customer.recentlySent && (
                    <Badge variant="secondary" className="bg-success/20 text-success-foreground">
                      Recently Sent
                    </Badge>
                  )}
                  {selectedCustomers.includes(customer.id) && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                      Selected
                    </Badge>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
