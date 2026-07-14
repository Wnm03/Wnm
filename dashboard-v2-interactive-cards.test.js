'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.30 — Interactive Dashboard Cards.
//
// Test lain (tests/dashboard-v2-summary.test.js,
// tests/dashboard-v2-module-grid-data.test.js) sudah memverifikasi STRUKTUR
// atribut kartu (`role`/`tabindex`/`data-action`/`data-args`) secara
// terisolasi (fake DOM murni, tanpa dashboard-hub.js). Test BARU ini
// melengkapi dgn 1 test INTEGRASI: memuat `dashboard-v2-shell.js` BERSAMA
// `dashboard-hub.js` ASLI (bukan mock/re-implementasi) di satu sandbox vm
// yang sama (pola `loadSource([...])` yang sudah ada di `tests/helpers/`),
// lalu benar-benar memanggil rantai navigasi ujung-ke-ujung: baca
// `data-action`/`data-args` dari kartu Module Grid -> resolve ke fungsi
// `dashHubNavigateToFeature()` (dashboard-hub.js, TIDAK diubah) -> pastikan
// itu memanggil `showPage()` (di-stub di sini, krn modal-navigasi.js/
// modules-render.js di luar scope test ini) dgn nama page yang benar.
// Ini membuktikan wiring V2.30 nyata reuse fungsi existing, bukan cuma
// atribut dekoratif yang kebetulan berbentuk benar.

function createFakeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    attributes: {},
    children: [],
    parentNode: null,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
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
    // dashHubNavigateToFeature() (dashboard-hub.js) memanggil
    // document.querySelectorAll('.nav-item') murni utk parameter `el`
    // showPage() (highlight nav) — tidak relevan bagi test ini (di-stub
    // array kosong, `el` hasil `navItems[...] || null` otomatis jadi null).
    querySelectorAll: () => [],
  };
}

function findModuleCard(root, id) {
  const main = root.children[2]; // sidebar, header, main, bottomnav, fab
  const grid = main.children.find((c) => c.id === 'dashboardV2ModuleGrid');
  return grid.children.find((c) => c.id === id);
}

test('Interactive Dashboard Cards (V2.30): klik kartu Finance/Vehicle/Settings benar2 memanggil showPage() lewat dashHubNavigateToFeature() ASLI (dashboard-hub.js, tidak diubah); Reports/Family/Documents tetap tidak wired', () => {
  const showPageCalls = [];
  const fakeDocument = makeFakeDocument();
  const context = loadSource(['dashboard-v2-shell.js', 'dashboard-hub.js'], {
    document: fakeDocument,
    window: {},
    showPage: (name, el) => { showPageCalls.push({ name, el }); },
  });

  const Shell = context.window.DashboardV2Shell;
  const root = Shell.render();

  const cases = [
    { id: 'dashboardV2ModuleGridFinance', page: 'keuangan' },
    { id: 'dashboardV2ModuleGridVehicle', page: 'carnotes' },
    { id: 'dashboardV2ModuleGridSettings', page: 'settings' },
  ];

  for (const { id, page } of cases) {
    const card = findModuleCard(root, id);
    assert.ok(card, `${id} tidak ditemukan di Module Grid`);
    assert.equal(card.getAttribute('data-action'), 'dashHubNavigateToFeature');

    // Simulasikan persis apa yang dilakukan dispatcher global
    // (features-helpers-global-security.js, TIDAK dimuat/diubah di test
    // ini — cukup ditiru urutan resolve-nya): baca nama fungsi dari
    // `data-action`, args dari `data-args` (JSON), lalu `fn.apply(...)`.
    const fnName = card.getAttribute('data-action');
    const args = JSON.parse(card.getAttribute('data-args'));
    const fn = context[fnName];
    assert.equal(typeof fn, 'function', `${fnName} harus fungsi nyata dari dashboard-hub.js`);

    showPageCalls.length = 0;
    fn.apply(null, args);

    assert.equal(showPageCalls.length, 1, `${id}: showPage() harus terpanggil tepat 1x`);
    assert.equal(showPageCalls[0].name, page, `${id}: showPage() harus dipanggil dgn page '${page}'`);
  }

  // Reports/Family/Documents: tidak py data-action sama sekali -> tidak ada
  // jalur navigasi apa pun (masih placeholder murni, sesuai keputusan scope
  // V2.30 — lihat DASHBOARD-V2-INTERACTIVE-CARDS.md).
  for (const id of ['dashboardV2ModuleGridReports', 'dashboardV2ModuleGridFamily', 'dashboardV2ModuleGridDocuments']) {
    const card = findModuleCard(root, id);
    assert.ok(card, `${id} tidak ditemukan di Module Grid`);
    assert.equal(card.getAttribute('data-action'), null, `${id}: seharusnya tidak py data-action`);
  }
});
