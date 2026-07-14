# Dashboard V2 — Activation Wiring: render() (Tahap V2.14B)

## Tujuan

Menghubungkan `DashboardV2Shell` (`dashboard-v2-shell.js`) dengan
activation flag yang disiapkan di V2.14A (`dashboard-v2-activation.js`)
— **baca-saja**. Belum mengganti Dashboard lama, belum menyentuh
routing, belum menyentuh `showPage()`.

## Apa yang berubah

Satu file diedit: `dashboard-v2-shell.js`, method `render()`.

Sebelumnya, `render()` selalu membangun 5 placeholder ke dalam root
container tanpa peduli status apa pun — root tetap `hidden` +
`data-dashboard-v2-state="dormant"` (di-set sekali oleh `init()`, tidak
pernah diubah lagi).

Sekarang, di awal `render()`, ditambahkan satu blok baca flag:

```js
const dashboardV2Enabled = typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === true;
if (typeof root.setAttribute === 'function') {
  if (dashboardV2Enabled) {
    if (typeof root.removeAttribute === 'function') {
      root.removeAttribute('hidden');
    }
    root.setAttribute('data-dashboard-v2-state', 'active');
  } else {
    root.setAttribute('hidden', '');
    root.setAttribute('data-dashboard-v2-state', 'dormant');
  }
}
```

| `isDashboardV2Enabled()` | Atribut `hidden` | `data-dashboard-v2-state` |
|---|---|---|
| `false` (default) | tetap ada | `"dormant"` |
| `true` | dilepas | `"active"` |

`isDashboardV2Enabled` dibaca sebagai **global terpisah** (didefinisikan
di `dashboard-v2-activation.js`) — `dashboard-v2-shell.js` tidak
`require`/`import` file itu; keduanya tetap 2 file independen yang
digabungkan lewat konvensi global sama seperti modul-modul lain di repo
ini. Guard `typeof isDashboardV2Enabled === 'function'` memastikan
`render()` tidak error kalau file activation belum ter-load di suatu
environment — dalam kasus itu, perilakunya identik dengan sebelum
tahap ini (selalu dormant).

## Kenapa hanya di `render()`, bukan `init()`?

`init()` sudah selesai perannya di V2.1: membuat & attach root
container sekali, dengan state awal dormant. Menambahkan pembacaan
flag di `init()` juga berarti dua tempat kondisional yang bisa saling
tidak sinkron (mis. kalau `init()` dipanggil sebelum flag diaktifkan,
lalu `render()` dipanggil sesudahnya). Menaruh SATU sumber kebenaran di
`render()` — yang menurut kontrak tahap ini tetap dipanggil setiap
"siklus render" — lebih sederhana dan sesuai instruksi yang secara
eksplisit menyebut "saat render()".

## Constraint yang dipatuhi

- **Tidak memanggil `showPage()`** — tidak direferensikan sama sekali
  di kode aktif (dijamin lewat test + cek statis).
- **Tidak memakai `FEATURE_REGISTRY`** — tidak dibaca/ditulis (dijamin
  lewat test + cek statis).
- **Tidak membaca data Finance/Vehicle/AI** — blok baru ini hanya
  memanggil satu fungsi boolean, tidak menyentuh `D.*` apa pun.
- **Tidak ada `fetch`** — tidak ada network call apa pun ditambahkan.
- **Tidak ada state baru** — tidak ada property `this.*` instance baru
  di `DashboardV2Shell`; hanya membaca fungsi global lalu langsung
  toggle 2 atribut DOM yang sudah ada sejak V2.1.
- **Tidak ada event listener baru** — tidak ada `addEventListener`
  ditambahkan di tahap ini.
- **Dashboard lama tetap default** — tidak ada kode di repo (di luar
  test) yang memanggil `enableDashboardV2()`, jadi flag tetap `false`
  secara nyata dan Dashboard V2 tetap tersembunyi di produksi.

## Cakupan test

`tests/dashboard-v2-activation-render.test.js` (11 test, memakai flag
yang di-inject manual — bukan menjalankan `dashboard-v2-activation.js`
sungguhan, karena logic enable/disable-nya sudah dites terpisah di
V2.14A):

1. Default (flag tidak ada/`false`) → tetap hidden + dormant.
2. Setelah simulasi `enableDashboardV2()` → hidden dilepas + active.
3. Setelah simulasi `disableDashboardV2()` → hidden lagi + dormant.
4. Environment tanpa `isDashboardV2Enabled` sama sekali → fallback
   dormant, tidak error.
5–6. `render()` idempotent (dipanggil berkali-kali, tetap 1 root, tetap
   5 children) baik saat flag `true` maupun `false`.
7. Transisi berulang `false → true → false → true` tetap konsisten.
8. `render()` tidak memanggil `showPage()`.
9. `render()` tidak mengakses `FEATURE_REGISTRY`.
10. `render()` hanya MEMBACA flag — tidak memanggil
    `enableDashboardV2()`/`disableDashboardV2()` sendiri.
11. Cek statis (grep atas source, di luar baris komentar) memastikan
    tidak ada referensi kode aktif ke `showPage(`/`FEATURE_REGISTRY`.

Seluruh test V2.1–V2.14A yang sudah ada (termasuk
`tests/dashboard-v2-shell.test.js`) **tidak diubah** dan tetap 100%
lulus, karena sandbox test-test tersebut tidak menyuntik
`isDashboardV2Enabled`, sehingga guard `typeof` otomatis fallback ke
`false` (dormant) — identik dengan perilaku sebelum tahap ini.

## Status & langkah berikutnya

`DashboardV2Shell.render()` kini terhubung nyata ke activation flag,
tapi flag itu sendiri tidak pernah diaktifkan oleh kode lain di repo —
Dashboard V2 tetap dormant, Dashboard lama tetap satu-satunya yang
tampil. Langkah berikutnya (di luar scope dokumen ini, butuh mandat
eksplisit terpisah) adalah menentukan *kapan* `init()`/`render()`
dipanggil dari titik masuk aplikasi nyata, dan *bagaimana* keputusan
untuk menampilkan Dashboard V2 vs Dashboard lama dibuat di level
routing/Dashboard Hub.
