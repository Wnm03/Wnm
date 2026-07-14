'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeElement } = require('./helpers/fakeDom');

// Tahap tambahan (additive) — Guard init-once utk mount Dashboard V2 di
// DashboardHub.render() (lihat DASHBOARD-V2-INIT-ONCE.md), DIPERBARUI utk
// mencakup kontrak auto-destroy Tahap V2.14D (lihat DASHBOARD-V2-AUTO-
// DESTROY.md).
//
// LATAR: sejak V2.14C, DashboardHub.render() memanggil DashboardV2Shell.
// init() + DashboardV2Shell.render() tiap kali flag isDashboardV2Enabled()
// true (tests/dashboard-v2-mount.test.js). init() sendiri sudah idempotent
// by contract di level DashboardV2Shell (V2.1/V2.14B), tapi tetap dipanggil
// ULANG tiap DashboardHub.render() — kerja sia-sia. Guard init-once
// (tahap sebelumnya) menambah flag internal supaya init() cuma dipanggil
// SEKALI selama flag tetap true, sedangkan render() tetap dipanggil tiap
// kali seperti biasa.
//
// KONTRAK BARU (V2.14D, auto-destroy): "sekali" di atas BUKAN "sekali
// selama umur aplikasi", melainkan "sekali PER SIKLUS AKTIVASI". Begitu
// flag balik ke false SETELAH sempat ter-init, DashboardV2Shell.destroy()
// dipanggil tepat sekali dan flag internal `_dashHubV2Initialized` di-reset
// ke false — supaya siklus enable BERIKUTNYA memanggil init() lagi dari
// awal (bukan dianggap "sudah pernah init selamanya"). render() tetap
// selalu mengikuti 1:1 jumlah panggilan DashboardHub.render() SELAMA flag
// true, tidak berubah.
//
// Harness (fakeDocument minimal + FEATURE_REGISTRY kecil + spy call count)
// SENGAJA diadaptasi persis dari tests/dashboard-v2-mount.test.js supaya
// konsisten & tidak mengulang FEATURE_REGISTRY asli (taksonomi bisa berubah
// tanpa bikin test ini ikut berubah). Mock DashboardV2Shell kini juga
// menyediakan `destroy()` (sebelumnya hanya init/render) supaya blok
// auto-destroy V2.14D tidak throw saat dipanggil dari test-test di sini.

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

// makeHubForInitOnce(opts) — sama seperti makeHubForMount() di
// dashboard-v2-mount.test.js, ditambah spy showPage() & flag akses
// FEATURE_REGISTRY supaya bisa dicek di test constraint (poin 5 & 6).
function makeHubForInitOnce(opts = {}) {
  const grid = createFakeElement();
  const fakeDocument = {
    getElementById: (id) => (id === 'dashboardHubGrid' ? grid : createFakeElement()),
    querySelectorAll: () => [],
  };

  const v2Calls = { init: 0, render: 0, destroy: 0 };
  const DashboardV2Shell = {
    init: (...args) => { v2Calls.init += 1; return { args }; },
    render: (...args) => { v2Calls.render += 1; return { args }; },
    destroy: (...args) => { v2Calls.destroy += 1; return { args }; },
  };

  let enabled = opts.enabled === true;
  const isDashboardV2Enabled = () => enabled;

  const showPageCalls = [];

  const extraGlobals = {
    document: fakeDocument,
    FEATURE_REGISTRY: opts.registry || minimalRegistry(),
    escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
    showPage: (...args) => showPageCalls.push(args),
    isDashboardV2Enabled,
    DashboardV2Shell,
    window: {},
  };

  const ctx = loadSource(['dashboard-hub.js'], extraGlobals, ['DashboardHub']);
  return {
    DashboardHub: ctx.DashboardHub,
    v2Calls,
    showPageCalls,
    grid,
    setEnabled: (v) => { enabled = v === true; },
  };
}

test('init() hanya dipanggil SEKALI walau DashboardHub.render() dipanggil berkali-kali (flag tetap true)', () => {
  const { DashboardHub, v2Calls } = makeHubForInitOnce({ enabled: true });
  DashboardHub.render();
  DashboardHub.render();
  DashboardHub.render();
  assert.equal(v2Calls.init, 1, 'init() harus tepat 1x total, tidak dipanggil ulang di render() ke-2/ke-3');
});

test('render() TETAP dipanggil setiap kali DashboardHub.render() dipanggil (tidak ikut di-guard)', () => {
  const { DashboardHub, v2Calls } = makeHubForInitOnce({ enabled: true });
  DashboardHub.render();
  DashboardHub.render();
  DashboardHub.render();
  assert.equal(v2Calls.render, 3, 'render() harus mengikuti jumlah panggilan DashboardHub.render() 1:1');
});

test('disable→enable kembali: destroy() dipanggil sekali saat disable, lalu init() BOLEH dipanggil lagi saat enable (kontrak V2.14D — "sekali per siklus aktivasi", bukan "sekali selamanya")', () => {
  const { DashboardHub, v2Calls, setEnabled } = makeHubForInitOnce({ enabled: true });
  DashboardHub.render(); // init #1 + render #1
  assert.equal(v2Calls.init, 1);
  assert.equal(v2Calls.destroy, 0);

  setEnabled(false);
  DashboardHub.render(); // flag false + sudah pernah init -> destroy() sekali
  assert.equal(v2Calls.init, 1, 'init() tidak boleh nambah saat flag sedang false');
  assert.equal(v2Calls.render, 1, 'render() tidak boleh nambah saat flag sedang false');
  assert.equal(v2Calls.destroy, 1, 'destroy() harus dipanggil tepat 1x saat flag balik false setelah pernah init');

  setEnabled(true);
  DashboardHub.render(); // flag true lagi -> siklus aktivasi baru: init() lagi, render() jalan
  assert.equal(v2Calls.init, 2, 'init() BOLEH dipanggil lagi setelah disable->enable ulang (siklus aktivasi baru)');
  assert.equal(v2Calls.render, 2, 'render() tetap jalan lagi setelah flag enable ulang');
  assert.equal(v2Calls.destroy, 1, 'destroy() tidak boleh nambah lagi selama flag masih true');
});

test('beberapa siklus disable/enable berturut-turut: init() & destroy() mengikuti jumlah SIKLUS AKTIVASI (bukan cuma 1x selama umur aplikasi)', () => {
  const { DashboardHub, v2Calls, setEnabled } = makeHubForInitOnce({ enabled: true });
  DashboardHub.render(); // true  -> init #1, render #1
  setEnabled(false);
  DashboardHub.render(); // false -> destroy #1 (pernah init)
  setEnabled(true);
  DashboardHub.render(); // true  -> init #2, render #2
  setEnabled(false);
  DashboardHub.render(); // false -> destroy #2 (pernah init)
  setEnabled(true);
  DashboardHub.render(); // true  -> init #3, render #3
  assert.equal(v2Calls.init, 3, 'init() bertambah setiap kali sebuah siklus aktivasi (flag true) BARU dimulai — 3 siklus true di sini');
  assert.equal(v2Calls.render, 3, 'render() hanya bertambah pada panggilan saat flag true (3 dari 5 panggilan)');
  assert.equal(v2Calls.destroy, 2, 'destroy() bertambah setiap kali flag balik false setelah pernah init — 2 transisi true->false di sini');
});

test('Dashboard lama (flag false dari awal) tetap normal — grid ter-render, DashboardV2Shell tidak disentuh sama sekali (init/render/destroy semua 0, krn belum pernah init)', () => {
  const { DashboardHub, v2Calls, grid } = makeHubForInitOnce({ enabled: false });
  DashboardHub.render();
  DashboardHub.render();
  assert.equal(v2Calls.init, 0, 'init() tidak boleh dipanggil sama sekali saat flag false');
  assert.equal(v2Calls.render, 0, 'render() (DashboardV2Shell) tidak boleh dipanggil sama sekali saat flag false');
  assert.equal(v2Calls.destroy, 0, 'destroy() tidak boleh dipanggil kalau belum pernah init (_dashHubV2Initialized tetap false)');
  assert.match(grid.innerHTML, /Transaksi/, 'Dashboard lama tetap merender grid seperti biasa saat flag false');
});

test('environment tanpa DashboardV2Shell sama sekali (belum ter-load) — guard tidak error walau flag true, tidak ada apa pun dipanggil', () => {
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
  assert.doesNotThrow(() => ctx.DashboardHub.render());
});

test('tidak memanggil showPage() sama sekali, baik flag true (lintas beberapa render()) maupun false', () => {
  const enabledRun = makeHubForInitOnce({ enabled: true });
  enabledRun.DashboardHub.render();
  enabledRun.DashboardHub.render();
  assert.deepEqual(enabledRun.showPageCalls, [], 'showPage() tidak boleh terpanggil saat flag true (guard init-once maupun render biasa)');

  const disabledRun = makeHubForInitOnce({ enabled: false });
  disabledRun.DashboardHub.render();
  assert.deepEqual(disabledRun.showPageCalls, [], 'showPage() tidak boleh terpanggil saat flag false');
});

test('blok guard init-once tidak mereferensikan FEATURE_REGISTRY secara tekstual (jaminan statis)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-hub.js'), 'utf8');
  const startMarker = '// Guard init-once (tahap tambahan';
  const idx = src.indexOf(startMarker);
  assert.ok(idx !== -1, 'blok komentar guard init-once harus ada di dashboard-hub.js');
  const slice = src.slice(idx, idx + 1400);
  const codeOnly = slice
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/FEATURE_REGISTRY/.test(codeOnly), false, 'blok guard tidak boleh mereferensikan FEATURE_REGISTRY di kode aktif');
  assert.equal(/showPage\s*\(/.test(codeOnly), false, 'blok guard tidak boleh memanggil showPage()');
});

