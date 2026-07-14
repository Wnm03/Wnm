'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.21 — Recent Activity Data Integration (lihat DASHBOARD-V2-
// RECENT-ACTIVITY-DATA.md).
//
// Dashboard V2 mulai memakai dashboard-v2-data-adapter.js (V2.16) di
// Recent Activity, mengikuti pola persis Tahap V2.17 (Hero), V2.18
// (Summary Cards), V2.19 (Module Grid) & V2.20 (Statistics Panel). 4
// elemen baru ditambah sbg anak Recent Activity, satu per fungsi
// adapter (getFinanceSummary/getVehicleSummary/getFamilySummary/
// getDocumentSummary), dgn fallback placeholder kalau adapter tidak
// tersedia/return `null`. 5 baris Recent Activity lama (item1-item5,
// Tahap V2.6) TIDAK berubah.
//
// Fake DOM sama persis dgn tests/dashboard-v2-statistics-data.test.js
// (createElement/appendChild/replaceChildren/getElementById), supaya
// berjalan tanpa jsdom, konsisten dgn pola test V2.1/V2.2/V2.17/V2.18/
// V2.19/V2.20.

function createFakeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    type: '',
    disabled: false,
    textContent: '',
    attributes: {},
    children: [],
    parentNode: null,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
      child.parentNode = null;
      return child;
    },
    get firstChild() { return this.children[0] || null; },
    replaceChildren(...nodes) {
      this.children.forEach((c) => { c.parentNode = null; });
      this.children = [];
      nodes.forEach((n) => this.appendChild(n));
    },
  };
  return el;
}

function makeFakeDocument() {
  const body = createFakeElement('body');
  return {
    body,
    createElement: (tag) => createFakeElement(tag),
    getElementById: () => null,
  };
}

// loadShellOnly() — HANYA dashboard-v2-shell.js, adapter TIDAK di-load
// sama sekali (mensimulasikan "adapter belum tersedia"). Recent Activity
// harus tetap utuh & fallback ke placeholder, bukan error.
function loadShellOnly(extraGlobals = {}) {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
    ...extraGlobals,
  });
  return { Shell: context.window.DashboardV2Shell };
}

// loadShellWithRealAdapter(D) — load dashboard-v2-data-adapter.js (source
// ASLI, tidak di-mock) + dashboard-v2-shell.js dalam SATU sandbox, dgn `D`
// tiruan di-inject — integrasi sungguhan end-to-end, bukan cuma mock.
function loadShellWithRealAdapter(D) {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const extraGlobals = { document: fakeDocument, window: fakeWindow };
  if (D !== undefined) extraGlobals.D = D;
  const context = loadSource(['dashboard-v2-data-adapter.js', 'dashboard-v2-shell.js'], extraGlobals);
  return { Shell: context.window.DashboardV2Shell };
}

function getRecentActivity(Shell) {
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  return main.children.find((c) => c.id === 'dashboardV2RecentActivity');
}

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

// ---------------------------------------------------------------------------
// 1. Adapter TIDAK tersedia sama sekali -> 4 elemen baru tetap ada, fallback
//    placeholder, 5 baris lama tidak berubah.
// ---------------------------------------------------------------------------

test('Recent Activity: adapter tidak di-load sama sekali -> 4 elemen data summary tetap ada dgn fallback placeholder', () => {
  const { Shell } = loadShellOnly();
  const activity = getRecentActivity(Shell);
  assert.equal(activity.children.length, 9, 'Recent Activity harus 9 anak (5 lama V2.6 + 4 baru V2.21)');

  const finance = activity.children.find((c) => c.id === 'dashboardV2RecentActivityFinanceData');
  assert.ok(finance, 'Finance summary tidak ditemukan');
  assert.equal(finance.className, 'dashboard-v2-recent-activity-item');
  assert.match(finance.textContent, /placeholder/i);
  assert.match(finance.getAttribute('aria-label'), /placeholder/i);

  const vehicle = activity.children.find((c) => c.id === 'dashboardV2RecentActivityVehicleData');
  assert.ok(vehicle, 'Vehicle summary tidak ditemukan');
  assert.equal(vehicle.className, 'dashboard-v2-recent-activity-item');
  assert.match(vehicle.textContent, /placeholder/i);

  const family = activity.children.find((c) => c.id === 'dashboardV2RecentActivityFamilyData');
  assert.ok(family, 'Family summary tidak ditemukan');
  assert.equal(family.className, 'dashboard-v2-recent-activity-item');
  assert.match(family.textContent, /placeholder/i);

  const documentEl = activity.children.find((c) => c.id === 'dashboardV2RecentActivityDocumentData');
  assert.ok(documentEl, 'Document summary tidak ditemukan');
  assert.equal(documentEl.className, 'dashboard-v2-recent-activity-item');
  assert.match(documentEl.textContent, /placeholder/i);
});

test('Recent Activity: 5 baris lama (item1-item5, Tahap V2.6) tidak berubah', () => {
  const { Shell } = loadShellOnly();
  const activity = getRecentActivity(Shell);
  const [item1, item2, item3, item4, item5] = activity.children;
  assert.equal(item1.id, 'dashboardV2RecentActivityItem1');
  assert.match(item1.textContent, /Transaksi tercatat/);
  assert.match(item1.textContent, /placeholder/i);
  assert.equal(item2.id, 'dashboardV2RecentActivityItem2');
  assert.match(item2.textContent, /Backup terakhir dijalankan/);
  assert.equal(item3.id, 'dashboardV2RecentActivityItem3');
  assert.match(item3.textContent, /Catatan kendaraan diperbarui/);
  assert.equal(item4.id, 'dashboardV2RecentActivityItem4');
  assert.match(item4.textContent, /Laporan dibuat/);
  assert.equal(item5.id, 'dashboardV2RecentActivityItem5');
  assert.match(item5.textContent, /Anggota keluarga ditambahkan/);
});

// ---------------------------------------------------------------------------
// 2. Adapter tersedia sbg fungsi global tapi return `null` -> tetap fallback
//    placeholder, bukan error.
// ---------------------------------------------------------------------------

test('Recent Activity: fungsi adapter tersedia tapi return null -> fallback placeholder (tidak error)', () => {
  const { Shell } = loadShellOnly({
    getFinanceSummary: () => null,
    getVehicleSummary: () => null,
    getFamilySummary: () => null,
    getDocumentSummary: () => null,
  });
  const activity = getRecentActivity(Shell);
  assert.equal(activity.children.length, 9);
  for (const id of ['dashboardV2RecentActivityFinanceData', 'dashboardV2RecentActivityVehicleData', 'dashboardV2RecentActivityFamilyData', 'dashboardV2RecentActivityDocumentData']) {
    const el = activity.children.find((c) => c.id === id);
    assert.ok(el, `${id} tidak ditemukan`);
    assert.match(el.textContent, /placeholder/i);
  }
});

// ---------------------------------------------------------------------------
// 3. Adapter tersedia & return objek dgn data -> ringkasan sungguhan tampil.
// ---------------------------------------------------------------------------

test('Recent Activity: getFinanceSummary() tersedia & ada data -> Finance summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getFinanceSummary: () => ({ accountCount: 3, totalBalance: 250000, transactionCount: 12 }),
  });
  const activity = getRecentActivity(Shell);
  const finance = activity.children.find((c) => c.id === 'dashboardV2RecentActivityFinanceData');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /3/);
  assert.match(finance.textContent, /250000/);
  assert.match(finance.textContent, /12/);
});

test('Recent Activity: getVehicleSummary() tersedia & ada data -> Vehicle summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getVehicleSummary: () => ({ vehicleCount: 2, bbmLogCount: 15, servisLogCount: 4 }),
  });
  const activity = getRecentActivity(Shell);
  const vehicle = activity.children.find((c) => c.id === 'dashboardV2RecentActivityVehicleData');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.match(vehicle.textContent, /2/);
  assert.match(vehicle.textContent, /15/);
  assert.match(vehicle.textContent, /4/);
});

test('Recent Activity: getFamilySummary() tersedia & ada data -> Family summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getFamilySummary: () => ({ anakCount: 2, milestoneDoneCount: 5, milestoneTotalCount: 8, reminderCount: 3 }),
  });
  const activity = getRecentActivity(Shell);
  const family = activity.children.find((c) => c.id === 'dashboardV2RecentActivityFamilyData');
  assert.doesNotMatch(family.textContent, /placeholder/i);
  assert.match(family.textContent, /2 anak/);
  assert.match(family.textContent, /5\/8/);
  assert.match(family.textContent, /3/);
});

test('Recent Activity: getDocumentSummary() tersedia & ada data -> Document summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getDocumentSummary: () => ({ simCount: 2, vehicleTaxDocCount: 5 }),
  });
  const activity = getRecentActivity(Shell);
  const documentEl = activity.children.find((c) => c.id === 'dashboardV2RecentActivityDocumentData');
  assert.doesNotMatch(documentEl.textContent, /placeholder/i);
  assert.match(documentEl.textContent, /2 SIM/);
  assert.match(documentEl.textContent, /5/);
});

// ---------------------------------------------------------------------------
// 4. Integrasi sungguhan: adapter ASLI (tidak di-mock) + shell dalam satu
//    sandbox, dgn `D` tiruan.
// ---------------------------------------------------------------------------

test('Integrasi sungguhan: adapter asli + D tiruan -> Recent Activity menampilkan ringkasan dari D', () => {
  const D = minimalD({
    accounts: [{ id: 'a1', balance: 100000 }, { id: 'a2', balance: 50000 }],
    transactions: [{ id: 't1' }, { id: 't2' }],
    vehicles: [{ id: 'v1', pajakTahunanTgl: '2026-01-01' }],
    bbmLogs: [{ id: 'b1' }],
    servisLogs: [],
    catatan: { anak: [{ id: 'k1' }] },
    milestones: [true, false],
    reminders: [{ id: 'r1' }],
    simList: [{ id: 's1' }],
  });
  const { Shell } = loadShellWithRealAdapter(D);
  const activity = getRecentActivity(Shell);
  assert.equal(activity.children.length, 9);

  const finance = activity.children.find((c) => c.id === 'dashboardV2RecentActivityFinanceData');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /2 akun/);
  assert.match(finance.textContent, /150000/);
  assert.match(finance.textContent, /2 transaksi/);

  const vehicle = activity.children.find((c) => c.id === 'dashboardV2RecentActivityVehicleData');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.match(vehicle.textContent, /1 kendaraan/);
  assert.match(vehicle.textContent, /1 catatan BBM/);
  assert.match(vehicle.textContent, /0 catatan servis/);

  const family = activity.children.find((c) => c.id === 'dashboardV2RecentActivityFamilyData');
  assert.doesNotMatch(family.textContent, /placeholder/i);
  assert.match(family.textContent, /1 anak/);
  assert.match(family.textContent, /1\/2 milestone/);
  assert.match(family.textContent, /1 pengingat/);

  const documentEl = activity.children.find((c) => c.id === 'dashboardV2RecentActivityDocumentData');
  assert.doesNotMatch(documentEl.textContent, /placeholder/i);
  assert.match(documentEl.textContent, /1 SIM/);
  assert.match(documentEl.textContent, /1 dokumen pajak kendaraan/);
});

test('Integrasi sungguhan: adapter asli tapi D belum ter-load -> fallback placeholder (adapter return null, tidak error)', () => {
  const { Shell } = loadShellWithRealAdapter(undefined);
  const activity = getRecentActivity(Shell);
  assert.equal(activity.children.length, 9);
  for (const id of ['dashboardV2RecentActivityFinanceData', 'dashboardV2RecentActivityVehicleData', 'dashboardV2RecentActivityFamilyData', 'dashboardV2RecentActivityDocumentData']) {
    const el = activity.children.find((c) => c.id === id);
    assert.match(el.textContent, /placeholder/i);
  }
});

test('Integrasi sungguhan: render() tetap idempotent (Recent Activity 9 anak, tidak menumpuk saat dipanggil ulang)', () => {
  const D = minimalD();
  const { Shell } = loadShellWithRealAdapter(D);
  Shell.render();
  const activity = getRecentActivity(Shell);
  assert.equal(activity.children.length, 9);
});

// ---------------------------------------------------------------------------
// 5. Aksesibilitas: setiap elemen baru punya aria-label.
// ---------------------------------------------------------------------------

test('Recent Activity: 4 elemen data summary baru semuanya punya aria-label', () => {
  const { Shell } = loadShellOnly();
  const activity = getRecentActivity(Shell);
  for (const id of ['dashboardV2RecentActivityFinanceData', 'dashboardV2RecentActivityVehicleData', 'dashboardV2RecentActivityFamilyData', 'dashboardV2RecentActivityDocumentData']) {
    const el = activity.children.find((c) => c.id === id);
    assert.ok(el.getAttribute('aria-label'), `${id} harus punya aria-label`);
  }
});

// ---------------------------------------------------------------------------
// 6. Constraint check (statis, regex kode aktif — komentar dibuang dulu):
//    additive, tanpa fetch, tanpa D langsung di shell, tanpa routing,
//    tanpa showPage(), tanpa FEATURE_REGISTRY, tanpa state instance baru,
//    adapter sendiri tidak diubah (tetap sama persis dgn baseline V2.16).
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const shellCodeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('dashboard-v2-shell.js (setelah V2.21) tetap tidak fetch/routing/FEATURE_REGISTRY, tidak membaca D langsung', () => {
  assert.doesNotMatch(shellCodeOnly, /fetch\s*\(/);
  // Tahap V2.43 (persetujuan eksplisit user): showPage() sekarang LEGIT
  // dipakai di navigateTo() (lihat DASHBOARD-V2-BOTTOMNAV-WIREUP.md).
  // Guard larangan showPage() dihapus dari sini; guard spesifik ada di
  // tests/dashboard-v2-navigation.test.js.
  assert.doesNotMatch(shellCodeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(shellCodeOnly, /\bD\.\w/, 'shell TIDAK boleh membaca `D` langsung — harus lewat adapter');
  assert.doesNotMatch(shellCodeOnly, /innerHTML/);
});

test('dashboard-v2-data-adapter.js TIDAK diubah tahap ini (identik dgn isi baseline V2.16/V2.17/V2.18/V2.19/V2.20)', () => {
  const adapterSource = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-data-adapter.js'), 'utf8');
  const fnMatches = adapterSource.match(/^function \w+\(/gm) || [];
  assert.deepEqual(
    fnMatches.sort(),
    ['function _dashV2AdapterHasD(', 'function getDocumentSummary(', 'function getFamilySummary(', 'function getFinanceSummary(', 'function getVehicleSummary('].sort(),
  );
  assert.doesNotMatch(adapterSource, /^(let|var) /m);
});

test('dashboard-v2-shell.js: 4 fungsi adapter dipanggil lewat guard typeof (Hero V2.17 + Summary Cards V2.18 + Module Grid V2.19 + Statistics Panel V2.20 + Recent Activity V2.21 + Upcoming Tasks V2.22 + Notifications V2.23 + Automation Center V2.24 + AI Command Center V2.25 + Health Score V2.26 = 10x per fungsi)', () => {
  for (const fn of ['getFinanceSummary', 'getVehicleSummary', 'getFamilySummary', 'getDocumentSummary']) {
    const guardMatches = shellCodeOnly.match(new RegExp(`typeof ${fn} === 'function'`, 'g')) || [];
    assert.equal(guardMatches.length, 11, `${fn} harus dipanggil lewat guard typeof tepat 11x (Hero + Summary Cards + Module Grid + Statistics Panel + Recent Activity + Upcoming Tasks + Notifications + Automation Center + AI Command Center + Health Score + Predictive Insights)`);
  }
});

test('Hero (V2.17), Summary Cards (V2.18), Module Grid (V2.19) & Statistics Panel (V2.20) tidak ikut berubah oleh V2.21', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  const cards = main.children.find((c) => c.id === 'dashboardV2SummaryCards');
  const moduleGrid = main.children.find((c) => c.id === 'dashboardV2ModuleGrid');
  const statisticsPanel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  assert.equal(hero.children.length, 8, 'Hero harus tetap 8 anak seperti V2.17, tidak disentuh V2.21');
  assert.equal(cards.children.length, 8, 'Summary Cards harus tetap 8 anak seperti V2.18, tidak disentuh V2.21');
  assert.equal(moduleGrid.children.length, 10, 'Module Grid harus tetap 10 anak seperti V2.19, tidak disentuh V2.21');
  assert.equal(statisticsPanel.children.length, 8, 'Statistics Panel harus tetap 8 anak seperti V2.20, tidak disentuh V2.21');
});

for (const file of ['index.html', 'app_production.html']) {
  test(`${file}: tetap 0 markup Dashboard V2 (Recent Activity Data Integration tetap self-mounting via JS)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
  });
}

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 (jumlah guard mount/destroy tetap 2)', () => {
  const hubSrc = fs.readFileSync(path.join(__dirname, '..', 'dashboard-hub.js'), 'utf8');
  const dashboardV2ShellGuardMatches = hubSrc.match(/typeof DashboardV2Shell !== 'undefined'/g) || [];
  assert.equal(dashboardV2ShellGuardMatches.length, 2);
});
