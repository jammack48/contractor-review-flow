export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_transactions: {
        Row: {
          bank_account_code: string | null
          bank_account_name: string | null
          code: string | null
          created_at: string
          id: string
          is_reconciled: boolean | null
          line_items: Json | null
          particulars: string | null
          reference: string | null
          status: string | null
          sub_total: number | null
          total_amount: number | null
          total_tax: number | null
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string
          xero_bank_account_id: string | null
          xero_bank_transaction_id: string
          xero_contact_id: string | null
        }
        Insert: {
          bank_account_code?: string | null
          bank_account_name?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_reconciled?: boolean | null
          line_items?: Json | null
          particulars?: string | null
          reference?: string | null
          status?: string | null
          sub_total?: number | null
          total_amount?: number | null
          total_tax?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string
          xero_bank_account_id?: string | null
          xero_bank_transaction_id: string
          xero_contact_id?: string | null
        }
        Update: {
          bank_account_code?: string | null
          bank_account_name?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_reconciled?: boolean | null
          line_items?: Json | null
          particulars?: string | null
          reference?: string | null
          status?: string | null
          sub_total?: number | null
          total_amount?: number | null
          total_tax?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string
          xero_bank_account_id?: string | null
          xero_bank_transaction_id?: string
          xero_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bank_transactions_contact"
            columns: ["xero_contact_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["xero_contact_id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          accounts_payable_tax_type: string | null
          accounts_receivable_tax_type: string | null
          addresses: Json | null
          bank_account_details: string | null
          company_number: string | null
          contact_groups: Json | null
          contact_id: string | null
          contact_number: string | null
          contact_persons: Json | null
          contact_status: string | null
          created_at: string
          email_address: string | null
          google_review_given: boolean | null
          has_attachments: boolean | null
          id: string
          is_customer: boolean | null
          is_supplier: boolean | null
          legal_name: string | null
          name: string
          phone_numbers: Json | null
          purchases_default_account_code: string | null
          purchases_tracking_categories: Json | null
          sales_default_account_code: string | null
          sales_tracking_categories: Json | null
          tax_number: string | null
          updated_at: string
          website: string | null
          xero_contact_id: string
          xero_network_key: string | null
        }
        Insert: {
          account_number?: string | null
          accounts_payable_tax_type?: string | null
          accounts_receivable_tax_type?: string | null
          addresses?: Json | null
          bank_account_details?: string | null
          company_number?: string | null
          contact_groups?: Json | null
          contact_id?: string | null
          contact_number?: string | null
          contact_persons?: Json | null
          contact_status?: string | null
          created_at?: string
          email_address?: string | null
          google_review_given?: boolean | null
          has_attachments?: boolean | null
          id?: string
          is_customer?: boolean | null
          is_supplier?: boolean | null
          legal_name?: string | null
          name: string
          phone_numbers?: Json | null
          purchases_default_account_code?: string | null
          purchases_tracking_categories?: Json | null
          sales_default_account_code?: string | null
          sales_tracking_categories?: Json | null
          tax_number?: string | null
          updated_at?: string
          website?: string | null
          xero_contact_id: string
          xero_network_key?: string | null
        }
        Update: {
          account_number?: string | null
          accounts_payable_tax_type?: string | null
          accounts_receivable_tax_type?: string | null
          addresses?: Json | null
          bank_account_details?: string | null
          company_number?: string | null
          contact_groups?: Json | null
          contact_id?: string | null
          contact_number?: string | null
          contact_persons?: Json | null
          contact_status?: string | null
          created_at?: string
          email_address?: string | null
          google_review_given?: boolean | null
          has_attachments?: boolean | null
          id?: string
          is_customer?: boolean | null
          is_supplier?: boolean | null
          legal_name?: string | null
          name?: string
          phone_numbers?: Json | null
          purchases_default_account_code?: string | null
          purchases_tracking_categories?: Json | null
          sales_default_account_code?: string | null
          sales_tracking_categories?: Json | null
          tax_number?: string | null
          updated_at?: string
          website?: string | null
          xero_contact_id?: string
          xero_network_key?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_credited: number | null
          amount_due: number | null
          amount_paid: number | null
          created_at: string
          due_date: string | null
          expected_payment_date: string | null
          fully_paid_on_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_status: string | null
          invoice_type: string | null
          line_amount_types: string | null
          line_items: Json | null
          planned_payment_date: string | null
          service_keywords: string[] | null
          sub_total: number | null
          total: number | null
          total_discount: number | null
          total_tax: number | null
          updated_at: string
          work_description: string | null
          xero_contact_id: string
          xero_invoice_id: string
        }
        Insert: {
          amount_credited?: number | null
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          expected_payment_date?: string | null
          fully_paid_on_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          invoice_type?: string | null
          line_amount_types?: string | null
          line_items?: Json | null
          planned_payment_date?: string | null
          service_keywords?: string[] | null
          sub_total?: number | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          updated_at?: string
          work_description?: string | null
          xero_contact_id: string
          xero_invoice_id: string
        }
        Update: {
          amount_credited?: number | null
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          due_date?: string | null
          expected_payment_date?: string | null
          fully_paid_on_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          invoice_type?: string | null
          line_amount_types?: string | null
          line_items?: Json | null
          planned_payment_date?: string | null
          service_keywords?: string[] | null
          sub_total?: number | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          updated_at?: string
          work_description?: string | null
          xero_contact_id?: string
          xero_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_contact"
            columns: ["xero_contact_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["xero_contact_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          role?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_name: string
          delivery_code: number | null
          delivery_status: string
          delivery_status_id: number | null
          delivery_timestamp: string | null
          error_message: string | null
          id: string
          invoice_id: string | null
          message_content: string
          phone_number: string
          sent_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_name: string
          delivery_code?: number | null
          delivery_status?: string
          delivery_status_id?: number | null
          delivery_timestamp?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_content: string
          phone_number: string
          sent_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_name?: string
          delivery_code?: number | null
          delivery_status?: string
          delivery_status_id?: number | null
          delivery_timestamp?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_content?: string
          phone_number?: string
          sent_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          created_at: string
          id: string
          message_content: string
          phone_number: string | null
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          phone_number?: string | null
          template_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          phone_number?: string | null
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unmatched_invoices: {
        Row: {
          amount_credited: number | null
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          due_date: string | null
          expected_payment_date: string | null
          fully_paid_on_date: string | null
          id: number
          invoice_date: string | null
          invoice_number: string | null
          invoice_status: string | null
          invoice_type: string | null
          line_amount_types: string | null
          line_items: Json | null
          planned_payment_date: string | null
          raw_invoice: Json | null
          sub_total: number | null
          total: number | null
          total_discount: number | null
          total_tax: number | null
          unmatched_contact_id: string | null
          work_description: string | null
          xero_invoice_id: string | null
        }
        Insert: {
          amount_credited?: number | null
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          due_date?: string | null
          expected_payment_date?: string | null
          fully_paid_on_date?: string | null
          id?: number
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          invoice_type?: string | null
          line_amount_types?: string | null
          line_items?: Json | null
          planned_payment_date?: string | null
          raw_invoice?: Json | null
          sub_total?: number | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          unmatched_contact_id?: string | null
          work_description?: string | null
          xero_invoice_id?: string | null
        }
        Update: {
          amount_credited?: number | null
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          due_date?: string | null
          expected_payment_date?: string | null
          fully_paid_on_date?: string | null
          id?: number
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          invoice_type?: string | null
          line_amount_types?: string | null
          line_items?: Json | null
          planned_payment_date?: string | null
          raw_invoice?: Json | null
          sub_total?: number | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          unmatched_contact_id?: string | null
          work_description?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: []
      }
      xero_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_expires_at: string
          refresh_token: string
          tenant_id: string
          tenant_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_expires_at: string
          refresh_token: string
          tenant_id: string
          tenant_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_expires_at?: string
          refresh_token?: string
          tenant_id?: string
          tenant_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
