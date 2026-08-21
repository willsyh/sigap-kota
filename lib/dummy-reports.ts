import type { Report, ReportCategory, ReportStatus } from "@/lib/types";

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
  selesai: "Selesai",
};

export const STATUS_BADGE_VARIANTS: Record<
  ReportStatus,
  "destructive" | "default" | "secondary"
> = {
  dilaporkan: "destructive",
  diproses: "default",
  selesai: "secondary",
};

export const DUMMY_REPORTS: Report[] = [
  {
    id: "rep-001",
    title: "Jalan Berlubang Parah di Jl. Raya Puspitek",
    description:
      "Lubang diameter 50cm dengan kedalaman 10cm sangat membahayakan pengendara motor saat malam hari.",
    category: "jalan_rusak",
    photo_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3485,
    longitude: 106.7412,
    status: "dilaporkan",
    vote_count: 14,
    created_at: "2026-08-20T08:30:00Z",
  },
  {
    id: "rep-002",
    title: "Sampah Menumpuk Dekat Bundaran Pamulang",
    description:
      "Tumpukan sampah liar menimbulkan bau menyengat dan mengganggu pejalan kaki.",
    category: "sampah",
    photo_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3421,
    longitude: 106.7365,
    status: "diproses",
    vote_count: 28,
    created_at: "2026-08-19T14:15:00Z",
  },
  {
    id: "rep-003",
    title: "Genangan Banjir di Depan Kampus Unpam Utama",
    description:
      "Drainase tersumbat menyebabkan air menggenang setinggi 30cm setiap hujan deras.",
    category: "banjir",
    photo_url:
      "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3458,
    longitude: 106.7394,
    status: "dilaporkan",
    vote_count: 42,
    created_at: "2026-08-21T06:00:00Z",
  },
  {
    id: "rep-004",
    title: "Lampu Penerangan Jalan Mati di Jl. Pajajaran",
    description:
      "Tiga tiang PJU padam sejak 3 hari lalu, area sangat gelap di malam hari.",
    category: "fasilitas_umum",
    photo_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3398,
    longitude: 106.7451,
    status: "selesai",
    photo_after_url:
      "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80",
    vote_count: 19,
    created_at: "2026-08-15T19:20:00Z",
  },
  {
    id: "rep-005",
    title: "Tutup Manhole Saluran Air Rusak",
    description:
      "Tutup beton pecah dan terbuka di trotoar, rawan membuat pejalan kaki terperosok.",
    category: "fasilitas_umum",
    photo_url:
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3512,
    longitude: 106.7328,
    status: "diproses",
    vote_count: 9,
    created_at: "2026-08-21T11:00:00Z",
  },
  {
    id: "rep-006",
    title: "Pohon Tumbang Menghalangi Sebagian Badan Jalan",
    description:
      "Dahan besar patah setelah angin kencang, menghambat lalu lintas dari arah Ciputat.",
    category: "lainnya",
    photo_url:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3364,
    longitude: 106.7489,
    status: "selesai",
    vote_count: 31,
    created_at: "2026-08-17T16:45:00Z",
  },
];
