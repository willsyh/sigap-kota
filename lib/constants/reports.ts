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
  "selesai",
] as const satisfies readonly ReportStatus[];
