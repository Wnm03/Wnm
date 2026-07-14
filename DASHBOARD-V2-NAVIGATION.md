# Dashboard V2 — Tahap V2.5 (Sidebar Navigation & Bottom Navigation V2 items)

Baseline: `node --test` 1445/1445 PASS (akhir Tahap V2.4).
Hasil tahap ini: `node --test` **1456/1456 PASS** (+11 test baru
[10 di file baru + 1 file baru itu sendiri], 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.5). Tidak mengaudit
ulang repository; melengkapi 2 placeholder top-level yang dari Tahap
V2.1 masih teks polos (Sidebar, Bottom Navigation V2) di
`dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
mengisi *konten* Sidebar dan Bottom Navigation V2, konsisten dengan pola
yang dipakai `_buildHeader()` sejak Tahap V2.2: tiap komponen dipecah
jadi method builder tersendiri (`_buildSidebar()`, `_buildBottomNav()`).

### Sidebar (5 item navigasi, anak `#dashboardV2Sidebar`)

| Item | id | Catatan |
|---|---|---|
| Dashboard | `dashboardV2SidebarDashboard` | `<button disabled>` |
| Finance | `dashboardV2SidebarFinance` | `<button disabled>` |
| Vehicle | `dashboardV2SidebarVehicle` | `<button disabled>` |
| Reports | `dashboardV2SidebarReports` | `<button disabled>` |
| Settings | `dashboardV2SidebarSettings` | `<button disabled>` |

Namespace class baru: `dashboard-v2-sidebar-item` (bukan `.nav-item`).

### Bottom Navigation V2 (4 item navigasi, anak `#dashboardV2BottomNav`)

| Item | id | Catatan |
|---|---|---|
| Home | `dashboardV2BottomNavHome` | `<button disabled>` |
| Finance | `dashboardV2BottomNavFinance` | `<button disabled>` |
| Vehicle | `dashboardV2BottomNavVehicle` | `<button disabled>` |
| More | `dashboardV2BottomNavMore` | `<button disabled>` |

Namespace class baru: `dashboard-v2-bottomnav-item`. Class induk
`dashboard-v2-bottomnav` (V2.1) tidak berubah.

Semua tombol `type="button"` + `disabled` + `aria-label` sendiri —
tanpa `onclick`/`addEventListener`, tanpa routing (tidak memanggil
`showPage()`), tanpa business logic apa pun. Dibangun via
`replaceChildren()`, tanpa `innerHTML`.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5 children.
- **`replaceChildren()`** dipakai di semua level (sidebar, bottom nav) —
  **tidak ada `innerHTML`** sama sekali (diverifikasi test regex).
- **Semua item navigasi `disabled`**, **tidak ada
  `addEventListener`/`.onclick =`**, **tidak ada `showPage()`** di kode
  (diverifikasi test regex) — murni placeholder, belum interaktif.
- **Namespace class baru** (`dashboard-v2-sidebar-item`,
  `dashboard-v2-bottomnav-item`) — BUKAN `.nav-item` (RFC §5 Risk
  Assessment: reuse class global akan merusak highlight-state navigasi
  existing lewat `showPage()`/`#mainNav`).
- **Tidak ada integrasi `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tidak terhubung** ke Dashboard Hub existing maupun **AI Command
  Center** (`AICommandCenter`).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope).

## Test

`tests/dashboard-v2-navigation.test.js` — 10 test baru:

1. Root top-level tetap 5 komponen.
2. Sidebar dirender dgn `aria-label` + 5 item.
3. Sidebar: 5 item sesuai urutan, semua `disabled`.
4. Bottom Navigation V2 dirender dgn `aria-label` + 4 item, class induk
   tidak berubah.
5. Bottom Navigation V2: 4 item sesuai urutan, semua `disabled`.
6. `render()` tetap idempotent (tidak menumpuk).
7. Dashboard V2 tetap dormant setelah `render()`.
8. Regresi: tidak terhubung `FEATURE_REGISTRY`/`showPage()`/
   `AICommandCenter`/`.nav-item` global, tidak ada `innerHTML`/
   `addEventListener`.
9. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.
10–11 (loop 2 file). Regresi: `index.html` & `app_production.html`
    tetap 0 markup Dashboard V2.

`tests/dashboard-v2-shell.test.js` (V2.1), `tests/dashboard-v2-hero.test.js`
(V2.2), dan `tests/dashboard-v2-summary.test.js` (V2.3/V2.4) tetap
dijalankan ulang sbg bukti tidak ada regresi — tidak ada assersi yang
terdampak, semua tetap 100% lulus tanpa perubahan.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.5 (Sidebar Navigation + Bottom Navigation V2 items) **selesai**,
tetap dormant, tidak wired. Kelima komponen top-level V2.1 kini punya
isi placeholder lengkap:

| Komponen | Isi (sejak tahap) |
|---|---|
| Sidebar | 5 item navigasi (V2.5) |
| Header | 4 sub-placeholder (V2.2) |
| Main | Hero + Summary Cards + Quick Actions + Module Grid + Insight Panel (V2.2–V2.4) |
| Bottom Navigation V2 | 4 item navigasi (V2.5) |
| FAB | tombol `+` disabled (V2.1) |

Wire-up nyata (routing sungguhan, aktivasi tombol, integrasi
`FEATURE_REGISTRY`, styling visual) tetap di luar scope, butuh mandat
eksplisit terpisah.
