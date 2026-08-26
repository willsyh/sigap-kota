-- ============================================================
-- Migration: tabel perceptions (lapisan persepsi warga "Unseen")
-- Jalankan di Supabase > SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- Table: perceptions
-- Persepsi subjektif warga terhadap suatu lokasi (nyaman/biasa/
-- tidak_nyaman). Opsional dan terpisah dari reports.
-- ------------------------------------------------------------
create table if not exists public.perceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  sentiment text not null
    check (sentiment in ('nyaman','biasa','tidak_nyaman')),
  reason text
    check (reason in ('kotor','bising','jalan_buruk','ramai','kurang_penerangan','kurang_aman','lainnya')),
  note text,
  report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_perceptions_created_at
  on public.perceptions (created_at desc);

create index idx_perceptions_report_id
  on public.perceptions (report_id);

create index idx_perceptions_user_created_at
  on public.perceptions (user_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.perceptions enable row level security;

create policy "Anyone can read perceptions"
  on public.perceptions for select
  using (true);

create policy "Authenticated can insert own perceptions"
  on public.perceptions for insert
  with check (auth.uid() = user_id);

-- Tidak ada policy update/delete: persepsi bersifat immutable.
