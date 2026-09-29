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
      appeal_events: {
        Row: {
          actor_id: string | null
          appeal_id: string
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["appeal_status"]
        }
        Insert: {
          actor_id?: string | null
          appeal_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["appeal_status"]
        }
        Update: {
          actor_id?: string | null
          appeal_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appeal_events_appeal_id_fkey"
            columns: ["appeal_id"]
            isOneToOne: false
            referencedRelation: "appeals"
            referencedColumns: ["id"]
          },
        ]
      }
      appeals: {
        Row: {
          attachment_path: string | null
          challan_id: string
          citizen_id: string
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          explanation: string
          ground: string
          id: string
          reviewer_id: string | null
          status: Database["public"]["Enums"]["appeal_status"]
        }
        Insert: {
          attachment_path?: string | null
          challan_id: string
          citizen_id: string
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          explanation: string
          ground: string
          id?: string
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
        }
        Update: {
          attachment_path?: string | null
          challan_id?: string
          citizen_id?: string
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          explanation?: string
          ground?: string
          id?: string
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appeals_challan_id_fkey"
            columns: ["challan_id"]
            isOneToOne: false
            referencedRelation: "challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      challan_evidence: {
        Row: {
          challan_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          sha256: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          challan_id: string
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          sha256: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          challan_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          sha256?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challan_evidence_challan_id_fkey"
            columns: ["challan_id"]
            isOneToOne: false
            referencedRelation: "challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challan_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challans: {
        Row: {
          additional_penalty: number
          amount: number
          base_fine: number
          challan_no: string
          created_at: string
          due_date: string
          id: string
          is_demo: boolean
          issued_at: string
          lat: number | null
          lng: number | null
          location_id: string | null
          location_text: string
          officer_id: string | null
          owner_id: string
          remarks: string | null
          reminder_sent_at: string | null
          rule_id: string
          status: Database["public"]["Enums"]["challan_status"]
          updated_at: string
          vehicle_id: string
          violation_id: string
        }
        Insert: {
          additional_penalty?: number
          amount: number
          base_fine: number
          challan_no: string
          created_at?: string
          due_date?: string
          id?: string
          is_demo?: boolean
          issued_at?: string
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          location_text: string
          officer_id?: string | null
          owner_id: string
          remarks?: string | null
          reminder_sent_at?: string | null
          rule_id: string
          status?: Database["public"]["Enums"]["challan_status"]
          updated_at?: string
          vehicle_id: string
          violation_id: string
        }
        Update: {
          additional_penalty?: number
          amount?: number
          base_fine?: number
          challan_no?: string
          created_at?: string
          due_date?: string
          id?: string
          is_demo?: boolean
          issued_at?: string
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          location_text?: string
          officer_id?: string | null
          owner_id?: string
          remarks?: string | null
          reminder_sent_at?: string | null
          rule_id?: string
          status?: Database["public"]["Enums"]["challan_status"]
          updated_at?: string
          vehicle_id?: string
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challans_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challans_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "traffic_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challans_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "document_expiry"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "challans_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challans_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "traffic_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          area: string
          city: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
        }
        Insert: {
          area: string
          city: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
        }
        Update: {
          area?: string
          city?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      officers: {
        Row: {
          active: boolean
          badge_no: string
          created_at: string
          rank: string
          station: string
          user_id: string
        }
        Insert: {
          active?: boolean
          badge_no: string
          created_at?: string
          rank?: string
          station: string
          user_id: string
        }
        Update: {
          active?: boolean
          badge_no?: string
          created_at?: string
          rank?: string
          station?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "officers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          challan_id: string
          id: string
          idempotency_key: string | null
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string
          payer_id: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          challan_id: string
          id?: string
          idempotency_key?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          payer_id?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          challan_id?: string
          id?: string
          idempotency_key?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          payer_id?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_challan_id_fkey"
            columns: ["challan_id"]
            isOneToOne: false
            referencedRelation: "challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_demo: boolean
          license_expiry: string | null
          license_no: string | null
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_demo?: boolean
          license_expiry?: string | null
          license_no?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_demo?: boolean
          license_expiry?: string | null
          license_no?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      traffic_rules: {
        Row: {
          active: boolean
          applicability: string
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string
          is_sample: boolean
          last_verified: string | null
          legal_act: string
          section: string
          source: string
          state: string | null
          updated_at: string
          vehicle_types: Database["public"]["Enums"]["vehicle_type"][] | null
          violation_id: string
        }
        Insert: {
          active?: boolean
          applicability?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_sample?: boolean
          last_verified?: string | null
          legal_act: string
          section: string
          source: string
          state?: string | null
          updated_at?: string
          vehicle_types?: Database["public"]["Enums"]["vehicle_type"][] | null
          violation_id: string
        }
        Update: {
          active?: boolean
          applicability?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_sample?: boolean
          last_verified?: string | null
          legal_act?: string
          section?: string
          source?: string
          state?: string | null
          updated_at?: string
          vehicle_types?: Database["public"]["Enums"]["vehicle_type"][] | null
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traffic_rules_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: false
            referencedRelation: "traffic_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_violations: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          name: string
          why_exists: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
          name: string
          why_exists: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          why_exists?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          fuel_type: string
          id: string
          insurance_expiry: string | null
          is_demo: boolean
          make: string
          model: string
          owner_id: string
          puc_expiry: string | null
          reg_no: string
          registration_date: string
          registration_expiry: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          created_at?: string
          fuel_type?: string
          id?: string
          insurance_expiry?: string | null
          is_demo?: boolean
          make: string
          model: string
          owner_id: string
          puc_expiry?: string | null
          reg_no: string
          registration_date: string
          registration_expiry?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          created_at?: string
          fuel_type?: string
          id?: string
          insurance_expiry?: string | null
          is_demo?: boolean
          make?: string
          model?: string
          owner_id?: string
          puc_expiry?: string | null
          reg_no?: string
          registration_date?: string
          registration_expiry?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_penalties: {
        Row: {
          additional_penalty: number
          additional_penalty_note: string | null
          base_fine: number
          created_at: string
          id: string
          rule_id: string
        }
        Insert: {
          additional_penalty?: number
          additional_penalty_note?: string | null
          base_fine: number
          created_at?: string
          id?: string
          rule_id: string
        }
        Update: {
          additional_penalty?: number
          additional_penalty_note?: string | null
          base_fine?: number
          created_at?: string
          id?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_penalties_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: true
            referencedRelation: "traffic_rules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      document_expiry: {
        Row: {
          days_left: number | null
          doc: string | null
          expires_on: string | null
          owner_id: string | null
          reg_no: string | null
          state: string | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _audit: {
        Args: {
          _action: string
          _entity: string
          _entity_id: string
          _meta?: Json
        }
        Returns: undefined
      }
      _gen_challan_no: { Args: never; Returns: string }
      _notify: {
        Args: {
          _body: string
          _link: string
          _title: string
          _type: string
          _user: string
        }
        Returns: undefined
      }
      add_evidence: {
        Args: {
          _challan_id: string
          _file_name: string
          _file_size: number
          _file_type: string
          _sha256: string
          _storage_path: string
        }
        Returns: {
          challan_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          sha256: string
          storage_path: string
          uploaded_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "challan_evidence"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_role: {
        Args: {
          _badge?: string
          _role: Database["public"]["Enums"]["app_role"]
          _station?: string
          _user_id: string
        }
        Returns: undefined
      }
      check_duplicate_challans: {
        Args: {
          _hours?: number
          _lat?: number
          _lng?: number
          _vehicle_id: string
          _violation_id: string
        }
        Returns: {
          challan_no: string
          distance_m: number
          id: string
          issued_at: string
          location_text: string
          status: Database["public"]["Enums"]["challan_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      issue_challan: {
        Args: {
          _issued_at?: string
          _lat: number
          _lng: number
          _location_id: string
          _location_text: string
          _remarks: string
          _vehicle_id: string
          _violation_id: string
        }
        Returns: {
          additional_penalty: number
          amount: number
          base_fine: number
          challan_no: string
          created_at: string
          due_date: string
          id: string
          is_demo: boolean
          issued_at: string
          lat: number | null
          lng: number | null
          location_id: string | null
          location_text: string
          officer_id: string | null
          owner_id: string
          remarks: string | null
          reminder_sent_at: string | null
          rule_id: string
          status: Database["public"]["Enums"]["challan_status"]
          updated_at: string
          vehicle_id: string
          violation_id: string
        }
        SetofOptions: {
          from: "*"
          to: "challans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_event: {
        Args: {
          _action: string
          _entity: string
          _entity_id?: string
          _meta?: Json
        }
        Returns: undefined
      }
      pay_challan: {
        Args: {
          _challan_id: string
          _idempotency_key: string
          _method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: {
          amount: number
          challan_id: string
          id: string
          idempotency_key: string | null
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string
          payer_id: string | null
          status: string
          transaction_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      refresh_document_reminders: { Args: never; Returns: number }
      resolve_fine: {
        Args: { _vehicle_id: string; _violation_id: string }
        Returns: {
          additional_penalty: number
          applicable: boolean
          base_fine: number
          is_sample: boolean
          legal_act: string
          rule_id: string
          section: string
          source: string
        }[]
      }
      review_appeal: {
        Args: { _action: string; _appeal_id: string; _notes?: string }
        Returns: {
          attachment_path: string | null
          challan_id: string
          citizen_id: string
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          explanation: string
          ground: string
          id: string
          reviewer_id: string | null
          status: Database["public"]["Enums"]["appeal_status"]
        }
        SetofOptions: {
          from: "*"
          to: "appeals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_escalation: { Args: never; Returns: Json }
      submit_appeal: {
        Args: {
          _attachment_path?: string
          _challan_id: string
          _explanation: string
          _ground: string
        }
        Returns: {
          attachment_path: string | null
          challan_id: string
          citizen_id: string
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          explanation: string
          ground: string
          id: string
          reviewer_id: string | null
          status: Database["public"]["Enums"]["appeal_status"]
        }
        SetofOptions: {
          from: "*"
          to: "appeals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_challan: {
        Args: { _challan_no: string }
        Returns: {
          amount: number
          challan_no: string
          issued_at: string
          reg_no_masked: string
          status: Database["public"]["Enums"]["challan_status"]
          verified_at: string
          violation: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "officer" | "citizen"
      appeal_status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
      challan_status:
        | "PENDING"
        | "PAID"
        | "DISPUTED"
        | "UNDER_REVIEW"
        | "RESOLVED"
        | "OVERDUE"
        | "ESCALATED"
      payment_method: "UPI" | "CARD" | "NETBANKING"
      vehicle_type:
        | "MOTORCYCLE"
        | "SCOOTER"
        | "CAR"
        | "BUS"
        | "TRUCK"
        | "AUTO_RICKSHAW"
        | "OTHER"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "officer", "citizen"],
      appeal_status: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      challan_status: [
        "PENDING",
        "PAID",
        "DISPUTED",
        "UNDER_REVIEW",
        "RESOLVED",
        "OVERDUE",
        "ESCALATED",
      ],
      payment_method: ["UPI", "CARD", "NETBANKING"],
      vehicle_type: [
        "MOTORCYCLE",
        "SCOOTER",
        "CAR",
        "BUS",
        "TRUCK",
        "AUTO_RICKSHAW",
        "OTHER",
      ],
    },
  },
} as const
