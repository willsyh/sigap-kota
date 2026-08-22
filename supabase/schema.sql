-- ============================================================
-- SigapKota — Skema Database
-- Jalankan seluruh file ini di Supabase > SQL Editor (sekali jalan).
-- ============================================================

-- ------------------------------------------------------------
-- Table: reports
-- ------------------------------------------------------------
create table if not exists reports (
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

-- ------------------------------------------------------------
-- Table: votes
-- ------------------------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  unique(report_id, user_id)
);

-- ------------------------------------------------------------
-- Table: status_logs (activity log di halaman detail)
-- Insert dilakukan via service_role key di API route.
-- ------------------------------------------------------------
create table if not exists status_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Function: increment_vote (atomic vote_count increment)
-- Dipanggil dari API route via .rpc('increment_vote', ...)
-- ------------------------------------------------------------
create or replace function increment_vote(p_report_id uuid)
returns void
language sql
as $$
  update reports set vote_count = vote_count + 1 where id = p_report_id;
$$;

-- ============================================================
-- RLS
-- ============================================================
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

alter table votes enable row level security;

create policy "Anyone can read votes"
  on votes for select using (true);

create policy "Authenticated can insert own vote"
  on votes for insert
  with check (auth.uid() = user_id);

alter table status_logs enable row level security;

create policy "Anyone can read status_logs"
  on status_logs for select using (true);

-- ============================================================
-- Storage bucket: report-photos (public, maks 5MB)
-- Upload dilakukan server-side via service_role key,
-- sehingga tidak perlu storage policy tambahan.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-photos',
  'report-photos',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;
