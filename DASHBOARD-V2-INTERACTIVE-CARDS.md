# Dashboard V2 — Tahap V2.30 (Interactive Dashboard Cards)

Baseline: ZIP V2.29 (`kw83-tahap0-feature-registry-31`), 1864/1864 test
PASS.

Instruksi sesi ini: tambahkan interaksi klik pada Dashboard V2 memakai
mekanisme navigasi existing, reuse helper/API yang sudah ada, tanpa baca
`D` langsung, tanpa business logic baru, additive only.

## Yang ditambahkan

- **`dashboard-v2-shell.js`** — `_buildModuleGrid()` (Module Grid, Tahap
  V2.4/V2.19): 3 dari 6 kartu placeholder lama (**Finance**, **Vehicle**,
  **Settings**) sekarang klik-able. Kartu lain (**Reports**, **Family**,
  **Documents**) TIDAK berubah — tetap placeholder murni seperti sejak
  V2.4.

  Mekanisme yang dipakai (100% reuse, 0 fungsi baru):
  1. Kartu diberi `role="button"`, `tabindex="0"`, `data-action=
     "dashHubNavigateToFeature"`, `data-args='[{"page":"keuangan"}]'`
     (atau `"carnotes"`/`"settings"`) — pola atribut deklaratif yang
     SAMA PERSIS dengan `data-action="openTxModal" data-args='["expense"]'`
     yang sudah dipakai puluhan tombol lain di `index.html`.
  2. Dispatcher klik global yang **sudah ada**
     (`features-helpers-global-security.js`, `document.addEventListener
     ('click', ...)`, TIDAK diubah) membaca `data-action`/`data-args`
     elemen manapun di DOM (event delegation) dan memanggil fungsi global
     sesuai nama.
  3. `dashHubNavigateToFeature({page})` (`dashboard-hub.js`, TIDAK
     diubah) menerima target itu dan memanggil `showPage(target.page,
     navItems[PAGE_NAV_IDX[target.page]] || null)`.
  4. `showPage()` (`modal-navigasi.js`, TIDAK diubah) — router utama app
     yang sudah dipakai puluhan tempat lain — yang benar-benar
     memindahkan halaman aktif.

  Akibatnya **`dashboard-v2-shell.js` sendiri tidak pernah memanggil
  `showPage()`/`FEATURE_REGISTRY`/`addEventListener`/`.onclick=` secara
  tekstual** — file ini hanya menaruh atribut deklaratif; seluruh logic
  navigasi & routing 100% reuse fungsi yang sudah ada, tidak menulis
  fungsi navigasi baru.

- **`tests/dashboard-v2-interactive-cards.test.js`** (file baru, 1 test)
  — test INTEGRASI: memuat `dashboard-v2-shell.js` bersama
  `dashboard-hub.js` ASLI (bukan mock) di satu sandbox, benar-benar
  memanggil rantai `data-action` → `dashHubNavigateToFeature()` →
  `showPage()` (di-stub) untuk ketiga kartu (Finance/Vehicle/Settings) dan
  memverifikasi nama page yang benar terpanggil tepat 1x; juga
  memverifikasi Reports/Family/Documents tetap 0 `data-action`.

## Kenapa hanya 3 dari 6 kartu (Finance/Vehicle/Settings)

`dashHubNavigateToFeature({page})` butuh **satu** nama page tunggal yang
valid di `PAGE_NAV_IDX` (`dashboard-hub.js`): `dashboard`, `keuangan`,
`shop`, `ai`, `carnotes`, `pajak`, `settings`. Finance→`keuangan`,
Vehicle→`carnotes`, Settings→`settings` adalah pemetaan 1:1 yang tidak
ambigu. Tiga kartu lain sengaja TIDAK diwire tahap ini:

| Kartu | Kenapa belum diwire |
|---|---|
| Reports | "Laporan" adalah TAB di dalam halaman Keuangan (`{page:'keuangan', tab:'laporan'}`), bukan page tersendiri — perlu keputusan eksplisit apakah kartu ini membuka Keuangan tab Kelola (default) atau langsung tab Laporan |
| Family | Data keluarga (`D.catatan.anak`/milestones) saat ini tersaji lewat LifeOS di dalam `page-dashboard-hub` sendiri, bukan page terpisah — tidak ada target navigasi yang masuk akal tanpa keputusan produk baru |
| Documents | Data dokumen (SIM, pajak kendaraan) tersebar antara halaman Vehicle & Pajak, tidak py 1 page tunggal yang mewakilinya |

Menebak salah satu dari ketiga pemetaan ini adalah keputusan produk, bukan
sekadar "pasang kabel ke mekanisme yang sudah ada" — sesuai instruksi
sesi ini ("jangan tambah business logic baru"), scope tahap ini dibatasi
ke 3 kartu yang punya jawaban tunggal & tidak ambigu. Wiring 3 kartu sisa
bisa jadi tahap terpisah setelah pemetaan page/tab-nya diputuskan
eksplisit.

## Constraint yang dijaga (diverifikasi test)

- **Additive murni** — 0 baris kode existing dihapus di
  `dashboard-v2-shell.js` (diverifikasi `diff`); satu-satunya perubahan
  struktural adalah menambah field `page` di 6 entri `modules[]` &
  membungkus pembuatan kartu lama dalam `if (mod.page) {...} else {...}`
  dengan cabang `else` = kode lama persis tidak berubah.
- **Tidak ada `showPage(`/`addEventListener`/`.onclick =`/
  `FEATURE_REGISTRY` di `dashboard-v2-shell.js`** — diverifikasi
  regex-check yang sudah ada sejak V2.3 (`tests/dashboard-v2-
  summary.test.js`) TETAP lulus tanpa modifikasi, karena V2.30 murni
  menaruh atribut `data-action`/`data-args`, bukan memanggil fungsi
  routing secara langsung.
- **Tidak membaca `D` langsung** — kartu hanya membawa nama page statis
  (`'keuangan'`/`'carnotes'`/`'settings'`), tidak ada logic baca data apa
  pun.
- **Tidak ada fungsi baru** — `dashHubNavigateToFeature()`,
  `PAGE_NAV_IDX`, `showPage()`, dan dispatcher `data-action` global
  semuanya sudah ada sebelum tahap ini; `dashboard-v2-shell.js` hanya
  mengaktifkan atribut yang membuat mekanisme existing itu terpanggil.
- **`dashboard-hub.js`, `modal-navigasi.js`,
  `features-helpers-global-security.js`, `modules-render.js`,
  `dashboard-hub-registry.js`** — 0 baris diubah.

## Test

```
node --test tests/dashboard-v2-interactive-cards.test.js
# tests 1 / pass 1 / fail 0

node --test
# tests 1865 / pass 1865 / fail 0

node scripts/build.js
# ✅ Build "kw83-tahap0-feature-registry-32" selesai & lolos cek sintaks

node --test   (setelah build)
# tests 1865 / pass 1865 / fail 0
```

## Test lama yang diperbarui (bukan file baru — update assersi obsolete)

Assersi berikut sudah tidak akurat sejak Finance/Vehicle/Settings jadi
interaktif, jadi diperbarui (bukan dihapus, tetap 100% men-cover
perilaku barunya + perilaku 3 kartu yang tidak berubah):

- `tests/dashboard-v2-summary.test.js` — test "Module Grid: 6 module card
  ... sesuai urutan & placeholder" diganti jadi memverifikasi
  Finance/Vehicle/Settings punya `role="button"`/`data-action`/
  `data-args` yang benar & TIDAK lagi match `/placeholder/i`, sedangkan
  Reports/Family/Documents tetap match `/placeholder/i` & 0
  `data-action`.
- `tests/dashboard-v2-module-grid-data.test.js` — test "6 kartu lama ...
  tidak berubah" diganti jadi memverifikasi Finance/Vehicle/Settings
  punya `data-action` yang benar, Reports/Family/Documents tetap 0
  `data-action`.

Tidak ada test lain (di luar 2 file di atas) yang perlu diperbarui —
semua regex-check global (`showPage(`, `addEventListener`,
`.onclick =`, `FEATURE_REGISTRY`) di file test lain tetap valid tanpa
modifikasi karena V2.30 tidak pernah menulis pola-pola itu secara
tekstual di `dashboard-v2-shell.js`.

## Diverifikasi dgn diff

`diff -rq` antara baseline (akhir Tahap V2.29) dan hasil akhir tahap ini
— perubahan manual hanya:
- `dashboard-v2-shell.js` (diubah, aditif — 0 baris dihapus)
- `tests/dashboard-v2-summary.test.js` (diubah, assersi obsolete
  diperbarui)
- `tests/dashboard-v2-module-grid-data.test.js` (diubah, assersi
  obsolete diperbarui)
- `tests/dashboard-v2-interactive-cards.test.js` (baru)
- `DASHBOARD-V2-INTERACTIVE-CARDS.md` (baru)
- `CHANGELOG.md`/`FILES-CHANGED.md` (aditif)

Sisanya (`app-bundle-*.min.js`, `app_production.html`, `index.html`,
`sw.js`, `docs/FILE-MAP.md`, 6 file sinkronisasi versi konstanta) adalah
efek otomatis `node scripts/build.js` (bump nomor versi build), bukan
sentuhan manual.
