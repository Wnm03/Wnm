# Dashboard V2 — Tahap V2.31 (Hero Real Data)

Baseline: Dashboard V2 V2.30.1 (Stable) — mutual-exclusion Dashboard Hub
↔ Dashboard V2 sudah selesai, `node --test` **1870/1870 PASS**, build PASS.

Hasil tahap ini: `node --test` **1876/1876 PASS** (+6 test baru, 0
regresi).

Referensi: instruksi sesi ini (V2.31 — Hero Real Data). Scope dibatasi
ketat ke builder Hero (`_buildHero()` di `dashboard-v2-shell.js`) SAJA.

## Apa yang berubah

Sejak Tahap V2.2 (`DASHBOARD-V2-HERO.md`), Hero punya 4 placeholder
statis: **welcome title**, **Health Score**, **Balance**, **Insight**.
Tahap V2.17 (`DASHBOARD-V2-HERO-DATA.md`) menambah 4 elemen BARU di
sebelahnya (Finance/Vehicle/Family/Document summary) yang sudah memakai
`dashboard-v2-data-adapter.js`, TAPI 4 placeholder lama itu sendiri
sengaja dibiarkan statis.

Tahap ini (V2.31) **mengganti isi 4 placeholder lama itu** dengan data
nyata — bukan menambah elemen baru lagi. id/class/`data-dashboard-v2-part`
setiap elemen **tidak berubah**, hanya `textContent`/`aria-label`-nya:

| Elemen | id | Sebelum (V2.2) | Sesudah (V2.31, adapter tersedia) |
|---|---|---|---|
| Welcome title | `dashboardV2HeroTitle` | `Selamat datang (placeholder)` | `Selamat datang — {N} data tercatat` |
| Health Score | `dashboardV2HeroHealthScore` | `Skor Hidup Seimbang: -- (placeholder)` | `Skor Kelengkapan Data: {X}/4 kategori terisi` |
| Balance | `dashboardV2HeroBalance` | `Saldo: Rp -- (placeholder)` | `Saldo: Rp {totalBalance}` |
| Insight | `dashboardV2HeroInsight` | `Insight (placeholder)` | `Insight: {accountCount} akun, {vehicleCount} kendaraan, {anakCount} anak, {simCount} SIM dipantau` |

Sumber data: 4 fungsi `dashboard-v2-data-adapter.js` (V2.16, **tidak
diubah sama sekali**) — `getFinanceSummary()`, `getVehicleSummary()`,
`getFamilySummary()`, `getDocumentSummary()`. Ini fungsi yang **sama
persis** yang sudah dipakai 4 elemen data summary V2.17 — dipanggil satu
kali per render (dipindah ke atas `_buildHero()`, di-REUSE oleh
placeholder lama & elemen V2.17 sekaligus, tidak fetch dobel).

## Keputusan cakupan: Health Score

`dashboard-v2-data-adapter.js` **tidak punya** fungsi skor "Hidup
Seimbang" — skor itu dihitung `LifeBalance.compute()` di
`hidup-seimbang.js`, sebuah modul business-logic terpisah, bukan bagian
dari adapter. Instruksi tahap ini melarang mengubah adapter maupun
membaca `D`/modul lain langsung dari shell, jadi mengambil skor asli itu
di luar scope.

Elemen Health Score karena itu diisi ulang maknanya jadi **Skor
Kelengkapan Data**: proporsi domain (Keuangan/Kendaraan/Keluarga/Dokumen)
yang sudah punya minimal 1 data, dihitung murni dari 4 field `*Count`
yang sudah ada di 4 objek summary adapter — interpolasi presentasional
sederhana, **bukan** formula/skor bisnis baru. Ini tidak diklaim sebagai
skor Hidup Seimbang yang sebenarnya; wiring `LifeBalance` yang
sesungguhnya ke Hero tetap di luar scope, butuh mandat eksplisit
terpisah.

## Constraint yang dijaga (diverifikasi test)

- **Edit HANYA `_buildHero()`** — seluruh `_build*()` builder lain
  (Summary Cards, Quick Actions, Module Grid, dst) di
  `dashboard-v2-shell.js` 0 baris tersentuh.
- **`dashboard-v2-data-adapter.js` tidak diubah** — 0 byte, tetap persis
  5 fungsi (`_dashV2AdapterHasD` + 4 fungsi publik) seperti baseline
  V2.16, tanpa `let`/`var` top-level baru (diverifikasi test regex).
- **Shell tidak pernah membaca `D` langsung** — satu-satunya jalur baca
  tetap lewat 4 fungsi adapter, dipanggil lewat guard
  `typeof fn === 'function'` (pola sama persis dgn V2.17/V2.18).
  Diverifikasi test regex `/\bD\.\w/` tidak ditemukan di
  `dashboard-v2-shell.js`.
- **`DashboardHub`/`dashboard-hub.js` tidak diubah** — guard
  `typeof DashboardV2Shell !== 'undefined'` tetap muncul tepat 2x (mount
  + auto-destroy), sama seperti V2.30.1.
- **Tidak ada business logic baru** — healthScore/title/insight murni
  interpolasi string dari count yang sudah dihitung adapter, bukan
  formula baru; tidak ada `fetch()`, tidak ada `showPage()`, tidak ada
  `FEATURE_REGISTRY`, tidak ada `innerHTML`.
- **Additive di level perilaku** — kalau adapter/`D` belum tersedia, 4
  elemen fallback ke teks placeholder ASLI V2.2 byte-identik (bukan
  error/kosong), sehingga jalur lama tetap bisa diuji tanpa perubahan.
- **Reuse murni** — tidak ada fungsi/helper baru ditulis; hanya
  memanggil ulang 4 fungsi adapter yang sudah ada & interpolasi field
  yang sudah dihitungnya.
- **`index.html`/`app_production.html` tidak berubah** — Hero tetap
  self-mounting via JS, 0 markup Dashboard V2 baru.

## Test

`tests/dashboard-v2-hero-real-data.test.js` — 6 test baru:

1. Adapter + `D` tiruan tersedia → 4 placeholder lama menampilkan data
   nyata (title/healthScore/balance/insight semuanya tidak lagi match
   `/placeholder/i`, nilai numerik diverifikasi persis), 4 elemen V2.17
   tetap ada & tetap benar.
2. Health Score dgn 1 domain kosong (kendaraan) → tetap dihitung `3/4`
   (bukan fallback total), membuktikan perhitungan murni count, bukan
   business logic baru yang butuh "semua penuh".
3. Adapter TIDAK di-load → 4 placeholder lama fallback ke teks
   placeholder ASLI V2.2 **byte-identik** (regresi non-obsolete).
4. Constraint: shell tidak membaca `D` langsung / tidak ada
   `fetch()`/`showPage()`/`FEATURE_REGISTRY`/`innerHTML`.
5. Constraint: `dashboard-v2-data-adapter.js` tidak diubah (tanda tangan
   5 fungsi persis sama, tanpa `let`/`var` top-level).
6. Constraint: `dashboard-hub.js` tidak diubah (guard
   `DashboardV2Shell` tetap tepat 2x).

`tests/dashboard-v2-hero.test.js` (V2.2, 12 test) dan
`tests/dashboard-v2-hero-data.test.js` (V2.17, 17 test) **tidak diubah
sama sekali** dan tetap 100% lulus — dijalankan ulang bersama suite penuh
sebagai bukti tidak ada regresi. Keduanya kebetulan tidak menjadi obsolete
karena sama-sama me-load `dashboard-v2-shell.js` tanpa
`dashboard-v2-data-adapter.js`, sehingga tetap menguji jalur fallback
placeholder yang memang tidak berubah perilakunya di tahap ini.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isi
`_buildHero()` yang berubah). File test tidak ikut proses build.

## Status

V2.31 (Hero Real Data) **selesai**. Hero tetap dormant, tidak wired ke
routing/`FEATURE_REGISTRY`. Wiring skor Hidup Seimbang yang sesungguhnya
(`LifeBalance.compute()`) ke Hero, migrasi elemen `dashhub-*` existing ke
Main Content Container, dan Summary Cards/Module Grid/panel lain yang
juga masih punya placeholder lama tidak tersentuh — tetap di luar scope,
butuh mandat eksplisit terpisah per builder.
