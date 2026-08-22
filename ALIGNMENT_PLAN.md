# SigapKota — Alignment Plan

**Assessment Date:** 22 Agustus 2026

---

## Ringkasan Eksekutif

Codebase sudah **jauh lebih maju dari perkiraan awal Dev A** — hampir seluruh P0 sudah diimplementasi dan P1 Heatmap sudah selesai. Tidak ada `lib/dummy-reports.ts`, tidak ada sisa dummy data. Gap utama yang tersisa: **middleware route protection**, **P1 Duplicate Detection** (API + UI), dan **gap visual dari UI_TARGET**.

---

## Status Per Fitur

### P0 — MVP Core

| Fitur | Status | Catatan |
|---|---|---|
| Auth: Register | ✅ | `AuthForm` + Supabase signUp |
| Auth: Login | ✅ | `AuthForm` + signInWithPassword |
| Auth: Logout | ✅ | Navbar handleLogout |
| Auth: Session persistent | ✅ | `onAuthStateChange` di Navbar |
| Guest browsing | ✅ | Semua halaman public dapat diakses |
| Route protection `/laporan/baru` | ❌ | **middleware.ts tidak ada** |
| Route protection `/admin` | ❌ | **middleware.ts tidak ada** — hanya ada cek di API PATCH, bukan page level |
| Create report (form) | ✅ | `ReportForm.tsx` lengkap |
| Photo upload | ✅ | Supabase Storage, validasi MIME + ukuran |
| Geolocation auto-detect | ✅ | `navigator.geolocation` di `useEffect` |
| Manual pin fallback | ✅ | `LocationPickerMap` draggable + click-to-place |
| Report POST API | ✅ | `app/api/laporan/route.ts` |
| Report GET API (+ filter) | ✅ | Query params `kategori` + `status` |
| Map interaktif | ✅ | Leaflet + OSM tiles |
| Map marker + popup | ✅ | Color-coded by category |
| Map category/status filter | ✅ | `MapFilters.tsx` |
| Report list page | ✅ | Fetch real data, search + filter |
| Report detail page | ✅ | Real data, photo, status timeline |
| Vote (1x per user per report) | ✅ | API + unique constraint `23505` handling |
| Vote endpoint | ✅ | `app/api/laporan/[id]/vote/route.ts` |
| Status workflow 3-step | ✅ | `dilaporkan → diproses → selesai` |
| PATCH status API (admin) | ✅ | Cek `user_metadata.role === 'admin'` |
| Status activity log | ✅ | `status_logs` table + tampil di detail |
| Admin overview (stats) | ✅ | Real data dari API |
| Admin all-reports + filter | ✅ | Real data + inline status update |
| Admin analytics tab | ✅ | Timeline chart + distribusi kategori/status |
| Geocode proxy | ✅ | Nominatim dengan User-Agent header |
| DB schema | ✅ | `supabase/schema.sql` lengkap + RLS |
| `increment_vote` RPC | ✅ | Didefinisikan di schema + types |
| Seed data script | ✅ | `scripts/seed.ts` — 6 laporan realistis |
| No dummy data | ✅ | `dummy-reports.ts` tidak ada |

### P1 — Differentiators

| Fitur | Status | Catatan |
|---|---|---|
| Heatmap toggle | ✅ | `leaflet.heat` terintegrasi, toggle di `MapFilters` |
| Heatmap intensity by vote | ✅ | `0.4 + vote_count * 0.1` |
| Heatmap click → zoom → auto-switch marker | ✅ | `onSwitchToMarker` callback |
| Heatmap respek filter | ✅ | `filteredReports` dipass ke MapView |
| **Duplicate Detection API** | ❌ | **Endpoint `/api/laporan/check-duplicate` tidak ada** |
| **Duplicate Detection UI** | ❌ | **Tidak ada modal/banner di `ReportForm`** |
| **Duplicate Detection DB function** | ❌ | **Tidak ada `nearby_reports()` atau Haversine query di schema** |

### P2 — Stretch

| Fitur | Status | Catatan |
|---|---|---|
| Before/After slider | ❌ | `photo_after_url` ada di DB, tapi tidak ada slider UI |
| AI Insight (Gemini) | ❌ | `GEMINI_API_KEY` ada di `.env.example`, tapi tidak ada implementasi |

### P3 — Not targeted

| Fitur | Status |
|---|---|
| Offline PWA | ❌ (tidak ditarget, benar) |

---

## Gap Detail Per Area

### 1. API Routes

**Yang sudah ada:**
- ✅ `GET /api/laporan` — filter kategori + status, ordered by created_at DESC
- ✅ `POST /api/laporan` — auth check, multipart, validasi, Storage upload, insert
- ✅ `PATCH /api/laporan/[id]` — admin-only, update status, catat status_logs
- ✅ `POST /api/laporan/[id]/vote` — auth check, insert votes, increment via RPC
- ✅ `GET /api/geocode` — Nominatim proxy dengan User-Agent

**Gap:**
- ❌ `POST /api/laporan/check-duplicate` — **belum ada sama sekali**. Ini P1 blocker untuk duplicate detection.

**Note minor:** `GET /api/laporan` menggunakan `createAdminClient()` untuk query publik. Tidak blocking, tapi idealnya menggunakan anon client agar RLS diuji.

---

### 2. Auth

**Yang sudah ada:**
- ✅ `app/auth/login/page.tsx` — redirect jika sudah login
- ✅ `app/auth/register/page.tsx` — redirect jika sudah login
- ✅ `AuthForm.tsx` — dual-mode `login | register`, error state, loading
- ✅ `Navbar.tsx` — auth state reactive via `onAuthStateChange`

**Gap:**
- ⚠️ Navbar menampilkan link "Panel Admin" untuk **semua user** tanpa cek role. Citizen yang login bisa navigasi ke `/admin` dan melihat semua data (read-only via admin client API). Tidak kritis tapi UX buruk.

---

### 3. Middleware

**Gap kritis:**
- ❌ **`middleware.ts` tidak ada di root project**

Konsekuensi:
1. `/laporan/baru` — tidak diproteksi server-side. User yang belum login mengisi form lengkap, baru gagal 401 saat submit. UX sangat buruk.
2. `/admin` — tidak diproteksi server-side. Non-admin dapat melihat seluruh admin UI dan data (PATCH akan 403, tapi halaman terbuka).

**Ini P0 gap yang harus difix segera.**

---

### 4. Pages

| Page | Data | Loading | Error | Empty | Notes |
|---|---|---|---|---|---|
| `app/page.tsx` | ✅ Real | ✅ Skeleton | ✅ | ✅ | OK |
| `app/laporan/page.tsx` | ✅ Real | ✅ Skeleton grid | ✅ | ✅ | OK |
| `app/laporan/baru/page.tsx` | ✅ API | ✅ submitting state | ✅ toast | — | Tidak redirect non-auth (butuh middleware) |
| `app/laporan/[id]/page.tsx` | ✅ Real | ✅ Skeleton | ✅ | ✅ | OK |
| `app/admin/page.tsx` | ✅ Real | ✅ Skeleton | ✅ | ✅ | Tidak verify admin sebelum render |

**Gap pages:**
- ❌ Tidak ada duplicate detection banner di `/laporan/baru` — API belum ada
- ⚠️ `/admin` render untuk semua user, status update akan 403 tapi halaman visible

---

### 5. Components

| Komponen | Status | Catatan |
|---|---|---|
| `MapView/index.tsx` | ✅ | Dynamic import SSR:false, loading skeleton |
| `MapView/MapComponent.tsx` | ✅ | Marker mode + Heatmap mode, popup detail |
| `MapView/MapFilters.tsx` | ✅ | Heatmap/Pin toggle, kategori, status, result counter |
| `reports/ReportForm.tsx` | ✅ | Geolocation, photo preview, validasi, submit |
| `reports/LocationPickerMap.tsx` | ✅ | Draggable marker + click-to-place |
| `auth/AuthForm.tsx` | ✅ | Login + Register dual-mode |
| `Navbar.tsx` | ⚠️ | Auth state OK, tapi Admin link visible untuk semua |
| `ReportCard.tsx` | ✅ | Link ke detail, badges, foto, meta |

**Gap components:**
- ❌ **Duplicate Detection modal/banner** — belum ada komponen apapun
- ⚠️ `MapComponent.tsx` marker popup tidak punya link langsung ke `/laporan/[id]`, hanya buka side card
- ⚠️ `// @ts-expect-error` untuk `L.heatLayer` — perlu verifikasi runtime tidak error

---

### 6. Lib / Database

**Yang sudah ada:**
- ✅ `lib/supabase/client.ts` — `createBrowserClient` dari `@supabase/ssr`
- ✅ `lib/supabase/server.ts` — `createServerClient` dengan cookie adapter
- ✅ `lib/supabase/admin.ts` — service role client, `persistSession: false`
- ✅ `lib/supabase/types.ts` — typed Database, termasuk `increment_vote` RPC
- ✅ `lib/types.ts` — `Report`, `ReportCategory`, `ReportStatus`, `UserRole`
- ✅ `supabase/schema.sql` — semua tabel + RLS + function `increment_vote` + storage bucket
- ✅ `scripts/seed.ts` — 6 laporan demo realistis dengan koordinat Pamulang

**Gap DB:**
- ❌ **Tidak ada Postgres function `nearby_reports(lat, lng, category, radius)`** di `schema.sql` — dibutuhkan untuk duplicate detection
- ❌ **`lib/supabase/types.ts` belum mendefinisikan `nearby_reports`** di Functions — harus ditambah bersamaan dengan implementasi

**Security notes:**
- ✅ Service role key hanya di `lib/supabase/admin.ts` (server-only)
- ✅ Tidak ada secret yang ter-hardcode
- ⚠️ Placeholder values di client files — verifikasi env vars di Vercel sebelum deploy

---

### 7. UI_TARGET vs Implementasi Aktual

Target menggunakan design system **Civic Horizon** dengan palette teal/amber, font Hanken Grotesk + Inter, bottom navigation mobile, dan Material Symbols icons.

| Halaman | Gap Utama |
|---|---|
| **Home/Map** | ❌ Bottom nav tidak ada. ❌ FAB amber tidak ada. ❌ Stats overlay pill tidak ada. |
| **New Report Form** | ⚠️ Layout dua-kolom vs single-col mobile target. ❌ Chip category selector tidak ada. ❌ Duplicate banner belum implemented. |
| **Report Detail** | ⚠️ Before/After slider (P2) belum ada. ⚠️ Activity log visual berbeda (target: `border-l-2` timeline). ⚠️ Vote button shape berbeda. |
| **Reports List** | Secara struktur sudah cukup baik |
| **Admin Panel** | Secara fungsional sudah baik |
| **Login/Register** | Secara fungsional sudah OK |

**Gap Tematik UI (seluruh halaman):**

| Elemen | UI_TARGET | Implementasi | Prioritas Fix |
|---|---|---|---|
| Primary color | Teal `#00535b` | shadcn default | Medium |
| Secondary/CTA | Amber `#8e4e14` | shadcn default | Medium |
| Font headline | Hanken Grotesk 700 | Inter (default shadcn) | Low |
| Mobile nav | Bottom nav 5-tab fixed | Top horizontal nav | High (UX) |
| Map markers | Teardrop + Material Symbol icon per kategori | Circle + white dot | Low |
| Category selector | Horizontal scrollable chips | Select dropdown | Low |
| Activity log | `border-l-2` vertical timeline | Flat list | Low |
| Vote CTA | Rounded-full capsule pill | Standard Button | Low |
| Map stats overlay | Pill "Total Active / Resolved" | Tidak ada | Low |
| Floating action button | Amber circle di map | "Buat Laporan" di navbar | Medium |

---

## Priority Fix List

### SEGERA — P0 Blocker

**1. Buat `middleware.ts`** (estimasi: 30 menit)
- Proteksi `/laporan/baru` — redirect ke `/auth/login` jika tidak authenticated
- Proteksi `/admin` — redirect ke `/` jika tidak authenticated ATAU bukan admin
- Pattern: ikuti `lib/supabase/server.ts` cookie adapter dari `@supabase/ssr`

**2. Hide Admin nav link dari non-admin** (estimasi: 15 menit)
- `Navbar.tsx`: cek `user?.user_metadata?.role === 'admin'` sebelum render link "Panel Admin"

### P1 — Differentiator (harus selesai sebelum demo)

**3. Implementasi Duplicate Detection** (estimasi: 4-5 jam total)

**3a. DB function** — tambah ke `supabase/schema.sql` dan jalankan di Supabase SQL Editor:
```sql
create or replace function nearby_reports(
  p_lat float8, p_lng float8,
  p_category text, p_radius_meters float8 default 100
)
returns table(id uuid, title text, vote_count int, distance_meters float8, status text)
language sql as $$
  select id, title, vote_count,
    (6371000 * acos(
      cos(radians(p_lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(latitude))
    )) as distance_meters,
    status
  from reports
  where category = p_category
    and status != 'selesai'
    and (6371000 * acos(
      cos(radians(p_lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(latitude))
    )) <= p_radius_meters
  order by distance_meters asc
  limit 3;
$$;
```

**3b. API route** — buat `app/api/laporan/check-duplicate/route.ts`:
- `POST` body: `{ lat, lng, category }`
- Panggil `supabase.rpc('nearby_reports', {...})`
- Return candidates array atau empty
- Jika RPC error: return `{ candidates: [], error: 'check_failed' }` — non-blocking

**3c. Update types** — tambah `nearby_reports` ke `Functions` di `lib/supabase/types.ts`

**3d. UI di `ReportForm.tsx`** — trigger check setelah user memilih kategori + koordinat, tampilkan banner/modal jika ada kandidat, dengan CTA:
- "Dukung laporan ini" (vote existing)
- "Lanjut buat laporan baru" (continue anyway)
- Failure tidak block submit

### Operasional (sebelum demo)

**4. Verifikasi seed data ter-run** — `npx tsx scripts/seed.ts`

**5. Verifikasi build** — `npm run build` harus sukses tanpa TypeScript error

**6. Verifikasi Supabase live** — pastikan schema + RLS + `increment_vote` + `report-photos` bucket sudah ada di Supabase project nyata

### UI Polish (paralel dengan P1)

**7. Tambah Hanken Grotesk** di `app/layout.tsx` via Google Fonts (5 menit)

**8. Extend Tailwind config** dengan Civic Horizon colors — teal primary + amber secondary (30 menit)

**9. Bottom nav mobile** — buat `components/BottomNav.tsx` yang tampil di mobile (`md:hidden`) dengan tabs: Peta, Laporan, Buat, Admin (1-2 jam)

**10. Amber FAB** di home page — visually impactful untuk demo (30 menit)

**11. Map marker popup → link ke detail page** — tambah `href="/laporan/${report.id}"` di popup `MapComponent.tsx`

### P2 — Stretch (jika waktu memungkinkan)

**12. Before/After slider** — hanya tampil di detail page jika `photo_after_url` tidak null (3-4 jam)

**13. AI Insight Gemini** — buat `app/api/ai-insight/route.ts` yang memanggil Gemini server-side, non-blocking (3-4 jam)

---

## Flag Risiko / Blocker

### Risiko Tinggi

| Risiko | Detail | Mitigasi |
|---|---|---|
| **Middleware tidak ada** | Non-auth user akses `/laporan/baru`, non-admin lihat `/admin`. UX buruk, tidak lolos demo | Buat `middleware.ts` sekarang |
| **Duplicate detection belum ada** | P1 differentiator utama. Demo flow step 8 akan skip | Blokir 4-5 jam: DB function + API + UI |
| **Supabase belum dikonfirmasi live** | Schema ada di file, tapi belum tentu sudah di-run. `increment_vote` RPC harus ada | Verifikasi dengan test lokal + submit laporan |
| **`leaflet.heat` type error** | `@ts-expect-error` di `MapComponent.tsx` — jika tidak ter-import dengan benar, heatmap silent fail | Test heatmap mode langsung di browser |

### Risiko Sedang

| Risiko | Detail | Mitigasi |
|---|---|---|
| **Admin page visible untuk semua** | Citizen tahu URL `/admin` bisa lihat semua data (read-only) | Middleware + Navbar fix |
| **`recharts` terinstall tapi tidak dipakai** | Admin page pakai custom CSS bar chart. Dependency bloat | Hapus dari `package.json` jika tidak dipakai |
| **Seed data belum di-run** | Map akan kosong di demo | Run script sebelum demo |

### Risiko Rendah

| Risiko | Detail |
|---|---|
| **GET /api/laporan pakai admin client** | Tidak ideal (should use anon), tapi fungsional |
| **Vote "sudah vote" state saat page load** | Race condition singkat saat `currentUserId` null — tombol terlihat bisa diklik |

---

## Checklist Definition of Done (Revised)

```
P0 - Production Ready:
[✅] User bisa register + login + logout
[✅] Session persistent setelah refresh
[✅] /laporan/baru diblokir untuk non-auth (proxy.ts — konvensi Next 16)
[✅] /admin diblokir untuk non-admin (proxy.ts + Navbar role check)
[✅] User bisa submit laporan dengan foto + lokasi
[✅] Laporan muncul di peta + list setelah submit
[✅] User bisa vote 1x per laporan
[✅] Admin bisa update status
[✅] Activity log tampil di detail
[✅] Tiga status workflow berjalan
[✅] npm run build sukses (diverifikasi, TypeScript bersih)
[✅] .env.local tidak di-commit

P1 - Demo Differentiators:
[✅] Heatmap toggle berfungsi dengan real data
[✅] Heatmap filter mengikuti kategori/status
[✅] Duplicate detection API exist (/api/laporan/check-duplicate)
[✅] Duplicate detection UI di ReportForm
[⚠️] nearby_reports() function ada di Supabase (sudah di schema.sql, BELUM di-run di project live)

P2 - Stretch:
[❌] Before/After slider (photo_after_url ada di DB)
[❌] AI Insight Gemini

Demo Ready:
[✅] proxy.ts ada (Next 16 mengganti middleware.ts dengan proxy.ts)
[❌] Seed data ter-run di Supabase live (diblokir: .env.local belum ada)
[⚠️] Duplicate detection end-to-end works (kode lengkap, perlu verifikasi live)
[✅] UI sufficiently close to Civic Horizon target (teal/amber, Hanken Grotesk, BottomNav, FAB, popup link)
```

---

## Estimasi Sisa Effort

| Task | Estimasi |
|---|---|
| `middleware.ts` | 30 menit |
| Navbar admin visibility fix | 15 menit |
| `nearby_reports` DB function | 20 menit |
| `check-duplicate` API route | 1 jam |
| Duplicate detection UI di ReportForm | 2-3 jam |
| Seed data run + verifikasi | 30 menit |
| UI polish (font, colors, bottom nav, FAB) | 2-4 jam |
| Before/After slider (P2) | 3-4 jam |
| **Total P0+P1 gap** | **~5-6 jam** |
| **Total dengan UI polish** | **~8-10 jam** |

---

## Kesimpulan

Dev A sudah selesai **~90% dari semua tasknya**. Semua P0 API sudah ada, semua pages sudah terhubung ke real data, dummy data sudah bersih. Gap kritikal P0 yang tersisa hanya `middleware.ts`.

P1 Heatmap sudah done. P1 Duplicate Detection adalah **prioritas nomor satu setelah middleware** — ini yang membuat demo flow bisa berjalan lengkap sesuai spec (step 8: "Duplicate Detection finds nearby similar report").

UI diverge dari Civic Horizon target terutama di: color palette, font, mobile bottom nav, dan FAB. Ini bisa di-address sebagai polish tanpa mengubah struktur komponen yang sudah ada.
