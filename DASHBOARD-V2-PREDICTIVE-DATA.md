# Dashboard V2 — Tahap V2.27 (Predictive Insights Data Integration)

Baseline: `node --test` 1804/1804 PASS (akhir Tahap V2.26 — Health
Score Data Integration).
Hasil tahap ini: `node --test` **1822/1822 PASS** (+18 test baru, 0
regresi).

Referensi: `DASHBOARD-V2-HEALTH-DATA.md` (V2.26, pola yang diikuti),
`DASHBOARD-V2-AI-DATA.md` (V2.25), `DASHBOARD-V2-AUTOMATION-DATA.md`
(V2.24), `DASHBOARD-V2-NOTIFICATIONS-DATA.md` (V2.23), `DASHBOARD-V2-
UPCOMING-TASKS-DATA.md` (V2.22), `DASHBOARD-V2-RECENT-ACTIVITY-
DATA.md` (V2.21), `DASHBOARD-V2-STATISTICS-DATA.md` (V2.20),
`DASHBOARD-V2-MODULE-GRID-DATA.md` (V2.19), `DASHBOARD-V2-SUMMARY-
DATA.md` (V2.18), `DASHBOARD-V2-HERO-DATA.md` (V2.17), `DASHBOARD-V2-
DATA-ADAPTER.md` (V2.16), Tahap V2.12 (Predictive Insights UI awal,
`DASHBOARD-V2-PREDICTIVE.md`).

## Tujuan

Dashboard V2 mulai memakai `dashboard-v2-data-adapter.js` (V2.16) di
Predictive Insights, mengikuti pola persis Tahap V2.17 (Hero), V2.18
(Summary Cards), V2.19 (Module Grid), V2.20 (Statistics Panel), V2.21
(Recent Activity), V2.22 (Upcoming Tasks), V2.23 (Notifications), V2.24
(Automation Center), V2.25 (AI Command Center) & V2.26 (Health Score).
Bagian lain (Hero, Summary Cards, Quick Actions, Module Grid, Insight
Panel, Recent Activity, Statistics Panel, Upcoming Tasks,
Notifications, Automation Center, AI Command Center, Health Score)
TIDAK disentuh sama sekali.

## Yang diubah

**Satu fungsi disentuh: `_buildPredictiveInsights()` di
`dashboard-v2-shell.js`.** Tidak ada fungsi lain yang diedit.

### Predictive Insights — sebelum (Tahap V2.12, 5 anak, TIDAK berubah)

| Elemen | id | Isi |
|---|---|---|
| Kartu Cash Flow Forecast | `dashboardV2PredictiveInsightsCardCashFlowForecast` | `<button disabled>` icon+title+prediction+confidence+recommendation placeholder |
| Kartu Budget Trend | `dashboardV2PredictiveInsightsCardBudgetTrend` | idem |
| Kartu Vehicle Maintenance Prediction | `dashboardV2PredictiveInsightsCardVehicleMaintenancePrediction` | idem |
| Kartu Family Schedule Prediction | `dashboardV2PredictiveInsightsCardFamilySchedulePrediction` | idem |
| Kartu Document Expiration Prediction | `dashboardV2PredictiveInsightsCardDocumentExpirationPrediction` | idem |

### Predictive Insights — ditambah tahap ini (4 anak baru, additive)

| Elemen | id | Sumber | Isi kalau adapter tersedia & ada data | Isi fallback |
|---|---|---|---|---|
| Finance summary | `dashboardV2PredictiveFinanceData` | `getFinanceSummary()` | `Keuangan: {accountCount} akun, Rp {totalBalance}, {transactionCount} transaksi` | `Keuangan: -- (placeholder)` |
| Vehicle summary | `dashboardV2PredictiveVehicleData` | `getVehicleSummary()` | `Kendaraan: {vehicleCount} kendaraan, {bbmLogCount} catatan BBM, {servisLogCount} catatan servis` | `Kendaraan: -- (placeholder)` |
| Family summary | `dashboardV2PredictiveFamilyData` | `getFamilySummary()` | `Keluarga: {anakCount} anak, {milestoneDoneCount}/{milestoneTotalCount} milestone, {reminderCount} pengingat` | `Keluarga: -- (placeholder)` |
| Document summary | `dashboardV2PredictiveDocumentData` | `getDocumentSummary()` | `Dokumen: {simCount} SIM, {vehicleTaxDocCount} dokumen pajak kendaraan` | `Dokumen: -- (placeholder)` |

Predictive Insights jadi total **9 anak** (5 kartu lama + 4 baru).
Urutan: cashFlowForecast, budgetTrend, vehicleMaintenancePrediction,
familySchedulePrediction, documentExpirationPrediction, financeData,
vehicleData, familyData, documentData — dirender lewat
`section.replaceChildren()` seperti sebelumnya, tidak ada `innerHTML`.
4 elemen baru dibuat dengan `document.createElement('div')` dan
memakai `className: 'dashboard-v2-predictive-data-card'` — kelas baru
namun mengikuti pola yang sama persis dgn `_buildStatisticsPanel()`
(V2.20), `_buildRecentActivity()` (V2.21), `_buildUpcomingTasks()`
(V2.22), `_buildNotifications()` (V2.23), `_buildAutomationCenter()`
(V2.24), `_buildAiCommandCenter()` (V2.25) & `_buildHealthScore()`
(V2.26), di mana elemen data baru berbentuk `<div>` polos (bukan
`<button>`), karena murni menampilkan teks ringkasan tanpa interaksi
apa pun (5 kartu lama Predictive Insights tetap `<button type="button"
disabled>`, tidak berubah).

### Cara pemanggilan adapter

```js
const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
```

Pola guard ini identik dengan yang dipakai `_buildHero()` (V2.17),
`_buildSummaryCards()` (V2.18), `_buildModuleGrid()` (V2.19),
`_buildStatisticsPanel()` (V2.20), `_buildRecentActivity()` (V2.21),
`_buildUpcomingTasks()` (V2.22), `_buildNotifications()` (V2.23),
`_buildAutomationCenter()` (V2.24), `_buildAiCommandCenter()` (V2.25)
& `_buildHealthScore()` (V2.26) — fungsi global dipanggil langsung
(bukan `window.fn()`), dilindungi `typeof fn === 'function'`. Kalau
hasilnya bukan objek (mis. `null`, karena adapter belum melihat `D`,
atau adapter belum ter-load sama sekali di halaman), elemen jatuh ke
teks placeholder "--". Shell **tidak pernah membaca `D` secara
langsung** — satu-satunya jalur baca data tetap lewat 4 fungsi
adapter, konsisten dengan arsitektur `DASHBOARD-V2-DATA-ADAPTER.md`:

```
D  ──(baca-saja)──▶  dashboard-v2-data-adapter.js  ──(baca-saja, guard typeof)──▶  dashboard-v2-shell.js (_buildHero + _buildSummaryCards + _buildModuleGrid + _buildStatisticsPanel + _buildRecentActivity + _buildUpcomingTasks + _buildNotifications + _buildAutomationCenter + _buildAiCommandCenter + _buildHealthScore + _buildPredictiveInsights)
```

Setelah tahap ini, ke-4 fungsi adapter masing-masing dipanggil lewat
guard `typeof` di **11 titik** di `dashboard-v2-shell.js`: Hero
(V2.17, tidak berubah), Summary Cards (V2.18, tidak berubah), Module
Grid (V2.19, tidak berubah), Statistics Panel (V2.20, tidak berubah),
Recent Activity (V2.21, tidak berubah), Upcoming Tasks (V2.22, tidak
berubah), Notifications (V2.23, tidak berubah), Automation Center
(V2.24, tidak berubah), AI Command Center (V2.25, tidak berubah),
Health Score (V2.26, tidak berubah), dan Predictive Insights (V2.27,
baru). `dashboard-v2-data-adapter.js` sendiri tetap 1 lapisan tunggal
yang sama, dipanggil dari 11 tempat berbeda tanpa duplikasi logic.

## Constraint yang dijaga (diverifikasi test)

- **Additive** — 5 kartu Predictive Insights lama (V2.12) tidak
  diedit satu baris pun; Hero (V2.17), Summary Cards (V2.18), Module
  Grid (V2.19), Statistics Panel (V2.20), Recent Activity (V2.21),
  Upcoming Tasks (V2.22), Notifications (V2.23), Automation Center
  (V2.24), AI Command Center (V2.25) dan Health Score (V2.26) serta
  sub-komponen Main lain tidak disentuh; `dashboard-v2-data-adapter.js`
  tidak diedit sama sekali (diverifikasi `diff` byte-identik terhadap
  baseline V2.16..V2.26 + test tanda tangan API: tetap persis 4 fungsi
  publik + 1 guard internal, tanpa `let`/`var` top-level baru).
- **Tanpa fetch** — tidak ada token `fetch(` di kode aktif
  `dashboard-v2-shell.js` (diverifikasi test regex).
- **Tanpa business logic baru** — Predictive Insights murni
  menginterpolasi field yang sudah dihitung adapter (`accountCount`,
  `totalBalance`, dst) ke dalam template string; tidak ada
  kalkulasi/agregasi baru di shell, tidak ada AI/API sungguhan.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tanpa state baru** — tidak ada property `this.*` instance baru di
  `DashboardV2Shell`; 4 elemen baru murni `const` lokal di dalam
  `_buildPredictiveInsights()`, sama seperti elemen lama, dan digabung
  ke array baru (`[...cards, financeEl, vehicleEl, familyEl,
  documentEl]`) sebelum `replaceChildren()`.
- **Tanpa mengubah adapter** — `dashboard-v2-data-adapter.js` tidak
  disentuh sama sekali tahap ini; shell hanya *memanggilnya*, dari 11
  lokasi (Hero + Summary Cards + Module Grid + Statistics Panel +
  Recent Activity + Upcoming Tasks + Notifications + Automation Center
  + AI Command Center + Health Score + Predictive Insights).
- **Fallback placeholder wajib** — ke-4 elemen baru SELALU punya
  `textContent` non-kosong, baik saat adapter tidak ter-load, adapter
  return `null` (mis. `D` belum ada), maupun adapter tersedia dgn data
  lengkap — tidak ada state "kosong/undefined" yang mungkin ter-render.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.

## Perbaikan assertion lama

- 2 assertion di `tests/dashboard-v2-predictive.test.js` yang
  menghitung `section.children.length` disesuaikan dari `5` menjadi
  `9`, satu-satunya alasan: jumlah anak Predictive Insights bertambah
  dari penambahan additive tahap ini.
- 9 assertion constraint (guard-count per fungsi adapter) di
  `tests/dashboard-v2-summary-data.test.js`,
  `tests/dashboard-v2-module-grid-data.test.js`,
  `tests/dashboard-v2-statistics-data.test.js`,
  `tests/dashboard-v2-recent-activity-data.test.js`,
  `tests/dashboard-v2-upcoming-tasks-data.test.js`,
  `tests/dashboard-v2-notifications-data.test.js`,
  `tests/dashboard-v2-automation-data.test.js`,
  `tests/dashboard-v2-ai-data.test.js` &
  `tests/dashboard-v2-health-data.test.js` diperbarui dari "tepat 10x"
  menjadi "tepat 11x", karena `_buildPredictiveInsights()` sekarang
  menambah 1 titik pemanggilan guard baru per fungsi adapter — bukan
  perubahan pada logic pengujian, murni angka yang harus disesuaikan
  akibat penambahan additive tahap ini.

## Test

`tests/dashboard-v2-predictive-data.test.js` — 18 test baru:

1. Adapter tidak di-load sama sekali → 4 elemen baru tetap ada dgn
   fallback placeholder (Predictive Insights 9 anak).
2. 5 kartu lama (Tahap V2.12) tidak berubah.
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
   fungsi adapter dipanggil lewat guard `typeof` tepat 11x (Hero +
   Summary Cards + Module Grid + Statistics Panel + Recent Activity +
   Upcoming Tasks + Notifications + Automation Center + AI Command
   Center + Health Score + Predictive Insights).
15. Hero (V2.17), Summary Cards (V2.18), Module Grid (V2.19),
   Statistics Panel (V2.20), Recent Activity (V2.21), Upcoming Tasks
   (V2.22), Notifications (V2.23), Automation Center (V2.24), AI
   Command Center (V2.25) & Health Score (V2.26) tidak ikut berubah
   oleh V2.27.
16–17. `index.html`/`app_production.html` tetap 0 markup Dashboard V2.
18. `dashboard-hub.js` tetap tidak berubah/tidak direferensikan (guard
   mount/destroy tetap tepat 2x).

## Hasil test

```
node --test tests/dashboard-v2-predictive-data.test.js
# tests 18
# pass 18
# fail 0

node --test
# tests 1822
# pass 1822
# fail 0
```
