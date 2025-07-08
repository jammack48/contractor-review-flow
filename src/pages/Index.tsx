
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Settings, Users, FileText, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Reviews from '@/components/Reviews';
import { Customer, Invoice } from '@/types/crm';

const Index = () => {
  const { user, signOut } = useAuth();
  // Fetch customers and invoices for review functionality only
  // (Assume fetchCustomers and fetchInvoices are minimal and only provide phone numbers and dates)
  return (
    <div>
      {/* Only show Reviews component */}
      <Reviews customers={[]} invoices={[]} />
    </div>
  );
};

export default Index;
