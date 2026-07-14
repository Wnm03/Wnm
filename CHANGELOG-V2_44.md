# Dashboard V2 — Tahap V2.44: Wire-up Sidebar

Baseline: `node --test` 1879/1879 PASS (akhir Tahap V2.43 / build #262).
Hasil tahap ini: `node --test` **1879/1879 PASS** (0 test baru, 0 regresi —
2 test lama di `tests/dashboard-v2-navigation.test.js` diupdate untuk
mencerminkan Sidebar yang sekarang diwire, bukan `disabled` total).
`node scripts/build.js` → build #264 sukses.

Referensi: keputusan eksplisit user (menindaklanjuti audit pra-patch tahap
ini) + `DASHBOARD-V2-BOTTOMNAV-WIREUP.md` ("V2.44 (rencana lanjutan): Sidebar").

## Audit pra-patch & blocker yang ditemukan

Sebelum patch, dilakukan audit menyeluruh (`_buildSidebar()`, `navigateTo()`,
cross-check `styles.css`). Tiga blocker ditemukan dan diputuskan user
sebagai berikut:

1. **Item "Reports" tidak punya halaman tujuan valid** — tidak ada
   `#page-reports` di `index.html`/`app_production.html` (pola `page: null`
   yg sama juga dipakai Quick Actions "Reports" di file yang sama).
   **Keputusan:** Reports TETAP `disabled`, tanpa `data-action`/`data-page`,
   tidak ada routing dummy/halaman baru dibuat.
2. **"Family"/"Documents" tidak ada** sbg halaman maupun item Sidebar.
   **Keputusan:** dikeluarkan dari scope smoke test. Smoke test Sidebar
   final: Dashboard, Finance, Vehicle, Settings. Reports hanya diverifikasi
   tetap `disabled`.
3. **Tidak ada mekanisme reusable untuk "active state" tersinkron di dua
   komponen navigasi sekaligus** — `showPage(name, el)` hanya menandai satu
   `el` yang dikirim sbg `.active`, dan `navigateTo()` men-destroy seluruh
   root (Sidebar + Bottom Nav) untuk tujuan selain `dashboard-hub`.
   **Keputusan:** TIDAK membuat logika baru. Reuse persis perilaku V2.43:
   Dashboard/Home → root tetap ada & terlihat; Finance/Vehicle/Settings →
   `disableDashboardV2()` + `destroy()`, Sidebar & Bottom Nav sama-sama
   lepas dari DOM (bukan bug — konsekuensi desain yang sudah disetujui
   sejak V2.43).

## Yang diubah

### `dashboard-v2-shell.js`
- `_buildSidebar()`: 4 dari 5 tombol (Dashboard, Finance, Vehicle,
  Settings) tidak lagi `disabled`. Tiap tombol diberi
  `data-action="DashboardV2Shell.navigateTo"` + `data-args='["<page>","$el"]'`
  — pola click-delegation global yg SUDAH ADA (sama persis dgn Bottom Nav
  V2.43 & `#mainNav` asli), **bukan** `addEventListener` baru. Mapping
  halaman (identik `_buildBottomNav()` untuk key yang sama):

  | Tombol Sidebar | `page` (dipakai `showPage()`) |
  |---|---|
  | Dashboard | `dashboard-hub` |
  | Finance | `keuangan` |
  | Vehicle | `carnotes` |
  | Reports | *(tidak ada — tetap `disabled`)* |
  | Settings | `settings` |

- `navigateTo(pageName, el)`: **0 baris diubah.** Sidebar memakai method
  yang sudah ada persis sejak V2.43 — satu-satunya pemanggil `showPage()`
  di seluruh file, diverifikasi ulang lewat guard test yang diperkuat
  (lihat bagian Test).
- **Bottom Nav & FAB V2 TIDAK disentuh** — tetap seperti V2.43/V2.5.

### `styles.css`
- `.dashboard-v2-sidebar-item`: dari style "nonaktif" (`opacity:.5`) jadi
  style interaktif — pola perubahan SAMA PERSIS dgn
  `.dashboard-v2-bottomnav-item` di V2.43. Ditambahkan `:hover`, `:active`,
  `.active` (dormant, konsisten dgn selector setara di Bottom Nav — hanya
  relevan kalau ada kode yang menambahkan class `.active` ke elemen ini;
  tidak ada logika baru ditambahkan tahap ini untuk itu), dan `:disabled`
  (dipakai tombol Reports). Semua token warna/spacing/durasi REUSE yang
  sudah ada (`--text`, `--surface2`, `--accent`, `--dur-moderate`) — tidak
  ada nilai baru. Layout tetap `display:block;width:100%` (list vertikal
  Sidebar, berbeda dari `flex:1` Bottom Nav yang horizontal) dan breakpoint
  desktop-only (`display:none` di <1024px) **tidak disentuh**.
- 0 selector dihapus, 0 token diubah, 0 warna global diubah.

### Test (`tests/dashboard-v2-navigation.test.js`)
- Test "Sidebar: 5 item ... semua disabled" diganti jadi "Sidebar (Tahap
  V2.44): ... Dashboard/Finance/Vehicle/Settings diwire ..., Reports tetap
  disabled" — memverifikasi `disabled`/`data-action`/`data-args` per
  tombol.
- Guard "showPage() Tahap V2.43 ... Sidebar & FAB V2 tetap disabled"
  diperbarui jadi "showPage() Tahap V2.43/V2.44 ...": memverifikasi
  `showPage()`/`window.showPage()` (termasuk fallback-nya, pola tidak
  berubah sejak V2.43) hanya muncul di dalam `navigateTo()` — 0 pemanggilan
  baru di tempat lain (mis. `_buildSidebar()`); Sidebar Reports & FAB V2
  tetap `disabled`, sisa item Sidebar tervalidasi `data-action`-nya benar.
- Tidak ada file test lain yang perlu diubah (dikonfirmasi: tidak ada
  assertion `disabled`/isi Sidebar di file test lain — hanya referensi
  identitas/struktur yang tidak terpengaruh).

## Verifikasi

- `node --test tests/*.test.js` → **1879/1879 PASS** (0 fail, 0 skip).
- `node scripts/build.js` → build #264 sukses, sintaks bundle valid,
  `index.html`/`app_production.html` identik, `FILE-MAP.md` ter-generate
  ulang (84 file, 959 identifier).
- Audit CSS: 0 selector orphan/duplikat/tak terpakai baru ditemukan
  (`.dashboard-v2-sidebar-item*` — 1 definisi tiap state, simetris dgn
  `.dashboard-v2-bottomnav-item*`).
- Audit JS: `showPage()` tetap hanya dipanggil di dalam `navigateTo()`
  (diverifikasi test); tidak ada `addEventListener`/router baru/
  `showPageV2()`/navigation manager baru; `dashboard-hub.js` tidak disentuh.
- **Smoke test browser nyata** (Playwright + Chromium headless, server
  statis lokal, viewport **1280×900 — desktop**, karena Sidebar
  `display:none` di bawah breakpoint 1024px per aturan responsive yang
  sudah ada, tidak diubah tahap ini):
  1. `enableDashboardV2()` + `init()`/`render()` → root `hidden=false`,
     `data-dashboard-v2-state=active`. ✓
  2. Audit 5 tombol Sidebar: Dashboard/Finance/Vehicle/Settings
     `disabled=false` dgn `data-action`/`data-args` benar; Reports
     `disabled=true`, tanpa `data-action`. ✓
  3. Klik `#dashboardV2SidebarFinance` → `#page-keuangan` jadi `.active`,
     `#dashboardV2Root` terlepas dari DOM (`destroy()` terpanggil). ✓
  4. Re-enable, klik `#dashboardV2SidebarDashboard` (Home) →
     `#page-dashboard-hub` `.active`, root TETAP ada & TETAP terlihat
     (`hidden=false`). ✓
  5. Klik `#dashboardV2SidebarVehicle` → `#page-carnotes` `.active`,
     root terlepas dari DOM. ✓
  6. Re-enable, klik `#dashboardV2SidebarSettings` → `#page-settings`
     `.active`, root terlepas dari DOM. ✓
  7. Re-enable, verifikasi `#dashboardV2SidebarReports` tetap
     `disabled=true` tanpa `data-action`. ✓
  8. **0 page error, 0 console error** di seluruh alur.

## Tidak diubah / di luar scope tahap ini

- Bottom Navigation, FAB, Hero, Summary Cards, Quick Actions, Module Grid,
  Statistics, Notifications, AI, Health, Predictive, Automation — 0 baris
  disentuh.
- `navigateTo()` itu sendiri — 0 baris diubah, dipakai apa adanya.
- `showPage()`, `#mainNav`/`.nav-item` lama, `FEATURE_REGISTRY`,
  `dashboard-hub.js` — 0 baris disentuh.
- Item Sidebar "Reports" — tetap `disabled`, menunggu keputusan terpisah
  kapan (atau apakah) halaman tujuannya akan dibuat.
- Mekanisme active-state sinkron lintas-komponen (Sidebar ⇄ Bottom Nav)
  untuk halaman selain `dashboard-hub` — sengaja tidak dibuat (lihat
  blocker #3 di atas); ini konsekuensi desain `navigateTo()` V2.43, bukan
  bug baru dari tahap ini.

## File yang berubah

- `dashboard-v2-shell.js` (+35/-14 baris)
- `styles.css` (+27/-3 baris)
- `tests/dashboard-v2-navigation.test.js` (+42/-14 baris)
- `CHANGELOG-V2_44.md` (baru)
- Hasil `node scripts/build.js` (otomatis, bukan edit manual): `index.html`,
  `app_production.html`, `app-bundle-a.min.js`, `app-bundle-b.min.js`,
  `docs/FILE-MAP.md`, `sw.js` (versi cache), plus sinkronisasi 1 baris
  konstanta versi di 5 file lain (`features-aiwidget-reminder-gdrive-
  search.js`, `features-budget-laporan-carnotes-pelanggan.js`, `modals.js`,
  `modules-calc.js`, `modules-render.js`) — housekeeping versi standar
  build tooling proyek ini, identik dgn yang terjadi di setiap tahap
  sebelumnya, bukan perubahan konten manual.
