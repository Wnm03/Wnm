'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.5 — Sidebar Navigation & Bottom Navigation V2 items (instruksi
// sesi ini). Fake DOM sama persis dgn tests/dashboard-v2-shell.test.js
// (createElement/appendChild/replaceChildren/getElementById), supaya
// berjalan tanpa jsdom, konsisten dgn pola test V2.1-V2.4.

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
  return { Shell: context.window.DashboardV2Shell, document: fakeDocument, window: fakeWindow, fakeWindow };
}

function getRootParts(root) {
  const [sidebar, header, main, bottomNav, fab] = root.children;
  return { sidebar, header, main, bottomNav, fab };
}

test('root top-level tetap 5 komponen (V2.1 tidak berubah oleh V2.5)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

test('Sidebar: dirender dgn aria-label + 5 item navigasi', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const { sidebar } = getRootParts(root);
  assert.equal(sidebar.id, 'dashboardV2Sidebar');
  assert.equal(sidebar.tagName, 'ASIDE');
  assert.ok(sidebar.getAttribute('aria-label'));
  assert.equal(sidebar.children.length, 5);
});

test('Sidebar (Tahap V2.44): 5 item (Dashboard, Finance, Vehicle, Reports, Settings) sesuai urutan; Dashboard/Finance/Vehicle/Settings diwire ke showPage() lewat data-action, Reports tetap disabled', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const { sidebar } = getRootParts(root);
  const [dashboard, finance, vehicle, reports, settings] = sidebar.children;

  assert.equal(dashboard.id, 'dashboardV2SidebarDashboard');
  assert.equal(dashboard.tagName, 'BUTTON');
  assert.equal(dashboard.type, 'button');
  assert.equal(dashboard.className, 'dashboard-v2-sidebar-item');
  assert.equal(dashboard.disabled, false, 'item Dashboard harus BISA diklik sejak V2.44');
  assert.equal(dashboard.textContent, 'Dashboard');
  assert.ok(dashboard.getAttribute('aria-label'));
  assert.equal(dashboard.getAttribute('data-action'), 'DashboardV2Shell.navigateTo');
  assert.deepEqual(JSON.parse(dashboard.getAttribute('data-args')), ['dashboard-hub', '$el']);

  assert.equal(finance.id, 'dashboardV2SidebarFinance');
  assert.equal(finance.disabled, false, 'item Finance harus BISA diklik sejak V2.44');
  assert.equal(finance.textContent, 'Finance');
  assert.deepEqual(JSON.parse(finance.getAttribute('data-args')), ['keuangan', '$el']);

  assert.equal(vehicle.id, 'dashboardV2SidebarVehicle');
  assert.equal(vehicle.disabled, false, 'item Vehicle harus BISA diklik sejak V2.44');
  assert.equal(vehicle.textContent, 'Vehicle');
  assert.deepEqual(JSON.parse(vehicle.getAttribute('data-args')), ['carnotes', '$el']);

  assert.equal(reports.id, 'dashboardV2SidebarReports');
  assert.equal(reports.disabled, true, 'item Reports harus TETAP disabled (tidak ada #page-reports)');
  assert.equal(reports.textContent, 'Reports');
  assert.equal(reports.getAttribute('data-action'), null, 'Reports tidak boleh punya data-action (tidak ada halaman tujuan)');
  assert.equal(reports.getAttribute('data-args'), null, 'Reports tidak boleh punya data-args (tidak ada halaman tujuan)');

  assert.equal(settings.id, 'dashboardV2SidebarSettings');
  assert.equal(settings.disabled, false, 'item Settings harus BISA diklik sejak V2.44');
  assert.equal(settings.textContent, 'Settings');
  assert.deepEqual(JSON.parse(settings.getAttribute('data-args')), ['settings', '$el']);
});

test('Bottom Navigation V2: dirender dgn aria-label + 4 item navigasi, namespace class tetap "dashboard-v2-bottomnav"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const { bottomNav } = getRootParts(root);
  assert.equal(bottomNav.id, 'dashboardV2BottomNav');
  assert.equal(bottomNav.tagName, 'NAV');
  assert.equal(bottomNav.className, 'dashboard-v2-bottomnav');
  assert.ok(bottomNav.getAttribute('aria-label'));
  assert.equal(bottomNav.children.length, 4);
});

test('Bottom Navigation V2 (Tahap V2.43): 4 item (Home, Finance, Vehicle, More) sesuai urutan, TIDAK disabled, diwire ke showPage() lewat data-action', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const { bottomNav } = getRootParts(root);
  const [home, finance, vehicle, more] = bottomNav.children;

  assert.equal(home.id, 'dashboardV2BottomNavHome');
  assert.equal(home.tagName, 'BUTTON');
  assert.equal(home.type, 'button');
  assert.equal(home.className, 'dashboard-v2-bottomnav-item');
  assert.equal(home.disabled, false, 'item Home harus BISA diklik sejak V2.43');
  assert.equal(home.textContent, 'Home');
  assert.ok(home.getAttribute('aria-label'));
  assert.equal(home.getAttribute('data-action'), 'DashboardV2Shell.navigateTo');
  assert.deepEqual(JSON.parse(home.getAttribute('data-args')), ['dashboard-hub', '$el']);

  assert.equal(finance.id, 'dashboardV2BottomNavFinance');
  assert.equal(finance.disabled, false, 'item Finance harus BISA diklik sejak V2.43');
  assert.equal(finance.textContent, 'Finance');
  assert.deepEqual(JSON.parse(finance.getAttribute('data-args')), ['keuangan', '$el']);

  assert.equal(vehicle.id, 'dashboardV2BottomNavVehicle');
  assert.equal(vehicle.disabled, false, 'item Vehicle harus BISA diklik sejak V2.43');
  assert.equal(vehicle.textContent, 'Vehicle');
  assert.deepEqual(JSON.parse(vehicle.getAttribute('data-args')), ['carnotes', '$el']);

  assert.equal(more.id, 'dashboardV2BottomNavMore');
  assert.equal(more.disabled, false, 'item More harus BISA diklik sejak V2.43');
  assert.equal(more.textContent, 'More');
  assert.deepEqual(JSON.parse(more.getAttribute('data-args')), ['settings', '$el']);
});

test('Bottom Navigation V2 (Tahap V2.43): navigateTo() memanggil showPage() global dgn nama halaman & el yg benar', () => {
  const { Shell, fakeWindow } = loadShell();
  const calls = [];
  fakeWindow.showPage = (name, el) => { calls.push(['showPage', name, el]); };
  fakeWindow.disableDashboardV2 = () => { calls.push(['disableDashboardV2']); };
  const fakeEl = { id: 'fakeBtn' };

  Shell.navigateTo('keuangan', fakeEl);

  assert.deepEqual(calls[0], ['showPage', 'keuangan', fakeEl]);
  assert.ok(calls.some((c) => c[0] === 'disableDashboardV2'), 'navigasi ke halaman selain dashboard-hub harus menonaktifkan Dashboard V2 supaya halaman tujuan terlihat');
});

test('Bottom Navigation V2 (Tahap V2.43): navigateTo("dashboard-hub") TIDAK menonaktifkan Dashboard V2 (Home = Dashboard V2 itu sendiri)', () => {
  const { Shell, fakeWindow } = loadShell();
  const calls = [];
  fakeWindow.showPage = (name, el) => { calls.push(['showPage', name, el]); };
  fakeWindow.disableDashboardV2 = () => { calls.push(['disableDashboardV2']); };

  Shell.navigateTo('dashboard-hub', { id: 'homeBtn' });

  assert.equal(calls.length, 1, 'hanya showPage() yg dipanggil, disableDashboardV2() tidak boleh terpanggil utk Home');
  assert.equal(calls[0][1], 'dashboard-hub');
});

test('render() tetap idempotent setelah penambahan item Sidebar/Bottom Nav (tidak menumpuk)', () => {
  const { Shell } = loadShell();
  Shell.render();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
  const { sidebar, bottomNav } = getRootParts(root);
  assert.equal(sidebar.children.length, 5);
  assert.equal(bottomNav.children.length, 4);
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.5 (root masih `hidden` + data-dashboard-v2-state="dormant")', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

// ---------------------------------------------------------------------------
// Regresi: tidak terhubung ke FEATURE_REGISTRY / Dashboard Hub existing /
// business logic / routing / AICommandCenter / class .nav-item global.
// Dashboard existing tidak berubah. Tidak ada innerHTML atau event handler.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('dashboard-v2-shell.js tetap tidak terhubung ke FEATURE_REGISTRY/AICommandCenter/.nav-item global/innerHTML/addEventListener', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
  assert.doesNotMatch(codeOnly, /['"]nav-item['"]/);
  assert.doesNotMatch(codeOnly, /getElementById\(\s*['"]mainNav['"]\s*\)/);
});

// Tahap V2.43: showPage() SEKARANG legal dipakai, tapi HANYA di dalam
// navigateTo() — dipanggil lewat data-action="DashboardV2Shell.navigateTo"
// (global click-delegation di features-helpers-global-security.js), BUKAN
// addEventListener/.onclick baru di file ini (diverifikasi test di atas).
// Tahap V2.44: Sidebar ikut diwire dgn pola & pemanggil (navigateTo())
// yg SAMA — tidak ada pemanggilan showPage() baru di tempat lain, tidak
// ada addEventListener baru. Reports (Sidebar) & FAB V2 TETAP disabled
// (Reports: tidak ada halaman tujuan valid; FAB: rencana Tahap V2.45).
test('showPage() Tahap V2.43/V2.44 hanya dipakai di dalam navigateTo(); Sidebar Reports & FAB V2 tetap disabled', () => {
  assert.match(codeOnly, /showPage\s*\(/, 'navigateTo() harus memanggil showPage()');
  const navigateToBody = codeOnly.slice(codeOnly.indexOf('navigateTo(pageName, el)'));
  assert.match(navigateToBody, /showPage\s*\(/);
  // showPage() (termasuk fallback window.showPage()) hanya boleh muncul di
  // dalam navigateTo() — guard regresi supaya tidak ada pemanggilan
  // showPage() baru di tempat lain (mis. di _buildSidebar()). navigateTo()
  // sendiri sudah py 2 pemanggilan sejak V2.43 (showPage() langsung +
  // window.showPage() fallback), jadi yg diverifikasi di sini adalah
  // jumlah TOTAL di seluruh file == jumlah di dalam navigateTo() saja
  // (artinya 0 pemanggilan di luar navigateTo()).
  const showPageMatches = codeOnly.match(/showPage\s*\(/g) || [];
  const showPageMatchesInNavigateTo = navigateToBody.match(/showPage\s*\(/g) || [];
  assert.equal(
    showPageMatches.length,
    showPageMatchesInNavigateTo.length,
    'showPage()/window.showPage() tidak boleh dipanggil di luar navigateTo()'
  );

  const { Shell } = loadShell();
  const root = Shell.render();
  const { sidebar, fab } = getRootParts(root);
  sidebar.children.forEach((btn) => {
    if (btn.id === 'dashboardV2SidebarReports') {
      assert.equal(btn.disabled, true, 'Sidebar Reports harus tetap disabled (tidak ada halaman tujuan valid)');
    } else {
      assert.equal(btn.disabled, false, `Sidebar item ${btn.id} harus BISA diklik sejak V2.44`);
      assert.equal(btn.getAttribute('data-action'), 'DashboardV2Shell.navigateTo');
    }
  });
  assert.equal(fab.disabled, true, 'FAB V2 harus tetap disabled (belum Tahap V2.45)');
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2', () => {
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

for (const file of ['index.html', 'app_production.html']) {
  test(`${file}: tetap 0 markup Dashboard V2 (Sidebar/Bottom Nav items juga self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
