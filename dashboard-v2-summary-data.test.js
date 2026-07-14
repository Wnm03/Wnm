'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.18 — Summary Cards Data Integration (lihat DASHBOARD-V2-
// SUMMARY-DATA.md).
//
// Dashboard V2 mulai memakai dashboard-v2-data-adapter.js (V2.16) di
// Summary Cards, mengikuti pola persis Tahap V2.17 (Hero Data
// Integration). 4 elemen baru ditambah sbg anak Summary Cards, satu per
// fungsi adapter (getFinanceSummary/getVehicleSummary/getFamilySummary/
// getDocumentSummary), dgn fallback placeholder kalau adapter tidak
// tersedia/return `null`. 4 kartu Summary Cards lama (Total Balance/
// Monthly Income/Monthly Expense/Health Score, Tahap V2.3) TIDAK
// berubah.
//
// Fake DOM sama persis dgn tests/dashboard-v2-hero-data.test.js
// (createElement/appendChild/replaceChildren/getElementById), supaya
// berjalan tanpa jsdom, konsisten dgn pola test V2.1/V2.2/V2.17.

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
// sama sekali (mensimulasikan "adapter belum tersedia"). Summary Cards
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

function getSummaryCards(Shell) {
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  return main.children.find((c) => c.id === 'dashboardV2SummaryCards');
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
//    placeholder, 4 kartu lama tidak berubah.
// ---------------------------------------------------------------------------

test('Summary Cards: adapter tidak di-load sama sekali -> 4 elemen data summary tetap ada dgn fallback placeholder', () => {
  const { Shell } = loadShellOnly();
  const cards = getSummaryCards(Shell);
  assert.equal(cards.children.length, 8, 'Summary Cards harus 8 anak (4 lama V2.3 + 4 baru V2.18)');

  const finance = cards.children.find((c) => c.id === 'dashboardV2SummaryCardFinanceData');
  assert.ok(finance, 'Finance summary tidak ditemukan');
  assert.equal(finance.className, 'dashboard-v2-summary-card');
  assert.match(finance.textContent, /placeholder/i);
  assert.match(finance.getAttribute('aria-label'), /placeholder/i);

  const vehicle = cards.children.find((c) => c.id === 'dashboardV2SummaryCardVehicleData');
  assert.ok(vehicle, 'Vehicle summary tidak ditemukan');
  assert.equal(vehicle.className, 'dashboard-v2-summary-card');
  assert.match(vehicle.textContent, /placeholder/i);

  const family = cards.children.find((c) => c.id === 'dashboardV2SummaryCardFamilyData');
  assert.ok(family, 'Family summary tidak ditemukan');
  assert.equal(family.className, 'dashboard-v2-summary-card');
  assert.match(family.textContent, /placeholder/i);

  const documentEl = cards.children.find((c) => c.id === 'dashboardV2SummaryCardDocumentData');
  assert.ok(documentEl, 'Document summary tidak ditemukan');
  assert.equal(documentEl.className, 'dashboard-v2-summary-card');
  assert.match(documentEl.textContent, /placeholder/i);
});

test('Summary Cards: 4 kartu lama (Total Balance/Monthly Income/Monthly Expense/Health Score, Tahap V2.3) tidak berubah', () => {
  const { Shell } = loadShellOnly();
  const cards = getSummaryCards(Shell);
  const [balance, income, expense, health] = cards.children;
  assert.equal(balance.id, 'dashboardV2SummaryCardBalance');
  assert.match(balance.textContent, /Total Balance/);
  assert.match(balance.textContent, /placeholder/i);
  assert.equal(income.id, 'dashboardV2SummaryCardIncome');
  assert.match(income.textContent, /Monthly Income/);
  assert.match(income.textContent, /placeholder/i);
  assert.equal(expense.id, 'dashboardV2SummaryCardExpense');
  assert.match(expense.textContent, /Monthly Expense/);
  assert.match(expense.textContent, /placeholder/i);
  assert.equal(health.id, 'dashboardV2SummaryCardHealth');
  assert.match(health.textContent, /Health Score/);
  assert.match(health.textContent, /placeholder/i);
});

// ---------------------------------------------------------------------------
// 2. Adapter tersedia sbg fungsi global tapi return `null` -> tetap fallback
//    placeholder, bukan error.
// ---------------------------------------------------------------------------

test('Summary Cards: fungsi adapter tersedia tapi return null -> fallback placeholder (tidak error)', () => {
  const { Shell } = loadShellOnly({
    getFinanceSummary: () => null,
    getVehicleSummary: () => null,
    getFamilySummary: () => null,
    getDocumentSummary: () => null,
  });
  const cards = getSummaryCards(Shell);
  assert.equal(cards.children.length, 8);
  for (const id of ['dashboardV2SummaryCardFinanceData', 'dashboardV2SummaryCardVehicleData', 'dashboardV2SummaryCardFamilyData', 'dashboardV2SummaryCardDocumentData']) {
    const el = cards.children.find((c) => c.id === id);
    assert.ok(el, `${id} tidak ditemukan`);
    assert.match(el.textContent, /placeholder/i);
  }
});

// ---------------------------------------------------------------------------
// 3. Adapter tersedia & return objek dgn data -> ringkasan sungguhan tampil.
// ---------------------------------------------------------------------------

test('Summary Cards: getFinanceSummary() tersedia & ada data -> Finance summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getFinanceSummary: () => ({ accountCount: 3, totalBalance: 250000, transactionCount: 12 }),
  });
  const cards = getSummaryCards(Shell);
  const finance = cards.children.find((c) => c.id === 'dashboardV2SummaryCardFinanceData');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /3/);
  assert.match(finance.textContent, /250000/);
  assert.match(finance.textContent, /12/);
});

test('Summary Cards: getVehicleSummary() tersedia & ada data -> Vehicle summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getVehicleSummary: () => ({ vehicleCount: 2, bbmLogCount: 15, servisLogCount: 4 }),
  });
  const cards = getSummaryCards(Shell);
  const vehicle = cards.children.find((c) => c.id === 'dashboardV2SummaryCardVehicleData');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.match(vehicle.textContent, /2/);
  assert.match(vehicle.textContent, /15/);
  assert.match(vehicle.textContent, /4/);
});

test('Summary Cards: getFamilySummary() tersedia & ada data -> Family summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getFamilySummary: () => ({ anakCount: 2, milestoneDoneCount: 5, milestoneTotalCount: 8, reminderCount: 3 }),
  });
  const cards = getSummaryCards(Shell);
  const family = cards.children.find((c) => c.id === 'dashboardV2SummaryCardFamilyData');
  assert.doesNotMatch(family.textContent, /placeholder/i);
  assert.match(family.textContent, /2 anak/);
  assert.match(family.textContent, /5\/8/);
  assert.match(family.textContent, /3/);
});

test('Summary Cards: getDocumentSummary() tersedia & ada data -> Document summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getDocumentSummary: () => ({ simCount: 2, vehicleTaxDocCount: 5 }),
  });
  const cards = getSummaryCards(Shell);
  const documentEl = cards.children.find((c) => c.id === 'dashboardV2SummaryCardDocumentData');
  assert.doesNotMatch(documentEl.textContent, /placeholder/i);
  assert.match(documentEl.textContent, /2 SIM/);
  assert.match(documentEl.textContent, /5/);
});

// ---------------------------------------------------------------------------
// 4. Integrasi sungguhan: adapter ASLI (tidak di-mock) + shell dalam satu
//    sandbox, dgn `D` tiruan.
// ---------------------------------------------------------------------------

test('Integrasi sungguhan: adapter asli + D tiruan -> Summary Cards menampilkan ringkasan dari D', () => {
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
  const cards = getSummaryCards(Shell);
  assert.equal(cards.children.length, 8);

  const finance = cards.children.find((c) => c.id === 'dashboardV2SummaryCardFinanceData');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /2 akun/);
  assert.match(finance.textContent, /150000/);
  assert.match(finance.textContent, /2 transaksi/);

  const vehicle = cards.children.find((c) => c.id === 'dashboardV2SummaryCardVehicleData');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.match(vehicle.textContent, /1 kendaraan/);
  assert.match(vehicle.textContent, /1 catatan BBM/);
  assert.match(vehicle.textContent, /0 catatan servis/);

  const family = cards.children.find((c) => c.id === 'dashboardV2SummaryCardFamilyData');
  assert.doesNotMatch(family.textContent, /placeholder/i);
  assert.match(family.textContent, /1 anak/);
  assert.match(family.textContent, /1\/2 milestone/);
  assert.match(family.textContent, /1 pengingat/);

  const documentEl = cards.children.find((c) => c.id === 'dashboardV2SummaryCardDocumentData');
  assert.doesNotMatch(documentEl.textContent, /placeholder/i);
  assert.match(documentEl.textContent, /1 SIM/);
  assert.match(documentEl.textContent, /1 dokumen pajak kendaraan/);
});

test('Integrasi sungguhan: adapter asli tapi D belum ter-load -> fallback placeholder (adapter return null, tidak error)', () => {
  const { Shell } = loadShellWithRealAdapter(undefined);
  const cards = getSummaryCards(Shell);
  assert.equal(cards.children.length, 8);
  for (const id of ['dashboardV2SummaryCardFinanceData', 'dashboardV2SummaryCardVehicleData', 'dashboardV2SummaryCardFamilyData', 'dashboardV2SummaryCardDocumentData']) {
    const el = cards.children.find((c) => c.id === id);
    assert.match(el.textContent, /placeholder/i);
  }
});

test('Integrasi sungguhan: render() tetap idempotent (Summary Cards 8 anak, tidak menumpuk saat dipanggil ulang)', () => {
  const D = minimalD();
  const { Shell } = loadShellWithRealAdapter(D);
  Shell.render();
  const cards = getSummaryCards(Shell);
  assert.equal(cards.children.length, 8);
});

// ---------------------------------------------------------------------------
// 5. Aksesibilitas: setiap elemen baru punya aria-label.
// ---------------------------------------------------------------------------

test('Summary Cards: 4 elemen data summary baru semuanya punya aria-label', () => {
  const { Shell } = loadShellOnly();
  const cards = getSummaryCards(Shell);
  for (const id of ['dashboardV2SummaryCardFinanceData', 'dashboardV2SummaryCardVehicleData', 'dashboardV2SummaryCardFamilyData', 'dashboardV2SummaryCardDocumentData']) {
    const el = cards.children.find((c) => c.id === id);
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

test('dashboard-v2-shell.js (setelah V2.18) tetap tidak fetch/routing/FEATURE_REGISTRY, tidak membaca D langsung', () => {
  assert.doesNotMatch(shellCodeOnly, /fetch\s*\(/);
  assert.doesNotMatch(shellCodeOnly, /showPage\s*\(/);
  assert.doesNotMatch(shellCodeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(shellCodeOnly, /\bD\.\w/, 'shell TIDAK boleh membaca `D` langsung — harus lewat adapter');
  assert.doesNotMatch(shellCodeOnly, /innerHTML/);
});

test('dashboard-v2-data-adapter.js TIDAK diubah tahap ini (identik dgn isi baseline V2.16/V2.17)', () => {
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

test('Summary Cards: Hero (V2.17) tidak ikut berubah oleh V2.18 (tetap 8 anak: 4 lama + 4 data summary)', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  assert.equal(hero.children.length, 8, 'Hero harus tetap 8 anak seperti V2.17, tidak disentuh V2.18');
});

for (const file of ['index.html', 'app_production.html']) {
  test(`${file}: tetap 0 markup Dashboard V2 (Summary Cards Data Integration tetap self-mounting via JS)`, () => {
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
