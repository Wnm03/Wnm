# Dashboard V2 — Tahap V2.10 (AI Command Center UI)

Baseline: `node --test` 1506/1506 PASS (akhir Tahap V2.9).
Hasil tahap ini: `node --test` **1520/1520 PASS** (+14 test baru di
file baru, 6 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.10). Tidak
mengaudit ulang repository; menambah 1 sub-komponen baru (AI Command
Center UI) sbg anak Main Content Container di `dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
menambah *anak baru* di dalam Main Content Container, konsisten dengan
pola yang dipakai `_buildNotifications()` sejak Tahap V2.9: method
builder tersendiri (`_buildAiCommandCenter()`) yang mengembalikan
elemen siap pakai, di-wire lewat `_buildMain()`.

Urutan anak Main Content Container sekarang (10 anak, sebelumnya 9):

Hero -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel
-> Recent Activity -> Statistics Panel -> Upcoming Tasks ->
Notifications Center -> **AI Command Center**

### AI Command Center (anak `#dashboardV2AiCommandCenter`)

Section: `role="region"` + `aria-label="AI Command Center"`, berisi 6
anak berurutan:

| # | Elemen | id | Isi |
|---|---|---|---|
| 1 | Search field | `dashboardV2AiCommandCenterSearch` | `<input type="text" readonly>`, `placeholder="-- (placeholder)"` |
| 2 | Action card | `dashboardV2AiCommandCenterActionAnalyzeFinance` | `<button disabled>` "Analyze Finance" |
| 3 | Action card | `dashboardV2AiCommandCenterActionAnalyzeVehicle` | `<button disabled>` "Analyze Vehicle" |
| 4 | Action card | `dashboardV2AiCommandCenterActionGenerateReport` | `<button disabled>` "Generate Report" |
| 5 | Action card | `dashboardV2AiCommandCenterActionSmartAssistant` | `<button disabled>` "Smart Assistant" |
| 6 | Suggestion area | `dashboardV2AiCommandCenterSuggestion` | `<div>` teks statis "-- (placeholder)" |

- **Search field**: `<input type="text" readonly>` (namespace class
  `dashboard-v2-ai-search`) — sengaja `readonly` (bukan `disabled`),
  konsisten dgn semantik field "belum aktif" yg tetap bisa dibaca
  screen reader, namun **tanpa** `oninput`/`onchange`/event handler
  apa pun — tidak memproses input apa pun.
- **4 kartu aksi**: `<button type="button" disabled>` (namespace class
  `dashboard-v2-ai-action-card`) — pola identik dgn Quick Actions
  (V2.3): tombol datar berisi `textContent` judul, tanpa sub-elemen
  berlapis.
- **Area saran**: `<div>` (namespace class `dashboard-v2-ai-suggestion`)
  berisi teks statis placeholder — bukan elemen interaktif.

Semua teks statis — **tidak membaca** `D.profile`/`D.transactions`/
sumber data nyata apa pun, **tidak ada AI/API/fetch sungguhan apa
pun**. Dibangun via `replaceChildren()` (di level section), tanpa
`innerHTML`, tanpa `onclick`/`addEventListener`, tanpa routing (tidak
memanggil `showPage()`), tanpa `fetch`, tanpa state baru, tanpa
business logic apa pun.

### Catatan penamaan: `AiCommandCenter` vs `AICommandCenter`

Repository sudah punya modul AI sungguhan bernama `AICommandCenter`
(`ai-command-center.js`), dan seluruh test regresi Dashboard V2 sejak
V2.2 secara eksplisit memverifikasi `dashboard-v2-shell.js` **tidak**
mengandung string `AICommandCenter` (case-sensitive, tanpa spasi) —
sbg bukti tidak ada integrasi tak sengaja ke modul AI existing.

Karena itu, seluruh identifier kode tahap ini (nama method, id
elemen, nama variabel) memakai ejaan `AiCommandCenter` (huruf kedua
"i" kecil), **bukan** `AICommandCenter`. Ini murni perbedaan penamaan
identifier kode — teks yang tampil ke pengguna (`aria-label="AI
Command Center"`, judul di komentar) tetap ditulis "AI Command Center"
apa adanya, karena mengandung spasi sehingga tidak collide dgn regex
regresi tsb. Modul `ai-command-center.js`/`AICommandCenter` existing
itu sendiri **tidak disentuh sama sekali**.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5
  children.
- **Main Content Container** sekarang py 10 anak (sebelumnya 9) —
  perubahan ini murni struktural di dalam Main, bukan penambahan
  komponen top-level baru.
- **`replaceChildren()`** dipakai di level section — **tidak ada
  `innerHTML`** sama sekali (diverifikasi test regex).
- **Search field `readonly`**, **4 kartu aksi `disabled`**, **tidak
  ada event listener**: tidak ada `addEventListener`/`.onclick =` di
  kode (diverifikasi test regex) — murni placeholder, tetap dormant.
- **Tidak ada routing**: tidak memanggil `showPage()` (diverifikasi
  test regex).
- **Tidak ada integrasi `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tidak ada AI/API/fetch sungguhan**: tidak ada pemanggilan
  `fetch()` maupun referensi ke modul `AICommandCenter` existing
  (diverifikasi test regex terhadap `dashboard-v2-shell.js`, dan
  diverifikasi `ai-command-center.js` itu sendiri tidak
  mereferensikan `DashboardV2Shell`).
- **Tidak ada state baru**: tidak ada properti state tambahan di objek
  `DashboardV2Shell` — panel dibangun murni dari data literal lokal di
  dalam method, sama seperti Notifications Center/Upcoming Tasks/
  Statistics Panel.
- **Tidak terhubung** ke Dashboard Hub existing (`D.profile`/
  `D.transactions`/`DashboardHubHero`).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `ai-command-center.js`, `index.html`, `app_production.html` tetap 0
  tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`render()` tetap idempotent** — dipanggil berkali-kali tidak
  menumpuk anak (Main tetap 10 anak, AI Command Center tetap 6 anak).
- **Namespace class baru** (`dashboard-v2-ai-command-center`,
  `dashboard-v2-ai-search`, `dashboard-v2-ai-action-card`,
  `dashboard-v2-ai-suggestion`) — mengikuti konvensi penamaan
  `dashboard-v2-*` existing, tidak bentrok dgn class lain.
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope); class disiapkan mengikuti
  konvensi token/desain existing.

## Test

`tests/dashboard-v2-ai.test.js` — 14 test baru:

1. AI Command Center ditemukan sbg anak ke-10 Main, section dgn
   `role="region"` + `aria-label="AI Command Center"`.
2. AI Command Center berisi tepat 6 anak (1 search + 4 action card + 1
   suggestion area).
3. Search field: `readonly`, id & atribut sesuai.
4. 4 action card sesuai urutan (Analyze Finance, Analyze Vehicle,
   Generate Report, Smart Assistant), semua `<button disabled>`.
5. Suggestion area ada, id & isi placeholder sesuai.
6. Dashboard V2 tetap dormant setelah `render()` Tahap V2.10.
7. `render()` tetap idempotent (Main 10 anak, section 6 anak, tidak
   menumpuk).
8. Root top-level tetap 5 komponen (AI Command Center anak Main, bukan
   top-level baru).
9. Regresi: tidak ada `onclick`/`addEventListener` (murni
   readonly/disabled, tanpa routing/link).
10. Regresi: tidak terhubung `FEATURE_REGISTRY`/`showPage()`/
    `AICommandCenter`/`D.profile`/`D.transactions`/`DashboardHubHero`/
    `fetch`, tidak ada `innerHTML`.
11. Regresi: `ai-command-center.js` (modul `AICommandCenter`
    sungguhan) tidak berubah/tidak direferensikan oleh shell V2.
12. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.
13–14 (loop 2 file). Regresi: `index.html` & `app_production.html`
    tetap 0 markup Dashboard V2.

`tests/dashboard-v2-summary.test.js` — 2 assersi disesuaikan (jumlah
anak Main dari 9 → 10, di test struktur Main & test idempotensi
`render()`); assersi lain di file ini tidak terdampak.

`tests/dashboard-v2-upcoming.test.js`, `tests/dashboard-v2-activity.test.js`,
`tests/dashboard-v2-statistics.test.js` & `tests/dashboard-v2-notifications.test.js`
— masing-masing 1 assersi disesuaikan (jumlah anak Main dari 9 → 10 di
test idempotensi `render()`); assersi lain di keempat file ini
(urutan/id item, dormant, regresi) tidak terdampak.

`tests/dashboard-v2-shell.test.js` (V2.1), `tests/dashboard-v2-hero.test.js`
(V2.2), dan `tests/dashboard-v2-navigation.test.js` (V2.5) tetap
dijalankan ulang sbg bukti tidak ada regresi — tidak ada assersi yang
terdampak, semua tetap 100% lulus tanpa perubahan.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.10 (AI Command Center UI) **selesai**, tetap dormant, tidak wired.
Main Content Container kini py 10 sub-komponen:

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

Wire-up nyata (AI sungguhan, pemrosesan search, aktivasi kartu aksi,
saran dinamis, routing, integrasi `FEATURE_REGISTRY`/`AICommandCenter`
existing, styling visual) tetap di luar scope, butuh mandat eksplisit
terpisah.
