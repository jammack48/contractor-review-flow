
import { useState, useEffect } from 'react';
import { isDemoMode } from '@/lib/demoConfig';

export interface TutorialContent {
  title: string;
  description: string;
}

const tutorialContent: Record<string, TutorialContent> = {
  customers: {
    title: "Customer Management",
    description: "View and manage all your customers in one place. Use the search bar and filters to find specific customers quickly. Click on any customer card to see their detailed invoice history, contact information, and service records."
  },
  badges: {
    title: "Customer Rankings",
    description: "Customers are automatically ranked based on their spending patterns: Gold badges for high-value customers, Silver for medium spenders, Bronze for regular customers, and Black for those with minimal activity. This helps you prioritize your most valuable relationships."
  },
  analytics: {
    title: "Business Analytics",
    description: "Visualize your business performance with interactive charts and graphs. See revenue trends over time, customer distribution across different tiers, service type analysis, and other key metrics to make data-driven decisions."
  },
  filters: {
    title: "Advanced Filtering",
    description: "Apply powerful filters to find exactly what you're looking for. Filter customers by date ranges, invoice status, service types, keywords from job descriptions, and more. Perfect for targeted marketing campaigns or customer follow-ups."
  },
  reviews: {
    title: "Review Management",
    description: "Send SMS review requests to customers after completing jobs. Test your messages, manage bulk campaigns, and track review responses. Build your online reputation by making it easy for satisfied customers to leave positive reviews."
  },
  setup: {
    title: "Data Import & Setup",
    description: "Import your existing customer and invoice data from Xero or CSV files. Set up automated data synchronization and configure your CRM settings. This is where you connect your real business data to the system."
  },
  console: {
    title: "Developer Console",
    description: "Access advanced developer tools, view system logs, manage data extraction processes, and perform database operations. This section is designed for technical users who need deeper system access."
  }
};

export const useDemoTutorial = (screenId: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const storageKey = `demo-tutorial-seen-${screenId}`;

  useEffect(() => {
    // Only show tutorial in demo mode
    if (!isDemoMode()) {
      return;
    }

    // Check if tutorial has been shown before
    const hasSeenTutorial = localStorage.getItem(storageKey) === 'true';
    
    if (!hasSeenTutorial) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [screenId, storageKey]);

  const closeTutorial = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, 'true');
  };

  const content = tutorialContent[screenId];

  return {
    isOpen,
    closeTutorial,
    content
  };
};
