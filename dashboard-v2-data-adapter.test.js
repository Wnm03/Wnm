'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// dashboard-v2-data-adapter.js — Tahap V2.16 (Dashboard V2 Data Adapter
// Layer, lihat DASHBOARD-V2-DATA-ADAPTER.md).
//
// Murni logic baca-saja di atas `D` (tidak ada DOM), jadi cukup
// loadSource biasa — getFinanceSummary/getVehicleSummary/
// getFamilySummary/getDocumentSummary dideklarasikan lewat `function` di
// top-level file source, otomatis nempel ke context vm tanpa perlu
// `expose` (lihat catatan di tests/helpers/loadSource.js).
//
// Setiap test load ulang source dari nol (loadSource dipanggil per-test)
// dengan `D` tiruan yang di-inject via extraGlobals — pola sama dgn
// tests/dashboard-v2-activation.test.js. Tidak ada state yang dibagi
// antar test.

function freshAdapter(D) {
  const extraGlobals = {};
  if (D !== undefined) extraGlobals.D = D;
  return loadSource(['dashboard-v2-data-adapter.js'], extraGlobals);
}

// plain() — konversi hasil sandbox vm (realm beda dari host, lihat catatan
// cross-realm di tests/helpers/loadSource.js) jadi struktur host biasa
// sebelum dibandingkan pakai assert.deepEqual (pola sama dgn
// tests/ai-command-center.test.js / tests/dashboard-hub-favorit-view.test.js).
function plain(x) { return x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)); }

function minimalD(overrides = {}) {
  return {
    accounts: [],
    transactions: [],
    vehicles: [],
    bbmLogs: [],
    servisLogs: [],
    catatan: { anak: [] },
    milestones: [],
    reminders: [],
    simList: [],
    ...overrides,
  };
}

// ---- getFinanceSummary() ----

test('getFinanceSummary() menghitung accountCount, totalBalance, transactionCount dari D.accounts/D.transactions', () => {
  const ctx = freshAdapter(minimalD({
    accounts: [{ id: 'a1', balance: 100000 }, { id: 'a2', balance: 50000 }],
    transactions: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
  }));
  const result = ctx.getFinanceSummary();
  assert.deepEqual(plain(result), { accountCount: 2, totalBalance: 150000, transactionCount: 3 });
});

test('getFinanceSummary() aman kalau D.accounts/D.transactions kosong', () => {
  const ctx = freshAdapter(minimalD());
  assert.deepEqual(plain(ctx.getFinanceSummary()), { accountCount: 0, totalBalance: 0, transactionCount: 0 });
});

test('getFinanceSummary() mengabaikan akun dengan balance non-number (tidak throw, tidak ikut dijumlah)', () => {
  const ctx = freshAdapter(minimalD({
    accounts: [{ id: 'a1', balance: 10000 }, { id: 'a2', balance: 'bukan-angka' }, { id: 'a3' }],
  }));
  assert.deepEqual(plain(ctx.getFinanceSummary()), { accountCount: 3, totalBalance: 10000, transactionCount: 0 });
});

// ---- getVehicleSummary() ----

test('getVehicleSummary() menghitung vehicleCount, bbmLogCount, servisLogCount dari D.vehicles/D.bbmLogs/D.servisLogs', () => {
  const ctx = freshAdapter(minimalD({
    vehicles: [{ id: 'veh_1' }],
    bbmLogs: [{ id: 'b1' }, { id: 'b2' }],
    servisLogs: [{ id: 's1' }],
  }));
  assert.deepEqual(plain(ctx.getVehicleSummary()), { vehicleCount: 1, bbmLogCount: 2, servisLogCount: 1 });
});

test('getVehicleSummary() aman kalau semua array kosong', () => {
  const ctx = freshAdapter(minimalD());
  assert.deepEqual(plain(ctx.getVehicleSummary()), { vehicleCount: 0, bbmLogCount: 0, servisLogCount: 0 });
});

// ---- getFamilySummary() ----

test('getFamilySummary() menghitung anakCount, milestoneDoneCount/milestoneTotalCount, reminderCount', () => {
  const ctx = freshAdapter(minimalD({
    catatan: { anak: [{ id: 'anak1' }, { id: 'anak2' }] },
    milestones: [true, false, true, false, false],
    reminders: [{ id: 'r1' }],
  }));
  assert.deepEqual(plain(ctx.getFamilySummary()), {
    anakCount: 2,
    milestoneDoneCount: 2,
    milestoneTotalCount: 5,
    reminderCount: 1,
  });
});

test('getFamilySummary() aman kalau D.catatan tidak ada / bukan objek dgn field anak', () => {
  const ctx = freshAdapter(minimalD({ catatan: undefined }));
  assert.deepEqual(plain(ctx.getFamilySummary()), {
    anakCount: 0,
    milestoneDoneCount: 0,
    milestoneTotalCount: 0,
    reminderCount: 0,
  });
});

// ---- getDocumentSummary() ----

test('getDocumentSummary() menghitung simCount dari D.simList', () => {
  const ctx = freshAdapter(minimalD({
    simList: [{ id: 's1', jenis: 'SIM C' }, { id: 's2', jenis: 'SIM A' }],
  }));
  const result = ctx.getDocumentSummary();
  assert.equal(result.simCount, 2);
});

test('getDocumentSummary() menghitung vehicleTaxDocCount dari field pajakTahunanTgl/pajakLimaTahunTgl/ujiKelayakanTgl per kendaraan', () => {
  const ctx = freshAdapter(minimalD({
    vehicles: [
      { id: 'veh_1', pajakTahunanTgl: '2026-01-01', pajakLimaTahunTgl: null, ujiKelayakanTgl: null },
      { id: 'veh_2', pajakTahunanTgl: '2026-02-01', pajakLimaTahunTgl: '2027-02-01', ujiKelayakanTgl: '2026-06-01' },
      { id: 'veh_3' },
    ],
  }));
  const result = ctx.getDocumentSummary();
  // veh_1: 1 dokumen terisi, veh_2: 3 dokumen terisi, veh_3: 0 -> total 4
  assert.equal(result.vehicleTaxDocCount, 4);
});

test('getDocumentSummary() aman kalau D.simList/D.vehicles kosong', () => {
  const ctx = freshAdapter(minimalD());
  assert.deepEqual(plain(ctx.getDocumentSummary()), { simCount: 0, vehicleTaxDocCount: 0 });
});

// ---- Guard: D tidak tersedia ----

test('seluruh fungsi return null (bukan throw) kalau D belum ter-load sama sekali', () => {
  const ctx = loadSource(['dashboard-v2-data-adapter.js']);
  assert.doesNotThrow(() => {
    assert.equal(ctx.getFinanceSummary(), null);
    assert.equal(ctx.getVehicleSummary(), null);
    assert.equal(ctx.getFamilySummary(), null);
    assert.equal(ctx.getDocumentSummary(), null);
  });
});

test('seluruh fungsi return null kalau D === null secara eksplisit', () => {
  const ctx = freshAdapter(null);
  assert.equal(ctx.getFinanceSummary(), null);
  assert.equal(ctx.getVehicleSummary(), null);
  assert.equal(ctx.getFamilySummary(), null);
  assert.equal(ctx.getDocumentSummary(), null);
});

// ---- Read-only: tidak pernah menulis ke D ----

test('tidak satu pun fungsi adapter menulis/memutasi D — dicek pakai Proxy yang melarang `set`/`deleteProperty`', () => {
  const baseD = minimalD({
    accounts: [{ id: 'a1', balance: 1000 }],
    transactions: [{ id: 't1' }],
    vehicles: [{ id: 'veh_1', pajakTahunanTgl: '2026-01-01' }],
    bbmLogs: [{ id: 'b1' }],
    servisLogs: [{ id: 's1' }],
    catatan: { anak: [{ id: 'anak1' }] },
    milestones: [true, false],
    reminders: [{ id: 'r1' }],
    simList: [{ id: 'sim1' }],
  });
  const guardedD = new Proxy(baseD, {
    set() { throw new Error('D tidak boleh ditulis oleh adapter (read-only)'); },
    deleteProperty() { throw new Error('D tidak boleh dihapus propertinya oleh adapter (read-only)'); },
  });
  const ctx = freshAdapter(guardedD);
  assert.doesNotThrow(() => {
    ctx.getFinanceSummary();
    ctx.getVehicleSummary();
    ctx.getFamilySummary();
    ctx.getDocumentSummary();
  });
});

// ---- Tidak menyentuh document/showPage/FEATURE_REGISTRY ----

test('tidak menyentuh document/DOM sama sekali', () => {
  let documentTouched = false;
  const ctx = loadSource(['dashboard-v2-data-adapter.js'], {
    D: minimalD({ accounts: [{ id: 'a1', balance: 1 }] }),
    document: new Proxy({}, {
      get() { documentTouched = true; return () => {}; },
    }),
  });
  ctx.getFinanceSummary();
  ctx.getVehicleSummary();
  ctx.getFamilySummary();
  ctx.getDocumentSummary();
  assert.equal(documentTouched, false, 'dashboard-v2-data-adapter.js tidak boleh menyentuh document/DOM sama sekali');
});

test('tidak memanggil showPage()', () => {
  let showPageCalled = false;
  const ctx = loadSource(['dashboard-v2-data-adapter.js'], {
    D: minimalD({ accounts: [{ id: 'a1', balance: 1 }] }),
    showPage: () => { showPageCalled = true; },
  });
  ctx.getFinanceSummary();
  ctx.getVehicleSummary();
  ctx.getFamilySummary();
  ctx.getDocumentSummary();
  assert.equal(showPageCalled, false, 'dashboard-v2-data-adapter.js tidak boleh memanggil showPage()');
});

test('tidak memakai FEATURE_REGISTRY', () => {
  let registryAccessed = false;
  const ctx = loadSource(['dashboard-v2-data-adapter.js'], {
    D: minimalD({ accounts: [{ id: 'a1', balance: 1 }] }),
    FEATURE_REGISTRY: new Proxy({}, {
      get() { registryAccessed = true; return () => {}; },
    }),
  });
  ctx.getFinanceSummary();
  ctx.getVehicleSummary();
  ctx.getFamilySummary();
  ctx.getDocumentSummary();
  assert.equal(registryAccessed, false, 'dashboard-v2-data-adapter.js tidak boleh mengakses FEATURE_REGISTRY');
});

test('source file tidak mengandung referensi tekstual ke fetch(/showPage(/FEATURE_REGISTRY/DashboardV2Shell (jaminan statis)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-data-adapter.js'), 'utf8');
  // Comment header boleh MENYEBUT nama-nama ini sbg penjelasan constraint,
  // tapi tidak boleh ada baris kode aktif yg memanggil/membaca-nya.
  const codeOnly = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/\bfetch\s*\(/.test(codeOnly), false, 'tidak boleh ada fetch() di kode aktif');
  assert.equal(/showPage\s*\(/.test(codeOnly), false, 'tidak boleh memanggil showPage()');
  assert.equal(/FEATURE_REGISTRY/.test(codeOnly), false, 'tidak boleh mereferensikan FEATURE_REGISTRY');
  assert.equal(/DashboardV2Shell/.test(codeOnly), false, 'tidak boleh mereferensikan DashboardV2Shell (belum dipakai tahap ini)');
});

test('source file tidak mendeklarasikan variabel top-level mutable (let/var) — hanya function murni (jaminan "tanpa state baru")', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-data-adapter.js'), 'utf8');
  const codeOnly = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/^let\s+\w/m.test(codeOnly), false, 'tidak boleh ada `let` top-level (state baru)');
  assert.equal(/^var\s+\w/m.test(codeOnly), false, 'tidak boleh ada `var` top-level (state baru)');
});
