# Dashboard V2 — Guard Init-Once (Tahap tambahan setelah V2.14C)

## Tujuan

Sejak Tahap V2.14C (`DASHBOARD-V2-MOUNT.md`), `DashboardHub.render()`
memanggil `DashboardV2Shell.init()` **dan** `DashboardV2Shell.render()`
setiap kali dipanggil, selama activation flag (`isDashboardV2Enabled()`,
V2.14A) bernilai `true`. `init()` sendiri sudah idempotent by contract
di level `DashboardV2Shell` (V2.1/V2.14B), tapi tetap dipanggil ULANG
setiap kali halaman Dashboard dibuka — kerja sia-sia yang tidak perlu.

Tahap ini menambah guard sederhana di sisi `DashboardHub`: `init()`
hanya benar-benar dipanggil **sekali**; panggilan `DashboardHub.
render()` berikutnya cukup memanggil `DashboardV2Shell.render()` saja.

## Apa yang berubah

Satu file diedit: `dashboard-hub.js`, method `DashboardHub.render()` —
hanya blok mount Dashboard V2 (V2.14C) di akhir method.

Sebelum:

```js
if (typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === true
  && typeof DashboardV2Shell !== 'undefined') {
  DashboardV2Shell.init();
  DashboardV2Shell.render();
}
```

Sesudah:

```js
if (typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === true
  && typeof DashboardV2Shell !== 'undefined') {
  if (!DashboardHub._dashHubV2Initialized) {
    DashboardV2Shell.init();
    DashboardHub._dashHubV2Initialized = true;
  }
  DashboardV2Shell.render();
}
```

Flag `_dashHubV2Initialized` disimpan sebagai property langsung di
object `DashboardHub` (pola sama dengan flag boolean sederhana lain di
repo ini, mis. `_dashboardV2Enabled` di `dashboard-v2-activation.js`) —
bukan variabel modul terpisah, bukan closure baru, tidak menambah
struktur data baru.

## Perilaku

| Kondisi | `DashboardV2Shell.init()` | `DashboardV2Shell.render()` |
|---|---|---|
| Flag `false` (default) | Tidak dipanggil (blok no-op, sama seperti V2.14C) | Tidak dipanggil |
| Flag `true`, panggilan `DashboardHub.render()` pertama kali (selama flag true) | Dipanggil (1x) | Dipanggil |
| Flag `true`, panggilan `DashboardHub.render()` berikutnya | **Tidak** dipanggil lagi | Tetap dipanggil |
| Flag sempat `false` lalu `true` lagi (disable→enable) | **Tidak** dipanggil lagi (guard tidak reset oleh perubahan flag) | Tetap dipanggil setiap kali flag true |

Guard ini berbasis **instance `DashboardHub`** (sekali per load
halaman/proses), bukan berbasis state flag — jadi siklus disable/enable
berulang tidak pernah memicu `init()` kedua kalinya, konsisten dengan
kontrak `init()` yang memang dimaksudkan berjalan sekali per lifecycle
halaman.

## Constraint yang dipenuhi

- **Routing tidak diubah** — tidak ada perubahan pada `showPage()` atau
  logic navigasi apa pun.
- **`showPage()` tidak disentuh** — blok guard tidak memanggilnya sama
  sekali (diverifikasi dgn assertion `showPageCalls` di test).
- **`FEATURE_REGISTRY` tidak disentuh** — blok guard tidak
  mereferensikannya sama sekali, baik secara tekstual (dicek statis di
  test) maupun runtime.
- **Business logic tidak diubah** — tidak ada akses ke `D.*` atau modul
  bisnis lain di blok ini.
- **Dashboard lama tidak diubah** — seluruh kode Dashboard lama (grid
  FEATURE_REGISTRY, Hero, Summary, Analytics, dst) di atas blok mount
  V2 tidak tersentuh sama sekali.
- **`index.html`/`app_production.html` tidak disentuh** — hanya
  `dashboard-hub.js` yang diedit.
- **Additive** — tidak menghapus/mengubah kode existing selain
  membungkusnya dengan satu lapis `if` tambahan.

## Test

`tests/dashboard-v2-init-once.test.js` (baru, 8 test):

1. `init()` hanya dipanggil sekali walau `DashboardHub.render()`
   dipanggil berkali-kali (flag tetap true).
2. `render()` tetap dipanggil setiap kali `DashboardHub.render()`
   dipanggil (tidak ikut di-guard).
3. Disable→enable kembali tidak memicu `init()` kedua.
4. Beberapa siklus disable/enable berturut-turut tetap `init()` 1x
   total.
5. Dashboard lama (flag false dari awal) tetap normal — grid tetap
   ter-render, `DashboardV2Shell` tidak disentuh sama sekali.
6. Environment tanpa `DashboardV2Shell` sama sekali — guard tidak
   error, tidak ada apa pun dipanggil.
7. Tidak memanggil `showPage()` sama sekali, baik flag true (lintas
   beberapa render) maupun false.
8. Jaminan statis: blok guard tidak mereferensikan `FEATURE_REGISTRY`
   atau `showPage(` secara tekstual.

Satu assertion di `tests/dashboard-v2-mount.test.js` (test lama,
V2.14C) disesuaikan karena secara eksplisit menegaskan perilaku lama
("`init()` ikut bertambah di panggilan `render()` ke-2") yang memang
digantikan oleh guard ini — kini menegaskan `init()` tetap 1 sedangkan
`render()` tetap mengikuti jumlah panggilan. Assertion lain di file
yang sama (flag false, environment tanpa modul, `showPage()`, dst)
tidak berubah karena masih berlaku identik.

## Hasil test

```
node --test
# tests 1596
# pass 1596
# fail 0
```

## Status

Guard ini murni optimisasi jumlah pemanggilan `init()` — tidak
mengubah kapan/apakah Dashboard V2 muncul ke pengguna. Karena tidak
ada kode produksi yang memanggil `enableDashboardV2()`, flag tetap
`false` secara default dan Dashboard lama tetap satu-satunya yang
tampil.
