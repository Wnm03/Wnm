// dashboard-v2-shell.js — Tahap V2.1: Dashboard V2 Layout Foundation
// (lihat DASHBOARD-V2-MIGRATION-RFC.md §4 "Tahap V2.1 — Layout Foundation").
//
// SCOPE (persis sesuai RFC, BLOCKER "Shell V2.1 belum ada" dianggap selesai
// sesi ini): scaffold 5 komponen layout sbg render-stub DORMANT — Sidebar,
// Header V2, Main Content Container, Bottom Navigation V2, FAB V2. Semua
// PLACEHOLDER MURNI:
//   - Tidak ada business logic (tidak ada aksi yg melakukan apa pun).
//   - Tidak ada routing (tidak memanggil/menggantikan showPage()).
//   - Tidak ada integrasi FEATURE_REGISTRY (tidak dibaca, tidak ditulis).
//   - Tidak menggantikan Dashboard Hub existing (#page-dashboard-hub,
//     dashboard-hub.js tidak disentuh sama sekali).
//   - Tidak menyentuh Finance/Vehicle/Reports/Shop maupun Hero Dashboard.
//
// KENAPA ROOT CONTAINER DI-MOUNT LEWAT JS (bukan markup baru di index.html/
// app_production.html seperti proyeksi awal RFC §6):
//   Supaya implementasi V2.1 ini 100% self-contained di satu file JS — 0
//   baris index.html/app_production.html tersentuh sama sekali, memperkecil
//   risiko dibanding menambah markup dormant di HTML. Container dibuat lewat
//   document.createElement, ditandai `hidden` + `data-dashboard-v2-state=
//   "dormant"`, dan (default) di-append ke <body> — tidak pernah terlihat,
//   tidak diletakkan di dalam #page-dashboard-hub atau halaman manapun,
//   sama sekali tidak bersinggungan dgn #mainNav/.nav-item/showPage()/
//   #scrollRoot/FEATURE_REGISTRY.
//
// KENAPA TIDAK ADA EVENT DELEGATION:
//   Tahap ini tidak py aksi nyata apa pun (FAB placeholder-nya bahkan
//   `disabled`) — delegation baru relevan begitu ada handler sungguhan di
//   tahap wiring terpisah (V2.2+). Menambahkannya sekarang cuma jadi
//   "logic" tersembunyi yang melanggar constraint sesi ini.
//
// API: init() / render() / destroy() — dipanggil terpisah/berurutan, semua
// idempotent (aman dipanggil berkali-kali tanpa efek samping berlipat),
// pola sama dgn modul render lain di repo ini (mis. DashboardHubFavoritView).
//
// --- Tahap V2.2 (Sprint 3): Header V2 & Hero V2 --------------------------
// Menambah ISI di dalam 2 placeholder yg sudah ada (Header, Main Content
// Container) — TIDAK mengubah struktur top-level 5 komponen V2.1, TIDAK
// mengubah API init()/render()/destroy(). Tetap render-stub DORMANT:
//   - Header V2 sekarang py 4 sub-placeholder: greeting, tombol search,
//     tombol notification, avatar. Tombol sengaja `disabled` (pola sama
//     dgn FAB V2 Tahap V2.1) — placeholder murni, belum interaktif.
//   - Hero V2 (welcome title, Health Score, Balance, Insight) dirender SBG
//     ANAK dari Main Content Container yg sudah ada (bukan komponen
//     top-level baru) — konsisten dgn RFC §1 "Dashboard V2 = evolusi Hero
//     Dashboard existing", dan tidak menambah jumlah child top-level root
//     (tetap 5: sidebar/header/main/bottomnav/fab).
// Tidak ada satu pun nilai NYATA (skor/saldo/insight) — semua teks statis
// placeholder. Tidak terhubung ke FEATURE_REGISTRY, Dashboard Hub existing
// (DashboardHubHero/D.profile/dst), AICommandCenter, atau routing apa pun.
//
// --- Tahap V2.3: Summary Cards & Quick Actions ----------------------------
// Menambah 2 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar
// dgn Hero V2 (bukan komponen top-level baru — struktur 5 komponen V2.1
// tetap tidak berubah). Urutan di dalam Main: Hero -> Summary Cards ->
// Quick Actions.
//   - Summary Cards: 4 kartu placeholder murni (Total Balance, Monthly
//     Income, Monthly Expense, Health Score). Semua teks statis "--",
//     TIDAK membaca D.profile/D.transactions/sumber data nyata apa pun.
//   - Quick Actions: 4 tombol placeholder (Tambah Transaksi, Catatan
//     Kendaraan, Backup, Laporan) — SEMUA `disabled`, tanpa onclick/
//     event handler, tanpa routing (tidak memanggil showPage()).
// Sama seperti V2.1/V2.2: dibangun via replaceChildren(), tanpa
// innerHTML, tidak terhubung FEATURE_REGISTRY/AICommandCenter, dan tidak
// menyentuh index.html/app_production.html/dashboard-hub.js.
//
// --- Tahap V2.4: Module Grid & Insight Panel ------------------------------
// Menambah 2 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar
// dgn Hero V2/Summary Cards/Quick Actions (bukan komponen top-level baru).
// Urutan di dalam Main: Hero -> Summary Cards -> Quick Actions ->
// Module Grid -> Insight Panel.
//   - Module Grid: 6 kartu placeholder murni (Finance, Vehicle, Reports,
//     Family, Documents, Settings) — sekadar label, TIDAK ada link/
//     routing ke showPage() atau modul manapun.
//   - Insight Panel: 3 baris insight placeholder (teks statis) — TIDAK
//     membaca data nyata (D.profile/D.transactions/dll).
// Sama seperti tahap sebelumnya: dibangun via replaceChildren(), tanpa
// innerHTML, tanpa event handler apa pun, tidak terhubung
// FEATURE_REGISTRY/AICommandCenter, tidak menyentuh file lain.
//
// --- Tahap V2.5: Sidebar Navigation & Bottom Navigation V2 items ----------
// Melengkapi ISI 2 placeholder top-level yg dari V2.1 masih teks polos
// (Sidebar, Bottom Navigation V2) — TIDAK mengubah struktur top-level 5
// komponen, TIDAK mengubah API init()/render()/destroy(). Konsisten dgn
// pola _buildHeader() (V2.2): tiap komponen dipecah jadi method
// _buildSidebar()/_buildBottomNav() yg mengembalikan elemen siap pakai.
//   - Sidebar: 5 item navigasi placeholder (Dashboard, Finance, Vehicle,
//     Reports, Settings) sbg tombol `disabled`, namespace baru
//     `dashboard-v2-sidebar-item` (BUKAN `.nav-item` — RFC §5 Risk
//     Assessment, sama alasan dgn Bottom Nav V2.1).
//   - Bottom Navigation V2: 4 item navigasi placeholder (Home, Finance,
//     Vehicle, More) sbg tombol `disabled`, namespace
//     `dashboard-v2-bottomnav-item`.
// Semua tombol `disabled`, tanpa onclick/addEventListener, tanpa routing
// (tidak memanggil showPage()), tanpa business logic apa pun — murni
// placeholder navigasi, sama seperti FAB V2 & tombol Header V2.
//
// --- Tahap V2.6: Recent Activity ------------------------------------------
// Menambah 1 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar dgn
// Hero V2/Summary Cards/Quick Actions/Module Grid/Insight Panel (bukan
// komponen top-level baru — struktur 5 komponen V2.1 tetap tidak berubah).
// Urutan di dalam Main sekarang: Hero -> Summary Cards -> Quick Actions ->
// Module Grid -> Insight Panel -> Recent Activity (Main jadi 6 anak).
//   - Recent Activity: 5 baris item aktivitas placeholder (teks statis,
//     mis. "Transaksi tercatat (placeholder)") — TIDAK membaca data nyata
//     (D.profile/D.transactions/dll), sama persis pola Insight Panel V2.4.
// Sama seperti tahap sebelumnya: dibangun via replaceChildren(), tanpa
// innerHTML, tanpa event handler apa pun (tanpa onclick/addEventListener),
// tanpa routing (tidak memanggil showPage()), tidak terhubung
// FEATURE_REGISTRY/AICommandCenter, tidak menyentuh file lain
// (index.html/app_production.html/dashboard-hub.js tetap 0 sentuhan).
//
// --- Tahap V2.7: Statistics Panel ------------------------------------------
// Menambah 1 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar dgn
// Hero V2/Summary Cards/Quick Actions/Module Grid/Insight Panel/Recent
// Activity (bukan komponen top-level baru — struktur 5 komponen V2.1 tetap
// tidak berubah). Urutan di dalam Main sekarang: Hero -> Summary Cards ->
// Quick Actions -> Module Grid -> Insight Panel -> Recent Activity ->
// Statistics Panel (Main jadi 7 anak).
//   - Statistics Panel: 4 kartu statistik placeholder (Income, Expense,
//     Savings, Active Vehicles), tiap kartu sbg <button type="button"
//     disabled> berisi 4 sub-elemen placeholder (icon, title, value,
//     trend) — pola `disabled` sama dgn Quick Actions (V2.3)/Sidebar &
//     Bottom Nav (V2.5), namun dgn struktur konten berlapis spt kartu
//     Module Grid (V2.4). Semua teks statis "--"/placeholder, TIDAK
//     membaca D.profile/D.transactions/sumber data nyata apa pun.
// Sama seperti tahap sebelumnya: dibangun via replaceChildren(), tanpa
// innerHTML, tanpa onclick/addEventListener, tanpa routing (tidak
// memanggil showPage()), tanpa integrasi FEATURE_REGISTRY/AICommandCenter,
// tanpa fetch, tanpa state baru — tidak menyentuh file lain
// (index.html/app_production.html/dashboard-hub.js tetap 0 sentuhan).
//
// --- Tahap V2.9: Notifications Center --------------------------------------
// Menambah 1 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar dgn
// Hero V2/Summary Cards/Quick Actions/Module Grid/Insight Panel/Recent
// Activity/Statistics Panel/Upcoming Tasks (bukan komponen top-level baru —
// struktur 5 komponen V2.1 tetap tidak berubah). Urutan di dalam Main
// sekarang: Hero -> Summary Cards -> Quick Actions -> Module Grid ->
// Insight Panel -> Recent Activity -> Statistics Panel -> Upcoming Tasks ->
// Notifications Center (Main jadi 9 anak).
//   - Notifications Center: 5 kartu notifikasi placeholder (Backup
//     berhasil, Pengeluaran tinggi minggu ini, Jadwal servis mendekat,
//     Laporan bulanan siap, Sinkronisasi selesai), tiap kartu sbg <button
//     type="button" disabled> berisi 4 sub-elemen placeholder (icon,
//     title, description, timestamp) — pola sama persis dgn Upcoming
//     Tasks (V2.8)/Statistics Panel (V2.7): kartu disabled berisi
//     sub-elemen berlapis. Semua teks statis "--"/placeholder, TIDAK
//     membaca D.profile/D.transactions/sumber data nyata apa pun.
// Sama seperti tahap sebelumnya: dibangun via replaceChildren(), tanpa
// innerHTML, tanpa onclick/addEventListener, tanpa routing (tidak
// memanggil showPage()), tanpa integrasi FEATURE_REGISTRY/AICommandCenter,
// tanpa fetch, tanpa state baru — tidak menyentuh file lain
// (index.html/app_production.html/dashboard-hub.js tetap 0 sentuhan).
//
// --- Tahap V2.8: Upcoming Tasks --------------------------------------------
// Menambah 1 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar dgn
// Hero V2/Summary Cards/Quick Actions/Module Grid/Insight Panel/Recent
// Activity/Statistics Panel (bukan komponen top-level baru — struktur 5
// komponen V2.1 tetap tidak berubah). Urutan di dalam Main sekarang: Hero
// -> Summary Cards -> Quick Actions -> Module Grid -> Insight Panel ->
// Recent Activity -> Statistics Panel -> Upcoming Tasks (Main jadi 8 anak).
//   - Upcoming Tasks: 5 kartu tugas placeholder (Bayar Listrik, Servis
//     Kendaraan, Backup Data, Review Laporan, Perbarui Dokumen), tiap
//     kartu sbg <button type="button" disabled> berisi 4 sub-elemen
//     placeholder (icon, title, due date, status) — pola sama persis dgn
//     Statistics Panel (V2.7): kartu disabled berisi sub-elemen berlapis.
//     Semua teks statis "--"/placeholder, TIDAK membaca D.profile/
//     D.transactions/sumber data nyata apa pun.
// Sama seperti tahap sebelumnya: dibangun via replaceChildren(), tanpa
// innerHTML, tanpa onclick/addEventListener, tanpa routing (tidak
// memanggil showPage()), tanpa integrasi FEATURE_REGISTRY/AICommandCenter,
// tanpa fetch, tanpa state baru — tidak menyentuh file lain
// (index.html/app_production.html/dashboard-hub.js tetap 0 sentuhan).
//
// --- Tahap V2.10: AI Command Center UI --------------------------------------
// Menambah 1 SUB-KOMPONEN baru sbg ANAK Main Content Container, sejajar dgn
// Hero V2/Summary Cards/Quick Actions/Module Grid/Insight Panel/Recent
// Activity/Statistics Panel/Upcoming Tasks/Notifications Center (bukan
// komponen top-level baru — struktur 5 komponen V2.1 tetap tidak berubah).
// Urutan di dalam Main sekarang: Hero -> Summary Cards -> Quick Actions ->
// Module Grid -> Insight Panel -> Recent Activity -> Statistics Panel ->
// Upcoming Tasks -> Notifications Center -> AI Command Center (Main jadi
// 10 anak).
//   - AI Command Center: 1 search field placeholder (`<input type="text"
//     readonly>`), 4 kartu aksi placeholder (Analyze Finance, Analyze
//     Vehicle, Generate Report, Smart Assistant) sbg <button type="button"
//     disabled> — pola sama dgn Quick Actions (V2.3), dan 1 area saran
//     placeholder (teks statis). TIDAK ada AI/API/fetch sungguhan apa pun
//     — search field murni readonly, tombol murni disabled, area saran
//     murni teks statis "-- (placeholder)".
// Sama seperti tahap sebelumnya: dibangun via replaceChildren(), tanpa
// innerHTML, tanpa onclick/addEventListener, tanpa routing (tidak
// memanggil showPage()), tanpa integrasi FEATURE_REGISTRY/AICommandCenter
// (modul AI existing tidak disentuh/direferensikan), tanpa fetch, tanpa
// state baru — tidak menyentuh file lain (index.html/app_production.html/
// dashboard-hub.js/ai-command-center.js tetap 0 sentuhan).

// --- Tahap V2.14B: Activation Wiring (baca-saja) ---------------------------
// Menghubungkan DashboardV2Shell dgn dashboard-v2-activation.js (V2.14A):
// render() sekarang MEMBACA isDashboardV2Enabled() (satu kali, di awal
// render(), lihat blok komentar di dalam render() di bawah) untuk
// menentukan 2 atribut root yg SUDAH ADA sejak V2.1 (`hidden`,
// `data-dashboard-v2-state`) — false -> tetap `hidden` + `dormant`
// (perilaku default, tidak berubah dari V2.1–V2.13); true -> `hidden`
// dilepas + `data-dashboard-v2-state="active"`.
// TIDAK mengganti Dashboard lama, TIDAK menyentuh routing/showPage(),
// TIDAK membaca FEATURE_REGISTRY, TIDAK membaca data Finance/Vehicle/AI
// apa pun, TIDAK fetch, TIDAK menambah state instance baru (tidak ada
// property `this.*` baru), TIDAK menambah event listener apa pun — murni
// baca 1 boolean dari fungsi global terpisah lalu toggle 2 atribut yg
// sudah ada. Struktur 5 komponen top-level & API init()/render()/
// destroy() tidak berubah.
// --- Tahap V2.17: Hero Data Integration --------------------------------
// Dashboard V2 mulai memakai dashboard-v2-data-adapter.js (V2.16), TAPI
// HANYA di Hero (_buildHero, lihat komentar di dalam fungsi itu). 4
// elemen baru ditambah sbg anak Hero, satu per fungsi adapter
// (getFinanceSummary/getVehicleSummary/getFamilySummary/
// getDocumentSummary), dgn fallback placeholder kalau adapter belum
// mengembalikan data. Additive murni: 4 elemen Hero lama (title/
// healthScore/balance/insight) TIDAK diubah, Summary Cards/Module
// Grid/Statistics/Activity/Notifications/Automation/AI/Predictive/
// Health/komponen lain di luar Hero TIDAK disentuh. TIDAK fetch, TIDAK
// business logic baru (murni interpolasi field yg sudah dihitung
// adapter), TIDAK routing/showPage(), TIDAK FEATURE_REGISTRY, TIDAK
// state instance baru, dashboard-v2-data-adapter.js sendiri TIDAK
// diubah.
// --- Tahap V2.18: Summary Cards Data Integration -----------------------
// Mengikuti pola persis V2.17, TAPI HANYA di Summary Cards
// (_buildSummaryCards). 4 elemen baru ditambah sbg anak Summary Cards,
// satu per fungsi adapter (getFinanceSummary/getVehicleSummary/
// getFamilySummary/getDocumentSummary), dgn fallback placeholder kalau
// adapter belum tersedia/return null. Additive murni: 4 kartu Summary
// Cards lama (Total Balance/Monthly Income/Monthly Expense/Health
// Score) TIDAK diubah, Hero/Quick Actions/Module Grid/komponen lain di
// luar Summary Cards TIDAK disentuh. TIDAK fetch, TIDAK business logic
// baru, TIDAK routing/showPage(), TIDAK FEATURE_REGISTRY, TIDAK state
// instance baru, dashboard-v2-data-adapter.js sendiri TIDAK diubah.
// --- Tahap V2.19: Module Grid Data Integration -------------------------
// Mengikuti pola persis V2.17/V2.18, TAPI HANYA di Module Grid
// (_buildModuleGrid). 4 elemen baru ditambah sbg anak Module Grid, satu
// per fungsi adapter (getFinanceSummary/getVehicleSummary/
// getFamilySummary/getDocumentSummary), dgn fallback placeholder kalau
// adapter belum tersedia/return null. Additive murni: 6 kartu Module
// Grid lama (Finance/Vehicle/Reports/Family/Documents/Settings) TIDAK
// diubah, Hero/Summary Cards/komponen lain di luar Module Grid TIDAK
// disentuh. TIDAK fetch, TIDAK business logic baru, TIDAK routing/
// showPage(), TIDAK FEATURE_REGISTRY, TIDAK state instance baru,
// dashboard-v2-data-adapter.js sendiri TIDAK diubah.
// --- Tahap V2.28: Dashboard Refresh Lifecycle (additive) -------------------
// Menambah SATU method baru, refresh(), yg memperbarui ISI panel-panel yg
// sudah memakai dashboard-v2-data-adapter.js (V2.16) — Hero (V2.17),
// Summary Cards (V2.18), Module Grid (V2.19), Statistics Panel (V2.20),
// Recent Activity (V2.21), Upcoming Tasks (V2.22), Notifications (V2.23),
// Automation Center (V2.24), AI Command Center, Health Score & Predictive
// Insights (baris data adapter yg sama sejak masing-masing tahapnya) —
// TANPA destroy()/init()/render() ulang & TANPA membuat root/Main baru.
//
// KENAPA BEGINI (bukan panggil render() ulang):
//   render() membangun ULANG root.replaceChildren(sidebar, header, main,
//   bottomNav, fab) — 5 komponen top-level dibuat baru semua tiap
//   dipanggil. Itu efektif "mount ulang" (referensi node top-level baru
//   tiap kali), yg dilarang eksplisit utk tahap ini. refresh() sebaliknya
//   TIDAK pernah menyentuh root.children (sidebar/header/main/bottomNav/fab
//   tetap node yg SAMA, referensi tidak berubah) — satu-satunya perubahan
//   adalah ISI (children) dari node `main` yg SUDAH ADA, dibangun ulang
//   lewat _buildMain(document) yg SUDAH ADA (reuse builder existing, 0
//   builder baru/di-refactor) lalu dipindahkan ke `main` existing via
//   replaceChildren() (pola yg sama persis dgn yg sudah dipakai render()
//   sendiri utk `main`/`root` sejak V2.1 — bukan innerHTML, bukan
//   querySelectorAll global).
//
// KONTRAK (lihat juga tests/dashboard-v2-refresh.test.js):
//   - Belum pernah init() (this._root belum ada / sudah ter-detach) ->
//     no-op, return null. TIDAK memanggil init() (biar tidak diam-diam
//     membuat root kalau caller belum pernah init()).
//   - Sudah init() tapi belum pernah render() (root belum py anak `main`)
//     -> no-op, return null. TIDAK memanggil render().
//   - Sudah pernah render() -> bangun instance BARU dari _buildMain(document)
//     (builder existing, tidak diubah/di-refactor sama sekali), lalu pindah
//     children-nya (13 panel: Hero/Summary Cards/Quick Actions/Module
//     Grid/Insight Panel/Recent Activity/Statistics Panel/Upcoming
//     Tasks/Notifications/AI Command Center/Health Score/Predictive
//     Insights/Automation Center) ke `main` yg SUDAH ADA di DOM lewat
//     replaceChildren() (fallback removeChild/appendChild kalau
//     replaceChildren tidak tersedia, identik pola render()/destroy()).
//   - root/sidebar/header/main/bottomNav/fab TIDAK pernah diganti
//     (identitas/referensi node top-level dijamin sama sebelum & sesudah
//     refresh() — hanya children `main` yg berubah).
//   - Tidak membuat state instance/global baru (tidak ada `this.*` baru,
//     tidak ada variabel module-level baru) — murni memakai `this._root`
//     yg sudah ada sejak V2.1.
//   - Tidak membaca `D` sama sekali (langsung maupun tidak langsung selain
//     lewat 4 fungsi adapter, persis pola builder V2.17–V2.24) — refresh()
//     sendiri tidak pernah menyebut getFinanceSummary/getVehicleSummary/
//     getFamilySummary/getDocumentSummary secara langsung; itu semua tetap
//     tanggung jawab builder masing-masing (dgn guard
//     `typeof fn === 'function'` yg sudah ada), refresh() hanya memanggil
//     _buildMain(document) yg pada gilirannya memanggil builder-builder
//     itu.
//   - Tidak ada fetch(), showPage(), FEATURE_REGISTRY, innerHTML, atau
//     querySelectorAll global — sama sekali tidak dipakai/ditambah.
//   - Idempotent: dipanggil berkali-kali aman, tidak menumpuk node (pakai
//     replaceChildren(), sama pola dgn render()).
//   - Tidak menyentuh Activation Switch (isDashboardV2Enabled()) maupun
//     atribut `hidden`/`data-dashboard-v2-state` di root — itu murni
//     domain render() (V2.14B), refresh() sama sekali tidak
//     membaca/menulis atribut tsb.
// --- Tahap V2.29: Dashboard Auto Refresh (additive) ---------------------
// Menambah TIGA method baru — startAutoRefresh(intervalMs?), stopAutoRefresh(),
// isAutoRefreshActive() — yg membungkus refresh() (V2.28) di dalam satu
// timer periodik (setInterval), supaya panel-panel yg sudah memakai
// dashboard-v2-data-adapter.js otomatis ter-update tanpa caller harus
// manual memanggil refresh() tiap kali data (`D`) berubah. TIDAK ada
// method/duplikasi logic baru utk membangun ulang panel — satu-satunya
// yg dipanggil tiap tick timer adalah this.refresh() (V2.28) apa adanya,
// 0 baris refresh()/_buildMain()/builder mana pun diubah.
//
// KENAPA TIMER (bukan hook ke titik tulis `D`):
//   Tidak ada satu pun titik "notify data berubah" terpusat di repo ini —
//   `D` ditulis oleh banyak modul independen (transaksi.js, vehicle-
//   core.js, akun.js, dst) tanpa event bus/pub-sub apa pun. Menambah hook
//   semacam itu ke modul-modul lain jelas di luar scope tahap ini
//   (additive-only, tidak boleh menyentuh business logic/file lain).
//   Timer periodik adalah satu-satunya jalur yg 100% self-contained di
//   file ini (pola sama dgn interval periodik lain yg sudah ada di repo,
//   mis. `setInterval(...)` 5 menit di features-sheets-pwa-selftest.js)
//   dan tetap memenuhi tujuan "otomatis memanggil refresh() saat data
//   berubah" — cukup sering, tanpa membaca `D` sama sekali.
//
// KONTRAK (lihat juga tests/dashboard-v2-auto-refresh.test.js):
//   - startAutoRefresh(intervalMs?) memanggil this.refresh() tiap
//     `intervalMs` ms (default AUTO_REFRESH_DEFAULT_MS = 30000). Timer
//     id disimpan di this._autoRefreshTimer (state instance baru, murni
//     dipakai internal utk stop/idempotency — bukan `D`/state global).
//   - Idempotent: dipanggil berkali-kali TIDAK menumpuk timer — panggilan
//     berikutnya membersihkan timer lama (stopAutoRefresh() internal)
//     sebelum membuat timer baru, jadi selalu tepat 1 timer aktif.
//   - stopAutoRefresh() membersihkan timer aktif (kalau ada) & reset
//     this._autoRefreshTimer ke null. Aman dipanggil berkali-kali /
//     sebelum pernah start (no-op, return null).
//   - isAutoRefreshActive() murni membaca this._autoRefreshTimer (!==
//     null), TIDAK membuat/menghapus timer apa pun.
//   - Tidak pernah memanggil init()/destroy()/render() — hanya
//     this.refresh() (V2.28) yg dipanggil tiap tick, apa adanya, 0 baris
//     diubah/di-refactor. Kontrak no-op refresh() (before init()/
//     render()) tetap berlaku penuh: kalau timer sempat tick sebelum
//     root/main ada, refresh() sendiri yg no-op (return null) — tidak
//     ada logic tambahan di sini utk itu.
//   - Tidak membaca `D` sama sekali (langsung maupun tidak langsung) —
//     startAutoRefresh()/stopAutoRefresh()/isAutoRefreshActive() hanya
//     memanggil setInterval/clearInterval/this.refresh(), tidak pernah
//     menyebut `D`, getFinanceSummary/getVehicleSummary/
//     getFamilySummary/getDocumentSummary.
//   - Tidak ada fetch(), showPage(), FEATURE_REGISTRY, innerHTML, atau
//     query DOM global — sama sekali tidak dipakai/ditambah.
//   - Guard `typeof setInterval/clearInterval === 'function'` (pola sama
//     dgn guard `typeof document`/`typeof fn === 'function'` yg sudah
//     ada di file ini sejak V2.1/V2.17) — no-op aman di environment
//     tanpa timer (mis. sandbox test yg sengaja tidak menyediakannya).
//   - Tidak menyentuh Activation Switch (isDashboardV2Enabled()) ataupun
//     mount lifecycle init()/render()/destroy() yg sudah ada — murni
//     3 method baru yg berdiri sendiri, opt-in (tidak auto-start sendiri
//     saat file di-load — caller yg memanggil startAutoRefresh() secara
//     eksplisit, pola opt-in yg sama dgn Activation Switch V2.15).
const DashboardV2Shell = {
  ROOT_ID: 'dashboardV2Root',
  AUTO_REFRESH_DEFAULT_MS: 30000,
  _root: null,
  _autoRefreshTimer: null,

  // init(hostEl?) — pastikan root container ada di DOM. Idempotent: kalau
  // sudah pernah di-init & elemennya masih ter-attach, kembalikan instance
  // yg sama (tidak membuat/append duplikat). hostEl opsional (default:
  // document.body). Return null di environment tanpa `document`.
  init(hostEl) {
    if (typeof document === 'undefined' || !document || typeof document.createElement !== 'function') {
      return null;
    }

    if (this._root && this._root.parentNode) {
      return this._root;
    }

    let root = typeof document.getElementById === 'function' ? document.getElementById(this.ROOT_ID) : null;

    if (!root) {
      root = document.createElement('div');
      root.id = this.ROOT_ID;
      root.className = 'dashboard-v2-root';
      // Dormant: disembunyikan & ditandai eksplisit supaya gampang
      // diverifikasi (test/inspect) bahwa scaffold ini belum aktif.
      root.setAttribute('hidden', '');
      root.setAttribute('data-dashboard-v2-state', 'dormant');

      const host = hostEl || (typeof document !== 'undefined' ? document.body : null);
      if (host && typeof host.appendChild === 'function') {
        host.appendChild(root);
      }
    }

    this._root = root;
    return root;
  },

  // render() — bangun 5 placeholder ke dalam root container pakai
  // replaceChildren() (idempotent: dipanggil berkali-kali tidak menumpuk
  // elemen lama). Otomatis memanggil init() dulu kalau belum ada root,
  // konsisten dgn pola guard toleran-urutan yg dipakai modul render lain.
  render() {
    const root = this.init();
    if (!root || typeof document === 'undefined') return null;

    // --- Tahap V2.14B: baca activation flag (dashboard-v2-activation.js)
    // -----------------------------------------------------------------
    // Satu-satunya perubahan tahap ini: tentukan hidden/data-attribute
    // root berdasarkan isDashboardV2Enabled(), sebagai GLOBAL terpisah
    // (didefinisikan di dashboard-v2-activation.js, bukan di-require/
    // di-import di sini — file itu tetap 100% independen). typeof-check
    // dipakai supaya render() tidak error kalau file activation belum
    // ter-load di environment tsb (mis. urutan script berbeda / test lama
    // yg sandboxnya tidak menyuntik fungsi ini) — dalam kasus itu, fallback
    // ke false (dormant), identik dgn perilaku sebelum tahap ini.
    // TIDAK ada: showPage(), FEATURE_REGISTRY, pembacaan data Finance/
    // Vehicle/AI, fetch, state baru, atau event listener baru — murni
    // baca 1 boolean lalu toggle 2 atribut yg sudah ada sejak V2.1.
    const dashboardV2Enabled = typeof isDashboardV2Enabled === 'function' && isDashboardV2Enabled() === true;
    if (typeof root.setAttribute === 'function') {
      if (dashboardV2Enabled) {
        if (typeof root.removeAttribute === 'function') {
          root.removeAttribute('hidden');
        }
        root.setAttribute('data-dashboard-v2-state', 'active');
      } else {
        root.setAttribute('hidden', '');
        root.setAttribute('data-dashboard-v2-state', 'dormant');
      }
    }

    const sidebar = this._buildSidebar(document);

    const header = this._buildHeader(document);

    const main = this._buildMain(document);

    const bottomNav = this._buildBottomNav(document);

    const fab = document.createElement('button');
    fab.id = 'dashboardV2Fab';
    fab.type = 'button';
    // Reuse pola class ".keu-fab*" (RFC §4.1 poin 5) sebagai basis visual,
    // ditambah namespace baru utk penanda scope Dashboard V2 — TIDAK
    // menambah/mengubah rule ".keu-fab" existing, murni class tambahan.
    fab.className = 'keu-fab dashboard-v2-fab';
    fab.setAttribute('data-dashboard-v2-part', 'fab');
    fab.setAttribute('aria-hidden', 'true');
    fab.disabled = true; // placeholder murni — sengaja tidak interaktif
    fab.textContent = '+';

    if (typeof root.replaceChildren === 'function') {
      root.replaceChildren(sidebar, header, main, bottomNav, fab);
    } else {
      // Fallback defensif utk harness/lingkungan tanpa replaceChildren.
      while (root.firstChild) root.removeChild(root.firstChild);
      [sidebar, header, main, bottomNav, fab].forEach((el) => root.appendChild(el));
    }

    return root;
  },

  // _buildSidebar(document) — Tahap V2.5: dibangun sbg placeholder; Tahap
  // V2.44: diwire ke navigasi nyata (lihat DASHBOARD-V2-SIDEBAR-WIREUP.md),
  // pola identik `_buildBottomNav()` V2.43 — `data-action=
  // "DashboardV2Shell.navigateTo"` + `data-args` (click-delegation global yg
  // SUDAH ADA di features-helpers-global-security.js, BUKAN addEventListener
  // baru). `navigateTo()` (tidak diubah sama sekali tahap ini) yg memanggil
  // `showPage()` sungguhan. Namespace class tetap `dashboard-v2-sidebar-item`
  // (BUKAN `.nav-item` — RFC §5 Risk Assessment, sama alasan sejak V2.1).
  //
  // Item "Reports" TIDAK memiliki halaman tujuan valid (tidak ada
  // `#page-reports` di index.html/app_production.html — dikonfirmasi audit
  // pra-patch tahap ini; pola `page: null` yg sama juga dipakai Quick
  // Actions "Reports" di file ini). Karena itu Reports SENGAJA tetap
  // `disabled`, tanpa `data-action`/`data-page` — tidak ada routing dummy,
  // tidak ada halaman baru dibuat. Lihat CHANGELOG-V2_44.md utk detail.
  _buildSidebar(document) {
    const sidebar = document.createElement('aside');
    sidebar.id = 'dashboardV2Sidebar';
    sidebar.className = 'dashboard-v2-sidebar';
    sidebar.setAttribute('data-dashboard-v2-part', 'sidebar');
    sidebar.setAttribute('aria-label', 'Navigasi Sidebar Dashboard V2');

    // page: id halaman nyata (`#page-<id>`) yg dipanggil lewat showPage(),
    // mapping SAMA PERSIS dgn `_buildBottomNav()` V2.43 utk key yg sama
    // (dashboard/finance/vehicle/settings). `reports`: `page: null` sengaja
    // (tidak ada `#page-reports` — lihat komentar di atas).
    const items = [
      { key: 'dashboard', label: 'Dashboard', page: 'dashboard-hub' },
      { key: 'finance', label: 'Finance', page: 'keuangan' },
      { key: 'vehicle', label: 'Vehicle', page: 'carnotes' },
      { key: 'reports', label: 'Reports', page: null },
      { key: 'settings', label: 'Settings', page: 'settings' },
    ];

    const buttons = items.map((item) => {
      const btn = document.createElement('button');
      btn.id = `dashboardV2Sidebar${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}`;
      btn.type = 'button';
      btn.className = 'dashboard-v2-sidebar-item';
      btn.setAttribute('data-dashboard-v2-part', `sidebar-item-${item.key}`);
      if (item.page) {
        btn.setAttribute('data-dashboard-v2-page', item.page);
        btn.setAttribute('aria-label', item.label);
        btn.setAttribute('data-action', 'DashboardV2Shell.navigateTo');
        btn.setAttribute('data-args', JSON.stringify([item.page, '$el']));
        btn.disabled = false;
      } else {
        btn.setAttribute('aria-label', `${item.label} (belum ada halaman tujuan, placeholder)`);
        btn.disabled = true;
      }
      btn.textContent = item.label;
      return btn;
    });

    if (typeof sidebar.replaceChildren === 'function') {
      sidebar.replaceChildren(...buttons);
    } else {
      buttons.forEach((el) => sidebar.appendChild(el));
    }

    return sidebar;
  },

  // _buildBottomNav(document) — Tahap V2.5: dibangun; Tahap V2.43: diwire
  // ke navigasi nyata (lihat DASHBOARD-V2-BOTTOMNAV-WIREUP.md). 4 item
  // (Home, Finance, Vehicle, More), namespace class tetap
  // `dashboard-v2-bottomnav-item` (BUKAN `.nav-item` — RFC §5 Risk
  // Assessment, sama alasan sejak V2.1: showPage()/dashHubNavigateToFeature()
  // query global `.nav-item`, reuse class itu akan merusak highlight-state
  // navigasi semua halaman existing).
  //
  // Tahap V2.43 (persetujuan eksplisit user): tombol TIDAK LAGI `disabled`.
  // Dipakaikan `data-action="DashboardV2Shell.navigateTo"` + `data-args`
  // (pola global click-delegation yg sudah ada di
  // features-helpers-global-security.js — sama persis dgn `#mainNav` asli,
  // BUKAN `addEventListener` baru). `navigateTo()` (lihat di bawah) yg
  // memanggil `showPage()` sungguhan.
  _buildBottomNav(document) {
    const bottomNav = document.createElement('nav');
    bottomNav.id = 'dashboardV2BottomNav';
    bottomNav.className = 'dashboard-v2-bottomnav';
    bottomNav.setAttribute('data-dashboard-v2-part', 'bottomnav');
    bottomNav.setAttribute('aria-label', 'Navigasi Dashboard V2');

    // page: id halaman nyata (`#page-<id>`) yg dipanggil lewat showPage(),
    // persis dgn yg dipakai `#mainNav` existing (lihat index.html ~2125).
    const items = [
      { key: 'home', label: 'Home', page: 'dashboard-hub' },
      { key: 'finance', label: 'Finance', page: 'keuangan' },
      { key: 'vehicle', label: 'Vehicle', page: 'carnotes' },
      { key: 'more', label: 'More', page: 'settings' },
    ];

    const buttons = items.map((item) => {
      const btn = document.createElement('button');
      btn.id = `dashboardV2BottomNav${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}`;
      btn.type = 'button';
      btn.className = 'dashboard-v2-bottomnav-item';
      btn.setAttribute('data-dashboard-v2-part', `bottomnav-item-${item.key}`);
      btn.setAttribute('data-dashboard-v2-page', item.page);
      btn.setAttribute('aria-label', item.label);
      btn.setAttribute('data-action', 'DashboardV2Shell.navigateTo');
      btn.setAttribute('data-args', JSON.stringify([item.page, '$el']));
      btn.disabled = false;
      btn.textContent = item.label;
      return btn;
    });

    if (typeof bottomNav.replaceChildren === 'function') {
      bottomNav.replaceChildren(...buttons);
    } else {
      buttons.forEach((el) => bottomNav.appendChild(el));
    }

    return bottomNav;
  },

  // _buildHeader(document) — Tahap V2.2: Header V2 dgn 4 sub-placeholder
  // (greeting, search, notification, avatar). Tombol search/notification
  // sengaja `disabled` (pola sama dgn FAB V2) — belum interaktif, murni
  // shell. `role="banner"` konsisten dgn elemen <header> semantik.
  _buildHeader(document) {
    const header = document.createElement('header');
    header.id = 'dashboardV2Header';
    header.className = 'dashboard-v2-header';
    header.setAttribute('data-dashboard-v2-part', 'header');
    header.setAttribute('role', 'banner');
    header.setAttribute('aria-label', 'Header Dashboard V2 (placeholder, belum aktif)');

    const greeting = document.createElement('div');
    greeting.id = 'dashboardV2HeaderGreeting';
    greeting.className = 'dashboard-v2-header-greeting';
    greeting.setAttribute('data-dashboard-v2-part', 'header-greeting');
    greeting.textContent = 'Halo (placeholder)';

    const search = document.createElement('button');
    search.id = 'dashboardV2HeaderSearch';
    search.type = 'button';
    search.className = 'dashboard-v2-header-search';
    search.setAttribute('data-dashboard-v2-part', 'header-search');
    search.setAttribute('aria-label', 'Cari (placeholder, belum aktif)');
    search.disabled = true;
    search.textContent = '🔍';

    const notification = document.createElement('button');
    notification.id = 'dashboardV2HeaderNotification';
    notification.type = 'button';
    notification.className = 'dashboard-v2-header-notification';
    notification.setAttribute('data-dashboard-v2-part', 'header-notification');
    notification.setAttribute('aria-label', 'Notifikasi (placeholder, belum aktif)');
    notification.disabled = true;
    notification.textContent = '🔔';

    const avatar = document.createElement('div');
    avatar.id = 'dashboardV2HeaderAvatar';
    avatar.className = 'dashboard-v2-header-avatar';
    avatar.setAttribute('data-dashboard-v2-part', 'header-avatar');
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Avatar pengguna (placeholder)');

    if (typeof header.replaceChildren === 'function') {
      header.replaceChildren(greeting, search, notification, avatar);
    } else {
      [greeting, search, notification, avatar].forEach((el) => header.appendChild(el));
    }

    return header;
  },

  // _buildHero(document) — Tahap V2.2: Hero V2 (welcome title, Health
  // Score, Balance, Insight). Dirender sbg ANAK Main Content Container
  // (bukan top-level baru) — konsisten RFC §1 "Dashboard V2 = evolusi Hero
  // Dashboard existing". Semua teks statis, TIDAK membaca D.profile/
  // D.transactions/DashboardHubHero atau sumber data nyata apa pun.
  //
  // Tahap V2.17 (Hero Data Integration, additive): 4 elemen BARU ditambah
  // di bawah 4 elemen di atas — satu per fungsi dashboard-v2-data-adapter.js
  // (V2.16): getFinanceSummary()/getVehicleSummary()/getFamilySummary()/
  // getDocumentSummary(). Dipanggil lewat guard `typeof fn === 'function'`
  // (pola sama dgn isDashboardV2Enabled(), Tahap V2.14B) — TIDAK membaca
  // `D` langsung sama sekali (adapter satu-satunya yang membaca `D`, sesuai
  // DASHBOARD-V2-DATA-ADAPTER.md). Setiap elemen fallback ke teks
  // placeholder kalau adapter tidak tersedia/return `null`. 4 elemen lama
  // TIDAK diubah.
  _buildHero(document) {
    const hero = document.createElement('section');
    hero.id = 'dashboardV2Hero';
    hero.className = 'dashboard-v2-hero';
    hero.setAttribute('data-dashboard-v2-part', 'hero');
    hero.setAttribute('role', 'region');
    hero.setAttribute('aria-labelledby', 'dashboardV2HeroTitle');

    // --- Tahap V2.31: Hero Real Data ---------------------------------------
    // 4 variabel summary (satu per fungsi dashboard-v2-data-adapter.js,
    // V2.16) DIPINDAH ke atas blok ini (dari lokasi lamanya di bawah,
    // Tahap V2.17) supaya BISA di-REUSE oleh 4 placeholder LAMA (title/
    // healthScore/balance/insight, Tahap V2.2) di bawah ini TANPA memanggil
    // fungsi adapter 2x — murni pemindahan urutan deklarasi, bukan
    // duplikasi fetch. 4 elemen data summary BARU (Tahap V2.17, di bawah)
    // tetap memakai variabel yang SAMA ini, tidak berubah perilakunya.
    // Guard `typeof fn === 'function'` tetap sama persis dgn V2.17/V2.18.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const hasFinance = !!(financeSummary && typeof financeSummary === 'object');
    const hasVehicle = !!(vehicleSummary && typeof vehicleSummary === 'object');
    const hasFamily = !!(familySummary && typeof familySummary === 'object');
    const hasDocument = !!(documentSummary && typeof documentSummary === 'object');
    const hasAllSummaries = hasFinance && hasVehicle && hasFamily && hasDocument;

    // 4 placeholder LAMA (Tahap V2.2) — sekarang diisi data nyata dari
    // adapter existing (bukan menambah elemen baru, REPLACE nilai teks/
    // aria-label di elemen yang sama, id/class/data-part TIDAK berubah).
    // Kalau adapter/`D` belum tersedia (guard di atas gagal), fallback ke
    // teks placeholder ASLI V2.2 byte-identik — jalur ini yang dipakai
    // tests/dashboard-v2-hero.test.js & tests/dashboard-v2-hero-data.test.js
    // (keduanya me-load shell TANPA adapter), jadi kedua file test lama
    // TETAP lulus tanpa perlu diubah.
    //
    // Catatan cakupan (didokumentasikan, bukan ditebak) — Health Score:
    // adapter TIDAK punya fungsi skor "Hidup Seimbang" (skor itu dihitung
    // LifeBalance.compute() di hidup-seimbang.js, di luar adapter), dan
    // tahap ini melarang mengubah adapter maupun membaca `D`/modul lain
    // langsung dari shell. Elemen ini karena itu diisi ULANG maknanya jadi
    // "Skor Kelengkapan Data" — proporsi domain (Keuangan/Kendaraan/
    // Keluarga/Dokumen) yang py minimal 1 data, dihitung MURNI dari 4 field
    // count yang SUDAH ada di 4 objek summary adapter (interpolasi
    // presentasional, BUKAN formula/skor bisnis baru) — tidak diklaim sbg
    // skor Hidup Seimbang yang sebenarnya. Wiring LifeBalance yang
    // sesungguhnya tetap di luar scope, butuh mandat eksplisit terpisah.
    const title = document.createElement('h2');
    title.id = 'dashboardV2HeroTitle';
    title.className = 'dashboard-v2-hero-title';
    title.setAttribute('data-dashboard-v2-part', 'hero-title');
    if (hasAllSummaries) {
      const totalRecords = financeSummary.accountCount + vehicleSummary.vehicleCount
        + familySummary.anakCount + documentSummary.simCount;
      title.textContent = `Selamat datang — ${totalRecords} data tercatat`;
    } else {
      title.textContent = 'Selamat datang (placeholder)';
    }

    const healthScore = document.createElement('div');
    healthScore.id = 'dashboardV2HeroHealthScore';
    healthScore.className = 'dashboard-v2-hero-healthscore';
    healthScore.setAttribute('data-dashboard-v2-part', 'hero-health-score');
    if (hasAllSummaries) {
      const filledDomains = [
        financeSummary.accountCount > 0,
        vehicleSummary.vehicleCount > 0,
        familySummary.anakCount > 0,
        documentSummary.simCount > 0,
      ].filter(Boolean).length;
      healthScore.setAttribute('aria-label', 'Skor Kelengkapan Data');
      healthScore.textContent = `Skor Kelengkapan Data: ${filledDomains}/4 kategori terisi`;
    } else {
      healthScore.setAttribute('aria-label', 'Skor Hidup Seimbang (placeholder, belum ada data)');
      healthScore.textContent = 'Skor Hidup Seimbang: -- (placeholder)';
    }

    const balance = document.createElement('div');
    balance.id = 'dashboardV2HeroBalance';
    balance.className = 'dashboard-v2-hero-balance';
    balance.setAttribute('data-dashboard-v2-part', 'hero-balance');
    if (hasFinance) {
      balance.setAttribute('aria-label', 'Saldo');
      balance.textContent = `Saldo: Rp ${financeSummary.totalBalance}`;
    } else {
      balance.setAttribute('aria-label', 'Saldo (placeholder, belum ada data)');
      balance.textContent = 'Saldo: Rp -- (placeholder)';
    }

    const insight = document.createElement('div');
    insight.id = 'dashboardV2HeroInsight';
    insight.className = 'dashboard-v2-hero-insight';
    insight.setAttribute('data-dashboard-v2-part', 'hero-insight');
    if (hasAllSummaries) {
      insight.setAttribute('aria-label', 'Insight');
      insight.textContent = `Insight: ${financeSummary.accountCount} akun, ${vehicleSummary.vehicleCount} kendaraan, ${familySummary.anakCount} anak, ${documentSummary.simCount} SIM dipantau`;
    } else {
      insight.setAttribute('aria-label', 'Insight (placeholder, belum ada data)');
      insight.textContent = 'Insight (placeholder)';
    }

    // --- Tahap V2.17: Hero Data Integration (additive) --------------------
    // 4 elemen BARU, anak Hero, satu per fungsi dashboard-v2-data-adapter.js
    // (V2.16). Sejak Tahap V2.31, 4 elemen lama di atas (title/healthScore/
    // balance/insight) JUGA memakai adapter (lihat blok di atas) — variabel
    // summary di bawah ini REUSE, bukan fetch ulang. Setiap elemen baru:
    // kalau fungsi adapter TERSEDIA (global function, pola guard sama
    // persis dgn `isDashboardV2Enabled` di render() — lihat Tahap V2.14B)
    // DAN mengembalikan objek (bukan `null`, guard internal adapter sendiri
    // saat `D` belum ter-load), tampilkan ringkasan sederhana dari
    // field-nya. Kalau tidak tersedia/`null`, fallback ke teks placeholder —
    // jadi elemen ini SELALU ada & SELALU punya teks, tidak pernah
    // kosong/undefined.
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2HeroFinanceSummary';
    financeEl.className = 'dashboard-v2-hero-finance-summary';
    financeEl.setAttribute('data-dashboard-v2-part', 'hero-finance-summary');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2HeroVehicleSummary';
    vehicleEl.className = 'dashboard-v2-hero-vehicle-summary';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'hero-vehicle-summary');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2HeroFamilySummary';
    familyEl.className = 'dashboard-v2-hero-family-summary';
    familyEl.setAttribute('data-dashboard-v2-part', 'hero-family-summary');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2HeroDocumentSummary';
    documentEl.className = 'dashboard-v2-hero-document-summary';
    documentEl.setAttribute('data-dashboard-v2-part', 'hero-document-summary');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof hero.replaceChildren === 'function') {
      hero.replaceChildren(title, healthScore, balance, insight, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [title, healthScore, balance, insight, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => hero.appendChild(el));
    }

    return hero;
  },

  // _buildSummaryCards(document) — Tahap V2.3: 4 kartu placeholder (Total
  // Balance, Monthly Income, Monthly Expense, Health Score). Dirender sbg
  // ANAK Main Content Container (sejajar dgn Hero V2), bukan komponen
  // top-level baru. Semua teks statis "--", TIDAK membaca D.profile/
  // D.transactions/DashboardHubHero atau sumber data nyata apa pun.
  //
  // --- Tahap V2.18: Summary Cards Data Integration (additive) ------------
  // Mengikuti pola persis Tahap V2.17 (_buildHero): Summary Cards mulai
  // memakai dashboard-v2-data-adapter.js (V2.16). 4 elemen BARU ditambah
  // sbg anak Summary Cards, satu per fungsi adapter (getFinanceSummary/
  // getVehicleSummary/getFamilySummary/getDocumentSummary), dgn fallback
  // placeholder kalau fungsi tidak tersedia (guard `typeof fn ===
  // 'function'`) atau mengembalikan null/undefined. 4 kartu lama di atas
  // (Total Balance/Monthly Income/Monthly Expense/Health Score) TIDAK
  // disentuh — tetap teks statis placeholder persis seperti V2.3. TIDAK
  // fetch, TIDAK business logic baru (murni interpolasi field yg sudah
  // dihitung adapter), TIDAK routing/showPage(), TIDAK FEATURE_REGISTRY,
  // TIDAK state instance baru, TIDAK membaca `D` langsung — satu-satunya
  // jalur baca tetap lewat fungsi adapter. dashboard-v2-data-adapter.js
  // sendiri TIDAK diubah.
  _buildSummaryCards(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2SummaryCards';
    section.className = 'dashboard-v2-summary-cards';
    section.setAttribute('data-dashboard-v2-part', 'summary-cards');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Ringkasan (placeholder, belum ada data)');

    const balance = document.createElement('div');
    balance.id = 'dashboardV2SummaryCardBalance';
    balance.className = 'dashboard-v2-summary-card';
    balance.setAttribute('data-dashboard-v2-part', 'summary-card-balance');
    balance.setAttribute('aria-label', 'Total Balance (placeholder, belum ada data)');
    balance.textContent = 'Total Balance: -- (placeholder)';

    const income = document.createElement('div');
    income.id = 'dashboardV2SummaryCardIncome';
    income.className = 'dashboard-v2-summary-card';
    income.setAttribute('data-dashboard-v2-part', 'summary-card-income');
    income.setAttribute('aria-label', 'Monthly Income (placeholder, belum ada data)');
    income.textContent = 'Monthly Income: -- (placeholder)';

    const expense = document.createElement('div');
    expense.id = 'dashboardV2SummaryCardExpense';
    expense.className = 'dashboard-v2-summary-card';
    expense.setAttribute('data-dashboard-v2-part', 'summary-card-expense');
    expense.setAttribute('aria-label', 'Monthly Expense (placeholder, belum ada data)');
    expense.textContent = 'Monthly Expense: -- (placeholder)';

    const health = document.createElement('div');
    health.id = 'dashboardV2SummaryCardHealth';
    health.className = 'dashboard-v2-summary-card';
    health.setAttribute('data-dashboard-v2-part', 'summary-card-health');
    health.setAttribute('aria-label', 'Health Score (placeholder, belum ada data)');
    health.textContent = 'Health Score: -- (placeholder)';

    // --- Tahap V2.18: Summary Cards Data Integration (additive) -----------
    // 4 elemen BARU, anak Summary Cards, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (Tahap V2.17): kalau fungsi adapter TERSEDIA (guard
    // `typeof fn === 'function'`) DAN mengembalikan objek (bukan `null`),
    // tampilkan ringkasan sederhana dari field-nya; kalau tidak, fallback
    // ke teks placeholder — elemen ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2SummaryCardFinanceData';
    financeEl.className = 'dashboard-v2-summary-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'summary-card-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2SummaryCardVehicleData';
    vehicleEl.className = 'dashboard-v2-summary-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'summary-card-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2SummaryCardFamilyData';
    familyEl.className = 'dashboard-v2-summary-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'summary-card-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2SummaryCardDocumentData';
    documentEl.className = 'dashboard-v2-summary-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'summary-card-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(balance, income, expense, health, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [balance, income, expense, health, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildQuickActions(document) — Tahap V2.3: 4 tombol placeholder
  // (Tambah Transaksi, Catatan Kendaraan, Backup, Laporan). Dirender sbg
  // ANAK Main Content Container (sejajar dgn Hero V2/Summary Cards).
  // SEMUA tombol `disabled` — tanpa onclick/event handler, tanpa routing
  // (tidak memanggil showPage()), tanpa business logic apa pun.
  _buildQuickActions(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2QuickActions';
    section.className = 'dashboard-v2-quickactions';
    section.setAttribute('data-dashboard-v2-part', 'quickactions');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Aksi Cepat (placeholder, belum aktif)');

    const addTx = document.createElement('button');
    addTx.id = 'dashboardV2QuickActionAddTx';
    addTx.type = 'button';
    addTx.className = 'dashboard-v2-quickaction-btn';
    addTx.setAttribute('data-dashboard-v2-part', 'quickaction-add-tx');
    addTx.setAttribute('aria-label', 'Tambah Transaksi (placeholder, belum aktif)');
    addTx.disabled = true;
    addTx.textContent = 'Tambah Transaksi';

    const vehicleNotes = document.createElement('button');
    vehicleNotes.id = 'dashboardV2QuickActionVehicleNotes';
    vehicleNotes.type = 'button';
    vehicleNotes.className = 'dashboard-v2-quickaction-btn';
    vehicleNotes.setAttribute('data-dashboard-v2-part', 'quickaction-vehicle-notes');
    vehicleNotes.setAttribute('aria-label', 'Catatan Kendaraan (placeholder, belum aktif)');
    vehicleNotes.disabled = true;
    vehicleNotes.textContent = 'Catatan Kendaraan';

    const backup = document.createElement('button');
    backup.id = 'dashboardV2QuickActionBackup';
    backup.type = 'button';
    backup.className = 'dashboard-v2-quickaction-btn';
    backup.setAttribute('data-dashboard-v2-part', 'quickaction-backup');
    backup.setAttribute('aria-label', 'Backup (placeholder, belum aktif)');
    backup.disabled = true;
    backup.textContent = 'Backup';

    const report = document.createElement('button');
    report.id = 'dashboardV2QuickActionReport';
    report.type = 'button';
    report.className = 'dashboard-v2-quickaction-btn';
    report.setAttribute('data-dashboard-v2-part', 'quickaction-report');
    report.setAttribute('aria-label', 'Laporan (placeholder, belum aktif)');
    report.disabled = true;
    report.textContent = 'Laporan';

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(addTx, vehicleNotes, backup, report);
    } else {
      [addTx, vehicleNotes, backup, report].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildModuleGrid(document) — Tahap V2.4: 6 kartu placeholder (Finance,
  // Vehicle, Reports, Family, Documents, Settings). Dirender sbg ANAK Main
  // Content Container (sejajar dgn Hero V2/Summary Cards/Quick Actions),
  // bukan komponen top-level baru. Sekadar label statis — TIDAK ada
  // link/routing ke showPage() atau modul manapun, TIDAK ada onclick.
  //
  // --- Tahap V2.19: Module Grid Data Integration (additive) ---------------
  // Mengikuti pola persis Tahap V2.17 (_buildHero) & V2.18
  // (_buildSummaryCards): Module Grid mulai memakai
  // dashboard-v2-data-adapter.js (V2.16). 4 elemen BARU ditambah sbg anak
  // Module Grid, satu per fungsi adapter (getFinanceSummary/
  // getVehicleSummary/getFamilySummary/getDocumentSummary), dgn fallback
  // placeholder kalau fungsi tidak tersedia (guard `typeof fn ===
  // 'function'`) atau mengembalikan null/undefined. 6 kartu lama di atas
  // (Finance/Vehicle/Reports/Family/Documents/Settings) TIDAK disentuh —
  // tetap teks statis placeholder persis seperti V2.4 (Reports & Settings
  // sengaja tidak dapat elemen data baru — tidak ada fungsi adapter utk
  // domain itu). TIDAK fetch, TIDAK business logic baru (murni interpolasi
  // field yg sudah dihitung adapter), TIDAK routing/showPage(), TIDAK
  // FEATURE_REGISTRY, TIDAK state instance baru, TIDAK membaca `D`
  // langsung — satu-satunya jalur baca tetap lewat fungsi adapter.
  // dashboard-v2-data-adapter.js sendiri TIDAK diubah.
  //
  // --- Tahap V2.30: Interactive Dashboard Cards (additive) ---------------
  // 3 dari 6 kartu placeholder lama (Finance/Vehicle/Settings) sekarang
  // klik-able: reuse dispatcher `data-action`/`data-args` global yg sudah
  // ada (features-helpers-global-security.js, TIDAK diubah) memanggil
  // `dashHubNavigateToFeature({page})` (dashboard-hub.js, TIDAK diubah) ->
  // `showPage()` (modal-navigasi.js, TIDAK diubah). 3 kartu lain
  // (Reports/Family/Documents) TETAP placeholder murni — tidak py 1 page
  // tunggal yg tidak ambigu, lihat DASHBOARD-V2-INTERACTIVE-CARDS.md.
  _buildModuleGrid(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2ModuleGrid';
    section.className = 'dashboard-v2-module-grid';
    section.setAttribute('data-dashboard-v2-part', 'module-grid');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Modul (placeholder, belum aktif)');

    // --- Tahap V2.30: Interactive Dashboard Cards (additive) ---------------
    // `page` di bawah HANYA diisi utk 3 modul yg py target page TUNGGAL &
    // tidak ambigu di PAGE_NAV_IDX (dashboard-hub.js): finance->keuangan,
    // vehicle->carnotes, settings->settings. Reports/Family/Documents
    // SENGAJA dibiarkan `page: null` (tetap placeholder, belum interaktif)
    // krn tidak py 1 page tunggal yg mewakilinya tanpa keputusan produk
    // baru (Reports = tab di dalam Keuangan, Family = bagian LifeOS di
    // dashboard-hub, Documents = tersebar SIM/pajak kendaraan) — lihat
    // DASHBOARD-V2-INTERACTIVE-CARDS.md.
    const modules = [
      { key: 'finance', label: 'Finance', page: 'keuangan' },
      { key: 'vehicle', label: 'Vehicle', page: 'carnotes' },
      { key: 'reports', label: 'Reports', page: null },
      { key: 'family', label: 'Family', page: null },
      { key: 'documents', label: 'Documents', page: null },
      { key: 'settings', label: 'Settings', page: 'settings' },
    ];

    const cards = modules.map((mod) => {
      const card = document.createElement('div');
      card.id = `dashboardV2ModuleGrid${mod.key.charAt(0).toUpperCase()}${mod.key.slice(1)}`;
      card.className = 'dashboard-v2-module-card';
      card.setAttribute('data-dashboard-v2-part', `module-card-${mod.key}`);
      if (mod.page) {
        // Reuse mekanisme navigasi GLOBAL yg sudah ada (dispatcher
        // `data-action`/`data-args` di features-helpers-global-security.js,
        // pola persis `data-action="openTxModal" data-args='["expense"]'`
        // di index.html) memanggil `dashHubNavigateToFeature()`
        // (dashboard-hub.js, TIDAK diubah) yg memanggil `showPage()`
        // (modal-navigasi.js, TIDAK diubah). dashboard-v2-shell.js sendiri
        // TIDAK memanggil showPage()/FEATURE_REGISTRY/addEventListener/
        // .onclick= secara langsung — murni atribut deklaratif, dispatcher
        // & fungsi navigasi 100% reuse, tidak ada business logic baru.
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('data-action', 'dashHubNavigateToFeature');
        card.setAttribute('data-args', JSON.stringify([{ page: mod.page }]));
        card.setAttribute('aria-label', `Buka ${mod.label}`);
        card.textContent = mod.label;
      } else {
        card.setAttribute('aria-label', `${mod.label} (placeholder, belum aktif)`);
        card.textContent = `${mod.label} (placeholder)`;
      }
      return card;
    });

    // --- Tahap V2.19: Module Grid Data Integration (additive) -------------
    // 4 elemen BARU, anak Module Grid, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17) & _buildSummaryCards() (V2.18): kalau fungsi
    // adapter TERSEDIA (guard `typeof fn === 'function'`) DAN mengembalikan
    // objek (bukan `null`), tampilkan ringkasan sederhana dari field-nya;
    // kalau tidak, fallback ke teks placeholder — elemen ini SELALU ada &
    // SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2ModuleGridFinanceData';
    financeEl.className = 'dashboard-v2-module-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'module-card-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2ModuleGridVehicleData';
    vehicleEl.className = 'dashboard-v2-module-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'module-card-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2ModuleGridFamilyData';
    familyEl.className = 'dashboard-v2-module-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'module-card-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2ModuleGridDocumentData';
    documentEl.className = 'dashboard-v2-module-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'module-card-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...cards, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [...cards, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildInsightPanel(document) — Tahap V2.4: 3 baris insight placeholder.
  // Dirender sbg ANAK Main Content Container (sejajar dgn komponen lain di
  // atas). Semua teks statis, TIDAK membaca D.profile/D.transactions/
  // sumber data nyata apa pun.
  _buildInsightPanel(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2InsightPanel';
    section.className = 'dashboard-v2-insight-panel';
    section.setAttribute('data-dashboard-v2-part', 'insight-panel');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Insight (placeholder, belum ada data)');

    const insights = [
      { key: 'backup', text: 'Backup belum dilakukan (placeholder)' },
      { key: 'balance', text: 'Saldo stabil bulan ini (placeholder)' },
      { key: 'vehicle', text: 'Kendaraan akan servis (placeholder)' },
    ];

    const items = insights.map((insight) => {
      const item = document.createElement('div');
      item.id = `dashboardV2InsightPanel${insight.key.charAt(0).toUpperCase()}${insight.key.slice(1)}`;
      item.className = 'dashboard-v2-insight-item';
      item.setAttribute('data-dashboard-v2-part', `insight-item-${insight.key}`);
      item.setAttribute('aria-label', `${insight.text}, belum ada data nyata`);
      item.textContent = insight.text;
      return item;
    });

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...items);
    } else {
      items.forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildRecentActivity(document) — Tahap V2.6: 5 baris aktivitas
  // placeholder. Dirender sbg ANAK Main Content Container (sejajar dgn
  // komponen lain, setelah Insight Panel). Semua teks statis, TIDAK
  // membaca D.profile/D.transactions/sumber data nyata apa pun — pola
  // identik dgn _buildInsightPanel() (V2.4).
  //
  // --- Tahap V2.21: Recent Activity Data Integration (additive) ----------
  // Mengikuti pola persis Tahap V2.17 (_buildHero), V2.18
  // (_buildSummaryCards), V2.19 (_buildModuleGrid) & V2.20
  // (_buildStatisticsPanel): Recent Activity mulai memakai
  // dashboard-v2-data-adapter.js (V2.16). 4 elemen BARU ditambah sbg
  // anak Recent Activity, satu per fungsi adapter (getFinanceSummary/
  // getVehicleSummary/getFamilySummary/getDocumentSummary), dgn fallback
  // placeholder kalau fungsi tidak tersedia (guard `typeof fn ===
  // 'function'`) atau mengembalikan null/undefined. 5 baris lama di atas
  // (item1-item5) TIDAK disentuh — tetap teks statis placeholder persis
  // seperti V2.6. TIDAK fetch, TIDAK business logic baru (murni
  // interpolasi field yg sudah dihitung adapter), TIDAK routing/
  // showPage(), TIDAK FEATURE_REGISTRY, TIDAK state instance baru, TIDAK
  // membaca `D` langsung — satu-satunya jalur baca tetap lewat fungsi
  // adapter. dashboard-v2-data-adapter.js sendiri TIDAK diubah.
  _buildRecentActivity(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2RecentActivity';
    section.className = 'dashboard-v2-recent-activity';
    section.setAttribute('data-dashboard-v2-part', 'recent-activity');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Recent Activity (placeholder, belum ada data)');

    const activities = [
      { key: 'item1', text: 'Transaksi tercatat (placeholder)' },
      { key: 'item2', text: 'Backup terakhir dijalankan (placeholder)' },
      { key: 'item3', text: 'Catatan kendaraan diperbarui (placeholder)' },
      { key: 'item4', text: 'Laporan dibuat (placeholder)' },
      { key: 'item5', text: 'Anggota keluarga ditambahkan (placeholder)' },
    ];

    const items = activities.map((activity) => {
      const item = document.createElement('div');
      item.id = `dashboardV2RecentActivity${activity.key.charAt(0).toUpperCase()}${activity.key.slice(1)}`;
      item.className = 'dashboard-v2-recent-activity-item';
      item.setAttribute('data-dashboard-v2-part', `recent-activity-${activity.key}`);
      item.setAttribute('aria-label', `${activity.text}, belum ada data nyata`);
      item.textContent = activity.text;
      return item;
    });

    // --- Tahap V2.21: Recent Activity Data Integration (additive) ---------
    // 4 elemen BARU, anak Recent Activity, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19) & _buildStatisticsPanel() (V2.20): kalau
    // fungsi adapter TERSEDIA (guard `typeof fn === 'function'`) DAN
    // mengembalikan objek (bukan `null`), tampilkan ringkasan sederhana
    // dari field-nya; kalau tidak, fallback ke teks placeholder — elemen
    // ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2RecentActivityFinanceData';
    financeEl.className = 'dashboard-v2-recent-activity-item';
    financeEl.setAttribute('data-dashboard-v2-part', 'recent-activity-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2RecentActivityVehicleData';
    vehicleEl.className = 'dashboard-v2-recent-activity-item';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'recent-activity-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2RecentActivityFamilyData';
    familyEl.className = 'dashboard-v2-recent-activity-item';
    familyEl.setAttribute('data-dashboard-v2-part', 'recent-activity-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2RecentActivityDocumentData';
    documentEl.className = 'dashboard-v2-recent-activity-item';
    documentEl.setAttribute('data-dashboard-v2-part', 'recent-activity-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...items, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [...items, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildStatisticsPanel(document) — Tahap V2.7: 4 kartu statistik
  // placeholder (Income, Expense, Savings, Active Vehicles). Dirender sbg
  // ANAK Main Content Container (sejajar dgn komponen lain, setelah Recent
  // Activity). Tiap kartu adalah <button type="button" disabled> berisi 4
  // sub-elemen placeholder (icon, title, value, trend) — semua teks
  // statis, TIDAK membaca D.profile/D.transactions/sumber data nyata apa
  // pun, tanpa onclick/addEventListener, tanpa routing.
  //
  // --- Tahap V2.20: Statistics Panel Data Integration (additive) ---------
  // Mengikuti pola persis Tahap V2.17 (_buildHero), V2.18
  // (_buildSummaryCards) & V2.19 (_buildModuleGrid): Statistics Panel
  // mulai memakai dashboard-v2-data-adapter.js (V2.16). 4 elemen BARU
  // ditambah sbg anak Statistics Panel, satu per fungsi adapter
  // (getFinanceSummary/getVehicleSummary/getFamilySummary/
  // getDocumentSummary), dgn fallback placeholder kalau fungsi tidak
  // tersedia (guard `typeof fn === 'function'`) atau mengembalikan
  // null/undefined. 4 kartu lama di atas (Income/Expense/Savings/Active
  // Vehicles) TIDAK disentuh — tetap teks statis placeholder persis
  // seperti V2.7. TIDAK fetch, TIDAK business logic baru (murni
  // interpolasi field yg sudah dihitung adapter), TIDAK routing/
  // showPage(), TIDAK FEATURE_REGISTRY, TIDAK state instance baru, TIDAK
  // membaca `D` langsung — satu-satunya jalur baca tetap lewat fungsi
  // adapter. dashboard-v2-data-adapter.js sendiri TIDAK diubah.
  _buildStatisticsPanel(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2StatisticsPanel';
    section.className = 'dashboard-v2-statistics-panel';
    section.setAttribute('data-dashboard-v2-part', 'statistics-panel');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Statistics');

    const stats = [
      { key: 'income', title: 'Income', icon: '📈' },
      { key: 'expense', title: 'Expense', icon: '📉' },
      { key: 'savings', title: 'Savings', icon: '💰' },
      { key: 'vehicles', title: 'Active Vehicles', icon: '🚗' },
    ];

    const cards = stats.map((stat) => {
      const keyCap = stat.key.charAt(0).toUpperCase() + stat.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2StatisticsCard${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-statistics-card';
      card.setAttribute('data-dashboard-v2-part', `statistics-card-${stat.key}`);
      card.setAttribute('aria-label', `${stat.title} (placeholder, belum ada data)`);
      card.disabled = true;

      const icon = document.createElement('span');
      icon.id = `dashboardV2StatisticsCard${keyCap}Icon`;
      icon.className = 'dashboard-v2-statistics-icon';
      icon.setAttribute('data-dashboard-v2-part', `statistics-card-${stat.key}-icon`);
      icon.textContent = stat.icon;

      const title = document.createElement('span');
      title.id = `dashboardV2StatisticsCard${keyCap}Title`;
      title.className = 'dashboard-v2-statistics-title';
      title.setAttribute('data-dashboard-v2-part', `statistics-card-${stat.key}-title`);
      title.textContent = stat.title;

      const value = document.createElement('span');
      value.id = `dashboardV2StatisticsCard${keyCap}Value`;
      value.className = 'dashboard-v2-statistics-value';
      value.setAttribute('data-dashboard-v2-part', `statistics-card-${stat.key}-value`);
      value.textContent = '-- (placeholder)';

      const trend = document.createElement('span');
      trend.id = `dashboardV2StatisticsCard${keyCap}Trend`;
      trend.className = 'dashboard-v2-statistics-trend';
      trend.setAttribute('data-dashboard-v2-part', `statistics-card-${stat.key}-trend`);
      trend.textContent = '-- (placeholder)';

      if (typeof card.replaceChildren === 'function') {
        card.replaceChildren(icon, title, value, trend);
      } else {
        [icon, title, value, trend].forEach((el) => card.appendChild(el));
      }

      return card;
    });

    // --- Tahap V2.20: Statistics Panel Data Integration (additive) --------
    // 4 elemen BARU, anak Statistics Panel, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18) &
    // _buildModuleGrid() (V2.19): kalau fungsi adapter TERSEDIA (guard
    // `typeof fn === 'function'`) DAN mengembalikan objek (bukan `null`),
    // tampilkan ringkasan sederhana dari field-nya; kalau tidak, fallback
    // ke teks placeholder — elemen ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2StatisticsFinanceData';
    financeEl.className = 'dashboard-v2-statistics-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'statistics-card-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2StatisticsVehicleData';
    vehicleEl.className = 'dashboard-v2-statistics-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'statistics-card-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2StatisticsFamilyData';
    familyEl.className = 'dashboard-v2-statistics-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'statistics-card-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2StatisticsDocumentData';
    documentEl.className = 'dashboard-v2-statistics-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'statistics-card-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...cards, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [...cards, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildUpcomingTasks(document) — Tahap V2.8: 5 kartu tugas placeholder
  // (Bayar Listrik, Servis Kendaraan, Backup Data, Review Laporan,
  // Perbarui Dokumen). Dirender sbg ANAK Main Content Container (sejajar
  // dgn komponen lain, setelah Statistics Panel). Tiap kartu adalah
  // <button type="button" disabled> berisi 4 sub-elemen placeholder
  // (icon, title, due date, status) — semua teks statis, TIDAK membaca
  // D.profile/D.transactions/sumber data nyata apa pun, tanpa onclick/
  // addEventListener, tanpa routing. Pola identik dgn
  // _buildStatisticsPanel() (V2.7).
  //
  // --- Tahap V2.22: Upcoming Tasks Data Integration (additive) -----------
  // Mengikuti pola persis Tahap V2.17 (_buildHero), V2.18
  // (_buildSummaryCards), V2.19 (_buildModuleGrid), V2.20
  // (_buildStatisticsPanel) & V2.21 (_buildRecentActivity): Upcoming Tasks
  // mulai memakai dashboard-v2-data-adapter.js (V2.16). 4 elemen BARU
  // ditambah sbg anak Upcoming Tasks, satu per fungsi adapter
  // (getFinanceSummary/getVehicleSummary/getFamilySummary/
  // getDocumentSummary), dgn fallback placeholder kalau fungsi tidak
  // tersedia (guard `typeof fn === 'function'`) atau mengembalikan
  // null/undefined. 5 kartu lama di atas (listrik/servis/backup/laporan/
  // dokumen) TIDAK disentuh — tetap teks statis placeholder persis
  // seperti V2.8. TIDAK fetch, TIDAK business logic baru (murni
  // interpolasi field yg sudah dihitung adapter), TIDAK routing/
  // showPage(), TIDAK FEATURE_REGISTRY, TIDAK state instance baru, TIDAK
  // membaca `D` langsung — satu-satunya jalur baca tetap lewat fungsi
  // adapter. dashboard-v2-data-adapter.js sendiri TIDAK diubah.
  _buildUpcomingTasks(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2UpcomingTasks';
    section.className = 'dashboard-v2-upcoming-tasks';
    section.setAttribute('data-dashboard-v2-part', 'upcoming-tasks');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Upcoming Tasks');

    const tasks = [
      { key: 'listrik', title: 'Bayar Listrik', icon: '💡' },
      { key: 'servis', title: 'Servis Kendaraan', icon: '🔧' },
      { key: 'backup', title: 'Backup Data', icon: '💾' },
      { key: 'laporan', title: 'Review Laporan', icon: '📋' },
      { key: 'dokumen', title: 'Perbarui Dokumen', icon: '📄' },
    ];

    const cards = tasks.map((task) => {
      const keyCap = task.key.charAt(0).toUpperCase() + task.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2UpcomingTaskCard${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-upcoming-task-card';
      card.setAttribute('data-dashboard-v2-part', `upcoming-task-card-${task.key}`);
      card.setAttribute('aria-label', `${task.title} (placeholder, belum ada data)`);
      card.disabled = true;

      const icon = document.createElement('span');
      icon.id = `dashboardV2UpcomingTaskCard${keyCap}Icon`;
      icon.className = 'dashboard-v2-upcoming-task-icon';
      icon.setAttribute('data-dashboard-v2-part', `upcoming-task-card-${task.key}-icon`);
      icon.textContent = task.icon;

      const title = document.createElement('span');
      title.id = `dashboardV2UpcomingTaskCard${keyCap}Title`;
      title.className = 'dashboard-v2-upcoming-task-title';
      title.setAttribute('data-dashboard-v2-part', `upcoming-task-card-${task.key}-title`);
      title.textContent = task.title;

      const dueDate = document.createElement('span');
      dueDate.id = `dashboardV2UpcomingTaskCard${keyCap}DueDate`;
      dueDate.className = 'dashboard-v2-upcoming-task-due-date';
      dueDate.setAttribute('data-dashboard-v2-part', `upcoming-task-card-${task.key}-due-date`);
      dueDate.textContent = '-- (placeholder)';

      const status = document.createElement('span');
      status.id = `dashboardV2UpcomingTaskCard${keyCap}Status`;
      status.className = 'dashboard-v2-upcoming-task-status';
      status.setAttribute('data-dashboard-v2-part', `upcoming-task-card-${task.key}-status`);
      status.textContent = '-- (placeholder)';

      if (typeof card.replaceChildren === 'function') {
        card.replaceChildren(icon, title, dueDate, status);
      } else {
        [icon, title, dueDate, status].forEach((el) => card.appendChild(el));
      }

      return card;
    });

    // --- Tahap V2.22: Upcoming Tasks Data Integration (additive) ----------
    // 4 elemen BARU, anak Upcoming Tasks, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19), _buildStatisticsPanel() (V2.20) &
    // _buildRecentActivity() (V2.21): kalau fungsi adapter TERSEDIA (guard
    // `typeof fn === 'function'`) DAN mengembalikan objek (bukan `null`),
    // tampilkan ringkasan sederhana dari field-nya; kalau tidak, fallback
    // ke teks placeholder — elemen ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2UpcomingTasksFinanceData';
    financeEl.className = 'dashboard-v2-upcoming-task-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'upcoming-task-card-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2UpcomingTasksVehicleData';
    vehicleEl.className = 'dashboard-v2-upcoming-task-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'upcoming-task-card-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2UpcomingTasksFamilyData';
    familyEl.className = 'dashboard-v2-upcoming-task-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'upcoming-task-card-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2UpcomingTasksDocumentData';
    documentEl.className = 'dashboard-v2-upcoming-task-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'upcoming-task-card-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...cards, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [...cards, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildNotifications(document) — Tahap V2.9: 5 kartu notifikasi
  // placeholder (Backup berhasil, Pengeluaran tinggi minggu ini, Jadwal
  // servis mendekat, Laporan bulanan siap, Sinkronisasi selesai). Dirender
  // sbg ANAK Main Content Container (sejajar dgn komponen lain, setelah
  // Upcoming Tasks). Tiap kartu adalah <button type="button" disabled>
  // berisi 4 sub-elemen placeholder (icon, title, description,
  // timestamp) — semua teks statis, TIDAK membaca D.profile/
  // D.transactions/sumber data nyata apa pun, tanpa onclick/
  // addEventListener, tanpa routing. Pola identik dgn
  // _buildUpcomingTasks() (V2.8).
  //
  // --- Tahap V2.23: Notifications Data Integration (additive) ------------
  // Mengikuti pola persis Tahap V2.17 (_buildHero), V2.18
  // (_buildSummaryCards), V2.19 (_buildModuleGrid), V2.20
  // (_buildStatisticsPanel), V2.21 (_buildRecentActivity) & V2.22
  // (_buildUpcomingTasks): Notifications mulai memakai dashboard-v2-data-
  // adapter.js (V2.16). 4 elemen BARU ditambah sbg anak Notifications,
  // satu per fungsi adapter (getFinanceSummary/getVehicleSummary/
  // getFamilySummary/getDocumentSummary), dgn fallback placeholder kalau
  // fungsi tidak tersedia (guard `typeof fn === 'function'`) atau
  // mengembalikan null/undefined. 5 kartu lama di atas (backup/
  // pengeluaran/servis/laporan/sinkronisasi) TIDAK disentuh — tetap teks
  // statis placeholder persis seperti V2.9. TIDAK fetch, TIDAK business
  // logic baru (murni interpolasi field yg sudah dihitung adapter), TIDAK
  // routing/showPage(), TIDAK FEATURE_REGISTRY, TIDAK state instance baru,
  // TIDAK membaca `D` langsung — satu-satunya jalur baca tetap lewat
  // fungsi adapter. dashboard-v2-data-adapter.js sendiri TIDAK diubah.
  _buildNotifications(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2Notifications';
    section.className = 'dashboard-v2-notifications';
    section.setAttribute('data-dashboard-v2-part', 'notifications');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Notifications');

    const notifications = [
      { key: 'backup', title: 'Backup berhasil', icon: '💾' },
      { key: 'pengeluaran', title: 'Pengeluaran tinggi minggu ini', icon: '⚠️' },
      { key: 'servis', title: 'Jadwal servis mendekat', icon: '🔧' },
      { key: 'laporan', title: 'Laporan bulanan siap', icon: '📋' },
      { key: 'sinkronisasi', title: 'Sinkronisasi selesai', icon: '🔄' },
    ];

    const cards = notifications.map((notif) => {
      const keyCap = notif.key.charAt(0).toUpperCase() + notif.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2NotificationCard${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-notification-card';
      card.setAttribute('data-dashboard-v2-part', `notification-card-${notif.key}`);
      card.setAttribute('aria-label', `${notif.title} (placeholder, belum ada data)`);
      card.disabled = true;

      const icon = document.createElement('span');
      icon.id = `dashboardV2NotificationCard${keyCap}Icon`;
      icon.className = 'dashboard-v2-notification-icon';
      icon.setAttribute('data-dashboard-v2-part', `notification-card-${notif.key}-icon`);
      icon.textContent = notif.icon;

      const title = document.createElement('span');
      title.id = `dashboardV2NotificationCard${keyCap}Title`;
      title.className = 'dashboard-v2-notification-title';
      title.setAttribute('data-dashboard-v2-part', `notification-card-${notif.key}-title`);
      title.textContent = notif.title;

      const description = document.createElement('span');
      description.id = `dashboardV2NotificationCard${keyCap}Description`;
      description.className = 'dashboard-v2-notification-description';
      description.setAttribute('data-dashboard-v2-part', `notification-card-${notif.key}-description`);
      description.textContent = '-- (placeholder)';

      const timestamp = document.createElement('span');
      timestamp.id = `dashboardV2NotificationCard${keyCap}Timestamp`;
      timestamp.className = 'dashboard-v2-notification-timestamp';
      timestamp.setAttribute('data-dashboard-v2-part', `notification-card-${notif.key}-timestamp`);
      timestamp.textContent = '-- (placeholder)';

      if (typeof card.replaceChildren === 'function') {
        card.replaceChildren(icon, title, description, timestamp);
      } else {
        [icon, title, description, timestamp].forEach((el) => card.appendChild(el));
      }

      return card;
    });

    // --- Tahap V2.23: Notifications Data Integration (additive) -----------
    // 4 elemen BARU, anak Notifications, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19), _buildStatisticsPanel() (V2.20),
    // _buildRecentActivity() (V2.21) & _buildUpcomingTasks() (V2.22): kalau
    // fungsi adapter TERSEDIA (guard `typeof fn === 'function'`) DAN
    // mengembalikan objek (bukan `null`), tampilkan ringkasan sederhana
    // dari field-nya; kalau tidak, fallback ke teks placeholder — elemen
    // ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2NotificationsFinanceData';
    financeEl.className = 'dashboard-v2-notification-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'notification-card-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2NotificationsVehicleData';
    vehicleEl.className = 'dashboard-v2-notification-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'notification-card-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2NotificationsFamilyData';
    familyEl.className = 'dashboard-v2-notification-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'notification-card-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2NotificationsDocumentData';
    documentEl.className = 'dashboard-v2-notification-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'notification-card-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...cards, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [...cards, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildAiCommandCenter(document) — Tahap V2.10: 1 search field
  // placeholder (readonly), 4 kartu aksi placeholder (Analyze Finance,
  // Analyze Vehicle, Generate Report, Smart Assistant), dan 1 area saran
  // placeholder. Dirender sbg ANAK Main Content Container (sejajar dgn
  // komponen lain, setelah Notifications Center). Search field murni
  // readonly (tanpa input handler), kartu aksi murni disabled (tanpa
  // onclick/addEventListener), area saran murni teks statis — TIDAK ada
  // AI/API/fetch sungguhan apa pun, tidak membaca D.profile/
  // D.transactions/sumber data nyata apa pun, tidak menyentuh
  // ai-command-center.js existing. Pola tombol identik dgn
  // _buildQuickActions() (V2.3).
  _buildAiCommandCenter(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2AiCommandCenter';
    section.className = 'dashboard-v2-ai-command-center';
    section.setAttribute('data-dashboard-v2-part', 'ai-command-center');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'AI Command Center');

    const search = document.createElement('input');
    search.id = 'dashboardV2AiCommandCenterSearch';
    search.type = 'text';
    search.className = 'dashboard-v2-ai-search';
    search.setAttribute('data-dashboard-v2-part', 'ai-command-center-search');
    search.setAttribute('aria-label', 'Tanya AI (placeholder, belum aktif)');
    search.setAttribute('placeholder', '-- (placeholder)');
    search.readOnly = true;
    search.value = '';

    const actions = [
      { key: 'analyzeFinance', title: 'Analyze Finance' },
      { key: 'analyzeVehicle', title: 'Analyze Vehicle' },
      { key: 'generateReport', title: 'Generate Report' },
      { key: 'smartAssistant', title: 'Smart Assistant' },
    ];

    const actionCards = actions.map((action) => {
      const keyCap = action.key.charAt(0).toUpperCase() + action.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2AiCommandCenterAction${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-ai-action-card';
      card.setAttribute('data-dashboard-v2-part', `ai-command-center-action-${action.key}`);
      card.setAttribute('aria-label', `${action.title} (placeholder, belum aktif)`);
      card.disabled = true;
      card.textContent = action.title;

      return card;
    });

    const suggestion = document.createElement('div');
    suggestion.id = 'dashboardV2AiCommandCenterSuggestion';
    suggestion.className = 'dashboard-v2-ai-suggestion';
    suggestion.setAttribute('data-dashboard-v2-part', 'ai-command-center-suggestion');
    suggestion.textContent = '-- (placeholder)';

    const children = [search, ...actionCards, suggestion];

    // --- Tahap V2.25: AI Command Center Data Integration (additive) ------
    // 4 elemen BARU, anak AI Command Center, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19), _buildStatisticsPanel() (V2.20),
    // _buildRecentActivity() (V2.21), _buildUpcomingTasks() (V2.22),
    // _buildNotifications() (V2.23) & _buildAutomationCenter() (V2.24):
    // kalau fungsi adapter TERSEDIA (guard `typeof fn === 'function'`) DAN
    // mengembalikan objek (bukan `null`), tampilkan ringkasan sederhana
    // dari field-nya; kalau tidak, fallback ke teks placeholder — elemen
    // ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2AIFinanceData';
    financeEl.className = 'dashboard-v2-ai-action-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'ai-command-center-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2AIVehicleData';
    vehicleEl.className = 'dashboard-v2-ai-action-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'ai-command-center-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2AIFamilyData';
    familyEl.className = 'dashboard-v2-ai-action-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'ai-command-center-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2AIDocumentData';
    documentEl.className = 'dashboard-v2-ai-action-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'ai-command-center-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    children.push(financeEl, vehicleEl, familyEl, documentEl);

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...children);
    } else {
      children.forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildHealthScore(document) — Tahap V2.11: 1 skor lingkaran placeholder
  // ("Score: --") + subtitle statis ("Overall System Health") + 4 kartu
  // metrik placeholder (Finance, Vehicle, Documents, Family), masing2
  // berisi icon + title + status placeholder. Dirender sbg ANAK Main
  // Content Container (sejajar dgn komponen lain, setelah AI Command
  // Center V2.10). Kartu metrik memakai pola identik
  // _buildNotifications()/_buildAiCommandCenter(): `<button type="button"
  // disabled>`, TANPA onclick/addEventListener, TANPA routing ke
  // showPage(), TANPA FEATURE_REGISTRY, TANPA AI/fetch, TANPA business
  // logic, TANPA state baru. Seluruh teks statis.
  //
  // Tahap V2.26 (Health Score Data Integration, additive): 4 elemen BARU
  // ditambah sbg anak Health Score, satu per fungsi
  // dashboard-v2-data-adapter.js (V2.16) — getFinanceSummary/
  // getVehicleSummary/getFamilySummary/getDocumentSummary — dgn fallback
  // placeholder kalau adapter tidak tersedia/return `null`. 6 anak lama
  // (1 circular score + 1 subtitle + 4 metric card, Tahap V2.11) TIDAK
  // berubah.
  _buildHealthScore(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2HealthScore';
    section.className = 'dashboard-v2-health-score';
    section.setAttribute('data-dashboard-v2-part', 'health-score');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Health Score');

    const circle = document.createElement('div');
    circle.id = 'dashboardV2HealthScoreCircle';
    circle.className = 'dashboard-v2-health-score-circle';
    circle.setAttribute('data-dashboard-v2-part', 'health-score-circle');
    circle.setAttribute('aria-label', 'Skor kesehatan sistem (placeholder, belum ada data)');

    const scoreValue = document.createElement('span');
    scoreValue.id = 'dashboardV2HealthScoreValue';
    scoreValue.className = 'dashboard-v2-health-score-value';
    scoreValue.setAttribute('data-dashboard-v2-part', 'health-score-value');
    scoreValue.textContent = '--';

    if (typeof circle.replaceChildren === 'function') {
      circle.replaceChildren(scoreValue);
    } else {
      circle.appendChild(scoreValue);
    }

    const subtitle = document.createElement('div');
    subtitle.id = 'dashboardV2HealthScoreSubtitle';
    subtitle.className = 'dashboard-v2-health-score-subtitle';
    subtitle.setAttribute('data-dashboard-v2-part', 'health-score-subtitle');
    subtitle.textContent = 'Overall System Health';

    const metrics = [
      { key: 'finance', title: 'Finance', icon: '💰' },
      { key: 'vehicle', title: 'Vehicle', icon: '🚗' },
      { key: 'documents', title: 'Documents', icon: '📄' },
      { key: 'family', title: 'Family', icon: '👪' },
    ];

    const metricCards = metrics.map((metric) => {
      const keyCap = metric.key.charAt(0).toUpperCase() + metric.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2HealthScoreMetric${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-health-metric-card';
      card.setAttribute('data-dashboard-v2-part', `health-metric-${metric.key}`);
      card.setAttribute('aria-label', `${metric.title} (placeholder, belum ada data)`);
      card.disabled = true;

      const icon = document.createElement('span');
      icon.id = `dashboardV2HealthScoreMetric${keyCap}Icon`;
      icon.className = 'dashboard-v2-health-metric-icon';
      icon.setAttribute('data-dashboard-v2-part', `health-metric-${metric.key}-icon`);
      icon.textContent = metric.icon;

      const title = document.createElement('span');
      title.id = `dashboardV2HealthScoreMetric${keyCap}Title`;
      title.className = 'dashboard-v2-health-metric-title';
      title.setAttribute('data-dashboard-v2-part', `health-metric-${metric.key}-title`);
      title.textContent = metric.title;

      const status = document.createElement('span');
      status.id = `dashboardV2HealthScoreMetric${keyCap}Status`;
      status.className = 'dashboard-v2-health-metric-status';
      status.setAttribute('data-dashboard-v2-part', `health-metric-${metric.key}-status`);
      status.textContent = '-- (placeholder)';

      if (typeof card.replaceChildren === 'function') {
        card.replaceChildren(icon, title, status);
      } else {
        [icon, title, status].forEach((el) => card.appendChild(el));
      }

      return card;
    });

    const children = [circle, subtitle, ...metricCards];

    // --- Tahap V2.26: Health Score Data Integration (additive) ------------
    // 4 elemen BARU, anak Health Score, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19), _buildStatisticsPanel() (V2.20),
    // _buildRecentActivity() (V2.21), _buildUpcomingTasks() (V2.22),
    // _buildNotifications() (V2.23), _buildAutomationCenter() (V2.24) &
    // _buildAiCommandCenter() (V2.25): kalau fungsi adapter TERSEDIA (guard
    // `typeof fn === 'function'`) DAN mengembalikan objek (bukan `null`),
    // tampilkan ringkasan sederhana dari field-nya; kalau tidak, fallback
    // ke teks placeholder — elemen ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2HealthFinanceData';
    financeEl.className = 'dashboard-v2-health-metric-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'health-metric-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2HealthVehicleData';
    vehicleEl.className = 'dashboard-v2-health-metric-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'health-metric-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2HealthFamilyData';
    familyEl.className = 'dashboard-v2-health-metric-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'health-metric-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2HealthDocumentData';
    documentEl.className = 'dashboard-v2-health-metric-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'health-metric-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    children.push(financeEl, vehicleEl, familyEl, documentEl);

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...children);
    } else {
      children.forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildPredictiveInsights(document) — Tahap V2.12: 5 kartu insight
  // prediktif placeholder (Cash Flow Forecast, Budget Trend, Vehicle
  // Maintenance Prediction, Family Schedule Prediction, Document
  // Expiration Prediction). Dirender sbg ANAK Main Content Container
  // (sejajar dgn komponen lain, setelah Health Score Widget V2.11).
  // Kartu memakai pola identik _buildNotifications()/
  // _buildAiCommandCenter()/_buildHealthScore(): `<button type="button"
  // disabled>`, TANPA onclick/addEventListener, TANPA routing ke
  // showPage(), TANPA FEATURE_REGISTRY, TANPA AI/fetch, TANPA business
  // logic, TANPA state baru. Seluruh teks statis.
  _buildPredictiveInsights(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2PredictiveInsights';
    section.className = 'dashboard-v2-predictive-insights';
    section.setAttribute('data-dashboard-v2-part', 'predictive-insights');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Predictive Insights');

    const insights = [
      { key: 'cashFlowForecast', title: 'Cash Flow Forecast', icon: '📈' },
      { key: 'budgetTrend', title: 'Budget Trend', icon: '📊' },
      { key: 'vehicleMaintenancePrediction', title: 'Vehicle Maintenance Prediction', icon: '🚗' },
      { key: 'familySchedulePrediction', title: 'Family Schedule Prediction', icon: '👪' },
      { key: 'documentExpirationPrediction', title: 'Document Expiration Prediction', icon: '📄' },
    ];

    const cards = insights.map((insight) => {
      const keyCap = insight.key.charAt(0).toUpperCase() + insight.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2PredictiveInsightsCard${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-predictive-card';
      card.setAttribute('data-dashboard-v2-part', `predictive-card-${insight.key}`);
      card.setAttribute('aria-label', `${insight.title} (placeholder, belum ada data)`);
      card.disabled = true;

      const icon = document.createElement('span');
      icon.id = `dashboardV2PredictiveInsightsCard${keyCap}Icon`;
      icon.className = 'dashboard-v2-predictive-icon';
      icon.setAttribute('data-dashboard-v2-part', `predictive-card-${insight.key}-icon`);
      icon.textContent = insight.icon;

      const title = document.createElement('span');
      title.id = `dashboardV2PredictiveInsightsCard${keyCap}Title`;
      title.className = 'dashboard-v2-predictive-title';
      title.setAttribute('data-dashboard-v2-part', `predictive-card-${insight.key}-title`);
      title.textContent = insight.title;

      const prediction = document.createElement('span');
      prediction.id = `dashboardV2PredictiveInsightsCard${keyCap}Prediction`;
      prediction.className = 'dashboard-v2-predictive-prediction';
      prediction.setAttribute('data-dashboard-v2-part', `predictive-card-${insight.key}-prediction`);
      prediction.textContent = '--';

      const confidence = document.createElement('span');
      confidence.id = `dashboardV2PredictiveInsightsCard${keyCap}Confidence`;
      confidence.className = 'dashboard-v2-predictive-confidence';
      confidence.setAttribute('data-dashboard-v2-part', `predictive-card-${insight.key}-confidence`);
      confidence.textContent = '--';

      const recommendation = document.createElement('span');
      recommendation.id = `dashboardV2PredictiveInsightsCard${keyCap}Recommendation`;
      recommendation.className = 'dashboard-v2-predictive-recommendation';
      recommendation.setAttribute('data-dashboard-v2-part', `predictive-card-${insight.key}-recommendation`);
      recommendation.textContent = '-- (placeholder)';

      if (typeof card.replaceChildren === 'function') {
        card.replaceChildren(icon, title, prediction, confidence, recommendation);
      } else {
        [icon, title, prediction, confidence, recommendation].forEach((el) => card.appendChild(el));
      }

      return card;
    });

    // --- Tahap V2.27: Predictive Insights Data Integration (additive) -----
    // 4 elemen BARU, anak Predictive Insights, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19), _buildStatisticsPanel() (V2.20),
    // _buildRecentActivity() (V2.21), _buildUpcomingTasks() (V2.22),
    // _buildNotifications() (V2.23), _buildAutomationCenter() (V2.24),
    // _buildAiCommandCenter() (V2.25) & _buildHealthScore() (V2.26): kalau
    // fungsi adapter TERSEDIA (guard `typeof fn === 'function'`) DAN
    // mengembalikan objek (bukan `null`), tampilkan ringkasan sederhana dari
    // field-nya; kalau tidak, fallback ke teks placeholder — elemen ini
    // SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2PredictiveFinanceData';
    financeEl.className = 'dashboard-v2-predictive-data-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'predictive-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2PredictiveVehicleData';
    vehicleEl.className = 'dashboard-v2-predictive-data-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'predictive-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2PredictiveFamilyData';
    familyEl.className = 'dashboard-v2-predictive-data-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'predictive-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2PredictiveDocumentData';
    documentEl.className = 'dashboard-v2-predictive-data-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'predictive-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    const allChildren = [...cards, financeEl, vehicleEl, familyEl, documentEl];

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...allChildren);
    } else {
      allChildren.forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildAutomationCenter(document) — Tahap V2.13: 5 kartu automation
  // placeholder (Auto Backup, Monthly Report, Budget Reminder, Vehicle
  // Service Reminder, Document Renewal Reminder). Dirender sbg ANAK Main
  // Content Container (sejajar dgn komponen lain, setelah Predictive
  // Insights V2.12). Kartu memakai pola identik
  // _buildNotifications()/_buildAiCommandCenter()/_buildHealthScore()/
  // _buildPredictiveInsights(): `<button type="button" disabled>`, TANPA
  // onclick/addEventListener, TANPA routing ke showPage(), TANPA
  // FEATURE_REGISTRY, TANPA AI/fetch, TANPA business logic, TANPA state
  // baru. Seluruh teks statis.
  _buildAutomationCenter(document) {
    const section = document.createElement('section');
    section.id = 'dashboardV2AutomationCenter';
    section.className = 'dashboard-v2-automation-center';
    section.setAttribute('data-dashboard-v2-part', 'automation-center');
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Automation Center');

    const automations = [
      { key: 'autoBackup', title: 'Auto Backup', icon: '💾', description: 'Backup otomatis data (placeholder)' },
      { key: 'monthlyReport', title: 'Monthly Report', icon: '📋', description: 'Laporan bulanan otomatis (placeholder)' },
      { key: 'budgetReminder', title: 'Budget Reminder', icon: '💰', description: 'Pengingat anggaran (placeholder)' },
      { key: 'vehicleServiceReminder', title: 'Vehicle Service Reminder', icon: '🚗', description: 'Pengingat servis kendaraan (placeholder)' },
      { key: 'documentRenewalReminder', title: 'Document Renewal Reminder', icon: '📄', description: 'Pengingat perpanjangan dokumen (placeholder)' },
    ];

    const cards = automations.map((automation) => {
      const keyCap = automation.key.charAt(0).toUpperCase() + automation.key.slice(1);

      const card = document.createElement('button');
      card.id = `dashboardV2AutomationCenterCard${keyCap}`;
      card.type = 'button';
      card.className = 'dashboard-v2-automation-card';
      card.setAttribute('data-dashboard-v2-part', `automation-card-${automation.key}`);
      card.setAttribute('aria-label', `${automation.title} (placeholder, belum aktif)`);
      card.disabled = true;

      const icon = document.createElement('span');
      icon.id = `dashboardV2AutomationCenterCard${keyCap}Icon`;
      icon.className = 'dashboard-v2-automation-icon';
      icon.setAttribute('data-dashboard-v2-part', `automation-card-${automation.key}-icon`);
      icon.textContent = automation.icon;

      const title = document.createElement('span');
      title.id = `dashboardV2AutomationCenterCard${keyCap}Title`;
      title.className = 'dashboard-v2-automation-title';
      title.setAttribute('data-dashboard-v2-part', `automation-card-${automation.key}-title`);
      title.textContent = automation.title;

      const schedule = document.createElement('span');
      schedule.id = `dashboardV2AutomationCenterCard${keyCap}Schedule`;
      schedule.className = 'dashboard-v2-automation-schedule';
      schedule.setAttribute('data-dashboard-v2-part', `automation-card-${automation.key}-schedule`);
      schedule.textContent = '--';

      const status = document.createElement('span');
      status.id = `dashboardV2AutomationCenterCard${keyCap}Status`;
      status.className = 'dashboard-v2-automation-status';
      status.setAttribute('data-dashboard-v2-part', `automation-card-${automation.key}-status`);
      status.textContent = 'Disabled';

      const description = document.createElement('span');
      description.id = `dashboardV2AutomationCenterCard${keyCap}Description`;
      description.className = 'dashboard-v2-automation-description';
      description.setAttribute('data-dashboard-v2-part', `automation-card-${automation.key}-description`);
      description.textContent = automation.description;

      if (typeof card.replaceChildren === 'function') {
        card.replaceChildren(icon, title, schedule, status, description);
      } else {
        [icon, title, schedule, status, description].forEach((el) => card.appendChild(el));
      }

      return card;
    });

    // --- Tahap V2.24: Automation Center Data Integration (additive) ------
    // 4 elemen BARU, anak Automation Center, satu per fungsi
    // dashboard-v2-data-adapter.js (V2.16). Pola guard & fallback identik
    // dgn _buildHero() (V2.17), _buildSummaryCards() (V2.18),
    // _buildModuleGrid() (V2.19), _buildStatisticsPanel() (V2.20),
    // _buildRecentActivity() (V2.21), _buildUpcomingTasks() (V2.22) &
    // _buildNotifications() (V2.23): kalau fungsi adapter TERSEDIA (guard
    // `typeof fn === 'function'`) DAN mengembalikan objek (bukan `null`),
    // tampilkan ringkasan sederhana dari field-nya; kalau tidak, fallback ke
    // teks placeholder — elemen ini SELALU ada & SELALU punya teks.
    const financeSummary = (typeof getFinanceSummary === 'function') ? getFinanceSummary() : null;
    const financeEl = document.createElement('div');
    financeEl.id = 'dashboardV2AutomationFinanceData';
    financeEl.className = 'dashboard-v2-automation-card';
    financeEl.setAttribute('data-dashboard-v2-part', 'automation-card-finance-data');
    if (financeSummary && typeof financeSummary === 'object') {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan');
      financeEl.textContent = `Keuangan: ${financeSummary.accountCount} akun, Rp ${financeSummary.totalBalance}, ${financeSummary.transactionCount} transaksi`;
    } else {
      financeEl.setAttribute('aria-label', 'Ringkasan Keuangan (placeholder, belum ada data)');
      financeEl.textContent = 'Keuangan: -- (placeholder)';
    }

    const vehicleSummary = (typeof getVehicleSummary === 'function') ? getVehicleSummary() : null;
    const vehicleEl = document.createElement('div');
    vehicleEl.id = 'dashboardV2AutomationVehicleData';
    vehicleEl.className = 'dashboard-v2-automation-card';
    vehicleEl.setAttribute('data-dashboard-v2-part', 'automation-card-vehicle-data');
    if (vehicleSummary && typeof vehicleSummary === 'object') {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan');
      vehicleEl.textContent = `Kendaraan: ${vehicleSummary.vehicleCount} kendaraan, ${vehicleSummary.bbmLogCount} catatan BBM, ${vehicleSummary.servisLogCount} catatan servis`;
    } else {
      vehicleEl.setAttribute('aria-label', 'Ringkasan Kendaraan (placeholder, belum ada data)');
      vehicleEl.textContent = 'Kendaraan: -- (placeholder)';
    }

    const familySummary = (typeof getFamilySummary === 'function') ? getFamilySummary() : null;
    const familyEl = document.createElement('div');
    familyEl.id = 'dashboardV2AutomationFamilyData';
    familyEl.className = 'dashboard-v2-automation-card';
    familyEl.setAttribute('data-dashboard-v2-part', 'automation-card-family-data');
    if (familySummary && typeof familySummary === 'object') {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga');
      familyEl.textContent = `Keluarga: ${familySummary.anakCount} anak, ${familySummary.milestoneDoneCount}/${familySummary.milestoneTotalCount} milestone, ${familySummary.reminderCount} pengingat`;
    } else {
      familyEl.setAttribute('aria-label', 'Ringkasan Keluarga (placeholder, belum ada data)');
      familyEl.textContent = 'Keluarga: -- (placeholder)';
    }

    const documentSummary = (typeof getDocumentSummary === 'function') ? getDocumentSummary() : null;
    const documentEl = document.createElement('div');
    documentEl.id = 'dashboardV2AutomationDocumentData';
    documentEl.className = 'dashboard-v2-automation-card';
    documentEl.setAttribute('data-dashboard-v2-part', 'automation-card-document-data');
    if (documentSummary && typeof documentSummary === 'object') {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen');
      documentEl.textContent = `Dokumen: ${documentSummary.simCount} SIM, ${documentSummary.vehicleTaxDocCount} dokumen pajak kendaraan`;
    } else {
      documentEl.setAttribute('aria-label', 'Ringkasan Dokumen (placeholder, belum ada data)');
      documentEl.textContent = 'Dokumen: -- (placeholder)';
    }

    if (typeof section.replaceChildren === 'function') {
      section.replaceChildren(...cards, financeEl, vehicleEl, familyEl, documentEl);
    } else {
      [...cards, financeEl, vehicleEl, familyEl, documentEl].forEach((el) => section.appendChild(el));
    }

    return section;
  },

  // _buildMain(document) — Main Content Container, membungkus Hero V2
  // (V2.2) + Summary Cards + Quick Actions (V2.3) + Module Grid + Insight
  // Panel (V2.4) + Recent Activity (V2.6) + Statistics Panel (V2.7) +
  // Upcoming Tasks (V2.8) + Notifications Center (V2.9) + AI Command
  // Center (V2.10) + Health Score Widget (V2.11) + Predictive Insights
  // (V2.12) + Automation Center (V2.13). Wrapper struktural saja
  // (`role="main"`), belum memindahkan elemen dashhub-* existing ke
  // dalamnya (tetap di luar scope tahap ini).
  _buildMain(document) {
    const main = document.createElement('main');
    main.id = 'dashboardV2Main';
    main.className = 'dashboard-v2-main';
    main.setAttribute('data-dashboard-v2-part', 'main');
    main.setAttribute('role', 'main');
    main.setAttribute('aria-label', 'Konten utama Dashboard V2 (placeholder, belum aktif)');

    const hero = this._buildHero(document);
    const summaryCards = this._buildSummaryCards(document);
    const quickActions = this._buildQuickActions(document);
    const moduleGrid = this._buildModuleGrid(document);
    const insightPanel = this._buildInsightPanel(document);
    const recentActivity = this._buildRecentActivity(document);
    const statisticsPanel = this._buildStatisticsPanel(document);
    const upcomingTasks = this._buildUpcomingTasks(document);
    const notifications = this._buildNotifications(document);
    const aiCommandCenter = this._buildAiCommandCenter(document);
    const healthScore = this._buildHealthScore(document);
    const predictiveInsights = this._buildPredictiveInsights(document);
    const automationCenter = this._buildAutomationCenter(document);

    if (typeof main.replaceChildren === 'function') {
      main.replaceChildren(hero, summaryCards, quickActions, moduleGrid, insightPanel, recentActivity, statisticsPanel, upcomingTasks, notifications, aiCommandCenter, healthScore, predictiveInsights, automationCenter);
    } else {
      [hero, summaryCards, quickActions, moduleGrid, insightPanel, recentActivity, statisticsPanel, upcomingTasks, notifications, aiCommandCenter, healthScore, predictiveInsights, automationCenter].forEach((el) => main.appendChild(el));
    }

    return main;
  },

  // destroy() — lepas root container dari DOM & reset state internal,
  // supaya init() berikutnya membangun instance yang benar-benar bersih.
  destroy() {
    if (this._root && this._root.parentNode && typeof this._root.parentNode.removeChild === 'function') {
      this._root.parentNode.removeChild(this._root);
    }
    this._root = null;
  },

  // navigateTo(pageName, el) — Tahap V2.43: satu-satunya cara Bottom
  // Navigation V2 (`_buildBottomNav`) berpindah halaman, dipanggil lewat
  // `data-action="DashboardV2Shell.navigateTo"` (global click-delegation
  // yg sudah ada di features-helpers-global-security.js, BUKAN
  // addEventListener baru). Kontrak (persetujuan eksplisit user, lihat
  // DASHBOARD-V2-BOTTOMNAV-WIREUP.md):
  //   - Selalu memanggil `showPage(pageName, el)` (fungsi global existing
  //     di modal-navigasi.js) — routing SAMA PERSIS dgn `#mainNav` lama,
  //     tidak ada logic routing baru/duplikat.
  //   - Kalau tujuannya BUKAN 'dashboard-hub' (Finance/Vehicle/More):
  //     Dashboard V2 sengaja DIKELUARKAN (disableDashboardV2() +
  //     this.destroy()) supaya halaman tujuan yg sebenarnya terlihat —
  //     tanpa ini, overlay penuh-layar Dashboard V2 (lihat
  //     DASHBOARD-V2-OVERLAY-FIX.md, `position:fixed;inset:0`) akan tetap
  //     menutupi halaman yg baru diaktifkan showPage(). Untuk kembali ke
  //     Dashboard V2, user memakai toggle "Dashboard V2 aktif" yg sudah
  //     ada di Dashboard Hub (tidak ada mekanisme re-entry baru dibuat
  //     tahap ini).
  //   - Kalau tujuannya 'dashboard-hub' (tombol Home): hanya showPage(),
  //     Dashboard V2 TETAP aktif/terlihat (Home = Dashboard V2 itu
  //     sendiri, tidak ada alasan menyembunyikannya).
  //   - Toleran-guard: no-op aman kalau showPage()/disableDashboardV2()
  //     belum ter-load (pola sama dgn guard lain di file ini).
  navigateTo(pageName, el) {
    if (typeof pageName !== 'string' || !pageName) return;
    if (typeof showPage === 'function') {
      showPage(pageName, el);
    } else if (typeof window !== 'undefined' && typeof window.showPage === 'function') {
      window.showPage(pageName, el);
    }

    if (pageName !== 'dashboard-hub') {
      if (typeof disableDashboardV2 === 'function') {
        disableDashboardV2();
      } else if (typeof window !== 'undefined' && typeof window.disableDashboardV2 === 'function') {
        window.disableDashboardV2();
      }
      this.destroy();
    }
  },

  // refresh() — Tahap V2.28: perbarui ISI panel-panel yg memakai
  // dashboard-v2-data-adapter.js (Hero/Summary Cards/Module Grid/
  // Statistics Panel/Recent Activity/Upcoming Tasks/Notifications/AI
  // Command Center/Health Score/Predictive Insights/Automation Center)
  // TANPA destroy()/init()/render() ulang & TANPA membuat root/main baru.
  // Lihat blok komentar "Tahap V2.28" di atas utk kontrak lengkap.
  refresh() {
    // No-op kalau belum pernah init() (root belum ada / sudah ter-detach
    // dari DOM) — sengaja TIDAK memanggil this.init() di sini.
    if (!this._root || !this._root.parentNode) return null;
    if (typeof document === 'undefined' || !document) return null;

    const root = this._root;

    // Cari anak `main` yg sudah ada (dibuat render()) tanpa query
    // DOM global apa pun — cukup telusuri root.children sendiri (5
    // komponen top-level, urutan tetap dari render()). Kalau belum ketemu
    // berarti render() belum pernah dipanggil -> no-op, sengaja TIDAK
    // memanggil this.render() di sini.
    const children = root.children || [];
    let main = null;
    for (let i = 0; i < children.length; i++) {
      if (children[i] && children[i].id === 'dashboardV2Main') {
        main = children[i];
        break;
      }
    }
    if (!main) return null;

    // Bangun ulang isi Main dari builder existing (_buildMain, tidak
    // diubah/di-refactor sama sekali) — builder inilah yg (lewat guard
    // `typeof fn === 'function'`) memanggil getFinanceSummary()/
    // getVehicleSummary()/getFamilySummary()/getDocumentSummary(); refresh()
    // sendiri tidak pernah membaca `D` atau fungsi adapter secara langsung.
    const freshMain = this._buildMain(document);
    const freshChildren = freshMain && freshMain.children ? Array.prototype.slice.call(freshMain.children) : [];

    // Pindahkan children baru itu ke node `main` yg SUDAH ADA (identitas
    // `main` — dan root/sidebar/header/bottomNav/fab — tidak berubah sama
    // sekali; hanya isi/children `main` yg diganti), pola sama persis dgn
    // yg dipakai render() sendiri (replaceChildren, fallback manual).
    if (typeof main.replaceChildren === 'function') {
      main.replaceChildren(...freshChildren);
    } else {
      while (main.firstChild) main.removeChild(main.firstChild);
      freshChildren.forEach((el) => main.appendChild(el));
    }

    return main;
  },

  // startAutoRefresh(intervalMs?) — Tahap V2.29: mulai timer periodik yg
  // memanggil this.refresh() (V2.28, tidak diubah/di-refactor) tiap
  // `intervalMs` ms (default AUTO_REFRESH_DEFAULT_MS). Idempotent: kalau
  // sudah ada timer aktif, timer lama dibersihkan dulu (stopAutoRefresh())
  // sebelum bikin yg baru — tidak pernah menumpuk lebih dari 1 timer.
  // Lihat blok komentar "Tahap V2.29" di atas utk kontrak lengkap.
  startAutoRefresh(intervalMs) {
    if (typeof setInterval !== 'function') return null;

    this.stopAutoRefresh();

    const ms = (typeof intervalMs === 'number' && intervalMs > 0) ? intervalMs : this.AUTO_REFRESH_DEFAULT_MS;
    const self = this;
    this._autoRefreshTimer = setInterval(() => {
      self.refresh();
    }, ms);

    return this._autoRefreshTimer;
  },

  // stopAutoRefresh() — Tahap V2.29: hentikan timer periodik (kalau ada)
  // yg dibuat startAutoRefresh(). Aman dipanggil berkali-kali / sebelum
  // pernah start (no-op, return null).
  stopAutoRefresh() {
    if (this._autoRefreshTimer !== null && typeof clearInterval === 'function') {
      clearInterval(this._autoRefreshTimer);
    }
    this._autoRefreshTimer = null;
    return null;
  },

  // isAutoRefreshActive() — Tahap V2.29: murni membaca state timer (tidak
  // membuat/menghapus timer apa pun).
  isAutoRefreshActive() {
    return this._autoRefreshTimer !== null;
  },
};

if (typeof window !== 'undefined') {
  window.DashboardV2Shell = DashboardV2Shell;
}
