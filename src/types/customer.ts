
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  invoiceDate: string;
  invoiceAmount: number;
  reviewGiven: boolean;
  recentlySent: boolean;
  xeroContactId?: string;
}
