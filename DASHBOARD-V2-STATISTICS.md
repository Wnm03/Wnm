# Dashboard V2 — Tahap V2.7 (Statistics Panel)

Baseline: `node --test` 1467/1467 PASS (akhir Tahap V2.6).
Hasil tahap ini: `node --test` **1480/1480 PASS** (+13 test baru di
file baru, 3 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.7). Tidak
mengaudit ulang repository; menambah 1 sub-komponen baru (Statistics
Panel) sbg anak Main Content Container di `dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
menambah *anak baru* di dalam Main Content Container, konsisten dengan
pola yang dipakai `_buildInsightPanel()`/`_buildRecentActivity()` sejak
Tahap V2.4/V2.6: method builder tersendiri (`_buildStatisticsPanel()`)
yang mengembalikan elemen siap pakai, di-wire lewat `_buildMain()`.

Urutan anak Main Content Container sekarang (7 anak, sebelumnya 6):

Hero -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel
-> Recent Activity -> **Statistics Panel**

### Statistics Panel (4 kartu statistik, anak `#dashboardV2StatisticsPanel`)

Section: `role="region"` + `aria-label="Statistics"`.

| Kartu | id | icon | title | value | trend |
|---|---|---|---|---|---|
| 1 | `dashboardV2StatisticsCardIncome` | 📈 | "Income" | "-- (placeholder)" | "-- (placeholder)" |
| 2 | `dashboardV2StatisticsCardExpense` | 📉 | "Expense" | "-- (placeholder)" | "-- (placeholder)" |
| 3 | `dashboardV2StatisticsCardSavings` | 💰 | "Savings" | "-- (placeholder)" | "-- (placeholder)" |
| 4 | `dashboardV2StatisticsCardVehicles` | 🚗 | "Active Vehicles" | "-- (placeholder)" | "-- (placeholder)" |

Tiap kartu adalah `<button type="button" disabled>` (namespace class
baru `dashboard-v2-statistics-card`) berisi 4 sub-elemen `<span>`
placeholder, masing-masing dgn id & class sendiri:

- `dashboard-v2-statistics-icon` — id `...Icon`
- `dashboard-v2-statistics-title` — id `...Title`
- `dashboard-v2-statistics-value` — id `...Value`
- `dashboard-v2-statistics-trend` — id `...Trend`

Pola `disabled` mengikuti Quick Actions (V2.3)/Sidebar & Bottom Nav
(V2.5); struktur konten berlapis (icon/title/value/trend) mengikuti pola
kartu Module Grid (V2.4). Semua teks statis — **tidak membaca**
`D.profile`/`D.transactions`/sumber data nyata apa pun. Dibangun via
`replaceChildren()` (di level section maupun di dalam tiap kartu),
tanpa `innerHTML`, tanpa `onclick`/`addEventListener`, tanpa routing
(tidak memanggil `showPage()`), tanpa `fetch`, tanpa state baru, tanpa
business logic apa pun.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5
  children.
- **Main Content Container** sekarang py 7 anak (sebelumnya 6) —
  perubahan ini murni struktural di dalam Main, bukan penambahan
  komponen top-level baru.
- **`replaceChildren()`** dipakai di semua level (section & tiap
  kartu) — **tidak ada `innerHTML`** sama sekali (diverifikasi test
  regex).
- **Semua kartu `disabled`**, **tidak ada event listener**: tidak ada
  `addEventListener`/`.onclick =` di kode (diverifikasi test regex) —
  murni placeholder, tetap dormant.
- **Tidak ada routing**: tidak memanggil `showPage()` (diverifikasi
  test regex).
- **Tidak ada integrasi `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tidak ada AI/fetch**: tidak ada pemanggilan `fetch()` maupun
  `AICommandCenter` (diverifikasi test regex).
- **Tidak ada state baru**: tidak ada properti state tambahan di objek
  `DashboardV2Shell` — panel dibangun murni dari data literal lokal di
  dalam method, sama seperti Insight Panel/Recent Activity.
- **Tidak terhubung** ke Dashboard Hub existing (`D.profile`/
  `D.transactions`/`DashboardHubHero`).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`render()` tetap idempotent** — dipanggil berkali-kali tidak
  menumpuk anak (Main tetap 7 anak, Statistics Panel tetap 4 kartu,
  tiap kartu tetap 4 sub-elemen).
- **Namespace class baru** (`dashboard-v2-statistics-panel`,
  `dashboard-v2-statistics-card`, `-icon`/`-title`/`-value`/`-trend`) —
  mengikuti konvensi penamaan `dashboard-v2-*` existing, tidak bentrok
  dgn class lain.
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope); class disiapkan mengikuti
  konvensi token/desain existing.

## Test

`tests/dashboard-v2-statistics.test.js` — 13 test baru:

1. Statistics Panel ditemukan sbg anak ke-7 Main, section dgn
   `role="region"` + `aria-label="Statistics"`.
2. Statistics Panel berisi tepat 4 statistic card.
3. Urutan 4 kartu sesuai (Income, Expense, Savings, Active Vehicles),
   semua `<button disabled>`.
4. Kartu Income: 4 sub-elemen (icon, title, value, trend) sesuai
   urutan & isi.
5. Kartu Expense/Savings/Active Vehicles: title & value/trend
   placeholder benar.
6. Dashboard V2 tetap dormant setelah `render()` Tahap V2.7.
7. `render()` tetap idempotent (Main 7 anak, panel 4 kartu, tiap kartu
   4 sub-elemen, tidak menumpuk).
8. Root top-level tetap 5 komponen (Statistics Panel anak Main, bukan
   top-level baru).
9. Regresi: tidak ada `onclick`/`addEventListener` (murni kartu
   disabled, tanpa routing/link).
10. Regresi: tidak terhubung `FEATURE_REGISTRY`/`showPage()`/
    `AICommandCenter`/`D.profile`/`D.transactions`/`DashboardHubHero`/
    `fetch`, tidak ada `innerHTML`.
11. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.
12–13 (loop 2 file). Regresi: `index.html` & `app_production.html`
    tetap 0 markup Dashboard V2.

`tests/dashboard-v2-summary.test.js` — 2 assersi disesuaikan (jumlah
anak Main dari 6 → 7, di test struktur Main & test idempotensi
`render()`); assersi lain di file ini tidak terdampak.

`tests/dashboard-v2-activity.test.js` — 1 assersi disesuaikan (jumlah
anak Main dari 6 → 7 di test idempotensi `render()`); assersi lain di
file ini (urutan/id 5 activity item, dormant, regresi) tidak
terdampak.

`tests/dashboard-v2-shell.test.js` (V2.1), `tests/dashboard-v2-hero.test.js`
(V2.2), dan `tests/dashboard-v2-navigation.test.js` (V2.5) tetap
dijalankan ulang sbg bukti tidak ada regresi — tidak ada assersi yang
terdampak, semua tetap 100% lulus tanpa perubahan.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.7 (Statistics Panel) **selesai**, tetap dormant, tidak wired. Main
Content Container kini py 7 sub-komponen:

| Anak Main | Isi (sejak tahap) |
|---|---|
| Hero | Welcome title, Health Score, Balance, Insight (V2.2) |
| Summary Cards | 4 kartu (V2.3) |
| Quick Actions | 4 tombol (V2.3) |
| Module Grid | 6 kartu (V2.4) |
| Insight Panel | 3 baris insight (V2.4) |
| Recent Activity | 5 item aktivitas (V2.6) |
| Statistics Panel | 4 kartu statistik — Income/Expense/Savings/Active Vehicles (V2.7) |

Wire-up nyata (data statistik sungguhan, aktivasi kartu, routing,
integrasi `FEATURE_REGISTRY`, styling visual) tetap di luar scope,
butuh mandat eksplisit terpisah.
