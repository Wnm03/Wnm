# Dashboard V2 — Tahap V2.13 (Automation Center)

Baseline: `node --test` 1544/1544 PASS (akhir Tahap V2.12).
Hasil tahap ini: `node --test` **1555/1555 PASS** (+11 test baru di
file baru, 8 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.13). Tidak
mengaudit ulang repository; menambah 1 sub-komponen baru (Automation
Center) sbg anak Main Content Container di `dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
menambah *anak baru* di dalam Main Content Container, konsisten dengan
pola yang dipakai `_buildNotifications()`/`_buildAiCommandCenter()`/
`_buildHealthScore()`/`_buildPredictiveInsights()` sejak Tahap
V2.9–V2.12: method builder tersendiri (`_buildAutomationCenter()`)
yang mengembalikan elemen siap pakai, di-wire lewat `_buildMain()`.

Urutan anak Main Content Container sekarang (13 anak, sebelumnya 12):

Hero -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel
-> Recent Activity -> Statistics Panel -> Upcoming Tasks ->
Notifications Center -> AI Command Center -> Health Score Widget ->
Predictive Insights -> **Automation Center**

### Automation Center (anak `#dashboardV2AutomationCenter`)

Section: `role="region"` + `aria-label="Automation Center"`, berisi
5 kartu automation berurutan:

| # | Kartu | id | Judul |
|---|---|---|---|
| 1 | Auto Backup | `dashboardV2AutomationCenterCardAutoBackup` | "Auto Backup" |
| 2 | Monthly Report | `dashboardV2AutomationCenterCardMonthlyReport` | "Monthly Report" |
| 3 | Budget Reminder | `dashboardV2AutomationCenterCardBudgetReminder` | "Budget Reminder" |
| 4 | Vehicle Service Reminder | `dashboardV2AutomationCenterCardVehicleServiceReminder` | "Vehicle Service Reminder" |
| 5 | Document Renewal Reminder | `dashboardV2AutomationCenterCardDocumentRenewalReminder` | "Document Renewal Reminder" |

- **5 kartu**: `<button type="button" disabled>` (namespace class
  `dashboard-v2-automation-card`) — pola identik Notifications Center
  (V2.9)/AI Command Center (V2.10)/Health Score Widget (V2.11)/
  Predictive Insights (V2.12): setiap kartu berisi 5 sub-elemen —
  - icon (`<span>`, class `dashboard-v2-automation-icon`)
  - title (`<span>`, class `dashboard-v2-automation-title`,
    textContent nama automation, mis. "Auto Backup")
  - schedule placeholder (`<span>`, class
    `dashboard-v2-automation-schedule`, textContent `"--"`)
  - status placeholder (`<span>`, class
    `dashboard-v2-automation-status`, textContent `"Disabled"`)
  - description placeholder (`<span>`, class
    `dashboard-v2-automation-description`, teks statis singkat per
    kartu)

Semua teks statis — **tidak membaca** `D.profile`/`D.transactions`/
sumber data nyata apa pun, **tidak ada AI/API/fetch sungguhan apa
pun**, **tidak ada scheduling/eksekusi automation sungguhan apa pun**.
Dibangun via `replaceChildren()` (di level section & di level setiap
kartu), tanpa `innerHTML`, tanpa `onclick`/`addEventListener`, tanpa
routing (tidak memanggil `showPage()`), tanpa `fetch`, tanpa state
baru, tanpa business logic apa pun.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5
  children.
- **Main Content Container** sekarang py 13 anak (sebelumnya 12) —
  perubahan ini murni struktural di dalam Main, bukan penambahan
  komponen top-level baru.
- **`replaceChildren()`** dipakai di level section & di level setiap
  kartu — **tidak ada `innerHTML`** sama sekali (diverifikasi test
  regex).
- **5 kartu `disabled`**, **tidak ada event listener**: tidak ada
  `addEventListener`/`.onclick =` di kode (diverifikasi test regex) —
  murni placeholder, tetap dormant.
- **Tidak ada routing**: tidak memanggil `showPage()` (diverifikasi
  test regex).
- **Tidak ada integrasi `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tidak ada AI/API/fetch sungguhan**: tidak ada pemanggilan
  `fetch()` maupun referensi ke modul `AICommandCenter` existing
  (diverifikasi test regex terhadap `dashboard-v2-shell.js`).
- **Tidak ada state baru**: tidak ada properti state tambahan di objek
  `DashboardV2Shell` — widget dibangun murni dari data literal lokal
  di dalam method, sama seperti Notifications Center/AI Command
  Center/Health Score Widget/Predictive Insights.
- **Tidak terhubung** ke Dashboard Hub existing (`D.profile`/
  `D.transactions`/`DashboardHubHero`).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `ai-command-center.js`, `index.html`, `app_production.html` tetap 0
  tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`render()` tetap idempotent** — dipanggil berkali-kali tidak
  menumpuk anak (Main tetap 13 anak, Automation Center tetap 5 kartu).
- **Namespace class baru** (`dashboard-v2-automation-center`,
  `dashboard-v2-automation-card`, `dashboard-v2-automation-icon`,
  `dashboard-v2-automation-title`, `dashboard-v2-automation-schedule`,
  `dashboard-v2-automation-status`,
  `dashboard-v2-automation-description`) — mengikuti konvensi
  penamaan `dashboard-v2-*` existing, tidak bentrok dgn class lain.
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope); class disiapkan mengikuti
  konvensi token/desain existing.

## Test

`tests/dashboard-v2-automation.test.js` — 11 test baru:

1. Automation Center ditemukan sbg anak ke-13 Main, section dgn
   `role="region"` + `aria-label="Automation Center"`.
2. Automation Center berisi tepat 5 kartu automation.
3. 5 kartu sesuai urutan (Auto Backup, Monthly Report, Budget
   Reminder, Vehicle Service Reminder, Document Renewal Reminder),
   semua `<button disabled>` berisi icon + title + schedule + status +
   description placeholder.
4. Dashboard V2 tetap dormant setelah `render()` Tahap V2.13.
5. `render()` tetap idempotent (Main 13 anak, section 5 kartu, tidak
   menumpuk).
6. Root top-level tetap 5 komponen (Automation Center anak Main,
   bukan top-level baru).
7. Regresi: tidak ada `onclick`/`addEventListener` (murni disabled,
   tanpa routing/link).
8. Regresi: tidak terhubung `FEATURE_REGISTRY`/`showPage()`/
   `AICommandCenter`/`D.profile`/`D.transactions`/`DashboardHubHero`/
   `fetch`, tidak ada `innerHTML`.
9. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.
10–11 (loop 2 file). Regresi: `index.html` & `app_production.html`
    tetap 0 markup Dashboard V2.

`tests/dashboard-v2-summary.test.js` — 2 assersi disesuaikan (jumlah
anak Main dari 12 → 13); assersi lain di file ini tidak terdampak.

`tests/dashboard-v2-upcoming.test.js`, `tests/dashboard-v2-activity.test.js`,
`tests/dashboard-v2-statistics.test.js`, `tests/dashboard-v2-notifications.test.js`,
`tests/dashboard-v2-ai.test.js`, `tests/dashboard-v2-health.test.js` &
`tests/dashboard-v2-predictive.test.js` — masing-masing 1 assersi
disesuaikan (jumlah anak Main dari 12 → 13 di test idempotensi
`render()`); assersi lain di ketujuh file ini (urutan/id item, dormant,
regresi) tidak terdampak.

`tests/dashboard-v2-shell.test.js` (V2.1), `tests/dashboard-v2-hero.test.js`
(V2.2), dan `tests/dashboard-v2-navigation.test.js` (V2.5) tetap
dijalankan ulang sbg bukti tidak ada regresi — tidak ada assersi yang
terdampak, semua tetap 100% lulus tanpa perubahan.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.13 (Automation Center) **selesai**, tetap dormant, tidak wired.
Main Content Container kini py 13 sub-komponen:

| Anak Main | Isi (sejak tahap) |
|---|---|
| Hero | Welcome title, Health Score, Balance, Insight (V2.2) |
| Summary Cards | 4 kartu (V2.3) |
| Quick Actions | 4 tombol (V2.3) |
| Module Grid | 6 kartu (V2.4) |
| Insight Panel | 3 baris insight (V2.4) |
| Recent Activity | 5 item aktivitas (V2.6) |
| Statistics Panel | 4 kartu statistik (V2.7) |
| Upcoming Tasks | 5 kartu tugas (V2.8) |
| Notifications Center | 5 kartu notifikasi (V2.9) |
| AI Command Center | 1 search field + 4 kartu aksi + 1 area saran (V2.10) |
| Health Score Widget | 1 circular score placeholder + 1 subtitle + 4 kartu metrik (V2.11) |
| Predictive Insights | 5 kartu insight prediktif (V2.12) |
| Automation Center | 5 kartu automation (V2.13) |

Wire-up nyata (scheduling/eksekusi automation sungguhan, integrasi
backup/laporan/reminder nyata, aktivasi kartu, routing, styling
visual) tetap di luar scope, butuh mandat eksplisit terpisah.
