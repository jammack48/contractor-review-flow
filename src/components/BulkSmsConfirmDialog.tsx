
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkSmsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientCount: number;
  estimatedCost: number;
  currency: string;
  onConfirm: () => void;
}

const BulkSmsConfirmDialog: React.FC<BulkSmsConfirmDialogProps> = ({
  open,
  onOpenChange,
  recipientCount,
  estimatedCost,
  currency,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Bulk SMS Send</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You are about to send SMS messages to <strong>{recipientCount}</strong> recipients.</p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm text-orange-800">
                <strong>Estimated Cost:</strong> ${estimatedCost.toFixed(2)} {currency}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                This will deduct approximately {recipientCount} credits from your balance.
              </p>
            </div>
            
            <p className="text-sm text-gray-600">
              Are you sure you want to proceed with sending these messages?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Send SMS Messages
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkSmsConfirmDialog;
