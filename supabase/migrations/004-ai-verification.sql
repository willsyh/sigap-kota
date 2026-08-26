-- 004-ai-verification.sql
-- Tambah kolom hasil verifikasi AI untuk anti-spam foto vs judul/deskripsi.
-- DEFAULT 'unsure' supaya laporan lama otomatis ditandai unsure (netral).
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS ai_verdict TEXT NOT NULL DEFAULT 'unsure',
  ADD COLUMN IF NOT EXISTS ai_reason TEXT;

-- Boleh di-ulang (idempotent).
COMMENT ON COLUMN reports.ai_verdict IS
  'Verdict verifikasi AI foto vs teks: match | mismatch | unsure';
COMMENT ON COLUMN reports.ai_reason IS
  'Penjelasan singkat dari AI saat verdict mismatch/unsure';
