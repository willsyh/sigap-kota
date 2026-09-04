-- ============================================================
-- SigapKota — Seeder Data Demo (~50 laporan + ~100 persepsi + akun demo)
--
-- Cara pakai:
--   Supabase Dashboard > SQL Editor > paste seluruh file > Run.
--
-- Catatan:
-- - Idempotent: boleh dijalankan berulang. Laporan dengan pola ID
--   '00000000-0000-4000-8000-*', persepsi pola
--   '22222222-2222-4222-8222-*', dan akun demo pola
--   '11111111-1111-4111-8111-*' dihapus dulu, lalu dibuat ulang
--   (votes dan status_logs ikut terhapus via ON DELETE CASCADE).
-- - Membuat 6 akun demo (password semua: sigap123):
--     warga1..warga5@sigapkota.id  -> role user
--     admin@sigapkota.id           -> role admin (langsung bisa /admin)
-- - 50 laporan dipasangkan bergiliran ke warga1..warga5.
-- - 100 persepsi dengan distribusi 6 hotspot + sebaran acak.
-- - photo_url NULL; UI sudah menangani foto kosong.
-- - Titik disebar di area Pamulang, Tangerang Selatan (pusat peta
--   default aplikasi), dengan beberapa hotspot agar heatmap
--   terlihat jelas.
-- - Pasangan laporan berjarak < 100 m dengan kategori sama
--   (baris 1-2 dan 9-10) untuk mendemokan duplicate detection.
-- - Persepsi terkait report_id untuk 6 laporan (report-linked),
--   sisanya standalone.
-- ============================================================

create extension if not exists pgcrypto;

begin;

-- ------------------------------------------------------------
-- Bersihkan data seed sebelumnya
-- ------------------------------------------------------------
delete from perceptions
where id::text like '22222222-2222-4222-8222-%';

delete from reports
where id::text like '00000000-0000-4000-8000-%';

-- Hapus identities untuk semua akun demo (by email)
delete from auth.identities
where user_id in (
  select id from auth.users where email like '%@sigapkota.id'
);

-- Nullify foreign keys yang refer ke akun demo
update deletion_logs set deleted_by = null
where deleted_by in (
  select id from auth.users where email like '%@sigapkota.id'
);

-- Hapus akun demo (by email + by ID pattern untuk compat)
delete from auth.users
where email like '%@sigapkota.id'
   or id::text like '11111111-1111-4111-8111-%';

-- ------------------------------------------------------------
-- Buat akun demo (5 warga + 1 admin), password: sigap123
-- ------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000',
  ('11111111-1111-4111-8111-' || lpad(to_hex(u.n), 12, '0'))::uuid,
  'authenticated',
  'authenticated',
  (case when u.n = 6 then 'admin' else 'warga' || u.n end) || '@sigapkota.id',
  crypt('sigap123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  case when u.n = 6 then '{"role": "admin"}'::jsonb else '{}'::jsonb end
from generate_series(1, 6) as u(n);

insert into auth.identities (
  user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
)
select distinct on (id)
  id,
  'email',
  email,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(),
  now(),
  now()
from auth.users
where id::text like '11111111-1111-4111-8111-%'
on conflict (provider_id, provider) do nothing;

-- ------------------------------------------------------------
-- Insert 50 laporan
-- Kolom src: line, title, descr, category, lat, lng, status, votes, days_ago
-- ------------------------------------------------------------
with src(line, title, descr, category, lat, lng, status, votes, days_ago) as (
  values
    -- Hotspot 1: Pasar Pamulang (dominan sampah)
    (1,  'Sampah menumpuk di belakang Pasar Lama',
         'Tumpukan sampah organik dan plastik tidak diangkut sudah empat hari. Bau menyengat terutama pagi hari.',
         'sampah', -6.342750, 106.738100, 'dilaporkan', 34, 3),
    (2,  'TPS liar di pinggir Jl. Raya Pamulang',
         'Warga membuang sampah sembarangan di lahan kosong, menumpuk hingga ke tepi jalan.',
         'sampah', -6.343200, 106.737650, 'dilaporkan', 21, 5),
    (3,  'Sampah meluber ke badan jalan pasar',
         'Petugas belum mengangkut, sampah tumpah ke jalur pejalan kaki depan kios sayur.',
         'sampah', -6.343050, 106.738400, 'diproses', 18, 9),
    (4,  'Sampah plastik tersangkut di saluran pasar',
         'Saluran air di area pasar tersumbat sampah plastik sehingga air menggenang saat hujan.',
         'sampah', -6.342550, 106.737500, 'selesai', 12, 24),
    (5,  'Jalan keluar pasar berlubang',
         'Lubang lebar di tikungan keluar area parkir, beberapa pengendara motor terjatuh.',
         'jalan_rusak', -6.342350, 106.737850, 'dilaporkan', 27, 6),
    (6,  'Aspal rusak depan pintu masuk pasar',
         'Permukaan aspal bergelombang dan mulai berlubang di lajur masuk.',
         'jalan_rusak', -6.343400, 106.738200, 'dilaporkan', 9, 2),
    (7,  'Genangan setelah hujan di area pasar',
         'Drainase pasar tersumbat, genangan setinggi 20 cm di depan kios.',
         'banjir', -6.342700, 106.737400, 'dilaporkan', 14, 1),
    (8,  'Sampah warung menumpuk di gang pasar',
         'Sampah dari warung makan menumpuk di gang sempat tanpa tempat pembuangan.',
         'sampah', -6.342500, 106.738450, 'diproses', 7, 11),

    -- Hotspot 2: Terminal Pamulang (dominan jalan rusak)
    (9,  'Lubang besar di Jl. Raya dekat Terminal',
         'Lubang diameter sekitar satu meter di lajur lambat, sudah dua kali membuat motor jatuh.',
         'jalan_rusak', -6.348600, 106.736050, 'dilaporkan', 41, 4),
    (10, 'Aspal amortisasi di jalur keluar terminal',
         'Aspal turun dan bergelombang di jalur keluar bus antar kota.',
         'jalan_rusak', -6.349000, 106.736500, 'dilaporkan', 23, 8),
    (11, 'Jalan rusak bekas galian proyek di terminal',
         'Bekas galian pipa ditimbun asal sehingga permukaan cepat rusak.',
         'jalan_rusak', -6.348950, 106.735800, 'diproses', 16, 13),
    (12, 'Lampu penerangan terminal mati total',
         'Area tunggu gelap setelah magrib, warga khawatir rawan kejahatan.',
         'fasilitas_umum', -6.348800, 106.736400, 'diproses', 11, 15),
    (13, 'Rambu penunjuk arah terminal rusak',
         'Papan rambu berkarat dan miring, tulisan tidak terbaca.',
         'fasilitas_umum', -6.348500, 106.736000, 'dilaporkan', 5, 7),
    (14, 'Jalan turunan terminal berlubang',
         'Rangkaian lubang kecil di turunan, berbahaya saat kendaraan ramai.',
         'jalan_rusak', -6.349200, 106.736700, 'selesai', 19, 21),
    (15, 'Sampah penumpang menumpuk di halte terminal',
         'Tempat sampah tidak mencukupi, sampah berserakan di halte.',
         'sampah', -6.348450, 106.736350, 'dilaporkan', 8, 3),

    -- Hotspot 3: Stasiun Pondok Ranji (sampah dan banjir)
    (16, 'Sampah di trotoar akses stasiun',
         'Trotoar menuju stasiun dipenuhi sampah kiriman penumpang.',
         'sampah', -6.340000, 106.743400, 'dilaporkan', 17, 4),
    (17, 'Warga buang sampah di pagar stasiun',
         'Sudah ada tulisan larangan namun tetap dipakai buang sampah.',
         'sampah', -6.340300, 106.743750, 'diproses', 13, 10),
    (18, 'Tumpukan sampah di parkiran motor stasiun',
         'Sampah kantong plastik menumpuk di sudut parkiran.',
         'sampah', -6.339950, 106.743850, 'dilaporkan', 10, 2),
    (19, 'Genangan di underpass dekat stasiun',
         'Setiap hujan sedang air menggenang setinggi 30 cm, pengendara harus putar balik.',
         'banjir', -6.340250, 106.743300, 'dilaporkan', 22, 5),
    (20, 'Saluran tersumbat di jalan akses stasiun',
         'Air tidak mengalir, diduga tersumbat lumpur dan sampah.',
         'banjir', -6.339800, 106.743700, 'diproses', 15, 12),
    (21, 'Air meluap dari got ke jalan stasiun',
         'Got meluap saat hujan, air keruh masuk area parkir.',
         'banjir', -6.340450, 106.743950, 'selesai', 20, 26),
    (22, 'Papan iklan liar menutupi rambu dekat stasiun',
         'Spanduk dipasang sembarangan menutupi rambu arah.',
         'lainnya', -6.339900, 106.743200, 'dilaporkan', 6, 9),

    -- Hotspot 4: Kawasan Puspitek (jalan rusak)
    (23, 'Jalan berlubang di Jl. Puspitek',
         'Rangkaian lubang sepanjang 50 meter di depan kompleks perkantoran.',
         'jalan_rusak', -6.351050, 106.731300, 'dilaporkan', 31, 6),
    (24, 'Lubang jalan di tikungan Puspitek',
         'Lubang besar tak terlihat saat malam karena minim penerangan.',
         'jalan_rusak', -6.351400, 106.731650, 'diproses', 24, 14),
    (25, 'Aspal terkelupas di depan gerbang kantor',
         'Permukaan terkelupas selebar dua meter, licin saat hujan.',
         'jalan_rusak', -6.351000, 106.731700, 'dilaporkan', 12, 1),
    (26, 'Jalan retak parah akibat truk berat',
         'Retakan memanjang di lajur kanan, dikhawatirkan ambles.',
         'jalan_rusak', -6.351350, 106.731150, 'selesai', 17, 22),
    (27, 'Kabel menggantung rendah di Jl. Puspitek',
         'Kabel menggantung sekitar dua meter di atas jalan, membahayakan pengendara.',
         'lainnya', -6.351150, 106.731500, 'dilaporkan', 25, 3),
    (28, 'Monumen bundaran rusak dan tak terawat',
         'Bagian monumen pecah dan cat mengelupas, tidak pernah diperbaiki.',
         'lainnya', -6.351250, 106.731050, 'diproses', 9, 16),
    (29, 'Trotoar rusak di depan kawasan bisnis',
         'Penutup trotoar pecah, pejalan kaki terpaksa turun ke jalan.',
         'fasilitas_umum', -6.351500, 106.731400, 'dilaporkan', 7, 8),

    -- Hotspot 5: Perumahan Benda Baru (banjir)
    (30, 'Banjir rob kecil di Perumahan Benda Baru',
         'Air masuk ke beberapa rumah paling rendah saat hujan deras.',
         'banjir', -6.338400, 106.732700, 'dilaporkan', 29, 2),
    (31, 'Genangan di taman bermain Benda Baru',
         'Taman tak bisa dipakai karena genangan tidak surut berhari-hari.',
         'banjir', -6.338700, 106.733000, 'dilaporkan', 18, 4),
    (32, 'Drainase lingkungan tidak mengalir',
         'Penguras lingkungan tersumbat, air hanya hilang lewat penguapan.',
         'banjir', -6.338350, 106.733050, 'diproses', 14, 13),
    (33, 'Jalan lingkungan tergenang tiap hujan',
         'Setiap hujan jalan jadi kolam, sudah lama berulang.',
         'banjir', -6.338600, 106.732600, 'selesai', 16, 27),
    (34, 'Sampah dibuang ke saluran air Benda Baru',
         'Ada warga membuang sampah rumah tangga ke saluran.',
         'sampah', -6.338800, 106.732850, 'dilaporkan', 11, 7),
    (35, 'Ujung jalan lingkungan amblas',
         'Perkerasan ambles sepanjang tiga meter, roda mobil masuk.',
         'jalan_rusak', -6.338450, 106.732550, 'dilaporkan', 8, 10),

    -- Hotspot 6: Jl. Raya Pondok Aren (fasilitas umum)
    (36, 'Lampu jalan mati sepanjang satu blok',
         'Tiga titik lampu padam bersamaan, jalan sangat gelap malam hari.',
         'fasilitas_umum', -6.350400, 106.745500, 'diproses', 26, 17),
    (37, 'Lampu jalan kedip-kedip di Jl. Raya',
         'Lampu nyala-mati terus mengganggu penerangan.',
         'fasilitas_umum', -6.350650, 106.745800, 'dilaporkan', 13, 5),
    (38, 'Taman anak rusak, ayunan patah',
         'Ayunan patah dan perosotan berkarat, anak tak bisa bermain.',
         'fasilitas_umum', -6.350350, 106.745850, 'dilaporkan', 15, 11),
    (39, 'Polisi tidur rusak jadi bahaya',
         'Besinya menonjol tajam di tengah jalan, banyak motor terpeleset.',
         'jalan_rusak', -6.350700, 106.745450, 'dilaporkan', 19, 6),
    (40, 'Lubang di persimpangan Jl. Raya',
         'Lubang di jalur putar balik, sulit dihindari saat ramai.',
         'jalan_rusak', -6.350550, 106.745700, 'diproses', 21, 18),
    (41, 'Sampah taman kota tidak terjadwal',
         'Pengambilan sampah di taman tidak rutin sehingga menumpuk.',
         'sampah', -6.350450, 106.745650, 'selesai', 10, 23),

    -- Sebaran acak di sekitar pusat Pamulang
    (42, 'Sampah menumpuk di ujung Jl. Swadaya',
         'Belum diangkut tiga hari, mulai mengganggu lalu lintas.',
         'sampah', -6.347000, 106.741500, 'dilaporkan', 12, 1),
    (43, 'Jalan kampung rusak parah',
         'Jalan lingkungan berlubang hampir di sepanjang blok.',
         'jalan_rusak', -6.343000, 106.735000, 'diproses', 14, 12),
    (44, 'Genangan di Jl. Kedaung',
         'Genangan menetap meski tidak hujan, diduga drainase tersumbat.',
         'banjir', -6.350000, 106.742000, 'dilaporkan', 9, 3),
    (45, 'Gazebo taman kota rusak',
         'Atap gazebo bocor dan bangku patah.',
         'fasilitas_umum', -6.341000, 106.747000, 'dilaporkan', 6, 4),
    (46, 'Lubang besar di Jl. Victory Raya',
         'Lubang di laju tercepat, sering tersembunyi oleh genangan.',
         'jalan_rusak', -6.352500, 106.738000, 'dilaporkan', 28, 5),
    (47, 'Drainase perumahan meluap',
         'Air lima rumah tergenang saat curah hujan tinggi.',
         'banjir', -6.339000, 106.736000, 'selesai', 13, 25),
    (48, 'Sampah di kali kecil tersendat',
         'Aliran kali tersumbat sampah, air menghitam dan berbau.',
         'sampah', -6.344500, 106.748000, 'diproses', 11, 14),
    (49, 'Bus stop rusak dan kacanya pecah',
         'Atap bocor, kaca pecah, dudukan lepas.',
         'fasilitas_umum', -6.348000, 106.733500, 'dilaporkan', 16, 2),
    (50, 'Lampu lalu lintas mati',
         'APILL di persimpangan mati total, lalu lintas diatur petugas manual.',
         'lainnya', -6.342000, 106.744500, 'selesai', 18, 19)
)
insert into reports (
  id, user_id, title, description, category,
  photo_url, latitude, longitude, status, vote_count, created_at
)
select
  ('00000000-0000-4000-8000-' || lpad(to_hex(line), 12, '0'))::uuid,
  ('11111111-1111-4111-8111-' || lpad(to_hex((line % 5) + 1), 12, '0'))::uuid,
  title,
  descr,
  category,
  null,
  lat,
  lng,
  status,
  votes,
  now() - make_interval(days => days_ago, mins => (line * 37) % 1440)
from src;

-- Riwayat status untuk laporan yang sudah diproses
insert into status_logs (report_id, old_status, new_status, changed_at)
select
  id,
  'dilaporkan',
  'diproses',
  least(created_at + interval '36 hours', now() - interval '2 hours')
from reports
where id::text like '00000000-0000-4000-8000-%'
  and status <> 'dilaporkan';

-- Riwayat penyelesaian
insert into status_logs (report_id, old_status, new_status, changed_at)
select
  id,
  'diproses',
  'selesai',
  least(created_at + interval '5 days', now() - interval '1 hour')
from reports
where id::text like '00000000-0000-4000-8000-%'
  and status = 'selesai';

-- ------------------------------------------------------------
-- Seed Persepsi Warga (~100 persepsi)
--
-- Persepsi disebarkan di 6 hotspot yang sama dengan laporan agar
-- AreaPulsePopup memiliki data bermakna. Beberapa persepsi terkait
-- report_id (report-linked), sisanya standalone.
-- ------------------------------------------------------------
with perc_src(line, lat, lng, sentiment, reason, days_ago) as (
  values
    -- Hotspot 1: Pasar Pamulang — dominan tidak nyaman (kotor, ramai)
    (1,   -6.342700, 106.738000, 'tidak_nyaman', 'kotor',             2),
    (2,   -6.342900, 106.738200, 'tidak_nyaman', 'ramai',             3),
    (3,   -6.342600, 106.737900, 'biasa',        'kotor',             5),
    (4,   -6.342800, 106.738150, 'tidak_nyaman', 'bising',            4),
    (5,   -6.343000, 106.738350, 'tidak_nyaman', 'ramai',             6),
    (6,   -6.342500, 106.737700, 'biasa',        null,                8),
    (7,   -6.342650, 106.738100, 'nyaman',       null,                10),
    (8,   -6.343100, 106.737600, 'tidak_nyaman', 'kotor',             1),
    (9,   -6.342750, 106.738250, 'nyaman',       null,                12),
    (10,  -6.342950, 106.737800, 'biasa',        'ramai',             3),
    (11,  -6.342850, 106.738400, 'tidak_nyaman', 'kotor',             7),
    (12,  -6.342400, 106.738050, 'biasa',        null,                9),
    (13,  -6.343050, 106.738100, 'tidak_nyaman', 'bising',            2),
    (14,  -6.342550, 106.737500, 'nyaman',       null,                15),
    (15,  -6.342700, 106.738300, 'biasa',        'lainnya',           11),

    -- Hotspot 2: Terminal Pamulang — campuran (jalan buruk, bising)
    (16,  -6.348600, 106.736100, 'tidak_nyaman', 'jalan_buruk',       3),
    (17,  -6.348900, 106.736300, 'tidak_nyaman', 'jalan_buruk',       5),
    (18,  -6.348700, 106.735900, 'biasa',        'bising',            4),
    (19,  -6.349100, 106.736500, 'tidak_nyaman', 'kurang_penerangan', 7),
    (20,  -6.348500, 106.736200, 'biasa',        'bising',            6),
    (21,  -6.348800, 106.736150, 'nyaman',       null,                14),
    (22,  -6.349000, 106.736400, 'tidak_nyaman', 'kurang_aman',       2),
    (23,  -6.348650, 106.735800, 'biasa',        'jalan_buruk',       8),
    (24,  -6.348950, 106.736600, 'tidak_nyaman', 'kurang_penerangan', 1),
    (25,  -6.348550, 106.736000, 'nyaman',       null,                10),
    (26,  -6.349200, 106.736700, 'biasa',        null,                9),
    (27,  -6.348750, 106.736250, 'tidak_nyaman', 'jalan_buruk',       3),
    (28,  -6.348450, 106.736350, 'biasa',        'bising',            13),

    -- Hotspot 3: Stasiun Pondok Ranji — campuran (kotor, ramai)
    (29,  -6.340100, 106.743500, 'tidak_nyaman', 'kotor',             3),
    (30,  -6.340200, 106.743700, 'tidak_nyaman', 'ramai',             4),
    (31,  -6.339900, 106.743300, 'biasa',        'ramai',             6),
    (32,  -6.340050, 106.743800, 'nyaman',       null,                11),
    (33,  -6.340300, 106.743600, 'tidak_nyaman', 'kotor',             2),
    (34,  -6.339950, 106.743450, 'biasa',        'lainnya',           8),
    (35,  -6.340150, 106.743900, 'tidak_nyaman', 'ramai',             5),
    (36,  -6.340000, 106.743200, 'nyaman',       null,                14),
    (37,  -6.340400, 106.743750, 'biasa',        'kotor',             7),
    (38,  -6.339800, 106.743700, 'tidak_nyaman', 'kotor',             1),
    (39,  -6.340250, 106.743350, 'biasa',        null,                12),
    (40,  -6.340350, 106.743950, 'tidak_nyaman', 'ramai',             3),

    -- Hotspot 4: Kawasan Puspitek — tidak nyaman (jalan buruk, kurang penerangan)
    (41,  -6.351100, 106.731300, 'tidak_nyaman', 'jalan_buruk',       4),
    (42,  -6.351300, 106.731500, 'tidak_nyaman', 'kurang_penerangan', 3),
    (43,  -6.351000, 106.731100, 'biasa',        'jalan_buruk',       7),
    (44,  -6.351450, 106.731600, 'tidak_nyaman', 'kurang_penerangan', 2),
    (45,  -6.351200, 106.731200, 'nyaman',       null,                15),
    (46,  -6.350900, 106.731400, 'biasa',        null,                9),
    (47,  -6.351350, 106.731150, 'tidak_nyaman', 'jalan_buruk',       1),
    (48,  -6.351150, 106.731500, 'biasa',        'kurang_penerangan', 11),
    (49,  -6.351500, 106.731400, 'tidak_nyaman', 'kurang_aman',       6),
    (50,  -6.351050, 106.731300, 'nyaman',       null,                13),
    (51,  -6.351250, 106.731050, 'biasa',        'jalan_buruk',       8),
    (52,  -6.351400, 106.731650, 'tidak_nyaman', 'kurang_penerangan', 5),

    -- Hotspot 5: Perumahan Benda Baru — campuran (banjir, kotor)
    (53,  -6.338400, 106.732700, 'tidak_nyaman', 'kotor',             3),
    (54,  -6.338600, 106.732900, 'tidak_nyaman', 'lainnya',           5),
    (55,  -6.338300, 106.732500, 'biasa',        'kotor',             7),
    (56,  -6.338700, 106.733000, 'nyaman',       null,                12),
    (57,  -6.338500, 106.732600, 'biasa',        null,                4),
    (58,  -6.338200, 106.732800, 'tidak_nyaman', 'kotor',             2),
    (59,  -6.338800, 106.733100, 'nyaman',       null,                10),
    (60,  -6.338350, 106.733050, 'biasa',        'lainnya',           6),
    (61,  -6.338450, 106.732550, 'tidak_nyaman', 'kotor',             1),
    (62,  -6.338650, 106.732700, 'biasa',        null,                8),

    -- Hotspot 6: Jl. Raya Pondok Aren — campuran (kurang penerangan, jalan buruk)
    (63,  -6.350400, 106.745500, 'tidak_nyaman', 'kurang_penerangan', 4),
    (64,  -6.350600, 106.745700, 'biasa',        'jalan_buruk',       6),
    (65,  -6.350500, 106.745400, 'tidak_nyaman', 'kurang_penerangan', 3),
    (66,  -6.350350, 106.745850, 'nyaman',       null,                11),
    (67,  -6.350700, 106.745450, 'tidak_nyaman', 'jalan_buruk',       2),
    (68,  -6.350450, 106.745650, 'biasa',        null,                9),
    (69,  -6.350550, 106.745700, 'nyaman',       null,                14),
    (70,  -6.350650, 106.745800, 'biasa',        'kurang_penerangan', 7),
    (71,  -6.350800, 106.745500, 'tidak_nyaman', 'kurang_aman',       1),
    (72,  -6.350300, 106.745600, 'biasa',        'jalan_buruk',       10),

    -- Sebaran acak — persepsi netral/nyaman di area lain
    (73,  -6.347000, 106.741500, 'biasa',        null,                5),
    (74,  -6.347200, 106.741300, 'nyaman',       null,                8),
    (75,  -6.346800, 106.741700, 'biasa',        'ramai',             3),
    (76,  -6.345800, 106.739400, 'nyaman',       null,                7),
    (77,  -6.345600, 106.739200, 'biasa',        null,                12),
    (78,  -6.346000, 106.739600, 'nyaman',       null,                4),
    (79,  -6.344000, 106.740000, 'biasa',        'lainnya',           6),
    (80,  -6.344200, 106.740200, 'nyaman',       null,                9),
    (81,  -6.343800, 106.739800, 'biasa',        null,                11),
    (82,  -6.343600, 106.736000, 'biasa',        'bising',            2),
    (83,  -6.343400, 106.735800, 'nyaman',       null,                13),
    (84,  -6.346500, 106.744000, 'biasa',        null,                7),
    (85,  -6.346700, 106.744200, 'nyaman',       null,                10),
    (86,  -6.346300, 106.743800, 'biasa',        'ramai',             4),
    (87,  -6.345000, 106.742000, 'nyaman',       null,                6),
    (88,  -6.345200, 106.742200, 'biasa',        null,                15),
    (89,  -6.344800, 106.741800, 'nyaman',       null,                8),
    (90,  -6.342000, 106.744500, 'biasa',        null,                5),
    (91,  -6.342200, 106.744700, 'nyaman',       null,                11),
    (92,  -6.341800, 106.744300, 'biasa',        'lainnya',           3),
    (93,  -6.341000, 106.747000, 'nyaman',       null,                9),
    (94,  -6.341200, 106.747200, 'biasa',        null,                7),
    (95,  -6.340800, 106.746800, 'nyaman',       null,                14),

    -- Beberapa persepsi dengan catatan
    (96,  -6.342700, 106.738100, 'tidak_nyaman', 'kotor',             1),
    (97,  -6.348600, 106.736100, 'tidak_nyaman', 'jalan_buruk',       2),
    (98,  -6.340100, 106.743500, 'tidak_nyaman', 'ramai',             4),
    (99,  -6.351100, 106.731300, 'tidak_nyaman', 'kurang_penerangan', 3),
    (100, -6.338400, 106.732700, 'biasa',        'kotor',             5)
)
insert into perceptions (
  id, user_id, latitude, longitude, sentiment, reason,
  note, photo_url, report_id, created_at
)
select
  ('22222222-2222-4222-8222-' || lpad(to_hex(line), 12, '0'))::uuid,
  ('11111111-1111-4111-8111-' || lpad(to_hex((line % 5) + 1), 12, '0'))::uuid,
  lat,
  lng,
  sentiment,
  reason,
  case
    when line in (1, 8, 96) then 'Sampah menumpuk di area ini'
    when line in (16, 17, 97) then 'Lubang jalan sangat berbahaya'
    when line in (29, 30, 98) then 'Terlalu ramai dan kotor'
    when line in (41, 42, 99) then 'Minim penerangan malam hari'
    when line in (53, 54, 100) then 'Genangan air masih tersisa'
    when line in (63, 65) then 'Lampu jalan padam'
    when line in (24, 44) then 'Sangat gelap, hampir tidak bisa lewat'
    when line in (35, 40) then 'Lalu lintas macet total'
    else null
  end,
  null,  -- photo_url: tidak perlu foto seed
  case
    when line in (1, 16, 29, 41, 53, 63)
      then ('00000000-0000-4000-8000-' || lpad(to_hex(((line - 1) % 50) + 1), 12, '0'))::uuid
    else null
  end,
  now() - make_interval(days => days_ago, mins => (line * 23) % 1440)
from perc_src;

commit;
