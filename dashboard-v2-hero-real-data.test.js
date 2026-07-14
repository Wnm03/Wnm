'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.31 — Hero Real Data (lihat DASHBOARD-V2-HERO-REAL-DATA.md).
//
// Bedanya dgn Tahap V2.17 (tests/dashboard-v2-hero-data.test.js): V2.17
// MENAMBAH 4 elemen baru di Hero tanpa menyentuh 4 placeholder LAMA
// (title/healthScore/balance/insight, Tahap V2.2). V2.31 sebaliknya
// MENGGANTI isi 4 placeholder LAMA itu jadi data nyata dari
// dashboard-v2-data-adapter.js (V2.16, tidak diubah) — REUSE fungsi
// adapter yang sama yang sudah dipakai 4 elemen V2.17. Test ini HANYA
// menguji jalur baru itu; jalur "adapter belum tersedia" (fallback
// placeholder) sudah dikunci oleh tests/dashboard-v2-hero.test.js &
// tests/dashboard-v2-hero-data.test.js (keduanya tidak diubah & tetap
// lulus, dibuktikan dgn dijalankan bersama suite penuh).

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

// loadShellWithRealAdapter(D) — load dashboard-v2-data-adapter.js (source
// ASLI, tidak di-mock) + dashboard-v2-shell.js dalam SATU sandbox, dgn `D`
// tiruan di-inject — integrasi sungguhan end-to-end, sama pola dgn
// tests/dashboard-v2-hero-data.test.js.
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

test('Hero Real Data: 4 placeholder LAMA (title/healthScore/balance/insight) menampilkan data nyata dari adapter existing + D tiruan (bukan lagi teks "placeholder")', () => {
  const D = minimalD({
    accounts: [{ id: 'a1', balance: 100000 }, { id: 'a2', balance: 50000 }],
    transactions: [{ id: 't1' }, { id: 't2' }],
    vehicles: [{ id: 'v1', pajakTahunanTgl: '2026-01-01' }],
    bbmLogs: [{ id: 'b1' }],
    catatan: { anak: [{ id: 'k1' }] },
    milestones: [true, false],
    reminders: [{ id: 'r1' }],
    simList: [{ id: 's1' }],
  });
  const { Shell } = loadShellWithRealAdapter(D);
  const hero = getHero(Shell);
  assert.equal(hero.children.length, 8, 'Hero tetap 8 anak (4 lama + 4 baru V2.17), tidak ada elemen baru ditambah V2.31');

  const [title, healthScore, balance, insight] = hero.children;

  assert.equal(title.id, 'dashboardV2HeroTitle');
  assert.doesNotMatch(title.textContent, /placeholder/i, 'title harus data nyata, bukan placeholder lagi');
  // accountCount(2) + vehicleCount(1) + anakCount(1) + simCount(1) = 5
  assert.match(title.textContent, /5/);

  assert.equal(healthScore.id, 'dashboardV2HeroHealthScore');
  assert.doesNotMatch(healthScore.textContent, /placeholder/i, 'healthScore harus data nyata, bukan placeholder lagi');
  // 4 domain (akun/kendaraan/anak/SIM) semuanya terisi -> 4/4
  assert.match(healthScore.textContent, /4\/4/);

  assert.equal(balance.id, 'dashboardV2HeroBalance');
  assert.doesNotMatch(balance.textContent, /placeholder/i, 'balance harus data nyata, bukan placeholder lagi');
  assert.match(balance.textContent, /150000/, 'balance harus total saldo dari getFinanceSummary()');

  assert.equal(insight.id, 'dashboardV2HeroInsight');
  assert.doesNotMatch(insight.textContent, /placeholder/i, 'insight harus data nyata, bukan placeholder lagi');
  assert.match(insight.textContent, /2 akun/);
  assert.match(insight.textContent, /1 kendaraan/);
  assert.match(insight.textContent, /1 anak/);
  assert.match(insight.textContent, /1 SIM/);

  // 4 elemen V2.17 (data summary) tetap ada & tetap benar (regresi non-obsolete)
  const finance = hero.children.find((c) => c.id === 'dashboardV2HeroFinanceSummary');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.match(finance.textContent, /150000/);
});

test('Hero Real Data: healthScore parsial (1 domain kosong) -> fallback placeholder (butuh SEMUA 4 summary tersedia, bukan skor bisnis baru)', () => {
  // vehicles kosong -> vehicleCount=0, tapi getVehicleSummary() TETAP
  // mengembalikan objek (bukan null) — jadi hasAllSummaries tetap true,
  // dan healthScore harus menghitung 3/4 (bukan fallback), membuktikan
  // perhitungan murni interpolasi count, bukan business logic baru.
  const D = minimalD({
    accounts: [{ id: 'a1', balance: 10000 }],
    vehicles: [],
    catatan: { anak: [{ id: 'k1' }] },
    simList: [{ id: 's1' }],
  });
  const { Shell } = loadShellWithRealAdapter(D);
  const hero = getHero(Shell);
  const healthScore = hero.children.find((c) => c.id === 'dashboardV2HeroHealthScore');
  assert.doesNotMatch(healthScore.textContent, /placeholder/i);
  assert.match(healthScore.textContent, /3\/4/);
});

test('Hero Real Data: adapter TIDAK di-load -> 4 placeholder LAMA tetap fallback ke teks placeholder ASLI V2.2 (regresi non-obsolete)', () => {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], { document: fakeDocument, window: fakeWindow });
  const hero = getHero({ render: () => context.window.DashboardV2Shell.render() });
  const [title, healthScore, balance, insight] = hero.children;
  assert.equal(title.textContent, 'Selamat datang (placeholder)');
  assert.equal(healthScore.textContent, 'Skor Hidup Seimbang: -- (placeholder)');
  assert.equal(balance.textContent, 'Saldo: Rp -- (placeholder)');
  assert.equal(insight.textContent, 'Insight (placeholder)');
});

// ---------------------------------------------------------------------------
// Constraint check (statis, regex kode aktif — komentar dibuang dulu):
// shell tetap tidak membaca `D` langsung, adapter sendiri tidak diubah.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const shellCodeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('dashboard-v2-shell.js (setelah V2.31) tetap tidak membaca D langsung / fetch / routing / FEATURE_REGISTRY / innerHTML', () => {
  assert.doesNotMatch(shellCodeOnly, /\bD\.\w/, 'shell TIDAK boleh membaca `D` langsung — harus lewat adapter');
  assert.doesNotMatch(shellCodeOnly, /fetch\s*\(/);
  // Tahap V2.43 (persetujuan eksplisit user): showPage() sekarang LEGIT
  // dipakai di navigateTo() (lihat DASHBOARD-V2-BOTTOMNAV-WIREUP.md).
  // Guard larangan showPage() dihapus dari sini; guard spesifik ada di
  // tests/dashboard-v2-navigation.test.js.
  assert.doesNotMatch(shellCodeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(shellCodeOnly, /innerHTML/);
});

test('dashboard-v2-data-adapter.js TIDAK diubah tahap ini (tetap persis 5 fungsi seperti baseline V2.16, tanpa let/var top-level)', () => {
  const adapterSource = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-data-adapter.js'), 'utf8');
  const fnMatches = adapterSource.match(/^function \w+\(/gm) || [];
  assert.deepEqual(
    fnMatches.sort(),
    ['function _dashV2AdapterHasD(', 'function getDocumentSummary(', 'function getFamilySummary(', 'function getFinanceSummary(', 'function getVehicleSummary('].sort(),
  );
  assert.doesNotMatch(adapterSource, /^(let|var) /m);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 (jumlah guard mount/destroy tetap 2)', () => {
  const hubSrc = fs.readFileSync(path.join(__dirname, '..', 'dashboard-hub.js'), 'utf8');
  const dashboardV2ShellGuardMatches = hubSrc.match(/typeof DashboardV2Shell !== 'undefined'/g) || [];
  assert.equal(dashboardV2ShellGuardMatches.length, 2);
});
