-- =====================================================================
--  SKEMA SUPABASE - Kwitansi HDI (Yayasan Pendidikan HAS Darul Ilmi)
--  Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
--  Aman dijalankan berulang kali (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Daftar pembayaran / produk (di aplikasi: array P)
create table if not exists public.produk (
  id        uuid primary key default gen_random_uuid(),
  urutan    integer     not null default 0,      -- urutan tampil di aplikasi
  nama      text        not null,
  kelas     text        not null default '',     -- '' = semua kelas, atau 'Kelas 1A'..'Kelas 6B'
  harga     bigint      not null default 0 check (harga >= 0),
  stok      integer     not null default 0,      -- belum dipakai aplikasi, disimpan agar data tidak hilang
  ikon      text        not null default '',
  dibuat    timestamptz not null default now(),
  diubah    timestamptz not null default now()
);
create index if not exists produk_urutan_idx on public.produk (urutan);

-- Daftar nama siswa / penerima (di aplikasi: array NM)
create table if not exists public.siswa (
  id        uuid primary key default gen_random_uuid(),
  nama      text        not null,                -- disimpan HURUF BESAR
  kelas     text        not null default '',
  dibuat    timestamptz not null default now(),
  diubah    timestamptz not null default now()
);
create index if not exists siswa_nama_idx on public.siswa (lower(nama));

-- Riwayat transaksi / kwitansi (di aplikasi: array TX)
create table if not exists public.transaksi (
  id        uuid primary key default gen_random_uuid(),
  ts        bigint      not null unique,         -- waktu transaksi (ms) dari aplikasi, mencegah data ganda
  waktu     timestamptz not null default now(),
  penerima  text        not null default '',     -- "dari" di kwitansi
  kelas     text        not null default '',
  kota      text        not null default '',
  tgl       text        not null default '',     -- tanggal sebagaimana tercetak di kwitansi
  petugas   text        not null default '',
  catatan   text        not null default '',
  diskon    bigint      not null default 0,
  total     bigint      not null default 0,
  dibayar   bigint      not null default 0,
  metode    text        not null default 'Tunai',
  dibuat    timestamptz not null default now()
);
create index if not exists transaksi_waktu_idx    on public.transaksi (waktu desc);
create index if not exists transaksi_penerima_idx on public.transaksi (lower(penerima));

-- Rincian baris pada tiap kwitansi
create table if not exists public.transaksi_item (
  id            uuid primary key default gen_random_uuid(),
  transaksi_id  uuid    not null references public.transaksi (id) on delete cascade,
  urutan        integer not null default 0,
  nama          text    not null,
  nominal       bigint  not null default 0       -- jumlah rupiah (harga x qty)
);
create index if not exists transaksi_item_trx_idx on public.transaksi_item (transaksi_id);

-- ---------------------------------------------------------------------
-- 2. KOLOM "diubah" OTOMATIS
-- ---------------------------------------------------------------------
create or replace function public.set_diubah()
returns trigger language plpgsql as $$
begin
  new.diubah := now();
  return new;
end $$;

drop trigger if exists produk_diubah on public.produk;
create trigger produk_diubah before update on public.produk
  for each row execute function public.set_diubah();

drop trigger if exists siswa_diubah on public.siswa;
create trigger siswa_diubah before update on public.siswa
  for each row execute function public.set_diubah();

-- ---------------------------------------------------------------------
-- 3. KEAMANAN (Row Level Security)
--    Hanya pengguna yang sudah LOGIN (role "authenticated") yang boleh
--    membaca/menulis. Pengunjung tanpa login (role "anon") tidak dapat apa-apa.
--    Buat akun petugas di: Dashboard > Authentication > Users > Add user.
-- ---------------------------------------------------------------------
alter table public.produk         enable row level security;
alter table public.siswa          enable row level security;
alter table public.transaksi      enable row level security;
alter table public.transaksi_item enable row level security;

drop policy if exists "petugas akses penuh" on public.produk;
create policy "petugas akses penuh" on public.produk
  for all to authenticated using (true) with check (true);

drop policy if exists "petugas akses penuh" on public.siswa;
create policy "petugas akses penuh" on public.siswa
  for all to authenticated using (true) with check (true);

drop policy if exists "petugas akses penuh" on public.transaksi;
create policy "petugas akses penuh" on public.transaksi
  for all to authenticated using (true) with check (true);

drop policy if exists "petugas akses penuh" on public.transaksi_item;
create policy "petugas akses penuh" on public.transaksi_item
  for all to authenticated using (true) with check (true);

-- Lapis kedua: cabut hak akses role anon sama sekali
revoke all on public.produk, public.siswa, public.transaksi, public.transaksi_item from anon;
revoke all on public.produk, public.siswa, public.transaksi, public.transaksi_item from public;
grant select, insert, update, delete on public.produk, public.siswa, public.transaksi, public.transaksi_item to authenticated;

-- ---------------------------------------------------------------------
-- 4. FUNGSI (dipanggil aplikasi lewat supabase.rpc) - atomik dalam 1 transaksi
-- ---------------------------------------------------------------------

-- Ganti seluruh daftar produk sekaligus. Input: array JSON [{n,c,h,s,i}, ...]
create or replace function public.ganti_produk(items jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare jumlah integer;
begin
  if auth.uid() is null then raise exception 'Login petugas diperlukan'; end if;
  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'items harus berupa array JSON';
  end if;
  delete from public.produk where true;
  insert into public.produk (urutan, nama, kelas, harga, stok, ikon)
  select (o - 1)::int,
         coalesce(x->>'n', ''),
         coalesce(x->>'c', ''),
         coalesce(round((x->>'h')::numeric)::bigint, 0),
         coalesce((x->>'s')::numeric::int, 0),
         coalesce(x->>'i', '')
  from jsonb_array_elements(items) with ordinality as t(x, o);
  get diagnostics jumlah = row_count;
  return jumlah;
end $$;

-- Ganti seluruh daftar siswa sekaligus. Input: array JSON [{n,c}, ...]
create or replace function public.ganti_siswa(items jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare jumlah integer;
begin
  if auth.uid() is null then raise exception 'Login petugas diperlukan'; end if;
  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'items harus berupa array JSON';
  end if;
  delete from public.siswa where true;
  insert into public.siswa (nama, kelas)
  select upper(coalesce(x->>'n', '')), coalesce(x->>'c', '')
  from jsonb_array_elements(items) as t(x)
  where coalesce(x->>'n', '') <> '';
  get diagnostics jumlah = row_count;
  return jumlah;
end $$;

-- Simpan satu transaksi beserta rinciannya. Input: objek JSON seperti isi TX di aplikasi.
-- Mengembalikan id transaksi; ts yang sama memperbarui transaksi beserta rinciannya.
create or replace function public.simpan_transaksi(t jsonb)
returns uuid
language plpgsql
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Login petugas diperlukan'; end if;
  insert into public.transaksi
    (ts, waktu, penerima, kelas, kota, tgl, petugas, catatan, diskon, total, dibayar, metode)
  values (
    (t->>'ts')::bigint,
    to_timestamp(((t->>'ts')::bigint) / 1000.0),
    coalesce(t->>'dari', ''),
    coalesce(t->>'c', ''),
    coalesce(t->>'kota', ''),
    coalesce(t->>'tgl', ''),
    coalesce(t->>'ttd', ''),
    coalesce(t->>'cat', ''),
    coalesce(round((t->>'disc')::numeric)::bigint, 0),
    coalesce(round((t->>'total')::numeric)::bigint, 0),
    coalesce(round((t->>'paid')::numeric)::bigint, 0),
    coalesce(t->>'met', 'Tunai')
  )
  on conflict (ts) do update set
    waktu = excluded.waktu, penerima = excluded.penerima, kelas = excluded.kelas,
    kota = excluded.kota, tgl = excluded.tgl, petugas = excluded.petugas,
    catatan = excluded.catatan, diskon = excluded.diskon, total = excluded.total,
    dibayar = excluded.dibayar, metode = excluded.metode
  returning id into v_id;

  delete from public.transaksi_item where transaksi_id = v_id;
  insert into public.transaksi_item (transaksi_id, urutan, nama, nominal)
  select v_id,
         (o - 1)::int,
         coalesce(x->>'n', ''),
         coalesce(round((x->>'a')::numeric)::bigint, 0)
  from jsonb_array_elements(coalesce(t->'items', '[]'::jsonb)) with ordinality as i(x, o);

  return v_id;
end $$;

-- Hanya pengguna login yang boleh menjalankan fungsi
revoke execute on function public.ganti_produk(jsonb)     from public, anon;
revoke execute on function public.ganti_siswa(jsonb)      from public, anon;
revoke execute on function public.simpan_transaksi(jsonb) from public, anon;
grant  execute on function public.ganti_produk(jsonb)     to authenticated;
grant  execute on function public.ganti_siswa(jsonb)      to authenticated;
grant  execute on function public.simpan_transaksi(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 5. LAPORAN HARIAN (opsional, untuk dilihat di Table Editor / dashboard)
--    security_invoker = RLS tetap berlaku pada view ini.
-- ---------------------------------------------------------------------
create or replace view public.laporan_harian
with (security_invoker = true) as
select (waktu at time zone 'Asia/Jakarta')::date as tanggal,
       metode,
       count(*)    as jumlah_transaksi,
       sum(total)  as total_masuk,
       sum(diskon) as total_diskon
from public.transaksi
group by 1, 2
order by 1 desc, 2;

-- ---------------------------------------------------------------------
-- 6. DATA AWAL PRODUK (hanya diisi jika tabel produk masih kosong)
-- ---------------------------------------------------------------------
insert into public.produk (urutan, nama, kelas, harga, stok, ikon)
select * from (values
  (0, 'Pendaftaran siswa baru SD HAS DARUL ILMI tahun pelajaran 2026-2027', '', 700000, 0, '📜'),
  (1, 'Uang pangkal', '', 14000000, 0, '🏫'),
  (2, 'Uang buku', '', 0, 0, '📚'),
  (3, 'Spp bulan juli', '', 500000, 0, '💳'),
  (4, 'Uang kegiatan', '', 2000000, 0, '🎉'),
  (5, 'Uang seragam 3 stel', '', 0, 0, '👕'),
  (6, 'Uang seragam batik', '', 0, 0, '👕'),
  (7, 'Uang seragam hijau kotak', '', 0, 0, '👕'),
  (8, 'Uang seragam olahraga', '', 0, 0, '👟'),
  (9, 'Uang spp', '', 0, 0, '💳'),
  (10, 'Uang eskul tari', '', 0, 0, '💃'),
  (11, 'Uang eskul silat', '', 0, 0, '🥋'),
  (12, 'Uang eskul karate', '', 0, 0, '🥋'),
  (13, 'Uang eskul futsal', '', 0, 0, '⚽'),
  (14, 'Uang eskul bulutangkis', '', 0, 0, '🏸'),
  (15, 'Uang eskul tahfidz', '', 0, 0, '📖'),
  (16, 'Uang eskul renang', '', 0, 0, '🏊'),
  (17, 'Uang eskul animasi coding', '', 0, 0, '💻'),
  (18, 'Uang eskul desain grafis', '', 0, 0, '🎨'),
  (19, 'Uang eskul inggris club', '', 0, 0, '🗣️'),
  (20, 'Uang eskul robotik', '', 0, 0, '🤖'),
  (21, 'Uang eskul komik', '', 0, 0, '🖍️')
) as v(urutan, nama, kelas, harga, stok, ikon)
where not exists (select 1 from public.produk);


-- Hak akses view laporan: hanya petugas yang sudah login.
revoke all on public.laporan_harian from public, anon;
grant select on public.laporan_harian to authenticated;


-- ---------------------------------------------------------------------
-- 7. CATATAN PENGHAPUSAN TRANSAKSI (ANTI-RESURRECTION ANTAR PERANGKAT)
--    Tanda hapus dipertahankan agar perangkat yang masih menyimpan cache lama
--    tidak dapat mengunggah kembali kwitansi yang sudah dihapus.
-- ---------------------------------------------------------------------
create table if not exists public.transaksi_hapus_log (
  ts bigint primary key,
  dihapus_pada timestamptz not null default now()
);
alter table public.transaksi_hapus_log enable row level security;
drop policy if exists "petugas akses penuh" on public.transaksi_hapus_log;
create policy "petugas akses penuh" on public.transaksi_hapus_log
  for all to authenticated using (true) with check (true);
revoke all on public.transaksi_hapus_log from anon, public;
grant select, insert, update, delete on public.transaksi_hapus_log to authenticated;

-- Catat tanda hapus dan hapus transaksi dalam satu transaksi database.
create or replace function public.hapus_transaksi(ts_list bigint[])
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare jumlah integer;
begin
  if auth.uid() is null then raise exception 'Login petugas diperlukan'; end if;
  if ts_list is null or cardinality(ts_list) = 0 then return 0; end if;

  insert into public.transaksi_hapus_log (ts)
  select distinct unnest(ts_list)
  on conflict (ts) do nothing;

  delete from public.transaksi where ts = any(ts_list);
  get diagnostics jumlah = row_count;
  return jumlah;
end $$;

revoke execute on function public.hapus_transaksi(bigint[]) from public, anon;
grant execute on function public.hapus_transaksi(bigint[]) to authenticated;
