/* ============================================================
   MAIN.JS — Landing page logic (public, read-only)
   Đọc dữ liệu từ Firestore và render toàn bộ site.
   Không có quyền ghi/sửa/xóa ở đây — chỉ trang Admin mới có.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initMobileMenu();
  initBackToTop();
  initScrollReveal();
  initLightbox();
  initVideoModal();
  initContactForm();
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  loadSiteConfig();
  loadAbout();
  loadStats();
  loadStyleCards();
  loadStrengths();
  loadGallery();
  loadVideos();
  loadServices();
  loadGuideCards();
  loadContactInfo();
});

/* ---------- helpers ---------- */
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeText(el, val, fallback = '—') {
  if (el) el.textContent = (val === undefined || val === null || val === '') ? fallback : val;
}
async function safeGetDoc(path) {
  try {
    const snap = await db.doc(path).get();
    return snap.exists ? snap.data() : null;
  } catch (e) {
    console.warn('Firestore read failed for', path, e);
    return null;
  }
}
async function safeGetCollection(path, orderField) {
  try {
    let ref = db.collection(path);
    if (orderField) ref = ref.orderBy(orderField, 'asc');
    const snap = await ref.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Firestore read failed for', path, e);
    return [];
  }
}

/* ---------- loading screen ---------- */
function initLoadingScreen() {
  const el = document.getElementById('loading-screen');
  window.addEventListener('load', () => {
    setTimeout(() => el.classList.add('hide'), 350);
  });
  // fallback in case 'load' already fired or is slow
  setTimeout(() => el.classList.add('hide'), 2500);
}

/* ---------- navbar ---------- */
function initNavbar() {
  const nav = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    highlightActiveLink(links);
  });
  highlightActiveLink(links);
}
function highlightActiveLink(links) {
  let current = 'hero';
  document.querySelectorAll('section[id], header[id]').forEach(sec => {
    const top = sec.offsetTop - 140;
    if (window.scrollY >= top) current = sec.id;
  });
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}
function initMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ---------- back to top ---------- */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- scroll reveal ---------- */
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
  window._observeReveal = (el) => io.observe(el); // for dynamically added nodes
}

/* ---------- counter animation ---------- */
function animateCounter(el, target) {
  const dur = 1600;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   SITE CONFIG / BANNER (doc: config/site) — chỉ ảnh/video toàn màn hình
   ============================================================ */
async function loadSiteConfig() {
  const data = await safeGetDoc('config/site');
  if (!data || !data.heroBackgroundUrl) return;
  const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(data.heroBackgroundUrl);
  const media = document.querySelector('.hero-media');
  const bgEl = isVideo
    ? `<video autoplay muted loop playsinline src="${escapeHtml(data.heroBackgroundUrl)}"></video>`
    : `<img src="${escapeHtml(data.heroBackgroundUrl)}" alt="Banner">`;
  media.insertAdjacentHTML('afterbegin', bgEl);
}

/* ============================================================
   ABOUT (doc: config/about)
   ============================================================ */
async function loadAbout() {
  const data = await safeGetDoc('config/about');
  if (!data) return;
  safeText(document.getElementById('about-name'), data.fullName);
  if (data.headline) safeText(document.getElementById('about-headline'), data.headline);
  if (data.avatarUrl) {
    document.getElementById('about-avatar').innerHTML = `<img src="${escapeHtml(data.avatarUrl)}" alt="${escapeHtml(data.fullName || 'Avatar')}">`;
  }
  if (data.bio) {
    document.getElementById('about-content').innerHTML = String(data.bio)
      .split('\n').filter(Boolean).map(p => `<p style="margin-bottom:12px">${escapeHtml(p)}</p>`).join('');
  }
  const metaMap = { experience: data.experience, style: data.style, strength: data.strength, language: data.language };
  document.querySelectorAll('#about-meta [data-field]').forEach(el => {
    const v = metaMap[el.dataset.field];
    if (v) el.textContent = v;
  });
  // Social icons for the About section come from the single Contact doc
  const contact = await safeGetDoc('config/contact');
  if (contact) {
    const socialMap = { facebook: contact.facebook, tiktok: contact.tiktok, youtube: contact.youtube, zalo: contact.zalo };
    const wrap = document.getElementById('about-social');
    const html = Object.entries(socialMap)
      .filter(([, url]) => url)
      .map(([type, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${socialIcon(type)}</a>`)
      .join('');
    if (html) wrap.innerHTML = html;
  }
}

function socialIcon(type) {
  const icons = {
    facebook: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/></svg>',
    tiktok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8a4.3 4.3 0 01-3.1-1.8v9.8a4.7 4.7 0 11-4-4.6v2.3a2.4 2.4 0 102 2.3V2h2.2a4.3 4.3 0 003.9 3.4v2.4z"/></svg>',
    youtube: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12s0-3.2-.4-4.7a2.5 2.5 0 00-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.5A2.5 2.5 0 002.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 001.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.5a2.5 2.5 0 001.8-1.8c.4-1.5.4-4.7.4-4.7zM10 15V9l5.2 3-5.2 3z"/></svg>',
    zalo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6 2 11c0 2.6 1.2 4.9 3.1 6.6L4 22l4.7-1.5A11 11 0 0012 21c5.5 0 10-4 10-10S17.5 2 12 2z"/></svg>',
    default: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/></svg>'
  };
  return icons[type] || icons.default;
}

/* ============================================================
   STATS (collection: stats)  doc: {label, target}
   ============================================================ */
async function loadStats() {
  const items = await safeGetCollection('stats', 'order');
  const row = document.getElementById('stats-row');
  if (!items.length) {
    row.innerHTML = '<div class="empty-state" style="grid-column:1/-1;border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.5)">Chưa có số liệu — vui lòng cập nhật trong trang Admin.</div>';
    return;
  }
  const tpl = document.getElementById('tpl-stat');
  row.innerHTML = '';
  items.forEach(item => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.stat-label').textContent = item.label || '';
    const numEl = node.querySelector('.stat-num');
    numEl.dataset.target = item.target || 0;
    row.appendChild(node);
  });
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        row.querySelectorAll('.stat-num').forEach(el => animateCounter(el, Number(el.dataset.target) || 0));
        obs.disconnect();
      }
    });
  }, { threshold: 0.4 });
  io.observe(row);
}

/* ============================================================
   STYLE CARDS (collection: styleCards) doc: {title, desc, order}
   ============================================================ */
async function loadStyleCards() {
  const items = await safeGetCollection('styleCards', 'order');
  renderCardGrid('style-grid', 'tpl-style-card', items, 'Chưa có dữ liệu phong cách — vui lòng cập nhật trong trang Admin.');
}

/* ============================================================
   STRENGTHS (collection: strengths) doc: {title, desc, order}
   ============================================================ */
async function loadStrengths() {
  const items = await safeGetCollection('strengths', 'order');
  renderCardGrid('strengths-grid', 'tpl-strength-card', items, 'Chưa có dữ liệu điểm mạnh — vui lòng cập nhật trong trang Admin.');
}

/* ============================================================
   SERVICES (collection: services) doc: {title, desc, order}
   ============================================================ */
async function loadServices() {
  const items = await safeGetCollection('services', 'order');
  renderCardGrid('services-grid', 'tpl-service-card', items, 'Chưa có dịch vụ nào — vui lòng cập nhật trong trang Admin.');
}

function renderCardGrid(gridId, tplId, items, emptyMsg) {
  const grid = document.getElementById(gridId);
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${escapeHtml(emptyMsg)}</div>`;
    return;
  }
  const tpl = document.getElementById(tplId);
  grid.innerHTML = '';
  items.forEach(item => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.c-title').textContent = item.title || '';
    node.querySelector('.c-desc').textContent = item.desc || '';
    grid.appendChild(node);
  });
  grid.classList.add('reveal-stagger');
  if (window._observeReveal) window._observeReveal(grid);
}

/* ============================================================
   GALLERY (collection: gallery) doc: {url, category, description, order}
   ============================================================ */
let GALLERY_ITEMS = [];
let GALLERY_FILTERED = [];
let LB_INDEX = 0;

async function loadGallery() {
  GALLERY_ITEMS = await safeGetCollection('gallery', 'order');
  renderGallery('all');
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(btn.dataset.filter);
    });
  });
}

function renderGallery(filter) {
  const grid = document.getElementById('gallery-grid');
  GALLERY_FILTERED = filter === 'all' ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.category === filter);
  if (!GALLERY_FILTERED.length) {
    grid.innerHTML = '<div class="gallery-empty">Chưa có ảnh trong danh mục này — vui lòng upload trong trang Admin.</div>';
    return;
  }
  grid.innerHTML = GALLERY_FILTERED.map((item, idx) => `
    <div class="gallery-item reveal" data-idx="${idx}">
      <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.description || '')}" loading="lazy">
      <div class="gallery-overlay"><span>${escapeHtml(item.description || '')}</span></div>
    </div>`).join('');
  grid.querySelectorAll('.gallery-item').forEach(el => {
    if (window._observeReveal) window._observeReveal(el);
    el.addEventListener('click', () => openLightbox(Number(el.dataset.idx)));
  });
}

function initLightbox() {
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
  document.getElementById('lb-prev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lb-next').addEventListener('click', () => stepLightbox(1));
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}
function openLightbox(idx) {
  LB_INDEX = idx;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }
function stepLightbox(dir) {
  LB_INDEX = (LB_INDEX + dir + GALLERY_FILTERED.length) % GALLERY_FILTERED.length;
  updateLightbox();
}
function updateLightbox() {
  const item = GALLERY_FILTERED[LB_INDEX];
  if (!item) return;
  document.getElementById('lb-img').src = item.url;
  document.getElementById('lb-desc').textContent = item.description || '';
}

/* ============================================================
   VIDEOS (collection: videos) doc: {title, desc, thumbnailUrl, youtubeUrl|videoUrl, order}
   ============================================================ */
let VIDEO_ITEMS = [];
async function loadVideos() {
  VIDEO_ITEMS = await safeGetCollection('videos', 'order');
  const grid = document.getElementById('video-grid');
  if (!VIDEO_ITEMS.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Chưa có video nào — vui lòng cập nhật trong trang Admin.</div>';
    return;
  }
  grid.innerHTML = VIDEO_ITEMS.map((item, idx) => `
    <div class="video-card reveal" data-idx="${idx}">
      <div class="video-thumb">
        <img src="${escapeHtml(item.thumbnailUrl || '')}" alt="${escapeHtml(item.title || '')}" loading="lazy" onerror="this.style.opacity=0">
        <div class="video-play"><span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div>
      </div>
      <div class="video-info">
        <h4>${escapeHtml(item.title || '')}</h4>
        <p>${escapeHtml(item.desc || '')}</p>
      </div>
    </div>`).join('');
  grid.querySelectorAll('.video-card').forEach(el => {
    if (window._observeReveal) window._observeReveal(el);
    el.addEventListener('click', () => openVideoModal(VIDEO_ITEMS[Number(el.dataset.idx)]));
  });
}

function initVideoModal() {
  document.getElementById('video-close').addEventListener('click', closeVideoModal);
  document.getElementById('video-modal').addEventListener('click', (e) => { if (e.target.id === 'video-modal') closeVideoModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeVideoModal(); });
}
function openVideoModal(item) {
  const stage = document.getElementById('video-modal-stage');
  if (item.youtubeUrl) {
    const id = extractYoutubeId(item.youtubeUrl);
    stage.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="${escapeHtml(item.title || '')}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  } else if (item.videoUrl) {
    stage.innerHTML = `<video src="${escapeHtml(item.videoUrl)}" controls autoplay></video>`;
  } else {
    stage.innerHTML = '<p style="color:#fff;padding:20px">Không có nguồn video.</p>';
  }
  document.getElementById('video-modal').classList.add('open');
}
function closeVideoModal() {
  document.getElementById('video-modal').classList.remove('open');
  document.getElementById('video-modal-stage').innerHTML = '';
}
function extractYoutubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : '';
}

/* ============================================================
   GUIDE CARDS / THẺ HDV (collection: guideCards)
   doc: {label, type: 'domestic'|'international', name, code,
         issueDate, issuer, photoUrl, order}
   ============================================================ */
async function loadGuideCards() {
  const items = await safeGetCollection('guideCards', 'order');
  const wrap = document.getElementById('guide-card-wrap');
  if (!items.length) {
    wrap.innerHTML = '<div class="empty-state">Chưa có thẻ hướng dẫn viên nào — vui lòng cập nhật trong trang Admin.</div>';
    return;
  }
  const tpl = document.getElementById('tpl-guide-card');
  wrap.innerHTML = '';
  items.forEach(item => {
    const node = tpl.content.cloneNode(true);
    const cardEl = node.querySelector('.guide-card');
    node.querySelector('.guide-card-label').textContent = item.label || (item.type === 'international' ? 'Thẻ quốc tế' : 'Thẻ trong nước');
    if (item.photoUrl) node.querySelector('.guide-card-photo').innerHTML = `<img src="${escapeHtml(item.photoUrl)}" alt="${escapeHtml(item.label || 'Thẻ HDV')}">`;
    node.querySelector('.gc-name').textContent = item.name || '—';
    node.querySelector('.gc-code').textContent = item.code || '—';
    node.querySelector('.gc-issueDate').textContent = item.issueDate || '—';
    node.querySelector('.gc-issuer').textContent = item.issuer || '—';
    if (item.photoUrl) {
      cardEl.style.cursor = 'zoom-in';
      cardEl.addEventListener('click', () => {
        GALLERY_FILTERED = [{ url: item.photoUrl, description: item.label || 'Thẻ hướng dẫn viên' }];
        openLightbox(0);
      });
    }
    wrap.appendChild(node);
  });
}

/* ============================================================
   CONTACT INFO (doc: config/contact)
   ============================================================ */
async function loadContactInfo() {
  const data = await safeGetDoc('config/contact');
  if (!data) return;
  const map = { phone: data.phone, email: data.email, address: data.address };
  document.querySelectorAll('#contact-list [data-field]').forEach(el => {
    const v = map[el.dataset.field];
    if (v) el.textContent = v;
  });
  if (data.mapEmbedUrl) document.getElementById('map-iframe').src = data.mapEmbedUrl;

  const socialMap = { facebook: data.facebook, tiktok: data.tiktok, youtube: data.youtube, zalo: data.zalo };
  const footerSocial = document.getElementById('footer-social');
  footerSocial.innerHTML = Object.entries(socialMap)
    .filter(([, url]) => url)
    .map(([type, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${socialIcon(type)}</a>`)
    .join('');
}

/* ============================================================
   CONTACT FORM — visitors can only CREATE (write-only) messages
   ============================================================ */
/* Email dự phòng nếu mục Liên hệ trong Admin chưa được điền */
const CONTACT_RECEIVER_EMAIL_FALLBACK = 'nhky3141999@gmail.com';

function initContactForm() {
  const form = document.getElementById('contact-form');
  const msgEl = document.getElementById('contact-msg');
  const btn = document.getElementById('contact-submit');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name').trim();
    const phone = fd.get('phone').trim();
    const email = fd.get('email').trim();
    const message = fd.get('message').trim();

    btn.disabled = true;
    btn.textContent = 'Đang gửi…';
    msgEl.textContent = '';
    msgEl.className = 'form-msg';

    // Email người nhận: lấy từ mục Liên hệ trong Admin, nếu chưa có thì dùng email dự phòng
    const contactEmailEl = document.querySelector('#contact-list [data-field="email"]');
    const receiverEmail = (contactEmailEl && contactEmailEl.textContent !== '—')
      ? contactEmailEl.textContent.trim()
      : CONTACT_RECEIVER_EMAIL_FALLBACK;

    try {
      // Gửi email thật qua Web3Forms (không cần khách có sẵn app Email)
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Liên hệ đặt lịch MC/HDV từ ${name}`,
          from_name: name,
          email: email,
          phone: phone,
          message: message,
          to: receiverEmail
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Web3Forms error');

      // Lưu thêm vào Firestore để hiện trong mục "Tin nhắn khách" ở trang Admin (dự phòng/lưu trữ)
      try {
        await db.collection('contactMessages').add({
          name, phone, email, message,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'new'
        });
      } catch (fsErr) {
        console.error('Firestore lưu thất bại (không ảnh hưởng email đã gửi):', fsErr);
      }

      msgEl.textContent = 'Gửi thành công! Cảm ơn bạn, mình sẽ phản hồi sớm nhất có thể.';
      msgEl.classList.add('success');
      form.reset();
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Có lỗi xảy ra, vui lòng thử lại hoặc liên hệ trực tiếp qua điện thoại/email.';
      msgEl.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Liên hệ ngay';
    }
  });
}
