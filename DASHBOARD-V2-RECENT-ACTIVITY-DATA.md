# Dashboard V2 — Tahap V2.21 (Recent Activity Data Integration)

Baseline: `node --test` 1696/1696 PASS (akhir Tahap V2.20 —
Statistics Panel Data Integration).
Hasil tahap ini: `node --test` **1714/1714 PASS** (+18 test baru, 0
regresi).

Referensi: instruksi sesi ini ("V2.21 — Recent Activity Data
Integration"), `DASHBOARD-V2-STATISTICS-DATA.md` (V2.20, pola yang
diikuti), `DASHBOARD-V2-MODULE-GRID-DATA.md` (V2.19), `DASHBOARD-V2-
SUMMARY-DATA.md` (V2.18), `DASHBOARD-V2-HERO-DATA.md` (V2.17),
`DASHBOARD-V2-DATA-ADAPTER.md` (V2.16), Tahap V2.6 (Recent Activity
awal).

## Tujuan

Dashboard V2 mulai memakai `dashboard-v2-data-adapter.js` (V2.16) di
Recent Activity, mengikuti pola persis Tahap V2.17 (Hero), V2.18
(Summary Cards), V2.19 (Module Grid) & V2.20 (Statistics Panel).
Bagian lain (Hero, Summary Cards, Quick Actions, Module Grid, Insight
Panel, Statistics Panel, Upcoming Tasks, Notifications, AI Command
Center, Health Score, Predictive Insights, Automation Center) TIDAK
disentuh sama sekali.

## Yang diubah

**Satu fungsi disentuh: `_buildRecentActivity()` di
`dashboard-v2-shell.js`.** Tidak ada fungsi lain yang diedit.

### Recent Activity — sebelum (Tahap V2.6, 5 anak, TIDAK berubah)

| Elemen | id | Isi |
|---|---|---|
| item1 | `dashboardV2RecentActivityItem1` | teks statis placeholder ("Transaksi tercatat") |
| item2 | `dashboardV2RecentActivityItem2` | teks statis placeholder ("Backup terakhir dijalankan") |
| item3 | `dashboardV2RecentActivityItem3` | teks statis placeholder ("Catatan kendaraan diperbarui") |
| item4 | `dashboardV2RecentActivityItem4` | teks statis placeholder ("Laporan dibuat") |
| item5 | `dashboardV2RecentActivityItem5` | teks statis placeholder ("Anggota keluarga ditambahkan") |

### Recent Activity — ditambah tahap ini (4 anak baru, additive)

| Elemen | id | Sumber | Isi kalau adapter tersedia & ada data | Isi fallback |
|---|---|---|---|---|
| Finance summary | `dashboardV2RecentActivityFinanceData` | `getFinanceSummary()` | `Keuangan: {accountCount} akun, Rp {totalBalance}, {transactionCount} transaksi` | `Keuangan: -- (placeholder)` |
| Vehicle summary | `dashboardV2RecentActivityVehicleData` | `getVehicleSummary()` | `Kendaraan: {vehicleCount} kendaraan, {bbmLogCount} catatan BBM, {servisLogCount} catatan servis` | `Kendaraan: -- (placeholder)` |
| Family summary | `dashboardV2RecentActivityFamilyData` | `getFamilySummary()` | `Keluarga: {anakCount} anak, {milestoneDoneCount}/{milestoneTotalCount} milestone, {reminderCount} pengingat` | `Keluarga: -- (placeholder)` |
| Document summary | `dashboardV2RecentActivityDocumentData` | `getDocumentSummary()` | `Dokumen: {simCount} SIM, {vehicleTaxDocCount} dokumen pajak kendaraan` | `Dokumen: -- (placeholder)` |

Recent Activity jadi total **9 anak** (5 lama + 4 baru). Urutan: item1,
item2, item3, item4, item5, financeData, vehicleData, familyData,
documentData — dirender lewat `section.replaceChildren()` seperti
sebelumnya, tidak ada `innerHTML`. 4 elemen baru memakai
`className: 'dashboard-v2-recent-activity-item'` yang sama dgn 5 baris
lama (semuanya `<div>`), konsisten dgn struktur existing.

### Cara pemanggilan adapter

```js
const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
```

Pola guard ini identik dengan yang dipakai `_buildHero()` (V2.17),
`_buildSummaryCards()` (V2.18), `_buildModuleGrid()` (V2.19) &
`_buildStatisticsPanel()` (V2.20) — fungsi global dipanggil langsung
(bukan `window.fn()`), dilindungi `typeof fn === 'function'`. Kalau
hasilnya bukan objek (mis. `null`, karena adapter belum melihat `D`,
atau adapter belum ter-load sama sekali di halaman), elemen jatuh ke
teks placeholder. Shell **tidak pernah membaca `D` secara langsung** —
satu-satunya jalur baca data tetap lewat 4 fungsi adapter, konsisten
dengan arsitektur `DASHBOARD-V2-DATA-ADAPTER.md`:

```
D  ──(baca-saja)──▶  dashboard-v2-data-adapter.js  ──(baca-saja, guard typeof)──▶  dashboard-v2-shell.js (_buildHero + _buildSummaryCards + _buildModuleGrid + _buildStatisticsPanel + _buildRecentActivity)
```

Setelah tahap ini, ke-4 fungsi adapter masing-masing dipanggil lewat
guard `typeof` di **5 titik** di `dashboard-v2-shell.js`: Hero (V2.17,
tidak berubah), Summary Cards (V2.18, tidak berubah), Module Grid
(V2.19, tidak berubah), Statistics Panel (V2.20, tidak berubah), dan
Recent Activity (V2.21, baru). `dashboard-v2-data-adapter.js` sendiri
tetap 1 lapisan tunggal yang sama, dipanggil dari 5 tempat berbeda
tanpa duplikasi logic.

## Constraint yang dijaga (diverifikasi test)

- **Additive** — 5 baris Recent Activity lama (V2.6) tidak diedit satu
  baris pun; Hero (V2.17), Summary Cards (V2.18), Module Grid (V2.19)
  dan Statistics Panel (V2.20) serta sub-komponen Main lain (Quick
  Actions s/d Automation Center) tidak disentuh;
  `dashboard-v2-data-adapter.js` tidak diedit sama sekali (diverifikasi
  `diff` byte-identik terhadap baseline V2.16/V2.17/V2.18/V2.19/V2.20 +
  test tanda tangan API: tetap persis 4 fungsi publik + 1 guard
  internal, tanpa `let`/`var` top-level baru).
- **Tanpa fetch** — tidak ada token `fetch(` di kode aktif
  `dashboard-v2-shell.js` (diverifikasi test regex).
- **Tanpa business logic baru** — Recent Activity murni
  menginterpolasi field yang sudah dihitung adapter (`accountCount`,
  `totalBalance`, dst) ke dalam template string; tidak ada
  kalkulasi/agregasi baru di shell.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tanpa state baru** — tidak ada property `this.*` instance baru di
  `DashboardV2Shell`; 4 elemen baru murni `const` lokal di dalam
  `_buildRecentActivity()`, sama seperti 5 baris lama.
- **Tanpa mengubah adapter** — `dashboard-v2-data-adapter.js` tidak
  disentuh sama sekali tahap ini; shell hanya *memanggilnya*, dari 5
  lokasi (Hero + Summary Cards + Module Grid + Statistics Panel +
  Recent Activity).
- **Fallback placeholder wajib** — ke-4 elemen baru SELALU punya
  `textContent` non-kosong, baik saat adapter tidak ter-load, adapter
  return `null` (mis. `D` belum ada), maupun adapter tersedia dgn data
  lengkap — tidak ada state "kosong/undefined" yang mungkin ter-render.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.

## Perbaikan assertion lama

- 2 assertion di `tests/dashboard-v2-activity.test.js` yang menghitung
  `activity.children.length` disesuaikan dari `5` menjadi `9`,
  satu-satunya alasan: jumlah anak Recent Activity bertambah dari
  penambahan additive tahap ini.
- 1 assertion di `tests/dashboard-v2-summary.test.js`
  (`recentActivity.children.length`) disesuaikan dari `5` menjadi `9`,
  alasan yang sama.
- 3 assertion constraint (guard-count per fungsi adapter) di
  `tests/dashboard-v2-summary-data.test.js`,
  `tests/dashboard-v2-module-grid-data.test.js` &
  `tests/dashboard-v2-statistics-data.test.js` diperbarui dari "tepat
  4x" menjadi "tepat 5x", karena `_buildRecentActivity()` sekarang
  menambah 1 titik pemanggilan guard baru per fungsi adapter — bukan
  perubahan pada logic pengujian, murni angka yang harus disesuaikan
  akibat penambahan additive tahap ini.

## Test

`tests/dashboard-v2-recent-activity-data.test.js` — 18 test baru:

1. Adapter tidak di-load sama sekali → 4 elemen baru tetap ada dgn
   fallback placeholder (Recent Activity 9 anak).
2. 5 baris lama (item1-item5) tidak berubah.
3. Fungsi adapter tersedia tapi return `null` → tetap fallback
   placeholder, tidak error.
4–7. Masing-masing dari 4 fungsi adapter (di-mock individual) tersedia
   & ada data → elemen terkait menampilkan ringkasan sungguhan (bukan
   placeholder).
8–10. Integrasi sungguhan: `dashboard-v2-data-adapter.js` ASLI (tidak
   di-mock) + `dashboard-v2-shell.js` dalam satu sandbox, dgn `D`
   tiruan — kasus ada data (verifikasi angka di tiap 4 elemen cocok
   hasil hitung adapter dari `D`), kasus `D` belum ter-load (fallback),
   dan idempotency `render()`.
11. Aksesibilitas — 4 elemen baru semuanya punya `aria-label`.
12–14. Constraint statis: tanpa `fetch(`/`showPage(`/`FEATURE_REGISTRY`/
   `D.` langsung/`innerHTML` di `dashboard-v2-shell.js`; adapter tetap
   4 fungsi publik yang sama tanpa `let`/`var` top-level baru; ke-4
   fungsi adapter dipanggil lewat guard `typeof` tepat 5x (Hero +
   Summary Cards + Module Grid + Statistics Panel + Recent Activity).
15. Hero (V2.17), Summary Cards (V2.18), Module Grid (V2.19) &
   Statistics Panel (V2.20) tidak ikut berubah oleh V2.21.
16–17. `index.html`/`app_production.html` tetap 0 markup Dashboard V2.
18. `dashboard-hub.js` tetap tidak berubah/tidak direferensikan (guard
   mount/destroy tetap tepat 2x).

## Hasil test

```
node --test tests/dashboard-v2-recent-activity-data.test.js
# tests 18
# pass 18
# fail 0

node --test
# tests 1714
# pass 1714
# fail 0
```
