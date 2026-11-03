/* Kwitansi HDI - konektor Supabase v2. Isi URL/key project milik Anda jika berbeda. */
var SUPABASE_URL = 'https://mnsnfjwtcdmipcijdagm.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_V3IwENu2-WtJwG3xF7dlog_CQEQDe5M';

/*
 * PEMETAAN USERNAME -> EMAIL SUPABASE
 * Username hanya nama login yang ditampilkan ke petugas; autentikasi tetap
 * dilakukan Supabase dengan email/password. Ganti contoh di bawah dengan akun
 * yang benar-benar dibuat di Supabase > Authentication > Users.
 * Tambahkan satu baris per petugas. Username tidak peka huruf besar/kecil.
 * Jangan pernah menaruh password di file ini.
 */
var HDI_USERNAME_MAP = {
  'kwitansihdi': 'kwitansihdi@gmail.com',
  'yyshdi179': 'yyshdi179@gmail.com'
};

var HDIDB = (function () {
  var client = null;
  var knownTs = new Set();
  function db() {
    if (!window.supabase || !window.supabase.createClient) throw new Error('Library Supabase belum dimuat. Periksa koneksi internet.');
    if (!client) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: window.sessionStorage, storageKey: 'hdi-supabase-auth-session' }
    });
    return client;
  }
  function ok(r) { if (r.error) throw r.error; return r.data; }
  async function semua(queryFactory) {
    var out = [], start = 0, size = 1000;
    for (;;) { var rows = ok(await queryFactory().range(start, start + size - 1)); out = out.concat(rows || []); if (!rows || rows.length < size) break; start += size; }
    return out;
  }
  function localArray(key) { try { var x = JSON.parse(localStorage.getItem(key)); return Array.isArray(x) ? x : []; } catch (_) { return []; } }
  function emailDariUsername(username) {
    var key = String(username || '').trim().toLowerCase();
    var email = HDI_USERNAME_MAP[key];
    if (!email || /ganti-email|contoh\.com/i.test(email)) {
      throw new Error('Username belum dikonfigurasi di HDI_USERNAME_MAP pada supabase.js.');
    }
    return String(email).trim().toLowerCase();
  }
  async function masukDenganUsername(username, password) {
    var email = emailDariUsername(username);
    return ok(await db().auth.signInWithPassword({ email: email, password: password }));
  }
  async function verifikasiKunciDataDenganUsername(username, password) {
    var email = emailDariUsername(username);
    return verifikasiKunciData(email, password);
  }
  // Verifikasi akun khusus Kunci Data melalui client terpisah agar tidak mengganti sesi login utama.
  async function verifikasiKunciData(email, password) {
    if (!window.supabase || !window.supabase.createClient) throw new Error('Library Supabase belum dimuat.');
    // Tolak akun yang sama dengan akun login kasir utama. Kunci Data wajib memakai
    // akun Supabase yang berbeda. Ini adalah pembatasan antarmuka; otorisasi database
    // tetap harus ditegakkan di RLS/server untuk keamanan yang sesungguhnya.
    var mainSession = await sesi();
    var mainEmail = mainSession && mainSession.user && mainSession.user.email
      ? String(mainSession.user.email).trim().toLowerCase() : '';
    var unlockEmail = String(email || '').trim().toLowerCase();
    if (mainEmail && unlockEmail === mainEmail) {
      throw new Error('Akun Kunci Data harus berbeda dari akun login kasir.');
    }
    var verifier = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    try {
      var result = await verifier.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      return { email: result.data.user && result.data.user.email };
    } finally {
      // Hapus sesi sementara; tidak menyentuh sesi utama aplikasi.
      try { await verifier.auth.signOut({ scope: 'local' }); } catch (_) {}
    }
  }
  // Logout eksplisit menghapus sesi Supabase dari penyimpanan sesi tab tanpa bergantung pada jaringan.
  async function keluar() { var r = await db().auth.signOut({ scope: 'local' }); if (r.error) throw r.error; }
  async function sesi() { return ok(await db().auth.getSession()).session; }
  async function ambilProduk() {
    var rows = await semua(function () { return db().from('produk').select('nama,kelas,harga,stok,ikon').order('urutan'); });
    return rows.map(function (r) { return { n:r.nama, c:r.kelas, h:Number(r.harga), s:Number(r.stok || 0), i:r.ikon || '' }; });
  }
  async function simpanProduk(P) { return ok(await db().rpc('ganti_produk', { items: P })); }
  async function ambilSiswa() {
    var rows = await semua(function () { return db().from('siswa').select('nama,kelas').order('nama'); });
    return rows.map(function (r) { return { n:r.nama, c:r.kelas || '' }; });
  }
  async function simpanSiswa(NM) { return ok(await db().rpc('ganti_siswa', { items: NM.map(function(x){ return typeof x === 'string' ? {n:x,c:''} : x; }) })); }
  async function ambilTransaksi() {
    var rows = await semua(function () { return db().from('transaksi').select('ts,penerima,kelas,kota,tgl,petugas,catatan,diskon,total,dibayar,metode,transaksi_item(urutan,nama,nominal)').order('ts'); });
    return rows.map(function (r) {
      var items = (r.transaksi_item || []).slice().sort(function(a,b){ return a.urutan-b.urutan; });
      return { ts:Number(r.ts), dari:r.penerima, c:r.kelas, kota:r.kota, tgl:r.tgl, ttd:r.petugas, cat:r.catatan,
        items:items.map(function(x){return {n:x.nama,a:Number(x.nominal)};}), disc:Number(r.diskon), total:Number(r.total), paid:Number(r.dibayar), met:r.metode };
    });
  }
  async function simpanTransaksi(t) { return ok(await db().rpc('simpan_transaksi', { t:t })); }
  async function ambilTombstoneTransaksi() {
    var rows = await semua(function () { return db().from('transaksi_hapus_log').select('ts'); });
    return new Set(rows.map(function (r) { return Number(r.ts); }));
  }
  async function hapusTransaksi(tsList) {
    if (!tsList || !tsList.length) return;
    ok(await db().rpc('hapus_transaksi', { ts_list: tsList.map(Number) }));
    tsList.forEach(function(ts){knownTs.delete(Number(ts));});
  }
  // Cloud adalah sumber data utama. Cache lokal TIDAK PERNAH otomatis
  // diunggah ketika tabel cloud kosong, karena cache perangkat lain bisa
  // berisi transaksi/nama yang sudah sengaja dihapus.
  async function siapkanData(local) {
    // Simpan salinan pemulihan lokal sekali jika cloud kosong, tanpa mengunggahnya.
    var cloudP = await ambilProduk();
    var cloudN = await ambilSiswa();
    var tombstones = await ambilTombstoneTransaksi();
    var cloudTx = await ambilTransaksi();
    cloudTx = cloudTx.filter(function (t) { return !tombstones.has(Number(t.ts)); });

    var localHasData = (local && ((local.produk || []).length || (local.siswa || []).length || (local.transaksi || []).length));
    if (localHasData && !localStorage.getItem('hdi_pre_cloud_backup')) {
      try {
        localStorage.setItem('hdi_pre_cloud_backup', JSON.stringify({
          dibuat: new Date().toISOString(),
          produk: local.produk || localArray('hdi_p2'),
          siswa: local.siswa || localArray('hdi_names'),
          transaksi: local.transaksi || localArray('hdi_tx')
        }));
      } catch (_) {}
    }
    knownTs = new Set(cloudTx.map(function (t) { return Number(t.ts); }));
    return { produk: cloudP, siswa: cloudN, transaksi: cloudTx };
  }
  async function sinkronkanTransaksi(list) {
    // Selalu baca tanda hapus cloud SEBELUM upload. Ini mencegah perangkat
    // yang masih terbuka menghidupkan kembali transaksi yang sudah dihapus.
    var tombstones = await ambilTombstoneTransaksi();
    var safeList = (list || []).filter(function (t) { return !tombstones.has(Number(t.ts)); });
    var now = new Set(safeList.map(function(t){return Number(t.ts);}));
    for (var i=0; i<safeList.length; i++) await simpanTransaksi(safeList[i]);
    var removed = Array.from(knownTs).filter(function(ts){return !now.has(ts);});
    if (removed.length) await hapusTransaksi(removed);
    knownTs = now;
    return safeList;
  }
  async function unggahDariLocal() {
    var p=localArray('hdi_p2'), n=localArray('hdi_names'), tx=localArray('hdi_tx');
    if (p.length) await simpanProduk(p); if (n.length) await simpanSiswa(n);
    var tombstones = await ambilTombstoneTransaksi();
    var safeTx = tx.filter(function (t) { return !tombstones.has(Number(t.ts)); });
    for (var i=0;i<safeTx.length;i++) await simpanTransaksi(safeTx[i]);
    return {produk:p.length,siswa:n.length,transaksi:safeTx.length};
  }
  async function unduhKeLocal() {
    var data=await siapkanData({produk:localArray('hdi_p2'),siswa:localArray('hdi_names'),transaksi:localArray('hdi_tx')});
    localStorage.setItem('hdi_p2',JSON.stringify(data.produk)); localStorage.setItem('hdi_names',JSON.stringify(data.siswa)); localStorage.setItem('hdi_tx',JSON.stringify(data.transaksi));
    return {produk:data.produk.length,siswa:data.siswa.length,transaksi:data.transaksi.length};
  }
  return {emailDariUsername:emailDariUsername,masukDenganUsername:masukDenganUsername,verifikasiKunciDataDenganUsername:verifikasiKunciDataDenganUsername,verifikasiKunciData:verifikasiKunciData,keluar:keluar,sesi:sesi,ambilProduk:ambilProduk,simpanProduk:simpanProduk,ambilSiswa:ambilSiswa,simpanSiswa:simpanSiswa,
    ambilTransaksi:ambilTransaksi,simpanTransaksi:simpanTransaksi,hapusTransaksi:hapusTransaksi,ambilTombstoneTransaksi:ambilTombstoneTransaksi,sinkronkanTransaksi:sinkronkanTransaksi,
    siapkanData:siapkanData,unggahDariLocal:unggahDariLocal,unduhKeLocal:unduhKeLocal};
})();
