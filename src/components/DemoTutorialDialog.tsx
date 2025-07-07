
import React from 'react';
import { X, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DemoTutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const DemoTutorialDialog: React.FC<DemoTutorialDialogProps> = ({
  isOpen,
  onClose,
  title,
  description
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                DEMO TUTORIAL
              </span>
            </div>
          </div>
          <DialogTitle className="text-lg font-bold text-blue-900 text-left">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-blue-800 leading-relaxed text-sm">
            {description}
          </p>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm"
            >
              <X className="h-4 w-4 mr-2" />
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoTutorialDialog;
