'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.6 — Recent Activity (anak baru Main Content Container, setelah
// Insight Panel V2.4). Fake DOM sama persis dgn tests/dashboard-v2-summary.
// test.js & tests/dashboard-v2-shell.test.js (createElement/appendChild/
// replaceChildren/getElementById), supaya berjalan tanpa jsdom, konsisten
// dgn pola test tahap-tahap sebelumnya.

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

test('Recent Activity: ditemukan sbg anak ke-6 Main Content Container, section dgn role=region + aria-label', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const activity = main.children.find((c) => c.id === 'dashboardV2RecentActivity');
  assert.ok(activity, 'Recent Activity tidak ditemukan');
  assert.equal(main.children[5].id, 'dashboardV2RecentActivity');
  assert.equal(activity.tagName, 'SECTION');
  assert.equal(activity.getAttribute('role'), 'region');
  assert.ok(activity.getAttribute('aria-label'));
});

test('Recent Activity: berisi tepat 9 anak (5 activity item lama V2.6 + 4 elemen data baru V2.21)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const activity = main.children.find((c) => c.id === 'dashboardV2RecentActivity');
  assert.equal(activity.children.length, 9);
});

test('Recent Activity: urutan 5 item sesuai (item1..item5), semua placeholder + aria-label', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const activity = main.children.find((c) => c.id === 'dashboardV2RecentActivity');
  const [item1, item2, item3, item4, item5] = activity.children;

  assert.equal(item1.id, 'dashboardV2RecentActivityItem1');
  assert.equal(item1.className, 'dashboard-v2-recent-activity-item');
  assert.match(item1.textContent, /Transaksi tercatat/);
  assert.match(item1.textContent, /placeholder/i);
  assert.ok(item1.getAttribute('aria-label'));

  assert.equal(item2.id, 'dashboardV2RecentActivityItem2');
  assert.match(item2.textContent, /Backup terakhir dijalankan/);
  assert.match(item2.textContent, /placeholder/i);
  assert.ok(item2.getAttribute('aria-label'));

  assert.equal(item3.id, 'dashboardV2RecentActivityItem3');
  assert.match(item3.textContent, /Catatan kendaraan diperbarui/);
  assert.match(item3.textContent, /placeholder/i);
  assert.ok(item3.getAttribute('aria-label'));

  assert.equal(item4.id, 'dashboardV2RecentActivityItem4');
  assert.match(item4.textContent, /Laporan dibuat/);
  assert.match(item4.textContent, /placeholder/i);
  assert.ok(item4.getAttribute('aria-label'));

  assert.equal(item5.id, 'dashboardV2RecentActivityItem5');
  assert.match(item5.textContent, /Anggota keluarga ditambahkan/);
  assert.match(item5.textContent, /placeholder/i);
  assert.ok(item5.getAttribute('aria-label'));
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.6 (Recent Activity tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Recent Activity (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const activity = main.children.find((c) => c.id === 'dashboardV2RecentActivity');
  assert.equal(activity.children.length, 9, 'Recent Activity harus 9 anak (5 lama V2.6 + 4 baru V2.21)');
});

test('root top-level tetap 5 komponen setelah Tahap V2.6 (Recent Activity anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Recent Activity murni placeholder — tanpa event listener, tanpa
// routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Recent Activity: tidak ada onclick/addEventListener terpasang (murni label, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.6) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions', () => {
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
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.6', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.6 (Recent Activity juga self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
