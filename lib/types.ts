export type ReportCategory =
  | "jalan_rusak"
  | "sampah"
  | "banjir"
  | "fasilitas_umum"
  | "lainnya";

export type ReportStatus = "dilaporkan" | "diproses" | "selesai";

export type UserRole = "user" | "admin";

export interface Report {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  category: ReportCategory;
  photo_url?: string | null;
  photo_after_url?: string | null;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  vote_count: number;
  created_at: string;
}
