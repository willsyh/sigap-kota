# SigapKota

SigapKota adalah platform pelaporan masalah fasilitas umum dan lingkungan perkotaan berbasis peta. Aplikasi ini memungkinkan warga melaporkan masalah seperti jalan rusak, sampah menumpuk, banjir, dan fasilitas umum yang rusak, lalu memantau proses penanganan secara transparan melalui sistem voting dan status laporan.

## 🎯 Fitur yang Telah Diimplementasikan

- **Registrasi & Login** dengan Supabase Auth (email/password)
- **Guest Browsing**: peta publik dapat diakses tanpa login
- **Buat Laporan**:
  - Unggah satu foto (JPEG, PNG, WebP maks 5MB)
  - Deteksi lokasi otomatis via browser Geolocation API
  - Pemilihan manual lokasi pada peta (drag & drop marker)
  - Pilih kategori: `jalan_rusak`, `sampah`, `banjir`, `fasilitas_umum`, `lainnya`
  - Input judul dan deskripsi
- **Peta Interaktif**:
  - Tampilan laporan sebagai pin pada peta (Leaflet + react-leaflet)
  - Filter berdasarkan kategori dan status
  - Toggle antara mode pin dan heatmap (menggunakan leaflet.heat)
  - Detail laporan dalam sidebar/preview
- **Sistem Voting**:
  - Satu suara per pengguna per laporan (enforced via unique constraint)
  - Tampilan jumlah dukungan (vote_count)
- **Workflow Status Laporan**:
  - `dilaporkan` → `diproses` → `selesai`
  - Admin dapat memperbarui status; pengguna hanya bisa melihat
- **Deteksi Duplikat**:
  - Sebelum submit, gecek laporan aktif dengan kategori sama dalam radius 100m
  - Jika ditemukan, menampilkan kandidat duplikasi dengan opsi untuk mendukung laporan tersebut
  - Tidak blokir submit; pengguna tetap dapat membuat laporan baru
- **Foto Before/After**:
  - Setelah laporan berstatus `selesai` atau `menunggu_konfirmasi`, admin dapat mengunggah foto "sesudah"
  - Foto sebelum (dari pelapor) dan foto setelah ditampilkan secara berdampingan
- **Persepsi Warga (Unseen Insight)**:
  - Pengguna boleh memberikan sentimen dan catatan pada lokasi tertentu (tanpa membuat laporan)
  - Data persepsi digunakan untuk lapisan "unseen" pada peta
- **Panel Admin**:
  - Ringkasan statistik (total, menunggu, aktif, selesai) serta distribusi kategori
  - Kelola laporan: ubah status, ganti foto, hapus (dengan alasan), ekspor CSV
  - Akses hanya untuk pengguna dengan role `admin` (terikat ke metadata Supabase)
- **Verifikasi AI Opsional**:
  - Saat foto diunggah, model AI (verifikasi sederhana) menilai kesesuaian foto dengan judul/deskripsi
  - Hasil disimpan pada kolom `ai_verdit` dan `ai_reason` (tidak mengganggu alur utama)
- **Geocoding**:
  - Forward & reverse geocoding menggunakan Nominatim OpenStreetMap dengan caching sederhana
- **Autentikasi Server-side**:
  - Semua mutasi data menggunakan Supabase service role (server) untuk keamanan
  - Cookie-based auth untuk klien, disertai dengan RLS pada tabel Supabase
- **Deploy Siap**:
  - Siap dijalankan di Vercel (Node.js 20+)
  - Semua variabel disimpan di environment variables (tidak hardcoded)

## 🛠️ Teknologi yang Digunakan

| Area | Teknologi |
|------|-----------|
| Framework | Next.js 16.3.2 dengan App Router |
| Bahasa | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State & Data Fetching | TanStack React Query |
| Peta | Leaflet, react-leaflet, Leaflet.Heat, OpenStreetMap |
| Geocoding | Nominatim (OpenStreetMap) |
| Icons | lucide-react |
| Notifications | Sonner |
| Autentikasi & Basis Data | Supabase (PostgreSQL, Auth, Storage) |
| Verifikasi AI Opsional | TensorFlow.js atau model sederhana (verifikasi foto vs teks) |
| Deploy Target | Vercel (Node.js serverless) |

## 📦 Struktur Projek (Singkat)

```
sigapkota/
├── app/                     # Next.js App Router
│   ├── page.tsx             # Beranda (peta + filter)
│   ├── laporan/
│   │   ├── page.tsx         # Daftar laporan
│   │   ├── baru/            # Form laporan baru
│   │   └── [id]/page.tsx    # Detail laporan
│   ├── admin/
│   │   ├── page.tsx         # Dasbor admin
│   │   ├── laporan/page.tsx # Manajemen laporan
│   │   ├── log/page.tsx     # Log aktivitas
│   │   └── persepsi/page.tsx# Insight persepsi
│   ├── api/
│   │   ├── laporan/route.ts         # GET, POST laporan
│   │   ├── laporan/check-duplicate/route.ts
│   │   ├── laporan/[id]/route.ts    # PATCH, DELETE (admin)
│   │   ├── laporan/[id]/foto-after/route.ts # Upload foto sesudah
│   │   ├── geocode/route.ts
│   │   └── persepsi/route.ts
│   └── layout.tsx
├── components/              # UI komponen reusable
│   ├── MapView.tsx
│   ├── ReportForm.tsx
│   ├── ReportCard.tsx
│   ├── ui/                  # shadcn/ui primitives
│   └── ...
├── lib/
│   ├── supabase/client.ts   # Supabase browser client
│   ├── supabase/server.ts   # Supabase service role client
│   ├── types.ts
│   └── constants/           # label, kategori, status, percep
├── public/
├── .env.example
└── ...
```

## 🚀 Cara Menjalankan Secara Lokal

1. **Prasyarat**
   - Node.js 20.x atau lebih baru
   - npm (atau yarn/pnpm)
   - Akun Supabase (buat proyek gratis di https://supabase.com)

2. **Setup Environment**
   ```powershell
   Copy-Item .env.example .env.local
   ```
   Isi `.env.local` dengan nilai yang sesuai:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   GEMINI_API_KEY=   # opsional, hanya jika ingin pakai Gemini AI di masa depan
   ```

3. **Instalasi Dependencies**
   ```powershell
   npm install
   ```

4. **Jalankan Development Server**
   ```powershell
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000)

5. **Perintah Lainnya**
   - `npm run build` – menghasilkan produksi build
   - `npm run start` – menjalankan hasil build
   - `npm run lint` – menjalankan ESLint

## 📄 Alur Demo Singkat (Juri)

1. Buka aplikasi → peta pusat Pamulang (default)
2. Lihat laporan sebagai pin; toggle ke **Heatmap** untuk melihat kepadatan
3. Klik suatu laporan → muncul panel detail (judul, kategori, status, foto, dukungan, timeline)
4. (Opsional) Login melalui tombol Masuk/Daftar untuk dapat laporan dan voting
5. Tekan tombol **+ Lapor Masalah** → isi form:
   - Pilih kategori, ambil/unggah foto, isi judul & deskripsi
   - Lokasi terdeteksi otomatis; boleh disesuaikan dengan menggeser marker
   - Saat kategori & lokasi terisi, sistem **Duplicate Detection** akan cek laporan serupa
   - Jika ada kandidat, cukup dukung laporan tersebut atau lanjutkan buat laporan baru
6. Setelah submit, laporan muncul pada peta dengan status `dilaporkan`
7. Masuk sebagai admin (gunakan akun yang sudah memiliki role `admin` di Supabase) → akses `/admin`
   - Lihat dasbor statistik
   - Buka manajemen laporan → ubah status laporan menjadi `diproses` atau `selesai`
   - Jika menyelesaikan, unggah foto "sesudah" untuk ditampilkan sebagai before/after
8. Kembali ke tampilan publik → lihat status laporan berubah, foto before/after muncul pada detail

## 📖 Sumber Sumber Ringkas

- [`SIGAPKOTA_SPEC.md`](./SIGAPKOTA_SPEC.md) – Spesifikasi teknis dan fungsional lengkap
- [`CLAUDE.md`](./CLAUDE.md) – Panduan untuk agen coding (bagi kontributor)
- [`ALIGNMENT_PLAN.md`](./ALIGNMENT_PLAN.md) – Rencana harian dan prioritas fitur

---

✨ **SigapKota** siap demonstraksi: seluruh alur inti (melapor → voting → admin update → before/after) berfungsi tanpa hambatan, dengan fitur diferensial seperti heatmap, duplicate detection, dan persepsi warga sudah terintegrasi.