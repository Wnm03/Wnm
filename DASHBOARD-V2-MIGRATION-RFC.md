# RFC — Dashboard V2 Migration (Tahap V2.1: Layout Foundation)

**Status: PLANNING ONLY. Tidak ada perubahan kode di dokumen ini.**
Baseline: `node --test` 1398/1398 PASS (tidak berubah — tidak ada file
kode yang disentuh tahap ini).

Konfirmasi scope dari sesi ini: "Dashboard V2" = evolusi dari Hero
Dashboard existing (`#page-dashboard-hub`, `dashboard-hub.js`), BUKAN
dashboard baru terpisah. RFC ini adalah gerbang persetujuan sebelum
implementasi bertahap dimulai.

---

## 1. Audit — State Existing

### 1.1 "Dashboard V2" sudah dipakai sebagai nama utk Hero Dashboard

Sejak Tahap 0 (blueprint) sampai Tahap 16 (16 sesi), istilah **"Dashboard
V2"** / **"Hero Dashboard"** merujuk ke `#page-dashboard-hub` dan sudah
eksplisit ditulis "TIDAK DIUBAH" di **15 dokumen** (`CHANGELOG.md`,
`AI-COMMAND-CENTER-FOUNDATION.md`, `BORDER-RADIUS-TOKEN-MIGRATION.md`,
`CAR-NOTES-2.0.md`, `FONT-SIZE-TOKEN-MIGRATION.md`,
`MODAL-EXIT-ANIMATION.md`, `PAGE-CONTAINER-MAXWIDTH.md`,
`SECONDARY-CLICKABLE-HOVER.md`, `SHOP-2.0.md`,
`TOUCH-TARGET-PADDING.md`, `TRANSITION-DURATION-TOKENS.md`, dll).
Sesi ini adalah **titik balik resmi** — mulai sekarang Dashboard V2
BOLEH disentuh (mandat eksplisit dari sesi ini), tapi bertahap & terukur.

### 1.2 Komponen yang sudah ada di dalam Dashboard V2 (`#page-dashboard-hub`)

File: `dashboard-hub.js` (371 baris) + 4 file pendamping.

| Komponen | File | Render target (DOM id) | Sumber data |
|---|---|---|---|
| Hero Card (greeting, saldo, income/expense bulan ini) | `dashboard-hub.js` → `DashboardHubHero` | `#dashHubHeroCard` | `D.profile`, `totalSaldoAkun()`, `D.transactions` |
| Quick Actions row | markup langsung di `index.html` | `#dashHubQuickActions` | statis |
| Summary Cards (4 kartu) | `dashboard-hub.js` → `DashboardHubSummary` | `#dashHubSummaryGrid` | `D.transactions` |
| Analytics row (5 kartu) | `dashboard-hub.js` → `DashboardHubAnalytics` | `#dashHubAnalyticsRow` | `D.transactions` |
| Search fitur | `dashboard-hub-search.js` | `#dashHubSearchInput` / `#dashHubSearchResults` | `FEATURE_REGISTRY` |
| Favorit (★ kartu tersimpan) | `dashboard-hub-favorit.js` + `-favorit-view.js` | `#dashHubFavoritSection` / `#dashHubFavoritList` | `D` (storage keys) + `FEATURE_REGISTRY` |
| Grid kategori/fitur (10 kategori, 73 fitur) | `dashboard-hub.js` → `DashboardHub.render()` | `#dashboardHubGrid` | `FEATURE_REGISTRY` (`dashboard-hub-registry.js`) |
| LifeOS (Today/Areas/Goals/dll) | `lifeos/ui/lifeos-home.js` | `#lifeOSWrap` | `lifeos-store.js` (layer terpisah di atas `D`) |
| Pinned Widgets (Refleksi/FI/dll) | `modules-render.js` (`DASH_CARD_DEFS`) | section "Pinned Widgets" | `D` |

Semua komponen di atas dipanggil berurutan dari satu titik:
`DashboardHub.render()` (baris ~271–318 `dashboard-hub.js`), masing-masing
di-guard `typeof X !== 'undefined'` supaya aman dites terisolasi.

### 1.3 Chrome/navigasi GLOBAL (dipakai SEMUA halaman, bukan cuma Dashboard V2)

| Komponen | File | Dipakai oleh |
|---|---|---|
| `#mainNav` (bottom nav, 7 `.nav-item`) | markup di `index.html` baris ~2124–2153, style `.nav`/`.nav-item` di `styles.css` | **Semua 8 halaman** (dashboard, dashboard-hub, keuangan, shop, ai, carnotes, pajak, settings) — satu-satunya instance di DOM |
| `showPage(name, el)` | `modal-navigasi.js` baris 150 | Router utama, dipanggil dari FEATURE_REGISTRY targets, `.nav-item` onclick, dan puluhan tempat lain di seluruh modul |
| `#scrollRoot` (viewport scroll container) | `index.html` baris 161, CSS `styles.css` baris 31 (`padding-bottom:90px` reserved utk `.nav`) | Global, membungkus `#mainApp` (semua page) |
| `.keu-fab` (pola FAB) | `styles.css` baris 999, dipakai 4x independen: Finance (`#keuFab`), Laporan (`#laporanFab`), Shop, Car Notes | Finance, Reports, Shop, Vehicle — **masing-masing instance terpisah per halaman**, TIDAK ada FAB global |

**Tidak ada Sidebar di app ini sama sekali** — app 100% mobile-first,
navigasi tunggal lewat bottom nav fixed. "Sidebar" adalah paradigma BARU
(khas breakpoint desktop/tablet), belum ada preseden di codebase.

### 1.4 Design token yang tersedia utk reuse (`styles.css` `:root`, 10 varian tema)

| Kategori | Token |
|---|---|
| Spacing | `--sp-1`(4px) … `--sp-11`(32px) |
| Radius | `--r-xs`(6px) … `--r-2xl`(16px), `--r-pill`, `--r-full` |
| Font size | `--fs-caption`(11px) … `--fs-stat`(20px) |
| Durasi/easing | `--dur-fast/base/moderate/slow`, `--ease-standard/emphasized/emphasized-accel` |
| Z-index | `--z-chrome`(100) … `--z-toast`(999) |
| Warna | `--bg/--surface(1-4)/--accent(1-4)+soft/--text(1-3)/--border(1-2)/--header-bg/--money-pos/--money-neg` — masing-masing berbeda nilai per 10 `[data-theme]`, WAJIB dipakai (bukan hex literal) supaya komponen baru otomatis ikut ganti tema. |

---

## 2. Dependency Map

```
FEATURE_REGISTRY (dashboard-hub-registry.js)
  ├─ dibaca oleh: DashboardHub.render()/.open(), DashboardHubSearch,
  │  DashboardHubFavoritView   [READ-ONLY — tidak ada satupun yang menulis]
  └─ (rencana V2.1) akan DIBACA (bukan diubah) oleh Sidebar baru utk
     daftar kategori — pola sama dgn DashboardHub.render()

showPage() (modal-navigasi.js)
  ├─ dipanggil oleh: `.nav-item` onclick, dashHubNavigateToFeature()
  │  (dashboard-hub.js), puluhan data-action lain di seluruh modul
  ├─ query DOM langsung by class: `.page`, `.nav-item` (BUKAN lewat
  │  registry/config — hard-coded query selector)
  └─ RISIKO: Bottom Navigation V2 / Sidebar BARU yang mengklaim
     `.nav-item` sebagai class TIDAK BOLEH — akan tertangkap
     `document.querySelectorAll('.nav-item')` di showPage() &
     dashHubNavigateToFeature() dan merusak highlight-state navigasi
     semua halaman (termasuk Finance/Vehicle/Reports).

#mainNav / .nav
  ├─ 1 instance tunggal di DOM, dipakai lintas 8 halaman
  └─ RISIKO: mengedit/mengganti elemen ini = otomatis "menyentuh"
     Finance/Vehicle/Reports/Shop (semua bergantung padanya utk
     kembali ke Beranda/pindah tab) — DILARANG constraint sesi ini.

.keu-fab (4 instance independen)
  ├─ Finance (#keuFab), Laporan (#laporanFab), Shop, Car Notes
  └─ Masing-masing SUDAH scoped per-halaman (bukan global) — pola
     "instance baru per konteks, reuse class CSS" ini AMAN ditiru
     utk FAB Dashboard V2 (instance baru khusus #page-dashboard-hub,
     tidak menyentuh 4 instance existing).

DashboardHub.render()
  ├─ orkestrator tunggal: Hero → Summary → Analytics → Favorit → LifeOS
  └─ SEMUA di-guard typeof-check, artinya komponen BARU bisa
     ditambahkan ke urutan ini (mis. panggilan render() komponen V2)
     TANPA mengubah baris yang sudah ada — pola aditif yang sudap
     dipakai berulang di file ini sejak Tahap 2 (Hero), 5 (Summary),
     7 (Analytics).

D (data layer global)
  ├─ Semua komponen dashboard-hub-* baca `D.profile`/`D.transactions`
  │  APA ADANYA, tidak ada mutasi
  └─ Layout Foundation (V2.1) TIDAK PERLU menyentuh D sama sekali —
     murni presentasi/struktur, konsisten dgn constraint "jangan
     mengubah data layer".
```

---

## 3. Klasifikasi Reusable vs Harus Dipertahankan

| Kategori | Item | Treatment |
|---|---|---|
| **Reuse langsung (read-only)** | `FEATURE_REGISTRY`, design token `styles.css`, pola `.keu-fab`, pola guard `typeof X!=='undefined'` di `dashboard-hub.js` | Dibaca/ditiru, tidak diedit |
| **Reuse via composition** | `DashboardHubHero`/`Summary`/`Analytics`/`FavoritView`/`LifeOSHome` render output | Main Content Container BARU bisa membungkus elemen-elemen ini di render berikutnya TANPA mengubah isi fungsinya |
| **Harus dipertahankan (jangan disentuh V2.1)** | `#mainNav`/`.nav-item`, `showPage()`, `#scrollRoot`, `FEATURE_REGISTRY` (tulis), business logic Finance/Vehicle/Reports/Shop | Constraint eksplisit sesi ini + risiko breaking-change lintas modul |
| **Belum ada preseden (perlu dibangun baru)** | Sidebar, Header V2 (Greeting+Search+Notification terpadu), Bottom Navigation V2, FAB V2, Main Content Container | Scaffold baru, additive, dormant sampai fase wire-up disetujui terpisah |

---

## 4. Migration Plan (bertahap)

### Tahap V2.1 — Layout Foundation (scope RFC ini, BELUM diimplementasi)
Bangun 5 komponen sebagai **markup + CSS + render-stub baru, dormant**
(tidak otomatis aktif/tidak menggantikan apa pun yang live):
1. Sidebar — kategori dari `FEATURE_REGISTRY` (read-only), breakpoint
   desktop/tablet only (`@media (min-width:1024px)`), token spacing/warna
   existing.
2. Header V2 (Greeting + Search + Notification) — greeting reuse pola
   `DashboardHubHero`, search reuse pola `DashboardHubSearch` (baca
   `FEATURE_REGISTRY`), notification murni UI shell tahap ini (tidak ada
   sumber data notifikasi nyata di codebase saat ini — perlu keputusan
   terpisah data notifikasi datang dari mana).
3. Main Content Container — wrapper struktural (grid/flex), belum
   memindahkan elemen dashhub-* existing ke dalamnya.
4. Bottom Navigation V2 — instance/id/class **BARU** (bukan `#mainNav`),
   dormant, TIDAK dipanggil `showPage()`.
5. FAB V2 — instance baru scoped ke konteks Dashboard V2 saja, reuse
   class `.keu-fab*` (pola sama dgn 4 instance existing), tidak menimpa.

Semua 5 item ini **tidak wired ke routing/DOM live** — murni komponen
baru yang bisa dites terisolasi (pola `loadSource`/`fakeDom` yang sudah
dipakai project), tidak mengubah perilaku app yang berjalan sekarang.

### Tahap V2.2+ (di luar scope, butuh mandat terpisah)
Wire-up: mengganti `#mainNav` dgn Bottom Navigation V2 di live routing,
mengaktifkan breakpoint Sidebar, memindahkan komponen existing
(Hero/Summary/Analytics/Favorit/LifeOS) ke dalam Main Content Container,
deprecate markup lama. **Ini baru titik yang benar-benar menyentuh
"chrome" yang dipakai semua halaman** — walau business logic
Finance/Vehicle/Reports/Shop sendiri tetap tidak disentuh, tampilan
navigasi mereka ikut berubah. Perlu keputusan eksplisit terpisah kapan
titik ini boleh dieksekusi.

---

## 5. Risk Assessment

| Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|
| Bottom Navigation V2 tidak sengaja pakai class `.nav-item` | Rusak highlight navigasi & routing di SEMUA halaman (showPage() query global) | Tinggi kalau tidak diaudit | Wajib class/id baru unik (mis. `dashv2-nav-item`), test regresi memastikan `.nav-item` count tidak berubah |
| Sidebar breakpoint bentrok dgn `#scrollRoot`/`.nav` fixed positioning | Layout desktop rusak / bottom nav dobel tampil | Sedang | Sidebar hanya aktif `@media (min-width:1024px)`, `.nav` tetap fixed mobile-only sampai V2.2 wire-up disetujui |
| Header V2 "Notification" butuh sumber data yang belum ada | Scope creep / fitur setengah jadi | Tinggi | V2.1 hanya bangun UI shell kosong (badge/tombol), sumber data notifikasi = keputusan terpisah, bukan bagian Layout Foundation |
| FAB V2 duplikat visual dgn `.keu-fab` existing di halaman lain | Dua FAB tumpang tindih kalau salah scoping | Rendah (kalau discoped ke `#page-dashboard-hub` saja) | Scoped container check sama seperti pola existing (`#keuFab` hanya render di tab Finance) |
| Menyentuh `dashboard-hub.js`/`index.html` demi menambah container BARU dianggap "mengubah Dashboard V2" oleh constraint lama | Ambiguitas — constraint 15 dokumen sebelumnya bilang "tidak diubah" | Pasti terjadi | **Sudah dikonfirmasi user**: sesi ini scope resmi boleh menyentuh Dashboard V2. Tetap dijaga aditif (tidak menghapus/mengubah baris existing). |
| Melebihi batas 5 file kode saat implementasi nyata | Melanggar constraint | Sedang (5 komponen sekaligus) | Konsolidasi: 1 file JS (`dashboard-v2-shell.js`) berisi ke-5 render-stub, bukan 5 file terpisah; CSS masuk `styles.css` (tidak dihitung terpisah, konvensi tahap-tahap sebelumnya) |

---

## 6. Daftar File yang Akan Berubah (proyeksi implementasi V2.1, setelah RFC disetujui)

| File | Jenis | Catatan |
|---|---|---|
| `dashboard-v2-shell.js` | **Baru** | Satu file berisi 5 komponen (Sidebar/Header/MainContainer/BottomNavV2/FabV2) sbg render-stub dormant, pola global-object sama dgn `dashboard-hub.js` |
| `styles.css` | Diubah (aditif) | Rule CSS baru utk ke-5 komponen, 100% reuse token existing (`--sp-*/--r-*/--fs-*/--accent*` dll), breakpoint desktop baru utk Sidebar |
| `index.html` + `app_production.html` | Diubah (aditif) | Markup dormant baru (di luar `#page-keuangan`/`#page-shop`/`#page-carnotes`/`#page-pajak` — tidak menyentuh isi halaman modul manapun), TIDAK mengganti `#mainNav` |
| `tests/dashboard-v2-shell.test.js` | Baru | Test struktural render-stub, isolasi (pola `loadSource`/`fakeDom`) |
| `DASHBOARD-V2-LAYOUT-FOUNDATION.md` | Baru | Dokumentasi deliverable V2.1 |

Total file kode (di luar `index.html`/`app_production.html` yang historically
tidak dihitung krn cuma markup pasif): **2** (`dashboard-v2-shell.js`,
`tests/dashboard-v2-shell.test.js`) — dalam batas maksimal 5.
`scripts/build.js` kemungkinan +1 baris (daftarkan file baru ke
`GROUP_B`, pola sama dgn Tahap 3.1).

**Tidak akan disentuh saat implementasi V2.1**: `FEATURE_REGISTRY`
(`dashboard-hub-registry.js`), `dashboard-hub.js`, `#mainNav`/`.nav-item`,
`showPage()`/`modal-navigasi.js`, seluruh business logic Finance
(`akun.js`, `cicilan.js`, `tx-*.js`, dll), Vehicle (`vehicle-core.js`),
Reports (`filter-laporan.js`), Shop (`cobek-*.js`), dan `D`/data layer.

---

## 7. Gerbang Persetujuan

RFC ini **tidak mengubah kode apa pun**. Menunggu persetujuan eksplisit
sebelum implementasi V2.1 (5 komponen dormant di atas) dimulai. Setelah
disetujui, implementasi dikerjakan sesuai daftar file §6, dengan
constraint yang sama (maks 5 file kode, additive, reuse token, semua
test PASS).
