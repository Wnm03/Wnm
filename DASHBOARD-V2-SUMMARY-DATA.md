# Dashboard V2 — Tahap V2.18 (Summary Cards Data Integration)

Baseline: `node --test` 1642/1642 PASS (akhir Tahap V2.17 — Hero Data
Integration).
Hasil tahap ini: `node --test` **1660/1660 PASS** (+18 test baru, 0
regresi).

Referensi: instruksi sesi ini ("V2.18 — Summary Cards Data
Integration"), `DASHBOARD-V2-HERO-DATA.md` (V2.17, pola yang diikuti),
`DASHBOARD-V2-DATA-ADAPTER.md` (V2.16), `DASHBOARD-V2-SUMMARY.md`
(V2.3).

## Tujuan

Dashboard V2 mulai memakai `dashboard-v2-data-adapter.js` (V2.16) di
Summary Cards, mengikuti pola persis Tahap V2.17 (Hero Data
Integration). Bagian lain (Hero, Module Grid, Insight Panel, Recent
Activity, Statistics, Upcoming Tasks, Notifications, AI Command
Center, Health Score, Predictive Insights, Automation Center) TIDAK
disentuh sama sekali.

## Yang diubah

**Satu fungsi disentuh: `_buildSummaryCards()` di
`dashboard-v2-shell.js`.** Tidak ada fungsi lain yang diedit.

### Summary Cards — sebelum (Tahap V2.3, 4 anak, TIDAK berubah)

| Elemen | id | Isi |
|---|---|---|
| Total Balance | `dashboardV2SummaryCardBalance` | teks statis placeholder |
| Monthly Income | `dashboardV2SummaryCardIncome` | teks statis placeholder |
| Monthly Expense | `dashboardV2SummaryCardExpense` | teks statis placeholder |
| Health Score | `dashboardV2SummaryCardHealth` | teks statis placeholder |

### Summary Cards — ditambah tahap ini (4 anak baru, additive)

| Elemen | id | Sumber | Isi kalau adapter tersedia & ada data | Isi fallback |
|---|---|---|---|---|
| Finance summary | `dashboardV2SummaryCardFinanceData` | `getFinanceSummary()` | `Keuangan: {accountCount} akun, Rp {totalBalance}, {transactionCount} transaksi` | `Keuangan: -- (placeholder)` |
| Vehicle summary | `dashboardV2SummaryCardVehicleData` | `getVehicleSummary()` | `Kendaraan: {vehicleCount} kendaraan, {bbmLogCount} catatan BBM, {servisLogCount} catatan servis` | `Kendaraan: -- (placeholder)` |
| Family summary | `dashboardV2SummaryCardFamilyData` | `getFamilySummary()` | `Keluarga: {anakCount} anak, {milestoneDoneCount}/{milestoneTotalCount} milestone, {reminderCount} pengingat` | `Keluarga: -- (placeholder)` |
| Document summary | `dashboardV2SummaryCardDocumentData` | `getDocumentSummary()` | `Dokumen: {simCount} SIM, {vehicleTaxDocCount} dokumen pajak kendaraan` | `Dokumen: -- (placeholder)` |

Summary Cards jadi total **8 anak** (4 lama + 4 baru). Urutan: balance,
income, expense, health, financeData, vehicleData, familyData,
documentData — dirender lewat `section.replaceChildren()` seperti
sebelumnya, tidak ada `innerHTML`.

### Cara pemanggilan adapter

```js
const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
```

Pola guard ini identik dengan yang dipakai `_buildHero()` (Tahap
V2.17) dan `isDashboardV2Enabled()` (Tahap V2.14B) — fungsi global
dipanggil langsung (bukan `window.fn()`), dilindungi `typeof fn ===
'function'`. Kalau hasilnya bukan objek (mis. `null`, karena adapter
belum melihat `D`, atau adapter belum ter-load sama sekali di
halaman), elemen jatuh ke teks placeholder. Shell **tidak pernah
membaca `D` secara langsung** — satu-satunya jalur baca data tetap
lewat 4 fungsi adapter, konsisten dengan arsitektur
`DASHBOARD-V2-DATA-ADAPTER.md`:

```
D  ──(baca-saja)──▶  dashboard-v2-data-adapter.js  ──(baca-saja, guard typeof)──▶  dashboard-v2-shell.js (_buildHero + _buildSummaryCards)
```

Setelah tahap ini, ke-4 fungsi adapter masing-masing dipanggil lewat
guard `typeof` di **2 titik** di `dashboard-v2-shell.js`: Hero
(V2.17, tidak berubah) dan Summary Cards (V2.18, baru).
`dashboard-v2-data-adapter.js` sendiri tetap 1 lapisan tunggal yang
sama, dipanggil dari 2 tempat berbeda tanpa duplikasi logic.

## Constraint yang dijaga (diverifikasi test)

- **Additive** — 4 kartu Summary Cards lama (V2.3) tidak diedit satu
  baris pun; Hero (V2.17) dan sub-komponen Main lain (Quick Actions
  s/d Automation Center) tidak disentuh; `dashboard-v2-data-adapter.js`
  tidak diedit sama sekali (diverifikasi `diff` byte-identik terhadap
  baseline V2.16/V2.17 + test tanda tangan API: tetap persis 4 fungsi
  publik + 1 guard internal, tanpa `let`/`var` top-level baru).
- **Tanpa fetch** — tidak ada token `fetch(` di kode aktif
  `dashboard-v2-shell.js` (diverifikasi test regex).
- **Tanpa business logic baru** — Summary Cards murni menginterpolasi
  field yang sudah dihitung adapter (`accountCount`, `totalBalance`,
  dst) ke dalam template string; tidak ada kalkulasi/agregasi baru di
  shell.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tanpa state baru** — tidak ada property `this.*` instance baru di
  `DashboardV2Shell`; 4 elemen baru murni `const` lokal di dalam
  `_buildSummaryCards()`, sama seperti 4 kartu lama.
- **Tanpa mengubah adapter** — `dashboard-v2-data-adapter.js` tidak
  disentuh sama sekali tahap ini; shell hanya *memanggilnya*, dari 2
  lokasi (Hero + Summary Cards).
- **Fallback placeholder wajib** — ke-4 elemen baru SELALU punya
  `textContent` non-kosong, baik saat adapter tidak ter-load, adapter
  return `null` (mis. `D` belum ada), maupun adapter tersedia dgn data
  lengkap — tidak ada state "kosong/undefined" yang mungkin ter-render.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.

## Perbaikan assertion lama

2 assertion di `tests/dashboard-v2-summary.test.js` yang menghitung
`cards.children.length` disesuaikan dari `4` menjadi `8` (satu-satunya
alasan: jumlah anak Summary Cards bertambah dari penambahan additive
tahap ini). Tidak ada assertion lain yang diubah — assertion yang
mendestrukturisasi 4 kartu lama lewat `const [balance, income,
expense, health] = cards.children` tetap valid tanpa perubahan karena
4 kartu lama masih di 4 posisi pertama.

## Test

`tests/dashboard-v2-summary-data.test.js` — 18 test baru:

1. Adapter tidak di-load sama sekali → 4 elemen baru tetap ada dgn
   fallback placeholder (Summary Cards 8 anak).
2. 4 kartu lama (Total Balance/Monthly Income/Monthly Expense/Health
   Score) tidak berubah.
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
   fungsi adapter dipanggil lewat guard `typeof` tepat 2x (Hero +
   Summary Cards).
15. Hero (V2.17) tidak ikut berubah oleh V2.18 (tetap 8 anak).
16–17. `index.html`/`app_production.html` tetap 0 markup Dashboard V2.
18. `dashboard-hub.js` tetap tidak berubah/tidak direferensikan (guard
   mount/destroy tetap tepat 2x).
