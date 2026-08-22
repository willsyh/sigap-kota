# Rencana Eksekusi Dev A — Afif
**Proyek**: SigapKota | **Konteks**: Dilanjutkan setelah Dev B merge PR #1

---

## Situasi Sekarang

Dev B sudah deliver seluruh UI dengan dummy data (`lib/dummy-reports.ts`).
Yang ada:
- Peta interaktif + filter (dummy)
- Halaman laporan list + detail (dummy)
- Panel admin (status update local state only)
- Tidak ada: auth, API routes, DB, form buat laporan, route protection

Tugas Afif: cabut semua dummy, sambungkan ke Supabase yang nyata.

---

## Prasyarat (Sebelum Mulai Coding)

### 1. Buat Project Supabase

Buka https://supabase.com, buat project baru (gratis, tanpa kartu kredit).

### 2. Jalankan SQL Migration

Di Supabase > SQL Editor, jalankan:

```sql
-- Table: reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  title text not null,
  description text,
  category text not null
    check (category in ('jalan_rusak','sampah','banjir','fasilitas_umum','lainnya')),
  photo_url text,
  photo_after_url text,
  latitude float8 not null,
  longitude float8 not null,
  status text not null default 'dilaporkan'
    check (status in ('dilaporkan','diproses','selesai')),
  vote_count int default 0,
  created_at timestamptz default now()
);

-- Table: votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  unique(report_id, user_id)
);

-- Table: status_logs (untuk activity log di halaman detail)
create table status_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz default now()
);
```

### 3. Setup RLS

```sql
-- RLS: reports
alter table reports enable row level security;

create policy "Anyone can read reports"
  on reports for select using (true);

create policy "Authenticated can insert own report"
  on reports for insert
  with check (auth.uid() = user_id);

create policy "Admin can update status"
  on reports for update
  using (
    exists (
      select 1 from auth.users
      where id = auth.uid()
        and raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS: votes
alter table votes enable row level security;

create policy "Anyone can read votes"
  on votes for select using (true);

create policy "Authenticated can insert own vote"
  on votes for insert
  with check (auth.uid() = user_id);

-- RLS: status_logs
alter table status_logs enable row level security;

create policy "Anyone can read status_logs"
  on status_logs for select using (true);
-- Insert status_logs dilakukan via service_role key di API route (tidak perlu policy insert)
```

### 4. Buat Storage Bucket

Di Supabase > Storage > New Bucket:
- Nama: `report-photos`
- Public: **yes**
- Allowed MIME types: `image/jpeg, image/png, image/webp`
- Max upload size: `5242880` (5MB)

### 5. Buat User Admin

Di Supabase > Authentication > Users > Invite User, lalu tambah metadata:
```json
{ "role": "admin" }
```

### 6. Isi `.env.local`

Dari Supabase > Settings > API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=
```

---

## Branch Strategy

Semua pekerjaan Dev A di branch terpisah:

```bash
git checkout -b dev-a/supabase-auth-api
```

PR ke `main` setelah semua task selesai dan bisa berjalan lokal tanpa error.

---

## Urutan Eksekusi

```
[Prasyarat] Setup Supabase (DB + RLS + Storage)  <-- BLOCKER untuk semua task lain
[Task 1]    Supabase Database Types
[Task 2]    Auth: Login & Register               <-- paralel dengan Task 3
[Task 3]    Middleware: Route Protection         <-- paralel dengan Task 2
[Task 4]    API Route: GET & POST Laporan
[Task 5]    API Route: PATCH Status (Admin)      <-- paralel dengan Task 6 & 7
[Task 6]    API Route: Vote                      <-- paralel dengan Task 5 & 7
[Task 7]    API Route: Geocode Proxy             <-- paralel dengan Task 5 & 6
[Task 8]    Halaman Buat Laporan                 <-- butuh Task 4 & 7 selesai
[Task 9]    Sambungkan UI ke Real Data           <-- butuh semua API selesai
[Task 10]   Hapus Dummy Data                     <-- setelah Task 9 selesai
[Task 11]   Seeding Data Demo
```

---

## Task 1 — Supabase Database Types

**File baru**: `lib/supabase/types.ts`

Generate otomatis dari Supabase CLI:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

Atau tulis manual sesuai skema. Tujuan: seluruh query Supabase fully typed, tidak ada `any`.

---

## Task 2 — Auth: Halaman Login & Register

**Files baru**:
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `components/auth/AuthForm.tsx` (shared form, terima prop `mode: 'login' | 'register'`)

**Spesifikasi**:
- Field: email + password + tombol submit
- Login: `supabase.auth.signInWithPassword({ email, password })`
- Register: `supabase.auth.signUp({ email, password })` lalu redirect ke `/`
- Error handling: tampilkan pesan error dari Supabase (contoh: "Email already registered")
- Jika sudah login: redirect ke `/`
- Gunakan komponen shadcn yang sudah ada: `Input`, `Button`, `Label`, `Card`

**Update `components/Navbar.tsx`**:
- Jika belum login: tampilkan link "Masuk"
- Jika sudah login: tampilkan nama/email user + tombol "Keluar"
- Gunakan Supabase client-side session (`supabase.auth.getUser()`)

---

## Task 3 — Middleware: Route Protection

**File baru**: `middleware.ts` (di root project, sejajar `package.json`)

Aturan proteksi:
- `/laporan/baru` — harus authenticated, redirect ke `/auth/login` jika belum
- `/admin` — harus authenticated DAN `user_metadata.role === 'admin'`, redirect ke `/` jika bukan admin

Gunakan `createServerClient` dari `lib/supabase/server.ts` yang sudah ada. Ikuti pattern cookie adapter SSR dari `@supabase/ssr`.

---

## Task 4 — API Route: GET & POST Laporan

**File baru**: `app/api/laporan/route.ts`

```
GET /api/laporan
  - Query semua laporan dari table reports
  - Support query params: ?kategori=jalan_rusak&status=dilaporkan
  - Order by created_at DESC
  - Return: JSON array laporan

POST /api/laporan
  - Harus authenticated (cek session dari cookie)
  - Body: multipart/form-data
    - title: string
    - description: string
    - category: string
    - latitude: number
    - longitude: number
    - photo: File
  - Upload foto ke Supabase Storage bucket "report-photos"
    - Nama file: {uuid}/{timestamp}.webp (atau ekstensi asli)
    - Ambil public URL setelah upload
  - Insert ke table reports dengan photo_url dari Storage
  - Gunakan SUPABASE_SERVICE_ROLE_KEY untuk operasi server
  - Return: laporan yang baru dibuat (dengan id)
```

---

## Task 5 — API Route: PATCH Status Laporan (Admin)

**File baru**: `app/api/laporan/[id]/route.ts`

```
PATCH /api/laporan/[id]
  - Cek session: harus admin (user_metadata.role === 'admin')
  - Jika bukan admin: return 403
  - Body: { status: 'dilaporkan' | 'diproses' | 'selesai' }
  - Ambil status lama dari DB
  - Update kolom status di table reports
  - Insert ke table status_logs: { report_id, old_status, new_status }
  - Return: laporan yang sudah diupdate
```

---

## Task 6 — API Route: Vote

**File baru**: `app/api/laporan/[id]/vote/route.ts`

```
POST /api/laporan/[id]/vote
  - Harus authenticated
  - Insert ke table votes { report_id, user_id }
  - Jika unique constraint violation (sudah vote): return 409 dengan pesan "Sudah vote"
  - Increment vote_count di table reports
  - Return: { vote_count: number }
```

Catatan: increment `vote_count` bisa pakai:
```sql
update reports set vote_count = vote_count + 1 where id = $1
```

---

## Task 7 — API Route: Geocode Proxy

**File baru**: `app/api/geocode/route.ts`

```
GET /api/geocode?q=nama+lokasi
  - Proxy request ke Nominatim: https://nominatim.openstreetmap.org/search?q=...&format=json
  - WAJIB tambahkan header: User-Agent: SigapKota/1.0 (contact@email.com)
    (Nominatim mensyaratkan User-Agent, tanpa ini request bisa diblokir)
  - Return: hasil JSON dari Nominatim
  - Jangan panggil Nominatim langsung dari client (hindari CORS + rate limit abuse)
```

---

## Task 8 — Halaman Buat Laporan

**File baru**: `app/laporan/baru/page.tsx`
**File baru**: `components/reports/ReportForm.tsx`

**Alur form**:
1. User buka `/laporan/baru` (middleware sudah blokir jika belum login)
2. Isi judul, deskripsi, pilih kategori
3. Upload foto (preview langsung di form)
4. Geolocation:
   - Auto-detect: `navigator.geolocation.getCurrentPosition()` saat halaman dibuka
   - Tampilkan mini-map Leaflet dengan marker yang bisa digeser (draggable)
   - User selalu bisa koreksi posisi marker secara manual
   - Koordinat final diambil dari posisi marker, bukan dari EXIF foto
5. Submit: POST ke `/api/laporan` sebagai `multipart/form-data`
6. Loading state selama upload berlangsung (disable tombol, tampilkan spinner)
7. Sukses: redirect ke `/laporan/[id]` laporan yang baru dibuat
8. Error: tampilkan toast error via Sonner (sudah terinstall)

**Komponen yang bisa dipakai dari Dev B**: `Input`, `Textarea`, `Button`, `Label`, `Select`, `Card` (semua sudah ada di `components/ui/`)

---

## Task 9 — Sambungkan UI ke Real Data

Cabut semua `DUMMY_REPORTS` dari halaman Dev B, ganti dengan fetch ke API/Supabase.
Gunakan `useQuery` dari TanStack React Query (sudah tersetup di `providers/QueryProvider.tsx`).

### 9a. Home Page (`app/page.tsx`)

- Fetch laporan: `GET /api/laporan` (atau langsung Supabase client di server component)
- Pass array laporan ke `MapView` sebagai prop
- Saat filter berubah, refetch dengan query params

### 9b. Laporan List (`app/laporan/page.tsx`)

- Fetch laporan dengan filter dari URL search params
- Loading state: gunakan shadcn `Skeleton` yang sudah ada di `components/ui/skeleton.tsx`
- Empty state: tampilkan pesan jika tidak ada laporan

### 9c. Laporan Detail (`app/laporan/[id]/page.tsx`)

- Fetch satu laporan by ID dari Supabase
- Fetch `status_logs` untuk activity timeline (order by changed_at ASC)
- Cek apakah user sudah vote: query table votes `where report_id = $id and user_id = $currentUser`
- Wire tombol vote ke `POST /api/laporan/[id]/vote`
  - Disable tombol setelah vote, tampilkan vote_count terbaru
  - Handle 409 (sudah vote): tampilkan toast "Kamu sudah mendukung laporan ini"
- Tampilkan foto dari Supabase Storage URL (`photo_url` dari DB)

### 9d. Admin Panel (`app/admin/page.tsx`)

- Fetch semua laporan dari Supabase (via server component atau React Query)
- Wire dropdown/tombol update status ke `PATCH /api/laporan/[id]`
- Setelah update berhasil: invalidate query dan refetch tabel
- Hapus `// ponytail:` comment di line 210 (sudah tidak relevan)

---

## Task 10 — Hapus Dummy Data

Setelah Task 9 selesai dan semua halaman berjalan dengan data nyata:

```bash
# Cek apakah masih ada import ke dummy-reports
grep -r "dummy-reports" .

# Jika bersih, hapus file
rm lib/dummy-reports.ts
```

---

## Task 11 — Seeding Data Demo

Buat minimal 6 laporan di Supabase untuk keperluan demo. Laporan harus:
- Tersebar di minimal 3 kategori berbeda
- Ada yang berstatus `dilaporkan`, `diproses`, dan `selesai`
- Lokasi di area yang sama (pilih satu kota/kecamatan) agar peta terlihat padat

Cara termudah: Supabase > Table Editor > Insert Row (manual).
Alternatif: buat `scripts/seed.ts` dengan Supabase client dan jalankan sekali.

---

## Checklist Definition of Done (Dev A)

Sebelum buat PR, pastikan semua centang:

- [ ] User bisa register dengan email/password baru
- [ ] User bisa login dan logout
- [ ] Akses `/laporan/baru` diblokir untuk user yang belum login
- [ ] Akses `/admin` diblokir untuk user yang bukan admin
- [ ] User bisa submit laporan baru dengan foto dan lokasi (auto-detect + koreksi manual)
- [ ] Laporan baru langsung muncul di peta setelah submit
- [ ] User bisa vote laporan (1x per laporan per user)
- [ ] Vote kedua kali menampilkan pesan "sudah vote", tidak error crash
- [ ] Admin bisa update status laporan, perubahan tersimpan ke DB
- [ ] Activity log status tampil di halaman detail laporan
- [ ] Tidak ada import dari `lib/dummy-reports.ts` yang tersisa
- [ ] File `.env.local` tidak ter-commit ke Git (cek `.gitignore`)
- [ ] `npm run build` berhasil tanpa error TypeScript
- [ ] `npm run lint` berhasil tanpa error

---

## Yang BUKAN Tugas Afif (Dev A)

Jangan sentuh ini dulu — dikerjakan setelah MVP stabil:

- Heatmap (`leaflet.heat`) — fitur gimmick 4.1
- Deteksi duplikat — fitur gimmick 4.2
- Before/after slider — fitur gimmick 4.3
- AI Insight (Gemini) — fitur gimmick 4.4
- Perubahan visual/styling UI — sudah selesai oleh Dev B
- Analytics tab di admin — bisa diisi nanti jika ada waktu

---

## Catatan Teknis

- Semua API route yang butuh operasi privileged HARUS pakai `SUPABASE_SERVICE_ROLE_KEY` (server-side), bukan anon key.
- Nama file foto di Storage: `{reportId}/{Date.now()}.{ext}` — hindari collision nama.
- Middleware Supabase SSR: ikuti pattern cookie adapter dari `lib/supabase/server.ts` yang sudah ada.
- Jangan tambah dependency baru kecuali tidak ada alternatif dari yang sudah terinstall.
- Jangan hardcode credential apapun di source code.
- Semua UI text dalam Bahasa Indonesia (konsisten dengan halaman yang sudah ada).
