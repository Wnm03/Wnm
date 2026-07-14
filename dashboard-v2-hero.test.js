'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.2 (Sprint 3) — Header V2 & Hero V2 (DASHBOARD-V2-SHELL.md +
// instruksi sesi ini). Fake DOM sama persis dgn tests/dashboard-v2-shell.test.js
// (createElement/appendChild/replaceChildren/getElementById), supaya berjalan
// tanpa jsdom, konsisten dgn pola test V2.1.

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

test('Header V2 dirender dgn 4 sub-placeholder (greeting/search/notification/avatar)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const header = root.children.find((c) => c.id === 'dashboardV2Header');
  assert.ok(header, 'Header V2 tidak ditemukan');
  assert.equal(header.getAttribute('role'), 'banner');
  assert.equal(header.children.length, 4);

  const [greeting, search, notification, avatar] = header.children;
  assert.equal(greeting.id, 'dashboardV2HeaderGreeting');
  assert.equal(greeting.className, 'dashboard-v2-header-greeting');

  assert.equal(search.id, 'dashboardV2HeaderSearch');
  assert.equal(search.tagName, 'BUTTON');
  assert.equal(search.disabled, true, 'tombol search harus disabled (placeholder murni, belum interaktif)');
  assert.ok(search.getAttribute('aria-label'), 'tombol search harus punya aria-label');

  assert.equal(notification.id, 'dashboardV2HeaderNotification');
  assert.equal(notification.tagName, 'BUTTON');
  assert.equal(notification.disabled, true, 'tombol notification harus disabled (placeholder murni)');
  assert.ok(notification.getAttribute('aria-label'), 'tombol notification harus punya aria-label');

  assert.equal(avatar.id, 'dashboardV2HeaderAvatar');
  assert.equal(avatar.getAttribute('role'), 'img');
  assert.ok(avatar.getAttribute('aria-label'), 'avatar harus punya aria-label');
});

test('Hero V2 dirender di dalam Main Content Container (bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5, 'top-level root harus tetap 5 komponen (V2.1 tidak berubah)');

  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  assert.ok(main, 'Main Content Container tidak ditemukan');
  assert.equal(main.getAttribute('role'), 'main');

  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  assert.ok(hero, 'Hero V2 tidak ditemukan di dalam Main Content Container');
  assert.equal(hero.getAttribute('role'), 'region');
  assert.equal(hero.getAttribute('aria-labelledby'), 'dashboardV2HeroTitle');
});

test('Hero V2: placeholder welcome title ada', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  const title = hero.children.find((c) => c.id === 'dashboardV2HeroTitle');
  assert.ok(title, 'welcome title tidak ditemukan');
  assert.equal(title.tagName, 'H2');
  assert.match(title.textContent, /placeholder/i);
});

test('Hero V2: placeholder Health Score ada', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  const healthScore = hero.children.find((c) => c.id === 'dashboardV2HeroHealthScore');
  assert.ok(healthScore, 'Health Score placeholder tidak ditemukan');
  assert.equal(healthScore.className, 'dashboard-v2-hero-healthscore');
  assert.match(healthScore.textContent, /placeholder/i);
});

test('Hero V2: placeholder Balance ada', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  const balance = hero.children.find((c) => c.id === 'dashboardV2HeroBalance');
  assert.ok(balance, 'Balance placeholder tidak ditemukan');
  assert.equal(balance.className, 'dashboard-v2-hero-balance');
  assert.match(balance.textContent, /placeholder/i);
});

test('Hero V2: placeholder Insight ada', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  const hero = main.children.find((c) => c.id === 'dashboardV2Hero');
  const insight = hero.children.find((c) => c.id === 'dashboardV2HeroInsight');
  assert.ok(insight, 'Insight placeholder tidak ditemukan');
  assert.equal(insight.className, 'dashboard-v2-hero-insight');
  assert.match(insight.textContent, /placeholder/i);
});

test('render() tetap idempotent setelah penambahan Header V2/Hero V2 (tidak menumpuk)', () => {
  const { Shell } = loadShell();
  Shell.render();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
  const header = root.children.find((c) => c.id === 'dashboardV2Header');
  const main = root.children.find((c) => c.id === 'dashboardV2Main');
  assert.equal(header.children.length, 4);
  // Catatan: sejak Tahap V2.3, Main Content Container juga membungkus
  // Summary Cards & Quick Actions (bukan cuma Hero) — lihat
  // tests/dashboard-v2-summary.test.js untuk assersi lengkap struktur
  // Main pasca-V2.3. Di sini cukup pastikan Hero tetap anak pertama &
  // tidak menumpuk (idempotent).
  assert.equal(main.children[0].id, 'dashboardV2Hero');
});

test('Dashboard V2 tetap dormant setelah render() (root masih `hidden` + data-dashboard-v2-state="dormant")', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

// ---------------------------------------------------------------------------
// Regresi: tidak terhubung ke FEATURE_REGISTRY / Dashboard Hub existing /
// business logic / routing / AICommandCenter. Dashboard existing tidak
// berubah.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('dashboard-v2-shell.js (setelah V2.2) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
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
  test(`${file}: tetap 0 markup Dashboard V2 (Header/Hero V2 juga self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
