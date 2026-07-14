# Changelog — Insight Panel & Recent Activity

Basis: `Nexus-V6-DashboardV2-V2_32-Hero-Fix.zip` (satu-satunya ZIP yang
tersedia di chat ini, dipakai sebagai single source of truth). Patch
tahap-tahap lain yang pernah dibahas di sesi lain TIDAK ada di ZIP basis
ini, sehingga dianggap belum pernah diterapkan dan tidak ditambahkan
ulang di sini — scope tahap ini murni 2 builder yang diminta.

## Ringkasan pekerjaan
Dua builder dikerjakan bersama karena strukturnya identik (didokumentasikan
di kode sumber sebagai pola yang sama persis):

- `_buildInsightPanel()`: 1 `<section class="dashboard-v2-insight-panel">`
  + 3 `<div class="dashboard-v2-insight-item">` (statis, tanpa integrasi
  data adapter).
- `_buildRecentActivity()`: 1 `<section class="dashboard-v2-recent-activity">`
  + 9 `<div class="dashboard-v2-recent-activity-item">` (5 baris lama +
  4 elemen data V2.21, semua berbagi 1 class yang sama).

Kedua pasang class sebelumnya 100% orphan (0 rule CSS). Ditambahkan gaya
kartu untuk masing-masing container + gaya baris teks untuk item, dengan
separator antar item via adjacent-sibling combinator (tanpa class baru).

## File yang berubah
- `styles.css` — SATU-SATUNYA file yang diubah.

## Statistik
- Baris ditambahkan: 44
- Baris dihapus: 0
- Baris existing diubah: 0
- Sifat perubahan: 100% additive, ditambahkan di akhir file.

## Selector CSS yang ditambahkan
1. `.dashboard-v2-insight-panel`
2. `.dashboard-v2-insight-item`
3. `.dashboard-v2-insight-item + .dashboard-v2-insight-item`
4. `.dashboard-v2-recent-activity`
5. `.dashboard-v2-recent-activity-item`
6. `.dashboard-v2-recent-activity-item + .dashboard-v2-recent-activity-item`

## Token dipakai ulang (tidak ada token baru)
`--sp-2/--sp-5/--sp-6`, `--r-xl`, `--fs-body`, `--surface2`, `--border`,
`--text2`.

## Konfirmasi file lain
`diff -rq` terhadap ekstraksi ZIP basis:
- Seluruh file JavaScript (`dashboard-v2-shell.js`,
  `dashboard-v2-data-adapter.js`, `dashboard-v2-activation.js`,
  `dashboard-hub.js`, dst.): **tidak berubah**
- `index.html`, `app_production.html`: **tidak berubah**
- Seluruh isi folder `tests/`: **tidak berubah**
- `scripts/build.js`, service worker, dan file lain: **tidak berubah**
- Hanya `styles.css` yang berbeda.

## Scope builder
Komponen yang dikerjakan tahap ini: `_buildInsightPanel()` dan
`_buildRecentActivity()` saja. Builder lain (Hero, Summary Cards, Quick
Actions, Module Grid, Statistics Panel, dst.) tidak disentuh sama sekali.
