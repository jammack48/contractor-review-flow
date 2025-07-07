
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuoteData, ParsedQuoteItem } from '@/types/profit';
import { ProfitSimulator } from './ProfitSimulator';

const ProfitCalculator = () => {
  const [rawQuoteText, setRawQuoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { toast } = useToast();

  const parseQuoteData = async () => {
    if (!rawQuoteText.trim()) {
      toast({
        title: "Input Required",
        description: "Please paste your quote data before parsing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDebugInfo('Starting quote parsing...');
    
    try {
      console.log('🚀 [PROFIT-CALC] Starting quote parser with text length:', rawQuoteText.length);
      
      const { data, error } = await supabase.functions.invoke('quote-parser', {
        body: { rawText: rawQuoteText }
      });

      console.log('📡 [PROFIT-CALC] Edge function response:', { data, error });
      setDebugInfo(`Edge function response: ${JSON.stringify({ data, error }, null, 2)}`);

      if (error) {
        console.error('❌ [PROFIT-CALC] Edge function error:', error);
        throw new Error(error.message || 'Edge function returned an error');
      }

      if (!data) {
        console.error('❌ [PROFIT-CALC] No data returned from edge function');
        throw new Error('No data returned from edge function');
      }

      if (!data.success) {
        console.error('❌ [PROFIT-CALC] Parser returned failure:', data.error);
        throw new Error(data.error || 'Failed to parse quote data');
      }

      if (!data.lineItems || !Array.isArray(data.lineItems)) {
        console.error('❌ [PROFIT-CALC] Invalid lineItems in response:', data);
        throw new Error('Invalid response format: missing or invalid lineItems');
      }

      console.log('✅ [PROFIT-CALC] Successfully parsed', data.lineItems.length, 'line items');

      const parsedQuoteData: QuoteData = {
        lineItems: data.lineItems,
        gstRate: 0.15, // Default GST rate
        subtotal: 0,
        total: 0,
        date: new Date().toISOString().split('T')[0],
        reference: `Quote-${Date.now()}`
      };

      // Calculate initial totals
      const subtotal = parsedQuoteData.lineItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
      
      parsedQuoteData.subtotal = subtotal;
      parsedQuoteData.total = subtotal * (1 + parsedQuoteData.gstRate);

      console.log('💰 [PROFIT-CALC] Calculated totals:', { subtotal, total: parsedQuoteData.total });

      setQuoteData(parsedQuoteData);
      setShowSimulator(true);

      toast({
        title: "Quote Parsed Successfully",
        description: `Found ${data.lineItems.length} line items`,
      });

    } catch (error) {
      console.error('💥 [PROFIT-CALC] Error parsing quote:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to parse quote data";
      setDebugInfo(`Error: ${errorMessage}`);
      
      toast({
        title: "Parsing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSimulator = () => {
    setShowSimulator(false);
    setQuoteData(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-lg">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-800">Profit Calculator</CardTitle>
              <CardDescription>
                Paste your quote data and simulate different profit margins
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="quote-input" className="block text-sm font-medium text-green-700 mb-2">
              Quote Data
            </label>
            <Textarea
              id="quote-input"
              placeholder="Paste your quote data here (tab-separated, comma-separated, or space-separated)..."
              value={rawQuoteText}
              onChange={(e) => setRawQuoteText(e.target.value)}
              className="min-h-[200px] border-green-200 focus:border-green-500"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={parseQuoteData}
              disabled={isLoading || !rawQuoteText.trim()}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Parse Quote Data
                </>
              )}
            </Button>
            
            {rawQuoteText && (
              <Button
                variant="outline"
                onClick={() => {
                  setRawQuoteText('');
                  setDebugInfo('');
                }}
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                Clear
              </Button>
            )}
          </div>

          {rawQuoteText && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-2">Preview:</p>
              <div className="text-xs text-green-700 font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                {rawQuoteText.split('\n').slice(0, 10).map((line, i) => (
                  <div key={i}>{line || '(empty line)'}</div>
                ))}
                {rawQuoteText.split('\n').length > 10 && (
                  <div className="text-green-500">... and {rawQuoteText.split('\n').length - 10} more lines</div>
                )}
              </div>
            </div>
          )}

          {/* Debug Information */}
          {debugInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Debug Information:</p>
              </div>
              <div className="text-xs text-blue-700 font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                {debugInfo}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profit Simulator Popup */}
      <ProfitSimulator
        isOpen={showSimulator}
        onClose={handleCloseSimulator}
        quoteData={quoteData}
      />
    </div>
  );
};

export default ProfitCalculator;
