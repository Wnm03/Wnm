# Dashboard V2 — Tahap V2.8 (Upcoming Tasks)

Baseline: `node --test` 1480/1480 PASS (akhir Tahap V2.7).
Hasil tahap ini: `node --test` **1493/1493 PASS** (+13 test baru di
file baru, 4 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.8). Tidak
mengaudit ulang repository; menambah 1 sub-komponen baru (Upcoming
Tasks) sbg anak Main Content Container di `dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
menambah *anak baru* di dalam Main Content Container, konsisten dengan
pola yang dipakai `_buildStatisticsPanel()` sejak Tahap V2.7: method
builder tersendiri (`_buildUpcomingTasks()`) yang mengembalikan elemen
siap pakai, di-wire lewat `_buildMain()`.

Urutan anak Main Content Container sekarang (8 anak, sebelumnya 7):

Hero -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel
-> Recent Activity -> Statistics Panel -> **Upcoming Tasks**

### Upcoming Tasks (5 kartu tugas, anak `#dashboardV2UpcomingTasks`)

Section: `role="region"` + `aria-label="Upcoming Tasks"`.

| Kartu | id | icon | title | due date | status |
|---|---|---|---|---|---|
| 1 | `dashboardV2UpcomingTaskCardListrik` | 💡 | "Bayar Listrik" | "-- (placeholder)" | "-- (placeholder)" |
| 2 | `dashboardV2UpcomingTaskCardServis` | 🔧 | "Servis Kendaraan" | "-- (placeholder)" | "-- (placeholder)" |
| 3 | `dashboardV2UpcomingTaskCardBackup` | 💾 | "Backup Data" | "-- (placeholder)" | "-- (placeholder)" |
| 4 | `dashboardV2UpcomingTaskCardLaporan` | 📋 | "Review Laporan" | "-- (placeholder)" | "-- (placeholder)" |
| 5 | `dashboardV2UpcomingTaskCardDokumen` | 📄 | "Perbarui Dokumen" | "-- (placeholder)" | "-- (placeholder)" |

Tiap kartu adalah `<button type="button" disabled>` (namespace class
baru `dashboard-v2-upcoming-task-card`) berisi 4 sub-elemen `<span>`
placeholder, masing-masing dgn id & class sendiri:

- `dashboard-v2-upcoming-task-icon` — id `...Icon`
- `dashboard-v2-upcoming-task-title` — id `...Title`
- `dashboard-v2-upcoming-task-due-date` — id `...DueDate`
- `dashboard-v2-upcoming-task-status` — id `...Status`

Pola `disabled` + struktur konten berlapis (icon/title/due date/status)
mengikuti persis pola kartu Statistics Panel (V2.7). Semua teks statis
— **tidak membaca** `D.profile`/`D.transactions`/sumber data nyata apa
pun. Dibangun via `replaceChildren()` (di level section maupun di
dalam tiap kartu), tanpa `innerHTML`, tanpa `onclick`/
`addEventListener`, tanpa routing (tidak memanggil `showPage()`),
tanpa `fetch`, tanpa state baru, tanpa business logic apa pun.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5
  children.
- **Main Content Container** sekarang py 8 anak (sebelumnya 7) —
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
  dalam method, sama seperti Statistics Panel/Insight Panel/Recent
  Activity.
- **Tidak terhubung** ke Dashboard Hub existing (`D.profile`/
  `D.transactions`/`DashboardHubHero`).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`render()` tetap idempotent** — dipanggil berkali-kali tidak
  menumpuk anak (Main tetap 8 anak, Upcoming Tasks tetap 5 kartu, tiap
  kartu tetap 4 sub-elemen).
- **Namespace class baru** (`dashboard-v2-upcoming-tasks`,
  `dashboard-v2-upcoming-task-card`, `-icon`/`-title`/`-due-date`/
  `-status`) — mengikuti konvensi penamaan `dashboard-v2-*` existing,
  tidak bentrok dgn class lain.
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope); class disiapkan mengikuti
  konvensi token/desain existing.

## Test

`tests/dashboard-v2-upcoming.test.js` — 13 test baru:

1. Upcoming Tasks ditemukan sbg anak ke-8 Main, section dgn
   `role="region"` + `aria-label="Upcoming Tasks"`.
2. Upcoming Tasks berisi tepat 5 task card.
3. Urutan 5 kartu sesuai (Bayar Listrik, Servis Kendaraan, Backup
   Data, Review Laporan, Perbarui Dokumen), semua `<button disabled>`.
4. Kartu Bayar Listrik: 4 sub-elemen (icon, title, due date, status)
   sesuai urutan & isi.
5. Kartu Servis/Backup/Laporan/Dokumen: title & due date/status
   placeholder benar.
6. Dashboard V2 tetap dormant setelah `render()` Tahap V2.8.
7. `render()` tetap idempotent (Main 8 anak, section 5 kartu, tiap
   kartu 4 sub-elemen, tidak menumpuk).
8. Root top-level tetap 5 komponen (Upcoming Tasks anak Main, bukan
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
anak Main dari 7 → 8, di test struktur Main & test idempotensi
`render()`); assersi lain di file ini tidak terdampak.

`tests/dashboard-v2-activity.test.js` & `tests/dashboard-v2-statistics.test.js`
— masing-masing 1 assersi disesuaikan (jumlah anak Main dari 7 → 8 di
test idempotensi `render()`); assersi lain di kedua file ini (urutan/id
item, dormant, regresi) tidak terdampak.

`tests/dashboard-v2-shell.test.js` (V2.1), `tests/dashboard-v2-hero.test.js`
(V2.2), dan `tests/dashboard-v2-navigation.test.js` (V2.5) tetap
dijalankan ulang sbg bukti tidak ada regresi — tidak ada assersi yang
terdampak, semua tetap 100% lulus tanpa perubahan.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.8 (Upcoming Tasks) **selesai**, tetap dormant, tidak wired. Main
Content Container kini py 8 sub-komponen:

| Anak Main | Isi (sejak tahap) |
|---|---|
| Hero | Welcome title, Health Score, Balance, Insight (V2.2) |
| Summary Cards | 4 kartu (V2.3) |
| Quick Actions | 4 tombol (V2.3) |
| Module Grid | 6 kartu (V2.4) |
| Insight Panel | 3 baris insight (V2.4) |
| Recent Activity | 5 item aktivitas (V2.6) |
| Statistics Panel | 4 kartu statistik (V2.7) |
| Upcoming Tasks | 5 kartu tugas — Listrik/Servis/Backup/Laporan/Dokumen (V2.8) |

Wire-up nyata (data tugas sungguhan, aktivasi kartu, routing, integrasi
`FEATURE_REGISTRY`, styling visual) tetap di luar scope, butuh mandat
eksplisit terpisah.
