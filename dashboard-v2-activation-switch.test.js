'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeElement } = require('./helpers/fakeDom');

// Tahap V2.15 — Dashboard V2 Activation Switch (lihat
// DASHBOARD-V2-ACTIVATION-SWITCH.md). Menguji dua hal baru di
// dashboard-hub.js:
//   1. _dashHubV2SwitchHtml() (via DashboardHub.render()) — blok UI
//      toggle di atas #dashboardHubGrid, HANYA muncul kalau
//      isDashboardV2Enabled/enableDashboardV2/disableDashboardV2 semuanya
//      tersedia sbg function, dan checkbox-nya mengikuti state
//      isDashboardV2Enabled() saat ini.
//   2. DashboardHub.toggleDashboardV2() — flip flag lewat
//      enableDashboardV2()/disableDashboardV2() (fungsi existing V2.14A,
//      TIDAK di-mock ulang implementasinya di sini selain sbg spy),
//      lalu panggil DashboardHub.render() persis 1x.
//
// Pola harness (document tiruan minimal + FEATURE_REGISTRY tiruan kecil +
// spy call count) diadaptasi PERSIS dari tests/dashboard-v2-mount.test.js
// & tests/dashboard-v2-init-once.test.js — fresh sandbox vm per test lewat
// loadSource(), tidak ada state yang dibagi antar test, dan tidak ada file
// test lama yang diubah.

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

// makeHubForSwitch(opts) — load dashboard-hub.js dgn document tiruan
// minimal (hanya #dashboardHubGrid), plus mock isDashboardV2Enabled/
// enableDashboardV2/disableDashboardV2 yang STATEFUL (enable/disable
// betul-betul mengubah state internal `enabled`, sama seperti kontrak asli
// dashboard-v2-activation.js) supaya toggleDashboardV2() bisa dites
// end-to-end tanpa menjalankan file itu sungguhan. DashboardV2Shell juga
// di-mock (no-op) supaya blok mount/init-once/auto-destroy existing tidak
// throw saat render() ikut terpicu dari toggleDashboardV2().
function makeHubForSwitch(opts = {}) {
  const grid = createFakeElement();
  const fakeDocument = {
    getElementById: (id) => (id === 'dashboardHubGrid' ? grid : createFakeElement()),
    querySelectorAll: () => [],
  };

  let enabled = opts.enabled === true;
  const calls = { enable: 0, disable: 0, render: 0 };

  const isDashboardV2Enabled = () => enabled;
  const enableDashboardV2 = () => { calls.enable += 1; enabled = true; return enabled; };
  const disableDashboardV2 = () => { calls.disable += 1; enabled = false; return enabled; };

  const showPageCalls = [];

  const extraGlobals = {
    document: fakeDocument,
    FEATURE_REGISTRY: opts.registry || minimalRegistry(),
    escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
    showPage: (...args) => showPageCalls.push(args),
    window: {},
  };

  // Hanya suntik ketiga fungsi flag kalau tidak dinonaktifkan eksplisit
  // lewat opts.omitFlag — dipakai utk skenario "API aktivasi belum
  // ter-load sama sekali".
  if (!opts.omitFlag) {
    extraGlobals.isDashboardV2Enabled = isDashboardV2Enabled;
    extraGlobals.enableDashboardV2 = enableDashboardV2;
    extraGlobals.disableDashboardV2 = disableDashboardV2;
  }
  // Hanya suntik DashboardV2Shell kalau tidak dinonaktifkan eksplisit —
  // dipakai utk skenario "DashboardV2Shell belum ter-load".
  if (!opts.omitShell) {
    extraGlobals.DashboardV2Shell = {
      init: () => {},
      render: () => {},
      destroy: () => {},
    };
  }

  const ctx = loadSource(['dashboard-hub.js'], extraGlobals, ['DashboardHub']);

  // Spy render() TANPA mengubah perilakunya — panggil implementasi asli
  // lewat referensi original, cuma menambah counter. Ini aman krn
  // ctx.DashboardHub adalah objek yang SAMA yang dipakai kode internal
  // dashboard-hub.js (loadSource expose `this.DashboardHub = DashboardHub`
  // menempel referensi objek, bukan salinan) — jadi mem-patch property
  // .render di sini juga "terlihat" dari panggilan internal
  // `DashboardHub.render()` di dalam toggleDashboardV2().
  const originalRender = ctx.DashboardHub.render.bind(ctx.DashboardHub);
  ctx.DashboardHub.render = (...args) => {
    calls.render += 1;
    return originalRender(...args);
  };

  return {
    DashboardHub: ctx.DashboardHub,
    calls,
    showPageCalls,
    grid,
    getEnabled: () => enabled,
  };
}

// 1. Switch tidak dirender jika isDashboardV2Enabled (dkk) tidak tersedia.
test('switch TIDAK dirender kalau API aktivasi (isDashboardV2Enabled/enableDashboardV2/disableDashboardV2) tidak tersedia', () => {
  const { DashboardHub, grid } = makeHubForSwitch({ enabled: true, omitFlag: true });
  DashboardHub.render();
  assert.doesNotMatch(grid.innerHTML, /dashHubV2SwitchRow/, 'blok switch tidak boleh muncul sama sekali kalau API flag belum ter-load');
  assert.match(grid.innerHTML, /Transaksi/, 'Dashboard lama tetap merender grid seperti biasa');
});

// 2. Switch dirender jika API aktivasi tersedia.
test('switch DIRENDER kalau API aktivasi tersedia (baik flag true maupun false)', () => {
  const enabledRun = makeHubForSwitch({ enabled: true });
  enabledRun.DashboardHub.render();
  assert.match(enabledRun.grid.innerHTML, /dashHubV2SwitchRow/, 'blok switch harus muncul saat flag true');

  const disabledRun = makeHubForSwitch({ enabled: false });
  disabledRun.DashboardHub.render();
  assert.match(disabledRun.grid.innerHTML, /dashHubV2SwitchRow/, 'blok switch harus tetap muncul saat flag false (switch-nya sendiri tidak bergantung nilai flag, hanya keberadaan API)');
});

// 3. Checkbox mengikuti nilai isDashboardV2Enabled().
test('checkbox switch mengikuti nilai isDashboardV2Enabled() saat ini', () => {
  const onRun = makeHubForSwitch({ enabled: true });
  onRun.DashboardHub.render();
  assert.match(onRun.grid.innerHTML, /id="dashHubV2SwitchInput"\s+checked/, 'checkbox harus berstatus checked saat flag true');

  const offRun = makeHubForSwitch({ enabled: false });
  offRun.DashboardHub.render();
  assert.doesNotMatch(offRun.grid.innerHTML, /id="dashHubV2SwitchInput"\s+checked/, 'checkbox tidak boleh checked saat flag false');
});

// 4. Label "Dashboard V2" muncul.
test('label teks "Dashboard V2" muncul di blok switch', () => {
  const { DashboardHub, grid } = makeHubForSwitch({ enabled: false });
  DashboardHub.render();
  assert.match(grid.innerHTML, /Dashboard V2/, 'teks label "Dashboard V2" harus ada di markup switch');
});

// 5. toggleDashboardV2() memanggil enableDashboardV2() saat sebelumnya disabled.
test('toggleDashboardV2() memanggil enableDashboardV2() saat flag sebelumnya false, TIDAK memanggil disableDashboardV2()', () => {
  const { DashboardHub, calls, getEnabled } = makeHubForSwitch({ enabled: false });
  DashboardHub.toggleDashboardV2();
  assert.equal(calls.enable, 1, 'enableDashboardV2() harus terpanggil tepat 1x');
  assert.equal(calls.disable, 0, 'disableDashboardV2() tidak boleh terpanggil');
  assert.equal(getEnabled(), true, 'flag harus jadi true setelah toggle dari false');
});

// 6. toggleDashboardV2() memanggil disableDashboardV2() saat sebelumnya enabled.
test('toggleDashboardV2() memanggil disableDashboardV2() saat flag sebelumnya true, TIDAK memanggil enableDashboardV2()', () => {
  const { DashboardHub, calls, getEnabled } = makeHubForSwitch({ enabled: true });
  DashboardHub.toggleDashboardV2();
  assert.equal(calls.disable, 1, 'disableDashboardV2() harus terpanggil tepat 1x');
  assert.equal(calls.enable, 0, 'enableDashboardV2() tidak boleh terpanggil');
  assert.equal(getEnabled(), false, 'flag harus jadi false setelah toggle dari true');
});

// 7. toggleDashboardV2() memanggil DashboardHub.render() tepat 1x.
test('toggleDashboardV2() memanggil DashboardHub.render() tepat 1x, tidak dobel/tidak nol', () => {
  const { DashboardHub, calls } = makeHubForSwitch({ enabled: false });
  calls.render = 0; // reset: hanya hitung render() akibat toggle, bukan setup
  DashboardHub.toggleDashboardV2();
  assert.equal(calls.render, 1, 'render() harus terpanggil tepat 1x dari dalam toggleDashboardV2()');
});

// 8. Tidak memanggil showPage().
test('toggleDashboardV2() tidak memanggil showPage() sama sekali', () => {
  const enabledRun = makeHubForSwitch({ enabled: true });
  enabledRun.DashboardHub.toggleDashboardV2();
  assert.deepEqual(enabledRun.showPageCalls, [], 'showPage() tidak boleh terpanggil saat toggle dari true');

  const disabledRun = makeHubForSwitch({ enabled: false });
  disabledRun.DashboardHub.toggleDashboardV2();
  assert.deepEqual(disabledRun.showPageCalls, [], 'showPage() tidak boleh terpanggil saat toggle dari false');
});

// 9. Tidak menyentuh FEATURE_REGISTRY (jaminan statis, blok switch & toggle).
test('blok switch (_dashHubV2SwitchHtml) dan toggleDashboardV2() tidak mereferensikan FEATURE_REGISTRY atau showPage( secara tekstual', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-hub.js'), 'utf8');

  const switchStart = src.indexOf('// Activation Switch (Tahap V2.15');
  assert.ok(switchStart !== -1, 'blok komentar Activation Switch harus ada di dashboard-hub.js');
  const switchEnd = src.indexOf('const DashboardHub = {', switchStart);
  assert.ok(switchEnd !== -1, 'blok switch harus diikuti deklarasi const DashboardHub');
  const switchSlice = src.slice(switchStart, switchEnd)
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/FEATURE_REGISTRY/.test(switchSlice), false, 'blok switch tidak boleh mereferensikan FEATURE_REGISTRY di kode aktif');
  assert.equal(/showPage\s*\(/.test(switchSlice), false, 'blok switch tidak boleh memanggil showPage()');

  const toggleStart = src.indexOf('\n  toggleDashboardV2() {');
  assert.ok(toggleStart !== -1, 'method toggleDashboardV2() harus ada di dashboard-hub.js');
  const toggleEnd = src.indexOf('\n  },', toggleStart);
  const toggleSlice = src.slice(toggleStart, toggleEnd)
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/FEATURE_REGISTRY/.test(toggleSlice), false, 'method toggleDashboardV2() tidak boleh mereferensikan FEATURE_REGISTRY di kode aktif');
  assert.equal(/showPage\s*\(/.test(toggleSlice), false, 'method toggleDashboardV2() tidak boleh memanggil showPage()');
});

// 10. Aman bila DashboardV2Shell tidak ada.
test('aman (tidak throw) saat DashboardV2Shell belum ter-load — baik render() maupun toggleDashboardV2()', () => {
  const { DashboardHub, grid } = makeHubForSwitch({ enabled: true, omitShell: true });
  assert.doesNotThrow(() => DashboardHub.render());
  assert.match(grid.innerHTML, /dashHubV2SwitchRow/, 'switch tetap muncul walau DashboardV2Shell belum ter-load (switch tidak bergantung DashboardV2Shell)');
  assert.doesNotThrow(() => DashboardHub.toggleDashboardV2());
});

// 11. Idempotent bila dipanggil berulang.
test('toggleDashboardV2() idempotent secara perilaku: dipanggil berulang menghasilkan flip konsisten & tidak error, balik ke state semula setelah jumlah panggilan genap', () => {
  const { DashboardHub, calls, getEnabled } = makeHubForSwitch({ enabled: false });
  assert.doesNotThrow(() => {
    DashboardHub.toggleDashboardV2(); // false -> true
    DashboardHub.toggleDashboardV2(); // true -> false
    DashboardHub.toggleDashboardV2(); // false -> true
    DashboardHub.toggleDashboardV2(); // true -> false
  });
  assert.equal(getEnabled(), false, 'setelah 4x toggle (genap) dari false, flag harus kembali ke false');
  assert.equal(calls.enable, 2, 'enableDashboardV2() harus terpanggil tepat 2x dari 4 toggle berselang-seling mulai dari false');
  assert.equal(calls.disable, 2, 'disableDashboardV2() harus terpanggil tepat 2x dari 4 toggle berselang-seling mulai dari false');
  assert.equal(calls.render, 4, 'render() harus terpanggil tepat 1x per toggle, total 4x');
});
