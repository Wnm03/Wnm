# Dashboard V2 — Auto Destroy (Tahap V2.14D)

## Tujuan

Melengkapi lifecycle mount Dashboard V2 (V2.14C: mount + V2.14C+: guard
init-once) dengan jalur sebaliknya: saat activation flag
(`isDashboardV2Enabled()`, V2.14A) balik ke `false` **setelah** Dashboard
V2 sempat ter-init, instance-nya benar-benar dilepas lewat
`DashboardV2Shell.destroy()` — bukan dibiarkan menggantung.

## Kontrak lifecycle (final, setelah V2.14D)

| Kondisi | `init()` | `render()` | `destroy()` |
|---|---|---|---|
| Flag `false`, belum pernah init | — | — | — |
| Flag `true`, pertama kali (siklus aktivasi baru) | ✅ 1x | ✅ | — |
| Flag `true`, panggilan `DashboardHub.render()` berikutnya (masih dalam siklus yang sama) | — (sudah `_dashHubV2Initialized`) | ✅ tiap kali | — |
| Flag balik `false`, setelah pernah init | — | — | ✅ 1x, lalu `_dashHubV2Initialized` direset ke `false` |
| Flag `true` lagi (siklus aktivasi BARU) | ✅ 1x lagi | ✅ | — |

Poin penting: **"init sekali" berarti sekali PER SIKLUS AKTIVASI, bukan
sekali selama umur aplikasi.** Setiap kali flag turun ke `false` setelah
sempat `true`+init, siklus itu ditutup dengan `destroy()` dan flag
internal direset — sehingga siklus `true` berikutnya dianggap siklus
baru yang perlu `init()` lagi.

## Apa yang berubah

Satu file diedit: `dashboard-hub.js`, method `DashboardHub.render()` —
ditambah satu blok baru setelah blok mount/init-once (V2.14C+), tidak
ada baris lain yang disentuh:

```js
if (typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === true
  && typeof DashboardV2Shell !== 'undefined') {
  if (!DashboardHub._dashHubV2Initialized) {
    DashboardV2Shell.init();
    DashboardHub._dashHubV2Initialized = true;
  }
  DashboardV2Shell.render();
}

// V2.14D — auto-destroy
if (typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === false
  && typeof DashboardV2Shell !== 'undefined'
  && DashboardHub._dashHubV2Initialized === true) {
  DashboardV2Shell.destroy();
  DashboardHub._dashHubV2Initialized = false;
}
```

Guard auto-destroy memakai pola `typeof` yang identik dengan blok mount
di atasnya (`typeof isDashboardV2Enabled === 'function'`,
`typeof DashboardV2Shell !== 'undefined'`) — konsisten dengan seluruh
conditional-render lain di file ini (LifeOS, Favorit View, Hero,
Summary, Analytics, mount V2.14C).

## Constraint yang dipenuhi

- **Additive only** — blok baru ditambahkan setelah blok mount/init-once
  yang sudah ada; tidak ada baris lama yang dihapus atau diubah urutannya.
- **`showPage()` tidak disentuh.**
- **`FEATURE_REGISTRY` tidak disentuh.**
- **Logic `DashboardHub` lain tidak diubah** — `DashboardHub.open()`,
  bagian atas `render()` (grid FEATURE_REGISTRY, LifeOS, Favorit, Hero,
  Summary, Analytics) sama persis dengan sebelumnya.
- **HTML tidak diubah** — `index.html`/`app_production.html` tidak
  disentuh.
- **`dashboard-v2-shell.js` tidak diubah** — `destroy()` di file itu
  sudah ada sejak awal (API `init()/render()/destroy()`, lihat
  `tests/dashboard-v2-shell.test.js`); tahap ini murni memanggilnya dari
  sisi `DashboardHub`.
- **Pola guard existing dipakai ulang** — bukan pola baru.

## Kenapa 12 test lama perlu diperbarui (bukan dihapus)

Sejak Tahap V2.14C, 12 file test (tersebar di berbagai file
`dashboard-v2-*.test.js` dari tahap-tahap sebelumnya) punya satu
assertion regression-guard yang sama:

```js
const dashboardV2ShellGuardMatches = hubSrc.match(/typeof DashboardV2Shell !== 'undefined'/g) || [];
assert.equal(dashboardV2ShellGuardMatches.length, 1, ...);
```

Tujuannya: memastikan `dashboard-hub.js` tidak diam-diam menambah
referensi `DashboardV2Shell` di banyak tempat tak terduga. Sebelum
V2.14D, guard itu memang hanya muncul 1x (blok mount/init-once).
Setelah V2.14D, guard yang sama dipakai LAGI secara sengaja di blok
auto-destroy — sehingga jumlahnya sekarang **tepat 2x** (1 mount + 1
destroy), bukan lagi 1x.

Assertion **tidak dihapus** — hanya angka pembandingnya diperbarui dari
`1` menjadi `2`, dengan komentar yang menjelaskan asal kedua occurrence
tersebut. Regression-guard tetap berfungsi: kalau di masa depan ada
referensi `DashboardV2Shell` ketiga yang tak terduga muncul, ke-12 test
ini akan tetap gagal sebagaimana mestinya.

## Kenapa 2 test di `dashboard-v2-init-once.test.js` perlu ditulis ulang

Dua test tersebut sebelumnya menegaskan kontrak lama ("init() TIDAK
boleh dipanggil kedua kalinya setelah disable→enable ulang" / "init()
harus tetap 1x total walau flag naik-turun") — kontrak itu memang benar
untuk *sebelum* V2.14D ada (belum ada `destroy()`, jadi tidak ada cara
"memulai siklus baru"). Dengan `destroy()` sekarang ada, kontrak yang
benar adalah **1x per siklus aktivasi**, bukan 1x selamanya. Kedua test
ditulis ulang untuk menegaskan itu (lihat tabel kontrak di atas), plus
mock `DashboardV2Shell` di file test ini ditambah `destroy() {}` supaya
blok auto-destroy tidak `throw` saat test memanggil `DashboardHub.
render()` dalam kondisi flag `false` setelah pernah init.

## Hasil test

```
node --test tests/dashboard-v2-init-once.test.js
# tests 8
# pass 8
# fail 0

node --test
# tests 1596
# pass 1596
# fail 0
```

## Status

Lifecycle Dashboard V2 kini lengkap: mount (init sekali per siklus +
render tiap kali) dan auto-destroy (destroy sekali saat siklus
berakhir). Karena tidak ada kode produksi yang memanggil
`enableDashboardV2()`/`disableDashboardV2()`, flag tetap `false` secara
default dan Dashboard lama tetap satu-satunya yang tampil ke pengguna.
