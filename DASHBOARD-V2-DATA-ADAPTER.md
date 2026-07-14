# Dashboard V2 — Data Adapter Layer (Tahap V2.16)

## Tujuan

Menyiapkan SATU lapisan baca-saja (read-only) di atas state global `D`
supaya Dashboard V2 (`dashboard-v2-shell.js`, dkk) nantinya BISA membaca
ringkasan data existing lewat fungsi bernama jelas per-domain — tanpa
menduplikasi/menghitung ulang business logic yang sudah ada di modul lain,
tanpa mengubah Dashboard lama, dan tanpa mengubah business logic apa pun.
Dashboard V2 **belum** memakai adapter ini di tahap ini — tahap ini murni
membangun lapisannya.

## Hasil inspeksi repo — sumber data existing per domain

| Domain | Sumber data (`D.*`) | Ditulis oleh | Dibaca lewat |
|---|---|---|---|
| **Finance** | `D.accounts` (saldo per akun), `D.transactions` (income/expense/transfer) | `akun.js`, `transaksi.js` | `getFinanceSummary()` |
| **Vehicle** | `D.vehicles`, `D.bbmLogs`, `D.servisLogs` | `vehicle-core.js`, `tx-bbm.js`, `sparepart-servis.js` | `getVehicleSummary()` |
| **Family** | `D.catatan.anak` (perkembangan anak), `D.milestones`, `D.reminders` | modul kategori registry `'personal'` ("Fitur non-finansial keluarga" — lihat `dashboard-hub-registry.js` key `per-anak`/`per-pengingat`) | `getFamilySummary()` |
| **Documents** | `D.simList` (dokumen SIM: `{id,nama,jenis,tglAkhir,biaya}`), field dokumen pajak per kendaraan — `pajakTahunanTgl`/`pajakLimaTahunTgl`/`ujiKelayakanTgl` di tiap elemen `D.vehicles` | `vehicle-core.js` (`openSimModal()`/`openVehTaxModal()`) | `getDocumentSummary()` |

Semua field di atas sudah dideklarasikan sejak `let D = {...}` di
`features-helpers-global-security.js` (kecuali field per-vehicle
`pajakTahunanTgl` dkk yang ditulis dinamis oleh `vehicle-core.js` saat
pengguna mengisi form Pajak Kendaraan & SIM) — tidak ada field baru yang
ditambahkan ke `D` pada tahap ini.

"Documents" sengaja dipetakan ke dokumen legal/regulasi kendaraan (SIM +
pajak STNK/SPT Tahunan), sesuai satu-satunya domain "dokumen" yang punya
data terstruktur di repo saat ini (lihat `dashboard-hub-registry.js` key
`cn-pajak-sim`: *"Pajak Kendaraan & SIM — STNK, SPT Tahunan, SIM"*).

## Arsitektur

```
D (features-helpers-global-security.js, TIDAK diubah)
  .accounts / .transactions
  .vehicles / .bbmLogs / .servisLogs
  .catatan.anak / .milestones / .reminders
  .simList / .vehicles[i].pajakTahunanTgl / ...
              │
              │ DIBACA SAJA (tidak pernah ditulis)
              ▼
dashboard-v2-data-adapter.js (file baru, satu-satunya file produksi
  baru tahap ini)
  getFinanceSummary()
  getVehicleSummary()
  getFamilySummary()
  getDocumentSummary()
              │
              │ BELUM dipanggil dari mana pun (lihat "Future integration")
              ▼
dashboard-v2-shell.js (TIDAK diubah tahap ini)
```

## Activation flow

Tidak ada — tahap ini tidak menambah/mengubah lifecycle apa pun. Adapter
adalah kumpulan fungsi murni tanpa state, dipanggil langsung kapan saja
dan mengembalikan snapshot `D` saat itu juga (bukan cache/subscription).

## Guard conditions

Setiap fungsi publik memakai guard internal yang sama,
`_dashV2AdapterHasD()`:

```js
function _dashV2AdapterHasD() {
  return typeof D !== 'undefined' && D !== null && typeof D === 'object';
}
```

Kalau `D` belum ter-load (mis. adapter di-load sebelum
`features-helpers-global-security.js`, atau di sandbox test tanpa `D`),
seluruh fungsi return `null` — tidak `throw`. Di dalam tiap fungsi, setiap
field array (`D.accounts`, `D.transactions`, dst) dibaca lewat
`Array.isArray(...)` sebelum dipakai, jadi field yang hilang/`undefined`/
bukan array tidak menyebabkan error, hanya dihitung sbg array kosong.

## Lifecycle

Tidak ada lifecycle (tidak ada `init()`/`render()`/`destroy()`). Fungsi
adapter murni "hitung dari data saat ini, kembalikan objek hasil,
selesai" — tidak menyimpan hasil, tidak mendaftarkan listener, tidak
menjadwalkan apa pun.

## Constraint

- **Read-only** — tidak ada satu baris pun yang menulis ke `D` (tidak
  ada `D.x = ...`, `.push`, `.splice`, atau mutasi apa pun). Dijamin
  test lewat `Proxy` yang melempar error kalau `set`/`deleteProperty`
  terpanggil pada `D`.
- **Tanpa fetch** — tidak ada pemanggilan jaringan apa pun (dijamin
  statis: tidak ada token `fetch(` di kode aktif).
- **Tanpa state baru** — tidak ada `let`/`var` top-level di file ini
  (dijamin statis); satu-satunya deklarasi top-level adalah `function`.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `FEATURE_REGISTRY`** — tidak membaca/menulis
  `FEATURE_REGISTRY` sama sekali.
- **`dashboard-hub.js` tidak disentuh** — beda dari tahap V2.14C–V2.15
  yang selalu mengedit file ini, tahap V2.16 murni file baru terpisah.
- **`dashboard-v2-shell.js`/`dashboard-v2-activation.js` tidak
  disentuh** — dan tidak direferensikan sama sekali oleh adapter
  (dijamin statis: tidak ada token `DashboardV2Shell`).
- **Business logic tidak disentuh** — `transaksi.js`, `vehicle-core.js`,
  `akun.js`, dst tetap satu-satunya penulis `D`; adapter tidak
  menduplikasi kalkulasi apa pun dari modul-modul itu (mis. tidak
  menghitung ulang konsumsi BBM/interval servis/status jatuh tempo —
  murni jumlah & total dasar).
- **Tidak ada file test lama yang diubah** — hanya 1 file test baru.

## Test coverage

`tests/dashboard-v2-data-adapter.test.js` — 18 test:

1–3. `getFinanceSummary()`: perhitungan normal, data kosong, akun dengan
`balance` non-angka diabaikan dari total tapi tetap terhitung di
`accountCount`.
4–5. `getVehicleSummary()`: perhitungan normal, semua array kosong.
6–7. `getFamilySummary()`: perhitungan normal, `D.catatan` tidak ada/
bukan objek dengan field `anak`.
8–10. `getDocumentSummary()`: `simCount`, `vehicleTaxDocCount` dari
kombinasi field dokumen pajak per kendaraan, data kosong.
11–12. Guard: seluruh fungsi return `null` (bukan `throw`) saat `D`
belum ter-load / `D === null`.
13. Read-only: `Proxy` yang melarang `set`/`deleteProperty` pada `D`
tidak pernah terpicu saat memanggil keempat fungsi.
14–16. Tidak menyentuh `document`/DOM, tidak memanggil `showPage()`,
tidak mengakses `FEATURE_REGISTRY`.
17. Jaminan statis: tidak ada referensi tekstual `fetch(`/`showPage(`/
`FEATURE_REGISTRY`/`DashboardV2Shell` di kode aktif.
18. Jaminan statis: tidak ada deklarasi `let`/`var` top-level (murni
`function`).

```
node --test tests/dashboard-v2-data-adapter.test.js
# tests 18
# pass 18
# fail 0
```

## Dampak terhadap Dashboard lama

Nihil. Tidak ada file Dashboard lama yang disentuh (`dashboard-hub.js`
bahkan tidak diedit tahap ini). Adapter hanya membaca `D` — Dashboard
lama, business logic, dan seluruh alur baca/tulis data existing berjalan
persis seperti sebelum tahap ini.

## Future integration

- **Pemakaian oleh Dashboard V2**: `dashboard-v2-shell.js` belum
  memanggil fungsi adapter manapun — wiring itu (mis. menampilkan
  ringkasan Finance/Vehicle/Family/Documents di kartu Dashboard V2) di
  luar scope tahap ini, butuh mandat eksplisit terpisah.
- **Domain tambahan**: adapter saat ini hanya mencakup 4 domain yang
  diminta; domain lain yang punya data terstruktur (mis. Aset/
  Kekayaan Bersih, Bisnis/Shop) bisa ditambah sbg fungsi baru terpisah
  di file yang sama, mengikuti pola read-only yang sama.
- **Memoization/caching**: saat ini tiap panggilan menghitung ulang dari
  `D` langsung (tidak ada cache) — cukup murah untuk ukuran data
  personal-app ini, tapi kalau nanti dipanggil sangat sering dari render
  loop Dashboard V2, caching bisa dipertimbangkan di tahap terpisah.
