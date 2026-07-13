// dashboard-hub.js — Dashboard Feature Hub (blueprint-dashboard-hub.md §5)
//
// STATUS (update v1.0-stabilization, build v234): sejak Tahap 4, halaman ini
// SUDAH jadi landing page default (satu-satunya class="page active" saat
// startup, lihat tests/dashboard-hub-default-landing.test.js) & tombol
// Beranda di bottom-nav sudah menunjuk ke sini. page-dashboard lama TIDAK
// dihapus — tetap ada di DOM (cuma tidak aktif), krn sebagian shortcut (mis.
// "Saldo Akun") datanya belum dipindah ke hub. Entry cadangan "🧭 Buka
// Dashboard Hub" di Pengaturan > Diagnostik juga masih sengaja dipertahankan
// (peninggalan Tahap 1, kini jadi jalur akses cadangan) — lihat catatan di
// index.html/app_production.html & tests/dashboard-hub-default-landing.test.js.
// Semua navigasi kartu fitur REUSE showPage/setKeuanganTab/setShopTab/
// setCnTab/setPajakTab/toggleStgGroup yang sudah ada — tidak menulis ulang
// logic halaman manapun (blueprint §5, §7).
//
// PENTING — Opsi 1 (keputusan sesi ini): dashboard-hub-registry.js TIDAK
// diubah. FEATURE_REGISTRY[].navIdx adalah index KATEGORI taksonomi §1
// (0-9), BUKAN index nav-item bottom-nav asli (cuma 7 nav-item nyata ada di
// DOM: dashboard/keuangan/shop/ai/carnotes/pajak/settings). Memakai
// cat.navIdx langsung ke showPage(page, navItems[cat.navIdx]) akan salah
// highlight nav-item untuk kategori yang tidak py nav-item sendiri (Bisnis,
// Aset, Personal, Backup). Sebagai gantinya dipakai lookup lokal
// PAGE_NAV_IDX di bawah, dikunci ke NAMA PAGE (target.page), bukan ke
// kategori.

const PAGE_NAV_IDX = {
  dashboard: 0,
  keuangan: 1,
  shop: 2,
  ai: 3,
  carnotes: 4,
  pajak: 5,
  settings: 6,
};

// Index tombol tab (.cn-tab) sesuai URUTAN DOM asli di tiap halaman —
// diverifikasi lewat grep ke index.html (lihat komentar TAB REFERENSI di
// dashboard-hub-registry.js untuk daftar tab yang valid per page).
const KEU_TAB_IDX = { kelola: 0, laporan: 1 };
const SHOP_TAB_IDX = { kasir: 0, jual: 1, etalase: 2, produsen: 3, riwayat: 4, pelanggan: 5 };
const CN_TAB_IDX = { bbm: 0, servis: 1 };
const PAJAK_TAB_IDX = { zakat: 0, pajak: 1 };

// Resolve string action ("openTxModal" atau "WorthIt.open") jadi pemanggilan
// fungsi nyata, dgn `this` yg benar kalau namespaced (pola sama dgn
// dispatcher data-action global di features-helpers-global-security.js).
// Tahap 3, Langkah 8 — helper murni baca-saja, dipakai render() utk state
// awal ★ tiap kartu. Sengaja guarded (typeof check): file ini juga dipakai
// tests/dashboard-hub.test.js tanpa DashboardHubFavorit di-inject, harus
// tetap aman (dianggap "tidak ada yang difavoritkan"), bukan throw.
function _dashHubIsFav(key) {
  if (typeof DashboardHubFavorit === 'undefined') return false;
  return DashboardHubFavorit.getFavoritKeys().indexOf(key) !== -1;
}

function _dashHubCallAction(name) {
  if (!name) return;
  const path = String(name).split('.');
  let owner = window, fn = window;
  for (const p of path) { owner = fn; fn = fn ? fn[p] : undefined; }
  if (typeof fn === 'function') fn.call(owner);
  else console.warn('DashboardHub: action tidak ditemukan:', name);
}

function dashHubNavigateToFeature(target) {
  if (!target) return;
  if (!target.page) {
    // Fitur modal-only (mis. WorthIt.open), tidak attach ke page manapun.
    if (target.action) _dashHubCallAction(target.action);
    return;
  }
  const navItems = document.querySelectorAll('.nav-item');
  showPage(target.page, navItems[PAGE_NAV_IDX[target.page]] || null);

  if (target.tab) {
    if (target.page === 'keuangan') {
      const tabs = document.querySelectorAll('#page-keuangan .cn-tab');
      setKeuanganTab(target.tab, tabs[KEU_TAB_IDX[target.tab]]);
    } else if (target.page === 'shop') {
      const tabs = document.querySelectorAll('#page-shop .cn-tab');
      setShopTab(target.tab, tabs[SHOP_TAB_IDX[target.tab]]);
    } else if (target.page === 'carnotes') {
      const tabs = document.querySelectorAll('#page-carnotes .cn-tab');
      setCnTab(target.tab, tabs[CN_TAB_IDX[target.tab]]);
    } else if (target.page === 'pajak') {
      const tabs = document.querySelectorAll('#page-pajak .cn-tab');
      setPajakTab(target.tab, tabs[PAJAK_TAB_IDX[target.tab]]);
    }
  }

  if (target.group && typeof toggleStgGroup === 'function') {
    const g = document.getElementById(target.group);
    if (g && !g.classList.contains('open')) toggleStgGroup(target.group);
  }

  // goTo/action dijadwalkan sedikit belakangan (pola sama dgn goToList() di
  // filter-laporan.js) supaya DOM halaman tujuan sempat selesai dirender.
  setTimeout(() => {
    if (target.goTo) {
      const el = document.getElementById(target.goTo);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.remove('flash-highlight');
        void el.offsetWidth;
        el.classList.add('flash-highlight');
        setTimeout(() => el.classList.remove('flash-highlight'), 1200);
      }
    }
    if (target.action) _dashHubCallAction(target.action);
  }, 150);
}

const DashboardHub = {
  render() {
    const el = document.getElementById('dashboardHubGrid');
    if (!el) return;
    if (typeof FEATURE_REGISTRY === 'undefined' || !FEATURE_REGISTRY.length) {
      el.innerHTML = '<div class="empty"><div class="empty-text">Belum ada data fitur</div></div>';
      return;
    }
    el.innerHTML = FEATURE_REGISTRY.map(cat => `
      <div class="dashhub-cat" id="dashHubCat-${escapeHtml(cat.key)}">
        <div class="dashhub-cat-head">
          <div class="dashhub-cat-icon">${cat.icon}</div>
          <div>
            <div class="dashhub-cat-label">${escapeHtml(cat.label)}</div>
            <div class="dashhub-cat-desc">${escapeHtml(cat.desc)}</div>
          </div>
        </div>
        <div class="dashhub-feature-grid">
          ${cat.features.map(f => `
            <div class="dashhub-feature-card" data-action="DashboardHub.open" data-args='${escapeHtml(JSON.stringify([f.key]))}'>
              <div class="dashhub-fav-star${_dashHubIsFav(f.key) ? ' is-fav' : ''}" data-stop data-action="DashboardHubFavoritView.toggle" data-args='${escapeHtml(JSON.stringify([f.key]))}'>★</div>
              <div class="dashhub-feature-name">${escapeHtml(f.label)}</div>
              <div class="dashhub-feature-desc">${escapeHtml(f.desc)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // LifeOS (section terpisah, lihat #lifeOSWrap di index.html/
    // app_production.html & lifeos/ui/lifeos-home.js). Tambahan murni —
    // tidak mengubah baris manapun di atas.
    if (typeof LifeOSHome !== 'undefined') LifeOSHome.render();

    // Favorit (Tahap 3, Langkah 7-8, lihat dashboard-hub-favorit-view.js).
    // Tambahan murni, pola sama dgn LifeOSHome.render() di atas — tidak
    // mengubah baris manapun sebelum ini.
    if (typeof DashboardHubFavoritView !== 'undefined') DashboardHubFavoritView.render();
  },

  // Kontrak resolusi ADR-001 §4 — SATU-SATUNYA entry point publik navigasi.
  // Urutan (kategori dulu baru leaf) dipilih krn kategori himpunan lebih
  // kecil & lebih murah dicek; invariant uniqueness key global (§2.1,
  // dijaga tests/dashboard-hub-registry.test.js) menjamin urutan ini TIDAK
  // mengubah hasil apa pun kalau dibalik — leaf & cat.key tidak pernah
  // tabrakan. Parameter tetap diterima sbg "key" generik (bisa cat.key
  // ATAUPUN f.key) — nama parameter berubah dari `featureKey` ke `key`
  // murni penjelasan internal, bukan perubahan API publik (nama fungsi &
  // arity `open(x)` sama persis, dipanggil sama persis dari markup lewat
  // data-action="DashboardHub.open").
  open(key) {
    if (typeof FEATURE_REGISTRY === 'undefined') return;

    // 1. Cari dulu di antara cat.key seluruh kategori.
    const cat = FEATURE_REGISTRY.find((c) => c.key === key);
    if (cat) {
      if (cat.target) {
        // Ketemu, dan kategori itu punya target -> "app-level open".
        dashHubNavigateToFeature(cat.target);
        return;
      }
      // Ketemu, tapi kategori itu TIDAK punya target -> key valid sbg
      // identitas taksonomi (mis. 'personal', 'aset'), tapi bukan sesuatu
      // yang bisa "dibuka". SENGAJA beda pesan dari "key tidak ditemukan"
      // di bawah (§4 poin 1) supaya salah kurasi Favorit (pilih kategori
      // tanpa target) gampang dibedakan dari salah ketik key.
      console.warn('DashboardHub: kategori ini bukan target yang bisa dibuka langsung (belum diberi target):', key);
      return;
    }

    // 2. Tidak ketemu di kategori -> cari di antara f.key seluruh
    // cat.features di seluruh kategori (perilaku ini identik dgn
    // DashboardHub.open() sebelum Langkah 3, tidak berubah).
    for (const c of FEATURE_REGISTRY) {
      const f = c.features.find((x) => x.key === key);
      if (f) { dashHubNavigateToFeature(f.target); return; }
    }

    // 3. Tidak ketemu di kategori maupun leaf -> key benar-benar tidak
    // dikenal di registry manapun (perilaku lama, tidak berubah).
    console.warn('DashboardHub: featureKey tidak ditemukan di FEATURE_REGISTRY:', key);
  },
};
