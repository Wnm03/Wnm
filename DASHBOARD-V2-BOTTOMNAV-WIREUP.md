# Dashboard V2 — Tahap V2.43: Wire-up Bottom Navigation

Baseline: `node --test` 1876/1876 PASS (akhir Tahap V2.42 / build #261).
Hasil tahap ini: `node --test` **1879/1879 PASS** (+3 test baru, 0 regresi;
22 test lama di file lain diupdate — lihat "Guard lama yang diupdate").
`node scripts/build.js` → build #262 sukses.

Referensi: persetujuan eksplisit user (screen recording 14 Juli 2026,
17:15 — Bottom Nav V2 tampil sbg teks polos tanpa UI/UX & tidak bisa
diklik) + `DASHBOARD-V2-MIGRATION-RFC.md` §4 ("Tahap V2.2+ ... butuh
keputusan eksplisit terpisah kapan titik ini boleh dieksekusi").

## Konteks

Sejak Tahap V2.5, Bottom Navigation V2 (`_buildBottomNav`) dibangun
sbg placeholder murni: 4 tombol `disabled`, tanpa routing. RFC migrasi
sengaja menahan wiring ini ke "Tahap V2.2+" sampai ada mandat eksplisit
— sekarang user secara eksplisit meminta ini diaktifkan, bertahap:
1. **V2.43 (tahap ini): Bottom Nav.**
2. V2.44 (rencana lanjutan, belum dikerjakan): Sidebar.
3. V2.45 (rencana lanjutan, belum dikerjakan): FAB.

## Yang diubah

### `dashboard-v2-shell.js`
- `_buildBottomNav()`: 4 tombol tidak lagi `disabled`. Tiap tombol diberi
  `data-action="DashboardV2Shell.navigateTo"` + `data-args='["<page>","$el"]'`
  — pola click-delegation global yg SUDAH ADA di
  `features-helpers-global-security.js` (dipakai persis sama oleh
  `#mainNav` asli), **bukan** `addEventListener` baru. Mapping halaman:
  | Tombol | `page` (dipakai `showPage()`) |
  |---|---|
  | Home | `dashboard-hub` |
  | Finance | `keuangan` |
  | Vehicle | `carnotes` |
  | More | `settings` |
- Method baru `DashboardV2Shell.navigateTo(pageName, el)`:
  - Selalu memanggil `showPage(pageName, el)` (fungsi global existing,
    `modal-navigasi.js`) — routing SAMA PERSIS dgn `#mainNav` lama.
  - Kalau tujuan **bukan** `dashboard-hub` (Finance/Vehicle/More):
    juga memanggil `disableDashboardV2()` + `this.destroy()` — supaya
    overlay penuh-layar Dashboard V2 (`position:fixed;inset:0`, lihat
    `DASHBOARD-V2-OVERLAY-FIX.md`) tidak menutupi halaman tujuan yg baru
    diaktifkan `showPage()`. Untuk kembali ke Dashboard V2, user memakai
    toggle "Dashboard V2 aktif" yg sudah ada di Dashboard Hub — TIDAK ada
    mekanisme re-entry baru.
  - Kalau tujuan `dashboard-hub` (Home): hanya `showPage()`, Dashboard V2
    TETAP aktif/terlihat (Home = Dashboard V2 itu sendiri).
- **Sidebar & FAB V2 TIDAK disentuh** — tetap `disabled`, persis seperti
  sebelumnya (dikonfirmasi test regresi baru).

### `styles.css`
- `.dashboard-v2-bottomnav-item`: dari style "nonaktif" (`opacity:.5`,
  `display:inline-block`) jadi style interaktif penuh — `flex:1` (rata
  4 kolom, pola sama dgn `.nav-item` lama), `cursor:pointer`, warna
  `--text3` → `--text`/`--accent` saat hover/active, `:active{transform:
  scale(0.95)}` utk feedback tap, `:disabled{opacity:.5}` sbg fallback
  (dipakai kalau ada yg disable manual di masa depan). Semua token warna/
  spacing/durasi REUSE yg sudah ada (`--text3`, `--surface2`, `--accent`,
  `--dur-moderate`) — tidak ada nilai baru.
- `.dashboard-v2-sidebar-item` **tidak disentuh** (tetap `opacity:.5`,
  menunggu Tahap V2.44).

### Test
- `tests/dashboard-v2-navigation.test.js`: assertion Bottom Nav
  (`disabled: true`) diganti jadi `disabled: false` + verifikasi
  `data-action`/`data-args` per tombol (3 test diupdate/ditambah,
  termasuk 2 test baru khusus `navigateTo()` — mock `showPage`/
  `disableDashboardV2` via `fakeWindow`, verifikasi Home TIDAK memanggil
  `disableDashboardV2()` sedangkan Finance/Vehicle/More MEMANGGIL).
  Guard regresi lama diupdate: `showPage()` sekarang legal (dulu
  dilarang total di file ini), tapi ditambah guard baru yg memverifikasi
  `showPage()` **hanya** dipanggil di dalam `navigateTo()` — dan Sidebar/
  FAB V2 tetap `disabled`.

### Guard lama yang diupdate (23 file lain)
23 file test lain (tiap file per-tahap sejak V2.1) masing-masing punya
1 assertion generik `doesNotMatch(seluruh-source, /showPage\s*\(/)` sbg
guard regresi "dashboard-v2-shell.js tidak terhubung routing apa pun".
Karena scope-nya seluruh file (bukan cuma bagian tahap masing-masing),
assertion showPage() di 23 file itu **dihapus** (diganti komentar
penjelas, guard lain di baris yg sama tidak disentuh: FEATURE_REGISTRY/
AICommandCenter/innerHTML/addEventListener/D.profile/dst tetap ada &
tetap lolos). Guard showPage() yang sesungguhnya (harus HANYA muncul di
`navigateTo()`) sekarang tepusat di `tests/dashboard-v2-navigation.test.js`
supaya tidak terduplikasi di 23 tempat.

## Verifikasi

- `node --test tests/*.test.js` → 1879/1879 PASS (0 fail).
- `node scripts/build.js` → build #262 sukses, sintaks bundle valid,
  `index.html`/`app_production.html` identik, `FILE-MAP.md` ter-generate
  ulang (84 file, 959 identifier).
- **Smoke test browser nyata** (Playwright + Chromium headless, server
  statis lokal, viewport 390×844 — bukan cuma baca kode):
  1. `enableDashboardV2()` + `render()` → root `hidden=false`,
     `data-dashboard-v2-state=active`. ✓
  2. Klik `#dashboardV2BottomNavFinance` → `#page-keuangan` jadi
     `.active`, `#dashboardV2Root` terlepas dari DOM (destroy()
     terpanggil). ✓
  3. Re-enable, klik `#dashboardV2BottomNavHome` → `#page-dashboard-hub`
     `.active`, Dashboard V2 root TETAP ada & TETAP terlihat
     (`hidden=false`). ✓
  4. Klik `#dashboardV2BottomNavVehicle` → `#page-carnotes` `.active`. ✓
  5. Klik `#dashboardV2BottomNavMore` → `#page-settings` `.active`. ✓
  6. **0 page error, 0 console error** di seluruh alur.

## Tidak diubah / di luar scope tahap ini

- Sidebar (`_buildSidebar`) & FAB V2 — tetap `disabled`, direncanakan
  Tahap V2.44 (Sidebar) & V2.45 (FAB) sesuai urutan yg diminta user.
- `#mainNav`/`.nav-item` lama, `showPage()` sendiri, `FEATURE_REGISTRY`,
  business logic Finance/Vehicle/Reports/Shop — 0 baris disentuh.
- Mekanisme re-entry baru ke Dashboard V2 setelah keluar lewat Finance/
  Vehicle/More — memakai toggle existing di Dashboard Hub, tidak ada
  yang baru dibuat.
