export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessment_results: {
        Row: {
          id: string;
          user_id: string;
          score_tf: number;
          score_gm: number;
          score_au: number;
          score_se: number;
          score_ec: number;
          score_sv: number;
          score_ch: number;
          score_ls: number;
          main_anchor: string;
          secondary_anchor: string | null;
          conflict_anchors: string[] | null;
          risk_index: number;
          stability: string;
          question_count: number;
          completion_time_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score_tf: number;
          score_gm: number;
          score_au: number;
          score_se: number;
          score_ec: number;
          score_sv: number;
          score_ch: number;
          score_ls: number;
          main_anchor: string;
          secondary_anchor?: string | null;
          conflict_anchors?: string[] | null;
          risk_index: number;
          stability: string;
          question_count: number;
          completion_time_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score_tf?: number;
          score_gm?: number;
          score_au?: number;
          score_se?: number;
          score_ec?: number;
          score_sv?: number;
          score_ch?: number;
          score_ls?: number;
          main_anchor?: string;
          secondary_anchor?: string | null;
          conflict_anchors?: string[] | null;
          risk_index?: number;
          stability?: string;
          question_count?: number;
          completion_time_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      assessment_progress: {
        Row: {
          id: string;
          user_id: string;
          current_index: number;
          answers: Record<string, unknown>[];
          question_order: string[];
          started_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_index?: number;
          answers?: Record<string, unknown>[];
          question_order?: string[];
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_index?: number;
          answers?: Record<string, unknown>[];
          question_order?: string[];
          started_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      certification_types: {
        Row: {
          id: string;
          type_code: string;
          type_name_zh_tw: string;
          type_name_zh_cn: string;
          type_name_en: string;
          description_zh_tw: string;
          description_zh_cn: string;
          description_en: string;
          level: number;
          validity_years: number;
          cdu_requirement: number;
          price_ntd: number;
          requirements: Json;
          benefits: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type_code: string;
          type_name_zh_tw: string;
          type_name_zh_cn?: string;
          type_name_en?: string;
          description_zh_tw?: string;
          description_zh_cn?: string;
          description_en?: string;
          level?: number;
          validity_years?: number;
          cdu_requirement?: number;
          price_ntd?: number;
          requirements?: Json;
          benefits?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type_code?: string;
          type_name_zh_tw?: string;
          type_name_zh_cn?: string;
          type_name_en?: string;
          description_zh_tw?: string;
          description_zh_cn?: string;
          description_en?: string;
          level?: number;
          validity_years?: number;
          cdu_requirement?: number;
          price_ntd?: number;
          requirements?: Json;
          benefits?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cp_packages: {
        Row: {
          id: string;
          package_code: string;
          package_name_zh_tw: string;
          package_name_zh_cn: string;
          package_name_en: string;
          cp_amount: number;
          price_ntd: number;
          bonus_cp: number;
          discount_percent: number;
          description_zh_tw: string;
          description_zh_cn: string;
          description_en: string;
          valid_days: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          package_code: string;
          package_name_zh_tw: string;
          package_name_zh_cn?: string;
          package_name_en?: string;
          cp_amount?: number;
          price_ntd?: number;
          bonus_cp?: number;
          discount_percent?: number;
          description_zh_tw?: string;
          description_zh_cn?: string;
          description_en?: string;
          valid_days?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          package_code?: string;
          package_name_zh_tw?: string;
          package_name_zh_cn?: string;
          package_name_en?: string;
          cp_amount?: number;
          price_ntd?: number;
          bonus_cp?: number;
          discount_percent?: number;
          description_zh_tw?: string;
          description_zh_cn?: string;
          description_en?: string;
          valid_days?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessment_questions: {
        Row: {
          id: string;
          question_number: number;
          question_text_zh_tw: string;
          question_text_zh_cn: string;
          question_text_en: string;
          anchor_code: string;
          category: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_number: number;
          question_text_zh_tw: string;
          question_text_zh_cn?: string;
          question_text_en?: string;
          anchor_code: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_number?: number;
          question_text_zh_tw?: string;
          question_text_zh_cn?: string;
          question_text_en?: string;
          anchor_code?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json;
          setting_type: string;
          description: string;
          is_public: boolean;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: Json;
          setting_type?: string;
          description?: string;
          is_public?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          setting_type?: string;
          description?: string;
          is_public?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faq: {
        Row: {
          id: string;
          question_zh_tw: string;
          question_zh_cn: string;
          question_en: string;
          answer_zh_tw: string;
          answer_zh_cn: string;
          answer_en: string;
          category: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_zh_tw: string;
          question_zh_cn?: string;
          question_en?: string;
          answer_zh_tw: string;
          answer_zh_cn?: string;
          answer_en?: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_zh_tw?: string;
          question_zh_cn?: string;
          question_en?: string;
          answer_zh_tw?: string;
          answer_zh_cn?: string;
          answer_en?: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
