# Files Changed — Tahap 1

Baseline: `repo-final.zip` yang diunggah (versi v242 /
`kw83-tahap0-feature-registry-17`, sesuai `LANGKAH-9-LAPORAN-AKHIR.md`).

Total file yang berubah: **3**. Total file baru: **1**. Total file
dihapus: **0**. Total file JavaScript tersentuh: **0**.

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `design-tokens.css` | **Baru** | +95 | Semua design token (9 blok tema warna + `:root` spacing/radius/font-size/z-index) dipindah apa adanya dari `styles.css`, plus token aditif baru (`--font-body`, `--font-heading`, 7 token radius tambahan, skala shadow & transition durasi sebagai referensi). |
| `styles.css` | Diubah | 739 → 727 baris | (1) Blok token dipindah keluar ke `design-tokens.css`, diganti komentar penunjuk. (2) 71 deklarasi `border-radius`/`border-*-radius` yang sebelumnya angka px literal diganti `var(--r-*)` — **nilai akhir identik**. (3) 32 deklarasi `font-family` diganti `var(--font-body)`/`var(--font-heading)` — **nilai akhir identik**. Tidak ada selector, urutan cascade, atau nilai visual lain yang berubah. |
| `index.html` | Diubah | +1 baris | Menambah `<link rel="stylesheet" href="design-tokens.css?v=242">` sebelum `<link rel="stylesheet" href="styles.css?v=242">`, supaya token termuat lebih dulu. Nomor versi query string (`?v=242`) disamakan dengan yang sudah ada di file, mengikuti konvensi build yang ada — **build system sendiri tidak dijalankan/diubah**. |
| `app_production.html` | Diubah | +1 baris | Perubahan identik dengan `index.html` (file ini memang dijaga identik dengan `index.html` sesuai konvensi proyek — diverifikasi dengan `diff`, tetap identik setelah perubahan). |
| `UI-AUDIT.md` | Baru | — | Deliverable dokumentasi Tahap 1 (lihat isi file). |
| `DESIGN-SYSTEM.md` | Baru | — | Deliverable dokumentasi Tahap 1 (lihat isi file). |
| `CHANGELOG.md` | Baru | — | Deliverable dokumentasi Tahap 1 (lihat isi file). |
| `FILES-CHANGED.md` | Baru | — | Dokumen ini. |

## File yang TIDAK berubah (ditegaskan)

Diverifikasi dengan `diff -rq` antara baseline dan hasil akhir: **tidak
ada file lain yang berubah** selain empat file di atas + empat dokumen
baru. Secara khusus, dipastikan **tidak tersentuh**:

- Seluruh file `.js` di root maupun `lifeos/` (termasuk
  `dashboard-hub-favorit.js`, `dashboard-hub-registry.js`,
  `features-helpers-global-security.js`, dan lainnya)
- `app-bundle-a.min.js`, `app-bundle-b.min.js`
- `sw.js` (Service Worker)
- `scripts/build.js` dan seluruh isi `scripts/`
- `manifest.json`
- Seluruh isi `tests/`
- `docs/FILE-MAP.md`
- `backups/`
- `eslint.config.js`, `package.json`

## Alasan tidak ada file yang dihapus atau digabung

Tahap 1 murni bersifat aditif + relokasi nilai (bukan penghapusan).
Tidak ada CSS yang dihapus — token yang "hilang" dari `styles.css`
sepenuhnya berpindah ke `design-tokens.css` dengan nilai yang sama,
dan tetap bisa diakses lewat nama variabel yang sama persis.

---

# Files Changed — Tahap 6

Baseline: hasil Tahap 5 (`repo-final.zip` sebagaimana diunggah, 1227/1227
test PASS, 0 file JS berubah sejak Tahap 1).

Total file yang berubah: **2**. Total file baru: **0**. Total file
dihapus: **0**. Total file JavaScript tersentuh: **0**.

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `index.html` | Diubah | 4 titik (teks) | Menghapus emoji `⚙️` yang redundan setelah `</svg>` pada 4 tombol `qs-btn` (qsKeuangan, qsLaporan, qsCarnotes, qsAI) — SVG gear yang sudah ada dipertahankan sebagai satu-satunya icon. Tidak ada atribut, event, atau elemen lain yang berubah. |
| `app_production.html` | Diubah | 4 titik (teks) | Perubahan identik dengan `index.html`, diverifikasi tetap identik via `diff` setelah perubahan (konvensi proyek tetap terjaga). |
| `CHANGELOG.md` | Diperbarui | +bagian Tahap 6 | Menambahkan bagian "Tahap 6 — Audit Icon & Perbaikan Minimal". |
| `FILES-CHANGED.md` | Diperbarui | +bagian ini | Dokumen ini. |
| `UI-ICON-AUDIT.md` | Baru | — | Tabel audit icon lengkap per kategori (deliverable Tahap 6, terpisah dari `UI-AUDIT.md` Tahap 1 supaya tidak menimpa audit sebelumnya). |

## File yang TIDAK berubah (ditegaskan)

Diverifikasi dengan `diff` dan `grep`: **tidak ada file lain yang
berubah**. Secara khusus dipastikan tetap utuh:

- Seluruh 69 file `.js` di root maupun `lifeos/**` (termasuk
  `dashboard-hub-registry.js` yang menyimpan field `icon:` emoji —
  sengaja tidak disentuh karena mengubahnya berarti mengubah
  JavaScript)
- `app-bundle-a.min.js`, `app-bundle-b.min.js`
- `styles.css`
- `sw.js` (Service Worker)
- `scripts/build.js` dan seluruh isi `scripts/`
- `manifest.json`, `icon-192.svg`, `icon-512.svg`
- Seluruh isi `tests/`
- ADR-001, `FEATURE_REGISTRY`, Blueprint Final
- `eslint.config.js`, `package.json`

## Alasan tidak ada file JS/CSS yang diubah di Tahap 6

Satu-satunya perubahan yang lolos kriteria "aman + minimal" adalah
penghapusan emoji duplikat di dua file HTML statis. Seluruh temuan
audit lain yang secara teknis "perlu diganti" (emoji sebagai icon UI)
mayoritas berada di JavaScript (field data `icon:`, label tombol
dinamis) — mengubahnya melanggar batasan eksplisit Tahap 6 ("Jangan
mengubah JavaScript"), sehingga dicatat sebagai rekomendasi Tahap 7,
bukan dieksekusi.

---

# Files Changed — Tahap 7

Baseline: hasil Tahap 6 (1227/1227 PASS, 0 JS berubah sejak Tahap 1).

Total file yang berubah: **2**. Total file baru: **0**. Total file
dihapus: **0**. Total file JavaScript tersentuh: **0**. Total file
HTML tersentuh: **0**.

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `styles.css` | Diubah | 739 → 818 baris (+79, murni aditif) | Motion tokens (`--dur-*`, `--ease-*`), `prefers-reduced-motion`, `:focus-visible`, ripple CSS-only pada 13 tap-target, press-feedback yang tadinya belum ada (4 komponen + nav-item), card elevation on hover (desktop-only), penyeragaman easing pada `overlayIn`/`slideUp`/`.toast`/`.page` (nilai durasi tidak berubah). |
| `CHANGELOG.md` | Diperbarui | +bagian Tahap 7 | Menambahkan bagian "Tahap 7 — Micro Interaction & Motion System". |
| `FILES-CHANGED.md` | Diperbarui | +bagian ini | Dokumen ini. |

## File yang TIDAK berubah (ditegaskan)

- Seluruh 69 file `.js` (root & `lifeos/**`), termasuk
  `app-bundle-a.min.js`, `app-bundle-b.min.js`
- `index.html`, `app_production.html` (tetap identik satu sama lain,
  diverifikasi `diff`)
- `sw.js`, `scripts/build.js`, `manifest.json`, `icon-192.svg`,
  `icon-512.svg`
- Seluruh isi `tests/`
- ADR-001, `FEATURE_REGISTRY`, Blueprint Final
- `eslint.config.js`, `package.json`
- `UI-ICON-AUDIT.md` (dokumen Tahap 6, tidak disentuh ulang)

## Alasan hanya `styles.css` yang diubah

Seluruh target Tahap 7 (hover, active, focus-visible, press
animation, card elevation, button feedback, navigation transition,
dialog/bottom-sheet/snackbar animation, ripple CSS-only,
`prefers-reduced-motion`, smooth scrolling) bisa dicapai murni lewat
CSS karena mekanisme toggle (`class .open`, `class .show`, `class
.active`) yang dibutuhkan **sudah ada** di JavaScript sejak sebelum
Tahap 7 — CSS baru hanya perlu "mengisi" bagaimana state tersebut
tampil secara visual. Satu pengecualian (exit animation overlay)
butuh perubahan JS dan sengaja **tidak dieksekusi**, dicatat sebagai
rekomendasi Tahap 8 di `CHANGELOG.md`.

# Files Changed — Tahap 8

Baseline: hasil Tahap 7 (1228/1228 test PASS — angka aktual, lihat
`FINAL-QA.md` §1 — 0 file JS berubah sejak Tahap 1).

Total file yang berubah: **2**. Total file baru: **1**. Total file
dihapus: **0**. Total file CSS/JavaScript tersentuh: **0**.

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `FINAL-QA.md` | **Baru** | — | Deliverable audit akhir Tahap 8 (lihat isi file: accessibility, responsive, performance CSS, design system, motion, icon summary, rekomendasi Tahap 9, ringkasan Tahap 1–8, quality gate). |
| `CHANGELOG.md` | Diperbarui | +bagian Tahap 8 | Menambahkan bagian "Tahap 8 — Final QA, Accessibility, Performance & Release Candidate". |
| `FILES-CHANGED.md` | Diperbarui | +bagian ini | Dokumen ini. |

## File yang TIDAK berubah (ditegaskan)

Diverifikasi dengan `diff -rq` terhadap hasil Tahap 7: **tidak ada file
lain yang berubah**. Secara khusus dipastikan tetap utuh:

- Seluruh file `.js` di root maupun `lifeos/**`
- `app-bundle-a.min.js`, `app-bundle-b.min.js`
- `styles.css`, `index.html`, `app_production.html`
- `sw.js` (Service Worker)
- `scripts/build.js` dan seluruh isi `scripts/`
- `manifest.json`, `icon-192.svg`, `icon-512.svg`
- Seluruh isi `tests/`
- ADR-001, `FEATURE_REGISTRY`, Blueprint Final
- `eslint.config.js`, `package.json`
- `UI-ICON-AUDIT.md` (deliverable Tahap 6, tidak diaudit ulang)

## Alasan tidak ada file CSS/JS yang diubah di Tahap 8

Tahap 8 adalah audit murni. Seluruh temuan yang secara teknis "bisa"
diperbaiki (literal CSS vs token, kontras `--text3`, ukuran tap-target
sekunder) sengaja **tidak dieksekusi** mengikuti instruksi eksplisit
brief Tahap 8: "Jangan mengubah jika berisiko. Catat sebagai
rekomendasi bila perlu." Seluruh temuan dicatat di `FINAL-QA.md` §8
sebagai rekomendasi Tahap 9.

# Files Changed — Final Release Candidate (Release Notes, Dokumentasi & Handover)

Baseline: hasil Tahap 8 / Release Candidate (1228/1228 test PASS, 0
file JS/CSS/HTML berubah sejak Tahap 1).

Total file yang berubah: **6**. Total file baru: **4**. Total file
dihapus: **0**. Total file HTML/CSS/JavaScript tersentuh: **0**.

| File | Jenis | Ringkasan |
|---|---|---|
| `RELEASE-NOTES.md` | **Baru** | Ringkasan Release Candidate, highlight Tahap 1–8, fitur utama, hasil testing, quality gate. |
| `PROJECT-SUMMARY.md` | **Baru** | Struktur project, arsitektur, design system, entry point, folder utama, komponen utama, alur aplikasi — untuk handover ke developer lain. |
| `KNOWN-ISSUES.md` | **Baru** | Daftar seluruh isu yang sengaja belum diperbaiki (murni dokumentasi ulang dari `FINAL-QA.md`, tidak ada perbaikan baru). |
| `ROADMAP-v1.1.md` | **Baru** | Backlog versi berikutnya, dikelompokkan High/Medium/Low Priority. |
| `CHANGELOG.md` | Diperbarui | +bagian "Final Release Candidate — Release Notes, Dokumentasi & Handover". |
| `FILES-CHANGED.md` | Diperbarui | +bagian ini. |

## File yang TIDAK berubah (ditegaskan)

Diverifikasi dengan `diff -rq` terhadap hasil Tahap 8: **tidak ada file
HTML/CSS/JavaScript yang berubah**. Secara khusus dipastikan tetap utuh:

- Seluruh file `.js` di root maupun `lifeos/**`
- `app-bundle-a.min.js`, `app-bundle-b.min.js`
- `styles.css`, `index.html`, `app_production.html`
- `sw.js` (Service Worker)
- `scripts/build.js` dan seluruh isi `scripts/`
- `manifest.json`, `icon-192.svg`, `icon-512.svg`
- Seluruh isi `tests/`
- ADR-001, `FEATURE_REGISTRY`, Blueprint Final
- `eslint.config.js`, `package.json`
- `FINAL-QA.md`, `UI-ICON-AUDIT.md`, `DESIGN-SYSTEM.md`, `UI-AUDIT.md`, `LANGKAH-9-LAPORAN-AKHIR.md` (deliverable tahap sebelumnya, tidak diubah)

## Validasi

Perintah yang dijalankan untuk memastikan hanya file Markdown yang
berubah:

```
diff -rq <baseline-tahap-8> <hasil-final>
```

Hasil: hanya `CHANGELOG.md`, `FILES-CHANGED.md` (diperbarui) dan
`RELEASE-NOTES.md`, `PROJECT-SUMMARY.md`, `KNOWN-ISSUES.md`,
`ROADMAP-v1.1.md` (baru) yang muncul di diff — seluruhnya berekstensi
`.md`. Tidak ada file lain yang tersentuh.

## Daftar Seluruh File Dokumentasi (Kumulatif Tahap 1 – Final)

| File | Dibuat di Tahap |
|---|---|
| `UI-AUDIT.md` | 1 |
| `DESIGN-SYSTEM.md` | 1 |
| `CHANGELOG.md` | 1 (diperbarui tiap tahap) |
| `FILES-CHANGED.md` | 1 (diperbarui tiap tahap) |
| `UI-ICON-AUDIT.md` | 6 |
| `FINAL-QA.md` | 8 |
| `RELEASE-NOTES.md` | Final |
| `PROJECT-SUMMARY.md` | Final |
| `KNOWN-ISSUES.md` | Final |
| `ROADMAP-v1.1.md` | Final |
| `LANGKAH-9-LAPORAN-AKHIR.md` | Pra-Tahap 1 (baseline) |
| `README.md` | Pra-Tahap 1 (baseline) |
| `docs/CLAUDE.md`, `docs/FILE-MAP.md`, `docs/CATATAN-CEK-CLAUDE.md`, `docs/PRE-MERGE-LINT-CHECK.md` | Pra-Tahap 1 (baseline, internal) |

---

# Files Changed — Sprint 1, Tahap 2 (Dashboard 2.0 — Hero Card)

Baseline: FINAL RELEASE CANDIDATE (v242 / `kw83-tahap0-feature-registry-17`)
+ Sprint 1 Tahap 1 (`DASHBOARD-2.0-PLAN.md`, 0 file kode disentuh).

Total file kode berubah: **4** (`dashboard-hub.js`, `index.html`,
`styles.css`, + `app_production.html` sinkron otomatis). Total file baru:
**2** (`HERO-CARD.md`, `tests/dashboard-hub-hero.test.js`). Total file
dibuat ulang otomatis oleh `scripts/build.js` (bukan diedit manual):
**5** (`app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
`docs/FILE-MAP.md`, + versi string di 6 file source).

| File | Jenis | Ringkasan |
|---|---|---|
| `dashboard-hub.js` | Diubah | Tambah `_dashHubHeroMonthTx()` + object `DashboardHubHero` (fungsi baru murni, tidak ada baris lama dihapus/diubah), + 1 baris pemanggilan aditif `if (typeof DashboardHubHero !== 'undefined') DashboardHubHero.render();` di dalam `DashboardHub.render()`, pola sama dgn `LifeOSHome.render()`/`DashboardHubFavoritView.render()` yang sudah ada. |
| `index.html` | Diubah | Tambah blok `<div class="dashhub-hero" id="dashHubHeroCard">…</div>` di dalam `#page-dashboard-hub`, sebagai elemen PERTAMA setelah header, sebelum `.dashhub-search-wrap`. Tidak ada elemen lain yang dipindah/dihapus/diubah. |
| `styles.css` | Diubah | Tambah blok CSS baru scoped `.dashhub-hero*` (~25 deklarasi) setelah `.dashhub-search-empty`, sebelum komentar "Tahap 5 (Responsive...)". 100% pakai token yang sudah ada (`--r-2xl`/`--sp-*`/`--fs-*`/`--accent*`/`.green`/`.red`). Tidak ada deklarasi `.dashhub-*` lama yang diubah nilainya. |
| `app_production.html` | Diubah (otomatis) | Disinkronkan ulang jadi salinan persis `index.html` oleh `scripts/build.js` (konvensi proyek yang sudah ada — file ini SELALU ditulis ulang di akhir build, bukan diedit manual). |
| `app-bundle-a.min.js` | Dibuat ulang (otomatis) | Hasil `scripts/build.js` dari GROUP_A source (tidak ada file GROUP_A yang berubah isinya di tahap ini, bundle ini ikut ditulis ulang krn build memproses kedua grup sekaligus + bump versi). |
| `app-bundle-b.min.js` | Dibuat ulang (otomatis) | Hasil `scripts/build.js` dari GROUP_B source, termasuk `dashboard-hub.js` yang sudah memuat `DashboardHubHero`. Ini file yang BENERAN dimuat `index.html`/`app_production.html` lewat `<script src="app-bundle-b.min.js?v=243">`. |
| `sw.js` | Diubah (otomatis) | `CACHE_NAME` naik ke `'kw-cache-v243'` — efek samping bump-version otomatis `scripts/build.js`, bukan perubahan logic Service Worker. |
| `docs/FILE-MAP.md` | Dibuat ulang (otomatis) | Ditulis ulang otomatis oleh `scripts/build.js` (bagian dari alur build yang sudah ada). |
| 6 file source versi (`modules-render.js`, `modals.js`, `modules-calc.js`, `features-budget-laporan-carnotes-pelanggan.js`, `features-helpers-global-security.js`, `features-aiwidget-reminder-gdrive-search.js`) | Diubah (otomatis) | String versi `kw83-tahap0-feature-registry-17` → `-18`, bump otomatis `scripts/build.js` (konvensi versi yang sudah ada sejak Tahap 0, bukan proses baru). |
| `HERO-CARD.md` | **Baru** | Dokumentasi struktur, data, CSS, dan alasan desain Hero Card (deliverable Tahap 2). |
| `tests/dashboard-hub-hero.test.js` | **Baru** | 8 test baru utk `DashboardHubHero` + 1 test integrasi `DashboardHub.render()`. |
| `CHANGELOG.md` | Diubah | Tambah bagian "Sprint 1, Tahap 2" di akhir file (append, riwayat lama tidak diubah). |
| `FILES-CHANGED.md` | Diubah | Dokumen ini (append, riwayat lama tidak diubah). |

## File yang TIDAK berubah (ditegaskan)

- `dashboard-hub-registry.js` (**`FEATURE_REGISTRY`**) — 0 baris berubah.
- `scripts/build.js` — **dijalankan, TIDAK diedit**. Semua perubahan di
  file di atas yang bertanda "(otomatis)" adalah OUTPUT dari menjalankan
  skrip ini apa adanya, bukan hasil edit manual ke `scripts/build.js`.
- Seluruh JS domain lain (`akun.js`, `transaksi.js`, `modules-calc.js`, dkk)
  — isinya tidak diedit sama sekali; hanya ikut "dibaca ulang" (unchanged
  content) ke dalam bundle baru oleh `scripts/build.js`.
- `manifest.json`, `eslint.config.js`, `package.json` — tidak disentuh,
  tidak ada dependency baru.
- Grid kategori, Favorit, Life OS, Pinned Widgets, Bottom Navigation, Quick
  Switcher — 0 baris berubah pada komponen-komponen ini.
- `DASHBOARD-2.0-PLAN.md` (deliverable Tahap 1) — tidak diedit ulang.

## Hasil test

```
node --test tests/*.test.js
# tests 1235
# pass 1235
# fail 0
```

(Baseline pristine terverifikasi ulang di lingkungan ini: 1227/1227 PASS —
lihat catatan di `CHANGELOG.md` bagian Tahap 2. 8 test baru ditambahkan
murni aditif, 0 test lama gagal/dihapus.)

---

# Files Changed — Sprint 1, Tahap 3 (Dashboard 2.0 — Quick Actions)

Baseline: Sprint 1 Tahap 2 — Hero Card (1235/1235 test PASS, build
`kw83-tahap0-feature-registry-18`, v243).

Total file kode berubah: **3** (`index.html`, `styles.css`, +
`app_production.html` sinkron otomatis). Total file baru: **2**
(`QUICK-ACTIONS.md`, `tests/dashboard-hub-quickactions.test.js`). Total
file dibuat ulang otomatis oleh `scripts/build.js` (bukan diedit manual):
**5** (`app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
`docs/FILE-MAP.md`, + versi string di 6 file source). **0 file JavaScript
domain diedit manual** — Quick Actions murni markup, tidak butuh modul JS
baru.

| File | Jenis | Ringkasan |
|---|---|---|
| `index.html` | Diubah | Tambah blok `<div class="dashhub-qa-row" id="dashHubQuickActions">…</div>` (5 tombol `.dashhub-qa-btn`) di dalam `#page-dashboard-hub`, tepat setelah `.dashhub-hero`, sebelum `.dashhub-search-wrap`. Tiap tombol memanggil fungsi yang **SUDAH ADA** lewat `data-onclick` (`openTxModal('expense')`, `openCatatan('anak')`, `openBackupModal()`, `document.getElementById('dashHubSearchInput').focus()`, `showPage('ai',document.querySelectorAll('.nav-item')[3])`). Tidak ada elemen lain yang dipindah/dihapus/diubah. |
| `styles.css` | Diubah | Tambah blok CSS baru scoped `.dashhub-qa*` (~12 deklarasi) setelah blok media query Hero Card `min-width:600px`. 100% pakai token yang sudah ada (`--sp-*`/`--r-pill`/`--fs-icon-lg`/`--surface2`/`--surface3`/`--border`/`--accent`/`--text2`). Tidak ada deklarasi `.dashhub-*` lama yang diubah nilainya. |
| `app_production.html` | Diubah (otomatis) | Disinkronkan ulang jadi salinan persis `index.html` oleh `scripts/build.js` (konvensi proyek yang sama sejak Tahap 2). |
| `app-bundle-a.min.js` | Dibuat ulang (otomatis) | Hasil `scripts/build.js` dari GROUP_A source — bump versi otomatis, tidak ada perubahan logic GROUP_A. |
| `app-bundle-b.min.js` | Dibuat ulang (otomatis) | Hasil `scripts/build.js` dari GROUP_B source — bump versi otomatis, tidak ada fungsi JS baru (Quick Actions murni markup, tidak menyentuh `dashboard-hub.js`). |
| `sw.js` | Diubah (otomatis) | `CACHE_NAME` naik ke `'kw-cache-v244'` — efek samping bump-version otomatis `scripts/build.js`. |
| `docs/FILE-MAP.md` | Dibuat ulang (otomatis) | Ditulis ulang otomatis oleh `scripts/build.js`. |
| 6 file source versi (`modules-render.js`, `modals.js`, `modules-calc.js`, `features-budget-laporan-carnotes-pelanggan.js`, `features-helpers-global-security.js`, `features-aiwidget-reminder-gdrive-search.js`) | Diubah (otomatis) | String versi `kw83-tahap0-feature-registry-18` → `-19`, bump otomatis `scripts/build.js`. |
| `QUICK-ACTIONS.md` | **Baru** | Dokumentasi struktur Quick Actions, aksi yang digunakan, event yang dipanggil, CSS baru, dan alasan desain (deliverable Tahap 3). |
| `tests/dashboard-hub-quickactions.test.js` | **Baru** | 10 test baru: markup ada & posisi benar, jumlah tombol, tiap tombol memanggil fungsi yang sudah ada, Hero Card/Grid Dashboard tidak tersentuh, parity HTML, token CSS valid. |
| `CHANGELOG.md` | Diubah | Tambah bagian "Sprint 1, Tahap 3" di akhir file (append, riwayat lama tidak diubah). |
| `FILES-CHANGED.md` | Diubah | Dokumen ini (append, riwayat lama tidak diubah). |

## File yang TIDAK berubah (ditegaskan)

- `dashboard-hub.js` — **0 baris berubah**. Quick Actions tidak butuh modul
  JS baru karena tiap tombol langsung memanggil fungsi global yang sudah
  ada lewat `data-onclick` (dispatcher yang sudah ada di
  `features-helpers-global-security.js`).
- `dashboard-hub-registry.js` (`FEATURE_REGISTRY`) — 0 baris berubah.
- `transaksi.js` (`openTxModal`, `openCatatan`), `backup-restore.js`
  (`openBackupModal`), `modal-navigasi.js` (`showPage`) — dipanggil APA
  ADANYA, **0 baris diedit**.
- `scripts/build.js` — dijalankan, TIDAK diedit.
- Grid Dashboard (`#dashboardHubGrid`/`#dashboardHubWrap`), Widget (Life
  OS, Favorit, Pinned Widgets), Bottom Navigation (`.nav-item`) — 0 baris
  berubah pada komponen-komponen ini.
- `manifest.json`, `eslint.config.js`, `package.json` — tidak disentuh,
  tidak ada dependency baru.
- `HERO-CARD.md` (deliverable Tahap 2) — tidak diedit ulang.

## Hasil test

```
node --test tests/*.test.js
# tests 1245
# pass 1245
# fail 0
```

(Baseline Tahap 2 terverifikasi ulang di lingkungan ini: 1235/1235 PASS.
10 test baru ditambahkan murni aditif, 0 test lama gagal/dihapus.)

# Files Changed — Sprint 1 Tahap 4 (Modern Dashboard Grid)

Baseline: Sprint 1 Tahap 3 selesai, `node --test` 1245/1245 PASS.

Total file kode berubah: **2**. Total file baru: **1** (dokumentasi).
Total baris kode berubah: **~42** (jauh di bawah batas 350 baris / 5 file).

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `styles.css` | Diubah | ~40 baris (24 tambah, 17 hapus/ganti) | Modernisasi Material Design 3 untuk `.dashhub-cat*`, `.dashhub-feature-grid`, `.dashhub-feature-card`, `.dashhub-feature-name/-desc`, `.dashhub-fav-star`, dan hover elevation kartu — radius, padding/gap via token spacing, shadow elevation, favorite indicator jadi chip bulat, + 1 class baru `.dashhub-cat-badge`. |
| `dashboard-hub.js` | Diubah | +1 baris | Render `.dashhub-cat-badge` (jumlah fitur per kategori) di sebelah label kategori — murni tampilan, pakai `cat.features.length` yang sudah ada, `FEATURE_REGISTRY` tidak disentuh. |
| `DASHBOARD-GRID.md` | Baru | — | Deliverable dokumentasi Tahap 4. |
| `CHANGELOG.md` | Diubah | ditambah section baru | Entry Tahap 4 ditambahkan di akhir file (aditif, entry Tahap 1-3 tidak diubah). |
| `FILES-CHANGED.md` | Diubah | ditambah section baru | Dokumen ini. |

## File yang TIDAK berubah (ditegaskan)

- Hero Card (`.dashhub-hero*`), Quick Actions (`.dashhub-qa*`) — 0 baris
  berubah, tetap tampil & berfungsi seperti Tahap 2/3.
- Bottom Navigation, AI, Statistik, Widget Drag & Drop, Search — di luar
  cakupan Tahap 4, tidak disentuh.
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `index.html`, `app_production.html` — tidak diedit (markup kontainer
  grid yang sudah ada dari Tahap 1/5 sudah cukup, tidak perlu perubahan).
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi, `package.json`.
- `scripts/build.js` — **tidak dijalankan** (sesuai instruksi, validasi
  cukup `node --test`).

## Hasil test

```
node --test
# tests 1246
# pass 1246
# fail 0
```

# Files Changed — Sprint 1 Tahap 5 (Dashboard Summary Cards)

Baseline: Sprint 1 Tahap 4 selesai, `node --test` 1246/1246 PASS.

Total file kode berubah: **3** (`dashboard-hub.js`, `styles.css`,
`index.html` + `app_production.html` sinkron manual). Total file baru:
**2** (`DASHBOARD-SUMMARY.md`, `tests/dashboard-hub-summary.test.js`).
**`scripts/build.js` tidak dijalankan** — tidak ada file yang
dibuat/ditulis ulang otomatis pada Tahap 5 ini (berbeda dari Tahap 2/3
yang menjalankan build; sama seperti keputusan Tahap 4).

| File | Jenis | Ringkasan |
|---|---|---|
| `dashboard-hub.js` | Diubah | Tambah `_dashHubSummaryMonthTx()` + object `DashboardHubSummary` (fungsi baru murni, tidak ada baris lama dihapus/diubah), + 1 baris pemanggilan aditif `if (typeof DashboardHubSummary !== 'undefined') DashboardHubSummary.render();` di dalam `DashboardHub.render()`, pola sama dgn `DashboardHubHero.render()` yang sudah ada. |
| `index.html` | Diubah | Tambah blok `<div class="dashhub-summary-grid" id="dashHubSummaryGrid"></div>` di dalam `#page-dashboard-hub`, tepat setelah `.dashhub-qa-row` (Quick Actions), sebelum `.dashhub-search-wrap`. Tidak ada elemen lain yang dipindah/dihapus/diubah. |
| `styles.css` | Diubah | Tambah blok CSS baru scoped `.dashhub-summary*` (~6 deklarasi + 1 media query) setelah blok media query Quick Actions `min-width:600px`, sebelum komentar "Tahap 5 (Responsive...)". 100% pakai token yang sudah ada (`--sp-*`/`--r-xl`/`--fs-caption`/`--fs-title-sm`/`--surface2`/`--border`) + utility `.green`/`.red` yang sudah ada. Tidak ada deklarasi `.dashhub-*` lama yang diubah nilainya. |
| `app_production.html` | Diubah (manual, disinkronkan) | Disalin ulang jadi salinan persis `index.html` (diverifikasi `diff` kosong) — **bukan** oleh `scripts/build.js` (tidak dijalankan pada Tahap 5), melainkan disinkronkan langsung krn kedua file harus tetap identik. |
| `DASHBOARD-SUMMARY.md` | **Baru** | Dokumentasi struktur, sumber data, CSS baru, dan alasan desain Summary Cards (deliverable Tahap 5). |
| `tests/dashboard-hub-summary.test.js` | **Baru** | 6 test baru untuk `_dashHubSummaryMonthTx()`/`DashboardHubSummary` + 1 test integrasi `DashboardHub.render()` (memverifikasi Hero Card & Grid Dashboard tetap tampil). |
| `CHANGELOG.md` | Diubah | Tambah bagian "Sprint 1 Tahap 5" di akhir file (append, riwayat lama tidak diubah). |
| `FILES-CHANGED.md` | Diubah | Dokumen ini (append, riwayat lama tidak diubah). |

## File yang TIDAK berubah (ditegaskan)

- Hero Card (`.dashhub-hero*`), Quick Actions (`.dashhub-qa*`), Dashboard
  Grid (`#dashboardHubGrid`/`.dashhub-cat*`/`.dashhub-feature*`) — 0 baris
  berubah, tetap tampil & berfungsi seperti Tahap 2/3/4.
- `dashboard-hub-registry.js` (`FEATURE_REGISTRY`) — 0 baris berubah.
- Bottom Navigation, AI, Statistik, Widget Drag & Drop, Search — di luar
  cakupan Tahap 5, tidak disentuh.
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi, `package.json`.
- `scripts/build.js` — **tidak dijalankan** (sesuai instruksi, validasi
  cukup `node --test`). Catatan: karena build tidak dijalankan, bundle
  yang benar-benar dimuat browser (`app-bundle-b.min.js`) belum memuat
  `DashboardHubSummary` — lihat §5 `DASHBOARD-SUMMARY.md`.

## Hasil test

```
node --test
# tests 1252
# pass 1252
# fail 0
```

(Baseline Tahap 4 terverifikasi ulang di lingkungan ini: 1246/1246 PASS.
6 test baru ditambahkan murni aditif, 0 test lama gagal/dihapus.)

# Files Changed — Sprint 1 Tahap 6 (Modern Pinned Widgets)

Baseline: Sprint 1 Tahap 5 selesai, `node --test` 1252/1252 PASS.

Total file kode berubah: **1** (`styles.css`). Total file baru: **2**
(`PINNED-WIDGETS.md`, `tests/dashboard-hub-pinnedwidgets.test.js`).
Total baris kode berubah: **~47 baris** (jauh di bawah batas 350 baris /
5 file). **0 file HTML/JS diedit** — modernisasi murni CSS, scoped ke
descendant selector `#dashboardHubPinnedWrap ...`.

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `styles.css` | Diubah | ~47 baris (tambah) | Blok CSS baru scoped `#dashboardHubPinnedWrap .card`/`#dashboardHubPinnedWrap .card-title` + 3 media query (600px 2-kolom, 1024px 3-kolom, hover elevation) setelah blok Summary Cards, sebelum komentar "Tahap 5 (Responsive...)". 100% pakai token yang sudah ada (`--r-2xl`/`--sp-*`/`--fs-body-lg`). Definisi dasar `.card`/`.card-title` (dipakai ~40+ kartu lain) **tidak diubah**. |
| `PINNED-WIDGETS.md` | **Baru** | — | Dokumentasi cakupan, alasan "murni CSS scoped", CSS baru, dan alasan desain per target Tahap 6 (deliverable). |
| `tests/dashboard-hub-pinnedwidgets.test.js` | **Baru** | — | 11 test baru: 6 widget & urutannya tidak berubah, markup/`data-action` tiap widget tidak berubah, Hero/Quick Actions/Summary Cards/Grid tetap ada, `.card`/`.card-title` dasar tidak diedit, override ter-scope dengan benar ke Pinned Widgets, token CSS valid, breakpoint 600px/1024px ada. |
| `CHANGELOG.md` | Diubah | ditambah section baru | Entry Tahap 6 ditambahkan di akhir file (aditif, entry Tahap 1-5 tidak diubah). |
| `FILES-CHANGED.md` | Diubah | ditambah section baru | Dokumen ini. |

## File yang TIDAK berubah (ditegaskan)

- `dashboard-hub.js`, `index.html`, `app_production.html` — **0 baris
  berubah**. Rendering isi 6 widget Pinned (`Advisor`, `LifeBalance`,
  `FI`, dkk) sudah ditangani modul JS masing-masing sejak sebelum Tahap
  6, tidak dipanggil dari `DashboardHub.render()` — tidak ada yang perlu
  diedit untuk modernisasi visual ini.
- Hero Card (`.dashhub-hero*`), Quick Actions (`.dashhub-qa*`), Summary
  Cards (`.dashhub-summary*`), Dashboard Grid
  (`#dashboardHubGrid`/`.dashhub-cat*`/`.dashhub-feature*`) — 0 baris
  berubah, tetap tampil & berfungsi seperti Tahap 2/3/4/5.
- `.card`/`.card-title` **dasar** (dipakai ~40+ kartu lain di seluruh
  app: Dashboard lama, Keuangan, Shop, Car Notes, Pajak, Pengaturan,
  dst) — 0 baris berubah; hanya di-override via descendant selector
  `#dashboardHubPinnedWrap ...` yang HANYA berlaku di dalam Pinned
  Widgets.
- Isi widget, event (`data-action`), data (`D.*`), dan urutan 6 widget
  Pinned — tidak diubah.
- `dashboard-hub-registry.js` (`FEATURE_REGISTRY`) — 0 baris berubah.
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi, `package.json`.
- `scripts/build.js` — **tidak dijalankan** (sesuai instruksi, validasi
  cukup `node --test`).

## Hasil test

```
node --test
# tests 1263
# pass 1263
# fail 0
```

(Baseline Tahap 5 terverifikasi ulang di lingkungan ini: 1252/1252 PASS.
11 test baru ditambahkan murni aditif, 0 test lama gagal/dihapus.)

# Files Changed — Sprint 1 Tahap 7 (Dashboard Analytics)

Baseline: Sprint 1 Tahap 6 selesai, `node --test` 1263/1263 PASS.

Total file kode berubah: **4** (`dashboard-hub.js`, `styles.css`,
`index.html` + `app_production.html` sinkron manual). Total file baru:
**2** (`DASHBOARD-ANALYTICS.md`, `tests/dashboard-hub-analytics.test.js`).
Total file kode+test: **5** (pas di batas maksimal). Total baris
kode+markup berubah: **~99 baris** (jauh di bawah batas 350 baris).
**`scripts/build.js` tidak dijalankan** — sama seperti keputusan
Tahap 4/5.

| File | Jenis | Baris berubah | Ringkasan |
|---|---|---|---|
| `dashboard-hub.js` | Diubah | ~62 baris (tambah) | Tambah `_dashHubAnalyticsMonthTx()` + object `DashboardHubAnalytics` (render 5 kartu horizontal: Transaksi Bulan Ini/Total Pemasukan/Total Pengeluaran/Saldo Bersih/Pemasukan vs Pengeluaran %, fungsi baru murni, tidak ada baris lama dihapus/diubah), + 1 baris pemanggilan aditif `if (typeof DashboardHubAnalytics !== 'undefined') DashboardHubAnalytics.render();` di dalam `DashboardHub.render()`, tepat setelah pemanggilan `DashboardHubSummary.render()`. |
| `index.html` | Diubah | ~11 baris (tambah) | Tambah blok `<div class="dashhub-analytics-row" id="dashHubAnalyticsRow"></div>` di dalam `#page-dashboard-hub`, tepat setelah `.dashhub-summary-grid` (Summary Cards), sebelum `.dashhub-search-wrap`. Tidak ada elemen lain yang dipindah/dihapus/diubah. |
| `app_production.html` | Diubah (manual, disinkronkan) | ~11 baris (tambah) | Disalin ulang jadi salinan persis `index.html` (diverifikasi `diff` kosong) — **bukan** oleh `scripts/build.js` (tidak dijalankan pada Tahap 7), melainkan disinkronkan langsung krn kedua file harus tetap identik. |
| `styles.css` | Diubah | ~15 baris (tambah) | Blok CSS baru scoped `.dashhub-analytics*` (5 deklarasi, baris scroll horizontal) setelah blok media query Summary Cards `min-width:600px`, sebelum komentar Pinned Widgets Tahap 6. 100% pakai token yang sudah ada (`--sp-*`/`--r-xl`/`--fs-caption`/`--fs-title-sm`/`--surface2`/`--border`) + utility `.green`/`.red` yang sudah ada; pola scroll horizontal reuse dari `.trs-chip-row`/`.kasir-kat-chips`. Tidak ada deklarasi `.dashhub-*` lama yang diubah nilainya. |
| `DASHBOARD-ANALYTICS.md` | **Baru** | — | Dokumentasi struktur, sumber data, CSS baru, dan alasan desain Dashboard Analytics (deliverable Tahap 7). |
| `tests/dashboard-hub-analytics.test.js` | **Baru** | — | 7 test baru untuk `_dashHubAnalyticsMonthTx()`/`DashboardHubAnalytics` + 1 test integrasi `DashboardHub.render()` (memverifikasi Hero Card/Summary Cards/Grid tetap tampil). |
| `CHANGELOG.md` | Diubah | ditambah section baru | Entry Tahap 7 ditambahkan di akhir file (aditif, entry Tahap 1-6 tidak diubah). |
| `FILES-CHANGED.md` | Diubah | ditambah section baru | Dokumen ini. |

## File yang TIDAK berubah (ditegaskan)

- Hero Card (`.dashhub-hero*`), Quick Actions (`.dashhub-qa*`), Summary
  Cards (`.dashhub-summary*`), Dashboard Grid
  (`#dashboardHubGrid`/`.dashhub-cat*`/`.dashhub-feature*`), Pinned
  Widgets (`#dashboardHubPinnedWrap`) — 0 baris berubah, tetap tampil &
  berfungsi seperti Tahap 2/3/5/6.
- `dashboard-hub-registry.js` (`FEATURE_REGISTRY`) — 0 baris berubah.
- Bottom Navigation, AI, Statistik, Widget Drag & Drop, Search — di luar
  cakupan Tahap 7, tidak disentuh.
- `FEATURE_REGISTRY`, ADR-001, business logic, routing, database.
- `app-bundle-a.min.js`, `app-bundle-b.min.js`, `sw.js`,
  `docs/FILE-MAP.md`, versi aplikasi, `package.json`.
- `scripts/build.js` — **tidak dijalankan** (sesuai instruksi, validasi
  cukup `node --test`). Catatan: karena build tidak dijalankan, bundle
  yang benar-benar dimuat browser (`app-bundle-b.min.js`) belum memuat
  `DashboardHubAnalytics` — sama seperti catatan Tahap 5 untuk
  `DashboardHubSummary`.

## Hasil test

```
node --test
# tests 1270
# pass 1270
# fail 0
```

(Baseline Tahap 6 terverifikasi ulang di lingkungan ini: 1263/1263 PASS.
7 test baru ditambahkan murni aditif, 0 test lama gagal/dihapus.)
