
# ToolBox CRM - Business Service Extraction System

A comprehensive CRM system built for service-based businesses, featuring AI-powered service extraction, Xero integration, SMS marketing, and advanced analytics.

## 🚀 Quick Start

This is a Lovable project. You can edit it in several ways:

**Use Lovable**
Simply visit the [Lovable Project](https://lovable.dev/projects/372f8972-44d7-4e66-b894-67ac5baad0f4) and start prompting.

**Local Development**
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Keys & Secrets](#api-keys--secrets)
- [Setup Instructions](#setup-instructions)
- [Core Features](#core-features)
- [Components Architecture](#components-architecture)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## 🎯 System Overview

ToolBox CRM is designed for service-based businesses to:
- **Extract meaningful services** from invoice line items using AI
- **Integrate with Xero** for seamless accounting data sync
- **Send targeted SMS campaigns** based on service history
- **Analyze customer patterns** and service trends
- **Manage customer relationships** with comprehensive filtering

### Key Business Value
- Identify cross-selling opportunities through service analysis
- Automate customer segmentation based on service history
- Track service delivery patterns and customer satisfaction
- Streamline review collection and reputation management

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **Lucide React** for icons
- **Recharts** for data visualization
- **TanStack Query** for state management

### Backend & Database
- **Supabase** (PostgreSQL + Edge Functions)
- **Row Level Security** for data protection
- **Real-time subscriptions** for live updates

### Integrations
- **Xero API** for accounting data
- **OpenAI GPT-4** for service extraction
- **SMS Gateway** for marketing campaigns

## 🗄️ Database Schema

### Core Tables

#### `customers`
```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  xero_contact_id text NOT NULL,
  name text NOT NULL,
  email_address text,
  contact_number text,
  phone_numbers jsonb DEFAULT '[]'::jsonb,
  addresses jsonb DEFAULT '[]'::jsonb,
  contact_status text DEFAULT 'ACTIVE',
  is_customer boolean DEFAULT true,
  is_supplier boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `invoices`
```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  xero_invoice_id text NOT NULL,
  xero_contact_id text NOT NULL,
  invoice_number text,
  invoice_type text DEFAULT 'ACCREC',
  invoice_status text DEFAULT 'DRAFT',
  invoice_date date,
  due_date date,
  total numeric DEFAULT 0,
  sub_total numeric DEFAULT 0,
  total_tax numeric DEFAULT 0,
  amount_due numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  line_items jsonb DEFAULT '[]'::jsonb,
  service_keywords text[],
  work_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `profiles`
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `xero_connections`
```sql
CREATE TABLE xero_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  tenant_id text NOT NULL,
  tenant_name text NOT NULL,
  expires_at timestamptz NOT NULL,
  refresh_expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `sms_templates`
```sql
CREATE TABLE sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  template_name text NOT NULL DEFAULT 'review_request',
  message_content text NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure users can only access their own data.

## 🔐 API Keys & Secrets

### Required Secrets (Set in Supabase Dashboard > Project Settings > Edge Functions > Secrets)

1. **XERO_CLIENT_ID** - Xero OAuth app client ID
2. **XERO_CLIENT_SECRET** - Xero OAuth app client secret
3. **OPENAI_API_KEY** - OpenAI API key for service extraction
4. **SMS_API_KEY** - SMS gateway API key
5. **SMS_API_SECRET** - SMS gateway API secret

### Xero OAuth Setup
1. Create Xero app at https://developer.xero.com/
2. Set redirect URI to: `https://[your-project-id].supabase.co/functions/v1/xero-auth/callback`
3. Enable required scopes: `accounting.contacts`, `accounting.transactions`

## 🚀 Setup Instructions

### 1. Supabase Project Setup
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (use the schema above)
-- Enable RLS on all tables
-- Create appropriate policies for user access
```

### 2. Edge Functions Deployment
Deploy the following functions to Supabase:
- `xero-auth` - OAuth flow handling
- `xero-sync` - Data synchronization
- `xero-token-refresh` - Token management
- `ai-extract-keywords` - Service keyword extraction
- `full-ai-extraction` - Complete service analysis
- `sms-send` - SMS campaign management
- `sms-get-balance` - SMS balance checking

### 3. Environment Configuration
Set all required secrets in Supabase dashboard under Project Settings > Edge Functions > Secrets.

### 4. Frontend Configuration
The frontend automatically connects to your Supabase project using the configuration in `src/integrations/supabase/client.ts`.

## 🎯 Core Features

### 1. Customer Management
- **Import from Xero** - Sync customer data automatically
- **Advanced Filtering** - Filter by service history, invoice status, dates
- **Bulk Operations** - Mass SMS campaigns, data exports
- **Customer Profiles** - Detailed view with invoice history

### 2. Service Extraction
- **AI-Powered Analysis** - Extract services from invoice line items
- **Keyword Generation** - Categorize services automatically
- **Work Descriptions** - Generate human-readable summaries
- **Service Tracking** - Monitor service delivery patterns

### 3. Xero Integration
- **Real-time Sync** - Automatic data synchronization
- **OAuth Security** - Secure token management
- **Bulk Data Import** - Import historical data
- **Error Handling** - Robust retry mechanisms

### 4. SMS Marketing
- **Template Management** - Create reusable message templates
- **Customer Segmentation** - Target based on service history
- **Bulk Campaigns** - Send to multiple customers
- **Balance Tracking** - Monitor SMS credit usage

### 5. Analytics & Reporting
- **Revenue Analytics** - Track income trends
- **Service Analysis** - Identify popular services
- **Customer Insights** - Understand customer behavior
- **Interactive Charts** - Visual data representation

## 🏗️ Components Architecture

### Page Components
- `src/pages/Index.tsx` - Main dashboard (⚠️ 448 lines - needs refactoring)
- `src/pages/Reviews.tsx` - Review management
- `src/pages/XeroCallback.tsx` - OAuth callback handler

### Feature Components
- `src/components/CustomerList.tsx` - Customer data table
- `src/components/FilterPanel.tsx` - Advanced filtering interface
- `src/components/Analytics.tsx` - Data visualization
- `src/components/ImportPanel.tsx` - Data import interface
- `src/components/XeroIntegration.tsx` - Xero connection management

### Modal Components
- `src/components/CustomerDetailModal.tsx` - Customer details view
- `src/components/InvoiceDetailModal.tsx` - Invoice information
- `src/components/JobSearchModal.tsx` - Service search interface
- `src/components/BulkSmsConfirmDialog.tsx` - SMS campaign confirmation

### Utility Components
- `src/components/DevConsole.tsx` - Developer debugging tools
- `src/components/KyronsBadges.tsx` - Service achievement system
- `src/components/SmsBalanceCard.tsx` - SMS credit display

### Custom Hooks
- `src/hooks/useSupabaseData.ts` - Main data fetching
- `src/hooks/useAuth.tsx` - Authentication management
- `src/hooks/useSmsService.ts` - SMS functionality
- `src/hooks/useInvoiceLineItems.ts` - Invoice detail loading

## ⚡ Supabase Edge Functions

### Authentication & OAuth
- **xero-auth** - Handles Xero OAuth flow and token exchange
- **xero-token-refresh** - Automatic token renewal

### Data Synchronization
- **xero-sync** - Bulk import customers and invoices from Xero
- **extract-work-description** - Generate work summaries
- **ai-extract-keywords** - Extract service keywords
- **full-ai-extraction** - Complete AI analysis pipeline

### Communication
- **sms-send** - Send SMS messages via gateway
- **sms-get-balance** - Check SMS credit balance

## 🐛 Troubleshooting

### Common Issues

1. **Xero Connection Fails**
   - Verify client ID/secret in Supabase secrets
   - Check redirect URI matches exactly
   - Ensure user has Xero account access

2. **AI Extraction Not Working**
   - Confirm OPENAI_API_KEY is set correctly
   - Check Edge Function logs for API errors
   - Verify invoice has line items to process

3. **SMS Not Sending**
   - Validate SMS_API_KEY and SMS_API_SECRET
   - Check phone number format (+1234567890)
   - Verify SMS balance is sufficient

4. **Data Not Loading**
   - Check Supabase connection in browser console
   - Verify RLS policies allow user access
   - Confirm user is properly authenticated

### Debug Tools
- **Developer Console** - Built-in debugging interface
- **Browser DevTools** - Network and console logging
- **Supabase Dashboard** - Database and function logs

## 🚀 Deployment

### Lovable Hosting
1. Click "Publish" in Lovable editor
2. Configure custom domain if needed
3. App deploys automatically

### Self-Hosting
```bash
# Build for production
npm run build

# Deploy to your preferred hosting provider
# (Vercel, Netlify, AWS, etc.)
```

### Environment Variables for Self-Hosting
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Usage Analytics

The system tracks:
- Customer engagement patterns
- Service delivery trends
- SMS campaign effectiveness
- Revenue growth metrics
- User interaction analytics

## 🔒 Security Features

- **Row Level Security** on all database tables
- **JWT Authentication** via Supabase Auth
- **API Rate Limiting** on Edge Functions
- **Secure Token Storage** for third-party integrations
- **Input Validation** on all user inputs

## 🤝 Contributing

This is a business-critical system. Before making changes:
1. **Test thoroughly** in development environment
2. **Back up database** before major updates
3. **Document changes** in this README
4. **Update type definitions** if schema changes

## 📞 Support

For technical issues:
1. Check the troubleshooting section above
2. Review Supabase Edge Function logs
3. Use the built-in Developer Console
4. Check browser console for client-side errors

---

## Original Lovable Project Information

**URL**: https://lovable.dev/projects/372f8972-44d7-4e66-b894-67ac5baad0f4

### How to Edit This Code

**Use Lovable**
Simply visit the [Lovable Project](https://lovable.dev/projects/372f8972-44d7-4e66-b894-67ac5baad0f4) and start prompting.

**Use Your Preferred IDE**
If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:
```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a File Directly in GitHub**
- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**
- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

### Technologies Used

This project is built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

### Deployment

Simply open [Lovable](https://lovable.dev/projects/372f8972-44d7-4e66-b894-67ac5baad0f4) and click on Share → Publish.

### Custom Domain

Yes, you can connect a custom domain! Navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
