# Dashboard V2 — Tahap V2.29 (Dashboard Auto Refresh)

Baseline: ZIP V2.28 (`kw83-tahap0-feature-registry-29`), `node --test`
**1844/1844 PASS**.
Hasil tahap ini: `node --test` **1864/1864 PASS** (+20 test baru di 1
file baru, 0 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.29). Menambah
**tiga method baru** — `DashboardV2Shell.startAutoRefresh(intervalMs?)`,
`DashboardV2Shell.stopAutoRefresh()`, `DashboardV2Shell.
isAutoRefreshActive()` — di `dashboard-v2-shell.js`. Tidak mengaudit
ulang repository, tidak mengubah business logic, tidak mengubah
Activation Switch maupun lifecycle mount/refresh yang sudah ada
(`init()`/`render()`/`destroy()`/`refresh()`).

## Yang ditambahkan

### `DashboardV2Shell.startAutoRefresh(intervalMs?)`

Mulai timer periodik (`setInterval`) yang memanggil `this.refresh()`
(V2.28, **tidak diubah/di-refactor sama sekali**) tiap `intervalMs` ms.
Kalau `intervalMs` tidak diberi atau bukan angka positif, dipakai
default `AUTO_REFRESH_DEFAULT_MS` (30000ms / 30 detik). Return: id
timer (dari `setInterval`), atau `null` kalau `setInterval` tidak
tersedia di environment.

### `DashboardV2Shell.stopAutoRefresh()`

Hentikan timer aktif (kalau ada, lewat `clearInterval`), lalu reset
state internal (`_autoRefreshTimer`) ke `null`. Aman dipanggil
berkali-kali atau sebelum pernah `startAutoRefresh()` — no-op,
`return null`.

### `DashboardV2Shell.isAutoRefreshActive()`

Murni membaca state timer (`_autoRefreshTimer !== null`) — tidak
membuat/menghapus timer apa pun. `false` sebelum pernah
`startAutoRefresh()` atau setelah `stopAutoRefresh()`, `true` selagi
timer aktif.

### `DashboardV2Shell.AUTO_REFRESH_DEFAULT_MS`

Konstanta baru, `30000` (30 detik) — interval default kalau
`startAutoRefresh()` dipanggil tanpa argumen (atau dengan argumen
tidak valid).

## Cara kerja

```
startAutoRefresh(intervalMs?)
  ├─ typeof setInterval !== 'function'?          -> return null (no-op)
  ├─ stopAutoRefresh()   // bersihkan timer lama dulu (idempotency)
  ├─ ms = (intervalMs angka positif) ? intervalMs : AUTO_REFRESH_DEFAULT_MS
  ├─ this._autoRefreshTimer = setInterval(() => { this.refresh() }, ms)
  └─ return this._autoRefreshTimer

stopAutoRefresh()
  ├─ this._autoRefreshTimer !== null && typeof clearInterval === 'function'?
  │    -> clearInterval(this._autoRefreshTimer)
  ├─ this._autoRefreshTimer = null
  └─ return null

isAutoRefreshActive()
  └─ return this._autoRefreshTimer !== null
```

Tiap kali timer *tick*, satu-satunya hal yang terjadi adalah
`this.refresh()` (V2.28) dipanggil apa adanya — **0 logic baru** untuk
membangun ulang panel ditambahkan. `refresh()` sendiri tidak diubah
sama sekali; seluruh kontrak no-op-nya (before `init()`/`render()`,
atau setelah `destroy()`) tetap berlaku penuh terhadap panggilan lewat
timer, jadi tick yang terjadi di kondisi "belum siap" (root belum ada,
atau sudah `destroy()`) otomatis aman — tidak *throw*, tidak diam-diam
mount ulang.

## Kenapa timer periodik (bukan hook ke titik tulis `D`)?

Repo ini **tidak punya satu pun titik "notify data berubah" terpusat**.
State global `D` ditulis oleh banyak modul independen — `transaksi.js`,
`vehicle-core.js`, `akun.js`, `tx-bbm.js`, `sparepart-servis.js`, dan
lain-lain — tanpa event bus/pub-sub/observer apa pun yang menghubungkan
mereka. Menambah hook "notify" semacam itu ke modul-modul lain itu
jelas melanggar constraint tahap ini (*additive only*, tidak boleh
menyentuh business logic/file di luar scope, minimal diff).

Timer periodik lewat `setInterval` adalah satu-satunya jalur yang
**100% self-contained** di `dashboard-v2-shell.js` — tidak menyentuh
file lain sama sekali — sambil tetap memenuhi tujuan "Dashboard
otomatis memanggil `refresh()` saat data berubah": selama data
memang berubah di antara dua tick, panel akan otomatis reflect
perubahan itu pada tick berikutnya, tanpa caller perlu memanggil
`refresh()` secara manual. Pola ini juga konsisten dengan interval
periodik lain yang **sudah ada** di repo (`setInterval(...)` tiap 5
menit di `features-sheets-pwa-selftest.js` untuk tema/reminder/
autosync) — bukan pola baru yang asing bagi codebase ini.

## Constraint yang dijaga (diverifikasi test)

- **Reuse `refresh()` V2.28, tidak duplikasi logic** — tiap tick HANYA
  memanggil `this.refresh()`; `_buildMain()` tetap punya persis 3
  kemunculan di kode aktif (1 definisi + 1 call site `render()` + 1
  call site `refresh()`) — tidak ada call site ke-4.
- **Tidak `init()`/`destroy()`/mount ulang, tidak membuat root baru** —
  diverifikasi lewat spy: tick timer terbukti 0x memanggil `init()`/
  `render()`/`destroy()`.
- **Tick sebelum `init()`/`render()`** → aman, `refresh()` internal
  no-op, tidak ada elemen baru di `document.body`.
- **Tick setelah `destroy()`** → aman, `refresh()` internal no-op
  (root sudah terlepas), tidak diam-diam membuat root baru.
- **Tidak membaca `D` secara langsung** — diverifikasi lewat inspeksi
  source ketiga method baru (regex `\bD\.`/`\bD\[`).
- **Tidak ada `fetch()`/`showPage()`/`FEATURE_REGISTRY`/`innerHTML`**
  di ketiga method baru — diverifikasi lewat inspeksi source (regex).
- **Idempotent** — `startAutoRefresh()` dipanggil berkali-kali (baik
  dengan interval sama maupun beda) tidak pernah menumpuk lebih dari 1
  timer aktif; timer lama selalu dibersihkan dulu. Beberapa tick
  berturut-turut tidak menumpuk/mengubah jumlah panel (properti
  idempotency `refresh()` V2.28 tetap berlaku).
- **Integrasi sungguhan** — diverifikasi dengan
  `dashboard-v2-data-adapter.js` ASLI + shell dalam satu sandbox: `D`
  diubah di antara `render()` awal & tick auto-refresh, panel
  ter-update sesuai data terbaru (persis seperti `refresh()` manual
  V2.28, tanpa `destroy()`/`init()` ulang).
- **Opt-in, tidak auto-start sendiri** — memuat file
  `dashboard-v2-shell.js` saja (tanpa memanggil `startAutoRefresh()`)
  tidak membuat timer apa pun; caller harus memanggilnya secara
  eksplisit (pola sama dengan Activation Switch V2.15 yang juga
  opt-in lewat `enableDashboardV2()`).
- **Environment tanpa timer aman** — `startAutoRefresh()` di
  environment tanpa `setInterval` mengembalikan `null` tanpa *throw*.
- **Seluruh kontrak lama tetap PASS** — `node --test` penuh
  (1864 test, termasuk 1844 baseline V2.28 + 20 test baru) dijalankan
  setelah implementasi, 0 regresi.

## File yang diedit

- **`dashboard-v2-shell.js`** — SATU-SATUNYA file source yang diedit,
  aditif murni (0 baris dihapus): tambah blok komentar dokumentasi
  "Tahap V2.29" + konstanta `AUTO_REFRESH_DEFAULT_MS` + state
  `_autoRefreshTimer` + 3 method baru (`startAutoRefresh()`,
  `stopAutoRefresh()`, `isAutoRefreshActive()`). `refresh()` (V2.28),
  `init()`, `render()`, `destroy()`, dan seluruh `_build*()` builder
  existing — **0 baris diubah/di-refactor**.

## File yang TIDAK diubah

- `dashboard-v2-data-adapter.js` — byte-identik dgn baseline V2.28.
- `dashboard-hub.js` — byte-identik dgn baseline V2.28.
- `dashboard-v2-activation.js` — byte-identik dgn baseline V2.28.
- `index.html`, `app_production.html` — tidak disentuh secara manual
  (selain versi build `?v=` yang disinkronkan otomatis oleh
  `scripts/build.js`, di luar cakupan perubahan manual tahap ini).
- `FEATURE_REGISTRY`/`dashboard-hub-registry.js` — tidak
  dibaca/ditulis.
- Business logic penulis `D` (`transaksi.js`, `vehicle-core.js`,
  `akun.js`, dst) — tidak disentuh.
- Seluruh 1844 test lama (baseline V2.28) — tidak satu pun diubah.

## Catatan pemakaian (opt-in, belum diwiring ke aplikasi produksi)

Sama seperti seluruh lini Dashboard V2 (V2.1–V2.28), fitur ini
**opt-in murni** — memuat `dashboard-v2-shell.js` saja tidak membuat
timer apa pun berjalan. Caller (mis. kode aktivasi/mount lain, di luar
scope tahap ini) perlu memanggil `DashboardV2Shell.startAutoRefresh()`
secara eksplisit untuk mengaktifkan auto-refresh, dan
`DashboardV2Shell.stopAutoRefresh()` untuk menghentikannya. Karena
tidak ada kode produksi yang memanggil `enableDashboardV2()`/
`startAutoRefresh()`, Dashboard V2 (termasuk auto-refresh-nya) tetap
sepenuhnya dormant secara default — Dashboard lama tetap satu-satunya
yang tampil ke pengguna, konsisten dengan seluruh tahap sebelumnya.

## Hasil test

```
node --test tests/dashboard-v2-auto-refresh.test.js
# tests 20
# pass 20
# fail 0

node --test
# tests 1864
# pass 1864
# fail 0

node scripts/build.js
# ✅ Build "kw83-tahap0-feature-registry-31" selesai & lolos cek sintaks

node --test   (setelah build)
# tests 1864
# pass 1864
# fail 0
```
