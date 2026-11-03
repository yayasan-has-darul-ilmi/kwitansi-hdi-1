-- MIGRASI WAJIB UNTUK KWITANSI HDI VERSI PERBAIKAN
-- Jalankan satu kali di Supabase Dashboard > SQL Editor > New query > Run.
-- Tidak menghapus transaksi yang sudah ada.

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
