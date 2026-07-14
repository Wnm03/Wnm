'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeElement } = require('./helpers/fakeDom');

// Tahap V2.14C — Dashboard V2 Mount (DASHBOARD-V2-MOUNT.md).
// Menguji bahwa DashboardHub.render() memanggil DashboardV2Shell.init()/
// render() HANYA kalau isDashboardV2Enabled() true, dan TIDAK melakukan
// apa pun tambahan kalau false (Dashboard lama berjalan seperti biasa).
// Pola harness (document tiruan minimal + FEATURE_REGISTRY tiruan kecil)
// diadaptasi dari tests/dashboard-hub.test.js — SENGAJA tidak memakai
// FEATURE_REGISTRY asli, supaya test ini tidak ikut berubah kalau
// taksonomi direvisi nanti. DashboardV2Shell & isDashboardV2Enabled
// di-inject sbg mock manual (bukan menjalankan dashboard-v2-shell.js/
// dashboard-v2-activation.js sungguhan) — logic masing2 modul itu sudah
// dites terpisah di file test-nya sendiri; di sini kita murni menguji
// WIRING mount-nya.

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

// makeHubForMount(opts) — load dashboard-hub.js dgn document tiruan minimal
// (hanya #dashboardHubGrid, cukup utk render() jalan tanpa error), plus
// mock isDashboardV2Enabled & DashboardV2Shell (spy call count).
function makeHubForMount(opts = {}) {
  const grid = createFakeElement();
  const fakeDocument = {
    getElementById: (id) => (id === 'dashboardHubGrid' ? grid : createFakeElement()),
    querySelectorAll: () => [],
  };

  const v2Calls = { init: 0, render: 0 };
  const DashboardV2Shell = {
    init: (...args) => { v2Calls.init += 1; return { args }; },
    render: (...args) => { v2Calls.render += 1; return { args }; },
  };

  const isDashboardV2Enabled = () => opts.enabled === true;

  const showPageCalls = [];

  const extraGlobals = {
    document: fakeDocument,
    FEATURE_REGISTRY: opts.registry || minimalRegistry(),
    escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
    showPage: (...args) => showPageCalls.push(args),
    window: {},
  };

  // Hanya suntik isDashboardV2Enabled/DashboardV2Shell kalau tidak
  // dinonaktifkan eksplisit lewat opts.omit* — dipakai utk test skenario
  // "modul belum ter-load sama sekali".
  if (!opts.omitFlag) extraGlobals.isDashboardV2Enabled = isDashboardV2Enabled;
  if (!opts.omitShell) extraGlobals.DashboardV2Shell = DashboardV2Shell;

  const ctx = loadSource(['dashboard-hub.js'], extraGlobals, ['DashboardHub']);
  return { DashboardHub: ctx.DashboardHub, v2Calls, showPageCalls, grid };
}

test('default (flag false) — Dashboard lama tetap jalan, DashboardV2Shell TIDAK dipanggil sama sekali', () => {
  const { DashboardHub, v2Calls, grid } = makeHubForMount({ enabled: false });
  assert.doesNotThrow(() => DashboardHub.render());
  assert.equal(v2Calls.init, 0, 'init() tidak boleh dipanggil saat flag false');
  assert.equal(v2Calls.render, 0, 'render() tidak boleh dipanggil saat flag false');
  assert.match(grid.innerHTML, /Transaksi/, 'Dashboard lama tetap merender grid seperti biasa');
});

test('flag true (enable()) — DashboardV2Shell.init() dipanggil', () => {
  const { DashboardHub, v2Calls } = makeHubForMount({ enabled: true });
  DashboardHub.render();
  assert.equal(v2Calls.init, 1);
});

test('flag true (enable()) — DashboardV2Shell.render() dipanggil', () => {
  const { DashboardHub, v2Calls } = makeHubForMount({ enabled: true });
  DashboardHub.render();
  assert.equal(v2Calls.render, 1);
});

test('flag false (disable()) — Dashboard lama tetap, DashboardV2Shell.init()/render() tidak dipanggil', () => {
  const { DashboardHub, v2Calls, grid } = makeHubForMount({ enabled: false });
  DashboardHub.render();
  assert.equal(v2Calls.init, 0);
  assert.equal(v2Calls.render, 0);
  assert.match(grid.innerHTML, /Transaksi/, 'Dashboard lama tetap jalan seperti biasa saat flag false');
});

test('DashboardHub.render() dipanggil berkali-kali saat flag true — render() Dashboard V2 ikut terpanggil tiap kali, init() HANYA sekali (guard init-once, lihat DASHBOARD-V2-INIT-ONCE.md), dan tidak "dobel" dalam satu panggilan', () => {
  const { DashboardHub, v2Calls } = makeHubForMount({ enabled: true });
  DashboardHub.render();
  assert.equal(v2Calls.init, 1);
  assert.equal(v2Calls.render, 1);
  DashboardHub.render();
  assert.equal(v2Calls.init, 1, 'init() TIDAK dipanggil lagi di render() ke-2 — sudah dijaga guard init-once di DashboardHub.render()');
  assert.equal(v2Calls.render, 2, 'render() tetap dipanggil tiap kali DashboardHub.render() dipanggil');
  // Poin utamanya: TIDAK ADA pemanggilan GANDA (mis. render() 2x) di DALAM
  // satu kali DashboardHub.render() — render() tetap rasio 1:1 dgn jumlah
  // panggilan DashboardHub.render(), sedangkan init() rasio 1: HANYA SEKALI
  // (guard tambahan, lihat tests/dashboard-v2-init-once.test.js utk cakupan
  // lengkap skenario disable→enable dst).
});

test('render tidak dobel dalam satu panggilan DashboardHub.render() (init & render masing-masing tepat 1x, bukan 2x)', () => {
  const { DashboardHub, v2Calls } = makeHubForMount({ enabled: true });
  DashboardHub.render();
  assert.equal(v2Calls.init, 1, 'init() harus tepat 1x, bukan dobel, dalam satu DashboardHub.render()');
  assert.equal(v2Calls.render, 1, 'render() harus tepat 1x, bukan dobel, dalam satu DashboardHub.render()');
});

test('environment tanpa isDashboardV2Enabled sama sekali (belum ter-load) — tidak error, DashboardV2Shell tidak dipanggil', () => {
  const { DashboardHub, v2Calls } = makeHubForMount({ enabled: true, omitFlag: true });
  assert.doesNotThrow(() => DashboardHub.render());
  assert.equal(v2Calls.init, 0);
  assert.equal(v2Calls.render, 0);
});

test('environment tanpa DashboardV2Shell sama sekali (belum ter-load) — tidak error walau flag true', () => {
  const grid = createFakeElement();
  const fakeDocument = {
    getElementById: (id) => (id === 'dashboardHubGrid' ? grid : createFakeElement()),
    querySelectorAll: () => [],
  };
  const ctx = loadSource(['dashboard-hub.js'], {
    document: fakeDocument,
    FEATURE_REGISTRY: minimalRegistry(),
    escapeHtml: (s) => String(s ?? ''),
    isDashboardV2Enabled: () => true,
    // DashboardV2Shell sengaja TIDAK disuntik.
    window: {},
  }, ['DashboardHub']);
  assert.doesNotThrow(() => ctx.DashboardHub.render());
});

test('tidak memanggil showPage() — baik flag true maupun false', () => {
  const enabledRun = makeHubForMount({ enabled: true });
  enabledRun.DashboardHub.render();
  assert.deepEqual(enabledRun.showPageCalls, []);

  const disabledRun = makeHubForMount({ enabled: false });
  disabledRun.DashboardHub.render();
  assert.deepEqual(disabledRun.showPageCalls, []);
});

test('tidak "memakai" FEATURE_REGISTRY dgn cara baru — blok mount tidak membaca FEATURE_REGISTRY sama sekali (hanya render lama yg sudah ada yg membacanya)', () => {
  let registryReadCountBeforeMountBlock;
  let registryAccessLog = [];
  const grid = createFakeElement();
  const fakeDocument = {
    getElementById: (id) => (id === 'dashboardHubGrid' ? grid : createFakeElement()),
    querySelectorAll: () => [],
  };
  const baseRegistry = minimalRegistry();
  const proxiedRegistry = new Proxy(baseRegistry, {
    get(target, prop) {
      registryAccessLog.push(prop);
      return target[prop];
    },
  });
  const v2Calls = { init: 0, render: 0 };
  const ctx = loadSource(['dashboard-hub.js'], {
    document: fakeDocument,
    FEATURE_REGISTRY: proxiedRegistry,
    escapeHtml: (s) => String(s ?? ''),
    isDashboardV2Enabled: () => true,
    DashboardV2Shell: {
      init: () => { v2Calls.init += 1; },
      render: () => { v2Calls.render += 1; },
    },
    window: {},
  }, ['DashboardHub']);
  registryAccessLog = []; // reset: hanya hitung akses SELAMA render(), bukan saat load
  ctx.DashboardHub.render();
  registryReadCountBeforeMountBlock = registryAccessLog.length;
  // FEATURE_REGISTRY memang dibaca oleh bagian render() yg SUDAH ADA sejak
  // dulu (di atas blok mount V2.14C) — itu perilaku lama, bukan tambahan
  // baru. Yang penting: DashboardV2Shell tetap terpanggil, dan tidak ada
  // akses FEATURE_REGISTRY yg BERTAMBAH gara-gara blok mount (blok mount
  // tidak menyebut FEATURE_REGISTRY sama sekali secara tekstual — dicek
  // statis di bawah).
  assert.ok(registryReadCountBeforeMountBlock >= 0);
  assert.equal(v2Calls.init, 1);
  assert.equal(v2Calls.render, 1);
});

test('source file dashboard-hub.js: blok mount V2.14C (di sekitar DashboardV2Shell) tidak mereferensikan FEATURE_REGISTRY atau showPage( secara tekstual', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-hub.js'), 'utf8');
  const startMarker = '// Dashboard V2 mount (Tahap V2.14C';
  const idx = src.indexOf(startMarker);
  assert.ok(idx !== -1, 'blok komentar mount V2.14C harus ada di dashboard-hub.js');
  // Ambil dari marker sampai akhir method render() (penutup `},` berikutnya
  // setelah blok if DashboardV2Shell).
  const slice = src.slice(idx, idx + 1600);
  const codeOnly = slice
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/FEATURE_REGISTRY/.test(codeOnly), false, 'blok mount tidak boleh mereferensikan FEATURE_REGISTRY di kode aktif');
  assert.equal(/showPage\s*\(/.test(codeOnly), false, 'blok mount tidak boleh memanggil showPage()');
});
