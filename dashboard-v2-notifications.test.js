'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.9 — Notifications Center (anak baru Main Content Container,
// setelah Upcoming Tasks V2.8). Fake DOM sama persis dgn tests/dashboard-v2-
// upcoming.test.js, tests/dashboard-v2-statistics.test.js &
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

test('Notifications: ditemukan sbg anak ke-9 Main Content Container, section dgn role=region + aria-label "Notifications"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2Notifications');
  assert.ok(section, 'Notifications tidak ditemukan');
  assert.equal(main.children[8].id, 'dashboardV2Notifications');
  assert.equal(section.tagName, 'SECTION');
  assert.equal(section.getAttribute('role'), 'region');
  assert.equal(section.getAttribute('aria-label'), 'Notifications');
});

test('Notifications: berisi tepat 9 anak (5 notification card lama V2.9 + 4 data summary baru V2.23)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2Notifications');
  assert.equal(section.children.length, 9);
});

test('Notifications: urutan 5 kartu sesuai (Backup berhasil, Pengeluaran tinggi minggu ini, Jadwal servis mendekat, Laporan bulanan siap, Sinkronisasi selesai), semua <button disabled>', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2Notifications');
  const [backup, pengeluaran, servis, laporan, sinkronisasi] = section.children;

  assert.equal(backup.id, 'dashboardV2NotificationCardBackup');
  assert.equal(backup.tagName, 'BUTTON');
  assert.equal(backup.type, 'button');
  assert.equal(backup.disabled, true, 'Backup berhasil card harus disabled');
  assert.equal(backup.className, 'dashboard-v2-notification-card');
  assert.ok(backup.getAttribute('aria-label'));

  assert.equal(pengeluaran.id, 'dashboardV2NotificationCardPengeluaran');
  assert.equal(pengeluaran.tagName, 'BUTTON');
  assert.equal(pengeluaran.disabled, true, 'Pengeluaran tinggi minggu ini card harus disabled');
  assert.ok(pengeluaran.getAttribute('aria-label'));

  assert.equal(servis.id, 'dashboardV2NotificationCardServis');
  assert.equal(servis.tagName, 'BUTTON');
  assert.equal(servis.disabled, true, 'Jadwal servis mendekat card harus disabled');
  assert.ok(servis.getAttribute('aria-label'));

  assert.equal(laporan.id, 'dashboardV2NotificationCardLaporan');
  assert.equal(laporan.tagName, 'BUTTON');
  assert.equal(laporan.disabled, true, 'Laporan bulanan siap card harus disabled');
  assert.ok(laporan.getAttribute('aria-label'));

  assert.equal(sinkronisasi.id, 'dashboardV2NotificationCardSinkronisasi');
  assert.equal(sinkronisasi.tagName, 'BUTTON');
  assert.equal(sinkronisasi.disabled, true, 'Sinkronisasi selesai card harus disabled');
  assert.ok(sinkronisasi.getAttribute('aria-label'));
});

test('Notifications: tiap kartu berisi 4 sub-elemen (icon, title, description, timestamp) sesuai urutan & isi', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2Notifications');
  const backup = section.children.find((c) => c.id === 'dashboardV2NotificationCardBackup');

  assert.equal(backup.children.length, 4);
  const [icon, title, description, timestamp] = backup.children;

  assert.equal(icon.id, 'dashboardV2NotificationCardBackupIcon');
  assert.equal(icon.className, 'dashboard-v2-notification-icon');
  assert.ok(icon.textContent, 'icon placeholder harus ada isinya');

  assert.equal(title.id, 'dashboardV2NotificationCardBackupTitle');
  assert.equal(title.className, 'dashboard-v2-notification-title');
  assert.equal(title.textContent, 'Backup berhasil');

  assert.equal(description.id, 'dashboardV2NotificationCardBackupDescription');
  assert.equal(description.className, 'dashboard-v2-notification-description');
  assert.match(description.textContent, /placeholder/i);

  assert.equal(timestamp.id, 'dashboardV2NotificationCardBackupTimestamp');
  assert.equal(timestamp.className, 'dashboard-v2-notification-timestamp');
  assert.match(timestamp.textContent, /placeholder/i);
});

test('Notifications: kartu Pengeluaran/Servis/Laporan/Sinkronisasi jg berisi title & description/timestamp placeholder yg benar', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2Notifications');

  const pengeluaran = section.children.find((c) => c.id === 'dashboardV2NotificationCardPengeluaran');
  const [, pengeluaranTitle, pengeluaranDescription, pengeluaranTimestamp] = pengeluaran.children;
  assert.equal(pengeluaranTitle.textContent, 'Pengeluaran tinggi minggu ini');
  assert.match(pengeluaranDescription.textContent, /placeholder/i);
  assert.match(pengeluaranTimestamp.textContent, /placeholder/i);

  const servis = section.children.find((c) => c.id === 'dashboardV2NotificationCardServis');
  const [, servisTitle, servisDescription, servisTimestamp] = servis.children;
  assert.equal(servisTitle.textContent, 'Jadwal servis mendekat');
  assert.match(servisDescription.textContent, /placeholder/i);
  assert.match(servisTimestamp.textContent, /placeholder/i);

  const laporan = section.children.find((c) => c.id === 'dashboardV2NotificationCardLaporan');
  const [, laporanTitle, laporanDescription, laporanTimestamp] = laporan.children;
  assert.equal(laporanTitle.textContent, 'Laporan bulanan siap');
  assert.match(laporanDescription.textContent, /placeholder/i);
  assert.match(laporanTimestamp.textContent, /placeholder/i);

  const sinkronisasi = section.children.find((c) => c.id === 'dashboardV2NotificationCardSinkronisasi');
  const [, sinkronisasiTitle, sinkronisasiDescription, sinkronisasiTimestamp] = sinkronisasi.children;
  assert.equal(sinkronisasiTitle.textContent, 'Sinkronisasi selesai');
  assert.match(sinkronisasiDescription.textContent, /placeholder/i);
  assert.match(sinkronisasiTimestamp.textContent, /placeholder/i);
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.9 (Notifications tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Notifications (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const section = main.children.find((c) => c.id === 'dashboardV2Notifications');
  assert.equal(section.children.length, 9);
  const backup = section.children.find((c) => c.id === 'dashboardV2NotificationCardBackup');
  assert.equal(backup.children.length, 4);
});

test('root top-level tetap 5 komponen setelah Tahap V2.9 (Notifications anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Notifications Center murni placeholder — tanpa event listener,
// tanpa routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Notifications: tidak ada onclick/addEventListener terpasang (murni kartu disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.9) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
  assert.doesNotMatch(codeOnly, /FEATURE_REGISTRY/);
  assert.doesNotMatch(codeOnly, /showPage\s*\(/);
  assert.doesNotMatch(codeOnly, /AICommandCenter/);
  assert.doesNotMatch(codeOnly, /D\.profile/);
  assert.doesNotMatch(codeOnly, /D\.transactions/);
  assert.doesNotMatch(codeOnly, /DashboardHubHero/);
  assert.doesNotMatch(codeOnly, /innerHTML/);
  assert.doesNotMatch(codeOnly, /\bfetch\s*\(/);
});

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.9', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.9 (Notifications jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
