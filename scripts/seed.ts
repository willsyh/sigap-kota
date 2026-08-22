/**
 * Script Seeding Data Demo SigapKota
 *
 * Jalankan dengan:
 *   npx tsx scripts/seed.ts
 *
 * Pastikan environment variable sudah terisi di .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Muat variabel lingkungan dari .env.local jika ada
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const DEMO_REPORTS = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
    title: "Lampu Penerangan Jalan Mati di Jl. Pajajaran",
    description:
      "Tiga tiang PJU padam sejak 3 hari lalu, area sangat gelap di malam hari.",
    category: "fasilitas_umum",
    photo_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    photo_after_url:
      "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80",
    latitude: -6.3398,
    longitude: 106.7451,
    status: "selesai",
    vote_count: 19,
  },
  {
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
  },
  {
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
  },
];

async function seed() {
  console.log("Memulai seeding data demo ke Supabase...");

  const { data, error } = await supabase
    .from("reports")
    .insert(DEMO_REPORTS)
    .select();

  if (error) {
    console.error("Gagal melakukan seeding:", error.message);
    process.exit(1);
  }

  console.log(`Berhasil menambahkan ${data.length} laporan demo!`);
}

seed();
