// dashboard-v2-data-adapter.js — Tahap V2.16: Dashboard V2 Data Adapter
// Layer (lihat DASHBOARD-V2-DATA-ADAPTER.md).
//
// TUJUAN: menyediakan SATU lapisan baca-saja (read-only) di atas state
// global `D` (dideklarasikan di features-helpers-global-security.js)
// supaya Dashboard V2 (dashboard-v2-shell.js, dkk) BISA membaca ringkasan
// data existing lewat fungsi bernama jelas per-domain, TANPA menduplikasi
// atau menghitung ulang business logic yang sudah ada di modul lain
// (transaksi.js, vehicle-core.js, dst).
//
// SCOPE tahap ini (persis, tidak lebih):
//   - getFinanceSummary()  — ringkasan dari D.accounts / D.transactions.
//   - getVehicleSummary()  — ringkasan dari D.vehicles / D.bbmLogs /
//     D.servisLogs.
//   - getFamilySummary()   — ringkasan dari D.catatan.anak / D.milestones /
//     D.reminders.
//   - getDocumentSummary() — ringkasan dari D.simList (SIM) dan tanggal
//     dokumen pajak kendaraan per D.vehicles[i] (pajakTahunanTgl/
//     pajakLimaTahunTgl/ujiKelayakanTgl, lihat vehicle-core.js).
// Itu saja. TIDAK ADA logic lain di file ini.
//
// SUMBER DATA EXISTING (hasil inspeksi repo, tidak diubah tahap ini):
//   - Finance:   D.accounts (saldo per akun), D.transactions (income/
//     expense/transfer) — dideklarasikan di features-helpers-global-
//     security.js, ditulis oleh transaksi.js/akun.js.
//   - Vehicle:   D.vehicles, D.bbmLogs, D.servisLogs — dideklarasikan di
//     features-helpers-global-security.js, ditulis oleh vehicle-core.js/
//     tx-bbm.js/sparepart-servis.js.
//   - Family:    D.catatan.anak (perkembangan anak), D.milestones,
//     D.reminders — dideklarasikan di features-helpers-global-security.js,
//     ditulis oleh modul "Personal" (kategori registry: 'personal',
//     lihat dashboard-hub-registry.js key 'per-anak'/'per-pengingat').
//   - Documents: D.simList (dokumen SIM: {id,nama,jenis,tglAkhir,biaya}),
//     dan field dokumen pajak per kendaraan (pajakTahunanTgl/
//     pajakLimaTahunTgl/ujiKelayakanTgl di tiap elemen D.vehicles) —
//     ditulis oleh vehicle-core.js (lihat openSimModal()/openVehTaxModal()
//     di file itu, dan key 'cn-pajak-sim' di dashboard-hub-registry.js:
//     "Pajak Kendaraan & SIM" — "STNK, SPT Tahunan, SIM").
//
// TIDAK melakukan (secara sengaja, additive-only & read-only):
//   - TIDAK melakukan fetch/network apa pun.
//   - TIDAK menambah state baru (tidak ada `let`/closure mutable di file
//     ini) — setiap fungsi murni membaca `D` yang sudah ada saat
//     dipanggil, tidak menyimpan cache/snapshot apa pun.
//   - TIDAK menulis/mengubah `D` sama sekali (tidak ada `D.x = ...`,
//     tidak ada `.push`/`.splice`/mutasi array/objek apa pun) — hanya
//     operasi baca murni (`.length`, `.filter`, `.reduce`, akses
//     property).
//   - TIDAK menyentuh routing (`showPage()`) atau `FEATURE_REGISTRY`.
//   - TIDAK menyentuh `dashboard-hub.js`, `dashboard-v2-shell.js`,
//     `dashboard-v2-activation.js`, atau modul business logic manapun
//     (transaksi.js, vehicle-core.js, dst) — file-file itu tetap
//     satu-satunya yang MENULIS ke `D`.
//   - Dashboard V2 BELUM memakai adapter ini di tahap ini — tidak ada
//     satu pun titik lain di repo yang memanggil fungsi-fungsi di file
//     ini. Wiring pemakaian adapter oleh Dashboard V2 di luar scope tahap
//     ini, butuh mandat eksplisit terpisah (lihat DASHBOARD-V2-DATA-
//     ADAPTER.md, bagian "Future integration").
//
// Pola API sengaja meniru gaya dashboard-v2-activation.js (fungsi
// top-level biasa, bukan class/module.exports, expose ke window kalau
// tersedia) supaya konsisten dgn cara file2 app lain diload (lihat
// tests/helpers/loadSource.js — top-level `function` otomatis nempel ke
// context vm/window tanpa perlu export eksplisit).

// _dashV2AdapterHasD() — guard internal murni: pastikan `D` (state global
// app, features-helpers-global-security.js) tersedia sbg objek sebelum
// fungsi publik di bawah membacanya. Kalau belum ter-load, seluruh fungsi
// publik di file ini return `null` (bukan throw) — no-op aman, sama
// seperti pola guard `typeof` di dashboard-hub.js/dashboard-v2-
// activation.js.
function _dashV2AdapterHasD() {
  return typeof D !== 'undefined' && D !== null && typeof D === 'object';
}

// getFinanceSummary() — ringkasan baca-saja dari D.accounts & D.transactions.
// Tidak menghitung ulang laporan/kategori/proyeksi apa pun (itu ranah
// modules-calc.js/transaksi.js) — murni jumlah & total dasar.
function getFinanceSummary() {
  if (!_dashV2AdapterHasD()) return null;
  const accounts = Array.isArray(D.accounts) ? D.accounts : [];
  const transactions = Array.isArray(D.transactions) ? D.transactions : [];
  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a && typeof a.balance === 'number' ? a.balance : 0),
    0,
  );
  return {
    accountCount: accounts.length,
    totalBalance,
    transactionCount: transactions.length,
  };
}

// getVehicleSummary() — ringkasan baca-saja dari D.vehicles, D.bbmLogs,
// D.servisLogs. Tidak menghitung konsumsi BBM/interval servis (itu ranah
// vehicle-core.js/tx-bbm.js/sparepart-servis.js) — murni jumlah dasar.
function getVehicleSummary() {
  if (!_dashV2AdapterHasD()) return null;
  const vehicles = Array.isArray(D.vehicles) ? D.vehicles : [];
  const bbmLogs = Array.isArray(D.bbmLogs) ? D.bbmLogs : [];
  const servisLogs = Array.isArray(D.servisLogs) ? D.servisLogs : [];
  return {
    vehicleCount: vehicles.length,
    bbmLogCount: bbmLogs.length,
    servisLogCount: servisLogs.length,
  };
}

// getFamilySummary() — ringkasan baca-saja dari D.catatan.anak,
// D.milestones, D.reminders (kategori registry 'personal' — "Fitur
// non-finansial keluarga"). Tidak menghitung progres/skor apa pun — murni
// jumlah dasar.
function getFamilySummary() {
  if (!_dashV2AdapterHasD()) return null;
  const anak = (D.catatan && Array.isArray(D.catatan.anak)) ? D.catatan.anak : [];
  const milestones = Array.isArray(D.milestones) ? D.milestones : [];
  const reminders = Array.isArray(D.reminders) ? D.reminders : [];
  return {
    anakCount: anak.length,
    milestoneDoneCount: milestones.filter((m) => m === true).length,
    milestoneTotalCount: milestones.length,
    reminderCount: reminders.length,
  };
}

// getDocumentSummary() — ringkasan baca-saja dari D.simList (dokumen SIM)
// dan field dokumen pajak kendaraan per D.vehicles[i] (pajakTahunanTgl/
// pajakLimaTahunTgl/ujiKelayakanTgl). Tidak menghitung status jatuh
// tempo/reminder (itu ranah vehicle-core.js) — murni jumlah dokumen yang
// sudah terisi.
function getDocumentSummary() {
  if (!_dashV2AdapterHasD()) return null;
  const simList = Array.isArray(D.simList) ? D.simList : [];
  const vehicles = Array.isArray(D.vehicles) ? D.vehicles : [];
  const vehicleTaxDocCount = vehicles.reduce((count, v) => {
    if (!v) return count;
    let n = 0;
    if (v.pajakTahunanTgl) n += 1;
    if (v.pajakLimaTahunTgl) n += 1;
    if (v.ujiKelayakanTgl) n += 1;
    return count + n;
  }, 0);
  return {
    simCount: simList.length,
    vehicleTaxDocCount,
  };
}

if (typeof window !== 'undefined') {
  window.getFinanceSummary = getFinanceSummary;
  window.getVehicleSummary = getVehicleSummary;
  window.getFamilySummary = getFamilySummary;
  window.getDocumentSummary = getDocumentSummary;
}
