'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.17 — Hero Data Integration (lihat DASHBOARD-V2-HERO-DATA.md).
//
// Dashboard V2 mulai memakai dashboard-v2-data-adapter.js (V2.16), TAPI
// HANYA di Hero (_buildHero). 4 elemen baru ditambah sbg anak Hero, satu
// per fungsi adapter (getFinanceSummary/getVehicleSummary/
// getFamilySummary/getDocumentSummary), dgn fallback placeholder kalau
// adapter tidak tersedia/return `null`. 4 elemen Hero lama (title/
// healthScore/balance/insight, Tahap V2.2) TIDAK berubah.
//
// Fake DOM sama persis dgn tests/dashboard-v2-hero.test.js (createElement/
// appendChild/replaceChildren/getElementById), supaya berjalan tanpa
// jsdom, konsisten dgn pola test V2.1/V2.2.

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
// sama sekali (mensimulasikan "adapter belum tersedia" — mis. urutan
// load beda, atau file adapter belum ada di halaman). Hero harus tetap
// utuh & fallback ke placeholder, bukan error.
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

function getHero(Shell) {
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  return main.children.find((c) => c.id === 'dashboardV2Hero');
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
//    placeholder, 4 elemen lama tidak berubah.
// ---------------------------------------------------------------------------

test('Hero: adapter tidak di-load sama sekali -> 4 elemen data summary tetap ada dgn fallback placeholder', () => {
  const { Shell } = loadShellOnly();
  const hero = getHero(Shell);
  assert.equal(hero.children.length, 8, 'Hero harus 8 anak (4 lama V2.2 + 4 baru V2.17)');

  const finance = hero.children.find((c) => c.id === 'dashboardV2HeroFinanceSummary');
  assert.ok(finance, 'Finance summary tidak ditemukan');
  assert.equal(finance.className, 'dashboard-v2-hero-finance-summary');
  assert.match(finance.textContent, /placeholder/i);
  assert.match(finance.getAttribute('aria-label'), /placeholder/i);

  const vehicle = hero.children.find((c) => c.id === 'dashboardV2HeroVehicleSummary');
  assert.ok(vehicle, 'Vehicle summary tidak ditemukan');
  assert.equal(vehicle.className, 'dashboard-v2-hero-vehicle-summary');
  assert.match(vehicle.textContent, /placeholder/i);

  const family = hero.children.find((c) => c.id === 'dashboardV2HeroFamilySummary');
  assert.ok(family, 'Family summary tidak ditemukan');
  assert.equal(family.className, 'dashboard-v2-hero-family-summary');
  assert.match(family.textContent, /placeholder/i);

  const document_ = hero.children.find((c) => c.id === 'dashboardV2HeroDocumentSummary');
  assert.ok(document_, 'Document summary tidak ditemukan');
  assert.equal(document_.className, 'dashboard-v2-hero-document-summary');
  assert.match(document_.textContent, /placeholder/i);
});

test('Hero: 4 elemen lama (title/healthScore/balance/insight, Tahap V2.2) tidak berubah', () => {
  const { Shell } = loadShellOnly();
  const hero = getHero(Shell);
  const [title, healthScore, balance, insight] = hero.children;
  assert.equal(title.id, 'dashboardV2HeroTitle');
  assert.match(title.textContent, /placeholder/i);
  assert.equal(healthScore.id, 'dashboardV2HeroHealthScore');
  assert.match(healthScore.textContent, /placeholder/i);
  assert.equal(balance.id, 'dashboardV2HeroBalance');
  assert.match(balance.textContent, /placeholder/i);
  assert.equal(insight.id, 'dashboardV2HeroInsight');
  assert.match(insight.textContent, /placeholder/i);
});

// ---------------------------------------------------------------------------
// 2. Adapter tersedia sbg fungsi global tapi return `null` (mis. `D` belum
//    ter-load di adapter aslinya) -> tetap fallback placeholder, bukan error.
// ---------------------------------------------------------------------------

test('Hero: fungsi adapter tersedia tapi return null -> fallback placeholder (tidak error)', () => {
  const { Shell } = loadShellOnly({
    getFinanceSummary: () => null,
    getVehicleSummary: () => null,
    getFamilySummary: () => null,
    getDocumentSummary: () => null,
  });
  const hero = getHero(Shell);
  assert.equal(hero.children.length, 8);
  for (const id of ['dashboardV2HeroFinanceSummary', 'dashboardV2HeroVehicleSummary', 'dashboardV2HeroFamilySummary', 'dashboardV2HeroDocumentSummary']) {
    const el = hero.children.find((c) => c.id === id);
    assert.ok(el, `${id} tidak ditemukan`);
    assert.match(el.textContent, /placeholder/i);
  }
});

// ---------------------------------------------------------------------------
// 3. Adapter tersedia & mengembalikan data -> Hero menampilkan ringkasan
//    dari data itu (bukan placeholder), dgn fungsi adapter di-mock sederhana.
// ---------------------------------------------------------------------------

test('Hero: getFinanceSummary() tersedia & ada data -> Finance summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getFinanceSummary: () => ({ accountCount: 3, totalBalance: 250000, transactionCount: 12 }),
  });
  const hero = getHero(Shell);
  const finance = hero.children.find((c) => c.id === 'dashboardV2HeroFinanceSummary');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /3/);
  assert.match(finance.textContent, /250000/);
  assert.match(finance.textContent, /12/);
});

test('Hero: getVehicleSummary() tersedia & ada data -> Vehicle summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getVehicleSummary: () => ({ vehicleCount: 2, bbmLogCount: 15, servisLogCount: 4 }),
  });
  const hero = getHero(Shell);
  const vehicle = hero.children.find((c) => c.id === 'dashboardV2HeroVehicleSummary');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.match(vehicle.textContent, /2/);
  assert.match(vehicle.textContent, /15/);
  assert.match(vehicle.textContent, /4/);
});

test('Hero: getFamilySummary() tersedia & ada data -> Family summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getFamilySummary: () => ({ anakCount: 2, milestoneDoneCount: 5, milestoneTotalCount: 8, reminderCount: 3 }),
  });
  const hero = getHero(Shell);
  const family = hero.children.find((c) => c.id === 'dashboardV2HeroFamilySummary');
  assert.doesNotMatch(family.textContent, /placeholder/i);
  assert.match(family.textContent, /2 anak/);
  assert.match(family.textContent, /5\/8/);
  assert.match(family.textContent, /3/);
});

test('Hero: getDocumentSummary() tersedia & ada data -> Document summary menampilkan ringkasannya', () => {
  const { Shell } = loadShellOnly({
    getDocumentSummary: () => ({ simCount: 2, vehicleTaxDocCount: 5 }),
  });
  const hero = getHero(Shell);
  const documentEl = hero.children.find((c) => c.id === 'dashboardV2HeroDocumentSummary');
  assert.doesNotMatch(documentEl.textContent, /placeholder/i);
  assert.match(documentEl.textContent, /2 SIM/);
  assert.match(documentEl.textContent, /5/);
});

// ---------------------------------------------------------------------------
// 4. Integrasi sungguhan: adapter ASLI (dashboard-v2-data-adapter.js, tidak
//    di-mock) + shell dalam satu sandbox, dgn `D` tiruan.
// ---------------------------------------------------------------------------

test('Integrasi sungguhan: adapter asli + D tiruan -> Hero menampilkan ringkasan dari D', () => {
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
  const hero = getHero(Shell);
  assert.equal(hero.children.length, 8);

  const finance = hero.children.find((c) => c.id === 'dashboardV2HeroFinanceSummary');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /2 akun/);
  assert.match(finance.textContent, /150000/);
  assert.match(finance.textContent, /2 transaksi/);

  const vehicle = hero.children.find((c) => c.id === 'dashboardV2HeroVehicleSummary');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.match(vehicle.textContent, /1 kendaraan/);
  assert.match(vehicle.textContent, /1 catatan BBM/);
  assert.match(vehicle.textContent, /0 catatan servis/);

  const family = hero.children.find((c) => c.id === 'dashboardV2HeroFamilySummary');
  assert.doesNotMatch(family.textContent, /placeholder/i);
  assert.match(family.textContent, /1 anak/);
  assert.match(family.textContent, /1\/2 milestone/);
  assert.match(family.textContent, /1 pengingat/);

  const documentEl = hero.children.find((c) => c.id === 'dashboardV2HeroDocumentSummary');
  assert.doesNotMatch(documentEl.textContent, /placeholder/i);
  assert.match(documentEl.textContent, /1 SIM/);
  assert.match(documentEl.textContent, /1 dokumen pajak kendaraan/);
});

test('Integrasi sungguhan: adapter asli tapi D belum ter-load -> fallback placeholder (adapter return null, tidak error)', () => {
  const { Shell } = loadShellWithRealAdapter(undefined);
  const hero = getHero(Shell);
  assert.equal(hero.children.length, 8);
  for (const id of ['dashboardV2HeroFinanceSummary', 'dashboardV2HeroVehicleSummary', 'dashboardV2HeroFamilySummary', 'dashboardV2HeroDocumentSummary']) {
    const el = hero.children.find((c) => c.id === id);
    assert.match(el.textContent, /placeholder/i);
  }
});

test('Integrasi sungguhan: render() tetap idempotent (Hero 8 anak, tidak menumpuk saat dipanggil ulang)', () => {
  const D = minimalD();
  const { Shell } = loadShellWithRealAdapter(D);
  Shell.render();
  const hero = getHero(Shell);
  assert.equal(hero.children.length, 8);
});

// ---------------------------------------------------------------------------
// 5. Aksesibilitas: setiap elemen baru punya aria-label.
// ---------------------------------------------------------------------------

test('Hero: 4 elemen data summary baru semuanya punya aria-label', () => {
  const { Shell } = loadShellOnly();
  const hero = getHero(Shell);
  for (const id of ['dashboardV2HeroFinanceSummary', 'dashboardV2HeroVehicleSummary', 'dashboardV2HeroFamilySummary', 'dashboardV2HeroDocumentSummary']) {
    const el = hero.children.find((c) => c.id === id);
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

test('dashboard-v2-shell.js (setelah V2.17) tetap tidak fetch/routing/FEATURE_REGISTRY, tidak membaca D langsung', () => {
  assert.doesNotMatch(shellCodeOnly, /fetch\s*\(/);
  assert.doesNotMatch(shellCodeOnly, /showPage\s*\(/);
  assert.doesNotMatch(shellCodeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(shellCodeOnly, /\bD\.\w/, 'shell TIDAK boleh membaca `D` langsung — harus lewat adapter');
  assert.doesNotMatch(shellCodeOnly, /innerHTML/);
});

test('dashboard-v2-data-adapter.js TIDAK diubah tahap ini (identik dgn isi baseline V2.16)', () => {
  const adapterSource = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-data-adapter.js'), 'utf8');
  // Jaminan tidak langsung "hash" (tidak ada baseline file terpisah utk
  // dibandingkan dari dalam test), tapi minimal pastikan tanda tangan API
  // publiknya persis 4 fungsi yg sama seperti V2.16, tanpa fungsi baru,
  // tanpa `let`/`var` top-level baru (adapter tetap read-only/stateless).
  const fnMatches = adapterSource.match(/^function \w+\(/gm) || [];
  assert.deepEqual(
    fnMatches.sort(),
    ['function _dashV2AdapterHasD(', 'function getDocumentSummary(', 'function getFamilySummary(', 'function getFinanceSummary(', 'function getVehicleSummary('].sort(),
  );
  assert.doesNotMatch(adapterSource, /^(let|var) /m);
});

test('dashboard-v2-shell.js: 4 fungsi adapter dipanggil lewat guard typeof, bukan dipanggil unconditional', () => {
  for (const fn of ['getFinanceSummary', 'getVehicleSummary', 'getFamilySummary', 'getDocumentSummary']) {
    const guardPattern = new RegExp(`typeof ${fn} === 'function'`);
    assert.match(shellCodeOnly, guardPattern, `${fn} harus dipanggil lewat guard typeof`);
  }
});

for (const file of ['index.html', 'app_production.html']) {
  test(`${file}: tetap 0 markup Dashboard V2 (Hero Data Integration tetap self-mounting via JS)`, () => {
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
