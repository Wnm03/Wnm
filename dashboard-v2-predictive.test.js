'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.12 — Predictive Insights (anak baru Main Content Container,
// setelah Health Score Widget V2.11). Fake DOM sama persis dgn
// tests/dashboard-v2-health.test.js, tests/dashboard-v2-ai.test.js &
// tests/dashboard-v2-shell.test.js (createElement/appendChild/
// replaceChildren/getElementById), supaya berjalan tanpa jsdom, konsisten
// dgn pola test tahap-tahap sebelumnya.

function createFakeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    type: '',
    disabled: false,
    readOnly: false,
    value: '',
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

function getPredictiveSection(root) {
  const main = getMain(root);
  return main.children.find((c) => c.id === 'dashboardV2PredictiveInsights');
}

test('Predictive Insights: ditemukan sbg anak ke-12 Main Content Container, section dgn role=region + aria-label "Predictive Insights"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = getPredictiveSection(root);
  assert.ok(section, 'Predictive Insights tidak ditemukan');
  assert.equal(main.children[11].id, 'dashboardV2PredictiveInsights');
  assert.equal(section.tagName, 'SECTION');
  assert.equal(section.getAttribute('role'), 'region');
  assert.equal(section.getAttribute('aria-label'), 'Predictive Insights');
});

test('Predictive Insights: berisi tepat 9 anak (5 kartu insight prediktif lama V2.12 + 4 data summary baru V2.27)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getPredictiveSection(root);
  assert.equal(section.children.length, 9);
});

test('Predictive Insights: 5 kartu sesuai urutan (Cash Flow Forecast, Budget Trend, Vehicle Maintenance Prediction, Family Schedule Prediction, Document Expiration Prediction), semua <button disabled> berisi icon + title + prediction + confidence + recommendation placeholder', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getPredictiveSection(root);
  const [cashFlowForecast, budgetTrend, vehicleMaintenance, familySchedule, documentExpiration] = section.children;

  const expectations = [
    { card: cashFlowForecast, keyCap: 'CashFlowForecast', title: 'Cash Flow Forecast' },
    { card: budgetTrend, keyCap: 'BudgetTrend', title: 'Budget Trend' },
    { card: vehicleMaintenance, keyCap: 'VehicleMaintenancePrediction', title: 'Vehicle Maintenance Prediction' },
    { card: familySchedule, keyCap: 'FamilySchedulePrediction', title: 'Family Schedule Prediction' },
    { card: documentExpiration, keyCap: 'DocumentExpirationPrediction', title: 'Document Expiration Prediction' },
  ];

  expectations.forEach(({ card, keyCap, title }) => {
    assert.equal(card.id, `dashboardV2PredictiveInsightsCard${keyCap}`);
    assert.equal(card.tagName, 'BUTTON');
    assert.equal(card.type, 'button');
    assert.equal(card.disabled, true, `${title} card harus disabled`);
    assert.equal(card.className, 'dashboard-v2-predictive-card');
    assert.ok(card.getAttribute('aria-label'));
    assert.equal(card.children.length, 5, `${title} card harus punya 5 anak (icon, title, prediction, confidence, recommendation)`);

    const [icon, cardTitle, prediction, confidence, recommendation] = card.children;

    assert.equal(icon.id, `dashboardV2PredictiveInsightsCard${keyCap}Icon`);
    assert.equal(icon.className, 'dashboard-v2-predictive-icon');
    assert.ok(icon.textContent);

    assert.equal(cardTitle.id, `dashboardV2PredictiveInsightsCard${keyCap}Title`);
    assert.equal(cardTitle.className, 'dashboard-v2-predictive-title');
    assert.equal(cardTitle.textContent, title);

    assert.equal(prediction.id, `dashboardV2PredictiveInsightsCard${keyCap}Prediction`);
    assert.equal(prediction.className, 'dashboard-v2-predictive-prediction');
    assert.equal(prediction.textContent, '--');

    assert.equal(confidence.id, `dashboardV2PredictiveInsightsCard${keyCap}Confidence`);
    assert.equal(confidence.className, 'dashboard-v2-predictive-confidence');
    assert.equal(confidence.textContent, '--');

    assert.equal(recommendation.id, `dashboardV2PredictiveInsightsCard${keyCap}Recommendation`);
    assert.equal(recommendation.className, 'dashboard-v2-predictive-recommendation');
    assert.match(recommendation.textContent, /placeholder/i);
  });
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.12 (Predictive Insights tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Predictive Insights (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const section = getPredictiveSection(root);
  assert.equal(section.children.length, 9);
  const cashFlowForecast = section.children.find((c) => c.id === 'dashboardV2PredictiveInsightsCardCashFlowForecast');
  assert.ok(cashFlowForecast);
});

test('root top-level tetap 5 komponen setelah Tahap V2.12 (Predictive Insights anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Predictive Insights murni placeholder — tanpa event listener,
// tanpa routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/API/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Predictive Insights: tidak ada onclick/addEventListener terpasang (murni disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.12) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /\bfetch\s*\(/);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.12', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.12 (Predictive Insights jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
