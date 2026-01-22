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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_name: string
          appointment_id: string
          created_at: string
          id: string
          note: string | null
          team_id: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_name: string
          appointment_id: string
          created_at?: string
          id?: string
          note?: string | null
          team_id: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_name?: string
          appointment_id?: string
          created_at?: string
          id?: string
          note?: string | null
          team_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          add_to_google_calendar_link: string | null
          add_to_ical_link: string | null
          appointment_notes: string | null
          appointment_timezone: string | null
          appointment_type_id: string | null
          assigned_user_id: string | null
          assignment_source: string | null
          booking_code: string | null
          calendar_id: string | null
          calendly_invitee_uri: string | null
          cancel_url: string | null
          cancellation_link: string | null
          cc_collected: number | null
          closer_id: string | null
          closer_name: string | null
          closer_notes: string | null
          created_at: string | null
          duration_minutes: number | null
          event_type_name: string | null
          event_type_uri: string | null
          id: string
          lead_email: string
          lead_name: string
          lead_phone: string | null
          meeting_link: string | null
          mrr_amount: number | null
          mrr_months: number | null
          original_appointment_id: string | null
          original_booking_date: string | null
          original_closer_id: string | null
          original_closer_name: string | null
          original_closer_notified_at: string | null
          pipeline_stage: string | null
          previous_status: string | null
          product_name: string | null
          rebooking_type: string | null
          reschedule_count: number | null
          reschedule_url: string | null
          rescheduled_to_appointment_id: string | null
          retarget_date: string | null
          retarget_reason: string | null
          revenue: number | null
          setter_id: string | null
          setter_name: string | null
          setter_notes: string | null
          start_at_utc: string
          status: Database["public"]["Enums"]["appointment_status"]
          team_id: string
          updated_at: string | null
        }
        Insert: {
          add_to_google_calendar_link?: string | null
          add_to_ical_link?: string | null
          appointment_notes?: string | null
          appointment_timezone?: string | null
          appointment_type_id?: string | null
          assigned_user_id?: string | null
          assignment_source?: string | null
          booking_code?: string | null
          calendar_id?: string | null
          calendly_invitee_uri?: string | null
          cancel_url?: string | null
          cancellation_link?: string | null
          cc_collected?: number | null
          closer_id?: string | null
          closer_name?: string | null
          closer_notes?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          event_type_name?: string | null
          event_type_uri?: string | null
          id?: string
          lead_email: string
          lead_name: string
          lead_phone?: string | null
          meeting_link?: string | null
          mrr_amount?: number | null
          mrr_months?: number | null
          original_appointment_id?: string | null
          original_booking_date?: string | null
          original_closer_id?: string | null
          original_closer_name?: string | null
          original_closer_notified_at?: string | null
          pipeline_stage?: string | null
          previous_status?: string | null
          product_name?: string | null
          rebooking_type?: string | null
          reschedule_count?: number | null
          reschedule_url?: string | null
          rescheduled_to_appointment_id?: string | null
          retarget_date?: string | null
          retarget_reason?: string | null
          revenue?: number | null
          setter_id?: string | null
          setter_name?: string | null
          setter_notes?: string | null
          start_at_utc: string
          status?: Database["public"]["Enums"]["appointment_status"]
          team_id: string
          updated_at?: string | null
        }
        Update: {
          add_to_google_calendar_link?: string | null
          add_to_ical_link?: string | null
          appointment_notes?: string | null
          appointment_timezone?: string | null
          appointment_type_id?: string | null
          assigned_user_id?: string | null
          assignment_source?: string | null
          booking_code?: string | null
          calendar_id?: string | null
          calendly_invitee_uri?: string | null
          cancel_url?: string | null
          cancellation_link?: string | null
          cc_collected?: number | null
          closer_id?: string | null
          closer_name?: string | null
          closer_notes?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          event_type_name?: string | null
          event_type_uri?: string | null
          id?: string
          lead_email?: string
          lead_name?: string
          lead_phone?: string | null
          meeting_link?: string | null
          mrr_amount?: number | null
          mrr_months?: number | null
          original_appointment_id?: string | null
          original_booking_date?: string | null
          original_closer_id?: string | null
          original_closer_name?: string | null
          original_closer_notified_at?: string | null
          pipeline_stage?: string | null
          previous_status?: string | null
          product_name?: string | null
          rebooking_type?: string | null
          reschedule_count?: number | null
          reschedule_url?: string | null
          rescheduled_to_appointment_id?: string | null
          retarget_date?: string | null
          retarget_reason?: string | null
          revenue?: number | null
          setter_id?: string | null
          setter_name?: string | null
          setter_notes?: string | null
          start_at_utc?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_original_appointment_id_fkey"
            columns: ["original_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_to_appointment_id_fkey"
            columns: ["rescheduled_to_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_field_templates: {
        Row: {
          created_at: string | null
          field_category: string
          field_name: string
          field_type: string
          help_text: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          order_index: number
          placeholder_text: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          field_category: string
          field_name: string
          field_type: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          order_index: number
          placeholder_text?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          field_category?: string
          field_name?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          order_index?: number
          placeholder_text?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_field_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_enrollments: {
        Row: {
          appointment_id: string | null
          automation_id: string
          completed_at: string | null
          contact_id: string | null
          context_snapshot: Json | null
          created_at: string
          current_step_id: string | null
          enrolled_at: string
          exit_reason: string | null
          exited_at: string | null
          id: string
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          automation_id: string
          completed_at?: string | null
          contact_id?: string | null
          context_snapshot?: Json | null
          created_at?: string
          current_step_id?: string | null
          enrolled_at?: string
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          automation_id?: string
          completed_at?: string | null
          contact_id?: string | null
          context_snapshot?: Json | null
          created_at?: string
          current_step_id?: string | null
          enrolled_at?: string
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_enrollments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_enrollments_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_enrollments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          position: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          position?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_folders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_goals: {
        Row: {
          automation_id: string
          condition: Json
          created_at: string
          description: string | null
          exit_on_goal: boolean
          go_to_step_id: string | null
          id: string
          is_active: boolean
          name: string
          team_id: string
          updated_at: string
        }
        Insert: {
          automation_id: string
          condition?: Json
          created_at?: string
          description?: string | null
          exit_on_goal?: boolean
          go_to_step_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          team_id: string
          updated_at?: string
        }
        Update: {
          automation_id?: string
          condition?: Json
          created_at?: string
          description?: string | null
          exit_on_goal?: boolean
          go_to_step_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_goals_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rate_limits: {
        Row: {
          automation_id: string | null
          channel: string
          created_at: string | null
          current_day_count: number | null
          current_hour_count: number | null
          day_reset_at: string | null
          hour_reset_at: string | null
          id: string
          max_per_day: number | null
          max_per_hour: number | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          automation_id?: string | null
          channel: string
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          day_reset_at?: string | null
          hour_reset_at?: string | null
          id?: string
          max_per_day?: number | null
          max_per_hour?: number | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          automation_id?: string | null
          channel?: string
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          day_reset_at?: string | null
          hour_reset_at?: string | null
          id?: string
          max_per_day?: number | null
          max_per_hour?: number | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rate_limits_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rate_limits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          context_snapshot: Json | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          replay_of_run_id: string | null
          status: string
          steps_executed: Json
          team_id: string
          trigger_type: string
          version_id: string | null
        }
        Insert: {
          automation_id: string
          context_snapshot?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          replay_of_run_id?: string | null
          status: string
          steps_executed?: Json
          team_id: string
          trigger_type: string
          version_id?: string | null
        }
        Update: {
          automation_id?: string
          context_snapshot?: Json | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          replay_of_run_id?: string | null
          status?: string
          steps_executed?: Json
          team_id?: string
          trigger_type?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_replay_of_run_id_fkey"
            columns: ["replay_of_run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_step_logs: {
        Row: {
          action_type: string
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_snapshot: Json | null
          output_snapshot: Json | null
          retry_count: number | null
          run_id: string
          skip_reason: string | null
          started_at: string
          status: string
          step_id: string
        }
        Insert: {
          action_type: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_snapshot?: Json | null
          output_snapshot?: Json | null
          retry_count?: number | null
          run_id: string
          skip_reason?: string | null
          started_at?: string
          status?: string
          step_id: string
        }
        Update: {
          action_type?: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_snapshot?: Json | null
          output_snapshot?: Json | null
          retry_count?: number | null
          run_id?: string
          skip_reason?: string | null
          started_at?: string
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_step_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          definition: Json
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          is_system: boolean | null
          name: string
          team_id: string | null
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          definition: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          name: string
          team_id?: string | null
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          definition?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          name?: string
          team_id?: string | null
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          current_version_id: string | null
          definition: Json
          description: string | null
          error_count: number | null
          folder_id: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          run_count: number | null
          team_id: string
          trigger_type: string
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          definition?: Json
          description?: string | null
          error_count?: number | null
          folder_id?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number | null
          team_id: string
          trigger_type: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          definition?: Json
          description?: string | null
          error_count?: number | null
          folder_id?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          team_id?: string
          trigger_type?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "automation_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_pricing: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_active: boolean
          unit_label: string
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          unit_label: string
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          unit_label?: string
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_asset_audit_logs: {
        Row: {
          action: string
          client_asset_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          client_asset_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          client_asset_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_asset_audit_logs_client_asset_id_fkey"
            columns: ["client_asset_id"]
            isOneToOne: false
            referencedRelation: "client_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_asset_fields: {
        Row: {
          client_asset_id: string
          created_at: string | null
          field_category: string
          field_name: string
          field_type: string
          field_value: string | null
          help_text: string | null
          id: string
          is_required: boolean | null
          order_index: number
          placeholder_text: string | null
          updated_at: string | null
        }
        Insert: {
          client_asset_id: string
          created_at?: string | null
          field_category: string
          field_name: string
          field_type: string
          field_value?: string | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          order_index: number
          placeholder_text?: string | null
          updated_at?: string | null
        }
        Update: {
          client_asset_id?: string
          created_at?: string | null
          field_category?: string
          field_name?: string
          field_type?: string
          field_value?: string | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number
          placeholder_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_asset_fields_client_asset_id_fkey"
            columns: ["client_asset_id"]
            isOneToOne: false
            referencedRelation: "client_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_asset_files: {
        Row: {
          client_asset_id: string
          file_category: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          client_asset_id: string
          file_category: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          client_asset_id?: string
          file_category?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_asset_files_client_asset_id_fkey"
            columns: ["client_asset_id"]
            isOneToOne: false
            referencedRelation: "client_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assets: {
        Row: {
          access_token: string
          client_email: string
          client_name: string
          completion_percentage: number | null
          created_at: string | null
          created_by: string
          id: string
          last_updated_by: string | null
          status: string
          team_id: string | null
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          client_email: string
          client_name: string
          completion_percentage?: number | null
          created_at?: string | null
          created_by: string
          id?: string
          last_updated_by?: string | null
          status?: string
          team_id?: string | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          client_email?: string
          client_name?: string
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string
          id?: string
          last_updated_by?: string | null
          status?: string
          team_id?: string | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      closer_reassignment_history: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          new_closer_id: string | null
          new_closer_name: string
          notified_at: string | null
          original_closer_id: string | null
          original_closer_name: string
          reason: string | null
          reassigned_at: string
          team_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          new_closer_id?: string | null
          new_closer_name: string
          notified_at?: string | null
          original_closer_id?: string | null
          original_closer_name: string
          reason?: string | null
          reassigned_at?: string
          team_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          new_closer_id?: string | null
          new_closer_name?: string
          notified_at?: string | null
          original_closer_id?: string | null
          original_closer_name?: string
          reason?: string | null
          reassigned_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closer_reassignment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closer_reassignment_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_tasks: {
        Row: {
          appointment_id: string
          assigned_at: string | null
          assigned_role: string | null
          assigned_to: string | null
          auto_return_at: string | null
          claimed_manually: boolean | null
          completed_at: string | null
          completed_confirmations: number | null
          confirmation_attempts: Json | null
          confirmation_sequence: number | null
          created_at: string
          due_at: string
          follow_up_date: string | null
          follow_up_reason: string | null
          follow_up_sequence: number | null
          id: string
          is_overdue: boolean | null
          pipeline_stage: string | null
          required_confirmations: number | null
          reschedule_date: string | null
          reschedule_notes: string | null
          reschedule_reason: string | null
          routing_mode: string | null
          status: string
          task_type: Database["public"]["Enums"]["task_type"]
          team_id: string
        }
        Insert: {
          appointment_id: string
          assigned_at?: string | null
          assigned_role?: string | null
          assigned_to?: string | null
          auto_return_at?: string | null
          claimed_manually?: boolean | null
          completed_at?: string | null
          completed_confirmations?: number | null
          confirmation_attempts?: Json | null
          confirmation_sequence?: number | null
          created_at?: string
          due_at: string
          follow_up_date?: string | null
          follow_up_reason?: string | null
          follow_up_sequence?: number | null
          id?: string
          is_overdue?: boolean | null
          pipeline_stage?: string | null
          required_confirmations?: number | null
          reschedule_date?: string | null
          reschedule_notes?: string | null
          reschedule_reason?: string | null
          routing_mode?: string | null
          status?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          team_id: string
        }
        Update: {
          appointment_id?: string
          assigned_at?: string | null
          assigned_role?: string | null
          assigned_to?: string | null
          auto_return_at?: string | null
          claimed_manually?: boolean | null
          completed_at?: string | null
          completed_confirmations?: number | null
          confirmation_attempts?: Json | null
          confirmation_sequence?: number | null
          created_at?: string
          due_at?: string
          follow_up_date?: string | null
          follow_up_reason?: string | null
          follow_up_sequence?: number | null
          id?: string
          is_overdue?: boolean | null
          pipeline_stage?: string | null
          required_confirmations?: number | null
          reschedule_date?: string | null
          reschedule_notes?: string | null
          reschedule_reason?: string | null
          routing_mode?: string | null
          status?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_1: string | null
          address_2: string | null
          calendar_link: string | null
          calendly_booked_at: string | null
          city: string | null
          company_name: string | null
          contact_type: string | null
          country: string | null
          created_at: string
          custom_fields: Json | null
          date_of_birth: string | null
          dnd_email: boolean | null
          dnd_sms: boolean | null
          dnd_voice: boolean | null
          email: string | null
          engagement_score: number | null
          first_name: string | null
          funnel_lead_id: string | null
          id: string
          last_activity_at: string | null
          last_name: string | null
          name: string | null
          opt_in: boolean | null
          owner_user_id: string | null
          phone: string | null
          postal_code: string | null
          signature: string | null
          source: string | null
          state: string | null
          tags: string[] | null
          team_id: string
          timezone: string | null
          twilio_phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_1?: string | null
          address_2?: string | null
          calendar_link?: string | null
          calendly_booked_at?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          dnd_email?: boolean | null
          dnd_sms?: boolean | null
          dnd_voice?: boolean | null
          email?: string | null
          engagement_score?: number | null
          first_name?: string | null
          funnel_lead_id?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          name?: string | null
          opt_in?: boolean | null
          owner_user_id?: string | null
          phone?: string | null
          postal_code?: string | null
          signature?: string | null
          source?: string | null
          state?: string | null
          tags?: string[] | null
          team_id: string
          timezone?: string | null
          twilio_phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_1?: string | null
          address_2?: string | null
          calendar_link?: string | null
          calendly_booked_at?: string | null
          city?: string | null
          company_name?: string | null
          contact_type?: string | null
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          date_of_birth?: string | null
          dnd_email?: boolean | null
          dnd_sms?: boolean | null
          dnd_voice?: boolean | null
          email?: string | null
          engagement_score?: number | null
          first_name?: string | null
          funnel_lead_id?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          name?: string | null
          opt_in?: boolean | null
          owner_user_id?: string | null
          phone?: string | null
          postal_code?: string | null
          signature?: string | null
          source?: string | null
          state?: string | null
          tags?: string[] | null
          team_id?: string
          timezone?: string | null
          twilio_phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_funnel_lead_id_fkey"
            columns: ["funnel_lead_id"]
            isOneToOne: false
            referencedRelation: "funnel_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          uses_count?: number | null
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          channel: string
          created_at: string
          credits: number
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price_cents: number
          sort_order: number
          stripe_price_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_cents: number
          sort_order?: number
          stripe_price_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          channel: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          team_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          channel: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          team_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          team_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      data_integrity_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          issue_count: number
          issue_type: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          issue_count: number
          issue_type: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          issue_count?: number
          issue_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      email_aliases: {
        Row: {
          alias_email: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          source: string
          user_id: string
        }
        Insert: {
          alias_email: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          source?: string
          user_id: string
        }
        Update: {
          alias_email?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          error_context: Json | null
          error_message: string
          error_type: string
          id: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_context?: Json | null
          error_message: string
          error_type: string
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_context?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          dedupe_key: string
          element_id: string | null
          event_type: string
          funnel_id: string
          id: string
          lead_id: string | null
          occurred_at: string
          payload: Json
          session_id: string
          step_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          element_id?: string | null
          event_type: string
          funnel_id: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          payload?: Json
          session_id: string
          step_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          element_id?: string | null
          event_type?: string
          funnel_id?: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          payload?: Json
          session_id?: string
          step_id?: string
        }
        Relationships: []
      }
      funnel_domains: {
        Row: {
          alert_sent_at: string | null
          cloudflare_hostname_id: string | null
          created_at: string
          dns_a_record_valid: boolean | null
          dns_txt_record_valid: boolean | null
          dns_www_valid: boolean | null
          domain: string
          health_status: string | null
          id: string
          last_health_check: string | null
          ssl_expires_at: string | null
          ssl_provisioned: boolean | null
          ssl_provisioned_at: string | null
          ssl_status: string | null
          status: string
          team_id: string
          updated_at: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          alert_sent_at?: string | null
          cloudflare_hostname_id?: string | null
          created_at?: string
          dns_a_record_valid?: boolean | null
          dns_txt_record_valid?: boolean | null
          dns_www_valid?: boolean | null
          domain: string
          health_status?: string | null
          id?: string
          last_health_check?: string | null
          ssl_expires_at?: string | null
          ssl_provisioned?: boolean | null
          ssl_provisioned_at?: string | null
          ssl_status?: string | null
          status?: string
          team_id: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          alert_sent_at?: string | null
          cloudflare_hostname_id?: string | null
          created_at?: string
          dns_a_record_valid?: boolean | null
          dns_txt_record_valid?: boolean | null
          dns_www_valid?: boolean | null
          domain?: string
          health_status?: string | null
          id?: string
          last_health_check?: string | null
          ssl_expires_at?: string | null
          ssl_provisioned?: boolean | null
          ssl_provisioned_at?: string | null
          ssl_status?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_domains_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_leads: {
        Row: {
          answers: Json
          calendly_booking_data: Json | null
          created_at: string
          email: string | null
          funnel_id: string
          ghl_synced_at: string | null
          id: string
          last_step_index: number | null
          name: string | null
          opt_in_status: boolean | null
          opt_in_timestamp: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          team_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json
          calendly_booking_data?: Json | null
          created_at?: string
          email?: string | null
          funnel_id: string
          ghl_synced_at?: string | null
          id?: string
          last_step_index?: number | null
          name?: string | null
          opt_in_status?: boolean | null
          opt_in_timestamp?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          team_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json
          calendly_booking_data?: Json | null
          created_at?: string
          email?: string | null
          funnel_id?: string
          ghl_synced_at?: string | null
          id?: string
          last_step_index?: number | null
          name?: string | null
          opt_in_status?: boolean | null
          opt_in_timestamp?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          team_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_leads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_steps: {
        Row: {
          content: Json
          created_at: string
          funnel_id: string
          id: string
          order_index: number
          step_type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          funnel_id: string
          id?: string
          order_index?: number
          step_type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          funnel_id?: string
          id?: string
          order_index?: number
          step_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          auto_create_contact: boolean | null
          builder_document: Json | null
          created_at: string
          created_by: string
          domain_id: string | null
          id: string
          name: string
          published_document_snapshot: Json | null
          settings: Json
          slug: string
          status: string
          team_id: string
          updated_at: string
          version_history: Json | null
          webhook_urls: Json | null
          zapier_webhook_url: string | null
        }
        Insert: {
          auto_create_contact?: boolean | null
          builder_document?: Json | null
          created_at?: string
          created_by: string
          domain_id?: string | null
          id?: string
          name: string
          published_document_snapshot?: Json | null
          settings?: Json
          slug: string
          status?: string
          team_id: string
          updated_at?: string
          version_history?: Json | null
          webhook_urls?: Json | null
          zapier_webhook_url?: string | null
        }
        Update: {
          auto_create_contact?: boolean | null
          builder_document?: Json | null
          created_at?: string
          created_by?: string
          domain_id?: string | null
          id?: string
          name?: string
          published_document_snapshot?: Json | null
          settings?: Json
          slug?: string
          status?: string
          team_id?: string
          updated_at?: string
          version_history?: Json | null
          webhook_urls?: Json | null
          zapier_webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "funnel_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          automation_id: string | null
          channel: string
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_status: string | null
          error_message: string | null
          from_address: string | null
          id: string
          opened_at: string | null
          payload: Json
          provider: string
          provider_message_id: string | null
          run_id: string | null
          status: string
          team_id: string
          template: string | null
          to_address: string
          webhook_payload: Json | null
        }
        Insert: {
          automation_id?: string | null
          channel: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          from_address?: string | null
          id?: string
          opened_at?: string | null
          payload?: Json
          provider: string
          provider_message_id?: string | null
          run_id?: string | null
          status?: string
          team_id: string
          template?: string | null
          to_address: string
          webhook_payload?: Json | null
        }
        Update: {
          automation_id?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          from_address?: string | null
          id?: string
          opened_at?: string | null
          payload?: Json
          provider?: string
          provider_message_id?: string | null
          run_id?: string | null
          status?: string
          team_id?: string
          template?: string | null
          to_address?: string
          webhook_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_pricing: {
        Row: {
          channel: string
          country_code: string
          created_at: string
          credits_per_unit: number
          description: string | null
          direction: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          channel: string
          country_code?: string
          created_at?: string
          credits_per_unit?: number
          description?: string | null
          direction?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          channel?: string
          country_code?: string
          created_at?: string
          credits_per_unit?: number
          description?: string | null
          direction?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      mrr_commissions: {
        Row: {
          appointment_id: string | null
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          id: string
          month_date: string
          mrr_amount: number
          prospect_email: string
          prospect_name: string
          role: string
          sale_id: string | null
          team_id: string
          team_member_id: string
          team_member_name: string
        }
        Insert: {
          appointment_id?: string | null
          commission_amount: number
          commission_percentage: number
          created_at?: string | null
          id?: string
          month_date: string
          mrr_amount: number
          prospect_email: string
          prospect_name: string
          role: string
          sale_id?: string | null
          team_id: string
          team_member_id: string
          team_member_name: string
        }
        Update: {
          appointment_id?: string | null
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          month_date?: string
          mrr_amount?: number
          prospect_email?: string
          prospect_name?: string
          role?: string
          sale_id?: string | null
          team_id?: string
          team_member_id?: string
          team_member_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrr_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrr_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_follow_up_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string
          id: string
          mrr_schedule_id: string
          notes: string | null
          status: string
          team_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date: string
          id?: string
          mrr_schedule_id: string
          notes?: string | null
          status?: string
          team_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string
          id?: string
          mrr_schedule_id?: string
          notes?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mrr_schedule"
            columns: ["mrr_schedule_id"]
            isOneToOne: false
            referencedRelation: "mrr_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      mrr_schedules: {
        Row: {
          appointment_id: string
          assigned_to: string | null
          client_email: string
          client_name: string
          created_at: string
          first_charge_date: string
          id: string
          mrr_amount: number
          next_renewal_date: string
          notes: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          assigned_to?: string | null
          client_email: string
          client_name: string
          created_at?: string
          first_charge_date: string
          id?: string
          mrr_amount: number
          next_renewal_date: string
          notes?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          assigned_to?: string | null
          client_email?: string
          client_name?: string
          created_at?: string
          first_charge_date?: string
          id?: string
          mrr_amount?: number
          next_renewal_date?: string
          notes?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          currency: string
          id: string
          lead_id: string | null
          metadata: Json | null
          payment_method: string
          processed_at: string
          team_id: string
          type: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          payment_method?: string
          processed_at?: string
          team_id: string
          type?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          payment_method?: string
          processed_at?: string
          team_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          google_meet_connected: boolean | null
          id: string
          notification_preferences: Json | null
          phone_number: string | null
          updated_at: string | null
          zoom_connected: boolean | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          google_meet_connected?: boolean | null
          id: string
          notification_preferences?: Json | null
          phone_number?: string | null
          updated_at?: string | null
          zoom_connected?: boolean | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          google_meet_connected?: boolean | null
          id?: string
          notification_preferences?: Json | null
          phone_number?: string | null
          updated_at?: string | null
          zoom_connected?: boolean | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string | null
          commission: number | null
          created_at: string | null
          customer_name: string
          date: string
          id: string
          offer_owner: string | null
          product_name: string | null
          revenue: number | null
          sales_rep: string
          setter: string | null
          setter_commission: number | null
          status: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          commission?: number | null
          created_at?: string | null
          customer_name: string
          date: string
          id?: string
          offer_owner?: string | null
          product_name?: string | null
          revenue?: number | null
          sales_rep: string
          setter?: string | null
          setter_commission?: number | null
          status: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          commission?: number | null
          created_at?: string | null
          customer_name?: string
          date?: string
          id?: string
          offer_owner?: string | null
          product_name?: string | null
          revenue?: number | null
          sales_rep?: string
          setter?: string | null
          setter_commission?: number | null
          status?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_shared: boolean | null
          report_config: Json
          report_name: string
          report_type: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_shared?: boolean | null
          report_config: Json
          report_name: string
          report_type: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_shared?: boolean | null
          report_config?: Json
          report_name?: string
          report_type?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_automation_jobs: {
        Row: {
          automation_id: string
          context_snapshot: Json
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          resume_at: string
          run_id: string | null
          status: string
          step_id: string | null
          team_id: string
        }
        Insert: {
          automation_id: string
          context_snapshot?: Json
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          resume_at: string
          run_id?: string | null
          status?: string
          step_id?: string | null
          team_id: string
        }
        Update: {
          automation_id?: string
          context_snapshot?: Json
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          resume_at?: string
          run_id?: string | null
          status?: string
          step_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_automation_jobs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_automation_jobs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_automation_jobs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      setter_rotation_settings: {
        Row: {
          created_at: string
          id: string
          is_in_rotation: boolean
          setter_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_in_rotation?: boolean
          setter_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_in_rotation?: boolean
          setter_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setter_rotation_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_assets: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          external_url: string | null
          file_path: string | null
          file_type: string | null
          id: string
          loom_url: string | null
          order_index: number
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          external_url?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          loom_url?: string | null
          order_index?: number
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          external_url?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          loom_url?: string | null
          order_index?: number
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          team_id: string
          trigger_conditions: Json | null
          trigger_event: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          team_id: string
          trigger_conditions?: Json | null
          trigger_event: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          team_id?: string
          trigger_conditions?: Json | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_automation_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_billing: {
        Row: {
          auto_recharge_amount_cents: number
          auto_recharge_enabled: boolean
          auto_recharge_threshold_cents: number
          created_at: string
          id: string
          payment_method_brand: string | null
          payment_method_last4: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          team_id: string
          updated_at: string
          wallet_balance_cents: number
        }
        Insert: {
          auto_recharge_amount_cents?: number
          auto_recharge_enabled?: boolean
          auto_recharge_threshold_cents?: number
          created_at?: string
          id?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          team_id: string
          updated_at?: string
          wallet_balance_cents?: number
        }
        Update: {
          auto_recharge_amount_cents?: number
          auto_recharge_enabled?: boolean
          auto_recharge_threshold_cents?: number
          created_at?: string
          id?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          team_id?: string
          updated_at?: string
          wallet_balance_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_billing_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_business_hours: {
        Row: {
          close_time: string
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
          team_id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          close_time?: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
          team_id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          close_time?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
          team_id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_business_hours_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_credits: {
        Row: {
          created_at: string
          email_balance: number
          id: string
          sms_balance: number
          team_id: string
          updated_at: string
          voice_minutes_balance: number
          whatsapp_balance: number
        }
        Insert: {
          created_at?: string
          email_balance?: number
          id?: string
          sms_balance?: number
          team_id: string
          updated_at?: string
          voice_minutes_balance?: number
          whatsapp_balance?: number
        }
        Update: {
          created_at?: string
          email_balance?: number
          id?: string
          sms_balance?: number
          team_id?: string
          updated_at?: string
          voice_minutes_balance?: number
          whatsapp_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_credits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_follow_up_flow_config: {
        Row: {
          assigned_role: string
          created_at: string | null
          enabled: boolean | null
          hours_after: number
          id: string
          label: string
          pipeline_stage: string
          require_no_status_change_for_next: boolean | null
          sequence: number
          team_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_role?: string
          created_at?: string | null
          enabled?: boolean | null
          hours_after: number
          id?: string
          label: string
          pipeline_stage: string
          require_no_status_change_for_next?: boolean | null
          sequence: number
          team_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_role?: string
          created_at?: string | null
          enabled?: boolean | null
          hours_after?: number
          id?: string
          label?: string
          pipeline_stage?: string
          require_no_status_change_for_next?: boolean | null
          sequence?: number
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_follow_up_flow_config_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_follow_up_settings: {
        Row: {
          created_at: string
          default_days: number
          default_time: string
          id: string
          pipeline_stage: string
          suggest_follow_up: boolean
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_days?: number
          default_time?: string
          id?: string
          pipeline_stage: string
          suggest_follow_up?: boolean
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_days?: number
          default_time?: string
          id?: string
          pipeline_stage?: string
          suggest_follow_up?: boolean
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_follow_up_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_integrations: {
        Row: {
          config: Json | null
          connected_at: string | null
          created_at: string
          id: string
          integration_type: string
          is_connected: boolean | null
          team_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          integration_type: string
          is_connected?: boolean | null
          team_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          integration_type?: string
          is_connected?: boolean | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_integrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          team_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          booking_code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          booking_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          booking_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          is_edited: boolean
          message: string
          team_id: string
          updated_at: string | null
          user_id: string
          voice_duration: number | null
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          message: string
          team_id: string
          updated_at?: string | null
          user_id: string
          voice_duration?: number | null
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          message?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string
          voice_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_phone_numbers: {
        Row: {
          capabilities: Json
          country_code: string
          friendly_name: string | null
          id: string
          is_active: boolean
          is_default: boolean
          monthly_cost_cents: number
          phone_number: string
          phone_number_sid: string
          purchased_at: string
          released_at: string | null
          team_id: string
          webhook_configured: boolean
        }
        Insert: {
          capabilities?: Json
          country_code?: string
          friendly_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          monthly_cost_cents?: number
          phone_number: string
          phone_number_sid: string
          purchased_at?: string
          released_at?: string | null
          team_id: string
          webhook_configured?: boolean
        }
        Update: {
          capabilities?: Json
          country_code?: string
          friendly_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          monthly_cost_cents?: number
          phone_number?: string
          phone_number_sid?: string
          purchased_at?: string
          released_at?: string | null
          team_id?: string
          webhook_configured?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "team_phone_numbers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_pipeline_stages: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          order_index: number
          stage_color: string
          stage_id: string
          stage_label: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          order_index: number
          stage_color: string
          stage_id: string
          stage_label: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          order_index?: number
          stage_color?: string
          stage_id?: string
          stage_label?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_pipeline_stages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sending_domains: {
        Row: {
          created_at: string | null
          dns_records: Json | null
          domain: string
          emails_sent: number
          full_domain: string | null
          id: string
          last_email_at: string | null
          provider: string | null
          provider_domain_id: string | null
          status: string | null
          subdomain: string | null
          team_id: string
          updated_at: string | null
          verification_error: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          dns_records?: Json | null
          domain: string
          emails_sent?: number
          full_domain?: string | null
          id?: string
          last_email_at?: string | null
          provider?: string | null
          provider_domain_id?: string | null
          status?: string | null
          subdomain?: string | null
          team_id: string
          updated_at?: string | null
          verification_error?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          dns_records?: Json | null
          domain?: string
          emails_sent?: number
          full_domain?: string | null
          id?: string
          last_email_at?: string | null
          provider?: string | null
          provider_domain_id?: string | null
          status?: string | null
          subdomain?: string | null
          team_id?: string
          updated_at?: string | null
          verification_error?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_sending_domains_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          action_pipeline_mappings: Json | null
          allow_setter_pipeline_updates: boolean
          asset_categories: Json | null
          auto_create_tasks: boolean | null
          calendly_access_token: string | null
          calendly_enabled_for_crm: boolean | null
          calendly_enabled_for_funnels: boolean | null
          calendly_event_types: string[] | null
          calendly_funnel_scheduling_url: string | null
          calendly_organization_uri: string | null
          calendly_refresh_token: string | null
          calendly_token_expires_at: string | null
          calendly_webhook_id: string | null
          calendly_webhook_signing_key: string | null
          closer_commission_percentage: number | null
          confirmation_flow_config: Json | null
          confirmation_schedule: Json | null
          created_at: string | null
          created_by: string
          dashboard_preferences: Json | null
          default_from_name: string | null
          default_reply_to: string | null
          default_task_routing: Json | null
          fallback_confirmation_minutes: number | null
          google_sheets_url: string | null
          id: string
          last_task_assignment: Json | null
          logo_url: string | null
          minimum_booking_notice_hours: number | null
          mrr_task_assignment: string | null
          name: string
          no_answer_callback_options: Json | null
          no_answer_retry_minutes: number | null
          overdue_threshold_minutes: number | null
          setter_commission_percentage: number | null
          stackit_email_enabled: boolean | null
          task_routing_config: Json | null
          updated_at: string | null
        }
        Insert: {
          action_pipeline_mappings?: Json | null
          allow_setter_pipeline_updates?: boolean
          asset_categories?: Json | null
          auto_create_tasks?: boolean | null
          calendly_access_token?: string | null
          calendly_enabled_for_crm?: boolean | null
          calendly_enabled_for_funnels?: boolean | null
          calendly_event_types?: string[] | null
          calendly_funnel_scheduling_url?: string | null
          calendly_organization_uri?: string | null
          calendly_refresh_token?: string | null
          calendly_token_expires_at?: string | null
          calendly_webhook_id?: string | null
          calendly_webhook_signing_key?: string | null
          closer_commission_percentage?: number | null
          confirmation_flow_config?: Json | null
          confirmation_schedule?: Json | null
          created_at?: string | null
          created_by: string
          dashboard_preferences?: Json | null
          default_from_name?: string | null
          default_reply_to?: string | null
          default_task_routing?: Json | null
          fallback_confirmation_minutes?: number | null
          google_sheets_url?: string | null
          id?: string
          last_task_assignment?: Json | null
          logo_url?: string | null
          minimum_booking_notice_hours?: number | null
          mrr_task_assignment?: string | null
          name: string
          no_answer_callback_options?: Json | null
          no_answer_retry_minutes?: number | null
          overdue_threshold_minutes?: number | null
          setter_commission_percentage?: number | null
          stackit_email_enabled?: boolean | null
          task_routing_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          action_pipeline_mappings?: Json | null
          allow_setter_pipeline_updates?: boolean
          asset_categories?: Json | null
          auto_create_tasks?: boolean | null
          calendly_access_token?: string | null
          calendly_enabled_for_crm?: boolean | null
          calendly_enabled_for_funnels?: boolean | null
          calendly_event_types?: string[] | null
          calendly_funnel_scheduling_url?: string | null
          calendly_organization_uri?: string | null
          calendly_refresh_token?: string | null
          calendly_token_expires_at?: string | null
          calendly_webhook_id?: string | null
          calendly_webhook_signing_key?: string | null
          closer_commission_percentage?: number | null
          confirmation_flow_config?: Json | null
          confirmation_schedule?: Json | null
          created_at?: string | null
          created_by?: string
          dashboard_preferences?: Json | null
          default_from_name?: string | null
          default_reply_to?: string | null
          default_task_routing?: Json | null
          fallback_confirmation_minutes?: number | null
          google_sheets_url?: string | null
          id?: string
          last_task_assignment?: Json | null
          logo_url?: string | null
          minimum_booking_notice_hours?: number | null
          mrr_task_assignment?: string | null
          name?: string
          no_answer_callback_options?: Json | null
          no_answer_retry_minutes?: number | null
          overdue_threshold_minutes?: number | null
          setter_commission_percentage?: number | null
          stackit_email_enabled?: boolean | null
          task_routing_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["global_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["global_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["global_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          channel: string | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          team_id: string
          transaction_type: string
        }
        Insert: {
          amount_cents: number
          balance_after_cents: number
          channel?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          team_id: string
          transaction_type: string
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          channel?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          team_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_audit_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          received_at: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          received_at?: string
          status: string
          team_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          received_at?: string
          status?: string
          team_id?: string
        }
        Relationships: []
      }
      workflow_versions: {
        Row: {
          automation_id: string
          created_at: string | null
          definition_json: Json
          id: string
          is_active: boolean | null
          published_at: string
          published_by: string | null
          team_id: string
          trigger_type: string
          version_number: number
        }
        Insert: {
          automation_id: string
          created_at?: string | null
          definition_json: Json
          id?: string
          is_active?: boolean | null
          published_at?: string
          published_by?: string | null
          team_id: string
          trigger_type: string
          version_number: number
        }
        Update: {
          automation_id?: string
          created_at?: string | null
          definition_json?: Json
          id?: string
          is_active?: boolean | null
          published_at?: string
          published_by?: string | null
          team_id?: string
          trigger_type?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_versions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_versions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_channel: string
          p_description?: string
          p_reference_id?: string
          p_team_id: string
          p_transaction_type: string
        }
        Returns: number
      }
      add_wallet_balance: {
        Args: {
          p_amount_cents: number
          p_description?: string
          p_reference_id?: string
          p_team_id: string
          p_transaction_type?: string
        }
        Returns: Json
      }
      auto_assign_unassigned_tasks: { Args: never; Returns: undefined }
      auto_return_expired_tasks: { Args: never; Returns: undefined }
      calculate_completion_percentage: {
        Args: { asset_id: string }
        Returns: number
      }
      can_create_teams: { Args: { _user_id: string }; Returns: boolean }
      check_active_triggers: {
        Args: never
        Returns: {
          event: string
          table_name: string
          trigger_name: string
        }[]
      }
      check_data_integrity: {
        Args: never
        Returns: {
          details: Json
          issue_count: number
          issue_type: string
        }[]
      }
      check_overdue_tasks: { Args: never; Returns: undefined }
      cleanup_appointment_tasks: {
        Args: { appt_id: string }
        Returns: undefined
      }
      cleanup_confirmation_tasks: {
        Args: { p_appointment_id: string; p_reason?: string }
        Returns: undefined
      }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      close_deal_transaction: {
        Args: {
          p_appointment_id: string
          p_cc_amount: number
          p_closer_commission_pct?: number
          p_closer_id: string
          p_closer_name?: string
          p_mrr_amount: number
          p_mrr_months: number
          p_notes?: string
          p_product_name: string
          p_setter_commission_pct?: number
        }
        Returns: Json
      }
      create_task_with_assignment: {
        Args: {
          p_appointment_id: string
          p_follow_up_date?: string
          p_follow_up_reason?: string
          p_preferred_role?: string
          p_reschedule_date?: string
          p_task_type: Database["public"]["Enums"]["task_type"]
          p_team_id: string
        }
        Returns: string
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_channel: string
          p_description?: string
          p_reference_id?: string
          p_team_id: string
        }
        Returns: Json
      }
      deduct_wallet_balance: {
        Args: {
          p_amount_cents: number
          p_channel: string
          p_description?: string
          p_reference_id?: string
          p_team_id: string
        }
        Returns: Json
      }
      fire_automation_event: {
        Args: {
          p_event_id?: string
          p_event_payload: Json
          p_team_id: string
          p_trigger_type: string
        }
        Returns: Json
      }
      get_contact_full_name: {
        Args: { contact_row: Database["public"]["Tables"]["contacts"]["Row"] }
        Returns: string
      }
      get_team_role: {
        Args: { _team_id: string; _user_id: string }
        Returns: string
      }
      has_global_role: {
        Args: {
          _role: Database["public"]["Enums"]["global_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_role: {
        Args: { _role: string; _team_id: string; _user_id: string }
        Returns: boolean
      }
      has_valid_invitation: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      initialize_follow_up_flow_config: { Args: never; Returns: undefined }
      insert_appointments_batch: {
        Args: { appointments_data: Json }
        Returns: {
          add_to_google_calendar_link: string | null
          add_to_ical_link: string | null
          appointment_notes: string | null
          appointment_timezone: string | null
          appointment_type_id: string | null
          assigned_user_id: string | null
          assignment_source: string | null
          booking_code: string | null
          calendar_id: string | null
          calendly_invitee_uri: string | null
          cancel_url: string | null
          cancellation_link: string | null
          cc_collected: number | null
          closer_id: string | null
          closer_name: string | null
          closer_notes: string | null
          created_at: string | null
          duration_minutes: number | null
          event_type_name: string | null
          event_type_uri: string | null
          id: string
          lead_email: string
          lead_name: string
          lead_phone: string | null
          meeting_link: string | null
          mrr_amount: number | null
          mrr_months: number | null
          original_appointment_id: string | null
          original_booking_date: string | null
          original_closer_id: string | null
          original_closer_name: string | null
          original_closer_notified_at: string | null
          pipeline_stage: string | null
          previous_status: string | null
          product_name: string | null
          rebooking_type: string | null
          reschedule_count: number | null
          reschedule_url: string | null
          rescheduled_to_appointment_id: string | null
          retarget_date: string | null
          retarget_reason: string | null
          revenue: number | null
          setter_id: string | null
          setter_name: string | null
          setter_notes: string | null
          start_at_utc: string
          status: Database["public"]["Enums"]["appointment_status"]
          team_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_creator: { Args: { _user_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      recalculate_team_commissions: {
        Args: {
          p_closer_percentage: number
          p_setter_percentage: number
          p_team_id: string
        }
        Returns: {
          error_message: string
          updated_count: number
        }[]
      }
      validate_creator_code: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      appointment_status:
        | "NEW"
        | "SHOWED"
        | "NO_SHOW"
        | "CANCELLED"
        | "CLOSED"
        | "RESCHEDULED"
        | "CONFIRMED"
      global_role: "super_admin" | "member" | "creator"
      task_type: "call_confirmation" | "follow_up" | "reschedule"
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
      appointment_status: [
        "NEW",
        "SHOWED",
        "NO_SHOW",
        "CANCELLED",
        "CLOSED",
        "RESCHEDULED",
        "CONFIRMED",
      ],
      global_role: ["super_admin", "member", "creator"],
      task_type: ["call_confirmation", "follow_up", "reschedule"],
    },
  },
} as const
