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
 * Konsisten dengan palet aplikasi (emerald/amber/red).
 */
export const PERCEPTION_SENTIMENT_COLORS: Record<PerceptionSentiment, string> =
  {
    nyaman: "#15803d", // green
    biasa: "#d97706", // amber
    tidak_nyaman: "#dc2626", // red
  };
