-- Tambahkan kolom photo_url pada tabel perceptions untuk menyimpan
-- foto opsional yang diunggah bersama persepsi warga.
ALTER TABLE public.perceptions
  ADD COLUMN photo_url text NULL;
