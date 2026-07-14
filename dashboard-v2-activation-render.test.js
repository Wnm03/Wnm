'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// Tahap V2.14B — Activation Wiring (DASHBOARD-V2-ACTIVATION-RENDER.md).
// Menguji bahwa DashboardV2Shell.render() membaca isDashboardV2Enabled()
// (global dari dashboard-v2-activation.js) untuk menentukan atribut
// `hidden`/`data-dashboard-v2-state` pada root — TANPA menjalankan
// dashboard-v2-activation.js beneran (file itu sudah dites terpisah di
// tests/dashboard-v2-activation.test.js). Di sini flag di-inject manual
// sbg fungsi global sederhana ke sandbox vm dashboard-v2-shell.js saja,
// supaya test ini murni menguji WIRING-nya (bukan mengulang logic
// enable/disable yg sudah dites di file lain).
//
// Fake DOM: sama persis dgn pola tests/dashboard-v2-shell.test.js
// (createElement/appendChild/replaceChildren/getElementById minimal,
// tanpa jsdom), ditambah `removeAttribute` (belum dibutuhkan di test
// V2.1–V2.13 krn root sebelumnya tidak pernah melepas `hidden`).

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

function makeFakeDocument() {
  const body = createFakeElement('body');
  return {
    body,
    createElement: (tag) => createFakeElement(tag),
    getElementById: (id) => findById(body, id),
  };
}

// loadShellWithFlag(initialEnabled) — load dashboard-v2-shell.js ke sandbox
// baru, dgn `isDashboardV2Enabled` disuntik sbg fungsi global sederhana yg
// membaca closure boolean lokal `enabled`. `setFlag(bool)` dikembalikan
// supaya test bisa mengubah flag ANTAR pemanggilan render() (mensimulasikan
// enableDashboardV2()/disableDashboardV2() dari V2.14A tanpa menjalankan
// file itu sungguhan).
function loadShellWithFlag(initialEnabled) {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  let enabled = initialEnabled === true;
  let callCount = 0;
  const isDashboardV2Enabled = () => {
    callCount += 1;
    return enabled;
  };
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
    isDashboardV2Enabled,
  });
  return {
    Shell: context.window.DashboardV2Shell,
    document: fakeDocument,
    setFlag: (v) => { enabled = v === true; },
    getCallCount: () => callCount,
  };
}

test('render() default (flag false/tidak ada) — root tetap hidden + data-dashboard-v2-state="dormant"', () => {
  const { Shell } = loadShellWithFlag(false);
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'), 'root harus tetap hidden saat flag false');
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() saat flag true (setelah enable()) — hidden dilepas, data-dashboard-v2-state="active"', () => {
  const { Shell, setFlag } = loadShellWithFlag(false);
  setFlag(true); // simulasi enableDashboardV2()
  const root = Shell.render();
  assert.equal(root.hasAttribute('hidden'), false, 'root tidak boleh hidden lagi saat flag true');
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'active');
});

test('render() saat flag kembali false (setelah disable()) — hidden dipasang lagi, state kembali "dormant"', () => {
  const { Shell, setFlag } = loadShellWithFlag(false);
  setFlag(true);
  Shell.render();
  setFlag(false); // simulasi disableDashboardV2()
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'), 'root harus hidden lagi setelah flag kembali false');
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() tanpa dashboard-v2-activation.js di-load sama sekali (isDashboardV2Enabled undefined) — fallback ke dormant, tidak error', () => {
  const fakeDocument = makeFakeDocument();
  const fakeWindow = {};
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: fakeWindow,
    // isDashboardV2Enabled sengaja TIDAK disuntik.
  });
  const Shell = context.window.DashboardV2Shell;
  assert.doesNotThrow(() => Shell.render());
  const root = Shell.render();
  assert.ok(root.hasAttribute('hidden'));
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
});

test('render() idempotent saat flag true — dipanggil berkali-kali tetap 1 root, tetap active, tetap 5 children (tidak menumpuk)', () => {
  const { Shell, document, setFlag } = loadShellWithFlag(false);
  setFlag(true);
  Shell.render();
  Shell.render();
  const root = Shell.render();
  assert.equal(document.body.children.length, 1, 'tidak boleh ada duplikat root container');
  assert.equal(root.children.length, 5, 'render() idempotent — tetap 5 children (sidebar/header/main/bottomnav/fab)');
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'active');
  assert.equal(root.hasAttribute('hidden'), false);
});

test('render() idempotent saat flag false — dipanggil berkali-kali tetap 1 root, tetap dormant, tetap 5 children', () => {
  const { Shell, document } = loadShellWithFlag(false);
  Shell.render();
  Shell.render();
  const root = Shell.render();
  assert.equal(document.body.children.length, 1);
  assert.equal(root.children.length, 5);
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
  assert.ok(root.hasAttribute('hidden'));
});

test('render() transisi berulang (false -> true -> false -> true) tetap konsisten setiap kali', () => {
  const { Shell, setFlag } = loadShellWithFlag(false);
  let root = Shell.render();
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');

  setFlag(true);
  root = Shell.render();
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'active');
  assert.equal(root.hasAttribute('hidden'), false);

  setFlag(false);
  root = Shell.render();
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'dormant');
  assert.ok(root.hasAttribute('hidden'));

  setFlag(true);
  root = Shell.render();
  assert.equal(root.getAttribute('data-dashboard-v2-state'), 'active');
  assert.equal(root.hasAttribute('hidden'), false);
});

test('render() tidak memanggil showPage() (global showPage tidak pernah disentuh, baik flag true maupun false)', () => {
  let showPageCalled = false;
  const fakeDocument = makeFakeDocument();
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: {},
    isDashboardV2Enabled: () => true,
    showPage: () => { showPageCalled = true; },
  });
  context.window.DashboardV2Shell.render();
  assert.equal(showPageCalled, false, 'render() tidak boleh memanggil showPage()');
});

test('render() tidak memakai FEATURE_REGISTRY (baik flag true maupun false)', () => {
  let registryAccessed = false;
  const fakeDocument = makeFakeDocument();
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: {},
    isDashboardV2Enabled: () => true,
    FEATURE_REGISTRY: new Proxy({}, {
      get() { registryAccessed = true; return () => {}; },
    }),
  });
  context.window.DashboardV2Shell.render();
  assert.equal(registryAccessed, false, 'render() tidak boleh mengakses FEATURE_REGISTRY');
});

test('render() hanya membaca flag, tidak menuliskannya (isDashboardV2Enabled dipanggil, tapi tidak ada enable/disableDashboardV2 yg dipanggil dari shell)', () => {
  let enableCalled = false;
  let disableCalled = false;
  const fakeDocument = makeFakeDocument();
  const context = loadSource(['dashboard-v2-shell.js'], {
    document: fakeDocument,
    window: {},
    isDashboardV2Enabled: () => false,
    enableDashboardV2: () => { enableCalled = true; },
    disableDashboardV2: () => { disableCalled = true; },
  });
  context.window.DashboardV2Shell.render();
  assert.equal(enableCalled, false, 'render() tidak boleh memanggil enableDashboardV2()');
  assert.equal(disableCalled, false, 'render() tidak boleh memanggil disableDashboardV2()');
});

test('source file tidak mengandung referensi tekstual ke showPage(/FEATURE_REGISTRY pada baris kode aktif (jaminan statis tambahan)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'dashboard-v2-shell.js'), 'utf8');
  const codeOnly = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  assert.equal(/showPage\s*\(/.test(codeOnly), false);
  assert.equal(/FEATURE_REGISTRY/.test(codeOnly), false);
});
