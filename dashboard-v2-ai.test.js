'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.10 — AI Command Center UI (anak baru Main Content Container,
// setelah Notifications Center V2.9). Fake DOM sama persis dgn
// tests/dashboard-v2-notifications.test.js, tests/dashboard-v2-upcoming.test.js
// & tests/dashboard-v2-shell.test.js (createElement/appendChild/
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

function getAISection(root) {
  const main = getMain(root);
  return main.children.find((c) => c.id === 'dashboardV2AiCommandCenter');
}

test('AI Command Center: ditemukan sbg anak ke-10 Main Content Container, section dgn role=region + aria-label "AI Command Center"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = getAISection(root);
  assert.ok(section, 'AI Command Center tidak ditemukan');
  assert.equal(main.children[9].id, 'dashboardV2AiCommandCenter');
  assert.equal(section.tagName, 'SECTION');
  assert.equal(section.getAttribute('role'), 'region');
  assert.equal(section.getAttribute('aria-label'), 'AI Command Center');
});

test('AI Command Center: berisi tepat 10 anak (1 search + 4 action card + 1 suggestion area + 4 elemen data V2.25)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getAISection(root);
  assert.equal(section.children.length, 10);
});

test('AI Command Center: search field readonly, id & atribut sesuai', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getAISection(root);
  const search = section.children[0];

  assert.equal(search.id, 'dashboardV2AiCommandCenterSearch');
  assert.equal(search.tagName, 'INPUT');
  assert.equal(search.type, 'text');
  assert.equal(search.readOnly, true, 'search field harus readonly');
  assert.equal(search.className, 'dashboard-v2-ai-search');
  assert.ok(search.getAttribute('aria-label'));
});

test('AI Command Center: 4 action card sesuai urutan (Analyze Finance, Analyze Vehicle, Generate Report, Smart Assistant), semua <button disabled>', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getAISection(root);
  const [, analyzeFinance, analyzeVehicle, generateReport, smartAssistant] = section.children;

  assert.equal(analyzeFinance.id, 'dashboardV2AiCommandCenterActionAnalyzeFinance');
  assert.equal(analyzeFinance.tagName, 'BUTTON');
  assert.equal(analyzeFinance.type, 'button');
  assert.equal(analyzeFinance.disabled, true, 'Analyze Finance card harus disabled');
  assert.equal(analyzeFinance.className, 'dashboard-v2-ai-action-card');
  assert.equal(analyzeFinance.textContent, 'Analyze Finance');
  assert.ok(analyzeFinance.getAttribute('aria-label'));

  assert.equal(analyzeVehicle.id, 'dashboardV2AiCommandCenterActionAnalyzeVehicle');
  assert.equal(analyzeVehicle.tagName, 'BUTTON');
  assert.equal(analyzeVehicle.disabled, true, 'Analyze Vehicle card harus disabled');
  assert.equal(analyzeVehicle.textContent, 'Analyze Vehicle');
  assert.ok(analyzeVehicle.getAttribute('aria-label'));

  assert.equal(generateReport.id, 'dashboardV2AiCommandCenterActionGenerateReport');
  assert.equal(generateReport.tagName, 'BUTTON');
  assert.equal(generateReport.disabled, true, 'Generate Report card harus disabled');
  assert.equal(generateReport.textContent, 'Generate Report');
  assert.ok(generateReport.getAttribute('aria-label'));

  assert.equal(smartAssistant.id, 'dashboardV2AiCommandCenterActionSmartAssistant');
  assert.equal(smartAssistant.tagName, 'BUTTON');
  assert.equal(smartAssistant.disabled, true, 'Smart Assistant card harus disabled');
  assert.equal(smartAssistant.textContent, 'Smart Assistant');
  assert.ok(smartAssistant.getAttribute('aria-label'));
});

test('AI Command Center: suggestion area ada, id & isi placeholder sesuai', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getAISection(root);
  const suggestion = section.children[5];

  assert.equal(suggestion.id, 'dashboardV2AiCommandCenterSuggestion');
  assert.equal(suggestion.className, 'dashboard-v2-ai-suggestion');
  assert.match(suggestion.textContent, /placeholder/i);
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.10 (AI Command Center tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk AI Command Center (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const section = getAISection(root);
  assert.equal(section.children.length, 10);
  const analyzeFinance = section.children.find((c) => c.id === 'dashboardV2AiCommandCenterActionAnalyzeFinance');
  assert.ok(analyzeFinance);
});

test('root top-level tetap 5 komponen setelah Tahap V2.10 (AI Command Center anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: AI Command Center murni placeholder — tanpa event listener,
// tanpa routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/API/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('AI Command Center: tidak ada onclick/addEventListener terpasang (murni readonly/disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.10) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /\bfetch\s*\(/);
});

test('ai-command-center.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.10', () => {
  const aiSrc = fs.readFileSync(path.join(__dirname, '..', 'ai-command-center.js'), 'utf8');
  assert.doesNotMatch(aiSrc, /DashboardV2Shell/);
  assert.doesNotMatch(codeOnly, /ai-command-center\.js/);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.10', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.10 (AI Command Center jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
