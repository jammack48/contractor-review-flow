export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bank_transactions: {
        Row: {
          amount: number | null
          bank_account_code: string | null
          bank_account_id: string | null
          bank_account_name: string | null
          created_at: string | null
          currency_code: string | null
          currency_rate: number | null
          date: string | null
          description: string | null
          gross_amount: number | null
          id: string
          is_reconciled: boolean | null
          net_amount: number | null
          reference: string | null
          status: string | null
          sub_type: string | null
          tax_amount: number | null
          tax_type: string | null
          transaction_date: string | null
          transaction_id: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          xero_bank_account_id: string | null
          xero_bank_transaction_id: string | null
          xero_contact_id: string | null
        }
        Insert: {
          amount?: number | null
          bank_account_code?: string | null
          bank_account_id?: string | null
          bank_account_name?: string | null
          created_at?: string | null
          currency_code?: string | null
          currency_rate?: number | null
          date?: string | null
          description?: string | null
          gross_amount?: number | null
          id?: string
          is_reconciled?: boolean | null
          net_amount?: number | null
          reference?: string | null
          status?: string | null
          sub_type?: string | null
          tax_amount?: number | null
          tax_type?: string | null
          transaction_date?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          xero_bank_account_id?: string | null
          xero_bank_transaction_id?: string | null
          xero_contact_id?: string | null
        }
        Update: {
          amount?: number | null
          bank_account_code?: string | null
          bank_account_id?: string | null
          bank_account_name?: string | null
          created_at?: string | null
          currency_code?: string | null
          currency_rate?: number | null
          date?: string | null
          description?: string | null
          gross_amount?: number | null
          id?: string
          is_reconciled?: boolean | null
          net_amount?: number | null
          reference?: string | null
          status?: string | null
          sub_type?: string | null
          tax_amount?: number | null
          tax_type?: string | null
          transaction_date?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          xero_bank_account_id?: string | null
          xero_bank_transaction_id?: string | null
          xero_contact_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          addresses: Json | null
          contact_groups: Json | null
          contact_persons: Json | null
          created_at: string | null
          email_address: string | null
          google_review_given: boolean | null
          id: string
          name: string
          phone_numbers: Json | null
          purchases_tracking_categories: Json | null
          sales_tracking_categories: Json | null
          updated_at: string | null
          user_id: string | null
          xero_contact_id: string | null
        }
        Insert: {
          addresses?: Json | null
          contact_groups?: Json | null
          contact_persons?: Json | null
          created_at?: string | null
          email_address?: string | null
          google_review_given?: boolean | null
          id?: string
          name: string
          phone_numbers?: Json | null
          purchases_tracking_categories?: Json | null
          sales_tracking_categories?: Json | null
          updated_at?: string | null
          user_id?: string | null
          xero_contact_id?: string | null
        }
        Update: {
          addresses?: Json | null
          contact_groups?: Json | null
          contact_persons?: Json | null
          created_at?: string | null
          email_address?: string | null
          google_review_given?: boolean | null
          id?: string
          name?: string
          phone_numbers?: Json | null
          purchases_tracking_categories?: Json | null
          sales_tracking_categories?: Json | null
          updated_at?: string | null
          user_id?: string | null
          xero_contact_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_credited: number | null
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
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
          service_keywords: Json | null
          sub_total: number | null
          total: number | null
          total_discount: number | null
          total_tax: number | null
          updated_at: string | null
          user_id: string | null
          work_description: string | null
          xero_contact_id: string | null
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
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          invoice_type?: string | null
          line_amount_types?: string | null
          line_items?: Json | null
          planned_payment_date?: string | null
          service_keywords?: Json | null
          sub_total?: number | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          updated_at?: string | null
          user_id?: string | null
          work_description?: string | null
          xero_contact_id?: string | null
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
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string | null
          invoice_type?: string | null
          line_amount_types?: string | null
          line_items?: Json | null
          planned_payment_date?: string | null
          service_keywords?: Json | null
          sub_total?: number | null
          total?: number | null
          total_discount?: number | null
          total_tax?: number | null
          updated_at?: string | null
          user_id?: string | null
          work_description?: string | null
          xero_contact_id?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      sms_history: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          customer_name: string | null
          delivery_status: string | null
          delivery_timestamp: string | null
          error_message: string | null
          id: string
          invoice_id: string | null
          message: string
          message_content: string | null
          phone_number: string
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          delivery_status?: string | null
          delivery_timestamp?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message: string
          message_content?: string | null
          phone_number: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          delivery_status?: string | null
          delivery_timestamp?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message?: string
          message_content?: string | null
          phone_number?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          created_at: string | null
          id: string
          message_content: string
          phone_number: string | null
          template_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_content: string
          phone_number?: string | null
          template_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_content?: string
          phone_number?: string | null
          template_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      xero_connections: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_expires_at: string
          refresh_token: string
          tenant_id: string
          tenant_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_expires_at: string
          refresh_token: string
          tenant_id: string
          tenant_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_expires_at?: string
          refresh_token?: string
          tenant_id?: string
          tenant_name?: string | null
          updated_at?: string | null
          user_id?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
