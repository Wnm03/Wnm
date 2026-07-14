'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// Regression test — Dashboard V2 toggle OFF -> ON -> OFF.
//
// TUJUAN: membuktikan siklus toggleDashboardV2() (dashboard-hub.js,
// V2.15/DASHBOARD-V2-ACTIVATION-SWITCH.md) benar-benar menjalankan 3 file
// SUMBER ASLI bersamaan (dashboard-v2-activation.js, dashboard-v2-shell.js,
// dashboard-hub.js — TIDAK di-mock satu pun di sini, beda dari
// tests/dashboard-v2-mount.test.js & tests/dashboard-v2-activation-*.test.js
// yang sengaja mem-mock 1-2 modul demi isolasi unit), dan siklus itu tidak
// merusak mount/destroy Dashboard V2 maupun rendering Dashboard Hub.
//
// PEMETAAN "visible/hidden" ke kontrak DOM (sejak patch mutual-exclusion di
// DashboardHub.render(), lihat blok "Hub/V2 mutual-exclusion" &
// "removeAttribute('hidden')" di dashboard-hub.js):
//   - Dashboard V2 "hidden"  = root #dashboardV2Root TIDAK ada di DOM sama
//     sekali (belum pernah di-init, ATAU sudah di-destroy lewat auto-
//     destroy V2.14D), sedangkan "visible" = root ADA, TANPA attribute
//     `hidden`, data-dashboard-v2-state="active".
//   - Dashboard Hub "visible" = #dashboardHubGrid berisi markup Hub asli
//     (kategori/fitur dari FEATURE_REGISTRY) DAN TIDAK punya attribute
//     `hidden`. "hidden" = elemen yang SAMA (isinya tetap ter-render penuh
//     di baliknya, tidak dikosongkan/di-destroy) tapi ber-attribute
//     `hidden`, ditoggle oleh DashboardHub.render() sendiri persis saat
//     Dashboard V2 benar2 ter-mount & sebaliknya.
//
// Kedua state (Hub & V2) dijamin SALING EKSKLUSIF: tidak pernah keduanya
// visible bersamaan, dan tidak pernah keduanya hidden bersamaan — persis
// requirement 3-fase (OFF / ON / OFF lagi) di bawah.

function minimalRegistry() {
  return [
    {
      key: 'keuangan', label: 'Keuangan', icon: '💰', desc: 'desc', navIdx: 0,
      features: [
        { key: 'keu-transaksi', label: 'Transaksi', desc: 'Catat transaksi', target: { page: 'keuangan' } },
      ],
    },
  ];
}

// Fake DOM tree minimal (pola sama persis dgn
// tests/dashboard-v2-activation-render.test.js) — dipakai supaya
// dashboard-v2-shell.js bisa document.createElement()/body.appendChild()
// root-nya sungguhan, SEKALIGUS dashboard-hub.js bisa
// document.getElementById('dashboardHubGrid') dgn elemen yang sudah
// ditaruh di body dari awal, dan setAttribute/removeAttribute('hidden')
// pada elemen itu betul-betul teramati dari luar (referensi objek yang
// sama, bukan disalin masuk sandbox — lihat catatan di helpers/loadSource.js).
function createFakeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    innerHTML: '',
    attributes: {},
    children: [],
    parentNode: null,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    removeAttribute(name) { delete this.attributes[name]; },
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

// makeIntegratedHarness() — load KETIGA file sumber ASLI (activation,
// shell, hub) ke SATU sandbox vm bersama (bukan mock), dgn document tiruan
// minimal. FEATURE_REGISTRY sengaja pakai versi minimal (bukan asli),
// mengikuti pola tests/dashboard-v2-mount.test.js, supaya test ini tidak
// ikut berubah kalau taksonomi Hub direvisi nanti.
function makeIntegratedHarness() {
  const body = createFakeElement('body');
  const grid = createFakeElement('div');
  grid.id = 'dashboardHubGrid';
  body.appendChild(grid);

  const fakeDocument = {
    body,
    createElement: (tag) => createFakeElement(tag),
    getElementById: (id) => findById(body, id),
    querySelectorAll: () => [],
  };

  const showPageCalls = [];

  const ctx = loadSource(
    ['dashboard-v2-activation.js', 'dashboard-v2-shell.js', 'dashboard-hub.js'],
    {
      document: fakeDocument,
      window: {},
      FEATURE_REGISTRY: minimalRegistry(),
      escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
      showPage: (...args) => showPageCalls.push(args),
    },
    ['DashboardHub', 'DashboardV2Shell'],
  );

  return { ctx, grid, fakeDocument, showPageCalls };
}

// hubHasContent() — cek markup Hub asli (kategori/fitur) benar2 ter-render
// ke grid, TERLEPAS dari status hidden-nya (dipakai utk membuktikan Hub
// tidak pernah "dirusak"/dikosongkan, hanya disembunyikan lewat attribute).
function hubHasContent(grid) {
  return /Transaksi/.test(grid.innerHTML) && /dashhub-cat/.test(grid.innerHTML);
}

// hubIsVisible()/hubIsHidden() — status visibilitas Hub yang SEBENARNYA:
// content ada DAN tidak ber-attribute hidden (visible), atau content tetap
// ada TAPI ber-attribute hidden (hidden). Hub yang "hidden" secara ini
// BUKAN Hub yang rusak/kosong — assert hubHasContent() dipakai terpisah di
// tiap test yang relevan utk memastikan itu.
function hubIsVisible(grid) {
  return hubHasContent(grid) && grid.hasAttribute('hidden') === false;
}
function hubIsHidden(grid) {
  return hubHasContent(grid) && grid.hasAttribute('hidden') === true;
}

function v2State(fakeDocument) {
  const root = fakeDocument.getElementById('dashboardV2Root');
  if (!root) return { mounted: false, visible: false, dataState: null };
  return {
    mounted: true,
    visible: root.hasAttribute('hidden') === false,
    dataState: root.getAttribute('data-dashboard-v2-state'),
  };
}

// 1. Dashboard V2 OFF (state awal) — Hub visible, V2 hidden (belum ter-mount
//    sama sekali, krn blok mount V2.14C no-op total selagi flag false).
test('V2 OFF (awal): Dashboard Hub visible, Dashboard V2 hidden (belum ter-mount)', () => {
  const { ctx, grid, fakeDocument } = makeIntegratedHarness();
  assert.equal(ctx.isDashboardV2Enabled(), false, 'flag default harus false');

  assert.doesNotThrow(() => ctx.DashboardHub.render());

  assert.ok(hubIsVisible(grid), 'Dashboard Hub grid harus visible (ter-render, tidak hidden)');
  const v2 = v2State(fakeDocument);
  assert.equal(v2.mounted, false, 'Dashboard V2 tidak boleh ter-mount sama sekali selagi flag false');
});

// 2. Toggle -> ON — Dashboard Hub HIDDEN, Dashboard V2 visible.
test('V2 ON (toggle dari OFF): Dashboard Hub hidden, Dashboard V2 visible (mounted, tidak hidden, state=active)', () => {
  const { ctx, grid, fakeDocument } = makeIntegratedHarness();
  ctx.DashboardHub.render(); // render awal (OFF), spt test #1

  assert.doesNotThrow(() => ctx.DashboardHub.toggleDashboardV2());

  assert.equal(ctx.isDashboardV2Enabled(), true, 'flag harus true setelah toggle dari false');

  assert.ok(hubIsHidden(grid), 'Dashboard Hub grid harus hidden (attribute hidden terpasang) saat Dashboard V2 ON');
  assert.ok(hubHasContent(grid), 'Dashboard Hub grid tetap berisi markup asli (disembunyikan, bukan dikosongkan/dirusak)');

  const v2 = v2State(fakeDocument);
  assert.equal(v2.mounted, true, 'Dashboard V2 root harus ter-mount setelah ON');
  assert.equal(v2.visible, true, 'Dashboard V2 root tidak boleh punya attribute hidden saat ON');
  assert.equal(v2.dataState, 'active', 'data-dashboard-v2-state harus "active" saat ON');
});

// 3. Tidak ada dua dashboard visible bersamaan saat V2 ON: Hub hidden PERSIS
//    di render() yang sama dgn Dashboard V2 menjadi visible (dicek dalam 1
//    render() call, bukan cuma end-state).
test('V2 ON: Dashboard Hub hidden & Dashboard V2 visible dalam SATU render() yang sama (tidak ada 2 dashboard visible bersamaan)', () => {
  const { ctx, grid, fakeDocument } = makeIntegratedHarness();
  ctx.DashboardHub.render();
  ctx.DashboardHub.toggleDashboardV2(); // toggle ini sendiri sudah memanggil DashboardHub.render() 1x

  const v2 = v2State(fakeDocument);
  const hubVisible = hubIsVisible(grid);
  const v2Visible = v2.mounted && v2.visible;
  assert.equal(hubVisible, false, 'Hub tidak boleh visible saat V2 ON');
  assert.equal(v2Visible, true, 'V2 harus visible saat ON');
  assert.notEqual(hubVisible, v2Visible, 'Hub & V2 tidak boleh sama-sama visible (mutual exclusion)');
});

// 4. Toggle lagi -> OFF — Dashboard V2 hidden kembali (auto-destroy
//    melepas root dari DOM), Dashboard Hub visible kembali.
test('V2 OFF lagi (toggle dari ON): Dashboard Hub visible kembali, Dashboard V2 hidden kembali (auto-destroy melepas root)', () => {
  const { ctx, grid, fakeDocument } = makeIntegratedHarness();
  ctx.DashboardHub.render();
  ctx.DashboardHub.toggleDashboardV2(); // OFF -> ON
  assert.ok(hubIsHidden(grid), 'sanity check: Hub harus hidden dulu selagi ON');

  assert.doesNotThrow(() => ctx.DashboardHub.toggleDashboardV2()); // ON -> OFF

  assert.equal(ctx.isDashboardV2Enabled(), false, 'flag harus kembali false');
  assert.ok(hubIsVisible(grid), 'Dashboard Hub harus visible kembali setelah V2 dimatikan lagi (attribute hidden dilepas)');
  const v2 = v2State(fakeDocument);
  assert.equal(v2.mounted, false, 'root Dashboard V2 harus sudah dilepas dari DOM (auto-destroy) setelah OFF lagi');
});

// 5. Saling eksklusif penuh di ke-3 fase siklus (OFF awal, ON, OFF lagi):
//    persis satu dari {Hub, V2} yang visible di tiap fase, tidak pernah 0
//    ataupun 2 sekaligus.
test('di ke-3 fase siklus (OFF -> ON -> OFF), persis satu dari {Dashboard Hub, Dashboard V2} yang visible — tidak pernah 0 atau 2 sekaligus', () => {
  const { ctx, grid, fakeDocument } = makeIntegratedHarness();

  function phase(label) {
    const v2 = v2State(fakeDocument);
    const hubVisible = hubIsVisible(grid);
    const v2Visible = v2.mounted && v2.visible;
    assert.equal(hubVisible !== v2Visible, true, `${label}: harus persis salah satu (Hub XOR V2) yang visible`);
    return { hubVisible, v2Visible };
  }

  ctx.DashboardHub.render();
  let p = phase('OFF awal');
  assert.equal(p.hubVisible, true);
  assert.equal(p.v2Visible, false);

  ctx.DashboardHub.toggleDashboardV2(); // -> ON
  p = phase('ON');
  assert.equal(p.hubVisible, false);
  assert.equal(p.v2Visible, true);

  ctx.DashboardHub.toggleDashboardV2(); // -> OFF
  p = phase('OFF lagi');
  assert.equal(p.hubVisible, true);
  assert.equal(p.v2Visible, false);
});

// 6. Toggle berulang (OFF->ON->OFF->ON->OFF, 5x) tidak merusak mount/
//    destroy: tidak throw, tidak leak root ganda, state akhir konsisten,
//    Hub & V2 selalu saling eksklusif & tidak pernah kehilangan contentnya
//    di sepanjang siklus.
test('toggle berulang 5x (OFF-ON-OFF-ON-OFF) tidak merusak mount/destroy: tidak throw, tidak ada root ganda, Hub/V2 selalu saling eksklusif', () => {
  const { ctx, grid, fakeDocument } = makeIntegratedHarness();
  ctx.DashboardHub.render();

  const sequence = [];
  assert.doesNotThrow(() => {
    for (let i = 0; i < 5; i++) {
      ctx.DashboardHub.toggleDashboardV2();
      const enabled = ctx.isDashboardV2Enabled();
      sequence.push(enabled);

      assert.ok(hubHasContent(grid), `Hub tidak boleh kehilangan contentnya setelah toggle ke-${i + 1}`);
      const v2 = v2State(fakeDocument);
      const hubVisible = hubIsVisible(grid);
      const v2Visible = v2.mounted && v2.visible;
      assert.equal(hubVisible, !enabled, `toggle ke-${i + 1}: Hub visible harus kebalikan dari flag ON`);
      assert.equal(v2Visible, enabled, `toggle ke-${i + 1}: V2 visible harus mengikuti flag ON`);
      assert.notEqual(hubVisible, v2Visible, `toggle ke-${i + 1}: Hub & V2 tidak boleh sama-sama visible/hidden`);
    }
  });

  assert.deepEqual(sequence, [true, false, true, false, true], 'urutan flag harus berselang-seling sempurna dari false');

  // Hitung berapa banyak elemen #dashboardV2Root yang PERNAH ada di body —
  // harus persis 1 slot di children (tidak menumpuk root lama yang belum
  // dilepas), krn auto-destroy (V2.14D) selalu removeChild() sebelum
  // init() berikutnya membuat root baru.
  const v2RootCount = fakeDocument.body.children.filter((c) => c.id === 'dashboardV2Root').length;
  assert.ok(v2RootCount <= 1, 'tidak boleh ada lebih dari 1 root Dashboard V2 menumpuk di DOM sekaligus');

  // State akhir: flag true (5x toggle ganjil dari false -> true) -> V2
  // visible & Hub hidden di akhir siklus ini.
  const v2 = v2State(fakeDocument);
  assert.equal(v2.mounted, true);
  assert.equal(v2.visible, true);
  assert.equal(v2.dataState, 'active');
  assert.ok(hubIsHidden(grid), 'Hub harus hidden di akhir siklus (flag berakhir true)');
});
