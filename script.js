// Smooth scroll cho menu
document.querySelectorAll('.main-nav a').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  });
});




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
