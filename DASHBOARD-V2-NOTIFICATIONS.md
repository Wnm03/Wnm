# Dashboard V2 — Tahap V2.9 (Notifications Center)

Baseline: `node --test` 1493/1493 PASS (akhir Tahap V2.8).
Hasil tahap ini: `node --test` **1506/1506 PASS** (+13 test baru di
file baru, 5 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.9). Tidak
mengaudit ulang repository; menambah 1 sub-komponen baru
(Notifications Center) sbg anak Main Content Container di
`dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
menambah *anak baru* di dalam Main Content Container, konsisten dengan
pola yang dipakai `_buildUpcomingTasks()` sejak Tahap V2.8: method
builder tersendiri (`_buildNotifications()`) yang mengembalikan elemen
siap pakai, di-wire lewat `_buildMain()`.

Urutan anak Main Content Container sekarang (9 anak, sebelumnya 8):

Hero -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel
-> Recent Activity -> Statistics Panel -> Upcoming Tasks ->
**Notifications Center**

### Notifications Center (5 kartu notifikasi, anak `#dashboardV2Notifications`)

Section: `role="region"` + `aria-label="Notifications"`.

| Kartu | id | icon | title | description | timestamp |
|---|---|---|---|---|---|
| 1 | `dashboardV2NotificationCardBackup` | 💾 | "Backup berhasil" | "-- (placeholder)" | "-- (placeholder)" |
| 2 | `dashboardV2NotificationCardPengeluaran` | ⚠️ | "Pengeluaran tinggi minggu ini" | "-- (placeholder)" | "-- (placeholder)" |
| 3 | `dashboardV2NotificationCardServis` | 🔧 | "Jadwal servis mendekat" | "-- (placeholder)" | "-- (placeholder)" |
| 4 | `dashboardV2NotificationCardLaporan` | 📋 | "Laporan bulanan siap" | "-- (placeholder)" | "-- (placeholder)" |
| 5 | `dashboardV2NotificationCardSinkronisasi` | 🔄 | "Sinkronisasi selesai" | "-- (placeholder)" | "-- (placeholder)" |

Tiap kartu adalah `<button type="button" disabled>` (namespace class
baru `dashboard-v2-notification-card`) berisi 4 sub-elemen `<span>`
placeholder, masing-masing dgn id & class sendiri:

- `dashboard-v2-notification-icon` — id `...Icon`
- `dashboard-v2-notification-title` — id `...Title`
- `dashboard-v2-notification-description` — id `...Description`
- `dashboard-v2-notification-timestamp` — id `...Timestamp`

Pola `disabled` + struktur konten berlapis (icon/title/description/
timestamp) mengikuti persis pola kartu Upcoming Tasks (V2.8)/Statistics
Panel (V2.7). Semua teks statis — **tidak membaca**
`D.profile`/`D.transactions`/sumber data nyata apa pun. Dibangun via
`replaceChildren()` (di level section maupun di dalam tiap kartu),
tanpa `innerHTML`, tanpa `onclick`/`addEventListener`, tanpa routing
(tidak memanggil `showPage()`), tanpa `fetch`, tanpa state baru, tanpa
business logic apa pun.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5
  children.
- **Main Content Container** sekarang py 9 anak (sebelumnya 8) —
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
  dalam method, sama seperti Upcoming Tasks/Statistics Panel/Insight
  Panel/Recent Activity.
- **Tidak terhubung** ke Dashboard Hub existing (`D.profile`/
  `D.transactions`/`DashboardHubHero`).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`render()` tetap idempotent** — dipanggil berkali-kali tidak
  menumpuk anak (Main tetap 9 anak, Notifications Center tetap 5
  kartu, tiap kartu tetap 4 sub-elemen).
- **Namespace class baru** (`dashboard-v2-notifications`,
  `dashboard-v2-notification-card`, `-icon`/`-title`/`-description`/
  `-timestamp`) — mengikuti konvensi penamaan `dashboard-v2-*`
  existing, tidak bentrok dgn class lain.
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope); class disiapkan mengikuti
  konvensi token/desain existing.

## Test

`tests/dashboard-v2-notifications.test.js` — 13 test baru:

1. Notifications ditemukan sbg anak ke-9 Main, section dgn
   `role="region"` + `aria-label="Notifications"`.
2. Notifications berisi tepat 5 notification card.
3. Urutan 5 kartu sesuai (Backup berhasil, Pengeluaran tinggi minggu
   ini, Jadwal servis mendekat, Laporan bulanan siap, Sinkronisasi
   selesai), semua `<button disabled>`.
4. Kartu Backup berhasil: 4 sub-elemen (icon, title, description,
   timestamp) sesuai urutan & isi.
5. Kartu Pengeluaran/Servis/Laporan/Sinkronisasi: title & description/
   timestamp placeholder benar.
6. Dashboard V2 tetap dormant setelah `render()` Tahap V2.9.
7. `render()` tetap idempotent (Main 9 anak, section 5 kartu, tiap
   kartu 4 sub-elemen, tidak menumpuk).
8. Root top-level tetap 5 komponen (Notifications anak Main, bukan
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
anak Main dari 8 → 9, di test struktur Main & test idempotensi
`render()`); assersi lain di file ini tidak terdampak.

`tests/dashboard-v2-upcoming.test.js`, `tests/dashboard-v2-activity.test.js`
& `tests/dashboard-v2-statistics.test.js` — masing-masing 1 assersi
disesuaikan (jumlah anak Main dari 8 → 9 di test idempotensi
`render()`); assersi lain di ketiga file ini (urutan/id item, dormant,
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

V2.9 (Notifications Center) **selesai**, tetap dormant, tidak wired.
Main Content Container kini py 9 sub-komponen:

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
| Notifications Center | 5 kartu notifikasi — Backup/Pengeluaran/Servis/Laporan/Sinkronisasi (V2.9) |

Wire-up nyata (data notifikasi sungguhan, aktivasi kartu, dismiss/
read-state, routing, integrasi `FEATURE_REGISTRY`, styling visual)
tetap di luar scope, butuh mandat eksplisit terpisah.
