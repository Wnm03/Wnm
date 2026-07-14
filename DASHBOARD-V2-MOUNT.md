# Dashboard V2 — Mount ke Halaman Dashboard (Tahap V2.14C)

## Tujuan

Dashboard V2 mulai bisa **di-mount** ke halaman Dashboard — tapi hanya
kalau activation flag (`isDashboardV2Enabled()`, V2.14A) bernilai
`true`. Dashboard lama tetap default. Routing (`showPage()`) tidak
diubah.

## Apa yang berubah

Satu file diedit: `dashboard-hub.js`, method `DashboardHub.render()`.

`DashboardHub.render()` sudah punya pola conditional-render untuk
beberapa sub-modul opsional (LifeOS, Favorit View, Hero, Summary Cards,
Analytics) — masing2 dalam bentuk:

```js
if (typeof NamaModul !== 'undefined') NamaModul.render();
```

Tahap ini menambah SATU blok baru dengan pola yang sama, di akhir
method, setelah blok `DashboardHubAnalytics`:

```js
if (typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === true
  && typeof DashboardV2Shell !== 'undefined') {
  DashboardV2Shell.init();
  DashboardV2Shell.render();
}
```

| `isDashboardV2Enabled()` | Perilaku |
|---|---|
| `false` (default) | Blok ini **no-op total**. `DashboardV2Shell` tidak disentuh. Dashboard lama berjalan identik dengan sebelum tahap ini. |
| `true` | `DashboardV2Shell.init()` dipanggil, lalu `DashboardV2Shell.render()`. |

Guard ganda (`typeof isDashboardV2Enabled === 'function'` dan
`typeof DashboardV2Shell !== 'undefined'`) memastikan blok ini tidak
error kalau salah satu atau kedua modul itu belum ter-load di suatu
environment — fallback-nya selalu "tidak mount", konsisten dengan
default dormant.

## Kenapa di `DashboardHub.render()`?

Ini adalah satu-satunya titik "Dashboard dibuka" yang sudah ada di
repo — dipanggil setiap kali halaman Dashboard Hub dirender. Menaruh
blok mount di sini (mengikuti pola conditional-render existing yang
sudah dipakai 5 kali untuk sub-modul lain) adalah cara paling additive
untuk memenuhi mandat "saat Dashboard dibuka" tanpa menyentuh
`showPage()` atau menambah titik masuk baru.

## Kenapa `init()` dan `render()` dipanggil setiap kali, bukan sekali saja?

Keduanya sudah idempotent by contract sejak V2.1 (`init()`) dan V2.14B
(`render()` — hanya toggle 2 atribut + `replaceChildren()`, tidak
menumpuk). Memanggil keduanya setiap kali `DashboardHub.render()`
jalan bukan hanya aman, tapi juga yang paling sederhana: tidak perlu
state tambahan di `DashboardHub` untuk "sudah pernah mount atau belum"
— satu-satunya sumber kebenaran tetap `isDashboardV2Enabled()`.

## Constraint yang dipatuhi

- **Tidak mengubah `showPage()`** — tidak disentuh sama sekali.
- **Tidak mengubah `FEATURE_REGISTRY`** — dibaca oleh kode LAMA di atas
  blok mount (perilaku sebelum tahap ini), blok mount itu sendiri tidak
  menyebut `FEATURE_REGISTRY` sama sekali.
- **Tidak mengubah Finance/Vehicle/Reports/AI** — tidak disentuh.
- **Tidak ada `fetch`** — tidak ditambahkan.
- **Tidak ada business logic baru** — blok mount murni baca 1 boolean
  lalu panggil 2 method existing dari modul lain.
- **Hanya mount shell** — tidak ada logic tambahan di
  `dashboard-v2-shell.js` atau `dashboard-v2-activation.js` (keduanya
  tidak disentuh tahap ini).

## Kenapa 12 test lama perlu diperbarui?

Sejak V2.1, setiap file test Dashboard V2 (V2.5–V2.13, plus
`dashboard-v2-shell.test.js` sendiri) punya satu assertion yang
menjamin `dashboard-hub.js` **sama sekali tidak** mereferensikan
`DashboardV2Shell` — jaminan itu benar untuk V2.1–V2.14B, tapi menjadi
usang begitu tahap ini secara eksplisit dimandatkan untuk menghubungkan
keduanya. Assertion itu diperbarui (bukan dihapus) menjadi: referensi
`DashboardV2Shell` di `dashboard-hub.js` harus muncul **tepat satu
kali**, **di dalam guard `typeof DashboardV2Shell !== 'undefined'`** —
jaminan yang setara ketatnya (memastikan tidak ada pemanggilan
tersebar/unconditional), hanya diperbarui agar sesuai realita baru yang
sengaja dimandatkan tahap ini. Tidak ada assertion lain di ke-12 file
tsb yang diubah.

## Cakupan test

`tests/dashboard-v2-mount.test.js` (11 test, memakai mock manual untuk
`DashboardV2Shell`/`isDashboardV2Enabled` — logic masing2 modul asli
sudah dites terpisah di file test-nya sendiri):

1. Default (flag `false`) → Dashboard lama tetap jalan, `DashboardV2Shell` tidak dipanggil sama sekali.
2. Flag `true` → `DashboardV2Shell.init()` dipanggil.
3. Flag `true` → `DashboardV2Shell.render()` dipanggil.
4. Flag `false` (disable) → Dashboard lama tetap, `DashboardV2Shell` tidak dipanggil.
5. `DashboardHub.render()` dipanggil berkali-kali saat flag `true` → `init()`/`render()` ikut 1:1 (bukan dobel per panggilan).
6. Render tidak dobel dalam satu panggilan `DashboardHub.render()` (masing2 tepat 1x).
7. Environment tanpa `isDashboardV2Enabled` sama sekali → tidak error, tidak mount.
8. Environment tanpa `DashboardV2Shell` sama sekali → tidak error walau flag `true`.
9. Tidak memanggil `showPage()` (flag true maupun false).
10. Blok mount tidak "memakai" `FEATURE_REGISTRY` dengan cara baru.
11. Cek statis (grep atas potongan source di sekitar blok mount) memastikan blok itu tidak mereferensikan `FEATURE_REGISTRY`/`showPage(` secara tekstual.

## Status & langkah berikutnya

Dashboard V2 kini bisa ter-mount nyata ke DOM — tapi HANYA kalau
activation flag diaktifkan, dan tidak ada satu pun kode produksi di
repo yang melakukan itu. Dashboard lama tetap default & satu-satunya
yang tampil ke pengguna. Langkah berikutnya (di luar scope dokumen ini,
butuh mandat eksplisit terpisah): titik masuk nyata untuk mengaktifkan
flag ini (mis. toggle developer/QA, query-param, atau UI settings), dan
keputusan kapan/bagaimana Dashboard V2 akhirnya menggantikan Dashboard
lama secara visual.
