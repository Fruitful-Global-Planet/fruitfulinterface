export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bashedi_kidswear: {
        Row: {
          age_range: string
          barcode: string | null
          brand: string
          color: string
          cost_price_excl_vat_cents: number
          created_at: string
          description: string
          fabric: string
          gender: string
          id: string
          image_url: string
          is_featured: boolean
          is_published: boolean
          item_code: string | null
          long_description: string
          markup_multiplier: number
          name: string
          price_usd_cents: number
          price_zar_cents: number
          size_label: string
          sku: string | null
          slot_number: number
          sort_order: number
          stock: number
          tags: string[]
          updated_at: string
          vat_rate: number
          weight_grams: number | null
        }
        Insert: {
          age_range?: string
          barcode?: string | null
          brand?: string
          color?: string
          cost_price_excl_vat_cents?: number
          created_at?: string
          description?: string
          fabric?: string
          gender?: string
          id?: string
          image_url: string
          is_featured?: boolean
          is_published?: boolean
          item_code?: string | null
          long_description?: string
          markup_multiplier?: number
          name?: string
          price_usd_cents?: number
          price_zar_cents?: number
          size_label?: string
          sku?: string | null
          slot_number: number
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
          vat_rate?: number
          weight_grams?: number | null
        }
        Update: {
          age_range?: string
          barcode?: string | null
          brand?: string
          color?: string
          cost_price_excl_vat_cents?: number
          created_at?: string
          description?: string
          fabric?: string
          gender?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          is_published?: boolean
          item_code?: string | null
          long_description?: string
          markup_multiplier?: number
          name?: string
          price_usd_cents?: number
          price_zar_cents?: number
          size_label?: string
          sku?: string | null
          slot_number?: number
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
          vat_rate?: number
          weight_grams?: number | null
        }
        Relationships: []
      }
      grand_paintings: {
        Row: {
          artist_name: string
          barcode: string | null
          created_at: string
          description: string
          has_certificate: boolean
          height_cm: number | null
          id: string
          image_url: string
          is_featured: boolean
          is_published: boolean
          item_code: string | null
          long_description: string
          medium: string
          name: string
          price_usd_cents: number
          price_zar_cents: number
          scene_location: string
          signed_by: string
          sku: string | null
          slot_number: number
          sort_order: number
          stock: number
          tags: string[]
          updated_at: string
          weight_grams: number | null
          width_cm: number | null
          year_created: number | null
        }
        Insert: {
          artist_name?: string
          barcode?: string | null
          created_at?: string
          description?: string
          has_certificate?: boolean
          height_cm?: number | null
          id?: string
          image_url: string
          is_featured?: boolean
          is_published?: boolean
          item_code?: string | null
          long_description?: string
          medium?: string
          name?: string
          price_usd_cents?: number
          price_zar_cents?: number
          scene_location?: string
          signed_by?: string
          sku?: string | null
          slot_number: number
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
          year_created?: number | null
        }
        Update: {
          artist_name?: string
          barcode?: string | null
          created_at?: string
          description?: string
          has_certificate?: boolean
          height_cm?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean
          is_published?: boolean
          item_code?: string | null
          long_description?: string
          medium?: string
          name?: string
          price_usd_cents?: number
          price_zar_cents?: number
          scene_location?: string
          signed_by?: string
          sku?: string | null
          slot_number?: number
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
          year_created?: number | null
        }
        Relationships: []
      }
      samfox_prints: {
        Row: {
          barcode: string | null
          created_at: string
          description: string
          edition_number: number | null
          edition_size: number | null
          height_cm: number | null
          id: string
          image_url: string
          is_featured: boolean
          is_published: boolean
          is_signed: boolean
          item_code: string | null
          long_description: string
          name: string
          paper_type: string | null
          price_usd_cents: number
          price_zar_cents: number
          print_method: string | null
          sku: string | null
          slot_number: number
          sort_order: number
          stock: number
          tags: string[]
          updated_at: string
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          description?: string
          edition_number?: number | null
          edition_size?: number | null
          height_cm?: number | null
          id?: string
          image_url: string
          is_featured?: boolean
          is_published?: boolean
          is_signed?: boolean
          item_code?: string | null
          long_description?: string
          name?: string
          paper_type?: string | null
          price_usd_cents?: number
          price_zar_cents?: number
          print_method?: string | null
          sku?: string | null
          slot_number: number
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          description?: string
          edition_number?: number | null
          edition_size?: number | null
          height_cm?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean
          is_published?: boolean
          is_signed?: boolean
          item_code?: string | null
          long_description?: string
          name?: string
          paper_type?: string | null
          price_usd_cents?: number
          price_zar_cents?: number
          print_method?: string | null
          sku?: string | null
          slot_number?: number
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
