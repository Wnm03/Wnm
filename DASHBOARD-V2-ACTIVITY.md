# Dashboard V2 — Tahap V2.6 (Recent Activity)

Baseline: `node --test` 1456/1456 PASS (akhir Tahap V2.5).
Hasil tahap ini: `node --test` **1467/1467 PASS** (+11 test baru di
file baru, 2 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.6). Tidak
mengaudit ulang repository; menambah 1 sub-komponen baru (Recent
Activity) sbg anak Main Content Container di `dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
menambah *anak baru* di dalam Main Content Container, konsisten dengan
pola yang dipakai `_buildInsightPanel()` sejak Tahap V2.4: method
builder tersendiri (`_buildRecentActivity()`) yang mengembalikan
elemen siap pakai, di-wire lewat `_buildMain()`.

Urutan anak Main Content Container sekarang (6 anak, sebelumnya 5):

Hero -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel
-> **Recent Activity**

### Recent Activity (5 item aktivitas, anak `#dashboardV2RecentActivity`)

| Item | id | Isi (placeholder) |
|---|---|---|
| 1 | `dashboardV2RecentActivityItem1` | "Transaksi tercatat (placeholder)" |
| 2 | `dashboardV2RecentActivityItem2` | "Backup terakhir dijalankan (placeholder)" |
| 3 | `dashboardV2RecentActivityItem3` | "Catatan kendaraan diperbarui (placeholder)" |
| 4 | `dashboardV2RecentActivityItem4` | "Laporan dibuat (placeholder)" |
| 5 | `dashboardV2RecentActivityItem5` | "Anggota keluarga ditambahkan (placeholder)" |

Namespace class baru: `dashboard-v2-recent-activity` (section) dan
`dashboard-v2-recent-activity-item` (per item) — tidak bentrok dgn
class lain yang sudah ada.

Section dirender dgn `role="region"` + `aria-label`; tiap item py
`aria-label` sendiri. Semua teks statis — **tidak membaca**
`D.profile`/`D.transactions`/sumber data nyata apa pun. Dibangun via
`replaceChildren()`, tanpa `innerHTML`, tanpa `onclick`/
`addEventListener`, tanpa routing (tidak memanggil `showPage()`), tanpa
business logic apa pun.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5
  children.
- **Main Content Container** sekarang py 6 anak (sebelumnya 5) —
  perubahan ini murni struktural di dalam Main, bukan penambahan
  komponen top-level baru.
- **`replaceChildren()`** dipakai — **tidak ada `innerHTML`** sama
  sekali (diverifikasi test regex).
- **Tidak ada event listener**: tidak ada `addEventListener`/
  `.onclick =` di kode (diverifikasi test regex) — murni placeholder,
  tetap dormant.
- **Tidak ada routing**: tidak memanggil `showPage()` (diverifikasi
  test regex).
- **Tidak ada integrasi `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tidak terhubung** ke Dashboard Hub existing maupun **AI Command
  Center** (`AICommandCenter`), tidak membaca `D.profile`/
  `D.transactions`/`DashboardHubHero`.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **`render()` tetap idempotent** — dipanggil berkali-kali tidak
  menumpuk anak (Main tetap 6 anak, Recent Activity tetap 5 item).
- **`styles.css` tidak disentuh** — tahap ini murni struktur DOM, tanpa
  styling visual baru (di luar scope).

## Test

`tests/dashboard-v2-activity.test.js` — 11 test baru:

1. Recent Activity ditemukan sbg anak ke-6 Main, section dgn
   `role="region"` + `aria-label`.
2. Recent Activity berisi tepat 5 item.
3. Urutan 5 item sesuai (item1..item5), semua placeholder + `aria-label`.
4. Dashboard V2 tetap dormant setelah `render()` Tahap V2.6.
5. `render()` tetap idempotent (Main 6 anak, Recent Activity 5 item,
   tidak menumpuk).
6. Root top-level tetap 5 komponen (Recent Activity anak Main, bukan
   top-level baru).
7. Regresi: tidak ada `onclick`/`addEventListener` (murni label, tanpa
   routing/link).
8. Regresi: tidak terhubung `FEATURE_REGISTRY`/`showPage()`/
   `AICommandCenter`/`D.profile`/`D.transactions`/`DashboardHubHero`,
   tidak ada `innerHTML`.
9. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.
10–11 (loop 2 file). Regresi: `index.html` & `app_production.html`
    tetap 0 markup Dashboard V2.

`tests/dashboard-v2-summary.test.js` — 2 assersi disesuaikan (jumlah
anak Main dari 5 → 6, di test struktur Main & test idempotensi
`render()`); assersi lain di file ini tidak terdampak.

`tests/dashboard-v2-shell.test.js` (V2.1), `tests/dashboard-v2-hero.test.js`
(V2.2), dan `tests/dashboard-v2-navigation.test.js` (V2.5) tetap
dijalankan ulang sbg bukti tidak ada regresi — tidak ada assersi yang
terdampak, semua tetap 100% lulus tanpa perubahan.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.6 (Recent Activity) **selesai**, tetap dormant, tidak wired. Main
Content Container kini py 6 sub-komponen:

| Anak Main | Isi (sejak tahap) |
|---|---|
| Hero | Welcome title, Health Score, Balance, Insight (V2.2) |
| Summary Cards | 4 kartu (V2.3) |
| Quick Actions | 4 tombol (V2.3) |
| Module Grid | 6 kartu (V2.4) |
| Insight Panel | 3 baris insight (V2.4) |
| Recent Activity | 5 item aktivitas (V2.6) |

Wire-up nyata (data aktivitas sungguhan, routing, aktivasi item,
integrasi `FEATURE_REGISTRY`, styling visual) tetap di luar scope,
butuh mandat eksplisit terpisah.
