# Dashboard V2 — Tahap V2.23 (Notifications Data Integration)

Baseline: `node --test` 1732/1732 PASS (akhir Tahap V2.22 — Upcoming
Tasks Data Integration).
Hasil tahap ini: `node --test` **1750/1750 PASS** (+18 test baru, 0
regresi).

Referensi: instruksi sesi ini ("V2.23 — Notifications Data
Integration"), `DASHBOARD-V2-UPCOMING-TASKS-DATA.md` (V2.22, pola
yang diikuti), `DASHBOARD-V2-RECENT-ACTIVITY-DATA.md` (V2.21),
`DASHBOARD-V2-STATISTICS-DATA.md` (V2.20), `DASHBOARD-V2-MODULE-GRID-
DATA.md` (V2.19), `DASHBOARD-V2-SUMMARY-DATA.md` (V2.18),
`DASHBOARD-V2-HERO-DATA.md` (V2.17), `DASHBOARD-V2-DATA-ADAPTER.md`
(V2.16), Tahap V2.9 (Notifications Center awal).

## Tujuan

Dashboard V2 mulai memakai `dashboard-v2-data-adapter.js` (V2.16) di
Notifications Center, mengikuti pola persis Tahap V2.17 (Hero), V2.18
(Summary Cards), V2.19 (Module Grid), V2.20 (Statistics Panel), V2.21
(Recent Activity) & V2.22 (Upcoming Tasks). Bagian lain (Hero, Summary
Cards, Quick Actions, Module Grid, Insight Panel, Recent Activity,
Statistics Panel, Upcoming Tasks, AI Command Center, Health Score,
Predictive Insights, Automation Center) TIDAK disentuh sama sekali.

## Yang diubah

**Satu fungsi disentuh: `_buildNotifications()` di
`dashboard-v2-shell.js`.** Tidak ada fungsi lain yang diedit.

### Notifications — sebelum (Tahap V2.9, 5 anak, TIDAK berubah)

| Elemen | id | Isi |
|---|---|---|
| Kartu Backup berhasil | `dashboardV2NotificationCardBackup` | `<button disabled>` placeholder, 4 sub-elemen (icon/title/description/timestamp) |
| Kartu Pengeluaran tinggi minggu ini | `dashboardV2NotificationCardPengeluaran` | idem |
| Kartu Jadwal servis mendekat | `dashboardV2NotificationCardServis` | idem |
| Kartu Laporan bulanan siap | `dashboardV2NotificationCardLaporan` | idem |
| Kartu Sinkronisasi selesai | `dashboardV2NotificationCardSinkronisasi` | idem |

### Notifications — ditambah tahap ini (4 anak baru, additive)

| Elemen | id | Sumber | Isi kalau adapter tersedia & ada data | Isi fallback |
|---|---|---|---|---|
| Finance summary | `dashboardV2NotificationsFinanceData` | `getFinanceSummary()` | `Keuangan: {accountCount} akun, Rp {totalBalance}, {transactionCount} transaksi` | `Keuangan: -- (placeholder)` |
| Vehicle summary | `dashboardV2NotificationsVehicleData` | `getVehicleSummary()` | `Kendaraan: {vehicleCount} kendaraan, {bbmLogCount} catatan BBM, {servisLogCount} catatan servis` | `Kendaraan: -- (placeholder)` |
| Family summary | `dashboardV2NotificationsFamilyData` | `getFamilySummary()` | `Keluarga: {anakCount} anak, {milestoneDoneCount}/{milestoneTotalCount} milestone, {reminderCount} pengingat` | `Keluarga: -- (placeholder)` |
| Document summary | `dashboardV2NotificationsDocumentData` | `getDocumentSummary()` | `Dokumen: {simCount} SIM, {vehicleTaxDocCount} dokumen pajak kendaraan` | `Dokumen: -- (placeholder)` |

Notifications jadi total **9 anak** (5 lama + 4 baru). Urutan: kartu
backup, pengeluaran, servis, laporan, sinkronisasi, financeData,
vehicleData, familyData, documentData — dirender lewat
`section.replaceChildren()` seperti sebelumnya, tidak ada `innerHTML`.
4 elemen baru dibuat dengan `document.createElement('div')` dan
memakai `className: 'dashboard-v2-notification-card'` yang sama dgn 5
kartu lama (yang masing-masing `<button type="button" disabled>`) —
konsisten dgn pola yang dipakai `_buildStatisticsPanel()` (V2.20),
`_buildRecentActivity()` (V2.21) & `_buildUpcomingTasks()` (V2.22), di
mana elemen data baru berbentuk `<div>` polos (bukan `<button>`),
karena murni menampilkan teks ringkasan tanpa interaksi apa pun.

### Cara pemanggilan adapter

```js
const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
```

Pola guard ini identik dengan yang dipakai `_buildHero()` (V2.17),
`_buildSummaryCards()` (V2.18), `_buildModuleGrid()` (V2.19),
`_buildStatisticsPanel()` (V2.20), `_buildRecentActivity()` (V2.21) &
`_buildUpcomingTasks()` (V2.22) — fungsi global dipanggil langsung
(bukan `window.fn()`), dilindungi `typeof fn === 'function'`. Kalau
hasilnya bukan objek (mis. `null`, karena adapter belum melihat `D`,
atau adapter belum ter-load sama sekali di halaman), elemen jatuh ke
teks placeholder "--". Shell **tidak pernah membaca `D` secara
langsung** — satu-satunya jalur baca data tetap lewat 4 fungsi adapter,
konsisten dengan arsitektur `DASHBOARD-V2-DATA-ADAPTER.md`:

```
D  ──(baca-saja)──▶  dashboard-v2-data-adapter.js  ──(baca-saja, guard typeof)──▶  dashboard-v2-shell.js (_buildHero + _buildSummaryCards + _buildModuleGrid + _buildStatisticsPanel + _buildRecentActivity + _buildUpcomingTasks + _buildNotifications)
```

Setelah tahap ini, ke-4 fungsi adapter masing-masing dipanggil lewat
guard `typeof` di **7 titik** di `dashboard-v2-shell.js`: Hero (V2.17,
tidak berubah), Summary Cards (V2.18, tidak berubah), Module Grid
(V2.19, tidak berubah), Statistics Panel (V2.20, tidak berubah),
Recent Activity (V2.21, tidak berubah), Upcoming Tasks (V2.22, tidak
berubah), dan Notifications (V2.23, baru). `dashboard-v2-data-
adapter.js` sendiri tetap 1 lapisan tunggal yang sama, dipanggil dari
7 tempat berbeda tanpa duplikasi logic.

## Constraint yang dijaga (diverifikasi test)

- **Additive** — 5 kartu Notifications lama (V2.9) tidak diedit satu
  baris pun; Hero (V2.17), Summary Cards (V2.18), Module Grid (V2.19),
  Statistics Panel (V2.20), Recent Activity (V2.21) dan Upcoming Tasks
  (V2.22) serta sub-komponen Main lain (AI Command Center s/d
  Automation Center) tidak disentuh; `dashboard-v2-data-adapter.js`
  tidak diedit sama sekali (diverifikasi `diff` byte-identik terhadap
  baseline V2.16/V2.17/V2.18/V2.19/V2.20/V2.21/V2.22 + test tanda
  tangan API: tetap persis 4 fungsi publik + 1 guard internal, tanpa
  `let`/`var` top-level baru).
- **Tanpa fetch** — tidak ada token `fetch(` di kode aktif
  `dashboard-v2-shell.js` (diverifikasi test regex).
- **Tanpa business logic baru** — Notifications murni menginterpolasi
  field yang sudah dihitung adapter (`accountCount`, `totalBalance`,
  dst) ke dalam template string; tidak ada kalkulasi/agregasi baru di
  shell.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tanpa state baru** — tidak ada property `this.*` instance baru di
  `DashboardV2Shell`; 4 elemen baru murni `const` lokal di dalam
  `_buildNotifications()`, sama seperti 5 kartu lama.
- **Tanpa mengubah adapter** — `dashboard-v2-data-adapter.js` tidak
  disentuh sama sekali tahap ini; shell hanya *memanggilnya*, dari 7
  lokasi (Hero + Summary Cards + Module Grid + Statistics Panel +
  Recent Activity + Upcoming Tasks + Notifications).
- **Fallback placeholder wajib** — ke-4 elemen baru SELALU punya
  `textContent` non-kosong, baik saat adapter tidak ter-load, adapter
  return `null` (mis. `D` belum ada), maupun adapter tersedia dgn data
  lengkap — tidak ada state "kosong/undefined" yang mungkin ter-render.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.

## Perbaikan assertion lama

- 2 assertion di `tests/dashboard-v2-notifications.test.js` yang
  menghitung `section.children.length` disesuaikan dari `5` menjadi
  `9`, satu-satunya alasan: jumlah anak Notifications bertambah dari
  penambahan additive tahap ini.
- 5 assertion constraint (guard-count per fungsi adapter) di
  `tests/dashboard-v2-summary-data.test.js`,
  `tests/dashboard-v2-module-grid-data.test.js`,
  `tests/dashboard-v2-statistics-data.test.js`,
  `tests/dashboard-v2-recent-activity-data.test.js` &
  `tests/dashboard-v2-upcoming-tasks-data.test.js` diperbarui dari
  "tepat 6x" menjadi "tepat 7x", karena `_buildNotifications()`
  sekarang menambah 1 titik pemanggilan guard baru per fungsi adapter
  — bukan perubahan pada logic pengujian, murni angka yang harus
  disesuaikan akibat penambahan additive tahap ini.

## Test

`tests/dashboard-v2-notifications-data.test.js` — 18 test baru:

1. Adapter tidak di-load sama sekali → 4 elemen baru tetap ada dgn
   fallback placeholder (Notifications 9 anak).
2. 5 kartu lama (backup/pengeluaran/servis/laporan/sinkronisasi) tidak
   berubah.
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
   fungsi adapter dipanggil lewat guard `typeof` tepat 7x (Hero +
   Summary Cards + Module Grid + Statistics Panel + Recent Activity +
   Upcoming Tasks + Notifications).
15. Hero (V2.17), Summary Cards (V2.18), Module Grid (V2.19),
   Statistics Panel (V2.20), Recent Activity (V2.21) & Upcoming Tasks
   (V2.22) tidak ikut berubah oleh V2.23.
16–17. `index.html`/`app_production.html` tetap 0 markup Dashboard V2.
18. `dashboard-hub.js` tetap tidak berubah/tidak direferensikan (guard
   mount/destroy tetap tepat 2x).

## Hasil test

```
node --test tests/dashboard-v2-notifications-data.test.js
# tests 18
# pass 18
# fail 0

node --test
# tests 1750
# pass 1750
# fail 0
```
