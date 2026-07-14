# Dashboard V2 — Tahap V2.19 (Module Grid Data Integration)

Baseline: `node --test` 1660/1660 PASS (akhir Tahap V2.18 — Summary
Cards Data Integration).
Hasil tahap ini: `node --test` **1678/1678 PASS** (+18 test baru, 0
regresi).

Referensi: instruksi sesi ini ("V2.19 — Module Grid Data
Integration"), `DASHBOARD-V2-SUMMARY-DATA.md` (V2.18, pola yang
diikuti), `DASHBOARD-V2-HERO-DATA.md` (V2.17), `DASHBOARD-V2-DATA-
ADAPTER.md` (V2.16), `DASHBOARD-V2-SUMMARY.md` (V2.4, Module Grid
awal).

## Tujuan

Dashboard V2 mulai memakai `dashboard-v2-data-adapter.js` (V2.16) di
Module Grid, mengikuti pola persis Tahap V2.17 (Hero) & V2.18 (Summary
Cards). Bagian lain (Hero, Summary Cards, Quick Actions, Insight
Panel, Recent Activity, Statistics, Upcoming Tasks, Notifications, AI
Command Center, Health Score, Predictive Insights, Automation Center)
TIDAK disentuh sama sekali.

## Yang diubah

**Satu fungsi disentuh: `_buildModuleGrid()` di
`dashboard-v2-shell.js`.** Tidak ada fungsi lain yang diedit.

### Module Grid — sebelum (Tahap V2.4, 6 anak, TIDAK berubah)

| Elemen | id | Isi |
|---|---|---|
| Finance | `dashboardV2ModuleGridFinance` | teks statis placeholder |
| Vehicle | `dashboardV2ModuleGridVehicle` | teks statis placeholder |
| Reports | `dashboardV2ModuleGridReports` | teks statis placeholder |
| Family | `dashboardV2ModuleGridFamily` | teks statis placeholder |
| Documents | `dashboardV2ModuleGridDocuments` | teks statis placeholder |
| Settings | `dashboardV2ModuleGridSettings` | teks statis placeholder |

### Module Grid — ditambah tahap ini (4 anak baru, additive)

| Elemen | id | Sumber | Isi kalau adapter tersedia & ada data | Isi fallback |
|---|---|---|---|---|
| Finance summary | `dashboardV2ModuleGridFinanceData` | `getFinanceSummary()` | `Keuangan: {accountCount} akun, Rp {totalBalance}, {transactionCount} transaksi` | `Keuangan: -- (placeholder)` |
| Vehicle summary | `dashboardV2ModuleGridVehicleData` | `getVehicleSummary()` | `Kendaraan: {vehicleCount} kendaraan, {bbmLogCount} catatan BBM, {servisLogCount} catatan servis` | `Kendaraan: -- (placeholder)` |
| Family summary | `dashboardV2ModuleGridFamilyData` | `getFamilySummary()` | `Keluarga: {anakCount} anak, {milestoneDoneCount}/{milestoneTotalCount} milestone, {reminderCount} pengingat` | `Keluarga: -- (placeholder)` |
| Document summary | `dashboardV2ModuleGridDocumentData` | `getDocumentSummary()` | `Dokumen: {simCount} SIM, {vehicleTaxDocCount} dokumen pajak kendaraan` | `Dokumen: -- (placeholder)` |

Module Grid jadi total **10 anak** (6 lama + 4 baru). Urutan: finance,
vehicle, reports, family, documents, settings, financeData,
vehicleData, familyData, documentData — dirender lewat
`section.replaceChildren()` seperti sebelumnya, tidak ada `innerHTML`.

Catatan: Reports & Settings sengaja tidak mendapat elemen data baru —
`dashboard-v2-data-adapter.js` tidak punya fungsi ringkasan untuk 2
domain itu (adapter hanya menyediakan 4 fungsi: Finance, Vehicle,
Family, Document). Ini konsisten dengan constraint "tanpa business
logic baru" — tidak dibuat fungsi ringkasan baru untuk Reports/
Settings di luar adapter.

### Cara pemanggilan adapter

```js
const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
```

Pola guard ini identik dengan yang dipakai `_buildHero()` (V2.17) dan
`_buildSummaryCards()` (V2.18) — fungsi global dipanggil langsung
(bukan `window.fn()`), dilindungi `typeof fn === 'function'`. Kalau
hasilnya bukan objek (mis. `null`, karena adapter belum melihat `D`,
atau adapter belum ter-load sama sekali di halaman), elemen jatuh ke
teks placeholder. Shell **tidak pernah membaca `D` secara langsung** —
satu-satunya jalur baca data tetap lewat 4 fungsi adapter, konsisten
dengan arsitektur `DASHBOARD-V2-DATA-ADAPTER.md`:

```
D  ──(baca-saja)──▶  dashboard-v2-data-adapter.js  ──(baca-saja, guard typeof)──▶  dashboard-v2-shell.js (_buildHero + _buildSummaryCards + _buildModuleGrid)
```

Setelah tahap ini, ke-4 fungsi adapter masing-masing dipanggil lewat
guard `typeof` di **3 titik** di `dashboard-v2-shell.js`: Hero (V2.17,
tidak berubah), Summary Cards (V2.18, tidak berubah), dan Module Grid
(V2.19, baru). `dashboard-v2-data-adapter.js` sendiri tetap 1 lapisan
tunggal yang sama, dipanggil dari 3 tempat berbeda tanpa duplikasi
logic.

## Constraint yang dijaga (diverifikasi test)

- **Additive** — 6 kartu Module Grid lama (V2.4) tidak diedit satu
  baris pun; Hero (V2.17) dan Summary Cards (V2.18) serta
  sub-komponen Main lain (Quick Actions s/d Automation Center) tidak
  disentuh; `dashboard-v2-data-adapter.js` tidak diedit sama sekali
  (diverifikasi `diff` byte-identik terhadap baseline V2.16/V2.17/
  V2.18 + test tanda tangan API: tetap persis 4 fungsi publik + 1
  guard internal, tanpa `let`/`var` top-level baru).
- **Tanpa fetch** — tidak ada token `fetch(` di kode aktif
  `dashboard-v2-shell.js` (diverifikasi test regex).
- **Tanpa business logic baru** — Module Grid murni menginterpolasi
  field yang sudah dihitung adapter (`accountCount`, `totalBalance`,
  dst) ke dalam template string; tidak ada kalkulasi/agregasi baru di
  shell; tidak ada fungsi ringkasan baru dibuat untuk Reports/
  Settings.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tanpa state baru** — tidak ada property `this.*` instance baru di
  `DashboardV2Shell`; 4 elemen baru murni `const` lokal di dalam
  `_buildModuleGrid()`, sama seperti 6 kartu lama.
- **Tanpa mengubah adapter** — `dashboard-v2-data-adapter.js` tidak
  disentuh sama sekali tahap ini; shell hanya *memanggilnya*, dari 3
  lokasi (Hero + Summary Cards + Module Grid).
- **Fallback placeholder wajib** — ke-4 elemen baru SELALU punya
  `textContent` non-kosong, baik saat adapter tidak ter-load, adapter
  return `null` (mis. `D` belum ada), maupun adapter tersedia dgn data
  lengkap — tidak ada state "kosong/undefined" yang mungkin ter-render.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.

## Perbaikan assertion lama

- 2 assertion di `tests/dashboard-v2-summary.test.js` yang menghitung
  `moduleGrid.children.length`/`grid.children.length` disesuaikan dari
  `6` menjadi `10` (satu-satunya alasan: jumlah anak Module Grid
  bertambah dari penambahan additive tahap ini). Assertion yang
  mendestrukturisasi 6 kartu lama lewat `const [finance, vehicle,
  reports, family, documents, settings] = grid.children` tetap valid
  tanpa perubahan karena 6 kartu lama masih di 6 posisi pertama.
- 1 assertion di `tests/dashboard-v2-summary-data.test.js` (test
  constraint guard-count V2.18) diperbarui dari "tepat 2x per fungsi"
  menjadi "tepat 3x per fungsi", karena `_buildModuleGrid()` sekarang
  menambah 1 titik pemanggilan guard baru per fungsi adapter — bukan
  perubahan pada logic pengujian, murni angka yang harus disesuaikan
  akibat penambahan additive tahap ini.

## Test

`tests/dashboard-v2-module-grid-data.test.js` — 18 test baru:

1. Adapter tidak di-load sama sekali → 4 elemen baru tetap ada dgn
   fallback placeholder (Module Grid 10 anak).
2. 6 kartu lama (Finance/Vehicle/Reports/Family/Documents/Settings)
   tidak berubah.
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
   fungsi adapter dipanggil lewat guard `typeof` tepat 3x (Hero +
   Summary Cards + Module Grid).
15. Hero (V2.17) & Summary Cards (V2.18) tidak ikut berubah oleh V2.19.
16–17. `index.html`/`app_production.html` tetap 0 markup Dashboard V2.
18. `dashboard-hub.js` tetap tidak berubah/tidak direferensikan (guard
   mount/destroy tetap tepat 2x).
