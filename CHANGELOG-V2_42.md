# Changelog — V2.42 (Production Validation Dashboard V2)

Basis: `Nexus-V6-DashboardV2-V2_41-QA.zip` (satu-satunya ZIP yang
diunggah user, dipakai sebagai single source of truth), diperiksa di
atas state hasil QA V2.41 (lihat `CHANGELOG-QA.md`). Tidak ada
JS/HTML/test/build script yang diubah — scope perubahan turun ke
`styles.css` saja.

Metode: **render browser sungguhan** (Chromium headless via Playwright),
bukan cuma audit statis. Dashboard V2 di-mount nyata di
`app_production.html` (`window.enableDashboardV2()` →
`DashboardV2Shell.init()` → `.render()`), lalu diperiksa di 11 lebar
layar (320/360/375/390/414/768/820/1024/1280/1440/1920px): screenshot,
pengukuran `getBoundingClientRect()` sebelum & sesudah scroll, deteksi
overflow horizontal otomatis (`scrollWidth > clientWidth` di seluruh
elemen `.dashboard-v2-root *`). Semua temuan di bawah diverifikasi
lewat browser sungguhan, bukan cuma dihitung manual.

## Hasil pemeriksaan

### 1 bug Critical ditemukan & dipatch: navigasi/header V2 tidak
pernah benar-benar "persisten" — ikut hilang saat discroll

**Root cause:** `.dashboard-v2-root` adalah satu-satunya scroll
container Dashboard V2 (`overflow-y:auto`, dipasang sejak sebelum
V2.41). Sidebar, Header, dan Bottom Nav V2 semuanya cuma **sibling
biasa** dari Main (13 section builder, tinggi total ±5500-5800px jauh
melebihi tinggi viewport manapun) di dalam container itu — tidak satu
pun diberi `position:sticky`/`fixed`. Akibatnya begitu user scroll
menjauhi posisi awal:

- **Header V2** (search/notification/avatar) hilang total dari layar
  di SEMUA lebar layar (dikonfirmasi lewat browser: `top:-5122px` di
  375px, `top:-4691px` di 1440px setelah scroll ke bawah).
- **Sidebar** (desktop, `>=1024px`) — box latar belakangnya memang
  tetap ada (karena stretch memenuhi seluruh tinggi grid area), TAPI 5
  item navigasi di dalamnya ikut tergulung ke atas bersama scroll,
  jadi secara fungsional tidak terlihat/tidak bisa diklik saat user
  sudah scroll (dikonfirmasi: box `top:-4691px` setelah scroll ke
  bawah — item nav ada di ujung atas box itu, jauh di luar viewport).
- **Bottom Navigation V2** (mobile, `<1024px`) — V2.41 (Critical #1)
  berhasil membuatnya AKHIRNYA tampil (`display:flex`), tapi karena
  posisinya statis & terletak SETELAH Main di DOM, ia baru kelihatan
  setelah user scroll sampai PALING BAWAH konten — bukan navigasi
  persisten seperti namanya, beda dgn `.nav` lama di app yang sudah
  sengaja `position:fixed;bottom:0` untuk tujuan yang sama.

Ini masuk kategori QA yang diminta: **sticky/fixed conflict** (chrome
navigasi seharusnya tetap di tempat, bukan ikut scroll dengan konten).

**Fix (murni additive, reuse pola & token yang sudah ada di file yang
sama — tidak ada token baru):**

- `.dashboard-v2-header` → `position:sticky; top:0; z-index:var(--z-chrome);`
  — reuse PERSIS pola `.header` lama (baris atas file ini, sudah
  `position:sticky;top:0;z-index:var(--z-chrome)` untuk keperluan
  identik).
- `.dashboard-v2-sidebar` (di dalam `@media (min-width:1024px)` yang
  sudah ada dari V2.41) → `position:sticky; top:0; align-self:start;`
  — `align-self:start` WAJIB disertakan: tanpa ini, sticky tidak
  berefek sama sekali karena grid item di-stretch memenuhi seluruh
  tinggi area gridnya (dikonfirmasi lewat pengetesan browser
  sungguhan sebelum properti ini ditambahkan — `top:0` saja terbukti
  tidak cukup, box masih ikut scroll penuh 100%).
- `.dashboard-v2-bottomnav` (di dalam `@media (max-width:1023px)` yang
  sudah ada dari V2.41) → `position:sticky; bottom:0; z-index:var(--z-chrome);`
  — sengaja `sticky` bukan `fixed` supaya tidak perlu
  `left`/`right`/`width` baru (kolom `.dashboard-v2-root` sudah 100%
  lebar layar di breakpoint ini).

**Verifikasi post-fix (browser sungguhan, scroll ke titik terjauh di
setiap lebar layar):**

| Elemen | Lebar | Sebelum patch | Sesudah patch |
|---|---|---|---|
| Header | 375px | `top:-5122px` (hilang) | `top:0px` (menempel) |
| Header | 1440px | `top:-4691px` (hilang) | `top:0px` (menempel) |
| Sidebar | 1440px | box `top:-4691px`, tinggi 5577px (item nav ikut tergulung) | `top:0px`, tinggi natural 213px (item nav tetap terlihat) |
| Bottom Nav | 375px | hanya terlihat di scroll paling bawah | tetap menempel `bottom` di semua posisi scroll |

### 2. Layout desktop & mobile — tidak ada temuan baru

Diverifikasi ULANG lewat render browser sungguhan (bukan cuma
perhitungan manual seperti V2.41) di 11 lebar layar
(320/360/375/390/414/768/820/1024/1280/1440/1920px):

- **Overflow horizontal**: **0** ditemukan di seluruh 11 breakpoint
  (`document.scrollWidth`, `.dashboard-v2-root.scrollWidth`, dan
  bounding-box tiap elemen `.dashboard-v2-root *` diperiksa otomatis —
  tidak ada satupun elemen yang keluar dari viewport).
- **Card pecah / grid rusak**: tidak ditemukan di lebar manapun
  (screenshot 320px–1920px diperiksa visual, grid 2 kolom tetap utuh).
- **Sidebar (Critical-2 V2.41)**: dikonfirmasi ULANG masih bekerja
  benar setelah patch V2.42 — grid 2 kolom (Sidebar 240px | konten)
  aktif persis `>=1024px`, tidak numpuk dgn Header/Main.
- **Bottom Nav (Critical-1 V2.41)**: dikonfirmasi ULANG masih tampil
  benar `<1024px` setelah patch V2.42 (sekarang + sticky, lihat di
  atas).

### 3. Interaction (hover/focus-visible/disabled/pointer/cursor/keyboard)

Tidak diubah & tidak ditemukan regresi — patch V2.42 hanya menambah
`position`/`top`/`bottom`/`z-index`/`align-self`, tidak menyentuh
`opacity`, `cursor`, `pointer-events`, atau `:focus-visible` yang sudah
diverifikasi OK di V2.41.

### 4. CSS Audit (setelah patch V2.42)

| Metrik | Hasil |
|---|---|
| Total selector `dashboard-v2-*` di CSS | 76 |
| Total class `dashboard-v2-*` dipakai JS | 76 |
| Orphan selector | **0** |
| Unused selector | **0** |
| Duplicate selector baru dari V2.42 | **0** (3 properti baru ditambahkan ke DALAM rule/`@media` block yang SUDAH ADA — `.dashboard-v2-header`, `.dashboard-v2-sidebar`, `.dashboard-v2-bottomnav` — jumlah occurrence selector-selector ini di file SAMA PERSIS sebelum & sesudah patch, diverifikasi via `grep -c`) |
| Duplicate selector pra-eksisting (tidak disentuh) | 1 — `.dashboard-v2-header` (sama seperti V2.41, properti tidak tumpang tindih) |
| Token/nilai baru | **0** — seluruh patch reuse `var(--z-chrome)` (token yang sama persis dipakai `.header`/`.nav` lama di file ini) + keyword CSS standar (`sticky`/`start`), tidak ada literal px/warna baru |
| Brace balance (`{`/`}`) | Seimbang — diverifikasi parser sadar-komentar, delta dari patch = 0 |

## Ringkasan temuan

**Critical:** 1 (dipatch — Header/Sidebar/Bottom Nav V2 bukan navigasi
persisten, ikut hilang saat scroll karena `.dashboard-v2-root` adalah
satu-satunya scroll container tanpa elemen `sticky`/`fixed`)
**Major:** 0 baru (3 item Major dari V2.41 — grid tetap 2 kolom,
heading hierarchy tunggal, kontras `--text2` — masih belum dipatch,
masih di luar cakupan "patch minimum" CSS-only, lihat `CHANGELOG-QA.md`)
**Minor:** 0 baru (2 item Minor dari V2.41 tetap belum dipatch, lihat
`CHANGELOG-QA.md`)

## File yang berubah

- `styles.css` (satu-satunya file yang dipatch)
- `CHANGELOG-V2_42.md` (baru, file ini)

Tidak ada file JS, HTML, test, atau build script yang diubah.

## Statistik patch V2.42 (di atas state V2.41)

- Baris ditambahkan: **59**
- Baris dihapus: **1** (baris lama diganti dgn versi + properti baru
  di 3 rule/blok yang sama; lihat diff — bukan penghapusan rule/fungsi)
- Rule lama yang dihapus: **0**
- Selector baru: **0** (properti ditambahkan ke dalam selector yang
  sudah ada)
- Token/nilai baru: **0**

## Hasil audit akhir

- Orphan class: **0**
- Unused selector: **0**
- Duplicate selector baru: **0**
- Coverage class: **100%** (76/76)
- Overflow horizontal (11 breakpoint, browser sungguhan): **0**
- Sticky/fixed conflict: **0 tersisa** (1 ditemukan lewat browser
  sungguhan, 1 diperbaiki & diverifikasi ulang lewat browser sungguhan)
