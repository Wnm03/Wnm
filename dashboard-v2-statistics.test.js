'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.7 — Statistics Panel (anak baru Main Content Container, setelah
// Recent Activity V2.6). Fake DOM sama persis dgn tests/dashboard-v2-summary.
// test.js, tests/dashboard-v2-activity.test.js & tests/dashboard-v2-shell.
// test.js (createElement/appendChild/replaceChildren/getElementById),
// supaya berjalan tanpa jsdom, konsisten dgn pola test tahap-tahap
// sebelumnya.

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

test('Statistics Panel: ditemukan sbg anak ke-7 Main Content Container, section dgn role=region + aria-label "Statistics"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  assert.ok(panel, 'Statistics Panel tidak ditemukan');
  assert.equal(main.children[6].id, 'dashboardV2StatisticsPanel');
  assert.equal(panel.tagName, 'SECTION');
  assert.equal(panel.getAttribute('role'), 'region');
  assert.equal(panel.getAttribute('aria-label'), 'Statistics');
});

test('Statistics Panel: berisi tepat 8 anak (4 statistic card lama V2.7 + 4 elemen data baru V2.20)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  assert.equal(panel.children.length, 8);
});

test('Statistics Panel: urutan 4 kartu sesuai (Income, Expense, Savings, Active Vehicles), semua <button disabled>', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  const [income, expense, savings, vehicles] = panel.children;

  assert.equal(income.id, 'dashboardV2StatisticsCardIncome');
  assert.equal(income.tagName, 'BUTTON');
  assert.equal(income.type, 'button');
  assert.equal(income.disabled, true, 'Income card harus disabled');
  assert.equal(income.className, 'dashboard-v2-statistics-card');
  assert.ok(income.getAttribute('aria-label'));

  assert.equal(expense.id, 'dashboardV2StatisticsCardExpense');
  assert.equal(expense.tagName, 'BUTTON');
  assert.equal(expense.disabled, true, 'Expense card harus disabled');
  assert.ok(expense.getAttribute('aria-label'));

  assert.equal(savings.id, 'dashboardV2StatisticsCardSavings');
  assert.equal(savings.tagName, 'BUTTON');
  assert.equal(savings.disabled, true, 'Savings card harus disabled');
  assert.ok(savings.getAttribute('aria-label'));

  assert.equal(vehicles.id, 'dashboardV2StatisticsCardVehicles');
  assert.equal(vehicles.tagName, 'BUTTON');
  assert.equal(vehicles.disabled, true, 'Active Vehicles card harus disabled');
  assert.ok(vehicles.getAttribute('aria-label'));
});

test('Statistics Panel: tiap kartu berisi 4 sub-elemen (icon, title, value, trend) sesuai urutan & isi', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  const income = panel.children.find((c) => c.id === 'dashboardV2StatisticsCardIncome');

  assert.equal(income.children.length, 4);
  const [icon, title, value, trend] = income.children;

  assert.equal(icon.id, 'dashboardV2StatisticsCardIncomeIcon');
  assert.equal(icon.className, 'dashboard-v2-statistics-icon');
  assert.ok(icon.textContent, 'icon placeholder harus ada isinya');

  assert.equal(title.id, 'dashboardV2StatisticsCardIncomeTitle');
  assert.equal(title.className, 'dashboard-v2-statistics-title');
  assert.equal(title.textContent, 'Income');

  assert.equal(value.id, 'dashboardV2StatisticsCardIncomeValue');
  assert.equal(value.className, 'dashboard-v2-statistics-value');
  assert.match(value.textContent, /placeholder/i);

  assert.equal(trend.id, 'dashboardV2StatisticsCardIncomeTrend');
  assert.equal(trend.className, 'dashboard-v2-statistics-trend');
  assert.match(trend.textContent, /placeholder/i);
});

test('Statistics Panel: kartu Expense/Savings/Active Vehicles jg berisi title & value/trend placeholder yg benar', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const panel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');

  const expense = panel.children.find((c) => c.id === 'dashboardV2StatisticsCardExpense');
  const [, expenseTitle, expenseValue, expenseTrend] = expense.children;
  assert.equal(expenseTitle.textContent, 'Expense');
  assert.match(expenseValue.textContent, /placeholder/i);
  assert.match(expenseTrend.textContent, /placeholder/i);

  const savings = panel.children.find((c) => c.id === 'dashboardV2StatisticsCardSavings');
  const [, savingsTitle, savingsValue, savingsTrend] = savings.children;
  assert.equal(savingsTitle.textContent, 'Savings');
  assert.match(savingsValue.textContent, /placeholder/i);
  assert.match(savingsTrend.textContent, /placeholder/i);

  const vehicles = panel.children.find((c) => c.id === 'dashboardV2StatisticsCardVehicles');
  const [, vehiclesTitle, vehiclesValue, vehiclesTrend] = vehicles.children;
  assert.equal(vehiclesTitle.textContent, 'Active Vehicles');
  assert.match(vehiclesValue.textContent, /placeholder/i);
  assert.match(vehiclesTrend.textContent, /placeholder/i);
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.7 (Statistics Panel tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Statistics Panel (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const panel = main.children.find((c) => c.id === 'dashboardV2StatisticsPanel');
  assert.equal(panel.children.length, 8, 'Statistics Panel harus 8 anak (4 lama V2.7 + 4 baru V2.20)');
  const income = panel.children.find((c) => c.id === 'dashboardV2StatisticsCardIncome');
  assert.equal(income.children.length, 4);
});

test('root top-level tetap 5 komponen setelah Tahap V2.7 (Statistics Panel anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Statistics Panel murni placeholder — tanpa event listener, tanpa
// routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Statistics Panel: tidak ada onclick/addEventListener terpasang (murni kartu disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.7) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /\bfetch\s*\(/);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.7', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.7 (Statistics Panel jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
