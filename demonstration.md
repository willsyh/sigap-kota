# SigapKota — Panduan Demonstrasi Lengkap

Dokumen ini adalah naskah demonstrasi (demo script) untuk mempresentasikan
SigapKota secara penuh, langkah demi langkah, dalam waktu sekitar 10 menit.

---

## 1. Persiapan Sebelum Demo

### 1.1 Prasyarat Teknis

- Aplikasi sudah berjalan: `npm run dev` (lokal) atau URL produksi Vercel.
- Supabase sudah terhubung dan **data seed sudah dimuat** (lihat `supabase/seed.sql`).
- Browser: Chrome/Edge (disarankan) dengan izin lokasi aktif.
- Dua jendela/dua profil browser disiapkan:
  - **Jendela A** — untuk alur warga (guest → login warga).
  - **Jendela B** — untuk alur admin (login admin).
- (Opsional) `GEMINI_API_KEY` terisi untuk demo verifikasi AI foto.

### 1.2 Akun Demo

Semua akun menggunakan kata sandi `sigap123`.

| Akun | Email | Peran | Kegunaan |
| --- | --- | --- | --- |
| Admin | `admin@sigapkota.id` | Admin | Kelola laporan, ubah status, unggah foto bukti |
| Warga 1 | `warga1@sigapkota.id` | User | Membuat laporan, voting, konfirmasi selesai |
| Warga 2–5 | `warga2@sigapkota.id` … `warga5@sigapkota.id` | User | Voting tambahan (opsional) |

### 1.3 Data Seed yang Berguna untuk Demo

Seed berisi **50 laporan, 100 persepsi, dan 6 hotspot** di area Pamulang,
Tangerang Selatan. Dua pasang laporan sengaja dibuat berdekatan (<100 m,
kategori sama) untuk demo deteksi duplikat:

| Pasangan | Lokasi | Kategori | Koordinat |
| --- | --- | --- | --- |
| Pasar Pamulang | "Sampah menumpuk di belakang Pasar Lama" | `sampah` | -6.342750, 106.738100 |
| | "TPS liar di pinggir Jl. Raya Pamulang" | `sampah` | -6.343200, 106.737650 |
| Terminal | "Lubang besar di Jl. Raya dekat Terminal" | `jalan_rusak` | -6.348600, 106.736050 |
| | "Aspal amortisasi di jalur keluar terminal" | `jalan_rusak` | -6.349000, 106.736500 |

> Catatan: deteksi duplikat sudah siap di sisi backend (fungsi SQL
> `nearby_reports` + API `/api/laporan/check-duplicate`), tetapi **belum
> terhubung ke formulir laporan di UI**. Jangan jadikan deteksi duplikat
> sebagai bagian wajib demo sampai integrasi UI selesai. Lihat bagian 7.

### 1.4 Checklist Cepat

- [ ] Aplikasi berjalan dan bisa dibuka.
- [ ] Data seed terlihat di peta (ada pin di area Pamulang).
- [ ] Login admin berhasil di Jendela B.
- [ ] Login warga berhasil di Jendela A.
- [ ] Izin lokasi browser siap (atau rencana fallback manual pin).

---

## 2. Alur Demo Utama (±10 Menit)

### Bagian A — Eksplorasi Publik / Guest (2 menit)

**Tujuan:** menunjukkan bahwa siapa pun bisa melihat laporan tanpa login.

1. Buka halaman beranda `/`.
   - Jelaskan hero: "SigapKota — laporkan masalah fasilitas umum di kotamu".
   - Tunjukkan statistik langsung (jumlah laporan, kategori, status).
   - Tunjukkan umpan laporan terbaru di bawah hero.
2. Klik **Peta** (navbar) → halaman `/peta`.
   - Peta interaktif Leaflet + OpenStreetMap, pusat di Pamulang, zoom 13.
   - Pin-pin laporan tampil dengan warna sesuai kategori.
3. Toggle mode tampilan:
   - **Pin** — titik laporan.
   - **Heatmap** — konsentrasi laporan (klik titik padat untuk melihat laporan).
   - **Lapisan Persepsi** (toggle di panel Filter) — persepsi warga tentang
     suasana di setiap titik; bisa diatur rentang 7/30 hari.
4. Gunakan pencarian: ketik judul/kategori → dropdown hasil langsung.
5. Klik salah satu pin → kartu pratinjau → buka detail laporan.
6. Kembali, buka **Laporan** → `/laporan`.
   - Daftar laporan dengan pencarian, filter kategori, dan filter status.
   - Jelaskan strip transparansi (jumlah laporan per status).

**Poin bicara:** "Warga bisa memantau laporan secara transparan tanpa harus
login — tidak seperti keluhan di media sosial atau grup WhatsApp yang
mudah tenggelam."

### Bagian B — Alur Warga: Membuat Laporan (3 menit)

**Tujuan:** menunjukkan alur inti pelaporan dari awal sampai laporan tampil.

1. Di Jendela A, klik **Masuk** → `/auth/login`.
   - Login dengan `warga1@sigapkota.id` / `sigap123`.
2. Klik **Lapor** (tombol utama) → `/laporan/baru`.
3. Isi formulir:
   - **Foto** — pilih satu foto (opsional; tanpa foto juga valid).
   - **Kategori** — pilih mis. `Jalan Rusak`.
   - **Judul & Deskripsi** — isi singkat dan jelas.
4. **Lokasi**:
   - Klik "gunakan lokasi saya" → browser meminta izin geolokasi.
   - Jika diizinkan, peta berpusat di posisi pengguna.
   - Geser pin untuk mengoreksi posisi (manual pin fallback).
   - Jika izin ditolak, langsung pilih titik di peta secara manual.
5. Kirim laporan.
   - Laporan tersimpan dengan status `dilaporkan`.
   - (Opsional) Verifikasi AI foto-vs-teks berjalan di latar belakang;
     hasilnya tampil di halaman admin sebagai `ai_verdict`.
6. Buka detail laporan yang baru dibuat → muncul di peta dan daftar.

**Poin bicara:** "Lokasi diambil dari GPS browser, bukan dari EXIF foto,
jadi tetap akurat meski foto diambil dari sumber lain. Pengguna bisa
mengoreksi pin secara manual."

### Bagian C — Voting & Validasi Komunitas (1 menit)

**Tujuan:** menunjukkan mekanisme satu-pengguna-satu-suara.

1. Di detail laporan, klik tombol **Dukung** (vote).
   - Jumlah dukungan bertambah.
2. Klik lagi → tombol nonaktif (sudah memilih).
   - Dijamin oleh constraint unik `(report_id, user_id)` di database.
3. (Opsional) Login `warga2@sigapkota.id` di jendela lain → vote laporan yang
   sama → jumlah dukungan bertambah lagi.

**Poin bicara:** "Setiap akun hanya bisa memberi satu dukungan per laporan —
dipaksa di level database, bukan sekadar disembunyikan di UI."

### Bagian D — Alur Admin / Petugas (3 menit)

**Tujuan:** menunjukkan pengelolaan laporan dan alur status.

1. Di Jendela B, buka `/auth/login` → login `admin@sigapkota.id` / `sigap123`.
   - Navbar menampilkan menu **Admin**.
2. Buka **Admin** → Dashboard `/admin`.
   - Statistik ringkasan, distribusi kategori, dan tautan cepat.
3. Buka **Manajemen Laporan** → `/admin/laporan`.
   - Daftar semua laporan dengan filter kategori/status.
   - Cari laporan yang baru dibuat warga (Bagian B).
4. Ubah status laporan:
   - `dilaporkan` → **Diproses**.
   - **Unggah foto bukti** (foto "sesudah") → status menjadi
     `menunggu_konfirmasi`.
5. Kembali ke Jendela A (warga) → buka detail laporan.
   - Status timeline menampilkan riwayat: Dilaporkan → Diproses →
     Menunggu Konfirmasi.
   - **Slider Before/After** membandingkan foto awal vs foto bukti.
   - Warga klik **Konfirmasi Selesai** → status menjadi `selesai`.
6. (Opsional) Buka **Log Aktivitas** → `/admin/log` untuk menunjukkan jejak
   audit setiap perubahan status.
7. (Opsional) Buka **Persepsi Warga** → `/admin/persepsi` untuk analisis
   sentimen persepsi (nyaman/biasa/tidak nyaman).

**Poin bicara:** "Alur statusnya transparan dan bisa diaudit: setiap
perubahan tercatat di log aktivitas. Warga ikut mengonfirmasi bahwa masalah
benar-benar sudah selesai."

### Bagian E — Fitur Bonus (1 menit, pilih sesuai waktu)

- **Mode Offline:** matikan jaringan → buat laporan → laporan tersimpan di
  IndexedDB (outbox) → nyalakan jaringan → laporan otomatis terkirim
  (toast "laporan offline berhasil terkirim").
- **Ekspor CSV:** di Manajemen Laporan admin, unduh data laporan sebagai CSV.
- **Registrasi:** tunjukkan `/auth/register` untuk akun baru.
- **Panduan:** buka `/panduan` untuk dokumentasi penggunaan.

---

## 3. Fitur Kunci & Cara Kerja

Bagian ini menjelaskan setiap fitur kunci: **di mana fitur itu berada**
(lokasi/konteks di aplikasi) dan **bagaimana cara kerjanya** secara teknis.
Gunakan bagian ini untuk menjawab pertanyaan juri secara mendalam.

### 3.1 Peta Interaktif (Leaflet + OpenStreetMap)

- **Lokasi:** halaman `/peta`, komponen `components/MapView/`.
- **Cara kerja:**
  - Peta dirender dengan Leaflet menggunakan tile gratis OpenStreetMap
    (tanpa API key berbayar).
  - Data laporan diambil dari Supabase (React Query) dan dirender sebagai
    marker berwarna sesuai kategori.
  - Tiga mode tampilan: **Pin** (titik), **Heatmap** (konsentrasi via
    plugin `leaflet.heat`), dan **Lapisan Persepsi** (sentimen warga).
  - Pencarian live dengan dropdown hasil + filter kategori/status.
  - Klik pin → kartu pratinjau → buka halaman detail.
- **Poin presentasi:** visualisasi masalah kota secara real-time dan gratis.

### 3.2 Pelaporan dengan Geolokasi

- **Lokasi:** `/laporan/baru` (`components/reports/ReportForm.tsx`),
  API `POST /api/laporan`.
- **Cara kerja:**
  - Browser Geolocation API diminta → peta berpusat di posisi pengguna.
  - Pin bisa digeser manual untuk koreksi (fallback jika izin ditolak).
  - Koordinat final (latitude/longitude) dikirim bersama laporan.
  - Foto (opsional, maks. 5MB, JPEG/PNG/WebP) diunggah ke Supabase
    Storage bucket `report-photos`.
  - Validasi dilakukan server-side (judul wajib, kategori valid, koordinat
    valid, format/ukuran foto).
  - Lokasi **tidak** diambil dari EXIF foto — sesuai aturan produk.
- **Poin presentasi:** akurasi lokasi dari GPS + koreksi manual, bukan EXIF.

### 3.3 Voting Satu-Pengguna-Satu-Suara

- **Lokasi:** detail laporan `/laporan/[id]`, tabel `votes`.
- **Cara kerja:**
  - Constraint unik `(report_id, user_id)` di database memastikan satu
    akun hanya satu vote per laporan.
  - Fungsi `increment_vote` memperbarui `vote_count` secara atomik.
  - RLS membatasi: hanya user login yang bisa membuat vote.
  - UI menonaktifkan tombol setelah user memilih.
- **Poin presentasi:** validasi di level database, bukan sekadar
  disembunyikan di UI.

### 3.4 Alur Status Transparan (4 Tahap)

- **Lokasi:** detail laporan (timeline status), admin `/admin/laporan`,
  kolom `status` di tabel `reports`.
- **Cara kerja:**
  - Alur: `dilaporkan → diproses → menunggu_konfirmasi → selesai`.
  - Admin mengubah status dan dapat mengunggah foto bukti penyelesaian.
  - Warga mengonfirmasi bahwa masalah sudah selesai.
  - Setiap perubahan status tercatat di tabel log aktivitas (audit trail).
- **Poin presentasi:** transparansi penuh — warga bisa memantau progres
  laporannya sampai tuntas.

### 3.5 Before/After Slider

- **Lokasi:** detail laporan `/laporan/[id]`.
- **Cara kerja:**
  - Foto awal (`photo_url`) dibandingkan dengan foto bukti
    (`photo_after_url`) yang diunggah admin.
  - Slider interaktif membandingkan dua gambar secara langsung.
- **Poin presentasi:** bukti visual bahwa masalah benar-benar diselesaikan.

### 3.6 Heatmap

- **Lokasi:** `/peta`, mode **Heatmap**.
- **Cara kerja:**
  - Plugin `leaflet.heat` merender intensitas laporan per area.
  - Area dengan banyak laporan tampil lebih "panas".
  - Klik titik padat untuk melihat laporan di area tersebut.
- **Poin presentasi:** memetakan konsentrasi masalah kota secara cepat.

### 3.7 Lapisan Persepsi Warga

- **Lokasi:** `/peta` (toggle "Lapisan Persepsi"), `/admin/persepsi`,
  API `/api/persepsi?days=7|30`.
- **Cara kerja:**
  - Warga mengirim persepsi suasana per laporan
    (`nyaman` / `biasa` / `tidak_nyaman`).
  - Peta menampilkan titik berwarna sesuai sentimen; rentang waktu bisa
    diatur 7 atau 30 hari.
  - Admin melihat analisis agregat persepsi di `/admin/persepsi`.
- **Poin presentasi:** umpan balik komunitas yang melengkapi data laporan.

### 3.8 Deteksi Duplikat

- **Lokasi:** backend — fungsi SQL `nearby_reports` (schema.sql) dan API
  `/api/laporan/check-duplicate`.
- **Cara kerja:**
  - Mencari laporan aktif (status ≠ `selesai`) dengan **kategori sama**
    dalam radius ±100 meter.
  - Hasil diurutkan berdasarkan jarak, maksimal 3 kandidat.
  - Jika ada kandidat: jelaskan bahwa laporan serupa sudah ada, tampilkan
    pratinjau, izinkan user untuk mendukung laporan tersebut ATAU tetap
    membuat laporan baru.
  - Deteksi tidak menjadi penghalang jika query/API gagal.
- **Status:** backend siap; integrasi UI pada formulir belum terhubung.
- **Poin presentasi:** mengurangi laporan ganda dan memperkuat validasi
  komunitas.

### 3.9 Mode Offline (Offline-First)

- **Lokasi:** `lib/offline/` (IndexedDB + sinkronisasi), service worker.
- **Cara kerja:**
  - Saat offline, laporan disimpan di IndexedDB (outbox) termasuk foto
    sebagai blob.
  - Saat koneksi kembali, `syncOfflineReports` mengirim laporan otomatis
    via `POST /api/laporan` dan menghapusnya dari antrean.
  - Laporan yang gagal dicoba ulang (dengan `retryCount` dan pesan error).
  - Tile peta di-cache oleh service worker agar peta tetap bisa dibuka.
- **Poin presentasi:** warga tetap bisa melapor meski tanpa jaringan.

### 3.10 Verifikasi AI Foto (Opsional)

- **Lokasi:** `lib/ai/verify-photo.ts`, kolom `ai_verdict`/`ai_reason`,
  ditampilkan di halaman admin.
- **Cara kerja:**
  - Gemini membandingkan foto dengan judul/deskripsi laporan.
  - Verifikasi berjalan di latar belakang (`after()` di Next.js) setelah
    laporan tersimpan — tidak memblokir pengiriman.
  - Jika gagal/tidak ada foto, verdict tetap `unsure` (nilai default).
- **Poin presentasi:** AI sebagai pelengkap yang gagal secara aman, bukan
  penghambat alur inti.

### 3.11 Dashboard & Manajemen Admin

- **Lokasi:** `/admin` (dashboard), `/admin/laporan` (manajemen),
  `/admin/persepsi` (analisis), `/admin/log` (log aktivitas).
- **Cara kerja:**
  - Dashboard: statistik ringkas + distribusi kategori.
  - Manajemen laporan: filter kategori/status, ubah status, unggah foto
    bukti, hapus laporan, ekspor CSV.
  - Log aktivitas: jejak audit setiap perubahan.
  - Akses dibatasi role `admin` dan diverifikasi server-side.
- **Poin presentasi:** kontrol penuh petugas dengan jejak audit.

### 3.12 Keamanan & Arsitektur

- **Lokasi:** seluruh aplikasi.
- **Cara kerja:**
  - RLS (Row Level Security) di Supabase: user hanya bisa membuat
    laporan/vote miliknya; admin yang bisa mengubah status.
  - Secret (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) hanya di
    server-side, tidak pernah ke browser.
  - Validasi input server-side di semua API route.
  - Satu aplikasi Next.js (App Router) + Supabase — tanpa backend terpisah.
- **Poin presentasi:** aman, transparan, dan hemat biaya (free tier).

---

## 4. Naskah Singkat per Bagian (untuk dibacakan)

> **Pembukaan (30 detik):**
> "SigapKota adalah platform pelaporan masalah fasilitas umum berbasis peta.
> Warga melaporkan, komunitas memvalidasi lewat dukungan, dan petugas
> menindaklanjuti secara transparan."

> **Bagian A (2 menit):**
> "Tanpa login pun, semua orang bisa melihat peta laporan, memfilter
> berdasarkan kategori dan status, serta melihat heatmap konsentrasi masalah
> dan persepsi warga di setiap area."

> **Bagian B (3 menit):**
> "Sekarang saya login sebagai warga dan membuat laporan. Lokasi diambil dari
> GPS browser dan bisa dikoreksi manual. Setelah dikirim, laporan langsung
> tampil di peta."

> **Bagian C (1 menit):**
> "Warga lain bisa mendukung laporan. Satu akun hanya satu suara per laporan,
> dijamin langsung oleh database."

> **Bagian D (3 menit):**
> "Di sisi petugas, admin melihat semua laporan, mengubah status, dan
> mengunggah foto bukti penyelesaian. Warga lalu mengonfirmasi, dan status
> menjadi selesai. Semua perubahan tercatat di log aktivitas."

> **Penutup (30 detik):**
> "SigapKota menjawab masalah keluhan yang tersebar di media sosial: semua
> laporan terpusat, transparan, dan bisa dipantau sampai tuntas."

---

## 5. Rencana Cadangan (Fallback)

| Skenario | Solusi |
| --- | --- |
| Izin geolokasi ditolak | Gunakan manual pin: langsung klik peta untuk menempatkan lokasi. |
| Deteksi duplikat belum muncul | Lewati; jelaskan bahwa backend sudah siap (fungsi `nearby_reports` + API) dan integrasi UI menyusul. |
| Jaringan lambat/gagal | Demo mode offline: buat laporan tanpa jaringan → tersimpan lokal → auto-sync saat online. |
| Data seed tidak tampil | Jalankan ulang `supabase/seed.sql`; pastikan RLS tidak memblokir SELECT publik. |
| Foto tidak terunggah | Laporan tetap valid tanpa foto (kolom `photo_url` nullable). |
| Verifikasi AI gagal | Aman: verdict tetap `unsure`, tidak memblokir laporan. |
| Lupa kata sandi | Semua akun demo memakai `sigap123`. |

---

## 6. Troubleshooting

- **Peta kosong / tile tidak muncul:** periksa koneksi internet (tile
  OpenStreetMap); pastikan tidak ada ad-blocker yang memblokir tile server.
- **Login gagal:** pastikan Supabase Auth aktif dan email terverifikasi
  (akun seed dibuat langsung via admin API, bukan email confirmation).
- **Vote tidak bertambah:** cek apakah akun sudah pernah vote laporan itu
  (constraint `(report_id, user_id)`).
- **Foto tidak tampil:** pastikan bucket storage `report-photos` ada dan
  publik (lihat `schema.sql`).
- **Status tidak bisa diubah:** pastikan login sebagai admin (role
  `admin` di `user_metadata`), bukan warga.

---

## 7. Status Fitur (untuk Referensi Tim)

| Fitur | Status | Keterangan |
| --- | --- | --- |
| Peta interaktif (Pin/Heatmap/Persepsi) | Selesai | `/peta` |
| Daftar laporan + filter | Selesai | `/laporan` |
| Buat laporan (foto, GPS, pin manual) | Selesai | `/laporan/baru` |
| Voting satu-pengguna-satu-suara | Selesai | Constraint DB + UI |
| Alur status 4 tahap | Selesai | `dilaporkan → diproses → menunggu_konfirmasi → selesai` |
| Before/After slider | Selesai | Detail laporan |
| Dashboard & manajemen admin | Selesai | `/admin`, `/admin/laporan` |
| Log aktivitas | Selesai | `/admin/log` |
| Persepsi warga | Selesai | `/admin/persepsi` + lapisan peta |
| Mode offline (outbox + auto-sync) | Selesai | IndexedDB + service worker |
| Ekspor CSV | Selesai | Manajemen Laporan admin |
| Verifikasi AI foto (opsional) | Selesai | Butuh `GEMINI_API_KEY` |
| **Deteksi duplikat** | **Backend siap, UI belum** | Fungsi `nearby_reports` + API `/api/laporan/check-duplicate` ada; formulir belum memanggilnya |

---

## 8. Alur Demo yang Disarankan (Ringkas)

```text
Beranda → Peta (Pin → Heatmap → Persepsi) → Daftar Laporan
→ Login warga → Buat Laporan (GPS + pin manual) → Detail + Vote
→ Login admin → Ubah status → Unggah foto bukti
→ Warga konfirmasi selesai → Before/After slider
→ Log Aktivitas → (opsional) Mode Offline / Persepsi / CSV
```