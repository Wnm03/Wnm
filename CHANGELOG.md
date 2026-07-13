# Changelog — Tahap 1: Audit UI & Pembangunan Design System (Foundation)

Baseline: `repo-final.zip` (v242 / `kw83-tahap0-feature-registry-17`).

## Ditambahkan

- **`design-tokens.css`** (file baru) — sumber tunggal seluruh design
  token: 9 blok warna tema (`[data-theme="..."]`), spacing (`--sp-*`),
  border-radius (`--r-*`), font-size (`--fs-*`), z-index (`--z-*`) —
  dipindah apa adanya dari `styles.css`. Ditambah token baru (aditif):
  - `--font-body`, `--font-heading` (dipakai menggantikan 32 string
    literal `font-family` yang berulang di `styles.css`)
  - 7 token radius tambahan: `--r-2xs`, `--r-3xs`, `--r-4xs`, `--r-3xl`,
    `--r-4xl`, `--r-5xl`, `--r-99` (melengkapi skala radius yang sudah
    ada supaya seluruh `border-radius` di `styles.css` bisa pakai token)
  - Skala referensi `--shadow-xs…xl` dan `--dur-fast…slow` (belum
    dipakai di komponen manapun — disiapkan untuk Tahap 2+)
- **`UI-AUDIT.md`** — hasil audit lengkap CSS/HTML/komponen.
- **`DESIGN-SYSTEM.md`** — katalog design token & inventaris komponen.
- **`CHANGELOG.md`** — dokumen ini.
- **`FILES-CHANGED.md`** — daftar file berubah beserta alasan.

## Diubah (tanpa perubahan visual)

- **`styles.css`**: blok token dipindah ke `design-tokens.css` (diganti
  komentar penunjuk); 71 deklarasi `border-radius` & 32 deklarasi
  `font-family` yang sebelumnya angka/string literal diganti referensi
  `var(--token)` dengan **nilai akhir identik** (value-preserving).
  739 → 727 baris.
- **`index.html`, `app_production.html`**: tambah satu baris
  `<link rel="stylesheet" href="design-tokens.css?v=242">` sebelum
  link `styles.css`, supaya token termuat lebih dulu. Kedua file tetap
  identik satu sama lain (diverifikasi dengan `diff`).

## Tidak diubah

- Tidak ada file JavaScript yang disentuh.
- Tidak ada nilai warna, spacing, radius, ukuran font, shadow, atau
  timing animasi yang berubah — seluruh tokenisasi murni memindahkan
  nilai yang sudah ada ke sebuah variabel dengan nilai yang sama persis.
- `FEATURE_REGISTRY`, ADR-001, Blueprint Final: tidak disentuh.
- Build pipeline (`scripts/build.js`), Service Worker (`sw.js`), cache
  (`CACHE_NAME`), routing, IndexedDB, LocalStorage: tidak disentuh.
- Tidak ada icon library yang ditambahkan — Material Symbols Rounded
  dipertimbangkan tapi ditunda karena kendala CSP + tidak ada akses
  jaringan untuk self-host font (lihat `UI-AUDIT.md` §5 dan
  `DESIGN-SYSTEM.md` §9 untuk detail & rekomendasi Tahap 2).
- Tidak ada fitur yang dihapus, tidak ada file yang dihapus atau
  digabung, tidak ada perubahan struktur folder, tidak ada dependency
  baru.

## Hasil test

```
node --test tests/*.test.js
# tests 1227
# pass 1227
# fail 0
```

Identik sebelum dan sesudah perubahan (1227/1227 pass di kedua kondisi)
— sesuai ekspektasi, karena tidak ada file JavaScript yang tersentuh.

`npm run build` dan `npm run lint` sengaja **tidak dijalankan** pada
sesi ini (di luar scope Tahap 1 / tidak tersedia di sandbox — lihat
`UI-AUDIT.md` §7 untuk detail).

## Rekomendasi untuk Tahap 2

Lihat bagian "Rekomendasi untuk Tahap 2" di `UI-AUDIT.md` untuk daftar
lengkap (6 item): verifikasi `.u-r99`, migrasi inline style → utility
class, self-host icon font, penerapan skala shadow/transition ke
komponen baru, token ukuran font display, dan pemecahan `styles.css`
per domain.

---

## Tahap 6 — Audit Icon & Perbaikan Minimal

Baseline: hasil Tahap 5 (1227/1227 test PASS, tidak ada JS berubah
sejak Tahap 1). Melanjutkan dari posisi "baseline confirmed 1227/1227,
mulai audit icon menyeluruh" — bukan mengulang audit sebelumnya.

### Audit

Diperiksa seluruh 69 file `.js` (termasuk `lifeos/**`), `styles.css`,
`index.html`/`app_production.html` untuk enam kategori icon: SVG
Inline, SVG File, Emoji, Unicode Symbol, Image Icon, CSS Generated
Icon. Ringkasan kuantitatif:

- **Emoji**: 4.759 karakter total — 400 di HTML statis (pola: 1 emoji
  per judul section/kartu/tombol/opsi, dipakai konsisten), ±4.359 di
  JavaScript (mayoritas field `icon:` pada data registry, mis.
  `dashboard-hub-registry.js`, dan label tombol/toast di 60+ file JS
  lain).
- **SVG Inline**: 16 pemakaian, seluruhnya di `index.html`
  (`app_production.html` identik), bergaya konsisten
  (`stroke="currentColor"`, `viewBox="0 0 24 24"`, `stroke-width="2"`).
- **SVG File**: 2 (`icon-192.svg`, `icon-512.svg`) — app icon PWA,
  tidak terkait icon di dalam UI.
- **Unicode Symbol**: `▾` (chevron collapse, 30+×, teks statis di
  `<span class="card-collapse-toggle">`), `✕` (tombol tutup modal,
  7×), `‹ › → ← ↑ ⋮` (navigasi/aksi, konsisten).
- **CSS Generated Icon**: 1 (`details.card summary::after{content:'▾'}`).
- **Image Icon**: 0 (tidak ada icon berupa `<img>` atau
  `background-image` di `styles.css`; satu-satunya kecocokan `<img
  onerror=...>` yang ter-grep adalah contoh string di teks dokumentasi
  keamanan, bukan icon yang dirender).

### Temuan yang dieksekusi

4 tombol `qs-btn` (menu cepat Keuangan, Laporan, Car Notes, AI
Asisten) memakai **icon ganda**: SVG gear inline diikuti langsung oleh
emoji `⚙️` — makna identik, dirender berdampingan. Ini inkonsistensi
nyata dibanding 2 tombol `qs-btn` lain (Dashboard, Shop) yang sudah
benar (SVG + label teks, tanpa duplikasi). Emoji `⚙️` yang redundan
dihapus; SVG gear dipertahankan sebagai satu-satunya icon pada keempat
tombol tersebut. Perubahan murni penghapusan teks di dalam atribut
HTML statis — tidak menyentuh `data-action`, event listener, atribut
`aria-label`, atau file JavaScript manapun.

### Temuan yang TIDAK dieksekusi (rekomendasi Tahap 7)

- **7 emoji `page-title`** (🏠📊🪨🏍️🕌🤖🧭) — aman secara teknis untuk
  diganti SVG lokal (murni teks HTML statis, diverifikasi tidak ada
  JS yang membaca `.page-title` sama sekali — 0 hasil `grep`), tapi
  butuh desain 7 aset SVG baru + review visual, di luar batas
  "perubahan minimal" Tahap 6.
- **±380 emoji lain di HTML** (`card-title`, tombol aksi, `<option>`,
  empty-state) — pola konsisten tapi volume besar, sama seperti di
  atas.
- **±4.359 emoji di JavaScript** — mayoritas field data (`icon:` pada
  registry), tidak bisa diganti tanpa mengubah JavaScript, yang
  dilarang eksplisit di Tahap 6. Dicatat sebagai rekomendasi murni.
- Seluruh Unicode Symbol (`▾ ✕ ‹ › → ← ↑ ⋮`) dan CSS-generated icon
  **dipertahankan** — sudah konsisten, ringan, dan fungsional; tidak
  ada alasan mengganti.

### Hasil test

```
node --test tests/*.test.js
# tests 1227
# pass 1227
# fail 0
```

Identik sebelum dan sesudah (1227/1227 pass di kedua kondisi) — sesuai
ekspektasi karena tidak ada file JavaScript, `styles.css`, ADR-001,
FEATURE_REGISTRY, Blueprint Final, Build System, Service Worker, atau
Routing yang tersentuh.

---

## Tahap 7 — Micro Interaction & Motion System

Baseline: hasil Tahap 6 (1227/1227 PASS, `UI-ICON-AUDIT.md` selesai,
0 JS berubah sejak Tahap 1). Fokus murni polish interaksi ala
Material Design 3 — tidak ada layout, ukuran, spacing, typography,
warna, atau icon yang diubah. Hanya `styles.css` yang disentuh.

### Ditambahkan (aditif)

- **Motion design tokens** di `:root`: `--dur-fast` (100ms),
  `--dur-base` (150ms), `--dur-moderate` (200ms), `--dur-slow`
  (250ms), serta `--ease-standard`, `--ease-emphasized`,
  `--ease-emphasized-accel` (kurva MD3). Semua durasi berada dalam
  target 100–250ms sesuai instruksi.
- **`prefers-reduced-motion`**: blok global yang mempercepat seluruh
  animasi/transisi ke ~0 dan menonaktifkan smooth-scroll bila
  pengguna mengaktifkan preferensi ini di OS/browser — belum ada
  sebelumnya.
- **`:focus-visible`**: ring fokus konsisten (outline, tidak memakan
  ruang layout) untuk seluruh elemen interaktif, plus varian khusus
  untuk `.fi`/`.fs`/`.chat-input` yang sudah punya `:focus` sendiri.
  Sebelumnya aplikasi tidak punya indikator fokus keyboard sama
  sekali di luar input teks.
- **Ripple effect berbasis CSS murni** (pulsa dari tengah elemen,
  tanpa JavaScript, tanpa koordinat sentuh — keterbatasan bawaan
  teknik CSS-only) pada 13 tap-target primer yang aman dari risiko
  clipping: `.btn`, `.chip-btn`, `.type-btn`, `.pm-btn`,
  `.qs-action`, `.bill-action-row`, `.card-collapse-toggle`,
  `.pin-key`, `.theme-card`, `.qs-btn`, `.kasir-tile`,
  `.dashhub-feature-card`, `.customer-card`.
- **Press feedback yang tadinya belum ada**: `.chip-btn:active`,
  `.type-btn:active`, `.pm-btn:active`, `.theme-card:active`
  (scale-down konsisten dengan pola `:active{transform:scale(...)}`
  yang sudah dipakai di `.btn`/`.pin-key`/dll), serta
  `.nav-item:active svg` (scale-down ikon saat bottom nav ditekan).
- **Card elevation on hover** (desktop-only, dibungkus
  `@media (hover:hover) and (pointer:fine)` — pola yang sudah ada
  di file ini sejak sebelumnya): `.card`, `.kasir-tile`,
  `.dashhub-feature-card` mendapat `box-shadow` halus saat hover;
  `.card` & `.dashhub-feature-card` mendapat `transition` baru
  supaya elevasi ini animatif (sebelumnya `.card` tidak punya
  `transition` sama sekali).
- **Hover state tambahan** (desktop-only) untuk `.btn` (brightness),
  `.chip-btn`, `.type-btn`, `.pm-btn`, `.theme-card`, `.qs-btn`,
  `.nav-item`, `.customer-card`, `.bill-action-row` — seluruhnya
  memakai warna yang **sudah ada** di tema (`var(--accent)`,
  `var(--accent-soft)`), tidak ada warna baru diperkenalkan.

### Disempurnakan (nilai lama dipertahankan, hanya kurva/kelengkapan diperhalus)

- `overlayIn`, `slideUp` (dipakai bersama oleh `.modal`, `.calc-modal`,
  `.qs-modal` — dialog & bottom sheet): easing diseragamkan ke token
  MD3 (`--ease-standard` untuk fade overlay, `--ease-emphasized`
  untuk slide masuk sheet/dialog). **Durasi tidak diubah** (tetap
  0.2s/0.25s, hanya direferensikan lewat token `--dur-moderate` /
  `--dur-slow` yang nilainya sama persis). `slideUp` ditambah fade
  opacity `.4→1` beriringan dengan translate, supaya entrance terasa
  lebih halus (standar MD3 emphasized-decelerate).
- `.toast` (snackbar): sebelumnya hanya fade opacity; sekarang
  ditambah slide vertikal kecil (`translate(-50%,10px)` →
  `translate(-50%,0)`) beriringan dengan fade, memakai mekanisme
  `.toast.show` yang **sudah ada** di JS (`toast()` di
  `format-tema.js`/bundle) — tidak ada perubahan JS.
- `.page` (transisi ganti halaman): referensi durasi/easing
  diseragamkan ke token (`--dur-moderate`, `--ease-standard`),
  nilai akhir identik (0.2s, kurva setara `ease`).

### TIDAK dieksekusi (rekomendasi Tahap 8)

- **Exit/closing animation untuk overlay & bottom sheet**: `.overlay`
  disembunyikan lewat `display:none` instan setelah class `.open`
  dilepas oleh JS (`modals.js`) — animasi keluar yang mulus butuh
  penundaan `display:none` (mis. via `animationend`/`setTimeout` di
  JS), yang berada di luar batas "tidak mengubah JavaScript" Tahap 7.
- Ripple sungguhan berbasis koordinat sentuh (bukan pulsa dari
  tengah) — teknis membutuhkan JS untuk membaca posisi klik/tap dan
  menset custom property `--x`/`--y`; versi CSS-only di Tahap 7
  adalah pendekatan terdekat tanpa JS.
- Elevation/hover pada tap-target sekunder lain (`.stat-box.clickable`,
  `.budget-item.clickable`, dll.) — sudah punya `:active` feedback
  memadai, tidak disentuh supaya perubahan tetap minimal.

### Verifikasi non-regresi

```
node --test tests/*.test.js
# tests 1227
# pass 1227
# fail 0
```

Identik sebelum & sesudah. **0 file JavaScript disentuh** (hanya
`styles.css`, +79 baris murni aditif/penyempurnaan). `index.html` dan
`app_production.html` **tidak berubah sama sekali** di Tahap 7 (tetap
identik satu sama lain). ADR-001, FEATURE_REGISTRY, Blueprint Final,
Build System, Service Worker, Routing tidak disentuh.

## Tahap 8 — Final QA, Accessibility, Performance & Release Candidate

Baseline: hasil Tahap 7 (1228/1228 test PASS — lihat catatan angka di
`FINAL-QA.md` §1 — 0 JS berubah sejak Tahap 1). Tahap terakhir: audit
menyeluruh, tanpa fitur baru dan tanpa redesign.

### Ditambahkan

- **`FINAL-QA.md`** (file baru) — laporan audit akhir lengkap:
  Accessibility (focus-visible, keyboard nav, contrast, touch target,
  reduced motion, hover dependency, scroll behavior), Responsive
  (360–1024px), Performance CSS (selector, duplikasi, transition,
  shadow, radius, typography), Design System (konsistensi token),
  Motion Audit, Icon Audit Summary, daftar rekomendasi Tahap 9, dan
  ringkasan Tahap 1–8.

### Diubah

- Tidak ada. Tahap 8 murni dokumentasi — **0 file CSS/JS/HTML
  disentuh**. Seluruh temuan performa/konsistensi CSS (radius, shadow,
  transition, font-size literal vs token) dan kontras warna `--text3`
  dicatat sebagai rekomendasi di `FINAL-QA.md`, tidak dieksekusi,
  mengikuti instruksi eksplisit Tahap 8 ("jangan mengubah jika
  berisiko").

### Hasil test

```
node --test tests/*.test.js
# tests 1228
# pass 1228
# fail 0
```

Identik sebelum & sesudah (tidak ada perubahan kode). **0 file
JavaScript disentuh** sepanjang Tahap 1–8. ADR-001, FEATURE_REGISTRY,
Blueprint Final, Build System, Service Worker, Routing tidak disentuh.

### Rekomendasi untuk Tahap 9

Lihat `FINAL-QA.md` §8 untuk daftar lengkap (6 item CSS risiko rendah,
1 item token warna risiko sedang, 3 item carry-over yang butuh
perubahan JavaScript dari Tahap 6–7).

### Status akhir

Seluruh Quality Gate Tahap 8 **LULUS**. Project dinyatakan
**RELEASE CANDIDATE**, siap digunakan.

## Final Release Candidate — Release Notes, Dokumentasi & Handover

Ini BUKAN tahap pengembangan — murni dokumentasi & handover setelah
Release Candidate (Tahap 8) dinyatakan LULUS. Baseline: hasil Tahap 8
(1228/1228 test PASS, 0 JS berubah sejak Tahap 1).

### Ditambahkan

- **`RELEASE-NOTES.md`** (file baru) — ringkasan Release Candidate,
  highlight perubahan Tahap 1–8, fitur utama, modernisasi UI, design
  system, motion system, accessibility, responsive, performance, icon
  audit, hasil testing, dan quality gate.
- **`PROJECT-SUMMARY.md`** (file baru) — struktur project, arsitektur
  (pola source-file-plus-minified-bundle), design system, file
  penting, entry point, folder utama, komponen utama per domain, dan
  alur aplikasi singkat — ditujukan untuk developer lain yang akan
  memelihara project ini.
- **`KNOWN-ISSUES.md`** (file baru) — seluruh isu yang sengaja belum
  diperbaiki (kontras `--text3`, touch target sekunder, literal CSS
  vs token, emoji `icon:` di JavaScript, exit animation, ripple
  koordinat sentuh), dikelompokkan per kategori risiko perbaikan
  (🟢 CSS-only / 🟡 token warna / 🔴 butuh JavaScript). Murni
  dokumentasi — tidak ada perbaikan dieksekusi.
- **`ROADMAP-v1.1.md`** (file baru) — backlog versi berikutnya,
  dikelompokkan High/Medium/Low Priority, seluruh item yang
  membutuhkan perubahan JavaScript ditandai eksplisit.

### Diubah

- Tidak ada file kode (HTML/CSS/JS) yang diubah. Hanya file Markdown
  baru + pembaruan `CHANGELOG.md`/`FILES-CHANGED.md` (bagian ini).

### Hasil test

```
node --test tests/*.test.js
# tests 1228
# pass 1228
# fail 0
```

Identik dengan hasil Tahap 8 — tidak ada perubahan kode di tahap
finalisasi ini. **0 file JavaScript/CSS/HTML disentuh** sepanjang
Tahap 1 hingga Final Release Candidate. ADR-001, FEATURE_REGISTRY,
Blueprint Final, Build System, Service Worker, Routing tidak disentuh.

### Status akhir

**FINAL RELEASE CANDIDATE** — siap dipelihara dan dikembangkan pada
versi berikutnya. Lihat `RELEASE-NOTES.md` untuk ringkasan rilis,
`PROJECT-SUMMARY.md` untuk onboarding developer baru, `KNOWN-ISSUES.md`
untuk isu yang belum diperbaiki, dan `ROADMAP-v1.1.md` untuk backlog
v1.1.

---

# Changelog — Sprint 1, Tahap 2: Dashboard 2.0 — Hero Card

Baseline: FINAL RELEASE CANDIDATE (v242 / `kw83-tahap0-feature-registry-17`,
1228/1228 test PASS) + Sprint 1 Tahap 1 (`DASHBOARD-2.0-PLAN.md`, audit-only,
0 file kode disentuh).

## Ditambahkan

- **Hero Card** di `page-dashboard-hub` (`index.html`/`app_production.html`)
  — elemen pertama setelah header, sebelum search bar, sesuai
  `DASHBOARD-2.0-PLAN.md` §11/§12. Menampilkan (semua dari data yang SUDAH
  ADA, tidak ada business logic baru):
  - Sapaan + nama profil (`D.profile.nama`, field yang sudah ada)
  - Tanggal hari ini (format native `Date.toLocaleDateString('id-ID', ...)`)
  - Saldo semua akun (`totalSaldoAkun()` dari `akun.js`, dipanggil apa
    adanya — tidak ada logic saldo baru)
  - Pemasukan & pengeluaran bulan berjalan (agregasi `D.transactions` dgn
    pola yang sama persis dgn `renderDashboard()`/`renderDashLaporanMini()`
    di `modules-render.js`)
- **`DashboardHubHero`** (object baru di `dashboard-hub.js`) — modul render
  murni tampilan, dipanggil dari `DashboardHub.render()` secara aditif
  (pola sama dgn `LifeOSHome.render()`/`DashboardHubFavoritView.render()`
  yang sudah ada — tidak mengubah baris lain).
- CSS baru scoped `.dashhub-hero*` di `styles.css` — Material Design 3 /
  Material You: radius besar (`--r-2xl`), gradient aksen tipis, elevation
  via shadow, hierarki tipografi jelas. 100% memakai token yang sudah ada
  (`--r-*`/`--sp-*`/`--fs-*`/`--accent*`/`.green`/`.red`), responsif lewat
  breakpoint yang sudah ada di file ini (`max-width:359px`, `min-width:600px`).
- **`HERO-CARD.md`** — dokumentasi struktur, data, CSS, dan alasan desain
  Hero Card.
- **`tests/dashboard-hub-hero.test.js`** — 8 test baru: render tanpa data
  (placeholder aman), render dgn `D.profile.nama`, saldo positif/negatif,
  agregasi bulan berjalan (termasuk memastikan transaksi bulan lalu &
  transfer diabaikan), dan integrasi ke `DashboardHub.render()` (grid
  kategori tetap tidak berubah).

## Diubah

- **`dashboard-hub.js`**: tambah `_dashHubHeroMonthTx()` + object
  `DashboardHubHero` (murni fungsi baru, tidak ada baris lama yang
  dihapus/diubah), + 1 baris pemanggilan aditif di `DashboardHub.render()`.
- **`index.html`**: tambah blok `<div class="dashhub-hero" id="dashHubHeroCard">…</div>`
  di dalam `#page-dashboard-hub`, sebelum `.dashhub-search-wrap`. Tidak ada
  elemen lain yang dipindah/dihapus.
- **`styles.css`**: tambah blok CSS baru scoped `.dashhub-hero*` (lihat
  `HERO-CARD.md` §CSS). Tidak ada deklarasi `.dashhub-*` yang sudah ada
  yang diubah.
- **`app_production.html`**: disinkronkan ulang jadi salinan persis
  `index.html` lewat `node scripts/build.js` (konvensi proyek yang sudah
  ada sejak awal, bukan proses baru).
- **`app-bundle-a.min.js`, `app-bundle-b.min.js`**: dibuat ulang dari
  source lewat `node scripts/build.js` supaya Hero Card benar-benar
  ter-load di app (kedua file HTML memuat bundle ini, bukan file source
  individual). **`scripts/build.js` sendiri TIDAK diedit/diubah logic-nya**
  — dijalankan apa adanya sesuai alur kerja yang sudah didokumentasikan di
  file itu ("Jalankan skrip ini SETIAP KALI selesai edit file .js sumber").
- **`sw.js`**: `CACHE_NAME` naik ke `kw-cache-v243` — efek samping otomatis
  dari `scripts/build.js` (bagian bump-version, bukan perubahan logic
  Service Worker apa pun).
- Nomor versi `?v=242` → `?v=243` di kedua HTML, dan
  `kw83-tahap0-feature-registry-17` → `-18` di 6 file source versi — juga
  efek samping otomatis `scripts/build.js`, konsisten dgn konvensi versi
  yang sudah ada sejak Tahap 0.
- **`docs/FILE-MAP.md`**: ditulis ulang otomatis oleh `scripts/build.js`
  (bagian dari alur build yang sudah ada, bukan proses baru).

## Tidak diubah

- `FEATURE_REGISTRY` (`dashboard-hub-registry.js`) — tidak disentuh sama
  sekali.
- ADR-001, Routing (`dashHubNavigateToFeature`/`DashboardHub.open`),
  Business Logic (`totalSaldoAkun()` dipakai APA ADANYA, tidak ada
  perubahan di `akun.js`).
- Grid kategori, Favorit, Life OS, Pinned Widgets, Bottom Navigation — tidak
  ada satu baris pun dari komponen-komponen ini yang diubah.
- `scripts/build.js` — dijalankan, tidak diedit.
- Tidak ada dependency baru ditambahkan (`package.json` tidak berubah).

## Hasil test

```
node --test tests/*.test.js
# tests 1235
# pass 1235
# fail 0
```

Catatan: baseline FINAL RELEASE CANDIDATE yang diverifikasi ulang di
lingkungan ini (`node --test tests/*.test.js` pada arsip asli, sebelum
perubahan apa pun) menghasilkan **1227/1227 PASS**, bukan 1228 seperti
disebut di status header — kemungkinan selisih pencatatan minor di
dokumentasi sebelumnya, dicatat di sini demi akurasi. Tidak ada test lama
yang gagal atau dihapus; 8 test baru dari `tests/dashboard-hub-hero.test.js`
ditambahkan murni aditif, sehingga total naik 1227 → 1235.

## Status

Hero Card selesai, sesuai cakupan Sprint 1 Tahap 2. **Belum** mengerjakan
Quick Actions, refactor Grid Dashboard, Widget lain, atau Bottom Navigation
— menunggu instruksi Sprint 1 Tahap 3.

# Changelog — Sprint 1, Tahap 3: Dashboard 2.0 — Quick Actions

Baseline: Sprint 1 Tahap 2 — Hero Card (1235/1235 test PASS, build
`kw83-tahap0-feature-registry-18`, v243).

## Ditambahkan

- **Quick Actions** di `page-dashboard-hub` (`index.html`/`app_production.html`)
  — baris tombol kartu kecil (pill) bergaya Material Design 3/Material You,
  tepat di bawah Hero Card, sebelum search bar. 5 aksi, semua memanggil
  fungsi yang **SUDAH ADA** (tidak ada business logic baru):
  - 💰 **Transaksi** → `openTxModal('expense')` (`transaksi.js`, pola sama
    dgn tombol "+ Pengeluaran" di menu Aksi Cepat lama/`qsDashboard`)
  - 📝 **Catatan** → `openCatatan('anak')` (`transaksi.js`, satu-satunya
    fungsi "buka form catatan" yang sudah ada di app)
  - 💾 **Backup** → `openBackupModal()` (`backup-restore.js`, dipakai juga
    oleh 3 tombol lama lain: `qsDashboard`, `qsShop`, `qsLaporan`)
  - 🔍 **Cari** → fokus native ke `#dashHubSearchInput` yang sudah ada tepat
    di bawah Quick Actions (murni `element.focus()`, bukan logic baru)
  - 🤖 **AI** → `showPage('ai', document.querySelectorAll('.nav-item')[3])`
    (`modal-navigasi.js` + `PAGE_NAV_IDX.ai` yang sudah ada di
    `dashboard-hub.js`, pola sama dgn navigasi "Edit Profil" di `qsAI`)
- CSS baru scoped `.dashhub-qa*` di `styles.css` — 5 kolom grid pill,
  radius penuh (`--r-pill`), 100% memakai token yang sudah ada
  (`--sp-*`/`--r-pill`/`--fs-icon-lg`/`--surface2`/`--surface3`/`--border`/
  `--accent`/`--text2`), breakpoint `max-width:359px` (3 kolom, konsisten
  dgn pola stack Hero Card) & `min-width:600px` (hover state, konsisten dgn
  `.dashhub-feature-card:hover`).
- **`QUICK-ACTIONS.md`** — dokumentasi struktur, aksi, event yang dipanggil,
  CSS baru, dan alasan desain.
- **`tests/dashboard-hub-quickactions.test.js`** — 10 test baru: markup ada
  & posisinya benar (di antara Hero Card & search bar), 5 tombol persis,
  tiap tombol memanggil fungsi yang sudah ada (bukan fungsi baru), Hero
  Card/Grid Dashboard tidak tersentuh, parity `index.html`/
  `app_production.html`, dan token CSS yang dipakai semuanya sudah
  terdefinisi di `:root`.

## Diubah

- **`index.html`**: tambah blok `<div class="dashhub-qa-row" id="dashHubQuickActions">…</div>`
  di dalam `#page-dashboard-hub`, tepat setelah `.dashhub-hero` dan sebelum
  `.dashhub-search-wrap`. Tidak ada elemen lain (Hero Card, search bar,
  Favorit, Grid Dashboard, Life OS, Pinned Widgets) yang dipindah/diubah.
- **`styles.css`**: tambah blok CSS baru scoped `.dashhub-qa*` (lihat
  `QUICK-ACTIONS.md` §3). Tidak ada deklarasi `.dashhub-*` yang sudah ada
  yang diubah.
- **`app_production.html`**: disinkronkan ulang jadi salinan persis
  `index.html` lewat `node scripts/build.js` (konvensi proyek yang sama
  sejak Tahap 2, bukan proses baru).
- **`app-bundle-a.min.js`, `app-bundle-b.min.js`**: dibuat ulang dari source
  lewat `node scripts/build.js` (Quick Actions murni markup, tidak ada
  fungsi JS baru yang perlu ikut ke-bundle — regenerasi ini hanya supaya
  bundle tetap sinkron dgn `index.html` versi terbaru, sama seperti proses
  Tahap 2). **`scripts/build.js` sendiri TIDAK diedit.**
- **`sw.js`**: `CACHE_NAME` naik ke `kw-cache-v244` — efek samping otomatis
  `scripts/build.js`.
- Nomor versi `?v=243` → `?v=244`, dan
  `kw83-tahap0-feature-registry-18` → `-19` — efek samping otomatis
  `scripts/build.js`.
- **`docs/FILE-MAP.md`**: ditulis ulang otomatis oleh `scripts/build.js`.

## Tidak diubah

- `FEATURE_REGISTRY` (`dashboard-hub-registry.js`), ADR-001 — tidak
  disentuh sama sekali.
- Business Logic — tidak ada fungsi baru; kelima tombol Quick Actions
  murni memanggil `openTxModal`/`openCatatan`/`openBackupModal`/`showPage`
  yang sudah ada, atau `.focus()` native ke elemen yang sudah ada.
- Routing (`dashHubNavigateToFeature`/`DashboardHub.open`) — tidak diubah;
  tombol AI memakai `showPage()` langsung (pola yang sudah dipakai di
  markup `qsAI`/`qsDashboard`), bukan lewat `DashboardHub.open()`.
- **Grid Dashboard** (`#dashboardHubGrid`/`#dashboardHubWrap`) — tidak
  disentuh.
- **Widget** (Life OS, Favorit, Pinned Widgets) — tidak disentuh.
- **Bottom Navigation** (`.nav-item`) — tidak disentuh; hanya *dibaca*
  (`document.querySelectorAll('.nav-item')[3]`) untuk parameter `showPage()`,
  sama persis pola yang sudah dipakai di markup `qsDashboard` (mis.
  `document.querySelectorAll('.nav-item')[6]` untuk "Edit Profil").
- `dashboard-hub.js` — **tidak ada baris JS yang diubah**; Quick Actions
  100% markup (HTML+CSS), tidak butuh modul JS baru karena setiap tombol
  langsung memanggil fungsi global yang sudah ada lewat `data-onclick`
  (mekanisme dispatcher yang sudah ada di
  `features-helpers-global-security.js`, pola sama dgn tombol
  `qs-action` yang sudah dipakai di `qsDashboard`/`qsAI`).
- `scripts/build.js` — dijalankan, tidak diedit.
- Tidak ada dependency baru ditambahkan (`package.json` tidak berubah).

## Hasil test

```
node --test tests/*.test.js
# tests 1245
# pass 1245
# fail 0
```

Baseline Tahap 2 (1235/1235 PASS) diverifikasi ulang di lingkungan ini
sebelum perubahan apa pun. Tidak ada test lama yang gagal atau dihapus; 10
test baru dari `tests/dashboard-hub-quickactions.test.js` ditambahkan murni
aditif, sehingga total naik 1235 → 1245.

## Status

Quick Actions selesai, sesuai cakupan Sprint 1 Tahap 3. **Belum**
mengerjakan Widget Dashboard, Grid Dashboard, Statistik, atau AI Insight —
menunggu instruksi Sprint 1 Tahap 4.

# Changelog — Sprint 1 Tahap 4: Modern Dashboard Grid

Baseline: Sprint 1 Tahap 3 selesai (Hero Card + Quick Actions), `node
--test` 1245/1245 PASS. Lihat `DASHBOARD-GRID.md` untuk detail lengkap.

## Diubah

- **`styles.css`** — modernisasi visual Dashboard Grid (Material Design
  3): radius kartu diperbesar (`--r-lg`→`--r-xl`), padding/gap kartu &
  kategori mengikuti token spacing yang sudah ada (`--sp-*`), elevation
  shadow ditambahkan di kartu fitur (default, tekan, & hover), ikon
  kategori diperbesar + shadow tipis, favorite indicator (`.dashhub-fav-star`)
  diubah dari teks bintang polos jadi chip bulat (icon-button M3), dan
  satu class baru `.dashhub-cat-badge` (chip kecil jumlah fitur per
  kategori). Semua **class lama tetap dipakai** (tidak ada rename),
  semua nilai memakai token yang sudah ada di `:root` (tidak ada token
  baru).
- **`dashboard-hub.js`** — 1 baris ditambah: render `.dashhub-cat-badge`
  berisi `cat.features.length` di sebelah label kategori. Murni
  render/tampilan (memakai data yang sudah tersedia saat render),
  **`FEATURE_REGISTRY` tidak disentuh/diubah**.

## Ditambahkan

- **`DASHBOARD-GRID.md`** — dokumentasi deliverable Tahap 4.

## Tidak diubah

- Hero Card, Quick Actions, Bottom Navigation, AI, Statistik, Widget
  Drag & Drop, Search — sama sekali tidak disentuh (di luar cakupan
  Tahap 4).
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1246
# pass 1246
# fail 0
```

Tidak ada test lama yang gagal; tidak ada test yang dihapus. Hero Card,
Quick Actions, dan seluruh fungsi Dashboard (buka fitur, toggle favorit,
search, LifeOS, Pinned Widgets) diverifikasi tetap tampil & berfungsi
setelah perubahan CSS/markup ini.

## Status

Modern Dashboard Grid selesai, sesuai cakupan Sprint 1 Tahap 4. Sesuai
instruksi, pengerjaan **berhenti di sini** — tahap berikutnya menunggu
instruksi lebih lanjut.

# Changelog — Sprint 1 Tahap 5: Dashboard Summary Cards

Baseline: Sprint 1 Tahap 4 selesai (Hero Card + Quick Actions + Modern
Dashboard Grid), `node --test` 1246/1246 PASS. Lihat `DASHBOARD-SUMMARY.md`
untuk detail lengkap.

## Ditambahkan

- **`dashboard-hub.js`** — fungsi baru murni-baca `_dashHubSummaryMonthTx()`
  + object baru `DashboardHubSummary` (render 4 kartu ringkas: Pemasukan/
  Pengeluaran/Bersih/Jumlah Transaksi bulan berjalan dari `D.transactions`),
  + 1 baris pemanggilan aditif
  `if (typeof DashboardHubSummary !== 'undefined') DashboardHubSummary.render();`
  di dalam `DashboardHub.render()`, pola sama dgn `DashboardHubHero.render()`
  yang sudah ada. Tidak ada baris lama yang dihapus/diubah.
- **`index.html`, `app_production.html`** — tambah blok
  `<div class="dashhub-summary-grid" id="dashHubSummaryGrid"></div>` di
  dalam `#page-dashboard-hub`, tepat setelah `.dashhub-qa-row` (Quick
  Actions), sebelum `.dashhub-search-wrap`. Kedua file tetap identik satu
  sama lain (diverifikasi dengan `diff`).
- **`styles.css`** — blok CSS baru scoped `.dashhub-summary*` (~6
  deklarasi + 1 media query), 100% pakai token yang sudah ada
  (`--sp-*`/`--r-xl`/`--fs-caption`/`--fs-title-sm`/`--surface2`/`--border`)
  serta utility `.green`/`.red` yang sudah ada. Tidak ada deklarasi
  `.dashhub-*` lama yang diubah nilainya.
- **`DASHBOARD-SUMMARY.md`** — dokumentasi deliverable Tahap 5.
- **`tests/dashboard-hub-summary.test.js`** — 6 test baru untuk
  `_dashHubSummaryMonthTx()`/`DashboardHubSummary` + 1 test integrasi
  `DashboardHub.render()`.

## Tidak diubah

- Hero Card (`.dashhub-hero*`), Quick Actions (`.dashhub-qa*`), Dashboard
  Grid (`#dashboardHubGrid`/`.dashhub-cat*`/`.dashhub-feature*`),
  Bottom Navigation, AI, Statistik, Widget Drag & Drop, Search — sama
  sekali tidak disentuh (di luar cakupan Tahap 5).
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1252
# pass 1252
# fail 0
```

Tidak ada test lama yang gagal; tidak ada test yang dihapus. Hero Card,
Quick Actions, dan seluruh fungsi Dashboard Grid (buka fitur, toggle
favorit, search, LifeOS, Pinned Widgets) diverifikasi tetap tampil &
berfungsi setelah perubahan ini.

## Status

Dashboard Summary Cards selesai, sesuai cakupan Sprint 1 Tahap 5. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke Tahap 6
(AI Insight/Statistik/dst), menunggu instruksi lebih lanjut.

# Changelog — Sprint 1 Tahap 6: Modern Pinned Widgets

Baseline: Sprint 1 Tahap 5 selesai (Hero Card + Quick Actions + Summary
Cards + Modern Dashboard Grid), `node --test` 1252/1252 PASS. Lihat
`PINNED-WIDGETS.md` untuk detail lengkap.

## Diubah

- **`styles.css`** — modernisasi visual 6 widget lama di dalam
  `#dashboardHubPinnedWrap` (`advisorCard`, `lifeBalanceCard`,
  `refleksiCard`, `dashFiCard`, `dashPensiunCard`, `dashAbsensiCard`):
  radius diperbesar via token (`var(--r-2xl)`), padding/spacing lebih
  lega (`--sp-7/8`), elevation shadow default + hover, header
  (`.card-title`) diperjelas (font lebih besar, non-uppercase, garis
  pemisah), + layout responsive (1 kolom mobile → 2 kolom tablet → 3
  kolom desktop, urutan DOM tidak berubah). **Semua aturan di-scope
  lewat descendant selector `#dashboardHubPinnedWrap ...`** — definisi
  dasar `.card`/`.card-title` (dipakai ~40+ kartu lain di seluruh app)
  **tidak diubah sama sekali**.

## Ditambahkan

- **`PINNED-WIDGETS.md`** — dokumentasi deliverable Tahap 6.
- **`tests/dashboard-hub-pinnedwidgets.test.js`** — 11 test baru:
  widget & urutan tidak berubah, markup/`data-action` tiap widget tidak
  berubah, Hero/Quick Actions/Summary Cards/Grid tetap ada, `.card`/
  `.card-title` dasar tidak diedit, override ter-scope dengan benar,
  token CSS valid, breakpoint responsive ada.

## Tidak diubah

- `dashboard-hub.js`, `index.html`, `app_production.html` — **0 baris
  berubah** (modernisasi murni CSS, isi/urutan/event/data widget tidak
  disentuh; rendering isi widget sudah ditangani modul JS masing-masing
  seperti sebelumnya).
- Hero Card, Quick Actions, Summary Cards, Dashboard Grid — sama sekali
  tidak disentuh (di luar cakupan Tahap 6).
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1263
# pass 1263
# fail 0
```

Tidak ada test lama yang gagal; tidak ada test yang dihapus. Hero Card,
Quick Actions, Summary Cards, dan Dashboard Grid diverifikasi tetap
tampil & berfungsi setelah perubahan CSS ini; 6 widget Pinned tetap
tampil dengan konten/event/urutan yang sama, hanya lebih modern secara
visual.

## Status

Modern Pinned Widgets selesai, sesuai cakupan Sprint 1 Tahap 6. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke AI
Insight, Dashboard Analytics, atau Drag & Drop, menunggu instruksi
Sprint 1 Tahap 7.

# Changelog — Sprint 1 Tahap 7: Dashboard Analytics

Baseline: Sprint 1 Tahap 6 selesai (Hero Card + Quick Actions + Summary
Cards + Modern Dashboard Grid + Modern Pinned Widgets), `node --test`
1263/1263 PASS. Lihat `DASHBOARD-ANALYTICS.md` untuk detail lengkap.

## Ditambahkan

- **`dashboard-hub.js`** — fungsi baru murni-baca
  `_dashHubAnalyticsMonthTx()` + object baru `DashboardHubAnalytics`
  (render 5 kartu horizontal kecil: Transaksi Bulan Ini/Total Pemasukan/
  Total Pengeluaran/Saldo Bersih/Pemasukan vs Pengeluaran (%) dari
  `D.transactions` bulan berjalan), + 1 baris pemanggilan aditif
  `if (typeof DashboardHubAnalytics !== 'undefined') DashboardHubAnalytics.render();`
  di dalam `DashboardHub.render()`, tepat setelah pemanggilan
  `DashboardHubSummary.render()`, pola sama dgn Tahap 5/6. Tidak ada
  baris lama yang dihapus/diubah.
- **`index.html`, `app_production.html`** — tambah blok
  `<div class="dashhub-analytics-row" id="dashHubAnalyticsRow"></div>`
  di dalam `#page-dashboard-hub`, tepat setelah `.dashhub-summary-grid`
  (Summary Cards), sebelum `.dashhub-search-wrap` — sesuai instruksi
  "setelah Summary Cards, sebelum Dashboard Grid". Kedua file tetap
  identik satu sama lain (diverifikasi dengan `diff`).
- **`styles.css`** — blok CSS baru scoped `.dashhub-analytics*` (5
  deklarasi, baris horizontal scroll), 100% pakai token yang sudah ada
  (`--sp-*`/`--r-xl`/`--fs-caption`/`--fs-title-sm`/`--surface2`/
  `--border`) serta utility `.green`/`.red` yang sudah ada. Pola scroll
  horizontal reuse dari `.trs-chip-row`/`.kasir-kat-chips` yang sudah
  ada. Tidak ada deklarasi `.dashhub-*` lama yang diubah nilainya.
- **`DASHBOARD-ANALYTICS.md`** — dokumentasi deliverable Tahap 7.
- **`tests/dashboard-hub-analytics.test.js`** — 7 test baru untuk
  `_dashHubAnalyticsMonthTx()`/`DashboardHubAnalytics` + 1 test
  integrasi `DashboardHub.render()`.

## Tidak diubah

- Hero Card (`.dashhub-hero*`), Quick Actions (`.dashhub-qa*`), Summary
  Cards (`.dashhub-summary*`), Dashboard Grid
  (`#dashboardHubGrid`/`.dashhub-cat*`/`.dashhub-feature*`), Pinned
  Widgets (`#dashboardHubPinnedWrap`) — sama sekali tidak disentuh (di
  luar cakupan Tahap 7).
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1270
# pass 1270
# fail 0
```

Tidak ada test lama yang gagal; tidak ada test yang dihapus. Hero Card,
Quick Actions, Summary Cards, Dashboard Grid, dan Pinned Widgets
diverifikasi tetap tampil & berfungsi setelah perubahan ini; Dashboard
Analytics tampil sebagai baris kartu horizontal baru di antara Summary
Cards dan search bar.

## Status

Dashboard Analytics selesai, sesuai cakupan Sprint 1 Tahap 7. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke AI
Insight, Drag & Drop, atau Dashboard 3.0, menunggu Sprint 2.

---

# Changelog — Sprint 2 Tahap 1: FAB Halaman Keuangan (Finance 2.0)

Baseline: diaudit ulang langsung dari source code (bukan dari laporan
sebelumnya) — Sprint 1 Tahap 7 selesai, `node --test` **1271/1271
PASS**. Tidak ditemukan artefak Finance 2.0 apa pun (FAB/CSS/test) di
project sebelum Tahap ini; lihat `FINANCE-2.0.md` §0 untuk detail.

## Ditambahkan

- **`index.html`, `app_production.html`** — tambah blok `.keu-fab`
  (FAB tambah transaksi cepat: 💚 Pemasukan / 🔴 Pengeluaran) di dalam
  `#page-keuangan`, tepat setelah `.cn-tabs`, sebelum
  `#keuanganTab-kelola` (supaya tampil di kedua tab Kelola & Laporan).
  Reuse fungsi `openTxModal('income'|'expense')` yang sudah ada di
  `transaksi.js` — **tidak ada fungsi JS baru**. Toggle buka/tutup pakai
  mekanisme `data-onclick` generik yang sudah ada
  (`features-helpers-global-security.js`, tidak diubah). Kedua file
  tetap identik satu sama lain (diverifikasi dengan `diff`).
- **`styles.css`** — blok CSS baru scoped `.keu-fab*` (append di akhir
  file), 100% pakai token yang sudah ada (`--sp-*`/`--r-full`/
  `--r-pill`/`--fs-icon*`/`--z-dropdown`/`--accent`/`--surface3`/
  `--border2`/`--dur-fast`/`--ease-standard`). Tidak ada deklarasi lama
  yang diubah nilainya.
- **`FINANCE-2.0.md`** — dokumentasi deliverable Sprint 2 Tahap 1.
- **`tests/finance-2.0-fab.test.js`** — 12 test struktural baru
  (markup FAB ada & di posisi yang benar, reuse `openTxModal()`, reuse
  `data-onclick`, parity `index.html`/`app_production.html`, CSS pakai
  token yang sudah ada, guard `FEATURE_REGISTRY` & business logic tidak
  disentuh).

## Tidak diubah

- Hero Dashboard, Dashboard, Dashboard Analytics (Tahap 7) — tidak
  disentuh sama sekali.
- Seluruh isi Halaman Keuangan yang sudah ada (Anggaran, Dana Pensiun,
  Proyek Renovasi, Sewa Kios, dll.) — 0 baris berubah.
- `FEATURE_REGISTRY` (`dashboard-hub-registry.js`), ADR-001, business
  logic (`transaksi.js`, `modules-calc.js`, dll.), routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1283
# pass 1283
# fail 0
```

Tidak ada test lama yang gagal; tidak ada test yang dihapus/diubah.
Hero Dashboard, Dashboard, dan Halaman Keuangan diverifikasi tetap
tampil & berfungsi setelah perubahan ini; FAB tampil sebagai tombol
mengambang baru di Halaman Keuangan.

## Status

FAB Halaman Keuangan selesai, sesuai cakupan Sprint 2 Tahap 1. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke
halaman Shop, Car Notes, atau Laporan, menunggu instruksi Sprint 2
Tahap 2.

---

# Changelog — Sprint 2 Tahap 2: FAB Halaman Shop (Shop 2.0)

Baseline: Sprint 2 Tahap 1 selesai, `node --test` **1283/1283 PASS**.

## Ditambahkan

- **`index.html`, `app_production.html`** — tambah blok `.keu-fab`
  (FAB aksi cepat: 🛒 Transaksi Baru / 📦 Tambah Produk) di dalam
  `#page-shop`, tepat setelah `.cn-tabs`, sebelum `#shopTab-kasir`
  (supaya tampil di seluruh 6 tab Shop). Reuse **penuh** class CSS
  `.keu-fab*` dari Sprint 2 Tahap 1 (tidak ada class baru) dan fungsi
  `openOrderModal()`/`openProductModal()` yang sudah ada — **tidak ada
  fungsi JS baru**. Toggle buka/tutup pakai mekanisme `data-onclick`
  generik yang sudah ada. Kedua file tetap identik satu sama lain
  (diverifikasi dengan `diff`).
- **`styles.css`** — 1 rule aditif `#page-shop .keu-fab{bottom:150px;}`
  supaya FAB Shop tidak tumpang tindih dengan `.kasir-floatbar` di tab
  Kasir AI. Rule `.keu-fab` asli (Tahap 1) tidak diubah nilainya. Tidak
  ada class `.shop-fab*` baru.
- **`SHOP-2.0.md`** — dokumentasi deliverable Sprint 2 Tahap 2.
- **`tests/shop-fab.test.js`** — 16 test struktural baru (markup FAB
  ada & di posisi yang benar, reuse class `.keu-fab*`, reuse
  `openOrderModal()`/`openProductModal()`, reuse `data-onclick`, parity
  `index.html`/`app_production.html`, guard tidak ada class CSS baru,
  guard rule `.keu-fab` asli tidak berubah, guard `cobek-io.js`/
  `cobek-tx-cart.js`/`FEATURE_REGISTRY` tidak disentuh).

## Tidak diubah

- Hero Dashboard, Dashboard, Dashboard Analytics, Halaman Keuangan &
  FAB-nya (Sprint 2 Tahap 1) — tidak disentuh sama sekali.
- Seluruh isi Halaman Shop yang sudah ada (Kasir AI, Manual, Etalase,
  Produsen, Riwayat, Pelanggan) — 0 baris berubah, tetap tampil &
  berfungsi seperti sebelumnya.
- `cobek-io.js` (`openOrderModal`, `setShopTab`), `cobek-tx-cart.js`
  (`openProductModal`) — 0 baris berubah; hanya dipanggil ulang (reuse)
  dari lokasi baru.
- `FEATURE_REGISTRY` (`dashboard-hub-registry.js`), ADR-001, business
  logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1299
# pass 1299
# fail 0
```

Tidak ada test lama yang gagal/dihapus/diubah. Hero Dashboard,
Dashboard, Halaman Keuangan+FAB, dan Halaman Shop diverifikasi tetap
tampil & berfungsi setelah perubahan ini; FAB tampil sebagai tombol
mengambang baru di seluruh tab Halaman Shop.

## Status

FAB Halaman Shop selesai, sesuai cakupan Sprint 2 Tahap 2. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke
Sprint 2 Tahap 3.

---

# Changelog — Sprint 2 Tahap 3: FAB Halaman Car Notes (Car Notes 2.0)

Baseline: Sprint 2 Tahap 2 selesai, `node --test` **1299/1299 PASS**.

## Ditambahkan

- **`index.html`, `app_production.html`** — tambah blok `.keu-fab`
  (FAB aksi cepat: ⛽ Isi BBM / 🔧 Servis) di dalam `#page-carnotes`,
  tepat setelah `.cn-tabs`, sebelum komentar `<!-- BBM TAB -->` (supaya
  tampil di kedua tab Car Notes). Reuse **penuh** class CSS `.keu-fab*`
  dari Sprint 2 Tahap 1 (tidak ada class baru) dan fungsi
  `openBbmModal()`/`openServisModal()` yang sudah ada — **tidak ada
  fungsi JS baru**. Toggle buka/tutup pakai mekanisme `data-onclick`
  generik yang sudah ada. Kedua file tetap identik satu sama lain
  (diverifikasi dengan `diff`).
- **`CAR-NOTES-2.0.md`** — dokumentasi deliverable Sprint 2 Tahap 3.
- **`tests/car-notes-fab.test.js`** — 17 test struktural baru (markup
  FAB ada & di posisi yang benar, reuse class `.keu-fab*`, reuse
  `openBbmModal()`/`openServisModal()`, reuse `data-onclick`, parity
  `index.html`/`app_production.html`, guard tidak ada class CSS baru
  & tidak ada override posisi baru di `styles.css`, guard
  `vehicle-core.js`/`sparepart-servis.js`/`FEATURE_REGISTRY`/
  `dashboard-hub.js` tidak disentuh).

## Tidak diubah

- Hero Dashboard, Dashboard, Dashboard Analytics, Halaman Keuangan &
  FAB-nya (Tahap 1), Halaman Shop & FAB-nya (Tahap 2) — tidak disentuh
  sama sekali.
- Seluruh isi Halaman Car Notes yang sudah ada (tab BBM & Servis,
  spesifikasi kendaraan, pajak/SIM, sparepart, stok, import data) — 0
  baris berubah, tetap tampil & berfungsi seperti sebelumnya.
- `styles.css` — **tidak disentuh sama sekali** di Tahap 3 ini; FAB Car
  Notes memakai posisi default `.keu-fab` tanpa override tambahan
  (berbeda dari Tahap 2 yang butuh 1 override untuk Shop).
- `vehicle-core.js` (`openBbmModal`, `setCnTab`), `sparepart-servis.js`
  (`openServisModal`) — 0 baris berubah; hanya dipanggil ulang (reuse)
  dari lokasi baru.
- `FEATURE_REGISTRY` (`dashboard-hub-registry.js`), `dashboard-hub.js`,
  ADR-001, business logic kendaraan, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1316
# pass 1316
# fail 0
```

Tidak ada test lama yang gagal/dihapus/diubah. Hero Dashboard,
Dashboard, Halaman Keuangan+FAB, Halaman Shop+FAB, dan Halaman Car
Notes diverifikasi tetap tampil & berfungsi setelah perubahan ini; FAB
tampil sebagai tombol mengambang baru di kedua tab Halaman Car Notes.

## Status

FAB Halaman Car Notes selesai, sesuai cakupan Sprint 2 Tahap 3. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke
Sprint 2 Tahap 4.

---

# Changelog — Sprint 2 Tahap 4: FAB Halaman Laporan (Reports 2.0)

Baseline: Sprint 2 Tahap 3 selesai, `node --test` **1316/1316 PASS**.

## Ditambahkan

- **`index.html`, `app_production.html`** — tambah blok `.keu-fab`
  baru (FAB aksi cepat: 🧾 Export PDF / 📄 Export CSV) di dalam
  `#keuanganTab-laporan`, tepat setelah pembukaan div-nya, sebelum
  `.page-settings-btn`. Audit menemukan bahwa Laporan adalah **tab**
  di dalam `#page-keuangan`, bukan page terpisah — FAB baru ini
  (`#laporanFab`) sengaja ditaruh **di dalam** tab Laporan (kontekstual,
  beda dari `#keuFab` Tahap 1 yang ditaruh di luar kedua tab) supaya
  hanya tampil saat tab Laporan aktif, murni lewat toggle `u-dnone`
  yang **sudah ada** (`setKeuanganTab()`, `tx-list-cashflow.js`, tidak
  disentuh) — **tidak ada JS baru sama sekali**. Reuse **penuh** class
  CSS `.keu-fab*` dari Sprint 2 Tahap 1 (tidak ada class baru) dan
  fungsi `exportLaporanPDF()`/`exportCSV()` yang sudah ada. `#keuFab`
  (Tahap 1) tidak diubah, tetap tampil di kedua tab seperti sebelumnya.
  Kedua file tetap identik satu sama lain (diverifikasi dengan `diff`).
- **`styles.css`** — 1 rule aditif
  `#keuanganTab-laporan .keu-fab{bottom:170px;}` supaya `#laporanFab`
  tidak tumpang tindih dengan `#keuFab` saat tab Laporan aktif. Rule
  `.keu-fab` asli (Tahap 1) dan override Shop (Tahap 2) tidak diubah
  nilainya. Tidak ada class `.laporan-fab*`/`.reports-fab*` baru.
- **`REPORTS-2.0.md`** — dokumentasi deliverable Sprint 2 Tahap 4.
- **`tests/laporan-fab.test.js`** — 20 test struktural baru (markup FAB
  ada & di posisi yang benar, penempatan kontekstual di dalam tab
  Laporan, reuse class `.keu-fab*`, reuse
  `exportLaporanPDF()`/`exportCSV()`, reuse `data-onclick`, parity
  `index.html`/`app_production.html`, guard tidak ada class CSS baru &
  guard override posisi, guard `tx-list-cashflow.js`/
  `features-aiwidget-reminder-gdrive-search.js`/`backup-restore.js`/
  `FEATURE_REGISTRY`/`dashboard-hub.js` tidak disentuh).

## Tidak diubah

- Hero Dashboard, Dashboard, Dashboard Analytics, Halaman Shop & FAB-nya
  (Tahap 2), Halaman Car Notes & FAB-nya (Tahap 3) — tidak disentuh
  sama sekali.
- `#keuFab` (Tahap 1) dan seluruh isi tab Kelola & Laporan yang sudah
  ada (filter, grafik, proyeksi arus kas, per kategori, daftar
  transaksi, card export) — 0 baris berubah, tetap tampil & berfungsi
  seperti sebelumnya.
- `tx-list-cashflow.js` (`setKeuanganTab`),
  `features-aiwidget-reminder-gdrive-search.js` (`exportLaporanPDF`),
  `backup-restore.js` (`exportCSV`) — 0 baris berubah; hanya dipanggil
  ulang (reuse) dari lokasi baru.
- `FEATURE_REGISTRY` (`dashboard-hub-registry.js`), `dashboard-hub.js`,
  ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi (`package.json` tidak berubah).
- `scripts/build.js` **tidak dijalankan**.

## Hasil test

```
node --test
# tests 1335
# pass 1335
# fail 0
```

Tidak ada test lama yang gagal/dihapus/diubah. Hero Dashboard,
Dashboard, Halaman Keuangan+FAB (Kelola & Laporan), Halaman Shop+FAB,
dan Halaman Car Notes+FAB diverifikasi tetap tampil & berfungsi setelah
perubahan ini; FAB Laporan tampil sebagai tombol mengambang baru,
kontekstual hanya di tab Laporan.

## Status

FAB tab Laporan selesai, sesuai cakupan Sprint 2 Tahap 4. Sesuai
instruksi, pengerjaan **berhenti di sini** — tidak melanjutkan ke
Sprint berikutnya.
