# Dashboard V2 — Tahap V2.2 (Header V2 & Hero V2)

Baseline: `node --test` 1414/1414 PASS (akhir Tahap V2.1).
Hasil tahap ini: `node --test` **1426/1426 PASS** (+12 test baru, 0 regresi).

Referensi: instruksi sesi ini (Sprint 3 — Dashboard V2 Tahap V2.2).
Tidak mengulang audit V2.1; hanya melengkapi isi 2 placeholder yang sudah
ada (Header, Main Content Container) di `dashboard-v2-shell.js`.

## Yang ditambahkan

Struktur top-level V2.1 **tidak berubah** — tetap 5 komponen di dalam
`#dashboardV2Root` (sidebar/header/main/bottomnav/fab). Perubahan hanya
mengisi *konten* Header dan Main:

### Header V2 (4 sub-placeholder, anak `#dashboardV2Header`)

| Bagian | Elemen | id | Catatan |
|---|---|---|---|
| Greeting | `<div>` | `dashboardV2HeaderGreeting` | teks statis "Halo (placeholder)" |
| Search | `<button disabled>` | `dashboardV2HeaderSearch` | `aria-label`, tidak interaktif |
| Notification | `<button disabled>` | `dashboardV2HeaderNotification` | `aria-label`, tidak interaktif |
| Avatar | `<div role="img">` | `dashboardV2HeaderAvatar` | `aria-label`, placeholder visual |

`<header>` diberi `role="banner"` + `aria-label`.

### Hero V2 (4 sub-placeholder, anak `#dashboardV2Main`)

Dirender **di dalam Main Content Container** (bukan komponen top-level
baru) — konsisten dgn RFC "Dashboard V2 = evolusi Hero Dashboard
existing".

| Bagian | Elemen | id | Catatan |
|---|---|---|---|
| Welcome title | `<h2>` | `dashboardV2HeroTitle` | "Selamat datang (placeholder)" |
| Health Score | `<div>` | `dashboardV2HeroHealthScore` | teks statis, `aria-label` |
| Balance | `<div>` | `dashboardV2HeroBalance` | teks statis, `aria-label` |
| Insight | `<div>` | `dashboardV2HeroInsight` | teks statis, `aria-label` |

`<section>` Hero diberi `role="region"` + `aria-labelledby="dashboardV2HeroTitle"`.

Semua nilai (skor/saldo/insight) **statis placeholder** — tidak ada satu
pun yang membaca `D.profile`/`D.transactions`/`DashboardHubHero` atau
sumber data nyata lain.

## Constraint yang dijaga (diverifikasi test)

- **Tidak ada perubahan API/struktur top-level V2.1** — `init()`/
  `render()`/`destroy()` tidak berubah signature; root tetap 5 children.
- **`replaceChildren()`** dipakai di semua level (header, hero, main) —
  **tidak ada `innerHTML`** sama sekali (diverifikasi test regex).
- **Tidak terhubung** ke `FEATURE_REGISTRY`, Dashboard Hub existing
  (`DashboardHubHero`, `D.profile`, `D.transactions`), business logic,
  routing (`showPage()`), maupun **AI Command Center**
  (`AICommandCenter`) — diverifikasi test cek kode aktif (bukan komentar).
- **Dashboard existing tidak berubah** — `dashboard-hub.js`, `index.html`,
  `app_production.html` tetap 0 tersentuh (Header/Hero V2 tetap
  self-mounting via JS, sama seperti V2.1).
- **Tetap dormant** — root tetap `hidden` +
  `data-dashboard-v2-state="dormant"` setelah `render()`.
- **Aksesibilitas**: `role="banner"` (header), `role="img"` (avatar),
  `role="region"` + `aria-labelledby` (hero), `aria-label` pada
  tombol/placeholder non-teks.
- **Design token 100% reuse** — CSS baru (`styles.css`) hanya memakai
  token existing (`--sp-*`, `--r-pill`, `--r-full`, `--r-xl`, `--fs-*`,
  `--text`/`--text2`, `--surface2`, `--accent-soft`), tidak ada token baru.

## Test

`tests/dashboard-v2-hero.test.js` — 12 test baru:

1. Header V2 dirender dgn 4 sub-placeholder (role, disabled, aria-label).
2. Hero V2 dirender di dalam Main Content Container (root tetap 5 anak).
3. Placeholder welcome title ada.
4. Placeholder Health Score ada.
5. Placeholder Balance ada.
6. Placeholder Insight ada.
7. `render()` tetap idempotent setelah penambahan (tidak menumpuk).
8. Dashboard V2 tetap dormant setelah `render()`.
9. Regresi: tidak terhubung `FEATURE_REGISTRY`/`showPage()`/
   `AICommandCenter`/`D.profile`/`D.transactions`/`DashboardHubHero`,
   tidak ada `innerHTML`.
10. Regresi: `dashboard-hub.js` tidak berubah/tidak direferensikan.
11–12. Regresi: `index.html` & `app_production.html` tetap 0 markup
    Dashboard V2.

`tests/dashboard-v2-shell.test.js` (V2.1, 15 test) tetap **tidak diubah**
dan tetap 100% lulus — dijalankan ulang sbg bukti tidak ada regresi.

## Build

Tidak ada file baru yang perlu didaftarkan ke `scripts/build.js`
(`dashboard-v2-shell.js` sudah terdaftar sejak V2.1; hanya isinya yang
bertambah). File test tidak ikut proses build.

## Status

V2.2 (Header V2 + Hero V2) **selesai**, tetap dormant, tidak wired.
V2.2.2+/V2.3 (wire-up sungguhan: sumber data nyata, interaksi
search/notification, integrasi FEATURE_REGISTRY, migrasi elemen
dashhub-* existing ke Main Content Container) tetap di luar scope,
butuh mandat eksplisit terpisah.
