export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          category: Database["public"]["Enums"]["report_category"];
          photo_url: string | null;
          photo_after_url: string | null;
          latitude: number;
          longitude: number;
          status: Database["public"]["Enums"]["report_status"];
          vote_count: number | null;
          created_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          category: Database["public"]["Enums"]["report_category"];
          photo_url?: string | null;
          photo_after_url?: string | null;
          latitude: number;
          longitude: number;
          status?: Database["public"]["Enums"]["report_status"];
          vote_count?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["report_category"];
          photo_url?: string | null;
          photo_after_url?: string | null;
          latitude?: number;
          longitude?: number;
          status?: Database["public"]["Enums"]["report_status"];
          vote_count?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          report_id: string | null;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          user_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "votes_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      status_logs: {
        Row: {
          id: string;
          report_id: string | null;
          old_status: string | null;
          new_status: string;
          changed_at: string | null;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          old_status?: string | null;
          new_status: string;
          changed_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          old_status?: string | null;
          new_status?: string;
          changed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "status_logs_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      deletion_logs: {
        Row: {
          id: string;
          report_id: string;
          deleted_by: string | null;
          role: string;
          title: string | null;
          category: string | null;
          reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          deleted_by?: string | null;
          role?: string;
          title?: string | null;
          category?: string | null;
          reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          deleted_by?: string | null;
          role?: string;
          title?: string | null;
          category?: string | null;
          reason?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    MaterializedViews: Record<string, never>;
    Functions: {
      increment_vote: {
        Args: { p_report_id: string };
        Returns: undefined;
      };
      nearby_reports: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_category: string;
          p_radius_meters?: number;
        };
        Returns: {
          id: string;
          title: string;
          vote_count: number | null;
          distance_meters: number;
          status: Database["public"]["Enums"]["report_status"];
        }[];
      };
    };
    Enums: {
      // Diimplementasikan sebagai text + CHECK constraint di Postgres.
      report_category:
        | "jalan_rusak"
        | "sampah"
        | "banjir"
        | "fasilitas_umum"
        | "lainnya";
      report_status: "dilaporkan" | "diproses" | "menunggu_konfirmasi" | "selesai";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
export type VoteRow = Database["public"]["Tables"]["votes"]["Row"];
export type StatusLogRow = Database["public"]["Tables"]["status_logs"]["Row"];
