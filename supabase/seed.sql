-- ============================================================
-- SigapKota — Seeder Data Demo (~50 laporan + akun demo)
--
-- Cara pakai:
--   Supabase Dashboard > SQL Editor > paste seluruh file > Run.
--
-- Catatan:
-- - Idempotent: boleh dijalankan berulang. Laporan dengan pola ID
--   '00000000-0000-4000-8000-*' dan akun demo pola
--   '11111111-1111-4111-8111-*' dihapus dulu, lalu dibuat ulang
--   (votes dan status_logs ikut terhapus via ON DELETE CASCADE).
-- - Membuat 6 akun demo (password semua: sigap123):
--     warga1..warga5@sigapkota.id  -> role user
--     admin@sigapkota.id           -> role admin (langsung bisa /admin)
-- - 50 laporan dipasangkan bergiliran ke warga1..warga5.
-- - photo_url NULL; UI sudah menangani foto kosong.
-- - Titik disebar di area Pamulang, Tangerang Selatan (pusat peta
--   default aplikasi), dengan beberapa hotspot agar heatmap
--   terlihat jelas.
-- - Pasangan laporan berjarak < 100 m dengan kategori sama
--   (baris 1-2 dan 9-10) untuk mendemokan duplicate detection.
-- ============================================================

create extension if not exists pgcrypto;

begin;

-- ------------------------------------------------------------
-- Bersihkan data seed sebelumnya
-- ------------------------------------------------------------
delete from reports
where id::text like '00000000-0000-4000-8000-%';

delete from auth.identities
where user_id::text like '11111111-1111-4111-8111-%';

delete from auth.users
where id::text like '11111111-1111-4111-8111-%';

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
  user_id, provider_id, identity_data, last_sign_in_at, created_at, updated_at
)
select
  id,
  'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(),
  now(),
  now()
from auth.users
where id::text like '11111111-1111-4111-8111-%';

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

commit;
