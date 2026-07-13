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
