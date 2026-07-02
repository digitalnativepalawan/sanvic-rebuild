// Hand-written Supabase database types matching supabase/migrations.
// Once a live project exists, regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: string;
          description: string;
          short_reason: string;
          latitude: number;
          longitude: number;
          barangay: string;
          address: string | null;
          image_url: string | null;
          gallery: string[] | null;
          rating: number | null;
          price_level: number | null;
          best_time: string | null;
          best_season: string | null;
          travel_minutes_from_poblacion: number | null;
          travel_note: string | null;
          booking_url: string | null;
          tags: string[];
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["places"]["Row"]> & {
          name: string;
          slug: string;
          category: string;
          latitude: number;
          longitude: number;
        };
        Update: Partial<Database["public"]["Tables"]["places"]["Row"]>;
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          place_id: string;
          context_type: string;
          title: string;
          reason: string;
          priority: number;
          weather_condition: string | null;
          time_of_day: string | null;
          audience: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recommendations"]["Row"]> & {
          place_id: string;
          context_type: string;
          title: string;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Row"]>;
        Relationships: [];
      };
      local_updates: {
        Row: {
          id: string;
          title: string;
          body: string;
          category: string;
          location: string | null;
          severity: string;
          source: string;
          image_url: string | null;
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["local_updates"]["Row"]> & {
          title: string;
          body: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["local_updates"]["Row"]>;
        Relationships: [];
      };
      saved_places: {
        Row: {
          id: string;
          user_session_id: string;
          place_id: string;
          created_at: string;
        };
        Insert: { user_session_id: string; place_id: string; id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["saved_places"]["Row"]>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_session_id: string;
          title: string;
          date: string | null;
          created_at: string;
        };
        Insert: { user_session_id: string; title: string; id?: string; date?: string | null };
        Update: Partial<Database["public"]["Tables"]["trips"]["Row"]>;
        Relationships: [];
      };
      trip_items: {
        Row: {
          id: string;
          trip_id: string;
          place_id: string;
          sort_order: number;
          note: string | null;
          planned_time: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trip_items"]["Row"]> & {
          trip_id: string;
          place_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["trip_items"]["Row"]>;
        Relationships: [];
      };
      barangays: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          latitude: number;
          longitude: number;
          label_visible: boolean;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["barangays"]["Row"]> & {
          name: string;
          slug: string;
          latitude: number;
          longitude: number;
        };
        Update: Partial<Database["public"]["Tables"]["barangays"]["Row"]>;
        Relationships: [];
      };
      barangay_boundaries: {
        Row: {
          id: string;
          barangay_id: string;
          geojson: Json;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["barangay_boundaries"]["Row"]> & {
          barangay_id: string;
          geojson: Json;
        };
        Update: Partial<Database["public"]["Tables"]["barangay_boundaries"]["Row"]>;
        Relationships: [];
      };
      tala_messages: {
        Row: {
          id: string;
          user_session_id: string;
          role: string;
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tala_messages"]["Row"]> & {
          user_session_id: string;
          role: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["tala_messages"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { id: string; display_name?: string | null; avatar_url?: string | null; bio?: string | null };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role: string; created_at: string };
        Insert: { user_id: string; role: string };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [];
      };
      pulse_posts: {
        Row: {
          id: string;
          author_id: string;
          channel: string;
          body: string;
          location: string | null;
          media_urls: string[];
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pulse_posts"]["Row"]> & {
          author_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["pulse_posts"]["Row"]>;
        Relationships: [];
      };
      pulse_comments: {
        Row: { id: string; post_id: string; author_id: string; body: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["pulse_comments"]["Row"]> & {
          post_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["pulse_comments"]["Row"]>;
        Relationships: [];
      };
      pulse_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["pulse_likes"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: { Args: { uid: string; target_role: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
