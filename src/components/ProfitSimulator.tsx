
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Copy, Download, Settings, ArrowLeft, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuoteData, MarginSettings } from '@/types/profit';
import { useProfitCalculations } from '@/hooks/useProfitCalculations';

interface ProfitSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: QuoteData | null;
}

export const ProfitSimulator: React.FC<ProfitSimulatorProps> = ({
  isOpen,
  onClose,
  quoteData
}) => {
  const { toast } = useToast();
  
  const [marginSettings, setMarginSettings] = useState<MarginSettings>({
    labourMargin: 63.8,
    materialMargin: 88.0,
    bigTicketMargins: {}
  });

  const results = useProfitCalculations(quoteData, marginSettings);

  // Initialize big ticket margins when quote data changes
  useEffect(() => {
    if (quoteData) {
      const bigTicketItems = quoteData.lineItems.filter(item => item.isBigTicket);
      const bigTicketMargins: { [itemId: string]: number } = {};
      
      bigTicketItems.forEach(item => {
        bigTicketMargins[item.id] = 88.0;
      });
      
      setMarginSettings(prev => ({
        ...prev,
        bigTicketMargins
      }));
    }
  }, [quoteData]);

  const handleMarginChange = (type: 'labour' | 'material', value: number[]) => {
    setMarginSettings(prev => ({
      ...prev,
      [type === 'labour' ? 'labourMargin' : 'materialMargin']: value[0]
    }));
  };

  const handleBigTicketMarginChange = (itemId: string, value: number[]) => {
    setMarginSettings(prev => ({
      ...prev,
      bigTicketMargins: {
        ...prev.bigTicketMargins,
        [itemId]: value[0]
      }
    }));
  };

  const copyResults = () => {
    const resultText = `
Profit Calculator Results
========================
Subtotal: $${results.subtotal.toFixed(2)}
GST (15%): $${results.gstAmount.toFixed(2)}
Total: $${results.total.toFixed(2)}
Total Cost: $${results.totalCost.toFixed(2)}
Gross Profit: $${results.grossProfit.toFixed(2)}
Gross Profit %: ${results.grossProfitPercentage.toFixed(1)}%

Margin Settings:
- Labour: ${marginSettings.labourMargin}%
- Materials: ${marginSettings.materialMargin}%
${Object.keys(marginSettings.bigTicketMargins).length > 0 ? 
  '- Big Ticket Items: ' + Object.entries(marginSettings.bigTicketMargins)
    .map(([id, margin]) => `${margin}%`).join(', ') : ''}
    `.trim();

    navigator.clipboard.writeText(resultText);
    toast({
      title: "Results Copied",
      description: "Profit calculation results copied to clipboard",
    });
  };

  const bigTicketItems = quoteData?.lineItems.filter(item => item.isBigTicket) || [];
  const labourItems = quoteData?.lineItems.filter(item => item.type === 'labour') || [];
  const materialItems = quoteData?.lineItems.filter(item => item.type === 'material' && !item.isBigTicket) || [];

  const labourTotalCost = labourItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const materialTotalCost = materialItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const bigTicketTotalCost = bigTicketItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

  const labourPrice = labourTotalCost * (1 + marginSettings.labourMargin / 100);
  const materialPrice = materialTotalCost * (1 + marginSettings.materialMargin / 100);
  const bigTicketPrice = bigTicketItems.reduce((sum, item) => {
    const margin = marginSettings.bigTicketMargins[item.id] || 88.0;
    return sum + (item.cost * item.quantity * (1 + margin / 100));
  }, 0);

  // Calculate raw cost totals (including GST on raw costs)
  const rawCostGST = results.totalCost * 0.15;
  const rawCostTotal = results.totalCost + rawCostGST;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-slate-900 border-slate-700 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Margin Impact Simulator</h2>
                <p className="text-sm text-slate-400">Using imported quote data • {quoteData?.lineItems.length || 0} items</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Live calculations</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 p-6 overflow-y-auto">
          {/* Left Column - Margin Controls */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Margin Controls</h3>
              
              {/* Labour Margin */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-slate-300">Labour</label>
                  <span className="text-lg font-bold text-blue-400">{marginSettings.labourMargin.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Slider
                    value={[marginSettings.labourMargin]}
                    onValueChange={(value) => handleMarginChange('labour', value)}
                    max={100}
                    min={0}
                    step={0.1}
                    className="w-full [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-500 [&_.slider-track]:bg-slate-700 [&_.slider-range]:bg-blue-500"
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Cost</div>
                    <div className="text-sm text-white font-medium">${labourTotalCost.toFixed(0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Marked Up Price</div>
                    <div className="text-sm text-blue-400 font-bold">${labourPrice.toFixed(0)}</div>
                  </div>
                </div>
              </div>

              {/* Materials Margin */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-slate-300">Materials</label>
                  <span className="text-lg font-bold text-blue-400">{marginSettings.materialMargin.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Slider
                    value={[marginSettings.materialMargin]}
                    onValueChange={(value) => handleMarginChange('material', value)}
                    max={100}
                    min={0}
                    step={0.1}
                    className="w-full [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-500 [&_.slider-track]:bg-slate-700 [&_.slider-range]:bg-blue-500"
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Cost</div>
                    <div className="text-sm text-white font-medium">${materialTotalCost.toFixed(0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Marked Up Price</div>
                    <div className="text-sm text-blue-400 font-bold">${materialPrice.toFixed(0)}</div>
                  </div>
                </div>
              </div>

              {/* Big Ticket Items */}
              {bigTicketItems.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-slate-300">Big Ticket</label>
                    <span className="text-lg font-bold text-blue-400">
                      {Object.values(marginSettings.bigTicketMargins)[0]?.toFixed(1) || '88.0'}%
                    </span>
                  </div>
                  <div className="relative">
                    <Slider
                      value={[Object.values(marginSettings.bigTicketMargins)[0] || 88.0]}
                      onValueChange={(value) => {
                        bigTicketItems.forEach(item => {
                          handleBigTicketMarginChange(item.id, value);
                        });
                      }}
                      max={100}
                      min={0}
                      step={0.1}
                      className="w-full [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-500 [&_.slider-track]:bg-slate-700 [&_.slider-range]:bg-blue-500"
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Cost</div>
                      <div className="text-sm text-white font-medium">${bigTicketTotalCost.toFixed(0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Marked Up Price</div>
                      <div className="text-sm text-blue-400 font-bold">${bigTicketPrice.toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Profit Calculator */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Profit Calculator</h3>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm text-slate-400 pb-2 border-b border-slate-700">
                <span>Category</span>
                <span className="text-right">Raw Cost</span>
                <span className="text-right">Marked Up Price</span>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-white">Labour</span>
                </div>
                <div className="text-right text-white">${labourTotalCost.toFixed(0)}</div>
                <div className="text-right text-blue-400 font-bold">${labourPrice.toFixed(0)}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white">Materials</span>
                </div>
                <div className="text-right text-white">${materialTotalCost.toFixed(0)}</div>
                <div className="text-right text-green-400 font-bold">${materialPrice.toFixed(0)}</div>
              </div>

              {bigTicketItems.length > 0 && (
                <div className="grid grid-cols-3 gap-4 items-center py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-white">Big Ticket</span>
                  </div>
                  <div className="text-right text-white">${bigTicketTotalCost.toFixed(0)}</div>
                  <div className="text-right text-yellow-400 font-bold">${bigTicketPrice.toFixed(0)}</div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 items-center py-2 border-t border-slate-700 pt-4">
                <span className="text-white font-semibold">Subtotal</span>
                <div className="text-right text-white font-semibold">${results.totalCost.toFixed(0)}</div>
                <div className="text-right text-white font-semibold">${results.subtotal.toFixed(0)}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center py-2">
                <span className="text-slate-400">GST (15%)</span>
                <div className="text-right text-white font-medium">${rawCostGST.toFixed(0)}</div>
                <div className="text-right text-white font-medium">${results.gstAmount.toFixed(0)}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center py-2 text-lg font-bold border-t border-slate-700 pt-4">
                <span className="text-white">Sale Price</span>
                <div className="text-right text-white">${rawCostTotal.toFixed(0)}</div>
                <div className="text-right text-blue-400">${results.total.toFixed(0)}</div>
              </div>
            </div>

            {/* Profit Display */}
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mt-6">
              <div className="grid grid-cols-3 gap-4 items-center">
                <span className="text-green-400 font-semibold">Profit</span>
                <div className="text-right text-green-400 font-bold text-xl">$0</div>
                <div className="text-right text-green-400 font-bold text-xl">${results.grossProfit.toFixed(0)}</div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-400 text-sm">Overall Margin:</span>
                <span className="text-green-400 font-semibold">{results.grossProfitPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
