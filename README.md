# SigapKota

SigapKota adalah platform pelaporan masalah fasilitas umum dan lingkungan perkotaan berbasis peta. Repository ini saat ini berada pada tahap **Project Initialization & Dependency Setup**.

Fitur bisnis seperti pembuatan laporan, voting, autentikasi, panel admin, heatmap, deteksi duplikat, integrasi Gemini, database migration, dan PWA belum diimplementasikan.

## Source of Truth

Seluruh pengembangan harus mengikuti:

- [`SigapKota_PRD.md`](./SigapKota_PRD.md)
- [`SigapKota_Project_Guide.md`](./SigapKota_Project_Guide.md)

## Tech Stack

| Area | Teknologi |
| --- | --- |
| Framework | Next.js 16.3.2 dengan App Router |
| Bahasa | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Database, Auth, Storage | Supabase |
| Data fetching | TanStack React Query |
| Peta | Leaflet, react-leaflet, OpenStreetMap |
| Icon | lucide-react |

Backend aplikasi akan menggunakan Next.js Route Handlers dan Supabase. Tidak ada backend terpisah.

## Fondasi yang Sudah Tersedia

- Next.js App Router tanpa `src/` directory dan tanpa Pages Router.
- TypeScript strict mode, ESLint, Tailwind CSS, dan alias import `@/*`.
- Komponen shadcn/ui fundamental: button, input, textarea, label, card, badge, select, dialog, dropdown menu, table, tabs, skeleton, dan Sonner.
- Supabase browser helper dan server helper yang kompatibel dengan cookie App Router.
- React Query provider pada root layout.
- Dependency Leaflet/react-leaflet, stylesheet Leaflet global, dan konstanta tile OpenStreetMap.
- Type dan constants dasar untuk kategori laporan, status laporan, dan role pengguna.
- Landing page sementara untuk memverifikasi Tailwind, shadcn/ui, dan lucide-react.
- Struktur folder route, map, dan report sebagai placeholder tanpa implementasi fitur.

## Struktur Project

```text
sigapkota/
|-- app/
|   |-- api/
|   |   |-- geocode/
|   |   `-- laporan/
|   |-- admin/
|   |-- laporan/
|   |   |-- baru/
|   |   `-- [id]/
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|   |-- map/
|   |-- providers/QueryProvider.tsx
|   |-- reports/
|   `-- ui/
|-- lib/
|   |-- constants/
|   |-- supabase/
|   |   |-- client.ts
|   |   `-- server.ts
|   |-- types.ts
|   `-- utils.ts
|-- public/
|-- .env.example
|-- SigapKota_PRD.md
`-- SigapKota_Project_Guide.md
```

Folder route yang belum memiliki `page.tsx` atau `route.ts` belum menjadi route publik dan sengaja belum berisi implementasi bisnis.

## Environment Variables

Salin template environment untuk development lokal:

```powershell
Copy-Item .env.example .env.local
```

Isi `.env.local` dengan credential yang sebenarnya:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Aturan keamanan:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dapat digunakan oleh browser.
- `SUPABASE_SERVICE_ROLE_KEY` dan `GEMINI_API_KEY` hanya boleh digunakan pada server.
- `.env.local` diabaikan oleh Git.
- Jangan memasukkan credential ke source code atau commit Git.

## Menjalankan Project

Prasyarat: Node.js 20.9 atau lebih baru dan npm.

```powershell
E:
Set-Location E:\sigapkota
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Script

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan development server dengan Turbopack |
| `npm run lint` | Menjalankan ESLint tanpa menonaktifkan rule |
| `npm run build` | Membuat production build |
| `npm run start` | Menjalankan hasil production build |

Pemeriksaan TypeScript mandiri dapat dijalankan dengan:

```powershell
npx tsc --noEmit
```

## Hasil Verifikasi Setup

- `npm run lint`: berhasil tanpa error atau warning.
- `npx tsc --noEmit`: berhasil.
- `npm run build`: berhasil; route `/` diprerender sebagai static content.
- `npm run dev`: berhasil dijalankan pada `http://localhost:3000` dan merespons HTTP 200.
- Audit dependency npm saat setup: tidak menemukan vulnerability.

## Batas Scope Tahap Ini

Dependency berikut sengaja belum dipasang karena fiturnya belum dikerjakan:

- `leaflet.heat`
- Gemini SDK
- Dexie atau `idb`
- `next-pwa`
- image comparison slider
- chart library
- library geocoding tambahan

Database schema, migration, RLS, dan storage bucket juga belum dibuat. Tahap berikutnya harus tetap merujuk pada PRD dan Project Guide.

## Catatan Arsitektur

- Gunakan Server Component sebagai default.
- Gunakan Client Component hanya untuk interaktivitas atau browser API.
- Komponen peta nantinya harus berupa Client Component dan dapat dimuat dengan dynamic import serta `ssr: false` bila diperlukan.
- Gunakan OpenStreetMap sebagai tile provider; jangan gunakan Google Maps atau layanan peta berbayar.
- Role aplikasi hanya `user` dan `admin`.
- Jangan gunakan Redux, Prisma, Firebase, backend terpisah, atau API key yang di-hardcode.
