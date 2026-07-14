# Dashboard V2 — Tahap V2.17 (Hero Data Integration)

Baseline: `node --test` 1625/1625 PASS (akhir Tahap V2.16 — Dashboard V2
Data Adapter Layer).
Hasil tahap ini: `node --test` **1642/1642 PASS** (+17 test baru, 0
regresi).

Referensi: instruksi sesi ini ("V2.17 — Hero Data Integration"),
`DASHBOARD-V2-DATA-ADAPTER.md` (V2.16), `DASHBOARD-V2-HERO.md` (V2.2).

## Tujuan

Dashboard V2 mulai memakai `dashboard-v2-data-adapter.js` (dibangun
V2.16, sampai tahap ini belum dipakai satu pun titik di repo), TAPI
HANYA di Hero. Bagian lain (Summary Cards, Module Grid, Statistics,
Activity, Notifications, Automation, AI, Predictive, Health) TIDAK
disentuh sama sekali.

## Yang diubah

**Satu fungsi disentuh: `_buildHero()` di `dashboard-v2-shell.js`.**
Tidak ada fungsi lain yang diedit.

### Hero V2 — sebelum (Tahap V2.2, 4 anak, TIDAK berubah)

| Elemen | id | Isi |
|---|---|---|
| Welcome title | `dashboardV2HeroTitle` | "Selamat datang (placeholder)" |
| Health Score | `dashboardV2HeroHealthScore` | teks statis placeholder |
| Balance | `dashboardV2HeroBalance` | teks statis placeholder |
| Insight | `dashboardV2HeroInsight` | teks statis placeholder |

### Hero V2 — ditambah tahap ini (4 anak baru, additive)

| Elemen | id | Sumber | Isi kalau adapter tersedia & ada data | Isi fallback |
|---|---|---|---|---|
| Finance summary | `dashboardV2HeroFinanceSummary` | `getFinanceSummary()` | `Keuangan: {accountCount} akun, Rp {totalBalance}, {transactionCount} transaksi` | `Keuangan: -- (placeholder)` |
| Vehicle summary | `dashboardV2HeroVehicleSummary` | `getVehicleSummary()` | `Kendaraan: {vehicleCount} kendaraan, {bbmLogCount} catatan BBM, {servisLogCount} catatan servis` | `Kendaraan: -- (placeholder)` |
| Family summary | `dashboardV2HeroFamilySummary` | `getFamilySummary()` | `Keluarga: {anakCount} anak, {milestoneDoneCount}/{milestoneTotalCount} milestone, {reminderCount} pengingat` | `Keluarga: -- (placeholder)` |
| Document summary | `dashboardV2HeroDocumentSummary` | `getDocumentSummary()` | `Dokumen: {simCount} SIM, {vehicleTaxDocCount} dokumen pajak kendaraan` | `Dokumen: -- (placeholder)` |

Hero jadi total **8 anak** (4 lama + 4 baru). Urutan: title,
healthScore, balance, insight, financeSummary, vehicleSummary,
familySummary, documentSummary — dirender lewat `hero.replaceChildren()`
seperti sebelumnya, tidak ada `innerHTML`.

### Cara pemanggilan adapter

```js
const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
```

Pola guard ini sama persis dengan `isDashboardV2Enabled()` (Tahap
V2.14B) — fungsi global dipanggil langsung (bukan `window.fn()`),
dilindungi `typeof fn === 'function'`. Kalau hasilnya bukan objek (mis.
`null`, karena adapter belum melihat `D`, atau adapter belum ter-load
sama sekali di halaman), elemen jatuh ke teks placeholder. Shell **tidak
pernah membaca `D` secara langsung** — satu-satunya jalur baca data
tetap lewat 4 fungsi adapter, konsisten dengan arsitektur
`DASHBOARD-V2-DATA-ADAPTER.md`:

```
D  ──(baca-saja)──▶  dashboard-v2-data-adapter.js  ──(baca-saja, guard typeof)──▶  dashboard-v2-shell.js (_buildHero saja)
```

## Constraint yang dijaga (diverifikasi test)

- **Additive** — 4 elemen Hero lama (V2.2) tidak diedit satu baris pun;
  8 sub-komponen Main lain (Summary Cards s/d Automation Center) tidak
  disentuh; `dashboard-v2-data-adapter.js` tidak diedit sama sekali
  (diverifikasi `diff` byte-identik terhadap baseline V2.16 + test
  tanda tangan API: tetap persis 4 fungsi publik + 1 guard internal,
  tanpa `let`/`var` top-level baru).
- **Tanpa fetch** — tidak ada token `fetch(` di kode aktif
  `dashboard-v2-shell.js` (diverifikasi test regex).
- **Tanpa business logic baru** — Hero murni menginterpolasi field yang
  sudah dihitung adapter (`accountCount`, `totalBalance`, dst) ke dalam
  template string; tidak ada kalkulasi/agregasi baru di shell.
- **Tanpa routing** — tidak memanggil `showPage()`.
- **Tanpa `showPage()`** — sama seperti poin di atas, diverifikasi
  eksplisit lewat regex terpisah.
- **Tanpa `FEATURE_REGISTRY`** — tidak dibaca/ditulis.
- **Tanpa state baru** — tidak ada property `this.*` instance baru di
  `DashboardV2Shell`; 4 elemen baru murni `const` lokal di dalam
  `_buildHero()`, sama seperti 4 elemen lama.
- **Tanpa mengubah adapter** — `dashboard-v2-data-adapter.js` tidak
  disentuh sama sekali tahap ini; shell hanya *memanggilnya*.
- **Fallback placeholder wajib** — ke-4 elemen baru SELALU punya
  `textContent` non-kosong, baik saat adapter tidak ter-load, adapter
  return `null` (mis. `D` belum ada), maupun adapter tersedia dgn data
  lengkap — tidak ada state "kosong/undefined" yang mungkin ter-render.
- **Dashboard existing tidak berubah** — `dashboard-hub.js`,
  `index.html`, `app_production.html` tetap 0 tersentuh.

## Test

`tests/dashboard-v2-hero-data.test.js` — 17 test baru:

1. Adapter tidak di-load sama sekali → 4 elemen baru tetap ada dgn
   fallback placeholder (Hero 8 anak).
2. 4 elemen lama (title/healthScore/balance/insight) tidak berubah.
3. Fungsi adapter tersedia tapi return `null` → tetap fallback
   placeholder, tidak error.
4–7. Masing-masing dari 4 fungsi adapter (di-mock individual) tersedia &
   ada data → elemen terkait menampilkan ringkasan sungguhan (bukan
   placeholder).
8–10. Integrasi sungguhan: `dashboard-v2-data-adapter.js` ASLI (tidak
   di-mock) + `dashboard-v2-shell.js` dalam satu sandbox, dgn `D` tiruan
   — kasus ada data (verifikasi angka di tiap 4 elemen cocok hasil
   hitung adapter dari `D`), kasus `D` belum ter-load (fallback), dan
   idempotency `render()`.
11. Aksesibilitas — 4 elemen baru semuanya punya `aria-label`.
12–14. Constraint statis: tanpa `fetch(`/`showPage(`/`FEATURE_REGISTRY`/
   `D.` langsung/`innerHTML` di `dashboard-v2-shell.js`; adapter tetap
   4 fungsi publik yang sama tanpa `let`/`var` top-level baru; ke-4
   fungsi adapter dipanggil lewat guard `typeof` (bukan unconditional).
15–16. `index.html`/`app_production.html` tetap 0 markup Dashboard V2.
17. `dashboard-hub.js` tetap tidak berubah/tidak direferensikan (guard
   mount/destroy tetap tepat 2x).

`tests/dashboard-v2-hero.test.js` (V2.2, 12 test) dan
`tests/dashboard-v2-data-adapter.test.js` (V2.16, 18 test) tetap **tidak
diubah** dan tetap 100% lulus — tidak ada satu assertion lama pun yang
perlu diperbaiki (jumlah node Hero berubah dari 4 → 8, tapi tidak ada
assertion lama yang mengecek jumlah anak Hero secara eksplisit, jadi
tidak ada file test lama yang disentuh).

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1, `dashboard-v2-data-
adapter.js` sejak V2.16; hanya isi `dashboard-v2-shell.js` yang
bertambah). File test tidak ikut proses build.

## Status

V2.17 (Hero Data Integration) **selesai**. Hero Dashboard V2 sekarang
membaca ringkasan Finance/Vehicle/Family/Documents lewat adapter V2.16
(dgn fallback placeholder aman), sementara seluruh sub-komponen Main
lain tetap 100% placeholder statis seperti sebelumnya. Wiring adapter
ke bagian lain (Summary Cards, Module Grid, dst) tetap di luar scope
tahap ini, butuh mandat eksplisit terpisah (lihat catatan "Future
integration" di `DASHBOARD-V2-DATA-ADAPTER.md`).
