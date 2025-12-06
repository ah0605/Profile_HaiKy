// Smooth scroll cho menu
document.querySelectorAll('.main-nav a').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  });
});

// Xử lý form (demo) - bạn thay bằng fetch tới endpoint thật nếu cần
const form = document.getElementById('contactForm');
if(form){
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const data = new FormData(form);
    alert(
      'Yêu cầu đã được ghi nhận (demo):\n' +
      'Họ tên: ' + data.get('name') + '\n' +
      'Email: ' + data.get('email') + '\n' +
      'Số ĐT: ' + (data.get('phone')||'') + '\n' +
      'Yêu cầu: ' + (data.get('role')||'') + '\n' +
      'Mô tả: ' + (data.get('message')||'')
    );
    form.reset();
  });
}

/* ---------- Mobile settings logic (giữ nguyên) ---------- */
const mobileBtn = document.getElementById('mobileSettingsBtn');
const panel = document.getElementById('mobileSettingsPanel');
const closeBtn = document.getElementById('closeSettings');

const fontSizeSelect = document.getElementById('fontSizeSelect');
const spacingSelect = document.getElementById('spacingSelect');
const avatarSizeSelect = document.getElementById('avatarSizeSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const resetBtn = document.getElementById('resetSettings');

function openPanel(){ panel && panel.classList.add('open'); panel && panel.setAttribute('aria-hidden','false'); }
function closePanel(){ panel && panel.classList.remove('open'); panel && panel.setAttribute('aria-hidden','true'); }

mobileBtn && mobileBtn.addEventListener('click', ()=> {
  if(panel && panel.classList.contains('open')) closePanel(); else openPanel();
});
closeBtn && closeBtn.addEventListener('click', closePanel);

const STORAGE_KEY = 'mc_congdanh_mobile_ui_v1';
const defaultSettings = { fontSize: 'normal', spacing: 'normal', avatar: 'normal', dark: false };

function loadSettings(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
}
function saveSettings(obj){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }catch(e){} }

function applySettings(settings){
  const b = document.body;
  b.classList.remove('font-small','font-large','spacing-compact','avatar-small','dark');
  if(settings.fontSize === 'small') b.classList.add('font-small');
  if(settings.fontSize === 'large') b.classList.add('font-large');
  if(settings.spacing === 'compact') b.classList.add('spacing-compact');
  if(settings.avatar === 'small') b.classList.add('avatar-small');
  if(settings.dark) b.classList.add('dark');
}

function initSettingsUI(){
  const saved = loadSettings() || defaultSettings;
  if(fontSizeSelect) fontSizeSelect.value = saved.fontSize || 'normal';
  if(spacingSelect) spacingSelect.value = saved.spacing || 'normal';
  if(avatarSizeSelect) avatarSizeSelect.value = saved.avatar || 'normal';
  if(darkModeToggle) darkModeToggle.checked = !!saved.dark;
  applySettings(saved);
}

fontSizeSelect && fontSizeSelect.addEventListener('change', ()=>{
  const s = loadSettings() || defaultSettings; s.fontSize = fontSizeSelect.value; saveSettings(s); applySettings(s);
});
spacingSelect && spacingSelect.addEventListener('change', ()=>{
  const s = loadSettings() || defaultSettings; s.spacing = spacingSelect.value; saveSettings(s); applySettings(s);
});
avatarSizeSelect && avatarSizeSelect.addEventListener('change', ()=>{
  const s = loadSettings() || defaultSettings; s.avatar = avatarSizeSelect.value; saveSettings(s); applySettings(s);
});
darkModeToggle && darkModeToggle.addEventListener('change', ()=>{
  const s = loadSettings() || defaultSettings; s.dark = !!darkModeToggle.checked; saveSettings(s); applySettings(s);
});

resetBtn && resetBtn.addEventListener('click', ()=>{
  saveSettings(defaultSettings); initSettingsUI();
});

function handleResponsiveBtn(){
  if(window.innerWidth <= 820){
    mobileBtn && (mobileBtn.style.display = 'block');
  } else {
    mobileBtn && (mobileBtn.style.display = 'none');
    panel && panel.classList.remove('open');
  }
}

initSettingsUI();
handleResponsiveBtn();
window.addEventListener('resize', handleResponsiveBtn);

// Click ngoài để đóng panel
document.addEventListener('click', function(e){
  if(panel && mobileBtn && panel.classList.contains('open') && !panel.contains(e.target) && !mobileBtn.contains(e.target)){
    panel.classList.remove('open');
  }
});
