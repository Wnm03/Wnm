// dashboard-v2-activation.js — Tahap V2.14A: Dashboard V2 Activation Framework
// (lihat DASHBOARD-V2-ACTIVATION.md).
//
// TUJUAN: menyiapkan SATU feature flag internal in-memory supaya Dashboard
// V2 (dashboard-v2-shell.js, dkk — dormant sejak V2.1) BISA diaktifkan di
// tahap integrasi berikutnya, TANPA menggantikan Dashboard lama sekarang.
//
// SCOPE tahap ini (persis, tidak lebih):
//   - isDashboardV2Enabled() — baca state flag, default false.
//   - enableDashboardV2()   — set state flag jadi true. Idempotent.
//   - disableDashboardV2()  — set state flag jadi false. Idempotent.
// Itu saja. TIDAK ADA logic lain di file ini.
//
// KENAPA IN-MEMORY (bukan localStorage/cookie/query-param):
//   Tahap ini murni menyiapkan MEKANISME flag-nya saja, belum menyiapkan
//   *persistensi* atau *cara mengaktifkan dari luar* (mis. lewat UI/URL) —
//   itu di luar scope RFC tahap ini ("mekanisme aktivasi ... melalui satu
//   feature flag internal"). State disimpan di closure top-level file ini,
//   reset ke false setiap kali file di-load ulang (reload halaman/proses
//   baru) — konsisten dgn "default: false" yg diminta eksplisit.
//
// TIDAK melakukan (secara sengaja, additive-only):
//   - TIDAK menyentuh FEATURE_REGISTRY (dashboard-hub-registry.js) sama
//     sekali — tidak dibaca, tidak ditulis, tidak direferensikan.
//   - TIDAK memanggil showPage() atau logic routing apa pun.
//   - TIDAK menyentuh dashboard-hub.js, index.html, app_production.html.
//   - TIDAK menghubungkan data (D.profile/D.transactions/dst) — flag ini
//     murni boolean, tidak baca sumber data apa pun.
//   - TIDAK mem-instantiate/memanggil DashboardV2Shell (init/render/
//     destroy) — hanya menyediakan flag yg NANTI dibaca oleh tahap wiring
//     terpisah. Mengaktifkan flag ini SENDIRIAN tidak menampilkan apa pun,
//     karena tidak ada kode lain di repo yg membaca flag ini di tahap ini.
//   - Dashboard lama (Dashboard Hub existing) tetap 100% default & aktif,
//     tidak terpengaruh flag ini sama sekali.
//
// Pola API sengaja meniru gaya modul lain di repo ini (fungsi top-level
// biasa, bukan class/module.exports) supaya konsisten dgn cara file2 app
// lain diload (lihat tests/helpers/loadSource.js — top-level `function`
// otomatis nempel ke context vm/window tanpa perlu export eksplisit).

let _dashboardV2Enabled = false;

// isDashboardV2Enabled() — baca state flag saat ini. Default: false.
function isDashboardV2Enabled() {
  return _dashboardV2Enabled === true;
}

// enableDashboardV2() — set flag jadi true. Idempotent: memanggil berkali-
// kali saat sudah true tidak mengubah apa pun selain (tetap) true.
function enableDashboardV2() {
  _dashboardV2Enabled = true;
  return _dashboardV2Enabled;
}

// disableDashboardV2() — set flag jadi false (kembali ke default).
// Idempotent: memanggil berkali-kali saat sudah false tidak mengubah apa
// pun selain (tetap) false.
function disableDashboardV2() {
  _dashboardV2Enabled = false;
  return _dashboardV2Enabled;
}

if (typeof window !== 'undefined') {
  window.isDashboardV2Enabled = isDashboardV2Enabled;
  window.enableDashboardV2 = enableDashboardV2;
  window.disableDashboardV2 = disableDashboardV2;
}
