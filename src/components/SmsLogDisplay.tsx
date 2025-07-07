
import React from 'react';
import { MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSmsHistory, SmsLog } from '@/hooks/useSmsHistory';

const SmsLogDisplay: React.FC = () => {
  const { smsLogs, isLoading, getDeliveryStatusBadge, getDeliveryStatusColor } = useSmsHistory();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateMessage = (message: string, maxLen = 60) => {
    return message.length > maxLen ? message.substring(0, maxLen) + '...' : message;
  };

  if (isLoading) {
    return (
      <Card className="border-green-300 bg-green-100">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            SMS Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-green-50">
          <div className="flex items-center justify-center py-8">
            <div className="text-green-600">Loading SMS history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-300 bg-green-100">
      <CardHeader>
        <CardTitle className="text-green-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          SMS Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-green-50 p-0">
        <ScrollArea className="h-64 w-full">
          {smsLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 px-4">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No SMS messages sent yet</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {smsLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(log.delivery_status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {log.customer_name}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`${getDeliveryStatusBadge(log.delivery_status)} text-xs`}
                      >
                        {log.delivery_status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      To: {log.phone_number}
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">
                      "{truncateMessage(log.message_content)}"
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Sent: {formatTimestamp(log.sent_at)}</span>
                      {log.delivery_timestamp && (
                        <span>Delivered: {formatTimestamp(log.delivery_timestamp)}</span>
                      )}
                      {log.campaign_id && (
                        <span>Campaign: {log.campaign_id}</span>
                      )}
                    </div>
                    
                    {log.error_message && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        Error: {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SmsLogDisplay;
