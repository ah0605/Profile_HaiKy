/* ============================================================
   ADMIN.JS
   Toàn bộ logic quản trị: điều hướng sidebar, các form đơn
   (Banner/Giới thiệu/Thẻ HDV/Liên hệ) và module CRUD dùng chung
   cho các collection dạng danh sách (số liệu, phong cách, điểm
   mạnh, hình ảnh, video, dịch vụ, đối tác, đánh giá).
   ============================================================ */

window.onAdminReady = function () {
  initSidebarNav();
  loadDashboardCounts();
  initBannerForm();
  initAboutForm();
  initContactForm();
  initStatsModule();
  initStyleModule();
  initStrengthsModule();
  initServicesModule();
  initGalleryModule();
  initVideosModule();
  initPartnersModule();
  initTestimonialsModule();
  initMessagesModule();
  initGuideCardsModule();
  initSeedButton();
};

/* ---------- generic helpers ---------- */
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function urlPreview(url, targetEl, isVideo) {
  if (!url) { targetEl.innerHTML = ''; return; }
  targetEl.innerHTML = isVideo
    ? `<video src="${escapeHtml(url)}" muted onerror="this.style.display='none'"></video>`
    : `<img src="${escapeHtml(url)}" onerror="this.style.display='none'">`;
}
function setFormMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-msg' + (type ? ' ' + type : '');
}

/* ---------- sidebar navigation ---------- */
function initSidebarNav() {
  const btns = document.querySelectorAll('.admin-nav-btn');
  const titleEl = document.getElementById('panel-title');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(btn.dataset.panel).classList.add('active');
      titleEl.textContent = btn.textContent;
    });
  });
}

/* ---------- dashboard counts ---------- */
async function loadDashboardCounts() {
  const targets = [
    ['gallery', 'count-gallery'],
    ['videos', 'count-videos'],
    ['partners', 'count-partners'],
    ['services', 'count-services'],
    ['contactMessages', 'count-messages']
  ];
  for (const [col, elId] of targets) {
    try {
      const snap = await db.collection(col).get();
      document.getElementById(elId).textContent = snap.size;
    } catch (e) { console.warn(e); }
  }
}

/* ============================================================
   CONFIRM DELETE MODAL (shared)
   ============================================================ */
const confirmModal = document.getElementById('confirm-modal');
document.getElementById('confirm-cancel').addEventListener('click', () => confirmModal.classList.remove('open'));
function confirmDelete(text, onConfirm) {
  document.getElementById('confirm-text').textContent = text;
  confirmModal.classList.add('open');
  const okBtn = document.getElementById('confirm-ok');
  const clone = okBtn.cloneNode(true); // strip previous listeners
  okBtn.parentNode.replaceChild(clone, okBtn);
  clone.addEventListener('click', async () => {
    confirmModal.classList.remove('open');
    await onConfirm();
  });
}

/* ============================================================
   ITEM MODAL (shared, used by generic list modules)
   ============================================================ */
const itemModal = document.getElementById('item-modal');
const itemModalTitle = document.getElementById('item-modal-title');
const itemModalForm = document.getElementById('item-modal-form');
function closeItemModal() { itemModal.classList.remove('open'); }
itemModal.addEventListener('click', (e) => { if (e.target.id === 'item-modal') closeItemModal(); });

/* ============================================================
   GENERIC LIST-CRUD MODULE FACTORY
   Dùng cho: Số liệu, Phong cách, Điểm mạnh, Dịch vụ, Hình ảnh,
   Video, Đối tác, Đánh giá — mỗi module chỉ khai báo field config.
   ============================================================ */
function createListModule(cfg) {
  let items = [];

  async function render() {
    const container = document.getElementById(cfg.containerId);
    try {
      const snap = await db.collection(cfg.collectionName).orderBy(cfg.orderField || 'order', 'asc').get();
      items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn(e);
      items = [];
    }
    if (!items.length) {
      container.innerHTML = `<div class="empty-state">Chưa có dữ liệu. Nhấn "+ Thêm" để bắt đầu.</div>`;
      return;
    }
    container.innerHTML = items.map(item => cfg.gridMode ? gridItemHtml(item) : rowHtml(item)).join('');
    container.querySelectorAll('[data-edit]').forEach(el =>
      el.addEventListener('click', () => openForm(items.find(i => i.id === el.dataset.edit))));
    container.querySelectorAll('[data-delete]').forEach(el =>
      el.addEventListener('click', () => confirmDelete('Bạn có chắc chắn muốn xóa mục này?', async () => {
        await db.collection(cfg.collectionName).doc(el.dataset.delete).delete();
        await render();
        loadDashboardCounts();
      })));
    if (cfg.afterRender) cfg.afterRender(items);
  }

  function rowHtml(item) {
    const title = escapeHtml(item[cfg.titleKey] || '(không có tiêu đề)');
    const sub = cfg.subValue ? escapeHtml(cfg.subValue(item)) : '';
    const thumb = cfg.thumbKey && item[cfg.thumbKey]
      ? `<img class="admin-row-thumb" src="${escapeHtml(item[cfg.thumbKey])}">`
      : '';
    return `
      <div class="admin-row">
        <div class="admin-row-main">
          ${thumb}
          <div>
            <div class="admin-row-title">${title}</div>
            <div class="admin-row-sub">${sub}</div>
          </div>
        </div>
        <div class="admin-row-actions">
          <button class="icon-btn" data-edit="${item.id}" title="Sửa">${iconEdit()}</button>
          <button class="icon-btn danger" data-delete="${item.id}" title="Xóa">${iconTrash()}</button>
        </div>
      </div>`;
  }

  function gridItemHtml(item) {
    const thumb = item[cfg.thumbKey] || '';
    const title = escapeHtml(item[cfg.titleKey] || '');
    return `
      <div class="admin-grid-item">
        <img src="${escapeHtml(thumb)}" onerror="this.style.opacity=0">
        <div class="agi-body">
          <div class="agi-title">${title}</div>
          <div class="agi-actions">
            <button class="icon-btn" data-edit="${item.id}" title="Sửa">${iconEdit()}</button>
            <button class="icon-btn danger" data-delete="${item.id}" title="Xóa">${iconTrash()}</button>
          </div>
        </div>
      </div>`;
  }

  function fieldHtml(f, existing) {
    const val = existing ? (existing[f.key] ?? '') : (f.default ?? '');
    if (f.type === 'textarea') {
      return `<div class="field"><label>${f.label}</label><textarea id="f_${f.key}">${escapeHtml(val)}</textarea></div>`;
    }
    if (f.type === 'select') {
      const opts = f.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`).join('');
      return `<div class="field"><label>${f.label}</label><select id="f_${f.key}">${opts}</select></div>`;
    }
    if (f.type === 'url') {
      const existingUrl = existing ? (existing[f.key] || '') : '';
      const preview = existingUrl
        ? (f.isVideo ? `<video src="${escapeHtml(existingUrl)}" muted></video>` : `<img src="${escapeHtml(existingUrl)}">`)
        : '';
      return `<div class="field"><label>${f.label}</label><input type="url" id="f_${f.key}" value="${escapeHtml(existingUrl)}" placeholder="https://res.cloudinary.com/...">
        <div class="upload-preview" id="fp_${f.key}">${preview}</div></div>`;
    }
    const inputType = f.type === 'number' ? 'number' : 'text';
    const extra = f.type === 'number' ? `min="${f.min ?? 0}" max="${f.max ?? ''}"` : '';
    return `<div class="field"><label>${f.label}</label><input type="${inputType}" id="f_${f.key}" value="${escapeHtml(val)}" ${extra}></div>`;
  }

  function openForm(existing) {
    itemModalTitle.textContent = existing ? cfg.modalTitleEdit : cfg.modalTitleAdd;
    itemModalForm.innerHTML = cfg.fields.map(f => fieldHtml(f, existing)).join('') +
      `<div class="form-msg" id="item-modal-msg"></div>
       <div class="confirm-actions" style="margin-top:10px">
         <button type="button" class="btn btn-sm" id="item-modal-cancel">Hủy</button>
         <button type="submit" class="btn btn-sm btn-primary">Lưu</button>
       </div>`;
    cfg.fields.filter(f => f.type === 'url').forEach(f => {
      const input = document.getElementById(`f_${f.key}`);
      input.addEventListener('input', () => urlPreview(input.value.trim(), document.getElementById(`fp_${f.key}`), !!f.isVideo));
    });
    document.getElementById('item-modal-cancel').addEventListener('click', closeItemModal);
    itemModal.classList.add('open');

    itemModalForm.onsubmit = async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById('item-modal-msg');
      const submitBtn = itemModalForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      setFormMsg(msgEl, 'Đang lưu…');
      try {
        const data = {};
        for (const f of cfg.fields) {
          if (f.type === 'number') {
            data[f.key] = Number(document.getElementById(`f_${f.key}`).value) || 0;
          } else {
            const v = document.getElementById(`f_${f.key}`).value.trim();
            if (f.required && !v) throw new Error(`Vui lòng nhập ${f.label.toLowerCase()}.`);
            data[f.key] = v;
          }
        }
        if (existing) {
          data[cfg.orderField || 'order'] = existing[cfg.orderField || 'order'] ?? Date.now();
          await db.collection(cfg.collectionName).doc(existing.id).update(data);
        } else {
          data[cfg.orderField || 'order'] = Date.now();
          await db.collection(cfg.collectionName).add(data);
        }
        closeItemModal();
        await render();
        loadDashboardCounts();
      } catch (err) {
        console.error(err);
        setFormMsg(msgEl, err.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    };
  }

  document.getElementById(cfg.addBtnId).addEventListener('click', () => openForm(null));
  render();
  return { render };
}

function iconEdit() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4v16h16v-7"/><path d="M17.5 3.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 8.5-8.5z"/></svg>';
}
function iconTrash() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
}

/* ============================================================
   MODULE DEFINITIONS
   ============================================================ */
function initStatsModule() {
  createListModule({
    collectionName: 'stats', containerId: 'list-stats', addBtnId: 'btn-add-stat',
    titleKey: 'label', subValue: i => `${i.target}+`,
    modalTitleAdd: 'Thêm số liệu', modalTitleEdit: 'Sửa số liệu',
    fields: [
      { key: 'label', label: 'Nhãn (VD: chương trình, khách hàng, đối tác)', type: 'text', required: true },
      { key: 'target', label: 'Số đích (VD: 350)', type: 'number', min: 0, required: true }
    ]
  });
}
function initStyleModule() {
  createListModule({
    collectionName: 'styleCards', containerId: 'list-style', addBtnId: 'btn-add-style',
    titleKey: 'title', subValue: i => i.desc || '',
    modalTitleAdd: 'Thêm thẻ phong cách', modalTitleEdit: 'Sửa thẻ phong cách',
    fields: [
      { key: 'title', label: 'Tiêu đề (VD: Trẻ trung)', type: 'text', required: true },
      { key: 'desc', label: 'Mô tả', type: 'textarea' }
    ]
  });
}
function initStrengthsModule() {
  createListModule({
    collectionName: 'strengths', containerId: 'list-strengths', addBtnId: 'btn-add-strength',
    titleKey: 'title', subValue: i => i.desc || '',
    modalTitleAdd: 'Thêm điểm mạnh', modalTitleEdit: 'Sửa điểm mạnh',
    fields: [
      { key: 'title', label: 'Tiêu đề (VD: Dẫn chương trình)', type: 'text', required: true },
      { key: 'desc', label: 'Mô tả', type: 'textarea' }
    ]
  });
}
function initServicesModule() {
  createListModule({
    collectionName: 'services', containerId: 'list-services', addBtnId: 'btn-add-service',
    titleKey: 'title', subValue: i => i.desc || '',
    modalTitleAdd: 'Thêm dịch vụ', modalTitleEdit: 'Sửa dịch vụ',
    fields: [
      { key: 'title', label: 'Tên dịch vụ (VD: MC Gala Dinner)', type: 'text', required: true },
      { key: 'desc', label: 'Mô tả', type: 'textarea' }
    ]
  });
}
function initGalleryModule() {
  const categories = [
    { value: 'hdv-trongnuoc', label: 'Hướng dẫn viên trong nước' },
    { value: 'hdv-ngoainuoc', label: 'Hướng dẫn viên ngoài nước' },
    { value: 'mc-gala', label: 'MC Gala Dinner' },
    { value: 'mc-teambuilding', label: 'MC Team Building' },
    { value: 'luatrai', label: 'Lửa trại' },
    { value: 'poolparty', label: 'Pool Party' },
    { value: 'xeplogo', label: 'Xếp Logo Công Ty' },
    { value: 'xepchu', label: 'Xếp Chữ' },
    { value: 'khac', label: 'Hoạt động khác' }
  ];
  createListModule({
    collectionName: 'gallery', containerId: 'list-gallery', addBtnId: 'btn-add-photo',
    gridMode: true, titleKey: 'description', thumbKey: 'url',
    modalTitleAdd: 'Thêm ảnh', modalTitleEdit: 'Sửa ảnh',
    fields: [
      { key: 'url', label: 'Link ảnh (Cloudinary/ImgBB...)', type: 'url', required: true },
      { key: 'category', label: 'Danh mục', type: 'select', options: categories, default: categories[0].value },
      { key: 'description', label: 'Mô tả ảnh', type: 'text' }
    ]
  });
}
function initVideosModule() {
  createListModule({
    collectionName: 'videos', containerId: 'list-videos', addBtnId: 'btn-add-video',
    titleKey: 'title', thumbKey: 'thumbnailUrl', subValue: i => i.youtubeUrl || (i.videoUrl ? 'Video (link ngoài)' : ''),
    modalTitleAdd: 'Thêm video', modalTitleEdit: 'Sửa video',
    fields: [
      { key: 'title', label: 'Tiêu đề', type: 'text', required: true },
      { key: 'desc', label: 'Mô tả', type: 'textarea' },
      { key: 'thumbnailUrl', label: 'Link ảnh thumbnail', type: 'url' },
      { key: 'youtubeUrl', label: 'Link YouTube (khuyên dùng)', type: 'text' },
      { key: 'videoUrl', label: 'Hoặc link video (Cloudinary...) nếu không dùng YouTube', type: 'url', isVideo: true }
    ]
  });
}
function initPartnersModule() {
  createListModule({
    collectionName: 'partners', containerId: 'list-partners', addBtnId: 'btn-add-partner',
    gridMode: true, titleKey: 'name', thumbKey: 'logoUrl',
    modalTitleAdd: 'Thêm đối tác', modalTitleEdit: 'Sửa đối tác',
    fields: [
      { key: 'logoUrl', label: 'Link logo (Cloudinary/ImgBB...)', type: 'url', required: true },
      { key: 'name', label: 'Tên đối tác', type: 'text', required: true }
    ]
  });
}
function initTestimonialsModule() {
  createListModule({
    collectionName: 'testimonials', containerId: 'list-testimonials', addBtnId: 'btn-add-testi',
    titleKey: 'name', thumbKey: 'avatarUrl', subValue: i => `${'★'.repeat(i.rating || 5)} — ${i.content || ''}`,
    modalTitleAdd: 'Thêm đánh giá', modalTitleEdit: 'Sửa đánh giá',
    fields: [
      { key: 'name', label: 'Tên khách hàng', type: 'text', required: true },
      { key: 'avatarUrl', label: 'Link ảnh đại diện (tùy chọn)', type: 'url' },
      { key: 'content', label: 'Nội dung đánh giá', type: 'textarea', required: true },
      { key: 'rating', label: 'Số sao (1-5)', type: 'number', min: 1, max: 5, default: 5 }
    ]
  });
}

/* ============================================================
   SINGLETON FORMS: Banner / About / Guide Card / Contact
   ============================================================ */
function initBannerForm() {
  const form = document.getElementById('form-banner');
  const msgEl = document.getElementById('b-msg');
  db.doc('config/site').get().then(snap => {
    if (!snap.exists) return;
    const d = snap.data();
    document.getElementById('b-heroName').value = d.heroName || '';
    document.getElementById('b-heroRole').value = d.heroRole || '';
    document.getElementById('b-heroTagline').value = d.heroTagline || '';
    document.getElementById('b-heroDesc').value = d.heroDesc || '';
    document.getElementById('b-avatarFile').value = d.heroAvatarUrl || '';
    document.getElementById('b-bgFile').value = d.heroBackgroundUrl || '';
    urlPreview(d.heroAvatarUrl, document.getElementById('b-avatarPreview'));
    urlPreview(d.heroBackgroundUrl, document.getElementById('b-bgPreview'), /\.(mp4|webm|ogg)(\?|$)/i.test(d.heroBackgroundUrl || ''));
  }).catch(console.warn);

  document.getElementById('b-avatarFile').addEventListener('input', e => urlPreview(e.target.value.trim(), document.getElementById('b-avatarPreview')));
  document.getElementById('b-bgFile').addEventListener('input', e => {
    const v = e.target.value.trim();
    urlPreview(v, document.getElementById('b-bgPreview'), /\.(mp4|webm|ogg)(\?|$)/i.test(v));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormMsg(msgEl, 'Đang lưu…');
    try {
      const data = {
        heroName: document.getElementById('b-heroName').value.trim(),
        heroRole: document.getElementById('b-heroRole').value.trim(),
        heroTagline: document.getElementById('b-heroTagline').value.trim(),
        heroDesc: document.getElementById('b-heroDesc').value.trim(),
        heroAvatarUrl: document.getElementById('b-avatarFile').value.trim(),
        heroBackgroundUrl: document.getElementById('b-bgFile').value.trim()
      };
      await db.doc('config/site').set(data, { merge: true });
      setFormMsg(msgEl, 'Đã lưu Banner thành công!', 'success');
    } catch (err) {
      console.error(err);
      setFormMsg(msgEl, 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
    }
  });
}

function initAboutForm() {
  const form = document.getElementById('form-about');
  const msgEl = document.getElementById('a-msg');
  db.doc('config/about').get().then(snap => {
    if (!snap.exists) return;
    const d = snap.data();
    document.getElementById('a-fullName').value = d.fullName || '';
    document.getElementById('a-headline').value = d.headline || '';
    document.getElementById('a-bio').value = d.bio || '';
    document.getElementById('a-experience').value = d.experience || '';
    document.getElementById('a-style').value = d.style || '';
    document.getElementById('a-strength').value = d.strength || '';
    document.getElementById('a-language').value = d.language || '';
    document.getElementById('a-avatarFile').value = d.avatarUrl || '';
    urlPreview(d.avatarUrl, document.getElementById('a-avatarPreview'));
  }).catch(console.warn);

  document.getElementById('a-avatarFile').addEventListener('input', e => urlPreview(e.target.value.trim(), document.getElementById('a-avatarPreview')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormMsg(msgEl, 'Đang lưu…');
    try {
      const data = {
        fullName: document.getElementById('a-fullName').value.trim(),
        headline: document.getElementById('a-headline').value.trim(),
        bio: document.getElementById('a-bio').value.trim(),
        experience: document.getElementById('a-experience').value.trim(),
        style: document.getElementById('a-style').value.trim(),
        strength: document.getElementById('a-strength').value.trim(),
        language: document.getElementById('a-language').value.trim(),
        avatarUrl: document.getElementById('a-avatarFile').value.trim()
      };
      await db.doc('config/about').set(data, { merge: true });
      setFormMsg(msgEl, 'Đã lưu Giới thiệu thành công!', 'success');
    } catch (err) {
      console.error(err);
      setFormMsg(msgEl, 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
    }
  });
}

function initGuideCardsModule() {
  createListModule({
    collectionName: 'guideCards', containerId: 'list-guidecards', addBtnId: 'btn-add-guidecard',
    titleKey: 'label', thumbKey: 'photoUrl', subValue: i => `${i.name || ''} · Mã số: ${i.code || '—'}`,
    modalTitleAdd: 'Thêm thẻ hướng dẫn viên', modalTitleEdit: 'Sửa thẻ hướng dẫn viên',
    fields: [
      { key: 'label', label: 'Loại thẻ', type: 'select', options: [
          { value: 'Thẻ trong nước', label: 'Thẻ trong nước' },
          { value: 'Thẻ quốc tế', label: 'Thẻ quốc tế' }
        ], default: 'Thẻ trong nước' },
      { key: 'photoUrl', label: 'Link ảnh thẻ (Cloudinary/ImgBB...)', type: 'url' },
      { key: 'name', label: 'Họ tên', type: 'text', required: true },
      { key: 'code', label: 'Mã số', type: 'text' },
      { key: 'issueDate', label: 'Ngày cấp', type: 'text' },
      { key: 'issuer', label: 'Đơn vị cấp', type: 'text' }
    ]
  });
}

function initContactForm() {
  const form = document.getElementById('form-contact');
  const msgEl = document.getElementById('c-msg');
  db.doc('config/contact').get().then(snap => {
    if (!snap.exists) return;
    const d = snap.data();
    document.getElementById('c-phone').value = d.phone || '';
    document.getElementById('c-email').value = d.email || '';
    document.getElementById('c-address').value = d.address || '';
    document.getElementById('c-mapEmbedUrl').value = d.mapEmbedUrl || '';
    document.getElementById('c-facebook').value = d.facebook || '';
    document.getElementById('c-tiktok').value = d.tiktok || '';
    document.getElementById('c-youtube').value = d.youtube || '';
    document.getElementById('c-zalo').value = d.zalo || '';
  }).catch(console.warn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormMsg(msgEl, 'Đang lưu…');
    try {
      const data = {
        phone: document.getElementById('c-phone').value.trim(),
        email: document.getElementById('c-email').value.trim(),
        address: document.getElementById('c-address').value.trim(),
        mapEmbedUrl: document.getElementById('c-mapEmbedUrl').value.trim(),
        facebook: document.getElementById('c-facebook').value.trim(),
        tiktok: document.getElementById('c-tiktok').value.trim(),
        youtube: document.getElementById('c-youtube').value.trim(),
        zalo: document.getElementById('c-zalo').value.trim()
      };
      await db.doc('config/contact').set(data, { merge: true });
      setFormMsg(msgEl, 'Đã lưu Liên hệ thành công!', 'success');
    } catch (err) {
      console.error(err);
      setFormMsg(msgEl, 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
    }
  });
}

/* ============================================================
   SEED DATA — Hải Kỳ (chỉ điền vào phần đang trống, không ghi đè
   nội dung đã có sẵn). Mã số/ngày cấp/đơn vị cấp thẻ HDV để trống
   vì đây là thông tin định danh chính thức, cần admin tự nhập.
   ============================================================ */
function initSeedButton() {
  document.getElementById('btn-seed-data').addEventListener('click', () => {
    confirmDelete(
      'Thao tác này sẽ điền nội dung mẫu của Hải Kỳ vào các phần đang trống (Giới thiệu, Banner, Phong cách, Điểm mạnh, Dịch vụ, Thẻ HDV, Liên hệ, Số liệu). Phần đã có dữ liệu sẽ được giữ nguyên. Tiếp tục?',
      seedInitialData
    );
    document.getElementById('confirm-ok').textContent = 'Nhập dữ liệu';
  });
}

async function seedInitialData() {
  const msgEl = document.getElementById('seed-msg');
  setFormMsg(msgEl, 'Đang nhập dữ liệu mẫu…');
  try {
    await seedSingletonDoc('config/site', {
      heroName: 'Hải Kỳ',
      heroRole: 'MC - HƯỚNG DẪN VIÊN',
      heroTagline: 'Hòa nhã · Truyền cảm · Chuyên nghiệp',
      heroDesc: 'Đồng hành cùng các chương trình Gala Dinner, Team Building, Lửa trại và Tour trong nước, quốc tế.'
    });

    await seedSingletonDoc('config/about', {
      fullName: 'Hải Kỳ',
      headline: 'Người truyền năng lượng cho mọi sân khấu',
      bio: [
        'Tôi là Hải Kỳ — MC và HDV chuyên nghiệp, hoạt động chính trong lĩnh vực dẫn chương trình sự kiện và hướng dẫn du lịch.',
        'Với phong cách hòa nhã, truyền cảm và khả năng ứng biến tốt, tôi luôn chuẩn bị kỹ kịch bản, phối hợp cùng ekip để chương trình diễn ra suôn sẻ.',
        'Tôi kết hợp kỹ thuật dẫn chuyên nghiệp với năng lượng hoạt náo khi cần, nhằm mang lại trải nghiệm ấn tượng cho khán giả và đoàn khách.'
      ].join('\n'),
      experience: 'MC: 5 năm kinh nghiệm · HDV: hoạt động từ 2018',
      style: 'Linh hoạt — từ trang trọng đến năng lượng cao',
      strength: 'Đọc tình huống, quản lý sân khấu, xử lý tình huống nhanh'
    });

    await seedSingletonDoc('config/contact', {
      email: 'nhky3141999@gmail.com',
      phone: '0819.590.560'
    });

    await seedCollectionIfEmpty('stats', [
      { label: 'Năm kinh nghiệm MC', target: 5, order: 1 },
      { label: 'Năm hoạt động HDV', target: new Date().getFullYear() - 2018, order: 2 }
    ]);

    await seedCollectionIfEmpty('styleCards', [
      { title: 'Vui vẻ', desc: 'Không khí gần gũi, dễ chịu, giúp khán giả thoải mái ngay từ những phút đầu.', order: 1 },
      { title: 'Trang trọng', desc: 'Chững chạc, chỉn chu — phù hợp các chương trình gala, lễ trao giải, hội nghị.', order: 2 },
      { title: 'Máu lửa', desc: 'Năng lượng cao trào ở các phần team-building, lửa trại, hoạt náo.', order: 3 },
      { title: 'Sâu lắng', desc: 'Biết tiết chế, tạo khoảng lặng đúng lúc trong những phần cảm xúc.', order: 4 }
    ]);

    await seedCollectionIfEmpty('strengths', [
      { title: 'Dẫn chương trình', desc: 'Chuẩn bị kịch bản lời dẫn kỹ lưỡng, họp chạy trước cùng ekip, kiểm soát thời lượng chương trình.', order: 1 },
      { title: 'Hoạt náo & Quản trò', desc: 'Thiết kế và dẫn game team-building, quản trò lửa trại an toàn, bài bản.', order: 2 },
      { title: 'Kết nối khán giả', desc: 'Giao tiếp tốt, tương tác linh hoạt với khách mời và đoàn khách trong suốt chương trình.', order: 3 },
      { title: 'Xử lý tình huống', desc: 'Đọc tình huống nhanh, điều phối kịch bản và ứng biến linh hoạt trước các thay đổi bất ngờ.', order: 4 },
      { title: 'Tổ chức trò chơi & Xếp chữ', desc: 'Lên layout xếp chữ/xếp logo, điều phối vị trí, đảm bảo hiệu ứng hình ảnh và ánh sáng.', order: 5 }
    ]);

    await seedCollectionIfEmpty('services', [
      { title: 'MC Gala · Sự kiện · Hội nghị', desc: 'Dẫn chương trình chính, phối hợp MC đồng hành, điều phối tiến độ theo kịch bản.', order: 1 },
      { title: 'MC Team Building · Lửa trại · Xếp chữ', desc: 'Quản trò, tổ chức lửa trại và xếp chữ an toàn, chú trọng trải nghiệm và kết nối nhóm.', order: 2 },
      { title: 'Hướng dẫn viên nội địa', desc: 'Thuyết minh điểm, điều phối lịch trình và hỗ trợ đặt dịch vụ cho tour miền Bắc, Trung, Nam.', order: 3 },
      { title: 'Hướng dẫn viên quốc tế', desc: 'Dẫn tour khu vực Đông Nam Á, sắp xếp logistics cơ bản cho đoàn khách.', order: 4 },
      { title: 'Thiết kế hoạt động đoàn', desc: 'Tổ chức game trên xe và các hoạt động team-building nhẹ trong hành trình.', order: 5 }
    ]);

    await seedCollectionIfEmpty('guideCards', [
      { label: 'Thẻ trong nước', name: 'Hải Kỳ', code: '', issueDate: '', issuer: '', order: 1 },
      { label: 'Thẻ quốc tế', name: 'Hải Kỳ', code: '', issueDate: '', issuer: '', order: 2 }
    ]);

    setFormMsg(msgEl, 'Đã nhập dữ liệu mẫu thành công! Đang tải lại trang…', 'success');
    setTimeout(() => location.reload(), 1200);
  } catch (err) {
    console.error(err);
    setFormMsg(msgEl, 'Có lỗi khi nhập dữ liệu mẫu, vui lòng thử lại.', 'error');
  }
}

async function seedSingletonDoc(path, seedFields) {
  const snap = await db.doc(path).get();
  const current = snap.exists ? snap.data() : {};
  const toSet = {};
  Object.entries(seedFields).forEach(([key, val]) => {
    if (!current[key]) toSet[key] = val;
  });
  if (Object.keys(toSet).length) await db.doc(path).set(toSet, { merge: true });
}

async function seedCollectionIfEmpty(collectionName, items) {
  const snap = await db.collection(collectionName).limit(1).get();
  if (!snap.empty) return; // don't duplicate if admin already has data
  const batch = db.batch();
  items.forEach(item => {
    const ref = db.collection(collectionName).doc();
    batch.set(ref, item);
  });
  await batch.commit();
}

/* ============================================================
   MESSAGES INBOX (read + delete only — visitors create, admin manages)
   ============================================================ */
async function initMessagesModule() {
  const container = document.getElementById('list-messages');
  try {
    const snap = await db.collection('contactMessages').orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state">Chưa có tin nhắn nào từ khách hàng.</div>';
      return;
    }
    container.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const time = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString('vi-VN') : '';
      return `
        <div class="admin-row" style="align-items:flex-start">
          <div class="admin-row-main" style="flex-direction:column;align-items:flex-start;gap:4px">
            <div class="admin-row-title">${escapeHtml(d.name)} <span class="badge">${escapeHtml(time)}</span></div>
            <div class="admin-row-sub" style="max-width:100%;white-space:normal">${escapeHtml(d.phone)} · ${escapeHtml(d.email)}</div>
            <div class="admin-row-sub" style="max-width:100%;white-space:normal">${escapeHtml(d.message)}</div>
          </div>
          <div class="admin-row-actions">
            <button class="icon-btn danger" data-delete-msg="${doc.id}" title="Xóa">${iconTrash()}</button>
          </div>
        </div>`;
    }).join('');
    container.querySelectorAll('[data-delete-msg]').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete('Xóa tin nhắn này?', async () => {
        await db.collection('contactMessages').doc(btn.dataset.deleteMsg).delete();
        initMessagesModule();
        loadDashboardCounts();
      }));
    });
  } catch (e) {
    console.warn(e);
    container.innerHTML = '<div class="empty-state">Không thể tải tin nhắn.</div>';
  }
}
