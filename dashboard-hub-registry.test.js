'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadSource } = require('./helpers/loadSource');

const ROOT = path.join(__dirname, '..');
const INDEX_HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const APP_PRODUCTION_HTML = fs.readFileSync(path.join(ROOT, 'app_production.html'), 'utf8');

// Tab yang TERVERIFIKASI ada per page (lihat komentar "TAB REFERENSI" di
// dashboard-hub-registry.js) — dipakai buat cross-check target.tab.
const KNOWN_TABS = {
  keuangan: ['kelola', 'laporan'],
  shop: ['kasir', 'jual', 'etalase', 'produsen', 'riwayat', 'pelanggan'],
  carnotes: ['bbm', 'servis'],
  pajak: ['zakat', 'pajak'],
};
const KNOWN_PAGES = ['dashboard', 'dashboard-hub', 'keuangan', 'shop', 'carnotes', 'pajak', 'ai', 'settings'];

function ctx() {
  return loadSource(['dashboard-hub-registry.js'], {}, ['FEATURE_REGISTRY']);
}

function idExistsInHtml(id) {
  const needle = `id="${id}"`;
  return INDEX_HTML.includes(needle) && APP_PRODUCTION_HTML.includes(needle);
}

// Ambil substring blok "<div class="page"... id="X">...</div>" yang balanced
// (brace-counting per-tag <div>), dipakai buat memastikan target.goTo BENAR-
// BENAR ada di DALAM page yang ditunjuk target.page — bukan cuma ada di
// suatu tempat di HTML (id="page-<page>" nyata ada tidak cukup, karena id
// goTo bisa saja nyasar tersisa/pindah ke page LAIN — lihat insiden registry
// Tahap 3b: target.page masih 'dashboard' padahal elemen goTo-nya sudah
// dipindah ke 'dashboard-hub').
function extractPageBlock(html, pageId) {
  const re = new RegExp(`<div class="page[^"]*" id="${pageId}">`);
  const m = html.match(re);
  if (!m) return null;
  const start = m.index;
  let i = start + m[0].length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    if (html.startsWith('<div', i)) { depth++; i += 4; continue; }
    if (html.startsWith('</div>', i)) { depth--; i += 6; continue; }
    i++;
  }
  return html.slice(start, i);
}

function allSourceJsText() {
  // Gabungan seluruh file .js di root project (bukan node_modules/tests/
  // archive/backups) — dipakai buat verifikasi target.action beneran ada.
  return fs.readdirSync(ROOT)
    .filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'))
    .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))
    .join('\n');
}

test('FEATURE_REGISTRY — struktur dasar', () => {
  const { FEATURE_REGISTRY } = ctx();
  assert.ok(Array.isArray(FEATURE_REGISTRY));
  assert.ok(FEATURE_REGISTRY.length >= 10, 'blueprint §1 menyebut 10 kategori');

  const catKeys = new Set();
  const featKeys = new Set();
  for (const cat of FEATURE_REGISTRY) {
    assert.equal(typeof cat.key, 'string');
    assert.ok(cat.key.length > 0);
    assert.ok(!catKeys.has(cat.key), `key kategori duplikat: ${cat.key}`);
    catKeys.add(cat.key);

    assert.equal(typeof cat.label, 'string');
    assert.ok(cat.label.length > 0);
    assert.equal(typeof cat.icon, 'string');
    assert.ok(cat.icon.length > 0);
    assert.equal(typeof cat.desc, 'string');
    assert.ok(cat.desc.length > 0 && cat.desc.length <= 60);
    assert.ok(Array.isArray(cat.features));
    assert.ok(cat.features.length > 0, `kategori ${cat.key} tidak boleh kosong (aturan blueprint §1: bukan kategori aspiratif)`);

    for (const f of cat.features) {
      assert.equal(typeof f.key, 'string');
      assert.ok(f.key.length > 0);
      assert.ok(!featKeys.has(f.key), `key fitur duplikat: ${f.key}`);
      featKeys.add(f.key);

      assert.equal(typeof f.label, 'string');
      assert.ok(f.label.length > 0);
      assert.equal(typeof f.desc, 'string');
      assert.ok(f.desc.length > 0);
      assert.equal(typeof f.target, 'object');
      assert.ok(f.target !== null);
    }
  }
});

test('FEATURE_REGISTRY — target.page valid (cocok id="page-<page>" nyata)', () => {
  const { FEATURE_REGISTRY } = ctx();
  for (const cat of FEATURE_REGISTRY) {
    for (const f of cat.features) {
      if (!f.target.page) continue; // fitur modal-only (mis. WorthIt) sengaja tanpa page
      assert.ok(
        KNOWN_PAGES.includes(f.target.page),
        `${f.key}: target.page "${f.target.page}" bukan salah satu page yang nyata ada`
      );
      assert.ok(
        idExistsInHtml(`page-${f.target.page}`),
        `${f.key}: id="page-${f.target.page}" tidak ditemukan di index.html/app_production.html`
      );
    }
  }
});

test('FEATURE_REGISTRY — target.tab valid sesuai TAB REFERENSI per page', () => {
  const { FEATURE_REGISTRY } = ctx();
  for (const cat of FEATURE_REGISTRY) {
    for (const f of cat.features) {
      if (!f.target.tab) continue;
      const allowed = KNOWN_TABS[f.target.page];
      assert.ok(allowed, `${f.key}: page "${f.target.page}" tidak punya tab yang dikenal`);
      assert.ok(
        allowed.includes(f.target.tab),
        `${f.key}: tab "${f.target.tab}" bukan tab valid utk page "${f.target.page}" (valid: ${allowed.join(',')})`
      );
    }
  }
});

test('FEATURE_REGISTRY — target.goTo mengarah ke id yang nyata ada di DOM', () => {
  const { FEATURE_REGISTRY } = ctx();
  const missing = [];
  for (const cat of FEATURE_REGISTRY) {
    for (const f of cat.features) {
      if (!f.target.goTo) continue;
      if (!idExistsInHtml(f.target.goTo)) missing.push(`${f.key} -> #${f.target.goTo}`);
    }
  }
  assert.deepEqual(missing, [], `target.goTo mengarah ke id yang tidak ada: ${missing.join(', ')}`);
});

test('FEATURE_REGISTRY — target.goTo BENAR-BENAR berada di dalam page yang ditunjuk target.page (bukan cuma sama-sama ada di HTML)', () => {
  const { FEATURE_REGISTRY } = ctx();
  const HTML_SOURCES = { 'index.html': INDEX_HTML, 'app_production.html': APP_PRODUCTION_HTML };
  const problems = [];
  for (const [file, html] of Object.entries(HTML_SOURCES)) {
    for (const cat of FEATURE_REGISTRY) {
      for (const f of cat.features) {
        if (!f.target.goTo || !f.target.page) continue;
        const pageId = `page-${f.target.page}`;
        const block = extractPageBlock(html, pageId);
        if (!block) {
          problems.push(`${file}: ${f.key} - blok #${pageId} tidak ditemukan`);
          continue;
        }
        if (!new RegExp(`id="${f.target.goTo}"`).test(block)) {
          problems.push(
            `${file}: ${f.key} - target.goTo "${f.target.goTo}" TIDAK ada di dalam #${pageId} ` +
            `(target.page menunjuk page yang salah, atau elemen goTo sudah pindah page tapi registry belum di-update)`
          );
        }
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('FEATURE_REGISTRY — target.group (Settings) mengarah ke stgGroup yang nyata ada', () => {
  const { FEATURE_REGISTRY } = ctx();
  for (const cat of FEATURE_REGISTRY) {
    for (const f of cat.features) {
      if (!f.target.group) continue;
      assert.equal(f.target.page, 'settings', `${f.key}: target.group cuma valid kalau target.page==='settings'`);
      assert.ok(
        idExistsInHtml(f.target.group),
        `${f.key}: id="${f.target.group}" (stgGroup) tidak ditemukan di HTML`
      );
    }
  }
});

test('FEATURE_REGISTRY — target.dashKey cocok dgn key nyata di DASH_CARD_DEFS', () => {
  const { FEATURE_REGISTRY } = ctx();
  const modulesRenderSrc = fs.readFileSync(path.join(ROOT, 'modules-render.js'), 'utf8');
  const defsMatch = modulesRenderSrc.match(/const DASH_CARD_DEFS\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(defsMatch, 'DASH_CARD_DEFS tidak ditemukan di modules-render.js (source berubah?)');
  const dashKeys = new Set();
  const keyRe = /key:\s*'([^']+)'/g;
  let m;
  while ((m = keyRe.exec(defsMatch[1]))) dashKeys.add(m[1]);
  assert.ok(dashKeys.size > 0);

  for (const cat of FEATURE_REGISTRY) {
    for (const f of cat.features) {
      if (!f.target.dashKey) continue;
      assert.ok(
        dashKeys.has(f.target.dashKey),
        `${f.key}: dashKey "${f.target.dashKey}" tidak ada di DASH_CARD_DEFS (${[...dashKeys].join(',')})`
      );
    }
  }
});

test('FEATURE_REGISTRY — target.action mengacu ke fungsi/data-action yang nyata ada', () => {
  const { FEATURE_REGISTRY } = ctx();
  const jsBlob = allSourceJsText();
  for (const cat of FEATURE_REGISTRY) {
    for (const f of cat.features) {
      if (!f.target.action) continue;
      const action = f.target.action;
      const found =
        INDEX_HTML.includes(`data-action="${action}"`) ||
        (action.includes('.')
          ? jsBlob.includes(action) // pola "Modul.fn" mis. WorthIt.open / GoldImport.open
          : jsBlob.includes(`function ${action}(`));
      assert.ok(found, `${f.key}: action "${action}" tidak ditemukan sbg data-action maupun deklarasi function`);
    }
  }
});

test('FEATURE_REGISTRY — tiap kategori blueprint §1 (10 kategori) ada persis 1x', () => {
  const { FEATURE_REGISTRY } = ctx();
  const expectedLabels = [
    'Dashboard', 'Keuangan', 'Bisnis', 'Kendaraan', 'Pajak & Zakat',
    'Aset', 'Personal', 'AI', 'Backup', 'Settings',
  ];
  const actualLabels = FEATURE_REGISTRY.map((c) => c.label);
  for (const label of expectedLabels) {
    assert.ok(actualLabels.includes(label), `kategori "${label}" dari blueprint §1 tidak ditemukan di registry`);
  }
  assert.equal(actualLabels.length, expectedLabels.length, 'jumlah kategori tidak sama dgn blueprint §1');
});
