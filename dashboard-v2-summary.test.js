'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.3 — Summary Cards & Quick Actions, + Tahap V2.4 — Module Grid &
// Insight Panel (assersi struktur Main disesuaikan sesi ini). Fake DOM sama
// persis dgn tests/dashboard-v2-shell.test.js & dashboard-v2-hero.test.js
// (createElement/appendChild/replaceChildren/getElementById), supaya berjalan
// tanpa jsdom, konsisten dgn pola test V2.1/V2.2.

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

function getMain(root) {
  return root.children.find((c) => c.id === 'dashboardV2Main');
}

test('root top-level tetap 5 komponen (V2.1 tidak berubah oleh V2.3)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

test('Main Content Container membungkus 10 anak berurutan: Hero, Summary Cards, Quick Actions, Module Grid, Insight Panel, Recent Activity, Statistics Panel, Upcoming Tasks, Notifications, AI Command Center', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  assert.ok(main, 'Main Content Container tidak ditemukan');
  assert.equal(main.children.length, 13);
  assert.equal(main.children[0].id, 'dashboardV2Hero');
  assert.equal(main.children[1].id, 'dashboardV2SummaryCards');
  assert.equal(main.children[2].id, 'dashboardV2QuickActions');
  assert.equal(main.children[3].id, 'dashboardV2ModuleGrid');
  assert.equal(main.children[4].id, 'dashboardV2InsightPanel');
  assert.equal(main.children[5].id, 'dashboardV2RecentActivity');
  assert.equal(main.children[6].id, 'dashboardV2StatisticsPanel');
  assert.equal(main.children[7].id, 'dashboardV2UpcomingTasks');
  assert.equal(main.children[8].id, 'dashboardV2Notifications');
  assert.equal(main.children[9].id, 'dashboardV2AiCommandCenter');
});

test('Summary Cards: section dirender dgn role=region + aria-label', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const cards = main.children.find((c) => c.id === 'dashboardV2SummaryCards');
  assert.ok(cards, 'Summary Cards tidak ditemukan');
  assert.equal(cards.tagName, 'SECTION');
  assert.equal(cards.getAttribute('role'), 'region');
  assert.ok(cards.getAttribute('aria-label'));
  assert.equal(cards.children.length, 8, 'Summary Cards harus 8 anak (4 lama V2.3 + 4 baru V2.18)');
});

test('Summary Cards: 4 kartu (Total Balance, Monthly Income, Monthly Expense, Health Score) sesuai urutan & placeholder', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const cards = main.children.find((c) => c.id === 'dashboardV2SummaryCards');
  const [balance, income, expense, health] = cards.children;

  assert.equal(balance.id, 'dashboardV2SummaryCardBalance');
  assert.equal(balance.className, 'dashboard-v2-summary-card');
  assert.match(balance.textContent, /Total Balance/);
  assert.match(balance.textContent, /placeholder/i);
  assert.ok(balance.getAttribute('aria-label'));

  assert.equal(income.id, 'dashboardV2SummaryCardIncome');
  assert.match(income.textContent, /Monthly Income/);
  assert.match(income.textContent, /placeholder/i);
  assert.ok(income.getAttribute('aria-label'));

  assert.equal(expense.id, 'dashboardV2SummaryCardExpense');
  assert.match(expense.textContent, /Monthly Expense/);
  assert.match(expense.textContent, /placeholder/i);
  assert.ok(expense.getAttribute('aria-label'));

  assert.equal(health.id, 'dashboardV2SummaryCardHealth');
  assert.match(health.textContent, /Health Score/);
  assert.match(health.textContent, /placeholder/i);
  assert.ok(health.getAttribute('aria-label'));
});

test('Quick Actions: section dirender dgn role=region + aria-label', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const actions = main.children.find((c) => c.id === 'dashboardV2QuickActions');
  assert.ok(actions, 'Quick Actions tidak ditemukan');
  assert.equal(actions.tagName, 'SECTION');
  assert.equal(actions.getAttribute('role'), 'region');
  assert.ok(actions.getAttribute('aria-label'));
  assert.equal(actions.children.length, 4);
});

test('Quick Actions: 4 tombol (Tambah Transaksi, Catatan Kendaraan, Backup, Laporan) sesuai urutan, semua disabled', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const actions = main.children.find((c) => c.id === 'dashboardV2QuickActions');
  const [addTx, vehicleNotes, backup, report] = actions.children;

  assert.equal(addTx.id, 'dashboardV2QuickActionAddTx');
  assert.equal(addTx.tagName, 'BUTTON');
  assert.equal(addTx.type, 'button');
  assert.equal(addTx.disabled, true, 'Tambah Transaksi harus disabled');
  assert.equal(addTx.textContent, 'Tambah Transaksi');
  assert.ok(addTx.getAttribute('aria-label'));

  assert.equal(vehicleNotes.id, 'dashboardV2QuickActionVehicleNotes');
  assert.equal(vehicleNotes.tagName, 'BUTTON');
  assert.equal(vehicleNotes.disabled, true, 'Catatan Kendaraan harus disabled');
  assert.equal(vehicleNotes.textContent, 'Catatan Kendaraan');
  assert.ok(vehicleNotes.getAttribute('aria-label'));

  assert.equal(backup.id, 'dashboardV2QuickActionBackup');
  assert.equal(backup.tagName, 'BUTTON');
  assert.equal(backup.disabled, true, 'Backup harus disabled');
  assert.equal(backup.textContent, 'Backup');
  assert.ok(backup.getAttribute('aria-label'));

  assert.equal(report.id, 'dashboardV2QuickActionReport');
  assert.equal(report.tagName, 'BUTTON');
  assert.equal(report.disabled, true, 'Laporan harus disabled');
  assert.equal(report.textContent, 'Laporan');
  assert.ok(report.getAttribute('aria-label'));
});

test('render() tetap idempotent setelah penambahan Summary Cards/Quick Actions/Module Grid/Insight Panel/Recent Activity/Statistics Panel/Upcoming Tasks/Notifications/AI Command Center (tidak menumpuk)', () => {
  const { Shell } = loadShell();
  Shell.render();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const cards = main.children.find((c) => c.id === 'dashboardV2SummaryCards');
  const actions = main.children.find((c) => c.id === 'dashboardV2QuickActions');
  const moduleGrid = main.children.find((c) => c.id === 'dashboardV2ModuleGrid');
  const insightPanel = main.children.find((c) => c.id === 'dashboardV2InsightPanel');
  const recentActivity = main.children.find((c) => c.id === 'dashboardV2RecentActivity');
  const statisticsPanel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  const upcomingTasks = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');
  assert.equal(cards.children.length, 8, 'Summary Cards harus 8 anak (4 lama V2.3 + 4 baru V2.18)');
  assert.equal(actions.children.length, 4);
  assert.equal(moduleGrid.children.length, 10, 'Module Grid harus 10 anak (6 lama V2.4 + 4 baru V2.19)');
  assert.equal(insightPanel.children.length, 3);
  assert.equal(recentActivity.children.length, 9, 'Recent Activity harus 9 anak (5 lama V2.6 + 4 baru V2.21)');
  assert.equal(statisticsPanel.children.length, 8, 'Statistics Panel harus 8 anak (4 lama V2.7 + 4 baru V2.20)');
  assert.equal(upcomingTasks.children.length, 9, 'Upcoming Tasks harus 9 anak (5 lama V2.8 + 4 baru V2.22)');
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.3 (root masih `hidden` + data-dashboard-v2-state="dormant")', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

// ---------------------------------------------------------------------------
// Tahap V2.4 — Module Grid & Insight Panel (anak Main Content Container,
// sejajar dgn Hero/Summary Cards/Quick Actions).
// ---------------------------------------------------------------------------

test('Module Grid: section dirender dgn role=region + aria-label, 6 anak', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const grid = main.children.find((c) => c.id === 'dashboardV2ModuleGrid');
  assert.ok(grid, 'Module Grid tidak ditemukan');
  assert.equal(grid.tagName, 'SECTION');
  assert.equal(grid.getAttribute('role'), 'region');
  assert.ok(grid.getAttribute('aria-label'));
  assert.equal(grid.children.length, 10, 'Module Grid harus 10 anak (6 lama V2.4 + 4 baru V2.19)');
});

test('Module Grid: 6 module card (Finance, Vehicle, Reports, Family, Documents, Settings) sesuai urutan; Finance/Vehicle/Settings interaktif (V2.30), Reports/Family/Documents tetap placeholder', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const grid = main.children.find((c) => c.id === 'dashboardV2ModuleGrid');
  const [finance, vehicle, reports, family, documents, settings] = grid.children;

  assert.equal(finance.id, 'dashboardV2ModuleGridFinance');
  assert.equal(finance.className, 'dashboard-v2-module-card');
  assert.equal(finance.textContent, 'Finance');
  assert.doesNotMatch(finance.textContent, /placeholder/i);
  assert.ok(finance.getAttribute('aria-label'));
  assert.equal(finance.getAttribute('role'), 'button');
  assert.equal(finance.getAttribute('tabindex'), '0');
  assert.equal(finance.getAttribute('data-action'), 'dashHubNavigateToFeature');
  assert.deepEqual(JSON.parse(finance.getAttribute('data-args')), [{ page: 'keuangan' }]);

  assert.equal(vehicle.id, 'dashboardV2ModuleGridVehicle');
  assert.equal(vehicle.textContent, 'Vehicle');
  assert.doesNotMatch(vehicle.textContent, /placeholder/i);
  assert.equal(vehicle.getAttribute('role'), 'button');
  assert.equal(vehicle.getAttribute('data-action'), 'dashHubNavigateToFeature');
  assert.deepEqual(JSON.parse(vehicle.getAttribute('data-args')), [{ page: 'carnotes' }]);

  assert.equal(reports.id, 'dashboardV2ModuleGridReports');
  assert.match(reports.textContent, /Reports/);
  assert.match(reports.textContent, /placeholder/i);
  assert.equal(reports.getAttribute('data-action'), null);
  assert.equal(reports.getAttribute('role'), null);

  assert.equal(family.id, 'dashboardV2ModuleGridFamily');
  assert.match(family.textContent, /Family/);
  assert.match(family.textContent, /placeholder/i);
  assert.equal(family.getAttribute('data-action'), null);

  assert.equal(documents.id, 'dashboardV2ModuleGridDocuments');
  assert.match(documents.textContent, /Documents/);
  assert.match(documents.textContent, /placeholder/i);
  assert.equal(documents.getAttribute('data-action'), null);

  assert.equal(settings.id, 'dashboardV2ModuleGridSettings');
  assert.equal(settings.textContent, 'Settings');
  assert.doesNotMatch(settings.textContent, /placeholder/i);
  assert.equal(settings.getAttribute('role'), 'button');
  assert.equal(settings.getAttribute('data-action'), 'dashHubNavigateToFeature');
  assert.deepEqual(JSON.parse(settings.getAttribute('data-args')), [{ page: 'settings' }]);
});

test('Insight Panel: section dirender dgn role=region + aria-label, 3 anak', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2InsightPanel');
  assert.ok(panel, 'Insight Panel tidak ditemukan');
  assert.equal(panel.tagName, 'SECTION');
  assert.equal(panel.getAttribute('role'), 'region');
  assert.ok(panel.getAttribute('aria-label'));
  assert.equal(panel.children.length, 3);
});

test('Insight Panel: 3 insight item (Backup, Saldo stabil, Kendaraan servis) sesuai urutan & isi', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2InsightPanel');
  const [backup, balance, vehicle] = panel.children;

  assert.equal(backup.id, 'dashboardV2InsightPanelBackup');
  assert.equal(backup.className, 'dashboard-v2-insight-item');
  assert.match(backup.textContent, /Backup belum dilakukan/);
  assert.ok(backup.getAttribute('aria-label'));

  assert.equal(balance.id, 'dashboardV2InsightPanelBalance');
  assert.match(balance.textContent, /Saldo stabil bulan ini/);
  assert.ok(balance.getAttribute('aria-label'));

  assert.equal(vehicle.id, 'dashboardV2InsightPanelVehicle');
  assert.match(vehicle.textContent, /Kendaraan akan servis/);
  assert.ok(vehicle.getAttribute('aria-label'));
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.4 (Module Grid + Insight Panel tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('Module Grid: tidak ada onclick/addEventListener terpasang (murni label, tanpa routing/link)', () => {
  const SRC = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
  const code = SRC.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /showPage\s*\(/);
  assert.doesNotMatch(code, /addEventListener/);
  assert.doesNotMatch(code, /\.onclick\s*=/);
});

// ---------------------------------------------------------------------------
// Regresi: tidak terhubung ke FEATURE_REGISTRY / Dashboard Hub existing /
// business logic / routing / AICommandCenter. Dashboard existing tidak
// berubah. Tidak ada innerHTML atau onclick/event handler nyata.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('dashboard-v2-shell.js (setelah V2.3) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
});

test('Quick Actions: tidak ada onclick/addEventListener/handler nyata terpasang di kode (murni placeholder disabled)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
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
  test(`${file}: tetap 0 markup Dashboard V2 (Summary Cards/Quick Actions juga self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
