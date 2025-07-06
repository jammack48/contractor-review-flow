
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer } from "@/types/customer";

interface SMSPanelProps {
  selectedCount: number;
  selectedCustomers: Customer[];
}

export const SMSPanel = ({ selectedCount, selectedCustomers }: SMSPanelProps) => {
  const [message, setMessage] = useState("Hi {name}, thanks for choosing us for your recent electrical work! We'd love a Google review if you were happy with our service. Here's the link: [LINK]. Thanks!");
  const [testPhone, setTestPhone] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const messageLength = message.length;
  const estimatedCost = selectedCount * 0.08; // $0.08 per SMS
  const smsBalance = 45.20; // Mock balance

  const templates = [
    { id: "default", name: "Default Review Request" },
    { id: "follow-up", name: "Follow-up Reminder" },
    { id: "premium", name: "Premium Service" }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            SMS Campaign
            <Badge variant="secondary" className="bg-success/20 text-success-foreground">
              Balance: ${smsBalance.toFixed(2)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message Template</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Composer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Message</label>
              <span className="text-xs text-muted-foreground">
                {messageLength}/160 characters
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-24 resize-none"
              placeholder="Enter your SMS message..."
            />
            <div className="text-xs text-muted-foreground">
              Use {"{name}"} for customer name personalization
            </div>
          </div>

          {/* Cost Estimation */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Selected customers:</span>
              <span className="font-medium">{selectedCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cost per SMS:</span>
              <span className="font-medium">$0.08</span>
            </div>
            <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
              <span>Total cost:</span>
              <span>${estimatedCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Test SMS */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test SMS</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter phone number..."
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" disabled={!testPhone || !message}>
                Test
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button 
              className="w-full gradient-primary text-white font-medium"
              disabled={selectedCount === 0}
            >
              Send SMS Campaign ({selectedCount} customers)
            </Button>
            <Button variant="outline" className="w-full">
              Save as Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>SMS sent to John Smith</span>
              <span className="text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span>Review received from Sarah Johnson</span>
              <span className="text-muted-foreground">1 day ago</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Campaign sent to 15 customers</span>
              <span className="text-muted-foreground">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
