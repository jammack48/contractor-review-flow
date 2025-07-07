
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, RefreshCw, MessageSquare, DollarSign } from 'lucide-react';
import { useSmsBalance } from '@/hooks/useSmsBalance';

const SmsBalanceCard: React.FC = () => {
  const { balance, isLoading, error, fetchBalance } = useSmsBalance();

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-blue-800">SMS Balance</CardTitle>
              <CardDescription>Your SMS Everyone account balance</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBalance}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Available Messages</p>
                <p className="text-2xl font-bold text-green-800">
                  {balance.credits}
                </p>
                <p className="text-xs text-green-600">credits</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">Average Cost per SMS</p>
                <p className="text-2xl font-bold text-orange-800">
                  ${balance.cost_per_text.toFixed(2)}
                </p>
                <p className="text-xs text-orange-600">{balance.currency}</p>
              </div>
            </div>
          </div>
        )}
        
        {!balance && !isLoading && !error && (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">Click refresh to check your SMS balance</p>
            <Badge variant="outline" className="text-gray-600">
              Balance not loaded
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmsBalanceCard;
