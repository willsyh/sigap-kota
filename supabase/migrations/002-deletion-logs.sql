-- ============================================================
-- Migration: tabel deletion_logs + izin hapus laporan oleh pemilik
-- Jalankan di Supabase > SQL Editor.
-- ============================================================

-- Tambah status menunggu_konfirmasi (kalau belum pernah dijalankan)
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('dilaporkan', 'diproses', 'menunggu_konfirmasi', 'selesai'));

-- ------------------------------------------------------------
-- Table: deletion_logs
-- Snapshot laporan yang dihapus. report_id tidak pakai foreign key
-- karena baris reports-nya sendiri ikut dihapus.
-- ------------------------------------------------------------
create table if not exists deletion_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  deleted_by uuid references auth.users,
  role text not null default 'user',
  title text,
  category text,
  reason text,
  created_at timestamptz default now()
);

alter table deletion_logs enable row level security;

-- Log hanya boleh dibaca admin
create policy "Admin can read deletion_logs"
  on deletion_logs for select
  using (
    exists (
      select 1 from auth.users
      where id = auth.uid()
        and raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert dilakukan via service_role key dari API route.

-- ------------------------------------------------------------
-- Policy: pemilik laporan boleh menghapus laporannya sendiri
-- ------------------------------------------------------------
create policy "Owner can delete own report"
  on reports for delete
  using (auth.uid() = user_id);
