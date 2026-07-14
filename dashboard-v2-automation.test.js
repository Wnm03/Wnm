'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.13 — Automation Center (anak baru Main Content Container,
// setelah Predictive Insights V2.12). Fake DOM sama persis dgn
// tests/dashboard-v2-predictive.test.js, tests/dashboard-v2-health.test.js
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

function getAutomationSection(root) {
  const main = getMain(root);
  return main.children.find((c) => c.id === 'dashboardV2AutomationCenter');
}

test('Automation Center: ditemukan sbg anak ke-13 Main Content Container, section dgn role=region + aria-label "Automation Center"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = getAutomationSection(root);
  assert.ok(section, 'Automation Center tidak ditemukan');
  assert.equal(main.children[12].id, 'dashboardV2AutomationCenter');
  assert.equal(section.tagName, 'SECTION');
  assert.equal(section.getAttribute('role'), 'region');
  assert.equal(section.getAttribute('aria-label'), 'Automation Center');
});

test('Automation Center: berisi tepat 9 anak (5 kartu automation lama V2.13 + 4 elemen data V2.24)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getAutomationSection(root);
  assert.equal(section.children.length, 9);
});

test('Automation Center: 5 kartu sesuai urutan (Auto Backup, Monthly Report, Budget Reminder, Vehicle Service Reminder, Document Renewal Reminder), semua <button disabled> berisi icon + title + schedule + status + description placeholder', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const section = getAutomationSection(root);
  const [autoBackup, monthlyReport, budgetReminder, vehicleServiceReminder, documentRenewalReminder] = section.children;

  const expectations = [
    { card: autoBackup, keyCap: 'AutoBackup', title: 'Auto Backup' },
    { card: monthlyReport, keyCap: 'MonthlyReport', title: 'Monthly Report' },
    { card: budgetReminder, keyCap: 'BudgetReminder', title: 'Budget Reminder' },
    { card: vehicleServiceReminder, keyCap: 'VehicleServiceReminder', title: 'Vehicle Service Reminder' },
    { card: documentRenewalReminder, keyCap: 'DocumentRenewalReminder', title: 'Document Renewal Reminder' },
  ];

  expectations.forEach(({ card, keyCap, title }) => {
    assert.equal(card.id, `dashboardV2AutomationCenterCard${keyCap}`);
    assert.equal(card.tagName, 'BUTTON');
    assert.equal(card.type, 'button');
    assert.equal(card.disabled, true, `${title} card harus disabled`);
    assert.equal(card.className, 'dashboard-v2-automation-card');
    assert.ok(card.getAttribute('aria-label'));
    assert.equal(card.children.length, 5, `${title} card harus punya 5 anak (icon, title, schedule, status, description)`);

    const [icon, cardTitle, schedule, status, description] = card.children;

    assert.equal(icon.id, `dashboardV2AutomationCenterCard${keyCap}Icon`);
    assert.equal(icon.className, 'dashboard-v2-automation-icon');
    assert.ok(icon.textContent);

    assert.equal(cardTitle.id, `dashboardV2AutomationCenterCard${keyCap}Title`);
    assert.equal(cardTitle.className, 'dashboard-v2-automation-title');
    assert.equal(cardTitle.textContent, title);

    assert.equal(schedule.id, `dashboardV2AutomationCenterCard${keyCap}Schedule`);
    assert.equal(schedule.className, 'dashboard-v2-automation-schedule');
    assert.equal(schedule.textContent, '--');

    assert.equal(status.id, `dashboardV2AutomationCenterCard${keyCap}Status`);
    assert.equal(status.className, 'dashboard-v2-automation-status');
    assert.equal(status.textContent, 'Disabled');

    assert.equal(description.id, `dashboardV2AutomationCenterCard${keyCap}Description`);
    assert.equal(description.className, 'dashboard-v2-automation-description');
    assert.ok(description.textContent);
  });
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.13 (Automation Center tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Automation Center (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const section = getAutomationSection(root);
  assert.equal(section.children.length, 9);
  const autoBackup = section.children.find((c) => c.id === 'dashboardV2AutomationCenterCardAutoBackup');
  assert.ok(autoBackup);
});

test('root top-level tetap 5 komponen setelah Tahap V2.13 (Automation Center anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Automation Center murni placeholder — tanpa event listener,
// tanpa routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/API/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Automation Center: tidak ada onclick/addEventListener terpasang (murni disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.13) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /\bfetch\s*\(/);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.13', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.13 (Automation Center jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
