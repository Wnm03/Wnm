# Dashboard V2 — Activation Framework (Tahap V2.14A)

## Tujuan

Menyiapkan mekanisme aktivasi Dashboard V2 **tanpa** menggantikan
Dashboard lama. Dashboard lama (Dashboard Hub existing) tetap default
dan tetap satu-satunya yang tampil. Dashboard V2 (dormant sejak V2.1)
sekarang bisa diaktifkan lewat **satu feature flag internal**, tapi
belum ada apa pun di repo yang membaca flag ini di tahap ini — jadi
mengaktifkannya sekarang tidak menampilkan apa pun secara visual.

## Apa yang ditambahkan

File baru: `dashboard-v2-activation.js` — tiga fungsi:

| Fungsi | Deskripsi |
|---|---|
| `isDashboardV2Enabled()` | Mengembalikan state flag saat ini. **Default: `false`**. |
| `enableDashboardV2()` | Set flag jadi `true`. Idempotent (aman dipanggil berkali-kali). |
| `disableDashboardV2()` | Set flag jadi `false`. Idempotent (aman dipanggil berkali-kali, termasuk saat sudah `false`). |

State disimpan sebagai variabel closure top-level (`_dashboardV2Enabled`)
di dalam file itu sendiri — **in-memory**, bukan `localStorage`,
`cookie`, atau query-param. Artinya flag ini reset ke default `false`
setiap kali file di-load ulang (reload halaman / proses Node baru).
Ketiga fungsi juga ditempel ke `window` (`window.isDashboardV2Enabled`,
dkk.) mengikuti pola `window.DashboardV2Shell` di
`dashboard-v2-shell.js`, supaya bisa dipanggil langsung dari console
browser atau modul lain nantinya.

## Kenapa in-memory, bukan persisten?

Tahap ini secara eksplisit hanya diminta menyiapkan *mekanisme* flag-nya
(fungsi enable/disable/check) — bukan *cara* mengaktifkannya dari luar
(mis. lewat UI toggle, query-string `?v2=1`, atau localStorage yang
bertahan antar sesi). Menambahkan persistensi sekarang berarti membuat
keputusan desain yang belum diminta (di mana disimpan, kapan
dibersihkan, dst.) — di luar scope RFC tahap ini yang cuma minta "satu
feature flag internal".

## Constraint yang dipatuhi

Sesuai mandat tahap ini, `dashboard-v2-activation.js` **tidak**:

- membaca atau menulis `FEATURE_REGISTRY` (`dashboard-hub-registry.js`);
- memanggil `showPage()` atau logic routing apa pun;
- menyentuh `dashboard-hub.js`, `index.html`, atau `app_production.html`;
- menyentuh DOM sama sekali (tidak ada `document.*` dipanggil);
- meng-instantiate atau memanggil `DashboardV2Shell`
  (`init()`/`render()`/`destroy()`) — flag ini murni disiapkan untuk
  dibaca oleh kode wiring terpisah di tahap berikutnya;
- menghubungkan data nyata apa pun (`D.profile`, `D.transactions`, dst.)
  — flag ini murni boolean, tidak membaca sumber data apa pun;
- mengandung business logic lain di luar tiga fungsi flag tsb.

Dashboard lama tetap 100% aktif dan tidak terpengaruh oleh keberadaan
file ini, karena tidak ada kode existing yang mereferensikan
`isDashboardV2Enabled()`/`enableDashboardV2()`/`disableDashboardV2()`.

## Cakupan test

`tests/dashboard-v2-activation.test.js` (11 test):

1. Default `false`.
2. `enableDashboardV2()` mengubah state jadi `true`.
3. `disableDashboardV2()` mengubah state balik jadi `false`.
4. `enableDashboardV2()` idempotent (dipanggil berkali-kali).
5. `disableDashboardV2()` idempotent (termasuk saat sudah `false`).
6. Transisi berulang enable → disable → enable tetap konsisten.
7. State terisolasi antar-instance load (tidak bocor antar load source).
8. Modul ini tidak menyentuh `document`/DOM sama sekali.
9. Modul ini tidak memanggil `showPage()`.
10. Modul ini tidak mengakses `FEATURE_REGISTRY`.
11. Cek statis (grep atas source, di luar baris komentar) memastikan
    tidak ada referensi kode aktif ke `showPage(`, `FEATURE_REGISTRY`,
    atau `DashboardV2Shell`.

## Status & langkah berikutnya

Mekanisme aktivasi sudah tersedia, tapi **belum dipakai di mana pun**.
Dashboard V2 tetap dormant, Dashboard lama tetap default. Tahap
integrasi berikutnya (di luar scope dokumen ini, butuh mandat eksplisit
terpisah) akan menentukan *siapa* yang membaca `isDashboardV2Enabled()`
dan *bagaimana* hasilnya memengaruhi apa yang dirender — mis. titik
wiring di `dashboard-hub.js` atau lapisan lain yang memilih antara
Dashboard lama vs `DashboardV2Shell` berdasarkan flag ini.
