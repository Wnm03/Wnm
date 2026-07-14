# Dashboard V2 — Overlay/Tumpang-Tindih Fix (post V2.31)

## Bug

Saat Dashboard V2 diaktifkan (toggle "Dashboard V2 aktif" di Dashboard
Hub), tampilan jadi rusak: teks Hero lama ("Halo, W", tanggal, saldo,
dst.) dan teks Hero V2 (`Selamat datang (placeholder)`, `Skor Hidup
Seimbang: -- (placeholder)`, dst.) tumpang tindih di posisi layar yang
sama, membuat semuanya tidak terbaca. Direkam di screen recording
(12:29, 14 Juli 2026).

## Akar masalah

`DashboardV2Shell.init()` (`dashboard-v2-shell.js`) meng-append root
container (`#dashboardV2Root`) langsung ke `<body>`, di luar `#scrollRoot`
— ini memang disengaja (lihat komentar V2.1: "0 baris index.html/
app_production.html tersentuh"). Tapi `#scrollRoot` (pembungkus seluruh
UI app yang sudah ada) dipasang `position:fixed;inset:0`, yang berarti ia
LEPAS dari alur dokumen normal. Akibatnya `<body>` kehilangan tinggi dari
`#scrollRoot`, dan `#dashboardV2Root` — yang sebelumnya cuma
`display:block` (alur dokumen normal, `position:static`) — ikut mulai
digambar dari titik (0,0) juga. Dua layer penuh-layar berakhir digambar
di titik yang sama → tumpang tindih.

## Fix

CSS-only, di `styles.css`, rule `.dashboard-v2-root:not([hidden])`:
tambah `position:fixed;inset:0;z-index:var(--z-onboard);overflow-y:auto;
background:var(--bg)` — pola yang sama persis dengan layer penuh-layar
lain yang sudah ada di app ini (`.onboard`, `.pin-screen`, `#scrollRoot`).
Saat aktif, Dashboard V2 sekarang jadi layer penuh-layar sendiri yang
benar-benar MENGGANTIKAN tampilan lama secara visual, bukan numpuk di
atasnya.

Tidak ada baris JS yang diubah (`dashboard-v2-shell.js`,
`dashboard-hub.js`, `dashboard-v2-activation.js`, `dashboard-v2-data-
adapter.js` — 0 byte tersentuh). Atribut `hidden` yang sudah dikelola
shell tetap satu-satunya sumber kebenaran show/hide; fix ini murni
mengubah BAGAIMANA elemen itu digambar saat `hidden` dilepas, bukan
KAPAN.

## Verifikasi

- `node --test tests/**/*.test.js` — 1876/1876 PASS (0 regresi).
- Reproduksi manual via headless browser (Playwright): sebelum fix,
  `#dashboardV2Root` computed `position: static`, `height: 1930px`
  (tinggi konten, bukan viewport) mulai dari `(0,0)` — tumpang tindih
  dengan `#scrollRoot` yang juga mulai dari `(0,0)`. Sesudah fix,
  `#dashboardV2Root` computed `position: fixed`, `390×844` (persis
  ukuran viewport), `z-index: 950` — layer bersih di atas UI lama, tidak
  ada lagi tumpang tindih teks.
- `scripts/bump-version.sh` dijalankan (259 → 260) supaya
  `styles.css?v=260` tidak ke-cache versi lama oleh service worker.

## File yang berubah

- `styles.css` — 1 rule diperluas (`.dashboard-v2-root:not([hidden])`).
- `index.html`, `app_production.html` — `?v=` dinaikkan ke 260 (semua
  referensi, otomatis lewat `bump-version.sh`).
- `sw.js` — `CACHE_NAME` dinaikkan ke `kw-cache-v260`.

Tidak ada file `.js` bisnis logic yang disentuh.
