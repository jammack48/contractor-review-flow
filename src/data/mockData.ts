
import { Customer } from "@/types/customer";

export const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+64 21 123 4567",
    invoiceDate: "2024-06-15",
    invoiceAmount: 2500,
    reviewGiven: false,
    recentlySent: true
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+64 27 234 5678",
    invoiceDate: "2024-06-10",
    invoiceAmount: 1800,
    reviewGiven: true,
    recentlySent: false
  },
  {
    id: "3",
    name: "Mike Williams",
    email: "mike.williams@email.com",
    phone: "+64 21 345 6789",
    invoiceDate: "2024-06-12",
    invoiceAmount: 3200,
    reviewGiven: false,
    recentlySent: false
  },
  {
    id: "4",
    name: "Emma Davis",
    email: "emma.davis@email.com",
    phone: "+64 22 456 7890",
    invoiceDate: "2024-06-08",
    invoiceAmount: 1500,
    reviewGiven: true,
    recentlySent: false
  },
  {
    id: "5",
    name: "James Wilson",
    email: "james.wilson@email.com",
    phone: "+64 21 567 8901",
    invoiceDate: "2024-06-14",
    invoiceAmount: 2800,
    reviewGiven: false,
    recentlySent: false
  },
  {
    id: "6",
    name: "Lisa Brown",
    email: "lisa.brown@email.com",
    phone: "+64 27 678 9012",
    invoiceDate: "2024-06-11",
    invoiceAmount: 2200,
    reviewGiven: false,
    recentlySent: false
  },
  {
    id: "7",
    name: "David Taylor",
    email: "david.taylor@email.com",
    phone: "+64 21 789 0123",
    invoiceDate: "2024-06-09",
    invoiceAmount: 1900,
    reviewGiven: false,
    recentlySent: true
  },
  {
    id: "8",
    name: "Rachel Green",
    email: "rachel.green@email.com",
    phone: "+64 22 890 1234",
    invoiceDate: "2024-06-13",
    invoiceAmount: 3500,
    reviewGiven: true,
    recentlySent: false
  }
];
