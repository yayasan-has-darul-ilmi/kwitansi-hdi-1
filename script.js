var $ = function (i) {
  return document.getElementById(i);
};

// Sinkronisasi cloud: perubahan lokal tetap disimpan agar aplikasi responsif/offline,
// lalu dikirim ke Supabase saat sesi petugas aktif.
var hdiCloudReady = false;
var hdiCloudQueue = Promise.resolve();
function hdiCloudJob(fn) {
  if (!hdiCloudReady || !window.HDIDB) return;
  hdiCloudQueue = hdiCloudQueue.then(fn).catch(function (err) {
    console.error('[Kwitansi HDI] Sinkronisasi Supabase gagal:', err);
    if (typeof toast === 'function') toast('Data lokal tersimpan, tetapi sinkronisasi cloud gagal. Periksa koneksi / sesi.');
  });
}
function hdiSyncProducts() { hdiCloudJob(function () { return HDIDB.simpanProduk(P); }); }
function hdiSyncNames() { hdiCloudJob(function () { return HDIDB.simpanSiswa(NM); }); }
function hdiSyncTransactions() {
  hdiCloudJob(async function () {
    var safe = await HDIDB.sinkronkanTransaksi(TX);
    // Jika perangkat ini masih menyimpan transaksi yang sudah dihapus dari
    // perangkat lain, buang dari cache lokal setelah tombstone cloud terbaca.
    if (Array.isArray(safe) && safe.length !== TX.length) {
      TX = safe;
      try { localStorage.setItem('hdi_tx', JSON.stringify(TX)); } catch (_) {}
      drawRiw();
    }
  });
}
function hdiApplyCloudState(data) {
  if (data && Array.isArray(data.produk)) P = norm(data.produk);
  if (data && Array.isArray(data.siswa)) NM = data.siswa.map(function (x) { return { n: String(x.n || '').toUpperCase(), c: x.c || '' }; });
  if (data && Array.isArray(data.transaksi)) TX = data.transaksi;
  try {
    localStorage.setItem('hdi_p2', JSON.stringify(P));
    localStorage.setItem('hdi_names', JSON.stringify(NM));
    localStorage.setItem('hdi_tx', JSON.stringify(TX));
  } catch (e) {}
  q = P.map(function () { return 0; });
  hdiCloudReady = true;
  draw(); drawProd(); drawNama(); drawRiw(); drawData(); render();
}

var KELAS = [];
var KELAS_TAMBAHAN = ['Pendaftaran Baru'];

for (var n = 1; n <= 6; n++) {
  ['A', 'B'].forEach(function (l) {
    KELAS.push('Kelas ' + n + l);
  });
}

function semuaKelas() {
  return KELAS_TAMBAHAN.concat(KELAS);
}

function kelasBerlaku(c) {
  return c == 'Semua' || KELAS_TAMBAHAN.indexOf(c) >= 0 || KELAS.indexOf(c) >= 0;
}

var kelasAktif = 'Semua';

try {
  var savedClass = localStorage.getItem('hdi_kelas');
  if (kelasBerlaku(savedClass)) {
    kelasAktif = savedClass;
  }
} catch (e) {}

function setKelas(c) {
  if (!kelasBerlaku(c)) {
    c = 'Semua';
  }
  kelasAktif = c;
  try {
    localStorage.setItem('hdi_kelas', c);
  } catch (e) {}
  var cur = $('kls').value;
  fillKls(cur);
  draw();
  drawProd();
  drawNama();
  drawRiw();
  drawData();
  render();
}

function norm(a) {
  a.forEach(function (p) {
    if (!kelasBerlaku(p.c)) {
      p.c = '';
    }
    if (p.n == 'Uang pangkal' && p.h == null) {
      p.h = 14000000;
    }
    if (p.n == 'Spp bulan juli' && p.h == null) {
      p.h = 500000;
    }
    if (p.n == 'Uang kegiatan' && p.h == null) {
      p.h = 2000000;
    }
  });
  return a;
}

var P0 = [
  { n: 'Pendaftaran siswa baru SD HAS DARUL ILMI tahun pelajaran 2026-2027', c: '', h: 700000, s: 0, i: '📜' },
  { n: 'Uang pangkal', c: '', h: 14000000, s: 0, i: '🏫' },
  { n: 'Uang buku', c: '', h: 0, s: 0, i: '📚' },
  { n: 'Spp bulan juli', c: '', h: 500000, s: 0, i: '💳' },
  { n: 'Uang kegiatan', c: '', h: 2000000, s: 0, i: '🎉' },
  { n: 'Uang seragam 3 stel', c: '', h: 0, s: 0, i: '👕' },
  { n: 'Uang seragam batik', c: '', h: 0, s: 0, i: '👕' },
  { n: 'Uang seragam hijau kotak', c: '', h: 0, s: 0, i: '👕' },
  { n: 'Uang seragam olahraga', c: '', h: 0, s: 0, i: '👟' },
  { n: 'Uang spp', c: '', h: 0, s: 0, i: '💳' },
  { n: 'Uang eskul tari', c: '', h: 0, s: 0, i: '💃' },
  { n: 'Uang eskul silat', c: '', h: 0, s: 0, i: '🥋' },
  { n: 'Uang eskul karate', c: '', h: 0, s: 0, i: '🥋' },
  { n: 'Uang eskul futsal', c: '', h: 0, s: 0, i: '⚽' },
  { n: 'Uang eskul bulutangkis', c: '', h: 0, s: 0, i: '🏸' },
  { n: 'Uang eskul tahfidz', c: '', h: 0, s: 0, i: '📖' },
  { n: 'Uang eskul renang', c: '', h: 0, s: 0, i: '🏊' },
  { n: 'Uang eskul animasi coding', c: '', h: 0, s: 0, i: '💻' },
  { n: 'Uang eskul desain grafis', c: '', h: 0, s: 0, i: '🎨' },
  { n: 'Uang eskul inggris club', c: '', h: 0, s: 0, i: '🗣️' },
  { n: 'Uang eskul robotik', c: '', h: 0, s: 0, i: '🤖' },
  { n: 'Uang eskul komik', c: '', h: 0, s: 0, i: '🖍️' }
];

var P = norm(load() || P0), q = P.map(function () {
    return 0;
  });

var GT = 0, MET = 'Tunai', PO = {}, NO = {};

function loadNames() {
  try {
    var v = JSON.parse(localStorage.getItem('hdi_names'));
    if (Array.isArray(v)) {
      return v.map(function (x) {
        x = typeof x == 'string' ? { n: x, c: '' } : x;
        x.n = String(x.n).toUpperCase();
        return x;
      });
    }
  } catch (e) {}
  return [];
}

var NM = loadNames();
var manualNameDraft = null;

function saveNames() {
  try { localStorage.setItem('hdi_names', JSON.stringify(NM)); } catch (e) {}
  hdiSyncNames();
}

function registerManualName(raw) {
  var n = String(raw || '').trim().toUpperCase();
  if (!n) {
    return;
  }
  var exists = NM.some(function (x) {
    return x.c == 'Pendaftaran Baru' && x.n.trim().toUpperCase() == n;
  });
  if (exists) {
    return;
  }
  NM.push({ n: n, c: 'Pendaftaran Baru' });
  saveNames();
  fillKls($('kls').value);
  drawNama();
}

function fillKls(cur) {
  // Tampilkan penerima hanya dari kelas yang sedang dipilih pada filter utama.
  // Pilihan Semua tetap menampilkan seluruh nama dari semua kelas.
  var seen = Object.create(null);
  var L = NM.filter(function (x) {
    if (kelasAktif != 'Semua' && x.c != kelasAktif) return false;
    var name = String(x && x.n || '').trim();
    var key = name.toLocaleUpperCase('id-ID');
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  }).sort(function (a, b) {
    return String(a.n).localeCompare(String(b.n), 'id-ID');
  });
  $('kls').innerHTML = '<option value="">Ketik nama manual</option>' + L.map(function (x) {
    return '<option value="' + esc(x.n) + '">' + esc(x.n) + '</option>';
  }).join('');
  $('kls').value = cur || '';
  if ($('kls').value !== (cur || '')) $('kls').value = '';
}

function up(el) {
  var a = el.selectionStart, b = el.selectionEnd;
  el.value = el.value.toUpperCase();
  try {
    el.setSelectionRange(a, b);
  } catch (e) {}
}

var CL = [], SEL = [], SELN = [], CM = 'copy', CT = 'p';

function coll() {
  return CT == 'n' ? NM : P;
}

var PEND = null, dx = '';

function stamp() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function saveBlob(name, blob) {
  var u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(u);
  }, 2000);
  toast('File ' + name + ' diunduh.');
}

function saveFile(name, text) {
  function fallback() {
    var b = new Blob([text], { type: 'application/octet-stream' }), u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(u);
    }, 2000);
    toast('File ' + name + ' diunduh.');
  }
  if (window.claude && claude.use) {
    claude.use('downloads').then(function (d) {
      if (!d) {
        fallback();
        return;
      }
      return d.save({ filename: name, data: text }).then(function () {
        toast('File ' + name + ' disimpan.');
      }, function (e) {
        if (!e || e.code != 'declined') {
          fallback();
        }
      });
    }, function () {
      fallback();
    });
  } else {
    fallback();
  }
}

function backup() {
  saveFile('cadangan-kwitansi-' + stamp() + '.json', JSON.stringify({
    app: 'kwitansi-hdi',
    v: 1,
    at: Date.now(),
    products: P,
    names: NM,
    tx: TX
  }, null, 1));
}

function exportExcel() {
  var rows = dataTableRows();
  if (!rows.length) {
    toast('Tidak ada data untuk diunduh ke Excel.');
    return;
  }
  var data = [['NO', 'TANGGAL & JAM', 'NAMA', 'KELAS', 'ITEM', 'HARGA (Rp)']];
  var total = 0;
  rows.forEach(function (o, i) {
    total += o.a;
    data.push([
      i + 1,
      o.d + ' ' + o.j,
      o.n,
      o.c || 'Tanpa kelas',
      o.i,
      o.a
    ]);
  });
  data.push(['', '', '', '', 'TOTAL', total]);
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/><style>td{padding:4px 8px;border:1px solid #000;}.t{mso-number-format:\"@\";}</style></head><body><table>' + data.map(function (r) {
    return '<tr>' + r.map(function (c) {
      var s = String(c == null ? '' : c);
      return '<td' + (typeof c == 'number' ? '' : ' class="t"') + '>' + s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + '</td>';
    }).join('') + '</tr>';
  }).join('') + '</table></body></html>';
  saveBlob('tabel-manajemen-data-' + stamp() + '.xls', new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' }));
}

function exportCsv() {
  var exportTx = TX.filter(matchesClass);
  if (!exportTx.length) {
    toast('Belum ada transaksi untuk kelas ini.');
    return;
  }
  var rows = [['Tanggal', 'Jam', 'Nama', 'Kelas', 'Item', 'Metode', 'Diskon', 'Total', 'Dibayar', 'Kembalian']];
  exportTx.forEach(function (t) {
    var d = new Date(t.ts);
    rows.push([
      t.tgl,
      ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2),
      t.dari,
      transactionClass(t),
      t.items.map(function (x) {
        return x.n + ' (' + x.a + ')';
      }).join('; '),
      t.met,
      t.disc || 0,
      t.total,
      t.paid,
      Math.max(t.paid - t.total, 0)
    ]);
  });
  var csv = '\ufeff' + rows.map(function (r) {
    return r.map(function (c) {
      var isNumber = typeof c === 'number';
      c = String(c == null ? '' : c);
      // Prevent spreadsheet formula execution for untrusted text cells.
      if (!isNumber && /^[\t\r ]*[=+@\-]/.test(c)) c = "'" + c;
      return /[",\n;]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
    }).join(',');
  }).join('\r\n');
  saveFile('riwayat-transaksi-' + stamp() + '.csv', csv);
}

var DSEL = [], DPK = [], DVIEW = false;

function cancelSelectedItems() {
  DSEL = [];
  drawData();
}

function toggleItemPick(i) {
  var name = DPK[i];
  if (!name) {
    return;
  }
  var idx = DSEL.indexOf(name);
  if (idx >= 0) {
    DSEL.splice(idx, 1);
  } else {
    DSEL.push(name);
  }
  drawData();
}

function removeSelectedItems() {
  if (!DSEL.length) {
    toast('Pilih item yang ingin dihapus terlebih dahulu.');
    return;
  }
  dk = 'selected';
  var label = DSEL.length > 1 ? DSEL.length + ' item terpilih' : DSEL[0];
  $('dtt').textContent = 'Hapus Item Terpilih?';
  $('dpre').textContent = 'Yakin ingin menghapus item';
  $('dn').textContent = ' ' + label + ' dari semua transaksi';
  $('dpost').textContent = '? Tindakan ini tidak bisa dibatalkan.';
  $('dok').textContent = 'Ya, Hapus';
  $('dmod').classList.add('on');
}

function applySelectedDelete() {
  for (var ti = TX.length - 1; ti >= 0; ti--) {
    var t = TX[ti], kept = [];
    for (var ii = 0; ii < t.items.length; ii++) {
      if (DSEL.indexOf(t.items[ii].n) >= 0) {
        continue;
      }
      kept.push(t.items[ii]);
    }
    if (!kept.length) {
      TX.splice(ti, 1);
      continue;
    }
    if (kept.length !== t.items.length) {
      t.items = kept;
      var sub = t.items.reduce(function (a, x) {
        return a + x.a;
      }, 0);
      t.disc = Math.min(t.disc || 0, sub);
      t.total = sub - t.disc;
    }
  }
  saveTx();
  DSEL = [];
  DVIEW = false;
  drawData();
  drawRiw();
  closeDel();
  toast('Item terpilih berhasil dihapus.');
}

function openItem(i) {
  DSEL = i < 0 ? [] : [DPK[i]];
  DVIEW = true;
  drawData();
}

function backPick() {
  DVIEW = false;
  DSEL = [];
  drawData();
}

function pickItem(i, on) {
  var n = DPK[i], k = DSEL.indexOf(n);
  if (on && k < 0) {
    DSEL.push(n);
  }
  if (!on && k >= 0) {
    DSEL.splice(k, 1);
  }
  drawData();
}

function pickAll(on) {
  DSEL = on ? DPK.slice() : [];
  drawData();
}

function hm(ts) {
  var d = new Date(ts);
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

function classOf(n) {
  n = String(n || '').toLowerCase();
  for (var i = 0; i < NM.length; i++) {
    if (NM[i].n.toLowerCase() == n) {
      return NM[i].c || '';
    }
  }
  return '';
}

function transactionClass(t) {
  return t.c || classOf(t.dari) || '';
}

function matchesClass(t) {
  return kelasAktif == 'Semua' || transactionClass(t) == kelasAktif;
}

function dataTableRows() {
  var k = ($('dcari').value || '').toLowerCase(), rows = [];
  TX.slice().reverse().forEach(function (t) {
    if (!matchesClass(t)) {
      return;
    }
    var c = transactionClass(t), time = hm(t.ts);
    t.items.forEach(function (x) {
      if (DSEL.length && DSEL.indexOf(x.n) < 0) {
        return;
      }
      if (k && (t.dari + ' ' + c + ' ' + x.n + ' ' + t.tgl + ' ' + time).toLowerCase().indexOf(k) < 0) {
        return;
      }
      rows.push({ d: t.tgl, j: time, n: t.dari, c: c, i: x.n, a: x.a });
    });
  });
  return rows;
}

function exportTableCsv() {
  var rows = dataTableRows();
  if (!rows.length) {
    toast('Tidak ada baris tabel untuk diekspor.');
    return;
  }
  var data = [['NO', 'TANGGAL & JAM', 'NAMA', 'KELAS', 'ITEM', 'HARGA']];
  var total = 0;
  rows.forEach(function (o, i) {
    total += o.a;
    data.push([
      i + 1,
      o.d + ' ' + o.j,
      o.n,
      o.c || 'Tanpa kelas',
      o.i,
      'Rp ' + fmt(o.a)
    ]);
  });
  data.push([
    '',
    '',
    '',
    '',
    'TOTAL',
    'Rp ' + fmt(total)
  ]);
  var csv = '\ufeff' + data.map(function (r) {
    return r.map(function (c) {
      var isNumber = typeof c === 'number';
      c = String(c == null ? '' : c);
      // Prevent spreadsheet formula execution for untrusted text cells.
      if (!isNumber && /^[\t\r ]*[=+@\-]/.test(c)) c = "'" + c;
      return /[",\n;]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
    }).join(',');
  }).join('\r\n');
  saveFile('tabel-manajemen-data-' + stamp() + '.csv', csv);
}

function copyTableToClipboard() {
  var rows = dataTableRows();
  if (!rows.length) {
    toast('Tidak ada baris tabel untuk disalin.');
    return;
  }
  var data = [['NO', 'TANGGAL & JAM', 'NAMA', 'KELAS', 'ITEM', 'HARGA (Rp)']], total = 0;
  rows.forEach(function (o, i) {
    total += o.a;
    data.push([
      i + 1,
      o.d + ' ' + o.j,
      o.n,
      o.c || 'Tanpa kelas',
      o.i,
      o.a
    ]);
  });
  data.push(['', '', '', '', 'TOTAL', total]);
  var text = data.map(function (r) {
    return r.map(function (c) {
      return String(c).replace(/[\t\r\n]+/g, ' ');
    }).join('\t');
  }).join('\r\n');
  function fallback() {
    var input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {}
    input.remove();
    toast(ok ? 'Tabel disalin. Tempelkan ke spreadsheet.' : 'Tidak bisa menyalin. Periksa izin clipboard browser.');
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      toast('Tabel disalin. Tempelkan ke spreadsheet.');
    }, fallback);
  } else {
    fallback();
  }
}

function drawData() {
  var pickerQuery = ($('dpickSearch').value || '').trim().toLowerCase(), rows = dataTableRows(), tot = 0;
  var cnt = {}, sum = {}, order = [];
  var scoped = TX.filter(matchesClass);
  scoped.forEach(function (t) {
    var seen = {};
    t.items.forEach(function (x) {
      sum[x.n] = (sum[x.n] || 0) + x.a;
      if (!seen[x.n]) {
        seen[x.n] = 1;
        cnt[x.n] = (cnt[x.n] || 0) + 1;
        if (order.indexOf(x.n) < 0) {
          order.push(x.n);
        }
      }
    });
  });
  function pi(n) {
    for (var j = 0; j < P.length; j++) {
      if (P[j].n == n) {
        return j;
      }
    }
    return 999;
  }
  order.sort(function (a, b) {
    return pi(a) - pi(b);
  });
  var visibleOrder = order.filter(function (n) {
    return !pickerQuery || n.toLowerCase().indexOf(pickerQuery) >= 0;
  });
  DPK = visibleOrder;
  DSEL = DSEL.filter(function (n) {
    return cnt[n];
  });
  $('dpickbox').style.display = DVIEW ? 'none' : '';
  $('dtview').style.display = DVIEW ? '' : 'none';
  function ic(n) {
    for (var j = 0; j < P.length; j++) {
      if (P[j].n == n) {
        return P[j].i;
      }
    }
    return '📄';
  }
  var arrow = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/><path d="M4.5 8h7M8.5 5l3 3-3 3" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function tile(c, big, lab, sm, icon, ft, idx) {
    var selected = idx >= 0 && DSEL.indexOf(lab) >= 0;
    var pickHtml = idx >= 0 ? '<button type="button" class="pick' + (selected ? ' on' : '') + '" aria-label="' + (selected ? 'Batalkan pilihan ' : 'Pilih ') + esc(lab) + '" title="' + (selected ? 'Batalkan pilihan' : 'Pilih item') + '" onclick="event.stopPropagation();toggleItemPick(' + idx + ')">' + (selected ? '✓' : '＋') + '</button>' : '';
    return '<div class="tile ' + c + '" role="button" tabindex="0" onclick="openItem(' + idx + ')" onkeydown="if(event.key==\'Enter\')openItem(' + idx + ')"><div class="tb"><b>' + big + '</b><span>' + esc(lab) + '</span><small>' + sm + '</small><i class="ti">' + esc(icon) + '</i></div><div class="tf' + (idx < 0 ? ' all' : '') + '"><span class="tf-label">' + ft + ' ' + arrow + '</span>' + pickHtml + '</div></div>';
  }
  var allSum = 0;
  order.forEach(function (n) {
    allSum += sum[n];
  });
  var allTile = pickerQuery ? '' : tile('c2', 'Rp ' + fmt(allSum), 'Semua Item', scoped.length + ' transaksi', '🧾', 'Tampilkan Semua', -1);
  $('dpick').innerHTML = visibleOrder.length ? allTile + visibleOrder.map(function (n, i) {
    return tile('c' + [0, 1, 3][i % 3], 'Rp ' + fmt(sum[n]), n, cnt[n] + ' transaksi', ic(n), 'Tampilkan Tabel', i);
  }).join('') : '<p class="empty">' + (pickerQuery ? 'Tidak ada item yang cocok.' : 'Belum ada item untuk kelas ini.') + '</p>';
  $('dtb').innerHTML = rows.map(function (o, n) {
    tot += o.a;
    return '<tr><td class="c">' + (n + 1) + '</td><td>' + esc(o.d || '') + ' ' + (o.j || '') + '</td><td>' + esc(o.n) + '</td><td>' + esc(o.c || 'Tanpa kelas') + '</td><td>' + esc(o.i) + '</td><td class="num">Rp ' + fmt(o.a) + '</td></tr>';
  }).join('') || '<tr><td colspan="6" class="c">' + (TX.length ? 'Tidak ada data yang cocok.' : 'Belum ada transaksi. Selesaikan pembayaran di halaman Kasir.') + '</td></tr>';
  $('dtf').innerHTML = rows.length ? '<tr><td colspan="5" class="num">TOTAL</td><td class="num">Rp ' + fmt(tot) + '</td></tr>' : '';
  var actions = $('dataActions');
  if (actions) {
    actions.style.display = DSEL.length ? 'flex' : 'none';
  }
  var delBtn = $('delSelBtn');
  if (delBtn) {
    delBtn.disabled = !DSEL.length;
    delBtn.textContent = DSEL.length ? 'Hapus Pilihan (' + DSEL.length + ')' : 'Hapus Pilihan';
  }
  var delAllBtn = $('delAllBtn');
  if (delAllBtn) {
    delAllBtn.disabled = !TX.length;
  }
}

function pickRestore(el) {
  var f = el.files && el.files[0];
  $('re').textContent = '';
  if (!f) {
    return;
  }
  var rd = new FileReader();
  rd.onload = function () {
    var d;
    try {
      d = JSON.parse(rd.result);
    } catch (e) {
      $('re').textContent = 'File tidak valid (bukan JSON).';
      el.value = '';
      return;
    }
    var ok = d && typeof d == 'object' && (Array.isArray(d.products) || Array.isArray(d.names) || Array.isArray(d.tx));
    if (ok && d.products && !d.products.every(function (p) {
        return p && typeof p.n == 'string';
      })) {
      ok = false;
    }
    if (ok && d.tx && !d.tx.every(function (t) {
        return t && Array.isArray(t.items) && typeof t.total == 'number';
      })) {
      ok = false;
    }
    if (!ok) {
      $('re').textContent = 'Isi file tidak dikenali sebagai cadangan Kwitansi.';
      el.value = '';
      return;
    }
    PEND = d;
    dk = 'r';
    di = -1;
    $('dtt').textContent = 'Pulihkan Data?';
    $('dpre').textContent = 'Data saat ini akan diganti dengan cadangan:';
    $('dn').textContent = (d.products ? d.products.length : '-') + ' pembayaran, ' + (d.names ? d.names.length : '-') + ' nama, ' + (d.tx ? d.tx.length : '-') + ' transaksi';
    $('dpost').textContent = '. Bagian yang tidak ada di file tidak diubah.';
    $('dok').textContent = 'Ya, Pulihkan';
    $('dmod').classList.add('on');
    el.value = '';
  };
  rd.readAsText(f);
}

function applyRestore() {
  var d = PEND;
  PEND = null;
  if (!d) {
    closeDel();
    return;
  }
  if (Array.isArray(d.products)) {
    P = d.products.map(function (p) {
      return {
        n: p.n,
        c: kelasBerlaku(p.c) ? p.c : '',
        h: Math.max(parseInt(p.h, 10) || 0, 0),
        s: 0,
        i: p.i || '📜'
      };
    });
    q = P.map(function () {
      return 0;
    });
    PO = {};
    NO = {};
    SEL = [];
    save();
  }
  if (Array.isArray(d.names)) {
    NM = d.names.map(function (x) {
      x = typeof x == 'string' ? { n: x, c: '' } : x;
      return {
        n: String(x.n).toUpperCase(),
        c: kelasBerlaku(x.c) ? x.c : ''
      };
    });
    SELN = [];
    saveNames();
    fillKls('');
  }
  if (Array.isArray(d.tx)) {
    TX = d.tx;
    saveTx();
  }
  closeDel();
  draw();
  drawProd();
  drawNama();
  drawRiw();
  drawData();
  render();
  toast('Data berhasil dipulihkan.');
}

function askWipe(k) {
  dx = k;
  dk = 'x';
  di = -1;
  if (k == 'tx') {
    $('dtt').textContent = 'Hapus Riwayat Transaksi?';
    $('dn').textContent = 'semua riwayat transaksi (' + TX.length + ')';
  } else if (k == 'names') {
    $('dtt').textContent = 'Hapus Semua Nama?';
    $('dn').textContent = 'semua nama (' + NM.length + ')';
  } else {
    $('dtt').textContent = 'Kembalikan Pembayaran ke Bawaan?';
    $('dpre').textContent = 'Yakin ingin mengembalikan';
    $('dn').textContent = 'daftar pembayaran ke bawaan';
    $('dpost').textContent = '? Semua perubahan pembayaran Anda akan hilang.';
    $('dok').textContent = 'Ya, Kembalikan';
  }
  $('dmod').classList.add('on');
}

function doWipe() {
  var k = dx, msg = '';
  if (k == 'tx') {
    TX = [];
    saveTx();
    msg = 'Riwayat transaksi dihapus.';
  } else if (k == 'names') {
    NM = [];
    SELN = [];
    saveNames();
    fillKls('');
    msg = 'Semua nama dihapus.';
  } else {
    P = norm(JSON.parse(JSON.stringify(P0)));
    q = P.map(function () {
      return 0;
    });
    PO = {};
    NO = {};
    SEL = [];
    save();
    msg = 'Pembayaran dikembalikan ke bawaan.';
  }
  closeDel();
  draw();
  drawProd();
  drawNama();
  drawRiw();
  drawData();
  render();
  toast(msg);
}

function loadTx() {
  try {
    var v = JSON.parse(localStorage.getItem('hdi_tx'));
    if (Array.isArray(v)) {
      return v;
    }
  } catch (e) {}
  return [];
}

var TX = loadTx();

function saveTx() {
  try { localStorage.setItem('hdi_tx', JSON.stringify(TX)); } catch (e) {}
  hdiSyncTransactions();
}

function fillReceipt(t) {
  $('pDari').textContent = t.dari;
  $('pKota').textContent = t.kota ? t.kota + ',' : '';
  $('pTgl').textContent = t.tgl;
  $('pTtd').textContent = t.ttd;
  $('pCat').textContent = t.cat;
  var h = '', rc = 0;
  function row(no, nm, amt) {
    rc++;
    return '<tr><td class="n">' + no + '</td><td>' + (nm || '&nbsp;') + '</td><td class="j">' + (amt !== '' ? '<div class="m"><span>Rp.</span><span>' + amt + '</span></div>' : '') + '</td></tr>';
  }
  t.items.forEach(function (x, i) {
    h += row(i + 1, esc(x.n), fmt(x.a));
  });
  if (t.disc) {
    h += row('', 'Diskon', '-' + fmt(t.disc));
  }
  while (rc < 6) {
    h += row('', '', '');
  }
  $('pRows').innerHTML = h;
  $('pTot').textContent = t.total ? fmt(t.total) : '-';
  $('pTerb').textContent = t.total ? cap(tb(t.total)) + ' Rupiah' : 'Nol Rupiah';
  $('pPay').style.display = t.paid ? 'flex' : 'none';
  $('pMet').textContent = t.met;
  $('pBy').textContent = fmt(t.paid);
  $('pKbl').textContent = 'Kembalian :';
  $('pKb').textContent = fmt(Math.max(t.paid - t.total, 0));
}

function getTtd() {
  return $('ttd').value || $('ttdManual').value.trim();
}

function setDefaultPetugas() {
  $('ttd').value = 'Herni';
  $('ttdManual').value = '';
}

function completeTx(by) {
  var items = [], sub = 0;
  P.forEach(function (p, i) {
    if (q[i]) {
      var a = price(i) * q[i];
      sub += a;
      items.push({
        n: nameOf(i),
        a: a
      });
    }
  });
  var dv = Math.min(parseInt($('disc').value, 10) || 0, sub);
  var penerima = $('pDari').textContent;
  var penerimaManual = !$('kls').value && $('dari').value.trim();
  var t = {
    ts: Date.now(),
    dari: penerima,
    c: penerimaManual ? 'Pendaftaran Baru' : classOf(penerima) || (kelasAktif == 'Semua' ? '' : kelasAktif),
    kota: $('kota').value,
    tgl: $('pTgl').textContent,
    ttd: getTtd(),
    cat: $('cat').value,
    items: items,
    disc: dv,
    total: GT,
    paid: by,
    met: MET
  };
  TX.push(t);
  saveTx();
  if (penerimaManual) {
    registerManualName(penerima);
  }
  $('dari').value = '';
  q = P.map(function () {
    return 0;
  });
  PO = {};
  NO = {};
  $('bayar').value = '';
  $('disc').value = '';
  $('cat').value = '';
  draw();
  render();
  fillReceipt(t);
  $('out').classList.remove('off');
  toast('Transaksi tersimpan di Riwayat Transaksi.');
}

function viewTx(i) {
  fillReceipt(TX[i]);
  $('out').classList.remove('off');
}

function delTx(i) {
  dk = 't';
  di = i;
  $('dtt').textContent = 'Hapus Transaksi?';
  $('dn').textContent = 'transaksi ' + TX[i].dari;
  $('dmod').classList.add('on');
}

function drawRiw() {
  var k = ($('rcari').value || '').toLowerCase();
  var L = TX.map(function (t, i) {
    return { t: t, i: i };
  }).reverse().filter(function (o) {
    return matchesClass(o.t) && (!k || (o.t.dari + ' ' + transactionClass(o.t) + ' ' + o.t.items.map(function (x) {
      return x.n;
    }).join(' ')).toLowerCase().indexOf(k) >= 0);
  });
  $('rtb').innerHTML = L.map(function (o) {
    var t = o.t, d = new Date(t.ts), hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    return '<tr><td>' + esc(t.tgl) + '<br><small style="opacity:.65">' + hm + '</small></td><td><b>' + esc(t.dari) + '</b></td><td class="itm">' + esc(t.items.map(function (x) {
      return x.n;
    }).join(', ')) + '</td><td>' + esc(t.met) + '</td><td>Rp ' + fmt(t.total) + '</td><td><button class="al" onclick="viewTx(' + o.i + ')">Lihat</button><button class="al d" onclick="delTx(' + o.i + ')">Hapus</button></td></tr>';
  }).join('') || '<tr><td colspan="6">' + (TX.length ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi. Selesaikan pembayaran di halaman Kasir.') + '</td></tr>';
}

function openCopy(i) {
  openCopyMany([P[i]]);
}

function exists(p, k) {
  return coll().some(function (x) {
    return x.n == p.n && x.c == k;
  });
}

function openCopyMany(list, mode, type) {
  CM = mode || 'copy';
  CT = type || 'p';
  CL = list.slice();
  var nm = CT == 'n' ? 'Nama' : 'Pembayaran';
  $('ct').textContent = CM == 'cut' ? 'Potong & Pindahkan ke Kelas' : 'Salin ' + nm + ' ke Kelas';
  $('cb').textContent = CM == 'cut' ? 'Pindahkan' : 'Salin';
  $('cl0').textContent = nm + ':';
  $('cpa').style.display = CM == 'cut' ? 'none' : '';
  $('cpl').textContent = CM == 'cut' ? 'Pilih satu kelas tujuan' : 'Pilih kelas tujuan';
  $('cn2').textContent = CL.length == 1 ? CL[0].n : CL.length + ' ' + nm.toLowerCase() + ' (' + CL.slice(0, 3).map(function (p) {
    return p.n;
  }).join(', ') + (CL.length > 3 ? ', ...' : '') + ')';
  $('cgrid').innerHTML = [''].concat(semuaKelas()).map(function (k) {
    var ex = CM == 'copy' && CL.every(function (p) {
      return exists(p, k);
    });
    return '<label class="ck"><input type="' + (CM == 'cut' ? 'radio' : 'checkbox') + '" name="kt" value="' + k + '"' + (ex ? ' disabled' : '') + '>' + (k || 'Tanpa kelas') + (ex ? ' ✓' : '') + '</label>';
  }).join('');
  $('ce').textContent = '';
  $('cmod').classList.add('on');
}

function closeCopy() {
  $('cmod').classList.remove('on');
}

function allCopy() {
  var bx = [].slice.call(document.querySelectorAll('#cgrid input:not(:disabled)'));
  var on = bx.some(function (b) {
    return !b.checked;
  });
  bx.forEach(function (b) {
    b.checked = on;
  });
}

function toast(t) {
  var e = $('toast');
  e.textContent = t;
  e.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(function () {
    e.style.display = 'none';
  }, 3500);
}

function clone(src, k) {
  var o = {};
  for (var a in src) {
    o[a] = src[a];
  }
  o.c = k;
  return o;
}

function doCopy() {
  var sel = [].slice.call(document.querySelectorAll('#cgrid input:checked')).map(function (b) {
    return b.value;
  });
  if (!sel.length) {
    $('ce').textContent = 'Pilih minimal satu kelas.';
    return;
  }
  var C = coll(), n = 0, nn = CT == 'n' ? 'nama' : 'pembayaran', isP = CT == 'p';
  if (CM == 'cut') {
    CL.forEach(function (src) {
      var keep = sel.indexOf(src.c) >= 0;
      sel.forEach(function (k) {
        if (k != src.c && !exists(src, k)) {
          C.push(clone(src, k));
          if (isP) {
            q.push(0);
          }
          n++;
        }
      });
      if (!keep) {
        var ix = C.indexOf(src);
        if (ix >= 0) {
          C.splice(ix, 1);
          if (isP) {
            q.splice(ix, 1);
          }
        }
      }
    });
  } else {
    sel.forEach(function (k) {
      CL.forEach(function (src) {
        if (!exists(src, k)) {
          C.push(clone(src, k));
          if (isP) {
            q.push(0);
          }
          n++;
        }
      });
    });
  }
  if (isP) {
    SEL = [];
    save();
    closeCopy();
    drawProd();
    draw();
    render();
  } else {
    SELN = [];
    saveNames();
    fillKls($('kls').value);
    closeCopy();
    drawNama();
    render();
  }
  toast(CM == 'cut' ? 'Berhasil memindahkan ' + CL.length + ' ' + nn + ' ke ' + sel.length + ' kelas.' : 'Berhasil menyalin ' + n + ' ' + nn + ' ke ' + sel.length + ' kelas.');
}

function visP() {
  return P.filter(function (p) {
    return kelasAktif == 'Semua' || p.c == kelasAktif;
  });
}

function drawBulk() {
  SEL = SEL.filter(function (p) {
    return P.indexOf(p) >= 0;
  });
  var n = SEL.length;
  $('bulk').innerHTML = n ? '<div class="bk"><b>' + n + ' pembayaran dipilih</b><span><button onclick="openCopyMany(SEL)">Salin ke kelas...</button><button class="cut" onclick="cutMany()">Potong ke kelas...</button><button class="dng" onclick="delMany()">Hapus</button><button class="pay2" style="margin:0" onclick="SEL=[];drawProd()">Batal pilih</button></span></div>' : '';
  var v = visP(), all = $('selall');
  if (all) {
    all.checked = v.length > 0 && v.every(function (p) {
      return SEL.indexOf(p) >= 0;
    });
  }
}

function visN() {
  return NM.filter(function (x) {
    return kelasAktif == 'Semua' || x.c == kelasAktif;
  });
}

function drawNBulk() {
  SELN = SELN.filter(function (p) {
    return NM.indexOf(p) >= 0;
  });
  var n = SELN.length;
  $('nbulk').innerHTML = n ? '<div class="bk"><b>' + n + ' nama dipilih</b><span><button onclick="copyN()">Salin ke kelas...</button><button class="cut" onclick="cutN()">Potong ke kelas...</button><button class="dng" onclick="delN()">Hapus</button><button class="pay2" style="margin:0" onclick="SELN=[];drawNama()">Batal pilih</button></span></div>' : '';
  var v = visN(), all = $('nselall');
  if (all) {
    all.checked = v.length > 0 && v.every(function (p) {
      return SELN.indexOf(p) >= 0;
    });
  }
}

function copyN() {
  if (SELN.length) {
    openCopyMany(SELN, 'copy', 'n');
  }
}

function cutN() {
  if (SELN.length) {
    openCopyMany(SELN, 'cut', 'n');
  }
}

function copyNameAt(i) {
  openCopyMany([NM[i]], 'copy', 'n');
}

function delN() {
  if (!SELN.length) {
    return;
  }
  dk = 'bn';
  di = -1;
  $('dtt').textContent = 'Hapus ' + SELN.length + ' Nama?';
  $('dn').textContent = SELN.length + ' nama yang dipilih';
  $('dmod').classList.add('on');
}

function selOneN(i, on) {
  var p = NM[i], k = SELN.indexOf(p);
  if (on && k < 0) {
    SELN.push(p);
  }
  if (!on && k >= 0) {
    SELN.splice(k, 1);
  }
  drawNama();
}

function selAllN(on) {
  visN().forEach(function (p) {
    var k = SELN.indexOf(p);
    if (on && k < 0) {
      SELN.push(p);
    }
    if (!on && k >= 0) {
      SELN.splice(k, 1);
    }
  });
  drawNama();
}

function cutMany() {
  if (SEL.length) {
    openCopyMany(SEL, 'cut');
  }
}

function delMany() {
  if (!SEL.length) {
    return;
  }
  dk = 'b';
  di = -1;
  $('dtt').textContent = 'Hapus ' + SEL.length + ' Pembayaran?';
  $('dn').textContent = SEL.length + ' pembayaran yang dipilih';
  $('dmod').classList.add('on');
}

function selOne(i, on) {
  var p = P[i], k = SEL.indexOf(p);
  if (on && k < 0) {
    SEL.push(p);
  }
  if (!on && k >= 0) {
    SEL.splice(k, 1);
  }
  drawProd();
}

function selAll(on) {
  visP().forEach(function (p) {
    var k = SEL.indexOf(p);
    if (on && k < 0) {
      SEL.push(p);
    }
    if (!on && k >= 0) {
      SEL.splice(k, 1);
    }
  });
  drawProd();
}

var ned = -1;

function openBulkNames() {
  $('bnclass').innerHTML = '<option value="">Tanpa kelas</option>' + semuaKelas().map(function (k) {
    return '<option>' + k + '</option>';
  }).join('');
  $('bnclass').value = kelasAktif == 'Semua' ? '' : kelasAktif;
  $('bnlist').value = '';
  $('bnerr').textContent = '';
  $('bnmod').classList.add('on');
  $('bnlist').focus();
}

function closeBulkNames() {
  $('bnmod').classList.remove('on');
}

function importNames() {
  var c = $('bnclass').value, lines = $('bnlist').value.split(/\r\n|\n|\r/), added = 0, skipped = 0;
  lines.forEach(function (line) {
    var n = line.trim().toUpperCase();
    if (!n) {
      return;
    }
    if (NM.some(function (x) {
        return x.c == c && x.n.toLowerCase() == n.toLowerCase();
      })) {
      skipped++;
      return;
    }
    NM.push({ n: n, c: c });
    added++;
  });
  if (!added && !skipped) {
    $('bnerr').textContent = 'Masukkan minimal satu nama.';
    return;
  }
  saveNames();
  fillKls($('kls').value);
  closeBulkNames();
  drawNama();
  render();
  toast(added + ' nama ditambahkan' + (skipped ? ', ' + skipped + ' duplikat dilewati.' : '.'));
}

function openName(i) {
  ned = i;
  $('nt').textContent = i < 0 ? 'Tambah Nama Baru' : 'Edit Nama';
  $('nk').innerHTML = '<option value="">Tanpa kelas</option>' + semuaKelas().map(function (k) {
    return '<option>' + k + '</option>';
  }).join('');
  $('nn').value = i < 0 ? '' : NM[i].n;
  $('nk').value = i < 0 ? kelasAktif == 'Semua' ? '' : kelasAktif : NM[i].c;
  $('ne').textContent = '';
  $('nmod').classList.add('on');
  $('nn').focus();
}

function closeName() {
  $('nmod').classList.remove('on');
}

function saveName() {
  var n = $('nn').value.trim().toUpperCase(), c = $('nk').value;
  if (!n) {
    $('ne').textContent = 'Nama wajib diisi.';
    return;
  }
  if (NM.some(function (x, k) {
      return k != ned && x.c == c && x.n.toLowerCase() == n.toLowerCase();
    })) {
    $('ne').textContent = 'Nama sudah ada di kelas ini.';
    return;
  }
  var cur = $('kls').value;
  if (ned < 0) {
    NM.push({ n: n, c: c });
    cur = n;
  } else {
    if (cur == NM[ned].n) {
      cur = n;
    }
    NM[ned] = { n: n, c: c };
  }
  saveNames();
  fillKls(cur);
  closeName();
  drawNama();
  render();
}

function drawNama() {
  drawNBulk();
  $('nchips').innerHTML = ['Semua'].concat(semuaKelas()).map(function (c) {
    return '<button class="chip' + (c == kelasAktif ? ' on' : '') + '" data-n="' + c + '"' + (SELN.length ? ' disabled' : '') + '>' + c + '</button>';
  }).join('');
  var kataCari = ($('nSearch') ? $('nSearch').value : '').trim().toLocaleLowerCase('id-ID');
  $('ntb').innerHTML = NM.map(function (x, i) {
    if (kelasAktif != 'Semua' && x.c != kelasAktif) {
      return '';
    }
    if (kataCari && !String(x.n || '').toLocaleLowerCase('id-ID').includes(kataCari)) {
      return '';
    }
    return '<tr><td style="width:36px"><input type="checkbox"' + (SELN.indexOf(x) >= 0 ? ' checked' : '') + ' onchange="selOneN(' + i + ',this.checked)" aria-label="Pilih"></td><td><div class="pn"><span class="ic">👤</span>' + esc(x.n) + '</div></td><td>' + (x.c ? '<span class="tag">' + esc(x.c) + '</span>' : '') + '</td><td><button class="al" onclick="openName(' + i + ')">Edit</button><button class="al" onclick="copyNameAt(' + i + ')">Salin</button><button class="al d" onclick="delNameAt(' + i + ')">Hapus</button></td></tr>';
  }).join('') || '<tr><td colspan="4">' + (kataCari ? 'Tidak ada nama yang cocok dengan pencarian.' : (NM.length ? 'Belum ada nama untuk kelas ini.' : 'Belum ada nama. Klik Tambah Nama Baru.')) + '</td></tr>';
}

// Pencarian langsung pada halaman Data Pembayaran dan Data Nama.
document.addEventListener('DOMContentLoaded', function () {
  var pSearch = $('pSearch');
  var nSearch = $('nSearch');
  if (pSearch) pSearch.addEventListener('input', drawProd);
  if (nSearch) nSearch.addEventListener('input', drawNama);
});

document.addEventListener('click', function (e) {
  var c = e.target.getAttribute && e.target.getAttribute('data-n');
  if (c !== null) {
    setKelas(c);
  }
});

document.addEventListener('click', function (e) {
  var c = e.target.getAttribute && e.target.getAttribute('data-k');
  if (c !== null) {
    setKelas(c);
  }
});

function delNameAt(i) {
  dk = 'n';
  di = i;
  $('dtt').textContent = 'Hapus Nama?';
  $('dn').textContent = NM[i].n;
  $('dmod').classList.add('on');
}

function nameOf(i) {
  var v = NO[P[i].n];
  return v == null ? P[i].n : v;
}

function fit(el) {
  el.style.height = 'auto';
  var h = el.scrollHeight;
  if (h) {
    el.style.height = h + 'px';
  }
}

function setName(i, el) {
  NO[P[i].n] = el.value;
  fit(el);
  render();
}

function price(i) {
  var v = PO[P[i].n];
  return v == null ? P[i].h : v;
}

function setPrice(i, v) {
  PO[P[i].n] = Math.max(parseInt(v, 10) || 0, 0);
  render();
}

function onPrice(i, el) {
  var pos = el.selectionStart, before = el.value.slice(0, pos).replace(/\D/g, '').length;
  var d = el.value.replace(/\D/g, '');
  el.value = d ? parseInt(d, 10).toLocaleString('id-ID') : '';
  var c = 0, np = 0;
  for (; np < el.value.length && c < before; np++) {
    if (/\d/.test(el.value[np])) {
      c++;
    }
  }
  try {
    el.setSelectionRange(np, np);
  } catch (e) {}
  setPrice(i, d);
}

function paymentAmount() {
  return parseInt($('bayar').value.replace(/\D/g, ''), 10) || 0;
}

function onBayar(el) {
  var before = el.value.slice(0, el.selectionStart).replace(/\D/g, '').length;
  var digits = el.value.replace(/\D/g, '');
  el.value = digits ? parseInt(digits, 10).toLocaleString('id-ID') : '';
  var count = 0, pos = 0;
  for (; pos < el.value.length && count < before; pos++) {
    if (/\d/.test(el.value[pos])) {
      count++;
    }
  }
  try {
    el.setSelectionRange(pos, pos);
  } catch (e) {}
  render();
}

function qb(v) {
  var amount = v || GT;
  $('bayar').value = amount ? amount.toLocaleString('id-ID') : '';
  render();
}

function setMet(m) {
  MET = m;
  var nt = m != 'Tunai';
  document.querySelectorAll('.mm').forEach(function (b) {
    b.classList.toggle('on', b.getAttribute('data-m') == m);
  });
  var cashWrap = $('cashWrap');
  var changeWrap = $('changeWrap');
  if (cashWrap) {
    cashWrap.classList.toggle('hidden', nt);
  }
  if (changeWrap) {
    changeWrap.classList.toggle('hidden', nt);
  }
  $('bayar').disabled = nt;
  if (nt) {
    $('bayar').value = GT ? GT.toLocaleString('id-ID') : '';
    $('kb').textContent = 'Rp 0';
    $('kb').className = '';
    $('kbl').textContent = 'Kembalian:';
  }
  render();
}

function openPay() {
  $('pe').textContent = '';
  setMet(MET);
  $('pmod').classList.add('on');
  if (MET == 'Tunai') {
    $('bayar').focus();
  }
}

function closePay() {
  $('pmod').classList.remove('on');
}

function finishPay() {
  render();
  var isCash = MET == 'Tunai';
  var by = isCash ? paymentAmount() : GT;
  if (!GT) {
    $('pe').textContent = 'Keranjang masih kosong.';
    return;
  }
  if (!$('pDari').textContent.trim()) {
    $('pe').textContent = 'Nama penerima ("Telah terima dari") belum diisi.';
    return;
  }
  if (isCash && by < GT) {
    $('pe').textContent = 'Uang diterima kurang Rp ' + fmt(GT - by) + '.';
    return;
  }
  closePay();
  completeTx(by);
}

function add(i, d) {
  var v = q[i] + d;
  if (v < 0 || v > 1) {
    return;
  }
  q[i] = v;
  if (!v) {
    delete PO[P[i].n];
    delete NO[P[i].n];
  }
  draw();
  render();
}

function clearCart() {
  q = P.map(function () {
    return 0;
  });
  PO = {};
  NO = {};
  draw();
  render();
}

function draw() {
  var k = ($('cari').value || '').toLowerCase();
  setChips();
  $('cards').innerHTML = P.map(function (p, i) {
    if (kelasAktif != 'Semua' && p.c != kelasAktif || p.n.toLowerCase().indexOf(k) < 0) {
      return '';
    }
    return '<button class="card" onclick="add(' + i + ',1)"><div class="ic">' + esc(p.i) + '</div><div class="nm">' + esc(p.n) + '</div><div class="ft"><span class="pr">Rp ' + fmt(p.h) + '</span></div></button>';
  }).join('') || '<p class="empty">Belum ada pembayaran untuk kelas ini. Atur kelas pembayaran lewat Data Pembayaran.</p>';
  var h = '';
  P.forEach(function (p, i) {
    if (q[i]) {
      h += '<div class="ci"><div class="cn"><textarea class="ni" rows="1" oninput="setName(' + i + ',this)" aria-label="Keterangan">' + esc(nameOf(i)) + '</textarea><label class="pi">Rp <input type="text" inputmode="numeric" value="' + fmt(price(i)) + '" oninput="onPrice(' + i + ',this)" aria-label="Harga"></label></div><div class="qc"><button onclick="add(' + i + ',-1)" aria-label="Hapus">🗑</button></div></div>';
    }
  });
  $('items').innerHTML = h || '<p class="empty">Keranjang kosong. Klik pembayaran untuk menambahkan.</p>';
  document.querySelectorAll('.ni').forEach(fit);
}

var ed = -1, armed = -1;

function save() {
  try { localStorage.setItem('hdi_p2', JSON.stringify(P)); } catch (e) {}
  hdiSyncProducts();
}

function load() {
  try {
    var v = JSON.parse(localStorage.getItem('hdi_p2'));
    if (v && v.length) {
      v.forEach(function (p) {
        if (p.i == '🍽️' || p.i == '🍽') {
          p.i = '📜';
        }
      });
      return v;
    }
  } catch (e) {}
  return null;
}

function cats() {
  return semuaKelas();
}

function toggleMenu() {
  document.querySelector('.side').classList.toggle('open');
}

function openDataLock() {
  var m = $('dataLock');
  if (m) {
    $('dlp').type = 'password';
    $('deye').innerHTML = EYEOFF;
    $('deye').setAttribute('aria-label', 'Tampilkan password');
    $('deye').setAttribute('aria-pressed', 'false');
    m.classList.add('on');
    $('dlu').focus();
  }
}

function closeDataLock() {
  var m = $('dataLock');
  if (m) {
    m.classList.remove('on');
    $('dle').textContent = '';
    $('dlu').value = '';
    $('dlp').value = '';
    $('dlp').type = 'password';
    $('deye').innerHTML = EYEOFF;
    $('deye').setAttribute('aria-label', 'Tampilkan password');
    $('deye').setAttribute('aria-pressed', 'false');
  }
}

async function doDataLogin() {
  var username = ($('dlu').value || '').trim().toLowerCase();
  var password = $('dlp').value || '';
  var button = $('dlb');
  if (!username || !password) {
    $('dle').textContent = 'Username admin dan password wajib diisi.';
    return;
  }
  if (!window.HDIDB) {
    $('dle').textContent = 'Layanan autentikasi belum tersedia. Muat ulang halaman dan coba lagi.';
    return;
  }
  button.disabled = true;
  button.textContent = 'Memverifikasi...';
  $('dle').textContent = '';
  try {
    // Verifikasi akun Kunci Data yang dapat berbeda dari akun login utama.
    // Menggunakan client Supabase terpisah agar sesi kasir utama tidak tertimpa.
    await HDIDB.verifikasiKunciDataDenganUsername(username, password);
    try { sessionStorage.setItem('hdi_data_ok', '1'); } catch (e) {}
    closeDataLock();
    go('data');
  } catch (err) {
    console.warn('[Kwitansi HDI] Verifikasi ulang akses data gagal.');
    $('dle').textContent = (err && /akun kunci data harus berbeda/i.test(err.message || ''))
      ? 'Gunakan akun Kunci Data yang berbeda dari akun login awal kasir.'
      : (err && /username belum dikonfigurasi/i.test(err.message || '')
        ? 'Username admin belum dikonfigurasi. Atur HDI_USERNAME_MAP di supabase.js.'
        : 'Verifikasi gagal. Periksa username admin, password, pemetaan username di supabase.js, dan status akun Supabase.');
  } finally {
    button.disabled = false;
    button.textContent = 'Buka Data';
  }
}

function go(v) {
  var b = document.body.classList;
  document.querySelector('.side').classList.remove('open');
  if (v !== 'data') {
    sessionStorage.removeItem('hdi_data_ok');
  }
  var lockedData = v === 'data' && !sessionStorage.getItem('hdi_data_ok');
  b.toggle('v-prod', v == 'prod');
  b.toggle('v-nama', v == 'nama');
  b.toggle('v-riw', v == 'riw');
  b.toggle('v-data', v == 'data');
  b.toggle('data-locked', lockedData);
  ['pos', 'prod', 'nama', 'riw', 'data'].forEach(function (k, j) {
    $('n' + (j + 1)).classList.toggle('on', v == k);
  });
  $('ttl').textContent = v == 'prod' ? 'Data Pembayaran' : v == 'nama' ? 'Data Nama' : v == 'riw' ? 'Riwayat Transaksi' : v == 'data' ? 'Manajemen Data' : 'Halaman Kwitansi';
  if (lockedData) {
    openDataLock();
  } else {
    closeDataLock();
  }
  if (v == 'prod') {
    drawProd();
  } else if (v == 'nama') {
    drawNama();
  } else if (v == 'riw') {
    drawRiw();
  } else if (v == 'data' && !lockedData) {
    drawData();
  } else if (v != 'data') {
    document.querySelectorAll('.ni').forEach(fit);
  }
}

function setChips() {
  function mk(at, lk) {
    return ['Semua'].concat(cats()).map(function (c) {
      return '<button class="chip' + (c == kelasAktif ? ' on' : '') + '" ' + at + '="' + esc(c) + '"' + (lk ? ' disabled' : '') + '>' + esc(c) + '</button>';
    }).join('');
  }
  $('chips').innerHTML = mk('data-k');
  $('pchips').innerHTML = mk('data-c', SEL.length > 0);
  $('rchips').innerHTML = mk('data-k');
  $('dchips').innerHTML = mk('data-k');
}

function drawProd() {
  drawBulk();
  setChips();
  var kataCari = ($('pSearch') ? $('pSearch').value : '').trim().toLocaleLowerCase('id-ID');
  $('ptb').innerHTML = P.map(function (p, i) {
    if (kelasAktif != 'Semua' && p.c != kelasAktif) {
      return '';
    }
    if (kataCari && !String(p.n || '').toLocaleLowerCase('id-ID').includes(kataCari)) {
      return '';
    }
    return '<tr><td style="width:36px"><input type="checkbox"' + (SEL.indexOf(p) >= 0 ? ' checked' : '') + ' onchange="selOne(' + i + ',this.checked)" aria-label="Pilih"></td><td><div class="pn"><span class="ic">' + esc(p.i) + '</span>' + esc(p.n) + '</div></td><td>' + (p.c ? '<span class="tag">' + esc(p.c) + '</span>' : '') + '</td><td>Rp ' + fmt(p.h) + '</td><td><button class="al" onclick="openMod(' + i + ')">Edit</button><button class="al" onclick="openCopy(' + i + ')">Salin</button><button class="al d" onclick="del(' + i + ')">Hapus</button></td></tr>';
  }).join('') || '<tr><td colspan="5">' + (kataCari ? 'Tidak ada pembayaran yang cocok dengan pencarian.' : 'Belum ada pembayaran untuk kelas ini.') + '</td></tr>';
}

var di = -1, dk = 'p';

function del(i) {
  dk = 'p';
  $('dtt').textContent = 'Hapus Pembayaran?';
  di = i;
  $('dn').textContent = P[i].n;
  $('dmod').classList.add('on');
}

function closeDel() {
  $('dmod').classList.remove('on');
  di = -1;
  dk = 'p';
  $('dpre').textContent = 'Yakin ingin menghapus';
  $('dpost').textContent = '? Tindakan ini tidak bisa dibatalkan.';
  $('dok').textContent = 'Ya, Hapus';
}

function confirmDel() {
  if (di < 0 && dk != 'b' && dk != 'bn' && dk != 'r' && dk != 'x' && dk != 'selected') {
    return;
  }
  if (dk == 'selected') {
    applySelectedDelete();
    return;
  }
  if (dk == 'r') {
    applyRestore();
    return;
  }
  if (dk == 'x') {
    doWipe();
    return;
  }
  if (dk == 't') {
    TX.splice(di, 1);
    saveTx();
    closeDel();
    drawRiw();
    return;
  }
  if (dk == 'bn') {
    var rn = SELN.slice();
    NM = NM.filter(function (x) {
      return rn.indexOf(x) < 0;
    });
    SELN = [];
    saveNames();
    fillKls($('kls').value);
    closeDel();
    drawNama();
    render();
    toast('Berhasil menghapus ' + rn.length + ' nama.');
    return;
  }
  if (dk == 'b') {
    var rm = SEL.slice();
    for (var k = P.length - 1; k >= 0; k--) {
      if (rm.indexOf(P[k]) >= 0) {
        P.splice(k, 1);
        q.splice(k, 1);
      }
    }
    SEL = [];
    save();
    closeDel();
    drawProd();
    draw();
    render();
    toast('Berhasil menghapus ' + rm.length + ' pembayaran.');
    return;
  }
  if (dk == 'n') {
    var cu = $('kls').value;
    if (cu == NM[di].n) {
      cu = '';
    }
    NM.splice(di, 1);
    saveNames();
    fillKls(cu);
    closeDel();
    drawNama();
    render();
    return;
  }
  P.splice(di, 1);
  q.splice(di, 1);
  save();
  closeDel();
  drawProd();
  draw();
  render();
}

function openBulkProducts() {
  $('bpclass').innerHTML = '<option value="">Tanpa kelas</option>' + semuaKelas().map(function (k) {
    return '<option>' + k + '</option>';
  }).join('');
  $('bpclass').value = kelasAktif == 'Semua' ? '' : kelasAktif;
  $('bplist').value = '';
  $('bperr').textContent = '';
  $('bpmod').classList.add('on');
  $('bplist').focus();
}

function closeBulkProducts() {
  $('bpmod').classList.remove('on');
}

function importProducts() {
  var c = $('bpclass').value, lines = $('bplist').value.split(/\r\n|\n|\r/), added = 0, skipped = 0, invalid = 0;
  lines.forEach(function (line) {
    if (!line.trim()) {
      return;
    }
    var fields = line.split(/\t|\|/), n = (fields[0] || '').trim(), priceText = (fields[1] || '').trim(), digits = priceText.replace(/\D/g, '');
    if (!n || !digits) {
      invalid++;
      return;
    }
    if (P.some(function (p) {
        return p.c == c && p.n.trim().toLowerCase() == n.toLowerCase();
      })) {
      skipped++;
      return;
    }
    P.push({
      n: n,
      c: c,
      h: parseInt(digits, 10) || 0,
      s: 0,
      i: (fields[2] || '').trim() || '📜'
    });
    q.push(0);
    added++;
  });
  if (!added && !skipped) {
    $('bperr').textContent = invalid ? 'Tidak ada pembayaran ditambahkan. Periksa format nama dan harga.' : 'Masukkan minimal satu pembayaran.';
    return;
  }
  save();
  closeBulkProducts();
  drawProd();
  draw();
  render();
  var summary = [added + ' pembayaran ditambahkan'];
  if (skipped) {
    summary.push(skipped + ' duplikat dilewati');
  }
  if (invalid) {
    summary.push(invalid + ' baris tidak valid dilewati');
  }
  toast(summary.join(', ') + '.');
}

function openMod(i) {
  ed = i;
  var p = i < 0 ? { n: '', c: '', h: '', s: '', i: '📜' } : P[i];
  $('mt').textContent = i < 0 ? 'Tambah Pembayaran Baru' : 'Edit Pembayaran';
  $('mn').value = p.n;
  $('mc').value = p.c;
  $('mh').value = p.h;
  $('mi').value = p.i;
  $('me').textContent = '';
  $('mod').classList.add('on');
  $('mn').focus();
}

function closeMod() {
  $('mod').classList.remove('on');
}

function saveMod() {
  var n = $('mn').value.trim(), c = $('mc').value.trim(), h = parseInt($('mh').value, 10);
  if (!n || isNaN(h) || h < 0) {
    $('me').textContent = 'Nama dan harga wajib diisi dengan benar.';
    return;
  }
  var o = {
    n: n,
    c: c,
    h: h,
    s: 0,
    i: $('mi').value.trim() || '📜'
  };
  if (ed < 0) {
    P.push(o);
    q.push(0);
  } else {
    P[ed] = o;
  }
  save();
  closeMod();
  drawProd();
  draw();
  render();
}

function tick() {
  $('clock').textContent = new Date().toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

var satuan = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas'
];

function tb(n) {
  if (n < 12) {
    return satuan[n];
  }
  if (n < 20) {
    return tb(n - 10) + ' belas';
  }
  if (n < 100) {
    return tb(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + tb(n % 10) : '');
  }
  if (n < 200) {
    return 'seratus' + (n % 100 ? ' ' + tb(n % 100) : '');
  }
  if (n < 1000) {
    return tb(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + tb(n % 100) : '');
  }
  if (n < 2000) {
    return 'seribu' + (n % 1000 ? ' ' + tb(n % 1000) : '');
  }
  if (n < 1e6) {
    return tb(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + tb(n % 1000) : '');
  }
  if (n < 1e9) {
    return tb(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + tb(n % 1e6) : '');
  }
  if (n < 1e12) {
    return tb(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + tb(n % 1e9) : '');
  }
  return tb(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + tb(n % 1e12) : '');
}

function cap(s) {
  return s.replace(/\b\w/g, function (c) {
    return c.toUpperCase();
  });
}

function fmt(n) {
  return n.toLocaleString('id-ID');
}

function render() {
  $('ttdManualWrap').style.display = $('ttd').value === '' ? 'grid' : 'none';
  $('dw').style.display = $('kls').value ? 'none' : '';
  $('pDari').textContent = $('kls').value || $('dari').value;
  $('pKota').textContent = $('kota').value ? $('kota').value + ',' : '';
  var d = $('tgl').value;
  $('pTgl').textContent = d ? d.split('-').reverse().join('/') : '';
  $('pTtd').textContent = getTtd();
  $('pCat').textContent = $('cat').value;
  var sub = 0, h = '', n = 0, rc = 0;
  function row(no, nm, amt) {
    rc++;
    return '<tr><td class="n">' + no + '</td><td>' + (nm || '&nbsp;') + '</td><td class="j">' + (amt !== '' ? '<div class="m"><span>Rp.</span><span>' + amt + '</span></div>' : '') + '</td></tr>';
  }
  P.forEach(function (p, i) {
    if (!q[i]) {
      return;
    }
    n++;
    var a = price(i) * q[i];
    sub += a;
    h += row(n, esc(nameOf(i)) + (q[i] > 1 ? ' x ' + q[i] : ''), fmt(a));
  });
  var dv = Math.min(parseInt($('disc').value, 10) || 0, sub);
  var t = sub - dv;
  if (dv) {
    h += row('', 'Diskon', '-' + fmt(dv));
  }
  while (rc < 6) {
    h += row('', '', '');
  }
  $('pRows').innerHTML = h;
  $('pTot').textContent = t ? fmt(t) : '-';
  $('pTerb').textContent = t ? cap(tb(t)) + ' Rupiah' : 'Nol Rupiah';
  $('sub').textContent = 'Rp ' + fmt(sub);
  $('dv').textContent = '- Rp ' + fmt(dv);
  $('gt').textContent = 'Rp ' + fmt(t);
  GT = t;
  if (MET != 'Tunai') {
    $('bayar').value = t ? t.toLocaleString('id-ID') : '';
  }
  $('gt2').textContent = 'Rp ' + fmt(t);
  $('q1').textContent = 'Rp ' + fmt(t);
  var by = paymentAmount(), kr = by && by < t;
  if (MET == 'Tunai') {
    $('kbl').textContent = kr ? 'Kurang:' : 'Kembalian:';
    $('kb').textContent = 'Rp ' + fmt(kr ? t - by : Math.max(by - t, 0));
    $('kb').className = kr ? 'neg' : '';
    $('pKbl').textContent = kr ? 'Kurang :' : 'Kembalian :';
    $('pKb').textContent = fmt(kr ? t - by : Math.max(by - t, 0));
  } else {
    $('kbl').textContent = 'Kembalian:';
    $('kb').textContent = 'Rp 0';
    $('kb').className = '';
    $('pKbl').textContent = 'Kembalian :';
    $('pKb').textContent = 'Rp 0';
  }
  $('pPay').style.display = by ? 'flex' : 'none';
  $('pMet').textContent = MET;
  $('pBy').textContent = fmt(by);
}

function showReceipt(on) {
  var o = $('out');
  o.classList.toggle('off', !on);
  if (on) {
    render();
    o.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function downloadReceiptPdf() {
  if (typeof html2pdf !== 'function') {
    toast('PDF belum tersedia. Periksa koneksi internet lalu muat ulang halaman.');
    return;
  }
  var paper = document.querySelector('#out .paper');
  if (!paper) {
    toast('Kwitansi tidak ditemukan.');
    return;
  }
  var hadClass = paper.classList.contains('pdf-export');
  var filename = ($('pDari').textContent.trim() || 'pembayaran').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60);
  paper.classList.add('pdf-export');
  html2pdf().set({
    margin: 5,
    filename: 'KWITANSI-' + filename.toUpperCase() + '-' + stamp() + '.PDF',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' },
    pagebreak: {
      mode: ['css', 'legacy']
    }
  }).from(paper).save().then(function () {
    toast('File PDF kwitansi berhasil diunduh.');
  }).catch(function (error) {
    console.error('Gagal membuat PDF kwitansi.', error);
    toast('Gagal membuat PDF kwitansi. Silakan coba lagi.');
  }).finally(function () {
    if (!hadClass) {
      paper.classList.remove('pdf-export');
    }
  });
}

function printNow() {
  render();
  try {
    window.print();
  } catch (e) {}
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c];
  });
}

var today = new Date();
$('tgl').value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

document.addEventListener('input', function (e) {
  if (e.target.id == 'rcari') {
    drawRiw();
  }
  if (e.target.id == 'dcari' || e.target.id == 'dpickSearch') {
    drawData();
  }
  if (e.target.id == 'cari') {
    draw();
  }
  render();
});

document.addEventListener('change', render);

document.addEventListener('click', function (e) {
  var c = e.target.getAttribute && e.target.getAttribute('data-c');
  if (c !== null) {
    setKelas(c);
  }
});

tick();
setInterval(tick, 30000);

$('mc').innerHTML = '<option value="">Tanpa kelas</option>' + semuaKelas().map(function (k) {
  return '<option>' + k + '</option>';
}).join('');

fillKls('');
setDefaultPetugas();
draw();
render();

function hx(t) {
  if (window.crypto && crypto.subtle) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (b) {
      return Array.from(new Uint8Array(b)).map(function (x) {
        return ('0' + x.toString(16)).slice(-2);
      }).join('');
    });
  }
  return Promise.resolve(btoa(unescape(encodeURIComponent(t))));
}

function acct() { return null; } // Login sekarang dikelola oleh Supabase Auth.

function setAuth() {
  document.body.classList.remove('locked');
  setDefaultPetugas();
  render();
  try { sessionStorage.setItem('hdi_ok', '1'); sessionStorage.removeItem('hdi_data_ok'); } catch (e) {}
}

var EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>', EYEOFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';

function togglePw() {
  var i = $('lp'), h = i.type == 'password';
  i.type = h ? 'text' : 'password'; $('eye').innerHTML = h ? EYE : EYEOFF;
  $('eye').setAttribute('aria-label', h ? 'Sembunyikan password' : 'Tampilkan password');
}
function toggleDataPw() {
  var i = $('dlp'), b = $('deye'), h = i.type == 'password';
  i.type = h ? 'text' : 'password'; b.innerHTML = h ? EYE : EYEOFF;
  b.setAttribute('aria-label', h ? 'Sembunyikan password' : 'Tampilkan password'); b.setAttribute('aria-pressed', h ? 'true' : 'false');
}
function initLogin() {
  $('lp').type = 'password'; $('eye').innerHTML = EYEOFF;
  $('lt').textContent = 'Masuk'; $('lh').textContent = 'Masuk menggunakan username dan password akun petugas.';
  $('lb').textContent = 'Masuk'; $('lp2w').style.display = 'none';
  $('lp').setAttribute('autocomplete', 'current-password'); $('le').textContent = '';
  $('lu').value = ''; $('lp').value = ''; $('lp2').value = '';
}
// Pulihkan sesi Supabase yang tersimpan agar reload tidak meminta login lagi.
// Sesi disimpan oleh Supabase Auth di browser dan token akan diperbarui otomatis.
async function restoreSession() {
  // Jangan tampilkan login atau halaman kasir sebelum status sesi diketahui.
  // Class ini sudah dipasang dari HTML agar tidak ada kilatan layar login.
  document.body.classList.add('auth-checking', 'locked');
  hdiCloudReady = false;
  var session = null;
  try {
    session = await HDIDB.sesi();
  } catch (err) {
    console.error('[Kwitansi HDI] Pemeriksaan sesi Supabase gagal:', err);
    document.body.classList.remove('auth-checking');
    return false;
  }

  // Belum login atau sesi sudah berakhir: tampilkan halaman login.
  if (!session || !session.user) {
    document.body.classList.remove('auth-checking');
    return false;
  }

  // Sesi valid: utamakan memuat data cloud sebelum membuka halaman kasir.
  // Jika jaringan/database sementara gagal, jangan meminta login lagi;
  // buka aplikasi dengan data lokal yang tersedia dan beri tahu pengguna.
  try {
    var state = await HDIDB.siapkanData({ produk: P, siswa: NM, transaksi: TX });
    hdiApplyCloudState(state);
  } catch (err) {
    console.error('[Kwitansi HDI] Sesi valid, tetapi sinkronisasi awal gagal:', err);
    hdiCloudReady = false;
  }

  setAuth();
  initLogin();
  document.body.classList.remove('auth-checking');
  if (!hdiCloudReady && typeof toast === 'function') {
    toast('Sesi login dipulihkan. Sinkronisasi cloud belum berhasil; periksa koneksi Supabase.');
  }
  return true;
}
async function doLogin() {
  var username = $('lu').value.trim().toLowerCase(), password = $('lp').value;
  if (!username || !password) { $('le').textContent = 'Username dan password wajib diisi.'; return; }
  $('lb').disabled = true; $('lb').textContent = 'Memeriksa akun...'; $('le').textContent = '';
  try {
    await HDIDB.masukDenganUsername(username, password);
  } catch (err) {
    console.warn('[Kwitansi HDI] Autentikasi Supabase gagal.');
    $('le').textContent = (err && /username belum dikonfigurasi/i.test(err.message || ''))
      ? 'Username belum dikonfigurasi. Atur HDI_USERNAME_MAP di supabase.js.'
      : 'Login gagal. Periksa username, password, pemetaan username di supabase.js, dan status akun petugas.';
    return;
  } finally {
    $('lb').disabled = false;
    $('lb').textContent = 'Masuk';
  }

  // Login yang valid tidak dibatalkan hanya karena cloud sedang bermasalah.
  // Buka aplikasi dengan cache lokal, lalu beri peringatan yang jelas.
  try {
    var state = await HDIDB.siapkanData({ produk: P, siswa: NM, transaksi: TX });
    hdiApplyCloudState(state);
    setAuth(); initLogin();
    toast('Login berhasil. Data sudah disinkronkan dengan Supabase.');
  } catch (err) {
    console.error('[Kwitansi HDI] Login valid, tetapi sinkronisasi awal gagal:', err);
    hdiCloudReady = false;
    setAuth(); initLogin();
    toast('Login berhasil, tetapi sinkronisasi cloud gagal. Data lokal tetap tersedia; periksa koneksi dan konfigurasi Supabase.');
  }
}

function logout() {
  hdiCloudReady = false;
  if (window.HDIDB) HDIDB.keluar().catch(function (e) { console.error('[Kwitansi HDI] Gagal mengakhiri sesi Supabase:', e); });
  try {
    localStorage.removeItem('hdi_ok');
    sessionStorage.removeItem('hdi_ok');
    sessionStorage.removeItem('hdi_data_ok');
  } catch (e) {}
  go('pos');
  document.body.classList.remove('data-locked', 'v-data');
  document.body.classList.add('locked');
  closeDataLock();
  initLogin();
}

document.addEventListener('keydown', function (e) {
  if (e.key == 'Enter' && document.body.classList.contains('locked')) {
    doLogin();
  }
  if (e.key == 'Enter' && document.body.classList.contains('data-locked') && (e.target.id == 'dlu' || e.target.id == 'dlp')) {
    doDataLogin();
  }
  if (e.key == 'Escape') {
    closePay();
    closeDel();
    closeMod();
    closeName();
    closeBulkNames();
    closeBulkProducts();
    closeCopy();
  }
});

// Tampilkan login sebagai keadaan awal; bila sesi Supabase masih aktif,
// restoreSession akan membuka aplikasi otomatis tanpa meminta password ulang.
initLogin();
restoreSession().then(function (restored) {
  if (!restored) {
    document.body.classList.add('locked');
    hdiCloudReady = false;
  }
});

// Kebijakan sesi: berpindah tab atau meminimalkan browser TIDAK mengeluarkan pengguna.
// Sesi Supabase disimpan di sessionStorage (lihat supabase.js), sehingga tetap tersedia
// selama tab ini masih hidup, termasuk saat reload, dan biasanya dibersihkan saat tab/browser ditutup.
// Browser tidak menyediakan event web yang 100% andal untuk membedakan browser ditutup
// dari tab ditutup atau proses dihentikan; pemulihan sesi browser dapat berbeda menurut pengaturan.

(function () {
  var a = document.querySelector('#out .head img'), b = $('logoR');
  if (a && b) {
    b.src = a.src;
  }
})();
