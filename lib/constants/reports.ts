import type { ReportCategory, ReportStatus } from "@/lib/types";

export const REPORT_CATEGORIES = [
  "jalan_rusak",
  "sampah",
  "banjir",
  "fasilitas_umum",
  "lainnya",
] as const satisfies readonly ReportCategory[];

export const REPORT_STATUSES = [
  "dilaporkan",
  "diproses",
  "menunggu_konfirmasi",
  "selesai",
] as const satisfies readonly ReportStatus[];

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  jalan_rusak: "Jalan Rusak",
  sampah: "Sampah Menumpuk",
  banjir: "Banjir / Genangan",
  fasilitas_umum: "Fasilitas Umum",
  lainnya: "Lainnya",
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  jalan_rusak: "#e11d48", // red
  sampah: "#d97706", // amber
  banjir: "#2563eb", // blue
  fasilitas_umum: "#059669", // emerald
  lainnya: "#7c3aed", // violet
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  dilaporkan: "Dilaporkan",
  diproses: "Diproses",
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  selesai: "Selesai",
};

export const STATUS_BADGE_VARIANTS: Record<
  ReportStatus,
  "destructive" | "default" | "secondary" | "outline"
> = {
  dilaporkan: "destructive",
  diproses: "default",
  menunggu_konfirmasi: "outline",
  selesai: "secondary",
};
