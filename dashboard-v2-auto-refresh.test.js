'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.29 — Dashboard Auto Refresh (lihat DASHBOARD-V2-AUTO-REFRESH.md).
//
// DashboardV2Shell.startAutoRefresh()/stopAutoRefresh()/isAutoRefreshActive()
// membungkus refresh() (V2.28) di dalam satu timer periodik supaya panel-
// panel yg sudah memakai dashboard-v2-data-adapter.js otomatis ter-update
// tanpa caller manual memanggil refresh() tiap kali `D` berubah — TANPA
// duplikasi logic refresh()/_buildMain(), TANPA init()/destroy()/render()
// ulang, TANPA membaca `D` langsung, TANPA fetch()/showPage()/
// FEATURE_REGISTRY/innerHTML.
//
// Fake DOM sama persis dgn tests/dashboard-v2-refresh.test.js. Timer diganti
// dgn fake timer yg bisa di-tick manual (loadSource() men-stub setInterval/
// clearInterval sbg no-op secara default — di sini di-override lewat
// extraGlobals supaya callback timer bisa dipanggil terkendali di test).

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
  return {
    body,
    createElement: (tag) => createFakeElement(tag),
    getElementById: (id) => findById(body, id),
  };
}

// makeFakeTimers() — pengganti setInterval/clearInterval nyata: tiap
// setInterval() dicatat (fn + ms) dgn id bertambah, clearInterval()
// menghapus catatan itu, tick(id) memanggil fn-nya secara manual (simulasi
// satu "tick" timer) tanpa benar-benar menunggu waktu nyata.
function makeFakeTimers() {
  let nextId = 1;
  const timers = new Map();
  return {
    setInterval(fn, ms) {
      const id = nextId++;
      timers.set(id, { fn, ms });
      return id;
    },
    clearInterval(id) {
      timers.delete(id);
    },
    tick(id) {
      const t = timers.get(id);
      if (t) t.fn();
    },
    has(id) { return timers.has(id); },
    activeCount() { return timers.size; },
    msOf(id) { const t = timers.get(id); return t ? t.ms : undefined; },
  };
}

function loadShellOnly(fakeTimers) {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const extraGlobals = { document: fakeDocument, window: fakeWindow };
  if (fakeTimers) {
    extraGlobals.setInterval = fakeTimers.setInterval;
    extraGlobals.clearInterval = fakeTimers.clearInterval;
  }
  const context = loadSource(['dashboard-v2-shell.js'], extraGlobals);
  return { Shell: context.window.DashboardV2Shell, document: fakeDocument, window: fakeWindow };
}

function loadShellWithRealAdapter(D, fakeTimers) {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const extraGlobals = { document: fakeDocument, window: fakeWindow };
  if (D !== undefined) extraGlobals.D = D;
  if (fakeTimers) {
    extraGlobals.setInterval = fakeTimers.setInterval;
    extraGlobals.clearInterval = fakeTimers.clearInterval;
  }
  const context = loadSource(['dashboard-v2-data-adapter.js', 'dashboard-v2-shell.js'], extraGlobals);
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
function extractMethodSource(methodName) {
  const fullPath = path.join(__dirname, '..', 'dashboard-v2-shell.js');
  const src = fs.readFileSync(fullPath, 'utf8');
  // Anchor pada definisi property method (baris berindentasi persis 2 spasi,
  // di dalam object literal DashboardV2Shell), bukan penyebutan tekstual
  // pertama (yg bisa muncul lebih dulu di blok komentar dokumentasi
  // "Tahap V2.29" di atas object literal).
  const objStart = src.indexOf('const DashboardV2Shell = {');
  assert.notEqual(objStart, -1, 'const DashboardV2Shell = { tidak ditemukan');
  const marker = `\n  ${methodName}(`;
  const relStart = src.indexOf(marker, objStart);
  assert.notEqual(relStart, -1, `method ${methodName}() tidak ditemukan di dashboard-v2-shell.js`);
  const start = relStart + 1;
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
// 1. API baru tersedia
// ---------------------------------------------------------------------------
test('DashboardV2Shell.startAutoRefresh/stopAutoRefresh/isAutoRefreshActive tersedia sbg fungsi', () => {
  const { Shell } = loadShellOnly(makeFakeTimers());
  assert.equal(typeof Shell.startAutoRefresh, 'function');
  assert.equal(typeof Shell.stopAutoRefresh, 'function');
  assert.equal(typeof Shell.isAutoRefreshActive, 'function');
});

test('AUTO_REFRESH_DEFAULT_MS tersedia & berupa angka positif', () => {
  const { Shell } = loadShellOnly(makeFakeTimers());
  assert.equal(typeof Shell.AUTO_REFRESH_DEFAULT_MS, 'number');
  assert.ok(Shell.AUTO_REFRESH_DEFAULT_MS > 0);
});

// ---------------------------------------------------------------------------
// 2. isAutoRefreshActive() sebelum pernah start -> false
// ---------------------------------------------------------------------------
test('isAutoRefreshActive() sebelum pernah start -> false', () => {
  const { Shell } = loadShellOnly(makeFakeTimers());
  assert.equal(Shell.isAutoRefreshActive(), false);
});

// ---------------------------------------------------------------------------
// 3. stopAutoRefresh() sebelum pernah start -> no-op aman
// ---------------------------------------------------------------------------
test('stopAutoRefresh() sebelum pernah start -> no-op, return null, tidak throw', () => {
  const { Shell } = loadShellOnly(makeFakeTimers());
  assert.doesNotThrow(() => {
    const result = Shell.stopAutoRefresh();
    assert.equal(result, null);
  });
  assert.equal(Shell.isAutoRefreshActive(), false);
});

// ---------------------------------------------------------------------------
// 4. startAutoRefresh() mendaftarkan timer & isAutoRefreshActive() -> true
// ---------------------------------------------------------------------------
test('startAutoRefresh() mendaftarkan timer & isAutoRefreshActive() jadi true', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  const id = Shell.startAutoRefresh();
  assert.notEqual(id, null);
  assert.equal(fakeTimers.has(id), true);
  assert.equal(Shell.isAutoRefreshActive(), true);
});

// ---------------------------------------------------------------------------
// 5. startAutoRefresh() pakai default interval kalau tidak diberi argumen
// ---------------------------------------------------------------------------
test('startAutoRefresh() tanpa argumen -> pakai AUTO_REFRESH_DEFAULT_MS', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  const id = Shell.startAutoRefresh();
  assert.equal(fakeTimers.msOf(id), Shell.AUTO_REFRESH_DEFAULT_MS);
});

test('startAutoRefresh(intervalMs) -> pakai interval custom', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  const id = Shell.startAutoRefresh(5000);
  assert.equal(fakeTimers.msOf(id), 5000);
});

test('startAutoRefresh(0) / startAutoRefresh(-1) -> nilai tidak valid, fallback ke default', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  const id1 = Shell.startAutoRefresh(0);
  assert.equal(fakeTimers.msOf(id1), Shell.AUTO_REFRESH_DEFAULT_MS);
  const id2 = Shell.startAutoRefresh(-1);
  assert.equal(fakeTimers.msOf(id2), Shell.AUTO_REFRESH_DEFAULT_MS);
});

// ---------------------------------------------------------------------------
// 6. stopAutoRefresh() membersihkan timer aktif
// ---------------------------------------------------------------------------
test('stopAutoRefresh() membersihkan timer aktif & isAutoRefreshActive() jadi false', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  const id = Shell.startAutoRefresh();
  assert.equal(fakeTimers.has(id), true);

  Shell.stopAutoRefresh();
  assert.equal(fakeTimers.has(id), false, 'clearInterval() harus benar-benar dipanggil dgn id timer yg benar');
  assert.equal(Shell.isAutoRefreshActive(), false);
});

// ---------------------------------------------------------------------------
// 7. startAutoRefresh() idempotent — tidak menumpuk timer
// ---------------------------------------------------------------------------
test('startAutoRefresh() dipanggil berkali-kali -> tidak menumpuk timer (selalu tepat 1 aktif)', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);

  const id1 = Shell.startAutoRefresh();
  assert.equal(fakeTimers.activeCount(), 1);

  const id2 = Shell.startAutoRefresh();
  assert.equal(fakeTimers.activeCount(), 1, 'timer lama harus dibersihkan sebelum timer baru dibuat');
  assert.equal(fakeTimers.has(id1), false, 'timer id lama harus sudah di-clear');
  assert.equal(fakeTimers.has(id2), true);

  Shell.startAutoRefresh(1000);
  assert.equal(fakeTimers.activeCount(), 1, 'tetap tepat 1 timer aktif walau dipanggil lagi dgn interval berbeda');
});

// ---------------------------------------------------------------------------
// 8. Tiap tick timer memanggil this.refresh() (reuse, bukan duplikasi)
// ---------------------------------------------------------------------------
test('tiap tick timer memanggil this.refresh() (bukan init()/destroy()/render())', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  Shell.render();

  let refreshCalls = 0;
  let initCalls = 0;
  let renderCalls = 0;
  let destroyCalls = 0;
  const originalRefresh = Shell.refresh;
  const originalInit = Shell.init;
  const originalRender = Shell.render;
  const originalDestroy = Shell.destroy;
  Shell.refresh = function spyRefresh(...args) { refreshCalls++; return originalRefresh.apply(this, args); };
  Shell.init = function spyInit(...args) { initCalls++; return originalInit.apply(this, args); };
  Shell.render = function spyRender(...args) { renderCalls++; return originalRender.apply(this, args); };
  Shell.destroy = function spyDestroy(...args) { destroyCalls++; return originalDestroy.apply(this, args); };

  const id = Shell.startAutoRefresh();
  assert.equal(refreshCalls, 0, 'refresh() belum boleh terpanggil sebelum tick pertama');

  fakeTimers.tick(id);
  assert.equal(refreshCalls, 1);

  fakeTimers.tick(id);
  fakeTimers.tick(id);
  assert.equal(refreshCalls, 3, 'tiap tick harus memanggil refresh() persis 1x');

  assert.equal(initCalls, 0, 'auto-refresh tidak boleh memanggil init()');
  assert.equal(renderCalls, 0, 'auto-refresh tidak boleh memanggil render() ulang');
  assert.equal(destroyCalls, 0, 'auto-refresh tidak boleh memanggil destroy()');

  Shell.refresh = originalRefresh;
  Shell.init = originalInit;
  Shell.render = originalRender;
  Shell.destroy = originalDestroy;
});

// ---------------------------------------------------------------------------
// 9. Tick sebelum init()/render() -> refresh() no-op aman (kontrak V2.28 tetap berlaku)
// ---------------------------------------------------------------------------
test('tick timer sebelum init()/render() -> aman, tidak throw, tidak membuat apa pun di body', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell, document } = loadShellOnly(fakeTimers);
  const id = Shell.startAutoRefresh();
  assert.doesNotThrow(() => fakeTimers.tick(id));
  assert.equal(document.body.children.length, 0);
});

// ---------------------------------------------------------------------------
// 10. Tick setelah destroy() -> refresh() no-op aman, tidak diam-diam mount ulang
// ---------------------------------------------------------------------------
test('tick timer setelah destroy() -> refresh() no-op aman (root sudah terlepas), tidak membuat root baru', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell, document } = loadShellOnly(fakeTimers);
  Shell.render();
  const id = Shell.startAutoRefresh();
  Shell.destroy();

  assert.doesNotThrow(() => fakeTimers.tick(id));
  assert.equal(document.body.children.length, 0, 'destroy() harus tetap melepas root, tick sesudahnya tidak boleh membuat root baru');
});

// ---------------------------------------------------------------------------
// 11. Integrasi sungguhan dgn adapter ASLI — auto-refresh reflect data terbaru
// ---------------------------------------------------------------------------
test('startAutoRefresh() + tick -> panel ter-update sesuai `D` terbaru lewat adapter ASLI (reuse refresh(), 0 logic baru)', () => {
  const fakeTimers = makeFakeTimers();
  const D = minimalD({ accounts: [{ id: 'a1', balance: 100000 }], transactions: [] });
  const { Shell } = loadShellWithRealAdapter(D, fakeTimers);

  const root = Shell.render();
  const financeBefore = findDeep(root, 'dashboardV2AutomationFinanceData');
  assert.match(financeBefore.textContent, /Rp 100000/);

  const id = Shell.startAutoRefresh();
  D.accounts.push({ id: 'a2', balance: 50000 });
  fakeTimers.tick(id);

  const financeAfter = findDeep(root, 'dashboardV2AutomationFinanceData');
  assert.match(financeAfter.textContent, /Rp 150000/, 'auto-refresh tick harus memanggil refresh() yg memanggil ulang adapter, sama seperti refresh() manual V2.28');
});

// ---------------------------------------------------------------------------
// 12. Tidak membaca `D` langsung (inspeksi source ketiga method baru)
// ---------------------------------------------------------------------------
test('startAutoRefresh()/stopAutoRefresh()/isAutoRefreshActive() tidak membaca `D` secara langsung', () => {
  for (const name of ['startAutoRefresh', 'stopAutoRefresh', 'isAutoRefreshActive']) {
    const src = extractMethodSource(name);
    assert.doesNotMatch(src, /\bD\./, `${name}() tidak boleh mereferensikan D.<field> langsung`);
    assert.doesNotMatch(src, /\bD\[/, `${name}() tidak boleh mereferensikan D[...] langsung`);
  }
});

// ---------------------------------------------------------------------------
// 13–16. Larangan fetch()/showPage()/FEATURE_REGISTRY/innerHTML
// ---------------------------------------------------------------------------
test('startAutoRefresh()/stopAutoRefresh()/isAutoRefreshActive() tidak memakai fetch()/showPage()/FEATURE_REGISTRY/innerHTML', () => {
  for (const name of ['startAutoRefresh', 'stopAutoRefresh', 'isAutoRefreshActive']) {
    const src = extractMethodSource(name);
    assert.doesNotMatch(src, /fetch\s*\(/, `${name}() tidak boleh memakai fetch()`);
    assert.doesNotMatch(src, /showPage\s*\(/, `${name}() tidak boleh memakai showPage()`);
    assert.doesNotMatch(src, /FEATURE_REGISTRY/, `${name}() tidak boleh memakai FEATURE_REGISTRY`);
    assert.doesNotMatch(src, /innerHTML/, `${name}() tidak boleh memakai innerHTML`);
  }
});

// ---------------------------------------------------------------------------
// 17. startAutoRefresh() tidak memanggil init()/destroy()/render() dari sourcenya sendiri
// ---------------------------------------------------------------------------
test('startAutoRefresh() secara tekstual hanya memanggil this.refresh() (via callback timer), bukan this.init()/this.render()/this.destroy()', () => {
  const src = extractMethodSource('startAutoRefresh');
  assert.doesNotMatch(src, /this\.init\s*\(/);
  assert.doesNotMatch(src, /this\.render\s*\(/);
  assert.doesNotMatch(src, /this\.destroy\s*\(/);
  assert.match(src, /self\.refresh\s*\(\)|this\.refresh\s*\(\)/);
});

// ---------------------------------------------------------------------------
// 18. Environment tanpa setInterval -> no-op aman (bukan sandbox tanpa timer, mis. Node murni tanpa global)
// ---------------------------------------------------------------------------
test('startAutoRefresh() di environment tanpa setInterval -> return null, tidak throw', () => {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
    setInterval: undefined,
    clearInterval: undefined,
  });
  const Shell = context.window.DashboardV2Shell;
  assert.doesNotThrow(() => {
    const result = Shell.startAutoRefresh();
    assert.equal(result, null);
  });
  assert.equal(Shell.isAutoRefreshActive(), false);
});

// ---------------------------------------------------------------------------
// 19. Tidak mengubah refresh()/init()/render()/destroy() yg sudah ada
// ---------------------------------------------------------------------------
test('refresh() (V2.28) tidak diubah — startAutoRefresh() murni membungkusnya, tidak menduplikasi logic pembangunan panel', () => {
  const fullPath = path.join(__dirname, '..', 'dashboard-v2-shell.js');
  const src = fs.readFileSync(fullPath, 'utf8');
  // Cek baris kode aktif saja (buang komentar `//`) supaya penyebutan
  // "_buildMain()" di blok komentar dokumentasi tidak salah kena hitung
  // sbg pemanggilan nyata.
  const codeOnly = src
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  // _buildMain muncul di kode aktif persis 3x: definisi method itu sendiri
  // (`_buildMain(document) {`), satu call site di render() (existing sejak
  // V2.1), satu call site di refresh() (V2.28). startAutoRefresh() (V2.29)
  // TIDAK boleh menambah call site ke-4 (tidak boleh memanggil _buildMain()
  // langsung — harus lewat this.refresh() saja).
  const buildMainCalls = (codeOnly.match(/_buildMain\s*\(/g) || []).length;
  assert.equal(buildMainCalls, 3, '_buildMain() harus tetap punya persis 3 kemunculan di kode aktif (1 definisi + 1 call site render() + 1 call site refresh()) — auto-refresh tidak boleh menduplikasi logic build panel dgn memanggil _buildMain() langsung');
});

// ---------------------------------------------------------------------------
// 20. Idempotent end-to-end: banyak tick tidak menumpuk node
// ---------------------------------------------------------------------------
test('banyak tick berturut-turut tidak menumpuk/mengubah jumlah panel (idempotent, sama seperti refresh() manual)', () => {
  const fakeTimers = makeFakeTimers();
  const { Shell } = loadShellOnly(fakeTimers);
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const expectedCount = main.children.length;

  const id = Shell.startAutoRefresh();
  fakeTimers.tick(id);
  fakeTimers.tick(id);
  fakeTimers.tick(id);

  assert.equal(main.children.length, expectedCount, 'jumlah panel tidak boleh berubah/menumpuk setelah beberapa tick');
});
