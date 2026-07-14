# Dashboard V2 — Tahap V2.28 (Dashboard Refresh Lifecycle)

Baseline: ZIP V2.27 (`kw83-tahap0-feature-registry-28`), `node --test`
**1822/1822 PASS**.
Hasil tahap ini: `node --test` **1844/1844 PASS** (+22 test baru di 1
file baru, 0 assersi lama disesuaikan, 0 regresi).

Referensi: instruksi sesi ini (Dashboard V2 Tahap V2.28). Menambah
**satu method baru**, `DashboardV2Shell.refresh()`, di
`dashboard-v2-shell.js`. Tidak mengaudit ulang repository, tidak
mengubah business logic, tidak mengubah Activation Switch maupun
lifecycle mount yang sudah ada (`init()`/`render()`/`destroy()`).

## Yang ditambahkan

### `DashboardV2Shell.refresh()`

Method baru yang memperbarui **isi** seluruh panel yang sudah memakai
`dashboard-v2-data-adapter.js` (V2.16) — **tanpa** `destroy()`/
`init()`/`render()` ulang, **tanpa** membuat root/main baru, **tanpa**
mount ulang komponen top-level (Sidebar/Header/Bottom Nav/FAB).

11 panel yang di-refresh (semua sudah memakai adapter sejak tahap
masing-masing):

| Panel | id | Tahap adapter |
|---|---|---|
| Hero | `dashboardV2Hero` | V2.17 |
| Summary Cards | `dashboardV2SummaryCards` | V2.18 |
| Module Grid | `dashboardV2ModuleGrid` | V2.19 |
| Statistics Panel | `dashboardV2StatisticsPanel` | V2.20 |
| Recent Activity | `dashboardV2RecentActivity` | V2.21 |
| Upcoming Tasks | `dashboardV2UpcomingTasks` | V2.22 |
| Notifications | `dashboardV2Notifications` | V2.23 |
| Automation Center | `dashboardV2AutomationCenter` | V2.24 |
| AI Command Center | `dashboardV2AiCommandCenter` | V2.25 |
| Health Score | `dashboardV2HealthScore` | V2.26 |
| Predictive Insights | `dashboardV2PredictiveInsights` | V2.27 |

(Quick Actions & Insight Panel sengaja TIDAK ikut — kedua panel itu
tidak pernah memakai adapter, murni placeholder statis sejak V2.3/
V2.4, jadi tidak ada yang perlu di-refresh.)

### Cara kerja

```
refresh()
  ├─ this._root belum ada / sudah ter-detach dari DOM?  -> return null (no-op)
  ├─ document tidak tersedia?                             -> return null (no-op)
  ├─ telusuri root.children, cari anak id "dashboardV2Main"
  │    tidak ketemu (belum pernah render())               -> return null (no-op)
  ├─ freshMain = this._buildMain(document)   // builder existing, apa adanya
  └─ main.replaceChildren(...freshMain.children)   // main NODE tetap sama,
                                                     // isinya diganti
```

- `this._buildMain(document)` adalah builder yang **sudah ada** sejak
  V2.1 (dipakai juga oleh `render()`) — dipanggil apa adanya, **0
  baris diubah/di-refactor**. Builder inilah yang (lewat guard
  `typeof fn === 'function'` yang sudah ada sejak V2.17–V2.24)
  memanggil `getFinanceSummary()`/`getVehicleSummary()`/
  `getFamilySummary()`/`getDocumentSummary()`.
- `refresh()` sendiri **tidak pernah** menyebut `getFinanceSummary`/
  `getVehicleSummary`/`getFamilySummary`/`getDocumentSummary` atau `D`
  secara langsung — satu-satunya hal yang dilakukan `refresh()` adalah
  memanggil `_buildMain()` lalu memindahkan hasilnya ke node `main`
  yang sudah ada.
- Perpindahan children dilakukan lewat `replaceChildren()` (fallback
  manual `removeChild`/`appendChild` kalau `replaceChildren` tidak
  tersedia) — pola identik dengan yang sudah dipakai `render()`/
  `destroy()` sejak V2.1. **Bukan** `innerHTML`.

### Kenapa tidak memanggil `render()` ulang?

`render()` membangun ulang **kelima** komponen top-level lewat
`root.replaceChildren(sidebar, header, main, bottomNav, fab)` — setiap
panggilan membuat instance `sidebar`/`header`/`main`/`bottomNav`/`fab`
yang baru semua. Itu efektif "mount ulang", yang dilarang eksplisit
untuk tahap ini. `refresh()` sebaliknya tidak pernah menyentuh
`root.children` sama sekali — `sidebar`/`header`/`main`/`bottomNav`/
`fab` tetap **node yang sama** (referensi tidak berubah) sebelum &
sesudah `refresh()`; satu-satunya yang berubah adalah **isi**
(children) dari node `main` yang sudah ada.

## Constraint yang dijaga (diverifikasi test)

- **Belum `init()`** → `refresh()` no-op, `return null`, tidak membuat
  apa pun di `document.body`, dan sengaja **tidak** memanggil
  `init()`.
- **Belum `render()`** (sudah `init()` tapi root belum py anak `main`)
  → `refresh()` no-op, `return null`, sengaja **tidak** memanggil
  `render()`.
- **Tidak pernah memanggil `init()`/`destroy()`/`render()`** dari
  dalam `refresh()` (diverifikasi lewat spy di test).
- **Tidak membuat root baru** — referensi `Shell._root` &
  `document.body.children.length` tidak berubah setelah `refresh()`.
- **Tetap memakai adapter** — diverifikasi lewat integrasi sungguhan
  (`dashboard-v2-data-adapter.js` ASLI + shell dalam satu sandbox):
  data `D` diubah **di antara** `render()` awal & `refresh()`, lalu
  seluruh 11 panel dipastikan reflect data terbaru tanpa
  destroy()/init() ulang.
- **Tidak membaca `D` secara langsung** — diverifikasi lewat inspeksi
  source method `refresh()` (regex `\bD\.`/`\bD\[`) selain lewat 4
  fungsi adapter (yang pun dipanggil secara tidak langsung oleh
  builder, bukan oleh `refresh()` sendiri).
- **Tidak ada `fetch()`/`showPage()`/`FEATURE_REGISTRY`/`innerHTML`/
  query DOM global** di dalam `refresh()` — diverifikasi lewat
  inspeksi source (regex).
- **Idempotent** — `refresh()` dipanggil berkali-kali tidak menumpuk
  node; jumlah & urutan panel di `main` tetap sama.
- **Tidak mengubah Activation Switch** — atribut `hidden`/
  `data-dashboard-v2-state` di root (diset `render()` berdasarkan
  `isDashboardV2Enabled()`, V2.14B) dipastikan tidak berubah setelah
  `refresh()`; source `refresh()` juga dipastikan tidak menyebut
  `isDashboardV2Enabled` sama sekali.
- **Tidak mengubah mount lifecycle** — referensi
  `root`/`sidebar`/`header`/`main`/`bottomNav`/`fab` dipastikan SAMA
  (`===`) sebelum & sesudah `refresh()` (termasuk dipanggil
  berkali-kali).
- **Hanya memperbarui isi panel** — `children` Sidebar/Header/Bottom
  Nav dipastikan **tidak berubah** (`deepEqual`) setelah `refresh()`;
  hanya `children` dari `main` yang diganti (dengan set & urutan id
  panel yang tetap sama).
- **Seluruh kontrak lama tetap PASS** — `node --test` penuh
  (1844 test, termasuk 1822 baseline V2.27 + 22 test baru) dijalankan
  setelah implementasi, 0 regresi.

## File yang diedit

- **`dashboard-v2-shell.js`** — SATU-SATUNYA file source yang diedit,
  aditif murni (0 baris dihapus): tambah blok komentar dokumentasi
  "Tahap V2.28" + method `refresh()`. `init()`, `render()`,
  `destroy()`, dan seluruh `_build*()` builder existing (Sidebar,
  Header, Hero, Summary Cards, Quick Actions, Module Grid, Insight
  Panel, Recent Activity, Statistics Panel, Upcoming Tasks,
  Notifications, AI Command Center, Health Score, Predictive Insights,
  Automation Center, Bottom Nav, Main) — **0 baris diubah/di-refactor**.

## File yang TIDAK diubah

- `dashboard-v2-data-adapter.js` — byte-identik dgn baseline V2.27.
- `dashboard-hub.js` — byte-identik dgn baseline V2.27.
- `dashboard-v2-activation.js` — byte-identik dgn baseline V2.27.
- `index.html`, `app_production.html` — tidak disentuh secara manual
  (selain versi build `?v=` yang disinkronkan otomatis oleh
  `scripts/build.js`, di luar cakupan perubahan manual tahap ini).
- `FEATURE_REGISTRY`/`dashboard-hub-registry.js` — tidak
  dibaca/ditulis.
- Business logic penulis `D` (`transaksi.js`, `vehicle-core.js`,
  `akun.js`, dst) — tidak disentuh.
- Seluruh 1822 test lama (baseline V2.27) — tidak satu pun diubah.

## Hasil test

```
node --test tests/dashboard-v2-refresh.test.js
# tests 22
# pass 22
# fail 0

node --test
# tests 1844
# pass 1844
# fail 0

node scripts/build.js
# ✅ Build "kw83-tahap0-feature-registry-29" selesai & lolos cek sintaks

node --test   (setelah build)
# tests 1844
# pass 1844
# fail 0
```
