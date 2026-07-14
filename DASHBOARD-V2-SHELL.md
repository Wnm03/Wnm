# Dashboard V2 Shell — Tahap V2.1 (Layout Foundation)

Baseline: `node --test` 1399/1399 PASS sebelum tahap ini.
Hasil tahap ini: `node --test` **1414/1414 PASS** (+15 test baru, 0 regresi).

Referensi: `DASHBOARD-V2-MIGRATION-RFC.md` §4 "Tahap V2.1 — Layout
Foundation". BLOCKER "Dashboard V2 Shell (V2.1) belum ada" dianggap
selesai sesi ini sesuai instruksi eksplisit.

## Yang dibangun

Satu file baru `dashboard-v2-shell.js` berisi `window.DashboardV2Shell`
dengan API:

- **`init(hostEl?)`** — pastikan root container (`#dashboardV2Root`,
  class `dashboard-v2-root`) ada di DOM. Idempotent (tidak duplikat kalau
  dipanggil berkali-kali). Root ditandai `hidden` +
  `data-dashboard-v2-state="dormant"`. Default host: `document.body`.
- **`render()`** — bangun 5 placeholder ke dalam root pakai
  `replaceChildren()` (idempotent, tidak menumpuk elemen lama kalau
  dipanggil ulang). Auto-`init()` kalau belum pernah dipanggil.
- **`destroy()`** — lepas root dari DOM & reset state, supaya `init()`
  berikutnya membangun instance bersih.

### 5 komponen placeholder (semua di dalam root, tidak ada isi/logic nyata)

| Komponen | Elemen | id | class |
|---|---|---|---|
| Sidebar | `<aside>` | `dashboardV2Sidebar` | `dashboard-v2-sidebar` |
| Header V2 | `<header>` | `dashboardV2Header` | `dashboard-v2-header` |
| Main Content Container | `<main>` | `dashboardV2Main` | `dashboard-v2-main` |
| Bottom Navigation V2 | `<nav>` | `dashboardV2BottomNav` | `dashboard-v2-bottomnav` |
| FAB V2 | `<button disabled>` | `dashboardV2Fab` | `keu-fab dashboard-v2-fab` |

Semua elemen berisi teks placeholder saja (mis. "Sidebar (placeholder)"),
tidak ada data nyata, tidak ada handler klik, FAB sengaja `disabled` +
`aria-hidden="true"`.

## Keputusan implementasi: 0 perubahan `index.html`/`app_production.html`

Proyeksi awal RFC (§6) memperkirakan markup dormant baru di kedua file
HTML. Diputuskan sebaliknya: root container **dibuat & di-mount lewat JS**
(`document.createElement` + `appendChild` ke `document.body`), bukan
markup statis. Ini membuat implementasi 100% self-contained di satu file
JS — mengurangi total file yang berubah dan risiko dibanding menyentuh
HTML, tanpa mengurangi cakupan scaffold yang diminta. Verifikasi: test
regresi memastikan kedua file HTML tidak mengandung string
`dashboard-v2-`/`dashboardV2` sama sekali.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada business logic** — tidak ada state, tidak ada perhitungan,
  tidak ada aksi yang melakukan sesuatu. FAB placeholder `disabled`.
- **Tidak ada routing** — tidak memanggil/mereferensikan `showPage()`.
- **Tidak ada integrasi `FEATURE_REGISTRY`** — tidak dibaca, tidak
  ditulis, tidak direferensikan di kode aktif.
- **Tidak menggantikan Dashboard Hub existing** — `dashboard-hub.js`
  tidak disentuh sama sekali (diverifikasi: file tidak berubah, tidak
  ada referensi `DashboardV2Shell` di dalamnya).
- **Tidak mengubah Finance/Vehicle/Reports/Shop/Hero Dashboard** — tidak
  ada file modul-modul itu yang disentuh.
- **Namespace class baru** (`dashboard-v2-*`), sengaja **bukan**
  `.nav-item`/`.nav` — RFC §5 mengidentifikasi risiko `showPage()` &
  `dashHubNavigateToFeature()` melakukan query global
  `.nav-item`/`#mainNav`; reuse class itu akan merusak highlight-state
  navigasi semua halaman existing. Diverifikasi lewat test regresi
  (mengecek kode aktif, bukan komentar rationale).
- **`replaceChildren()`** dipakai utk render idempotent, dgn fallback
  manual (`removeChild`/`appendChild`) utk lingkungan tanpa API itu.
- **Design token 100% reuse** — CSS baru di `styles.css` (namespace
  `dashboard-v2-*`) hanya memakai token existing (`--sp-*`, `--fs-*`,
  `--bg`, `--surface`, `--text`/`--text2`, `--border`, `--header-bg`),
  tidak ada nilai warna/spacing baru yang di-hardcode. Sidebar
  breakpoint desktop-only (`min-width:1024px`), konsisten dgn RFC §4
  poin 1 (belum ada preseden Sidebar, app 100% mobile bottom-nav).
  `.dashboard-v2-fab` sengaja tidak override `position`/ukuran — itu
  ditanggung reuse class `.keu-fab` yang sudah ada.

## Test

`tests/dashboard-v2-shell.test.js` — 15 test baru:

1. `window.DashboardV2Shell` tersedia dgn API `init`/`render`/`destroy`.
2. `init()` membuat container, ter-attach ke `document.body`, ditandai
   dormant (`hidden` + `data-dashboard-v2-state="dormant"`).
3. `init()` idempotent (tidak duplikat).
4. `render()` membangun 5 placeholder dgn id/class yang benar.
5. Namespace Bottom Navigation V2 bukan `nav`/`nav-item`.
6. FAB placeholder tidak interaktif (`disabled`, `aria-hidden`).
7. `render()` idempotent (tidak menumpuk children).
8. `render()` tanpa `init()` eksplisit tetap jalan (auto-init).
9. `destroy()` melepas container & reset state.
10. `destroy()` lalu `init()` lagi membangun instance bersih.
11. Tidak error di environment tanpa `document`.
12. Regresi: tidak ada integrasi `FEATURE_REGISTRY`/`showPage()`/
    `.nav-item`/`#mainNav` di kode aktif.
13–14. Regresi: `index.html` & `app_production.html` tidak berubah (0
    string `dashboard-v2-`/`dashboardV2`), `#page-dashboard-hub` tetap ada.
15. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.

## Status

V2.1 (Layout Foundation) **selesai diimplementasikan** — dormant, belum
wired ke apa pun. V2.2+ (wire-up: ganti `#mainNav`, aktifkan breakpoint
Sidebar, pindahkan komponen existing ke Main Content Container) tetap
di luar scope, butuh mandat eksplisit terpisah sesuai RFC §4.
