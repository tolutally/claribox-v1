export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          picture_url: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          gmail_sync_enabled: boolean
          last_sync_at: string | null
          digest_enabled: boolean
          digest_time: string
          digest_timezone: string
          digest_frequency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          picture_url?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          gmail_sync_enabled?: boolean
          last_sync_at?: string | null
          digest_enabled?: boolean
          digest_time?: string
          digest_timezone?: string
          digest_frequency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          picture_url?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          gmail_sync_enabled?: boolean
          last_sync_at?: string | null
          digest_enabled?: boolean
          digest_time?: string
          digest_timezone?: string
          digest_frequency?: string
          created_at?: string
          updated_at?: string
        }
      }
      email_threads: {
        Row: {
          id: string
          user_id: string
          gmail_thread_id: string
          subject: string
          participants: string[]
          last_message_date: string
          message_count: number
          labels: string[]
          is_unread: boolean
          has_attachments: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gmail_thread_id: string
          subject: string
          participants: string[]
          last_message_date: string
          message_count: number
          labels?: string[]
          is_unread?: boolean
          has_attachments?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gmail_thread_id?: string
          subject?: string
          participants?: string[]
          last_message_date?: string
          message_count?: number
          labels?: string[]
          is_unread?: boolean
          has_attachments?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_insights: {
        Row: {
          id: string
          user_id: string
          thread_id: string
          insight_type: string
          priority_score: number
          summary: string
          key_points: string[]
          follow_up_required: boolean
          follow_up_date: string | null
          action_items: Json[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          thread_id: string
          insight_type: string
          priority_score: number
          summary: string
          key_points: string[]
          follow_up_required?: boolean
          follow_up_date?: string | null
          action_items?: Json[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          thread_id?: string
          insight_type?: string
          priority_score?: number
          summary?: string
          key_points?: string[]
          follow_up_required?: boolean
          follow_up_date?: string | null
          action_items?: Json[]
          created_at?: string
          updated_at?: string
        }
      }
      daily_digests: {
        Row: {
          id: string
          user_id: string
          digest_date: string
          total_emails: number
          high_priority_count: number
          follow_ups_due: number
          summary: string
          key_insights: Json[]
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          digest_date: string
          total_emails: number
          high_priority_count: number
          follow_ups_due: number
          summary: string
          key_insights: Json[]
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          digest_date?: string
          total_emails?: number
          high_priority_count?: number
          follow_ups_due?: number
          summary?: string
          key_insights?: Json[]
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}