# Changelog — V2.41 (Final QA Dashboard V2)

Basis: `Nexus-V6-DashboardV2-V2_39-FINAL.zip` (satu-satunya ZIP yang
diunggah user, dipakai sebagai single source of truth), diperiksa di
atas state hasil merge V2.40 (lihat `CHANGELOG-V2_40.md`). Tidak ada
JS/HTML/test/build script/struktur proyek yang diubah — scope perubahan
turun ke `styles.css` saja.

Metode: audit statis (pembacaan kode CSS+JS builder satu per satu,
perhitungan lebar grid/kartu per breakpoint, perhitungan rasio kontras
warna per tema) — bukan render browser sungguhan (tidak tersedia di
lingkungan ini). Semua temuan di bawah dapat diverifikasi ulang lewat
kode yang dikutip di masing-masing poin.

## Hasil pemeriksaan

### 1. Layout — 2 temuan Critical

**[CRITICAL-1] Sidebar tidak benar-benar jadi kolom samping di desktop.**
`.dashboard-v2-root:not([hidden])` sebelum patch ini `display:block`
(block flow murni) di SEMUA lebar layar — tidak pernah diubah jadi
flex/grid. Begitu `.dashboard-v2-sidebar` berubah `display:block` di
`>=1024px` (aturan lama, tidak diubah), Sidebar (anak DOM pertama root)
ikut aturan block flow biasa: melebar 1 baris penuh lalu numpuk DI ATAS
Header & Main, bukan jadi kolom di samping konten. Dampak: di desktop,
Dashboard V2 tampil sbg tumpukan vertikal (Sidebar selebar layar, lalu
Header, lalu Main) — bukan layout sidebar+konten yang dimaksud.
**Fix:** tambah `@media (min-width:1024px)` baru yang mengubah root jadi
`display:grid` 2 kolom (Sidebar | konten), Header & Main ditaruh
eksplisit di kolom ke-2. Breakpoint disamakan persis dgn breakpoint
Sidebar yang sudah ada supaya kedua aturan selalu sinkron. Base rule
lama (`display:block` dst di root, `display:none`/`display:block` di
Sidebar) TIDAK diubah/dihapus — override murni tambahan, hanya aktif
`>=1024px`, perilaku mobile (`<1024px`) sama sekali tidak berubah.

**[CRITICAL-2] Bottom Navigation V2 tidak pernah tampil di lebar layar
manapun.** `.dashboard-v2-bottomnav` sebelum patch ini `display:none`
tanpa media query apapun yang pernah membalikkannya (beda dgn Sidebar
yang punya override `min-width:1024px`). Dampak: di `<1024px` (dimana
Sidebar sengaja `display:none` — desktop-only by design, lihat
`DASHBOARD-V2-SHELL.md`), TIDAK ADA navigasi Dashboard V2 yang terlihat
sama sekali. **Fix:** tambah `@media (max-width:1023px)` baru yang
mengubah Bottom Nav jadi `display:flex` (+ `align-items:center` +
`justify-content:space-around` utk distribusi item) — breakpoint pasangan
simetris dari breakpoint Sidebar (`>=1024px` Sidebar aktif & Bottom Nav
tetap `none`; `<1024px` Bottom Nav aktif & Sidebar tetap `none`). Base
rule `display:none` lama TIDAK diubah/dihapus.

### 2. Responsive — diperiksa di 320 / 375 / 768 / 1024 / >=1440px

- Tidak ditemukan card pecah, grid rusak, atau scrollbar horizontal baru
  di breakpoint manapun setelah 2 fix Critical di atas (diverifikasi
  lewat perhitungan lebar: container `.dashboard-v2-main` di 320px
  menyisakan ±292px konten, kartu grid 2-kolom ±142px/kartu, ±118px area
  teks/kartu — sempit tapi teks membungkus normal, tidak ada kata
  tak-terputus yang lebih lebar dari itu di placeholder text manapun).
- Tombol tidak ada yang terpotong — semua tombol placeholder pakai
  `box-sizing` default block/inline-block dgn padding token, tidak ada
  `width`/`max-width` tetap yang memaksa isi terpotong.
- **[MAJOR]** 7 grid kartu (`Summary Cards`, `Module Grid`, `Statistics
  Panel`, `Upcoming Tasks`, `Notifications`, `Health Score` metric grid,
  `Predictive Insights`) tetap `repeat(2, 1fr)` di SEMUA lebar layar
  (tidak ada breakpoint `>=768px`/`>=1024px` yang menambah kolom). Ini
  beda dgn pola responsive yang sudah dipakai bagian LAIN aplikasi (mis.
  `.dashhub-summary-grid` 2->4 kolom di `>=1024px`, `.dashhub-qa-row`
  5->3 kolom di `<600px`). Bukan bug yang "merusak" tampilan (tidak ada
  overflow/pecah), tapi ruang layar besar (>=1024px, terlebih setelah
  Sidebar aktif menyisakan kolom konten lebih sempit) kurang optimal
  dipakai. **Tidak dipatch** di V2.41 — mengubah 7 grid sekaligus dgn
  breakpoint baru di luar cakupan "patch minimum" utk masalah yang bukan
  defect fungsional; direkomendasikan jadi item terpisah kalau
  diinginkan.
- **[MINOR]** `.dashboard-v2-header-greeting` (`flex:1`) tidak diberi
  `min-width:0`. Kalau nama profil yang ditampilkan sangat panjang &
  tidak ada spasi (mis. username tanpa spasi), secara teori bisa memaksa
  Header sedikit melebar di layar sempit (kasus tepi, belum terverifikasi
  terjadi dgn data placeholder saat ini). Tidak dipatch (cakupan sangat
  kecil, butuh data nyata utk konfirmasi, risiko rendah).

### 3. Accessibility

- **focus-visible**: sudah tercakup GLOBAL (`:focus-visible{outline:2px
  solid var(--accent);...}` di luar namespace `dashboard-v2-*`, berlaku
  ke semua elemen fokus-able termasuk seluruh tombol/kartu-interaktif/
  input Dashboard V2 secara otomatis). ✅ Tidak perlu patch tambahan.
- **Keyboard navigation**: 3 dari 6 Module Grid card yang interaktif
  (Finance/Vehicle/Settings, Tahap V2.30) sudah punya `tabindex="0"` +
  `role="button"` di JS — sudah bisa difokus keyboard, sudah kena
  `:focus-visible` global di atas. ✅
- **Disabled state**: seluruh tombol placeholder (Quick Actions, Sidebar
  item, Bottom Nav item, kartu-kartu berbentuk `<button disabled>`) sudah
  diberi `opacity:.5` di rule class masing-masing — pola sama dgn Header
  V2 search/notification button yang sudah ada sebelumnya. ✅
- **ARIA**: seluruh elemen builder JS sudah diberi `aria-label` sesuai
  konteks (termasuk pembeda "(placeholder, belum aktif)" utk elemen yg
  belum benar-benar fungsional) — ini di JS, tidak disentuh sesuai
  batasan tugas. ✅ (diverifikasi baca, bukan diubah)
- **[MAJOR — di luar cakupan CSS]** Heading hierarchy: hanya ada SATU
  elemen heading (`<h2>` di Hero title) di seluruh Dashboard V2 — tidak
  ada `<h1>`, tidak ada `<h3>`-`<h6>` utk sub-section (Summary Cards,
  Module Grid, Statistics Panel, dst semua pakai `<section>`/`<div>`
  tanpa heading). Ini murni struktur HTML/JS (`dashboard-v2-shell.js`),
  **tidak bisa diperbaiki lewat `styles.css`** & di luar izin tugas ini
  (dilarang mengubah JS). Dilaporkan sbg temuan, tidak dipatch.
- **[MAJOR — di luar cakupan patch minimum]** Kontras warna: token
  `--text2` gagal WCAG AA (rasio <4.5:1) terhadap `--surface2`/`--bg`/
  `--surface` di beberapa tema (`stone`, `mono`, `sand`, `sage`, dan
  `slate` utk pasangan tertentu) — dihitung manual (relative luminance
  WCAG). `--text2` dipakai luas di HAMPIR SELURUH teks sekunder
  Dashboard V2 (title, trend, timestamp, description, dll di 9 dari 17
  builder) sesuai token existing yang wajib dipakai. **Tidak dipatch**:
  ini masalah nilai TOKEN itu sendiri (didefinisikan di `:root`/
  `[data-theme]`, dipakai ratusan kali di luar Dashboard V2 juga) —
  memperbaikinya berarti mengubah warna di seluruh aplikasi, jauh di
  luar "patch minimum" & berisiko regresi visual besar di luar scope
  Dashboard V2. Direkomendasikan jadi audit desain-token terpisah.

### 4. CSS Audit

| Metrik | Hasil |
|---|---|
| Total builder Dashboard V2 | 17 (`_build*`) + 2 blok inline (root, fab) |
| Total class `dashboard-v2-*` dipakai JS | 76 |
| Total selector `dashboard-v2-*` di CSS | 76 |
| Orphan class | **0** |
| Unused selector | **0** |
| Duplicate selector baru dari V2.41 | **0** (2 rule baru yg ditambahkan bertarget selector yang sudah ada tapi DI DALAM `@media` baru — bukan duplikat, melainkan override responsive yang scoped, pola sama dgn `.dashboard-v2-sidebar` yang sudah ada sejak V2.39) |
| Duplicate selector pra-eksisting (tidak disentuh) | 1 — `.dashboard-v2-header` (base rule di 2 tempat terpisah, properti TIDAK tumpang-tindih jadi tidak menyebabkan bug visual — sudah ada sejak sebelum V2.40, murni catatan kerapian kode, bukan defect) |
| Specificity conflict | 0 ditemukan (seluruh selector `dashboard-v2-*` single-class kecuali `.dashboard-v2-module-card[role="button"]` yang sengaja lebih spesifik utk 1 properti tambahan `cursor:pointer`, tidak bentrok) |
| Hardcoded value baru dari V2.41 | 1 — `240px` (lebar kolom Sidebar di grid desktop). Belum ada preseden lebar sidebar di file ini utk direuse (aplikasi lain 100% mobile bottom-nav, dikonfirmasi lewat `DASHBOARD-V2-SHELL.md`), konsisten dgn pola ukuran non-token lain yang sudah ada di file ini (mis. `.dashboard-v2-health-score-circle width:96px`, `.dashboard-v2-ai-action-card flex:1 1 140px`) — bukan token warna/spasi/radius baru. |
| Token tidak konsisten | 0 ditemukan dalam scope `dashboard-v2-*` — seluruh selector `-icon` konsisten pakai `--fs-icon-lg`; kartu top-level (Summary/Module/Statistics/Upcoming/Notification/Predictive/Automation) konsisten pakai `--surface2`+`--r-xl`; kartu BERSARANG di dalam kartu lain (Health Metric di dalam Health Score, AI Action di dalam AI Command Center) konsisten pakai `--surface3`+`--r-md` — pola "nested card 1 level lebih dalam" yang disengaja, BUKAN inkonsistensi. |

### 5. Visual Consistency (17 builder)

Sidebar, Header, Hero, Summary Cards, Quick Actions, Module Grid, Insight
Panel, Recent Activity, Statistics, Upcoming Tasks, Notifications, AI
Command Center, Health Score, Predictive Insights, Automation Center,
Bottom Navigation, FAB — seluruhnya diperiksa. Bahasa visual konsisten:
kartu top-level pakai `--surface2`/`--r-xl`/`padding:var(--sp-5)`, kartu
bersarang pakai `--surface3`/`--r-md` (lihat tabel Token di atas), warna
teks primer/sekunder konsisten `--text`/`--text2`, spacing antar-section
konsisten `margin-top:var(--sp-6)`. Tidak ada builder yang menyimpang
dari pola ini. Satu-satunya gap adalah [MAJOR] grid 2-kolom tetap di
semua lebar layar (lihat bagian Responsive di atas) — bukan soal bahasa
visual, soal pemanfaatan ruang.

## Ringkasan temuan

**Critical:** 2 (keduanya dipatch — Sidebar layout desktop, Bottom Nav
tidak pernah tampil)
**Major:** 3 (tidak dipatch — grid tetap 2 kolom di semua lebar,
heading hierarchy tunggal, kontras `--text2` di beberapa tema; ketiganya
di luar cakupan "patch minimum" krn butuh perubahan struktur/token
lebih luas — didokumentasikan sbg rekomendasi follow-up)
**Minor:** 2 (tidak dipatch — kepadatan kartu di 320px, `header-greeting`
tanpa `min-width:0`)

Dashboard V2 **TIDAK** dinyatakan "QA PASS tanpa syarat" — 2 temuan
Critical yang berdampak langsung ke kegunaan (navigasi hilang total di
mobile, layout Sidebar rusak di desktop) sudah diperbaiki lewat patch
minimum di `styles.css`. Temuan Major/Minor sisanya bersifat
peningkatan/di luar cakupan CSS-only, tidak memblokir penggunaan.

## File yang berubah

- `styles.css` (satu-satunya file yang dipatch)

Tidak ada file JS, HTML, test, atau build script yang diubah —
diverifikasi lewat `diff -rq` menyeluruh terhadap
`Nexus-V6-DashboardV2-V2_39-FINAL.zip` asli: hanya `styles.css`
(dimodifikasi) dan `CHANGELOG-V2_40.md` + `CHANGELOG-QA.md` (file baru)
yang berbeda.

## Statistik patch V2.41 (di atas state V2.40)

- Baris ditambahkan: **60**
- Baris dihapus: **0**
- Rule lama yang diubah/dihapus: **0** (2 blok `@media` baru murni
  ditambahkan, base rule `.dashboard-v2-root`, `.dashboard-v2-sidebar`,
  `.dashboard-v2-bottomnav` tetap seperti semula)

## Hasil audit akhir

- Orphan class: **0**
- Unused selector: **0**
- Duplicate selector baru: **0**
- Coverage class: **100%** (76/76)
- Coverage builder: **100%** (17/17)
- Critical layout defect: **0 tersisa** (2 ditemukan, 2 diperbaiki)
