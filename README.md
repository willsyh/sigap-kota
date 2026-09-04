# SigapKota — Public Problem Mapper

SigapKota adalah platform partisipatif pelaporan dan pemetaan masalah fasilitas umum serta lingkungan perkotaan berbasis peta interaktif (GIS). Platform ini menjembatani aspirasi warga dengan pemerintah kota secara transparan, akuntabel, dan berbasis data geospasial presisi.

---

## 🎯 Fitur Unggulan & Kapabilitas Sistem

- **Landing Page Interaktif (`/`)**:
  - Ringkasan statistik dan arsitektur pilar solusi.
  - Live Feed cuplikan laporan nyata terintegrasi langsung dengan database Supabase.
- **Peta Radar Masalah Interaktif (`/peta`)**:
  - Filter kategori: `jalan_rusak`, `sampah`, `banjir`, `fasilitas_umum`, `lainnya`.
  - Filter status: `dilaporkan`, `diproses`, `menunggu_konfirmasi`, `selesai`.
  - **Mode Heatmap**: Visualisasi densitas/kluster titik masalah menggunakan `leaflet.heat`.
  - **Lapisan Unseen Pulse**: Perekaman dan visualisasi sentimen kenyamanan/rasa aman warga di titik kota.
- **Pelaporan Lapangan Tangguh (Offline-First Outbox)**:
  - **Mode Offline**: Laporan tetap dapat dibuat saat kehilangan koneksi internet di lapangan.
  - Data laporan beserta file binary foto disimpan aman di **IndexedDB** lokal perangkat (`lib/offline/storage.ts`).
  - **Background Auto-Sync**: Begitu koneksi internet kembali, sistem otomatis menyinkronkan seluruh antrean laporan ke server Supabase tanpa intervensi manual.
  - **Service Worker Tile Cache**: Mencache peta OpenStreetMap agar peta tetap dapat dijelajahi saat offline.
- **Sistem Validasi Komunitas (One-User One-Vote)**:
  - Pembatasan satu suara per user per laporan via constraint database `UNIQUE(report_id, user_id)` & atomic RPC increment untuk mencegah manipulasi data.
- **Verifikasi Sebelum & Sesudah (Before/After Proofing)**:
  - Komparasi visual foto laporan awal dari warga dengan foto hasil penanganan petugas di lapangan.
  - Pelapor memverifikasi langsung penyelesaian sebelum status dikunci ke `selesai`.
- **Verifikasi Cerdas Vision AI Opsional**:
  - Integrasi multimodal AI (Google Gemini 2.0 Flash) untuk mencocokkan kesesuaian gambar foto dengan deskripsi teks laporan (anti-spam).
- **Panel Manajemen Admin (`/admin`)**:
  - Dasbor metrik statistik kota dan distribusi keluhan publik.
  - Manajemen laporan lengkap: pembaruan status, unggah foto perbaikan, mutasi data, dan audit trail log penghapusan.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Teknologi & Pustaka |
|---|---|
| **Framework** | Next.js 16.3.2 (App Router, Turbopack, React Server Components) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling & UI** | Tailwind CSS 4, shadcn/ui, Radix/Base-UI, Lucide React |
| **State & Data Fetching** | TanStack React Query v5 |
| **Map & Geospatial** | Leaflet 1.9.4, React-Leaflet 5, Leaflet.Heat, OpenStreetMap Tile Layer |
| **Offline Engine** | Browser Native IndexedDB (Zero-dep Outbox Pattern) & Service Worker Cache |
| **Backend & Database** | Supabase (PostgreSQL 15+, Row Level Security / RLS, Auth, Storage) |
| **Vision AI (Opsional)** | Google Gemini 2.0 Flash API |
| **Notifications** | Sonner Toast |
| **Deployment** | Vercel Serverless Platform |

---

## 📦 Struktur Direktori

```text
sigapkota/
├── app/
│   ├── page.tsx                    # Landing Page utama (Hero + Live Data Feed)
│   ├── peta/page.tsx               # Peta Interaktif (Pin, Heatmap, Unseen Layer)
│   ├── laporan/
│   │   ├── page.tsx                # Daftar & filter laporan publik
│   │   ├── baru/page.tsx           # Form pembuatan laporan (Online/Offline)
│   │   └── [id]/page.tsx           # Detail laporan, voting, & bukti Before/After
│   ├── admin/
│   │   ├── page.tsx                # Dasbor analitik admin
│   │   ├── laporan/page.tsx        # Manajemen status laporan & foto after
│   │   ├── log/page.tsx            # Audit log penghapusan & riwayat
│   │   └── persepsi/page.tsx       # Analitik sentimen wilayah Unseen
│   ├── api/                        # Route Handlers / API Endpoints
│   │   ├── laporan/                # REST endpoints CRUD laporan & foto-after
│   │   ├── persepsi/               # REST endpoints sentimen warga
│   │   └── admin/                  # REST endpoints audit logs
│   └── layout.tsx
├── components/
│   ├── MapView/                    # Leaflet map container, controls, & heatmap
│   ├── reports/                    # Form laporan, outbox banner, map picker
│   ├── perceptions/                # Dialog & pulse card persepsi kota
│   ├── Navbar.tsx                  # Header navigasi responsif
│   ├── BottomNav.tsx               # Bottom bar mobile navigation
│   └── ui/                         # shadcn/ui primitives
├── lib/
│   ├── offline/                    # Native IndexedDB storage & background sync engine
│   ├── ai/                         # Gemini Vision photo-to-text verification
│   ├── supabase/                   # Supabase SSR client, server, & types
│   └── constants/                  # Kategori laporan, status, & tema peta
├── public/
│   └── sw.js                       # Service Worker tile caching OpenStreetMap
├── supabase/                       # Schema SQL, migrasi, & seed data
└── .env.example
```

---

## 🚀 Panduan Menjalankan Projek

### 1. Prasyarat
- Node.js versi 20.x atau lebih baru
- npm / pnpm / yarn
- Akun Supabase (proyek gratis)

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel kredensial Supabase & AI di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key # opsional untuk verifikasi AI
```

### 3. Setup Database Supabase
Jalankan file SQL berikut secara berurutan di **Supabase Dashboard > SQL Editor**:
1. `supabase/schema.sql` (Tabel utama, RLS, storage bucket, stored procedure)
2. `supabase/migrations/002-deletion-logs.sql` (Audit log & status konfirmasi)
3. `supabase/migrations/003-perceptions.sql` (Tabel layer persepsi sentimen)
4. `supabase/migrations/004-ai-verification.sql` (Kolom hasil analisis AI)
5. `supabase/migrations/004-perceptions-photo.sql` (Kolom foto persepsi)
6. `supabase/seed.sql` *(Opsional: data awal demo)*

### 4. Instalasi & Jalankan Server Lokal
```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:3000`.

### 5. Build & Verifikasi Produksi
```bash
npm run build
npm run start
```

---

## 📱 Skenario Demonstrasi Singkat

1. **Jelajahi Beranda & Peta**:
   - Buka `/` untuk melihat narasi landing page dan data laporan terkini.
   - Masuk ke `/peta`, ubah mode tampilan ke **Heatmap** untuk melihat konsentrasi masalah kota, atau aktifkan **Unseen** untuk melihat sentimen kenyamanan wilayah.
2. **Uji Coba Lapor Offline**:
   - Buka form `/laporan/baru`.
   - Matikan koneksi internet (DevTools Network -> *Offline*).
   - Lengkapi foto, kategori, judul, dan titik lokasi GPS.
   - Klik kirim; sistem menyimpan data ke antrean lokal (IndexedDB) dengan feedback ramah.
   - Hidupkan kembali internet; sistem otomatis menyinkronkan laporan ke server secara background.
3. **Validasi Komunitas & Voting**:
   - Buka detail laporan di `/laporan/[id]` dan berikan dukungan tombol *Dukung* (One-Vote per akun).
4. **Alur Respons Petugas (Admin)**:
   - Masuk ke akun Admin di `/admin/laporan`.
   - Ubah status dari `dilaporkan` $\rightarrow$ `diproses` $\rightarrow$ unggah foto perbaikan sesudah $\rightarrow$ `menunggu_konfirmasi`/`selesai`.
   - Hasil foto Sebelum & Sesudah langsung tampil berdampingan di halaman publik detail laporan.
