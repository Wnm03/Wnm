'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// dashboard-v2-activation.js — Tahap V2.14A (Dashboard V2 Activation
// Framework, lihat DASHBOARD-V2-ACTIVATION.md).
//
// Murni logic flag boolean in-memory (tidak ada DOM), jadi cukup
// loadSource biasa — isDashboardV2Enabled/enableDashboardV2/
// disableDashboardV2 dideklarasikan lewat `function` di top-level file
// source, jadi otomatis nempel ke context vm tanpa perlu `expose` (lihat
// catatan di tests/helpers/loadSource.js).
//
// Setiap test load ulang source dari nol (loadSource dipanggil per-test,
// bukan sekali di scope module) supaya state flag `_dashboardV2Enabled`
// selalu mulai dari default (false) & test tidak saling bocor state satu
// sama lain — pola sama dgn tests/ai-command-center.test.js.

function freshActivation() {
  return loadSource(['dashboard-v2-activation.js']);
}

test('isDashboardV2Enabled() default false (belum pernah diaktifkan)', () => {
  const ctx = freshActivation();
  assert.equal(ctx.isDashboardV2Enabled(), false);
});

test('enableDashboardV2() mengubah flag jadi true, isDashboardV2Enabled() mengikuti', () => {
  const ctx = freshActivation();
  ctx.enableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), true);
});

test('disableDashboardV2() mengubah flag balik jadi false', () => {
  const ctx = freshActivation();
  ctx.enableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), true);
  ctx.disableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), false);
});

test('enableDashboardV2() idempotent — dipanggil berkali-kali tetap true, tidak error', () => {
  const ctx = freshActivation();
  ctx.enableDashboardV2();
  ctx.enableDashboardV2();
  ctx.enableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), true);
});

test('disableDashboardV2() idempotent — dipanggil berkali-kali (termasuk saat sudah default false) tetap false, tidak error', () => {
  const ctx = freshActivation();
  // Sudah default false — panggil disable tanpa enable dulu, tidak boleh error.
  ctx.disableDashboardV2();
  ctx.disableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), false);

  ctx.enableDashboardV2();
  ctx.disableDashboardV2();
  ctx.disableDashboardV2();
  ctx.disableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), false);
});

test('enable() lalu disable() lalu enable() lagi — transisi berulang tetap konsisten', () => {
  const ctx = freshActivation();
  ctx.enableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), true);
  ctx.disableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), false);
  ctx.enableDashboardV2();
  assert.equal(ctx.isDashboardV2Enabled(), true);
});

test('state flag terisolasi per-instance load (load baru selalu mulai default false, tidak bocor dari instance sebelumnya)', () => {
  const ctxA = freshActivation();
  ctxA.enableDashboardV2();
  assert.equal(ctxA.isDashboardV2Enabled(), true);

  const ctxB = freshActivation();
  assert.equal(ctxB.isDashboardV2Enabled(), false, 'instance baru tidak boleh mewarisi state instance lain');
});

test('tidak memengaruhi Dashboard lama: tidak membuat/menyentuh elemen #page-dashboard-hub atau DOM apa pun (document tidak dipakai sama sekali)', () => {
  let documentTouched = false;
  const ctx = loadSource(['dashboard-v2-activation.js'], {
    document: new Proxy({}, {
      get() { documentTouched = true; return () => {}; },
    }),
  });
  ctx.enableDashboardV2();
  ctx.disableDashboardV2();
  ctx.isDashboardV2Enabled();
  assert.equal(documentTouched, false, 'dashboard-v2-activation.js tidak boleh menyentuh document/DOM sama sekali');
});

test('tidak memanggil showPage() — fungsi global showPage tidak pernah dipanggil oleh modul ini', () => {
  let showPageCalled = false;
  const ctx = loadSource(['dashboard-v2-activation.js'], {
    showPage: () => { showPageCalled = true; },
  });
  ctx.enableDashboardV2();
  ctx.disableDashboardV2();
  ctx.isDashboardV2Enabled();
  assert.equal(showPageCalled, false, 'dashboard-v2-activation.js tidak boleh memanggil showPage()');
});

test('tidak memakai FEATURE_REGISTRY — global FEATURE_REGISTRY tidak pernah diakses oleh modul ini', () => {
  let registryAccessed = false;
  const ctx = loadSource(['dashboard-v2-activation.js'], {
    FEATURE_REGISTRY: new Proxy({}, {
      get() { registryAccessed = true; return () => {}; },
    }),
  });
  ctx.enableDashboardV2();
  ctx.disableDashboardV2();
  ctx.isDashboardV2Enabled();
  assert.equal(registryAccessed, false, 'dashboard-v2-activation.js tidak boleh mengakses FEATURE_REGISTRY');
});

test('source file tidak mengandung referensi tekstual ke showPage(/FEATURE_REGISTRY/DashboardV2Shell (jaminan statis tambahan)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-activation.js'), 'utf8');
  // Comment header boleh MENYEBUT nama-nama ini sbg penjelasan constraint,
  // tapi tidak boleh ada baris kode aktif yg memanggil/membaca-nya. Cek
  // ketat: hilangkan seluruh baris komentar dulu, baru pastikan sisa kode
  // bersih dari token-token tsb.
  const codeOnly = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/showPage\s*\(/.test(codeOnly), false);
  assert.equal(/FEATURE_REGISTRY/.test(codeOnly), false);
  assert.equal(/DashboardV2Shell/.test(codeOnly), false);
});
