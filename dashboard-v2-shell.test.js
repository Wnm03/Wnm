'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.1 — Layout Foundation (DASHBOARD-V2-MIGRATION-RFC.md §4).
// dashboard-v2-shell.js pakai document.createElement/appendChild/
// replaceChildren/getElementById apa adanya (bukan innerHTML string) —
// stub permisif bawaan loadSource() tidak stateful, jadi document/window
// disuntik manual di sini (pola sama dgn debug-console.test.js), dgn fake
// DOM tree minimal (createElement + appendChild/removeChild/replaceChildren
// + getElementById via pencarian rekursif) yang cukup utk memverifikasi
// struktur tanpa perlu jsdom.

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

function loadShell() {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
  });
  return { Shell: context.window.DashboardV2Shell, document: fakeDocument, window: fakeWindow };
}

test('window.DashboardV2Shell tersedia dgn API init/render/destroy', () => {
  const { Shell } = loadShell();
  assert.ok(Shell, 'DashboardV2Shell tidak ter-expose ke window');
  assert.equal(typeof Shell.init, 'function');
  assert.equal(typeof Shell.render, 'function');
  assert.equal(typeof Shell.destroy, 'function');
});

test('init() membuat container root, ter-attach ke document.body, ditandai dormant', () => {
  const { Shell, document } = loadShell();
  const root = Shell.init();
  assert.ok(root, 'init() harus mengembalikan elemen root');
  assert.equal(root.id, 'dashboardV2Root');
  assert.equal(root.className, 'dashboard-v2-root');
  assert.ok(root.hasAttribute('hidden'), 'root harus punya atribut hidden (dormant)');
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
  assert.equal(root.parentNode, document.body);
  assert.equal(document.body.children.length, 1);
});

test('init() idempotent — panggil berkali-kali tidak membuat duplikat container', () => {
  const { Shell, document } = loadShell();
  const first = Shell.init();
  const second = Shell.init();
  const third = Shell.init();
  assert.equal(first, second);
  assert.equal(second, third);
  assert.equal(document.body.children.length, 1);
});

test('render() membangun 5 placeholder (sidebar/header/main/bottomnav/fab) di dalam root', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root);
  assert.equal(root.children.length, 5);

  const [sidebar, header, main, bottomNav, fab] = root.children;
  assert.equal(sidebar.id, 'dashboardV2Sidebar');
  assert.equal(sidebar.className, 'dashboard-v2-sidebar');
  assert.equal(header.id, 'dashboardV2Header');
  assert.equal(header.className, 'dashboard-v2-header');
  assert.equal(main.id, 'dashboardV2Main');
  assert.equal(main.className, 'dashboard-v2-main');
  assert.equal(bottomNav.id, 'dashboardV2BottomNav');
  assert.equal(bottomNav.className, 'dashboard-v2-bottomnav');
  assert.equal(fab.id, 'dashboardV2Fab');
  assert.match(fab.className, /\bdashboard-v2-fab\b/);
});

test('render() namespace class BUKAN "nav"/"nav-item" (tidak boleh bentrok dgn showPage()/#mainNav global)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const bottomNav = root.children.find((c) => c.id === 'dashboardV2BottomNav');
  assert.notEqual(bottomNav.className, 'nav');
  assert.doesNotMatch(bottomNav.className, /(^|\s)nav-item(\s|$)/);
});

test('render() FAB placeholder tidak interaktif (disabled, aria-hidden) — tidak ada business logic', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const fab = root.children.find((c) => c.id === 'dashboardV2Fab');
  assert.equal(fab.disabled, true);
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
});

test('render() idempotent — panggil 2x tetap 5 children (tidak menumpuk via replaceChildren)', () => {
  const { Shell } = loadShell();
  Shell.render();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

test('render() tanpa init() eksplisit tetap jalan (auto-init)', () => {
  const { Shell, document } = loadShell();
  const root = Shell.render();
  assert.ok(root);
  assert.equal(document.getElementById('dashboardV2Root'), root);
});

test('destroy() melepas container dari DOM & reset state internal', () => {
  const { Shell, document } = loadShell();
  Shell.render();
  Shell.destroy();
  assert.equal(document.body.children.length, 0);
  assert.equal(document.getElementById('dashboardV2Root'), null);
});

test('destroy() lalu init() lagi membangun instance baru yang bersih', () => {
  const { Shell, document } = loadShell();
  Shell.render();
  Shell.destroy();
  const fresh = Shell.init();
  assert.ok(fresh);
  assert.equal(fresh.children.length, 0, 'container baru harus kosong sebelum render() dipanggil lagi');
  assert.equal(document.body.children.length, 1);
});

test('init()/render()/destroy() tidak melempar error di environment tanpa `document` (mis. non-browser)', () => {
  const context = loadSource(['dashboard-v2-shell.js'], { document: undefined, window: {} });
  const Shell = context.window.DashboardV2Shell;
  assert.doesNotThrow(() => Shell.init());
  assert.doesNotThrow(() => Shell.render());
  assert.doesNotThrow(() => Shell.destroy());
});

// ---------------------------------------------------------------------------
// Regresi: Dashboard existing (Hero Dashboard / Dashboard Hub) & chrome
// global TIDAK disentuh sama sekali oleh file baru ini.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const HTML_FILES = ['index.html', 'app_production.html'];

test('dashboard-v2-shell.js TIDAK mengintegrasikan FEATURE_REGISTRY, showPage(), atau class .nav-item global', () => {
  // Cek baris kode aktif saja (buang komentar `//`) supaya penyebutan nama
  // ini di rationale/komentar tidak salah kena flag sbg pemakaian nyata.
  const codeOnly = SHELL_SOURCE
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  // Tahap V2.43 (persetujuan eksplisit user): showPage() sekarang LEGIT
  // dipakai di navigateTo() (lihat DASHBOARD-V2-BOTTOMNAV-WIREUP.md).
  // Guard larangan showPage() dihapus dari sini; guard spesifik ada di
  // tests/dashboard-v2-navigation.test.js.
  assert.doesNotMatch(codeOnly, /['"]nav-item['"]/);
  assert.doesNotMatch(codeOnly, /getElementById\(\s*['"]mainNav['"]\s*\)/);
  assert.doesNotMatch(codeOnly, /querySelector\(\s*['"]#mainNav['"]\s*\)/);
});

for (const file of HTML_FILES) {
  test(`${file}: TIDAK berubah sama sekali (0 markup Dashboard V2 disisipkan — shell 100% self-mounting via JS)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    // Dashboard Hub existing tetap utuh, tidak tersentuh.
    assert.match(html, /id="page-dashboard-hub"/);
  });
}

test('dashboard-hub.js: DashboardHub tetap ada apa adanya; referensi DashboardV2Shell (jika ada) hanya lewat blok mount guarded V2.14C', () => {
  const hubSrc = fs.readFileSync(path.join(__dirname, '..', 'dashboard-hub.js'), 'utf8');
  assert.match(hubSrc, /const DashboardHub/);
  // Sejak Tahap V2.14C (DASHBOARD-V2-MOUNT.md), dashboard-hub.js SENGAJA
  // boleh menyentuh DashboardV2Shell lewat blok mount guarded
  // (`typeof DashboardV2Shell !== 'undefined'`) — bukan lagi 0 referensi
  // seperti tahap ini semula. Sejak Tahap V2.14D (DASHBOARD-V2-AUTO-
  // DESTROY.md), guard yang sama dipakai LAGI di blok auto-destroy
  // (kebalikan dari mount: flag balik false + sudah pernah init ->
  // destroy() sekali). Yang tetap dijamin: referensi guard itu muncul
  // TEPAT 2x (mount + destroy), tidak lebih, tidak dipanggil di tempat
  // lain/unconditional.
  const dashboardV2ShellGuardMatches = hubSrc.match(/typeof DashboardV2Shell !== 'undefined'/g) || [];
  assert.equal(dashboardV2ShellGuardMatches.length, 2, 'DashboardV2Shell harus direferensikan tepat 2x: 1 guard mount (init/render) + 1 guard auto-destroy');
});
