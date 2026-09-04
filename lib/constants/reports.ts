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

/**
 * Warna semantik untuk setiap status laporan.
 * - neutral: abu-abu netral (laporan baru, belum ada tindakan)
 * - amber: sedang berjalan / menunggu tindakan
 * - blue: menunggu konfirmasi warga sebelum ditutup
 * - green: selesai ditangani
 */
export type StatusColorSemantic = "neutral" | "amber" | "blue" | "green";

export type StatusBadgeVariant = "default" | "secondary" | "outline";

export interface StatusMeta {
  /** Label yang tampil di UI */
  label: string;
  /** Semantik warna status */
  color: StatusColorSemantic;
  /** Variant komponen Badge (ui/badge.tsx) */
  badgeVariant: StatusBadgeVariant;
  /** Warna hex untuk pin peta */
  mapColor: string;
  /** Kelas Tailwind untuk pill status kustom (span dengan border) */
  pillClassName: string;
  /** Kelas Tailwind untuk titik indikator di dalam pill */
  dotClassName: string;
}

/**
 * Sumber tunggal (canonical) untuk metadata status laporan.
 * Konsumen wajib memakai peta ini agar warna status konsisten di seluruh
 * aplikasi. Aturan utama: "dilaporkan" TIDAK BOLEH tampil merah/destructive.
 */
export const STATUS_META: Record<ReportStatus, StatusMeta> = {
  dilaporkan: {
    label: "Dilaporkan",
    color: "neutral",
    badgeVariant: "outline",
    mapColor: "#6f797a",
    pillClassName:
      "border-outline-variant/40 bg-surface-container text-on-surface-variant",
    dotClassName: "bg-outline",
  },
  diproses: {
    label: "Diproses",
    color: "amber",
    badgeVariant: "secondary",
    mapColor: "#d97706",
    pillClassName:
      "border-secondary/20 bg-secondary-container/20 text-on-secondary-container",
    dotClassName: "bg-secondary",
  },
  menunggu_konfirmasi: {
    label: "Menunggu Konfirmasi",
    color: "blue",
    badgeVariant: "outline",
    mapColor: "#0284c7",
    pillClassName: "border-sky-300/50 bg-sky-50 text-sky-700",
    dotClassName: "bg-sky-600",
  },
  selesai: {
    label: "Selesai",
    color: "green",
    badgeVariant: "default",
    mapColor: "#15803d",
    pillClassName: "border-tertiary/15 bg-tertiary/10 text-tertiary",
    dotClassName: "bg-tertiary",
  },
};

/** Derived dari STATUS_META agar tetap kompatibel dengan konsumen lama. */
export const STATUS_LABELS: Record<ReportStatus, string> = Object.fromEntries(
  REPORT_STATUSES.map((status) => [status, STATUS_META[status].label]),
) as Record<ReportStatus, string>;

/** Derived dari STATUS_META agar tetap kompatibel dengan konsumen lama. */
export const STATUS_BADGE_VARIANTS: Record<ReportStatus, StatusBadgeVariant> =
  Object.fromEntries(
    REPORT_STATUSES.map((status) => [status, STATUS_META[status].badgeVariant]),
  ) as Record<ReportStatus, StatusBadgeVariant>;
