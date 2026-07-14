'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.11 — Health Score Widget (anak baru Main Content Container,
// setelah AI Command Center V2.10). Fake DOM sama persis dgn
// tests/dashboard-v2-ai.test.js, tests/dashboard-v2-notifications.test.js &
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

function getHealthScoreSection(root) {
  const main = getMain(root);
  return main.children.find((c) => c.id === 'dashboardV2HealthScore');
}

test('Health Score: ditemukan sbg anak ke-11 Main Content Container, section dgn role=region + aria-label "Health Score"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = getHealthScoreSection(root);
  assert.ok(section, 'Health Score widget tidak ditemukan');
  assert.equal(main.children[10].id, 'dashboardV2HealthScore');
  assert.equal(section.tagName, 'SECTION');
  assert.equal(section.getAttribute('role'), 'region');
  assert.equal(section.getAttribute('aria-label'), 'Health Score');
});

test('Health Score: berisi tepat 10 anak (1 circular score placeholder + 1 subtitle + 4 metric card + 4 data summary V2.26)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getHealthScoreSection(root);
  assert.equal(section.children.length, 10);
});

test('Health Score: circular score placeholder ada, id & isi "--" sesuai', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getHealthScoreSection(root);
  const circle = section.children[0];

  assert.equal(circle.id, 'dashboardV2HealthScoreCircle');
  assert.equal(circle.className, 'dashboard-v2-health-score-circle');
  assert.equal(circle.children.length, 1);

  const scoreValue = circle.children[0];
  assert.equal(scoreValue.id, 'dashboardV2HealthScoreValue');
  assert.equal(scoreValue.textContent, '--');
});

test('Health Score: subtitle ada, id & isi "Overall System Health" sesuai', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getHealthScoreSection(root);
  const subtitle = section.children[1];

  assert.equal(subtitle.id, 'dashboardV2HealthScoreSubtitle');
  assert.equal(subtitle.className, 'dashboard-v2-health-score-subtitle');
  assert.equal(subtitle.textContent, 'Overall System Health');
});

test('Health Score: 4 metric card sesuai urutan (Finance, Vehicle, Documents, Family), semua <button disabled> berisi icon + title + status placeholder', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getHealthScoreSection(root);
  const [, , finance, vehicle, documents, family] = section.children;

  const expectations = [
    { card: finance, keyCap: 'Finance', title: 'Finance' },
    { card: vehicle, keyCap: 'Vehicle', title: 'Vehicle' },
    { card: documents, keyCap: 'Documents', title: 'Documents' },
    { card: family, keyCap: 'Family', title: 'Family' },
  ];

  expectations.forEach(({ card, keyCap, title }) => {
    assert.equal(card.id, `dashboardV2HealthScoreMetric${keyCap}`);
    assert.equal(card.tagName, 'BUTTON');
    assert.equal(card.type, 'button');
    assert.equal(card.disabled, true, `${title} metric card harus disabled`);
    assert.equal(card.className, 'dashboard-v2-health-metric-card');
    assert.ok(card.getAttribute('aria-label'));
    assert.equal(card.children.length, 3, `${title} metric card harus punya 3 anak (icon, title, status)`);

    const [icon, cardTitle, status] = card.children;
    assert.equal(icon.id, `dashboardV2HealthScoreMetric${keyCap}Icon`);
    assert.equal(icon.className, 'dashboard-v2-health-metric-icon');
    assert.ok(icon.textContent);

    assert.equal(cardTitle.id, `dashboardV2HealthScoreMetric${keyCap}Title`);
    assert.equal(cardTitle.className, 'dashboard-v2-health-metric-title');
    assert.equal(cardTitle.textContent, title);

    assert.equal(status.id, `dashboardV2HealthScoreMetric${keyCap}Status`);
    assert.equal(status.className, 'dashboard-v2-health-metric-status');
    assert.match(status.textContent, /placeholder/i);
  });
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.11 (Health Score tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Health Score (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const section = getHealthScoreSection(root);
  assert.equal(section.children.length, 10);
  const finance = section.children.find((c) => c.id === 'dashboardV2HealthScoreMetricFinance');
  assert.ok(finance);
});

test('root top-level tetap 5 komponen setelah Tahap V2.11 (Health Score anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Health Score Widget murni placeholder — tanpa event listener,
// tanpa routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/API/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Health Score: tidak ada onclick/addEventListener terpasang (murni disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.11) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  // Tahap V2.43 (persetujuan eksplisit user): showPage() sekarang LEGIT
  // dipakai di navigateTo() (lihat DASHBOARD-V2-BOTTOMNAV-WIREUP.md).
  // Guard larangan showPage() dihapus dari sini; guard spesifik ada di
  // tests/dashboard-v2-navigation.test.js.
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /\bfetch\s*\(/);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.11', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.11 (Health Score jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
