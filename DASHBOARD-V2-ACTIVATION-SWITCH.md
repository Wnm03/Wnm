# Dashboard V2 — Activation Switch (Tahap V2.15)

## Tujuan

Sejak V2.14A (`dashboard-v2-activation.js`), flag `isDashboardV2Enabled()`
hanya bisa diubah programatik — memanggil `enableDashboardV2()`/
`disableDashboardV2()` lewat console, karena tidak ada satu pun elemen UI
di repo yang membacanya. Tahap ini menambah kontrol UI (toggle switch) di
`dashboard-hub.js` supaya pengguna bisa menyalakan/mematikan Dashboard V2
sendiri, tanpa mengubah mekanisme flag itu sendiri maupun lifecycle
mount/destroy (V2.14C/V2.14D) yang sudah ada.

## Arsitektur

```
dashboard-v2-activation.js (V2.14A, TIDAK diubah)
  isDashboardV2Enabled() / enableDashboardV2() / disableDashboardV2()
              │
              │ dibaca & dipanggil (bukan diubah)
              ▼
dashboard-hub.js (SATU-SATUNYA file produksi yang berubah tahap ini)
  _dashHubV2SwitchHtml()   -> markup toggle, dirender di DashboardHub.render()
  DashboardHub.toggleDashboardV2() -> flip flag, lalu DashboardHub.render()
              │
              │ DashboardHub.render() (tidak diubah logikanya) sudah
              │ membaca isDashboardV2Enabled() lewat blok mount/init-once/
              │ auto-destroy (V2.14C/V2.14D) untuk mount/destroy
              │ DashboardV2Shell — blok itu TIDAK disentuh tahap ini.
              ▼
DashboardV2Shell.init()/render()/destroy() (V2.1–V2.14D, TIDAK diubah)
```

Tahap ini murni menambah **jalur baru untuk MENGUBAH flag** (lewat klik
pengguna), bukan jalur baru untuk MEMBACA flag — pembacaan flag untuk
mount/destroy Dashboard V2 sudah sepenuhnya ditangani blok existing sejak
V2.14C/V2.14D.

## Activation flow

1. `DashboardHub.render()` dipanggil (mis. saat halaman Dashboard dibuka).
2. `_dashHubV2SwitchHtml()` dievaluasi: kalau `isDashboardV2Enabled`,
   `enableDashboardV2`, dan `disableDashboardV2` semuanya tersedia sbg
   function, hasilkan markup switch (checkbox `checked` mengikuti
   `isDashboardV2Enabled()` saat ini + label teks). Kalau tidak, hasilkan
   string kosong (`''`).
3. Markup switch di-prepend ke `el.innerHTML` bersama grid
   `FEATURE_REGISTRY` seperti biasa.
4. Pengguna klik checkbox → event `click` ditangkap listener global
   `data-action` (existing, di `features-helpers-global-security.js`,
   TIDAK diubah) → memanggil `DashboardHub.toggleDashboardV2()`.
5. `toggleDashboardV2()`:
   - `isDashboardV2Enabled() === true` → panggil `disableDashboardV2()`.
   - selain itu → panggil `enableDashboardV2()`.
   - lalu panggil `DashboardHub.render()` sekali.
6. `DashboardHub.render()` yang terpanggil ulang di langkah 5 otomatis:
   - merender ulang switch dengan state checkbox baru (langkah 2–3), DAN
   - menjalankan blok mount/init-once/auto-destroy existing (V2.14C/
     V2.14D) yang membaca `isDashboardV2Enabled()` — sehingga
     `DashboardV2Shell` ter-`init()`/`render()` atau ter-`destroy()`
     sesuai state baru, TANPA ada logic tambahan apa pun di tahap ini
     untuk itu.

## Guard conditions

Sama seperti seluruh blok conditional-render lain di `dashboard-hub.js`
(LifeOS, Favorit View, Hero, Summary, Analytics, mount V2.14C), blok
switch memakai pola `typeof`:

```js
if (typeof isDashboardV2Enabled !== 'function'
  || typeof enableDashboardV2 !== 'function'
  || typeof disableDashboardV2 !== 'function') {
  return ''; // _dashHubV2SwitchHtml()
}
```

```js
if (typeof isDashboardV2Enabled !== 'function'
  || typeof enableDashboardV2 !== 'function'
  || typeof disableDashboardV2 !== 'function') {
  return; // toggleDashboardV2()
}
```

Kalau `dashboard-v2-activation.js` belum ter-load (ketiga fungsi flag
tidak tersedia), kedua blok ini no-op total — tidak ada markup switch,
dan `toggleDashboardV2()` (kalaupun somehow terpanggil) tidak melakukan
apa-apa. `DashboardV2Shell` sendiri TIDAK perlu tersedia untuk switch
muncul/berfungsi — switch murni bicara dengan flag, bukan dengan Shell
(lihat test #10, "aman saat `DashboardV2Shell` belum ter-load").

## Lifecycle

Switch TIDAK menambah state/lifecycle baru. Satu-satunya efek sampingnya
adalah memanggil `enableDashboardV2()`/`disableDashboardV2()` (state
sudah ada sejak V2.14A) lalu `DashboardHub.render()` (fungsi sudah ada
sejak awal) — lifecycle `init()`/`render()`/`destroy()` Dashboard V2
tetap persis mengikuti kontrak V2.14D (init sekali per siklus aktivasi,
destroy sekali saat siklus berakhir); tabel kontrak itu tidak berubah
dan tidak diulang di sini (lihat `DASHBOARD-V2-AUTO-DESTROY.md`).

## Constraint

- **Additive only** — `_dashHubV2SwitchHtml()` dan
  `toggleDashboardV2()` adalah tambahan murni; tidak ada baris existing
  di `dashboard-hub.js` yang dihapus atau diubah urutannya, selain satu
  baris `el.innerHTML = ...` yang di-prefix (bukan diganti logikanya).
- **`dashboard-v2-activation.js` tidak diubah** — hanya fungsi
  publiknya yang dipanggil.
- **`dashboard-v2-shell.js` tidak diubah** — tidak disentuh sama sekali
  tahap ini (bahkan tidak direferensikan langsung oleh switch/toggle).
- **Blok mount/init-once/auto-destroy (V2.14C/V2.14D) tidak diubah** —
  persis sama, hanya ikut terpicu ulang lewat pemanggilan
  `DashboardHub.render()` yang sudah ada.
- **`FEATURE_REGISTRY` tidak disentuh** oleh blok switch/toggle
  (dijamin statis oleh test #9).
- **`showPage()` tidak dipanggil** oleh blok switch/toggle (dijamin
  test #8 & #9).
- **`index.html`/`app_production.html` tidak diubah** — markup switch
  murni bagian dari `innerHTML` yang sudah digenerate `dashboard-hub.js`
  ke dalam `#dashboardHubGrid` yang sudah ada, bukan elemen baru di HTML
  statis.
- **Tidak ada file test lama yang diubah** — hanya 1 file test baru.

## Test coverage

`tests/dashboard-v2-activation-switch.test.js` — 11 test:

1. Switch tidak dirender kalau API aktivasi tidak tersedia.
2. Switch dirender kalau API aktivasi tersedia (flag true maupun false).
3. Checkbox mengikuti nilai `isDashboardV2Enabled()` saat ini.
4. Label teks "Dashboard V2" muncul di markup switch.
5. `toggleDashboardV2()` memanggil `enableDashboardV2()` saat sebelumnya
   `false`, tidak memanggil `disableDashboardV2()`.
6. `toggleDashboardV2()` memanggil `disableDashboardV2()` saat
   sebelumnya `true`, tidak memanggil `enableDashboardV2()`.
7. `toggleDashboardV2()` memanggil `DashboardHub.render()` tepat 1x.
8. `toggleDashboardV2()` tidak memanggil `showPage()`.
9. Jaminan statis: blok switch & method `toggleDashboardV2()` tidak
   mereferensikan `FEATURE_REGISTRY`/`showPage(` di kode aktif.
10. Aman (tidak throw) saat `DashboardV2Shell` belum ter-load.
11. `toggleDashboardV2()` idempotent secara perilaku — dipanggil
    berulang menghasilkan flip konsisten, balik ke state semula setelah
    jumlah panggilan genap.

```
node --test tests/dashboard-v2-activation-switch.test.js
# tests 11
# pass 11
# fail 0
```

## Dampak terhadap Dashboard lama

Nihil. Dashboard lama (`FEATURE_REGISTRY` grid, LifeOS, Favorit, Hero,
Summary, Analytics) tetap default & aktif, dirender persis seperti
sebelumnya. Switch murni menambah SATU cara baru bagi pengguna untuk
mengubah flag Dashboard V2 — tidak mengubah apa yang tampil untuk flag
`false` (default), dan tidak mengubah kapan/apakah Dashboard V2 muncul
untuk nilai flag yang sama seperti sebelum tahap ini.

## Future integration

- **Persistensi state**: flag masih in-memory (reset tiap reload,
  konsisten dengan kontrak V2.14A) — menyimpan pilihan pengguna lintas
  sesi (localStorage/backend) di luar scope tahap ini.
- **Styling final**: switch memakai class `tgl-switch`/`tgl-track` yang
  sudah ada di `styles.css` (dipakai `notifEnableToggle`/`gdAutoSync` di
  `index.html`) — belum ada polish visual/posisi khusus untuk konteks
  Dashboard Hub.
- **Aksesibilitas lanjutan**: `aria-label` dasar sudah disertakan;
  audit lengkap (mis. lewat `features-sheets-pwa-selftest.js`) di luar
  scope tahap ini.
- **Rollout bertahap**: tidak ada kode produksi yang memanggil
  `enableDashboardV2()` secara default — flag tetap `false` out-of-the-
  box, switch ini adalah satu-satunya jalur baru bagi pengguna untuk
  mengubahnya sendiri.
