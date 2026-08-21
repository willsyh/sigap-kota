# Product Requirements Document (PRD) — SigapKota

**Versi**: 1.0
**Untuk**: Website Design and Development Competition — Technova Dies Natalis HIMTIF Universitas Pamulang 2026
**Tema lomba**: "Innovative Web Solutions"

---

## 1. Ringkasan Produk

**SigapKota** adalah platform pelaporan masalah fasilitas umum dan lingkungan perkotaan (jalan rusak, sampah menumpuk, lampu jalan mati, banjir, kerusakan fasilitas umum) berbasis peta interaktif. Warga bisa melaporkan masalah secara langsung dari lokasi kejadian, memvalidasi laporan warga lain lewat sistem vote, dan memantau status penanganan secara transparan — dari dilaporkan sampai selesai ditangani.

### Masalah yang diselesaikan
Masalah infrastruktur kota sering tidak tersampaikan ke pihak yang berwenang secara terstruktur — warga mengeluh di media sosial atau grup WhatsApp, tapi laporan itu tidak pernah sampai ke satu tempat yang bisa dipantau bersama. SigapKota menyatukan laporan warga dalam satu peta yang transparan, sehingga masalah yang sama tidak dilaporkan berulang-ulang tanpa progres yang jelas.

### Target pengguna
- **Warga** — pelapor masalah, bisa lihat peta dan vote laporan tanpa perlu akun (guest browsing), perlu akun untuk lapor/vote.
- **Admin/petugas** — pihak yang menindaklanjuti laporan, mengubah status penanganan.

---

## 2. Tujuan Produk (untuk konteks lomba)

1. Menunjukkan solusi teknologi yang **fungsional dan nyata dipakai**, bukan sekadar mockup.
2. Menonjol dari kompetitor lain lewat 1–2 fitur diferensiasi yang jelas manfaatnya, bukan fitur tempelan.
3. Bisa didemokan mulus dalam 10 menit presentasi + sesi tanya jawab.
4. Dibangun 100% dengan layanan gratis (tanpa biaya berlangganan sama sekali).

---

## 3. Fitur — MVP (Wajib, Prioritas Utama)

Semua fitur di bawah ini **harus** selesai dan stabil sebelum tim menyentuh fitur gimmick di bagian 4.

### 3.1 Autentikasi
- Registrasi & login pakai email/password (Supabase Auth).
- Guest browsing: user tanpa akun tetap bisa lihat peta dan daftar laporan, tapi harus login untuk membuat laporan atau vote.

### 3.2 Buat Laporan
- Form input: judul, deskripsi, kategori (jalan rusak / sampah / banjir / fasilitas umum / lainnya), 1 foto, lokasi.
- Lokasi diambil dari browser Geolocation API (dengan izin user), dengan fallback wajib berupa pin manual yang bisa digeser di peta — user selalu bisa koreksi lokasi meski GPS terdeteksi otomatis.

### 3.3 Peta Interaktif
- Menampilkan seluruh laporan sebagai marker berwarna sesuai status (abu-abu = dilaporkan, oranye = diproses, hijau = selesai).
- Filter berdasarkan kategori dan status.
- Klik marker menampilkan preview singkat (foto, judul, kategori, status, jumlah vote).

### 3.4 Halaman Detail Laporan
- Foto, judul, kategori, status, lokasi, deskripsi lengkap.
- Tombol vote/dukung (1 user hanya bisa vote 1x per laporan).
- Riwayat perubahan status (activity log sederhana).

### 3.5 Tracking Status
- 3 status baku: **Dilaporkan → Diproses → Selesai**. Tidak ada status tambahan di luar ini.

### 3.6 Panel Admin
- Halaman terpisah, dilindungi (hanya bisa diakses role admin).
- Dipecah menjadi 3 sub-halaman agar tidak tumpang tindih:
  - **Overview**: ringkasan statistik (total laporan, per status) + chart kategori + daftar laporan terbaru.
  - **All Reports**: tabel penuh seluruh laporan, bisa dicari/difilter, admin bisa update status per laporan.
  - **Analytics**: chart lebih mendalam — tren laporan dari waktu ke waktu, waktu penyelesaian rata-rata per kategori, distribusi status.

---

## 4. Fitur Diferensiasi (Gimmick) — Prioritas Sesuai Waktu Tersedia

Dikerjakan setelah MVP stabil, urutan sesuai daftar (nomor kecil dikerjakan lebih dulu).

### 4.1 Heatmap Kepadatan Laporan
Toggle di peta untuk beralih dari tampilan marker ke tampilan heatmap, menunjukkan area dengan konsentrasi masalah tertinggi. Effort rendah, dampak visual tinggi saat demo.

### 4.2 Deteksi Laporan Duplikat
Saat user membuat laporan baru, sistem otomatis mengecek apakah ada laporan lain dengan kategori sama dalam radius ±100 meter (pakai perhitungan jarak Haversine di database). Jika ada, user ditawari untuk vote laporan yang sudah ada, bukan membuat laporan baru yang duplikat.

### 4.3 Before/After Slider
Untuk laporan berstatus "Selesai", admin bisa upload foto kondisi setelah diperbaiki. Ditampilkan sebagai slider perbandingan foto sebelum vs sesudah di halaman detail laporan — memberi bukti visual dampak nyata platform.

### 4.4 AI Insight Summary
Setelah laporan serupa terkumpul di satu area, sistem mengirim ringkasan data (jumlah laporan, kategori, rentang waktu) ke Gemini API untuk menghasilkan satu-dua kalimat insight berbahasa natural, contoh: *"Area ini memiliki 6 laporan jalan rusak dalam 2 minggu terakhir, meningkat dibanding rata-rata sebelumnya."* Ini murni meringkas data yang sudah ada, bukan analisis prediktif kompleks.

### 4.5 Offline-First PWA (Opsional, Stretch Goal)
Laporan tetap bisa dibuat tanpa koneksi internet, tersimpan sementara di perangkat (IndexedDB), lalu otomatis terkirim ke server begitu koneksi kembali tersedia (Background Sync API). Fitur paling kompleks secara teknis — dikerjakan terakhir dan hanya jika waktu masih memungkinkan.

**Catatan penting**: semua fitur AI (4.4, dan opsional verifikasi foto) harus *fail gracefully* — kalau API AI gagal atau lambat, fitur inti (submit laporan, lihat peta, vote) harus tetap berjalan normal tanpa terganggu.

---

## 5. Yang SENGAJA Tidak Termasuk (Out of Scope)

Supaya tim tidak menambah fitur di luar rencana saat development:

- Tidak ada sistem role/permission bertingkat — hanya 2 peran: warga dan admin.
- Tidak ada fitur export data (PDF/Excel) dari panel admin.
- Tidak ada verifikasi GPS otomatis yang diklaim "terverifikasi" tanpa mekanisme jelas di baliknya.
- Tidak ada konsep SLA/deadline formal penanganan laporan — status hanya 3 tahap sederhana.
- Tidak menggunakan Google Maps API atau layanan peta berbayar — wajib berbasis OpenStreetMap.
- Tidak membangun backend terpisah (Express/NestJS dll) — cukup Next.js API routes + Supabase.
- Tidak menambahkan fitur baru di luar daftar bagian 3 dan 4 tanpa persetujuan tim terlebih dahulu.

---

## 6. Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Database, Auth, Storage | Supabase (free tier) |
| Peta | MapLibre GL JS / Leaflet + OpenStreetMap |
| Geocoding | Nominatim (OSM) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Google Gemini API (Google AI Studio) |
| Offline storage | IndexedDB (`idb`/`Dexie.js`) + next-pwa |
| Deploy | Vercel (free tier) |

Semua layanan di atas gratis tanpa kartu kredit. Detail arsitektur, skema database, dan struktur folder lengkap ada di dokumen `SigapKota_Project_Guide.md`.

---

## 7. Definisi "Selesai" (Definition of Done untuk Demo)

Aplikasi dianggap siap didemokan ke juri kalau:
- User bisa daftar/login, buat laporan lengkap dengan foto + lokasi.
- Laporan langsung muncul di peta dengan marker sesuai kategori & status.
- User lain bisa vote laporan yang sudah ada.
- Admin bisa mengubah status dan perubahannya langsung terlihat di sisi user.
- Minimal 1 fitur dari bagian 4 (gimmick) berfungsi dan bisa didemokan lancar.
- Sudah live di Vercel dengan URL publik, repo GitHub rapi dengan README jelas.

---

## 8. Referensi Dokumen Lain

Dokumen ini adalah ringkasan fitur. Untuk detail lebih dalam, cek:
- **`SigapKota_Project_Guide.md`** — arsitektur teknis, skema database, struktur folder, scope guardrails lengkap.
- **`SigapKota_Stitch_Prompt.md`** — prompt desain UI untuk 8 halaman (design system + tiap screen).
- **`SigapKota_Rencana_Kerja_7_Hari.md`** — pembagian tugas harian untuk skenario tim 2/3/4 orang.
