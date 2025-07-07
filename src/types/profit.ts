
export interface ParsedQuoteItem {
  id: string;
  name: string;
  type: 'labour' | 'material';
  quantity: number;
  cost: number;
  price: number;
  markup: number;
  tax: number;
  discount: number;
  total: number;
  isBigTicket?: boolean;
  maxMarkup?: number;
}

export interface QuoteData {
  lineItems: ParsedQuoteItem[];
  gstRate: number;
  subtotal: number;
  total: number;
  date: string;
  reference?: string;
}

export interface MarginSettings {
  labourMargin: number;
  materialMargin: number;
  bigTicketMargins: { [itemId: string]: number };
}

export interface CalculatedResults {
  subtotal: number;
  gstAmount: number;
  total: number;
  totalCost: number;
  grossProfit: number;
  grossProfitPercentage: number;
}
