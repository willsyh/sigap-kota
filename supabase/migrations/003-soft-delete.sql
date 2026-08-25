-- ============================================================
-- Migration 003: soft-delete laporan
-- Jalankan di Supabase > SQL Editor.
-- ============================================================

-- Kolom penanda soft-delete. NULL = aktif, terisi = terhapus.
alter table reports add column if not exists deleted_at timestamptz;

-- Update fungsi duplicate detection agar mengabaikan laporan terhapus.
create or replace function nearby_reports(
  p_lat float8,
  p_lng float8,
  p_category text,
  p_radius_meters float8 default 100
)
returns table (
  id uuid,
  title text,
  vote_count int,
  distance_meters float8,
  status text
)
language sql
stable
as $$
  select r.id,
         r.title,
         r.vote_count,
         (6371000 * acos(
           least(1,
             cos(radians(p_lat)) * cos(radians(r.latitude)) *
             cos(radians(r.longitude) - radians(p_lng)) +
             sin(radians(p_lat)) * sin(radians(r.latitude))
           )
         )) as distance_meters,
         r.status::text
  from reports r
  where r.category = p_category
    and r.status <> 'selesai'
    and r.deleted_at is null
    and (6371000 * acos(
           least(1,
             cos(radians(p_lat)) * cos(radians(r.latitude)) *
             cos(radians(r.longitude) - radians(p_lng)) +
             sin(radians(p_lat)) * sin(radians(r.latitude))
           )
         )) <= p_radius_meters
  order by distance_meters asc
  limit 3;
$$;
