// ui/knowledge.js — render lewat knowledge-adapter.js; aksi simpan/hapus
// HANYA lewat services/knowledge-service.js. D.catatan ditampilkan sebagai
// referensi read-only, tidak pernah dimigrasikan ke sini.

const LifeOSKnowledge = {
  render() {
    const el = document.getElementById('lifeOSKnowledgeList');
    if (!el) return;
    const store = lifeOSGetStore();
    const entries = knowledgeAdapterList(store);
    el.innerHTML = entries.length
      ? entries.map((k) => `
        <div class="lifeos-knowledge-card">
          <div class="lifeos-knowledge-title">${escapeHtml(k.title || '')}</div>
          <div class="lifeos-knowledge-tags">${(k.tags || []).map(escapeHtml).join(', ')}</div>
        </div>
      `).join('')
      : '<div class="empty"><div class="empty-text">Belum ada insight tersimpan</div></div>';
  },

  async saveInsight({ sourceKind, title, content, tags }) {
    await knowledgeServiceSave({ sourceKind, title, content, tags });
    LifeOSKnowledge.render();
  },
};
