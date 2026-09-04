import type {
  PerceptionReason,
  PerceptionSentiment,
} from "@/lib/supabase/types";

export const PERCEPTION_SENTIMENTS = [
  "nyaman",
  "biasa",
  "tidak_nyaman",
] as const satisfies readonly PerceptionSentiment[];

export const PERCEPTION_REASONS = [
  "kotor",
  "bising",
  "jalan_buruk",
  "ramai",
  "kurang_penerangan",
  "kurang_aman",
  "lainnya",
] as const satisfies readonly PerceptionReason[];

export interface PerceptionSentimentMeta {
  /** Label yang tampil di UI */
  label: string;
  /** Deskripsi singkat tanpa emoji */
  description: string;
}

export const PERCEPTION_SENTIMENT_LABELS: Record<
  PerceptionSentiment,
  PerceptionSentimentMeta
> = {
  nyaman: {
    label: "Nyaman",
    description: "Lingkungan terasa aman dan tertata",
  },
  biasa: {
    label: "Biasa saja",
    description: "Tidak ada keluhan khusus di lokasi ini",
  },
  tidak_nyaman: {
    label: "Tidak nyaman",
    description: "Ada masalah yang mengganggu di sekitar sini",
  },
};

export const PERCEPTION_REASON_LABELS: Record<PerceptionReason, string> = {
  kotor: "Kotor",
  bising: "Bising",
  jalan_buruk: "Jalan buruk",
  ramai: "Terlalu ramai",
  kurang_penerangan: "Kurang penerangan",
  kurang_aman: "Kurang aman",
  lainnya: "Lainnya",
};

/**
 * Warna semantik untuk setiap sentimen persepsi.
 *
 * Palet ini disengaja berbeda dari palet status laporan
 * (gray #6f797a / amber #d97706 / blue #0284c7 / green #15803d)
 * agar satu warna tidak berarti dua hal berbeda saat berpindah antar
 * mode peta (marker status vs. heatmap persepsi).
 */
export const PERCEPTION_SENTIMENT_COLORS: Record<PerceptionSentiment, string> =
  {
    nyaman: "#0d9488", // teal-600 — distinct from status green
    biasa: "#64748b", // slate-500 — distinct from status gray/amber
    tidak_nyaman: "#dc2626", // red-600 — no collision with status palette
  };
