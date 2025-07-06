
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { CustomerTable } from "@/components/CustomerTable";
import { SMSPanel } from "@/components/SMSPanel";
import { mockCustomers } from "@/data/mockData";

const Index = () => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("30");

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === mockCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(mockCustomers.map(c => c.id));
    }
  };

  const selectedCustomersData = mockCustomers.filter(c => selectedCustomers.includes(c.id));
  const totalSelectedValue = selectedCustomersData.reduce((sum, c) => sum + c.invoiceAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Customers"
            value={mockCustomers.length.toString()}
            subtitle="Active customers"
            gradient="gradient-primary"
          />
          <StatsCard
            title="Selected"
            value={selectedCustomers.length.toString()}
            subtitle="For SMS campaign"
            gradient="gradient-success"
          />
          <StatsCard
            title="Reviews Given"
            value={mockCustomers.filter(c => c.reviewGiven).length.toString()}
            subtitle="Google reviews"
            gradient="gradient-gold"
          />
          <StatsCard
            title="Selected Value"
            value={`$${totalSelectedValue.toLocaleString()}`}
            subtitle="Invoice total"
            gradient="gradient-primary"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customer Management */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-xl">Customer Management</CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="60">Last 60 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllCustomers}
                      className="whitespace-nowrap"
                    >
                      {selectedCustomers.length === mockCustomers.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <CustomerTable
                  customers={mockCustomers}
                  selectedCustomers={selectedCustomers}
                  onToggleCustomer={toggleCustomerSelection}
                />
              </CardContent>
            </Card>
          </div>

          {/* SMS Campaign Panel */}
          <div className="space-y-6">
            <SMSPanel
              selectedCount={selectedCustomers.length}
              selectedCustomers={selectedCustomersData}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
