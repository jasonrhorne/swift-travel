// Generated Supabase database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          preferences: Json;
          created_at: string;
          last_active_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          preferences?: Json;
          created_at?: string;
          last_active_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          preferences?: Json;
          created_at?: string;
          last_active_at?: string;
        };
      };
      itineraries: {
        Row: {
          id: string;
          user_id: string;
          destination: Json;
          persona: string;
          status: string;
          activities: Json[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination: Json;
          persona: string;
          status?: string;
          activities?: Json[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          destination?: Json;
          persona?: string;
          status?: string;
          activities?: Json[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          itinerary_id: string;
          name: string;
          description: string;
          category: string;
          timing: Json;
          location: Json;
          validation: Json;
          persona_context: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          name: string;
          description: string;
          category: string;
          timing: Json;
          location: Json;
          validation?: Json;
          persona_context?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          name?: string;
          description?: string;
          category?: string;
          timing?: Json;
          location?: Json;
          validation?: Json;
          persona_context?: Json;
          created_at?: string;
        };
      };
      itinerary_requests: {
        Row: {
          id: string;
          user_id: string;
          itinerary_id: string | null;
          requirements: Json;
          processing_log: Json[];
          status: string;
          error_details: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          itinerary_id?: string | null;
          requirements: Json;
          processing_log?: Json[];
          status?: string;
          error_details?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          itinerary_id?: string | null;
          requirements?: Json;
          processing_log?: Json[];
          status?: string;
          error_details?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      share_tokens: {
        Row: {
          id: string;
          itinerary_id: string;
          token: string;
          permissions: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          token: string;
          permissions?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          token?: string;
          permissions?: string;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      research_entries: {
        Row: {
          id: string;
          request_id: string | null;
          destination: string;
          interest: string;
          name: string;
          entry_type: string;
          description: string;
          why_recommended: string;
          estimated_cost: Json | null;
          coordinates: Json | null;
          address: string | null;
          hours: Json | null;
          sources: Json;
          google_place_id: string | null;
          validation_status: string;
          validation_details: Json;
          researched_at: string;
          validated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          destination: string;
          interest: string;
          name: string;
          entry_type: string;
          description: string;
          why_recommended: string;
          estimated_cost?: Json | null;
          coordinates?: Json | null;
          address?: string | null;
          hours?: Json | null;
          sources?: Json;
          google_place_id?: string | null;
          validation_status?: string;
          validation_details?: Json;
          researched_at?: string;
          validated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          destination?: string;
          interest?: string;
          name?: string;
          entry_type?: string;
          description?: string;
          why_recommended?: string;
          estimated_cost?: Json | null;
          coordinates?: Json | null;
          address?: string | null;
          hours?: Json | null;
          sources?: Json;
          google_place_id?: string | null;
          validation_status?: string;
          validation_details?: Json;
          researched_at?: string;
          validated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
}

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
