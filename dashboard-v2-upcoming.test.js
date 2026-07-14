'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.8 — Upcoming Tasks (anak baru Main Content Container, setelah
// Statistics Panel V2.7). Fake DOM sama persis dgn tests/dashboard-v2-
// summary.test.js, tests/dashboard-v2-statistics.test.js &
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

test('Upcoming Tasks: ditemukan sbg anak ke-8 Main Content Container, section dgn role=region + aria-label "Upcoming Tasks"', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');
  assert.ok(section, 'Upcoming Tasks tidak ditemukan');
  assert.equal(main.children[7].id, 'dashboardV2UpcomingTasks');
  assert.equal(section.tagName, 'SECTION');
  assert.equal(section.getAttribute('role'), 'region');
  assert.equal(section.getAttribute('aria-label'), 'Upcoming Tasks');
});

test('Upcoming Tasks: berisi tepat 9 anak (5 task card lama V2.8 + 4 data summary baru V2.22)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');
  assert.equal(section.children.length, 9);
});

test('Upcoming Tasks: urutan 5 kartu sesuai (Bayar Listrik, Servis Kendaraan, Backup Data, Review Laporan, Perbarui Dokumen), semua <button disabled>', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');
  const [listrik, servis, backup, laporan, dokumen] = section.children;

  assert.equal(listrik.id, 'dashboardV2UpcomingTaskCardListrik');
  assert.equal(listrik.tagName, 'BUTTON');
  assert.equal(listrik.type, 'button');
  assert.equal(listrik.disabled, true, 'Bayar Listrik card harus disabled');
  assert.equal(listrik.className, 'dashboard-v2-upcoming-task-card');
  assert.ok(listrik.getAttribute('aria-label'));

  assert.equal(servis.id, 'dashboardV2UpcomingTaskCardServis');
  assert.equal(servis.tagName, 'BUTTON');
  assert.equal(servis.disabled, true, 'Servis Kendaraan card harus disabled');
  assert.ok(servis.getAttribute('aria-label'));

  assert.equal(backup.id, 'dashboardV2UpcomingTaskCardBackup');
  assert.equal(backup.tagName, 'BUTTON');
  assert.equal(backup.disabled, true, 'Backup Data card harus disabled');
  assert.ok(backup.getAttribute('aria-label'));

  assert.equal(laporan.id, 'dashboardV2UpcomingTaskCardLaporan');
  assert.equal(laporan.tagName, 'BUTTON');
  assert.equal(laporan.disabled, true, 'Review Laporan card harus disabled');
  assert.ok(laporan.getAttribute('aria-label'));

  assert.equal(dokumen.id, 'dashboardV2UpcomingTaskCardDokumen');
  assert.equal(dokumen.tagName, 'BUTTON');
  assert.equal(dokumen.disabled, true, 'Perbarui Dokumen card harus disabled');
  assert.ok(dokumen.getAttribute('aria-label'));
});

test('Upcoming Tasks: tiap kartu berisi 4 sub-elemen (icon, title, due date, status) sesuai urutan & isi', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');
  const listrik = section.children.find((c) => c.id === 'dashboardV2UpcomingTaskCardListrik');

  assert.equal(listrik.children.length, 4);
  const [icon, title, dueDate, status] = listrik.children;

  assert.equal(icon.id, 'dashboardV2UpcomingTaskCardListrikIcon');
  assert.equal(icon.className, 'dashboard-v2-upcoming-task-icon');
  assert.ok(icon.textContent, 'icon placeholder harus ada isinya');

  assert.equal(title.id, 'dashboardV2UpcomingTaskCardListrikTitle');
  assert.equal(title.className, 'dashboard-v2-upcoming-task-title');
  assert.equal(title.textContent, 'Bayar Listrik');

  assert.equal(dueDate.id, 'dashboardV2UpcomingTaskCardListrikDueDate');
  assert.equal(dueDate.className, 'dashboard-v2-upcoming-task-due-date');
  assert.match(dueDate.textContent, /placeholder/i);

  assert.equal(status.id, 'dashboardV2UpcomingTaskCardListrikStatus');
  assert.equal(status.className, 'dashboard-v2-upcoming-task-status');
  assert.match(status.textContent, /placeholder/i);
});

test('Upcoming Tasks: kartu Servis/Backup/Laporan/Dokumen jg berisi title & due date/status placeholder yg benar', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  const main = getMain(root);
  const section = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');

  const servis = section.children.find((c) => c.id === 'dashboardV2UpcomingTaskCardServis');
  const [, servisTitle, servisDueDate, servisStatus] = servis.children;
  assert.equal(servisTitle.textContent, 'Servis Kendaraan');
  assert.match(servisDueDate.textContent, /placeholder/i);
  assert.match(servisStatus.textContent, /placeholder/i);

  const backup = section.children.find((c) => c.id === 'dashboardV2UpcomingTaskCardBackup');
  const [, backupTitle, backupDueDate, backupStatus] = backup.children;
  assert.equal(backupTitle.textContent, 'Backup Data');
  assert.match(backupDueDate.textContent, /placeholder/i);
  assert.match(backupStatus.textContent, /placeholder/i);

  const laporan = section.children.find((c) => c.id === 'dashboardV2UpcomingTaskCardLaporan');
  const [, laporanTitle, laporanDueDate, laporanStatus] = laporan.children;
  assert.equal(laporanTitle.textContent, 'Review Laporan');
  assert.match(laporanDueDate.textContent, /placeholder/i);
  assert.match(laporanStatus.textContent, /placeholder/i);

  const dokumen = section.children.find((c) => c.id === 'dashboardV2UpcomingTaskCardDokumen');
  const [, dokumenTitle, dokumenDueDate, dokumenStatus] = dokumen.children;
  assert.equal(dokumenTitle.textContent, 'Perbarui Dokumen');
  assert.match(dokumenDueDate.textContent, /placeholder/i);
  assert.match(dokumenStatus.textContent, /placeholder/i);
});

test('Dashboard V2 tetap dormant setelah render() Tahap V2.8 (Upcoming Tasks tidak mengaktifkan root)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tetap idempotent utk Upcoming Tasks (tidak menumpuk saat dipanggil berkali-kali)', () => {
  const { Shell } = loadShell();
  Shell.render();
  Shell.render();
  const root = Shell.render();
  const main = getMain(root);
  assert.equal(main.children.length, 13);
  const section = main.children.find((c) => c.id === 'dashboardV2UpcomingTasks');
  assert.equal(section.children.length, 9);
  const listrik = section.children.find((c) => c.id === 'dashboardV2UpcomingTaskCardListrik');
  assert.equal(listrik.children.length, 4);
});

test('root top-level tetap 5 komponen setelah Tahap V2.8 (Upcoming Tasks anak Main, bukan top-level baru)', () => {
  const { Shell } = loadShell();
  const root = Shell.render();
  assert.equal(root.children.length, 5);
});

// ---------------------------------------------------------------------------
// Regresi: Upcoming Tasks murni placeholder — tanpa event listener, tanpa
// routing (tidak memanggil showPage()), tanpa FEATURE_REGISTRY, tanpa
// AI/fetch/state baru, tanpa business logic apa pun.
// ---------------------------------------------------------------------------

const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
const codeOnly = SHELL_SOURCE.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

test('Upcoming Tasks: tidak ada onclick/addEventListener terpasang (murni kartu disabled, tanpa routing/link)', () => {
  assert.doesNotMatch(codeOnly, /addEventListener/);
  assert.doesNotMatch(codeOnly, /\.onclick\s*=/);
});

test('dashboard-v2-shell.js (setelah V2.8) tetap tidak terhubung ke FEATURE_REGISTRY/showPage()/AICommandCenter/D.profile/D.transactions/fetch', () => {
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

test('dashboard-hub.js tetap tidak berubah/tidak direferensikan oleh shell V2 setelah Tahap V2.8', () => {
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
  test(`${file}: tetap 0 markup Dashboard V2 setelah Tahap V2.8 (Upcoming Tasks jg self-mounting via JS, bukan HTML)`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /dashboard-v2-/);
    assert.doesNotMatch(html, /dashboardV2/);
    assert.match(html, /id="page-dashboard-hub"/);
  });
}
