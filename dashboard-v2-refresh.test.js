'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.28 — Dashboard Refresh Lifecycle (lihat DASHBOARD-V2-REFRESH.md).
//
// DashboardV2Shell.refresh() memperbarui ISI panel-panel yg sudah memakai
// dashboard-v2-data-adapter.js (V2.16) — Hero (V2.17), Summary Cards
// (V2.18), Module Grid (V2.19), Statistics Panel (V2.20), Recent Activity
// (V2.21), Upcoming Tasks (V2.22), Notifications (V2.23), Automation Center
// (V2.24), AI Command Center, Health Score & Predictive Insights — TANPA
// destroy()/init()/render() ulang, TANPA membuat root/main baru, TANPA
// mengubah Activation Switch/mount lifecycle yg sudah ada.
//
// Fake DOM sama persis dgn tests/dashboard-v2-automation-data.test.js
// (createElement/appendChild/removeChild/replaceChildren/getElementById),
// supaya berjalan tanpa jsdom, konsisten dgn pola test V2.17–V2.24.

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
    removeAttribute(name) { delete this.attributes[name]; },
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

function findById(el, id) {
  if (!el) return null;
  if (el.id === id) return el;
  for (const child of el.children || []) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

function makeFakeDocument() {
  const body = createFakeElement('body');
  let createElementCalls = 0;
  return {
    body,
    createElement: (tag) => { createElementCalls++; return createFakeElement(tag); },
    getElementById: (id) => findById(body, id),
    get createElementCalls() { return createElementCalls; },
  };
}

// loadShellWithRealAdapter(D) — load dashboard-v2-data-adapter.js (source
// ASLI) + dashboard-v2-shell.js dalam SATU sandbox, dgn `D` tiruan
// di-inject — integrasi sungguhan end-to-end, bukan cuma mock.
function loadShellWithRealAdapter(D) {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const extraGlobals = { document: fakeDocument, window: fakeWindow };
  if (D !== undefined) extraGlobals.D = D;
  const context = loadSource(['dashboard-v2-data-adapter.js', 'dashboard-v2-shell.js'], extraGlobals);
  return { Shell: context.window.DashboardV2Shell, document: fakeDocument, window: fakeWindow };
}

function loadShellOnly() {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
  });
  return { Shell: context.window.DashboardV2Shell, document: fakeDocument, window: fakeWindow };
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

function getMain(root) {
  return root.children.find((c) => c.id === 'dashboardV2Main');
}

function getPanel(root, id) {
  const main = getMain(root);
  return main ? main.children.find((c) => c.id === id) : null;
}

// findDeep — telusuri rekursif (dipakai HANYA di test, bukan production
// code) utk elemen bersarang spt kartu data di dalam Automation Center.
function findDeep(el, id) {
  if (!el) return null;
  if (el.id === id) return el;
  for (const child of el.children || []) {
    const found = findDeep(child, id);
    if (found) return found;
  }
  return null;
}

// --- Static source helpers ---------------------------------------------
// refresh() diverifikasi juga lewat inspeksi teks source-nya sendiri
// (bukan cuma perilaku runtime) utk larangan yg sulit dibuktikan lewat
// eksekusi saja (fetch()/showPage()/FEATURE_REGISTRY/innerHTML/`D.`
// langsung) — pola sama dgn extractFunction() di helpers/loadSource.js,
// tapi utk method di dalam object literal (brace-counting dari
// "refresh() {" sampai closing brace method itu).
function extractRefreshSource() {
  const fullPath = path.join(__dirname, '..', 'dashboard-v2-shell.js');
  const src = fs.readFileSync(fullPath, 'utf8');
  const marker = 'refresh() {';
  const start = src.indexOf(marker);
  assert.notEqual(start, -1, 'method refresh() tidak ditemukan di dashboard-v2-shell.js');
  const braceOpen = src.indexOf('{', start);
  let depth = 1;
  let i = braceOpen + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start, i);
}

// ---------------------------------------------------------------------------
// 1. refresh() tersedia
// ---------------------------------------------------------------------------
test('DashboardV2Shell.refresh() tersedia sbg fungsi', () => {
  const { Shell } = loadShellOnly();
  assert.equal(typeof Shell.refresh, 'function');
});

// ---------------------------------------------------------------------------
// 2. refresh() aman dipanggil sebelum init()
// ---------------------------------------------------------------------------
test('refresh() sebelum init() -> no-op (return null, tidak membuat apa pun)', () => {
  const { Shell, document } = loadShellOnly();
  const result = Shell.refresh();
  assert.equal(result, null);
  assert.equal(document.body.children.length, 0, 'tidak boleh ada elemen baru di body');
});

// ---------------------------------------------------------------------------
// 3. refresh() aman dipanggil sebelum render()
// ---------------------------------------------------------------------------
test('refresh() setelah init() tapi sebelum render() -> no-op (return null)', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.init();
  const result = Shell.refresh();
  assert.equal(result, null);
  assert.equal(root.children.length, 0, 'root belum boleh py anak (belum di-render())');
});

// ---------------------------------------------------------------------------
// 4. refresh() tidak memanggil init()
// ---------------------------------------------------------------------------
test('refresh() tidak memanggil init() (root tetap null kalau belum pernah init())', () => {
  const { Shell, document } = loadShellOnly();
  let initCalls = 0;
  const originalInit = Shell.init;
  Shell.init = function spyInit(...args) { initCalls++; return originalInit.apply(this, args); };

  Shell.refresh();
  assert.equal(initCalls, 0, 'refresh() sebelum init() tidak boleh diam-diam memanggil init()');
  assert.equal(document.body.children.length, 0);

  Shell.init = originalInit;
});

test('refresh() setelah render() tidak memanggil init() lagi', () => {
  const { Shell } = loadShellOnly();
  Shell.render();
  let initCalls = 0;
  const originalInit = Shell.init;
  Shell.init = function spyInit(...args) { initCalls++; return originalInit.apply(this, args); };

  Shell.refresh();
  assert.equal(initCalls, 0, 'refresh() tidak boleh memanggil init() lagi setelah render()');

  Shell.init = originalInit;
});

// ---------------------------------------------------------------------------
// 5. refresh() tidak memanggil destroy()
// ---------------------------------------------------------------------------
test('refresh() tidak memanggil destroy()', () => {
  const { Shell, document } = loadShellOnly();
  Shell.render();
  let destroyCalls = 0;
  const originalDestroy = Shell.destroy;
  Shell.destroy = function spyDestroy(...args) { destroyCalls++; return originalDestroy.apply(this, args); };

  Shell.refresh();
  assert.equal(destroyCalls, 0, 'refresh() tidak boleh memanggil destroy()');
  assert.equal(document.body.children.length, 1, 'root harus tetap ter-attach (tidak di-destroy)');

  Shell.destroy = originalDestroy;
});

// ---------------------------------------------------------------------------
// 6. refresh() tidak membuat root baru
// ---------------------------------------------------------------------------
test('refresh() tidak membuat root baru (referensi root sama, body tetap 1 anak)', () => {
  const { Shell, document } = loadShellOnly();
  const rootBefore = Shell.render();
  Shell.refresh();
  assert.equal(Shell._root, rootBefore, 'referensi root tidak boleh berubah');
  assert.equal(document.body.children.length, 1, 'tidak boleh ada root kedua di body');
  assert.equal(document.getElementById('dashboardV2Root'), rootBefore);
});

// ---------------------------------------------------------------------------
// 7. refresh() tetap memakai adapter
// ---------------------------------------------------------------------------
test('refresh() memakai adapter — Hero/Automation Center ikut ter-update sesuai data D terbaru', () => {
  const D = minimalD({ accounts: [{ id: 'a1', balance: 100000 }], transactions: [] });
  const { Shell } = loadShellWithRealAdapter(D);

  const root1 = Shell.render();
  const financeBefore = findDeep(root1, 'dashboardV2AutomationFinanceData');
  assert.match(financeBefore.textContent, /Rp 100000/);

  // "Data terbaru" berubah di antara render() awal & refresh() — simulasi
  // transaksi baru masuk tanpa Dashboard V2 pernah destroy()/init() ulang.
  D.accounts.push({ id: 'a2', balance: 50000 });

  const main2 = Shell.refresh();
  assert.ok(main2, 'refresh() harus berhasil (sudah init()+render())');
  const financeAfter = findDeep(root1, 'dashboardV2AutomationFinanceData');
  assert.match(financeAfter.textContent, /Rp 150000/, 'refresh() harus memanggil ulang getFinanceSummary() lewat adapter');

  const heroAfter = getPanel(root1, 'dashboardV2Hero');
  assert.ok(heroAfter, 'Hero harus tetap ada setelah refresh()');
});

test('refresh() tanpa adapter ter-load -> tetap aman, panel fallback placeholder (tidak error)', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.render();
  assert.doesNotThrow(() => Shell.refresh());
  const finance = findDeep(root, 'dashboardV2AutomationFinanceData');
  assert.match(finance.textContent, /placeholder/i);
});

// ---------------------------------------------------------------------------
// 8. refresh() tidak membaca D langsung
// ---------------------------------------------------------------------------
test('refresh() tidak membaca `D` secara langsung (inspeksi source)', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /\bD\./, 'refresh() tidak boleh mereferensikan D.<field> langsung');
  assert.doesNotMatch(src, /\bD\[/, 'refresh() tidak boleh mereferensikan D[...] langsung');
});

// ---------------------------------------------------------------------------
// 9–12. Larangan fetch()/showPage()/FEATURE_REGISTRY/innerHTML
// ---------------------------------------------------------------------------
test('refresh() tidak memakai fetch()', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /fetch\s*\(/);
});

test('refresh() tidak memakai showPage()', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /showPage\s*\(/);
});

test('refresh() tidak memakai FEATURE_REGISTRY', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /FEATURE_REGISTRY/);
});

test('refresh() tidak memakai innerHTML', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /innerHTML/);
});

test('refresh() tidak memakai querySelectorAll global', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /querySelectorAll/);
});

// ---------------------------------------------------------------------------
// 13. refresh() idempotent (bisa dipanggil berkali-kali)
// ---------------------------------------------------------------------------
test('refresh() idempotent — dipanggil berkali-kali tidak menumpuk/berubah jumlah panel', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.render();
  const main = getMain(root);
  const expectedCount = main.children.length;

  Shell.refresh();
  Shell.refresh();
  Shell.refresh();

  assert.equal(main.children.length, expectedCount, 'jumlah panel di Main harus tetap sama setelah refresh() berkali-kali');
  assert.doesNotThrow(() => Shell.refresh());
});

// ---------------------------------------------------------------------------
// 14. refresh() tidak mengubah Activation Switch
// ---------------------------------------------------------------------------
test('refresh() tidak mengubah atribut Activation Switch (hidden/data-dashboard-v2-state) di root', () => {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
    isDashboardV2Enabled: () => true,
  });
  const Shell = context.window.DashboardV2Shell;

  const root = Shell.render();
  assert.equal(root.hasAttribute('hidden'), false);
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'active');

  Shell.refresh();

  assert.equal(root.hasAttribute('hidden'), false, 'refresh() tidak boleh mengubah atribut hidden yg diset render()/Activation Switch');
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'active', 'refresh() tidak boleh mengubah data-dashboard-v2-state');
});

test('refresh() tidak memakai FEATURE_REGISTRY / isDashboardV2Enabled (inspeksi source)', () => {
  const src = extractRefreshSource();
  assert.doesNotMatch(src, /isDashboardV2Enabled/, 'refresh() tidak boleh menyentuh Activation Switch');
});

// ---------------------------------------------------------------------------
// 15 & 16. refresh() tidak mengubah mount lifecycle & mempertahankan node utama
// ---------------------------------------------------------------------------
test('refresh() mempertahankan referensi root/sidebar/header/main/bottomNav/fab (tidak mount ulang)', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.render();
  const [sidebarBefore, headerBefore, mainBefore, bottomNavBefore, fabBefore] = root.children;

  Shell.refresh();
  Shell.refresh();

  const [sidebarAfter, headerAfter, mainAfter, bottomNavAfter, fabAfter] = root.children;
  assert.equal(root.children.length, 5, 'root harus tetap 5 komponen top-level');
  assert.equal(sidebarAfter, sidebarBefore, 'Sidebar tidak boleh berubah referensi');
  assert.equal(headerAfter, headerBefore, 'Header tidak boleh berubah referensi');
  assert.equal(mainAfter, mainBefore, 'Main tidak boleh berubah referensi (hanya isinya)');
  assert.equal(bottomNavAfter, bottomNavBefore, 'Bottom Nav tidak boleh berubah referensi');
  assert.equal(fabAfter, fabBefore, 'FAB tidak boleh berubah referensi');
});

// ---------------------------------------------------------------------------
// 17. refresh() hanya memperbarui isi panel (bukan root/sidebar/header/dll)
// ---------------------------------------------------------------------------
test('refresh() hanya mengganti children Main; Sidebar/Header/BottomNav/FAB isinya tidak disentuh', () => {
  const { Shell } = loadShellOnly();
  const root = Shell.render();
  const sidebar = root.children.find((c) => c.id === 'dashboardV2Sidebar');
  const header = root.children.find((c) => c.id === 'dashboardV2Header');
  const bottomNav = root.children.find((c) => c.id === 'dashboardV2BottomNav');
  const sidebarChildrenBefore = sidebar.children.slice();
  const headerChildrenBefore = header.children.slice();
  const bottomNavChildrenBefore = bottomNav.children.slice();

  const main = getMain(root);
  const panelIdsBefore = main.children.map((c) => c.id);

  Shell.refresh();

  assert.deepEqual(sidebar.children, sidebarChildrenBefore, 'Sidebar tidak boleh ikut di-refresh');
  assert.deepEqual(header.children, headerChildrenBefore, 'Header tidak boleh ikut di-refresh');
  assert.deepEqual(bottomNav.children, bottomNavChildrenBefore, 'Bottom Nav tidak boleh ikut di-refresh');

  const panelIdsAfter = main.children.map((c) => c.id);
  assert.deepEqual(panelIdsAfter, panelIdsBefore, 'urutan & set panel di Main harus sama sebelum/sesudah refresh()');

  // Panel-panel sendiri BOLEH jadi instance baru (isinya "diperbarui"),
  // asal Main-nya sendiri (containernya) tetap node yg sama.
  const heroBefore = panelIdsBefore.includes('dashboardV2Hero');
  assert.ok(heroBefore, 'Hero harus tetap terdaftar sbg salah satu panel Main');
});

// ---------------------------------------------------------------------------
// 11 daftar panel wajib ter-update: Hero, Summary Cards, Module Grid,
// Statistics Panel, Recent Activity, Upcoming Tasks, Notifications,
// Automation Center, AI Command Center, Health Score, Predictive Insights.
// ---------------------------------------------------------------------------
test('refresh() memperbarui seluruh 11 panel yg memakai adapter (tetap ada & konsisten dgn D terbaru)', () => {
  const D = minimalD({
    accounts: [{ id: 'a1', balance: 200000 }],
    vehicles: [{ id: 'v1' }],
  });
  const { Shell } = loadShellWithRealAdapter(D);
  const root = Shell.render();

  D.vehicles.push({ id: 'v2' });
  D.accounts.push({ id: 'a3', balance: 300000 });

  Shell.refresh();

  const panelIds = [
    'dashboardV2Hero',
    'dashboardV2SummaryCards',
    'dashboardV2ModuleGrid',
    'dashboardV2StatisticsPanel',
    'dashboardV2RecentActivity',
    'dashboardV2UpcomingTasks',
    'dashboardV2Notifications',
    'dashboardV2AutomationCenter',
    'dashboardV2AiCommandCenter',
    'dashboardV2HealthScore',
    'dashboardV2PredictiveInsights',
  ];

  for (const id of panelIds) {
    const panel = getPanel(root, id);
    assert.ok(panel, `panel ${id} harus tetap ada setelah refresh()`);
  }

  const vehicleFinance = findDeep(root, 'dashboardV2AutomationVehicleData');
  assert.match(vehicleFinance.textContent, /2 kendaraan/, 'Automation Center harus reflect data D terbaru setelah refresh()');
});

// ---------------------------------------------------------------------------
// 18. Seluruh kontrak lama tetap PASS — dijamin via full-suite
// `node --test` terpisah (lihat DASHBOARD-V2-REFRESH.md), file ini hanya
// menambah cakupan baru & sama sekali tidak mengubah test lama.
// ---------------------------------------------------------------------------
test('refresh() adalah method tambahan murni — init/render/destroy API lama tidak berubah', () => {
  const { Shell } = loadShellOnly();
  assert.equal(typeof Shell.init, 'function');
  assert.equal(typeof Shell.render, 'function');
  assert.equal(typeof Shell.destroy, 'function');
  assert.equal(typeof Shell.refresh, 'function');
});
