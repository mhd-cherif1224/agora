// ════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════
let cropperInstance = null;
let cropTarget      = null;
const cropModal     = document.getElementById('cropModal');
const cropImage     = document.getElementById('cropImage');
// ════════════════════════════════════════
// stores sends the colors to update_profile.php
// ════════════════════════════════════════
async function saveBannerColor(dark, light) {
  try {
    const res = await fetch('../../../api/Update profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        banner_color_dark: dark,
        banner_color_light: light
      }),
    });

    const data = await res.json();
    console.log('Banner save response:', data);

    if (!data.success) {
      console.error('Save failed:', data.message);
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}

// ════════════════════════════════════════
// LOAD PROFILE FROM SESSION
// ════════════════════════════════════════
async function loadProfile() {
  try {
    const res  = await fetch('../../../api/get-profile.php');
    if (res.status === 401) { window.location.href = '../../html/login.html'; return; }

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { console.error('PHP returned:', text); return; }
    if (!data.success) return;

    // ── Fill form inputs ──
    document.getElementById('inputStatus').value    = data.status || '';
    document.getElementById('inputNom').value       = data.nom          || '';
    document.getElementById('inputPrenom').value    = data.prenom       || '';
    document.getElementById('inputRole').value      = data.role || "etudiante a "+data.localisation || '';
    document.getElementById('inputAdresse').value   = data.localisation || '';
    document.getElementById('inputNiveau').value    = data.niveau       || '';
    document.getElementById('inputSpecialite').value= data.specialite   || '';

    // ── Update banner preview ──
    updatePreview();

    // ── Avatar ──
    const navImg    = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');
    if (data.avatar) {
      document.getElementById('profilePreview').src = data.avatar;
      navImg.src = data.avatar; navImg.style.display = 'block';
      navLetter.style.display = 'none';
    } else {
      navLetter.textContent = ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase()[0] || '?';
    }

    // ── Banner ──
    if (data.banner) {
      const t = document.getElementById('bannerTop');
      t.style.backgroundImage    = `url('${data.banner}')`;
      t.style.backgroundSize     = 'cover';
      t.style.backgroundPosition = 'center';
    }

    const bannerBottom = document.getElementById('bannerBottom');
    if (bannerBottom && data.banner_color_dark && data.banner_color_light) {
      bannerBottom.style.background = `linear-gradient(to right, ${data.banner_color_dark}, ${data.banner_color_light})`;
    }

  } catch (err) {
    console.error('loadProfile error:', err);
  }
}

loadProfile();

// ════════════════════════════════════════
// SAVE PROFILE TO DB
// ════════════════════════════════════════
async function saveProfile() {
  const nom        = document.getElementById('inputNom').value.trim();
  const prenom     = document.getElementById('inputPrenom').value.trim();
  const localisation = document.getElementById('inputAdresse').value.trim();
  const niveau     = document.getElementById('inputNiveau').value.trim();
  const specialite = document.getElementById('inputSpecialite').value.trim();

  try {
    const res = await fetch('../../../api/Update profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, localisation, niveau, specialite }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { console.error('PHP returned:', text); return; }

    if (data.success) {
      showNotification('✓  Profil mis à jour !');
      updatePreview();
    } else {
      showNotification('❌ ' + (data.message || 'Erreur lors de la mise à jour.'));
    }
  } catch (err) {
    console.error('saveProfile error:', err);
    showNotification('❌ Erreur réseau.');
  }
}

// ════════════════════════════════════════
// NOTIFICATIONS TOAST
// ════════════════════════════════════════
function showNotification(message) {
  const notif = document.getElementById('notification');
  notif.innerText = message;
  notif.style.display = 'flex';
  clearTimeout(notif._t);
  notif._t = setTimeout(() => { notif.style.display = 'none'; }, 4000);
}

// ════════════════════════════════════════
// DOMINANT COLORS
// ════════════════════════════════════════
function getDominantColors(source, topN = 2) {
  let canvas, ctx;
  if (source instanceof HTMLCanvasElement) {
    canvas = source; ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas'); ctx = canvas.getContext('2d');
    const MAX = 200;
    let w = source.naturalWidth || source.width, h = source.naturalHeight || source.height;
    if (w > MAX || h > MAX) { const s = MAX / Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
    canvas.width = w; canvas.height = h; ctx.drawImage(source, 0, 0, w, h);
  }
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data, counts = {};
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) continue;
    const r = Math.round(data[i]/16)*16, g = Math.round(data[i+1]/16)*16, b = Math.round(data[i+2]/16)*16;
    const key = `${r},${g},${b}`; counts[key] = (counts[key]||0)+1;
  }
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,topN)
    .map(([key])=>{const [r,g,b]=key.split(',').map(Number);return{hex:'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')};});
}

function adaptColor(hex, amount = 80) {
  let r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  const br = (r*299+g*587+b*114)/1000;
  if (br>128){r=Math.max(0,r-amount);g=Math.max(0,g-amount);b=Math.max(0,b-amount);}
  else{r=Math.min(255,r+amount);g=Math.min(255,g+amount);b=Math.min(255,b+amount);}
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function changeBannerColor(color1, color2) {
  const br = h => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return(r*299+g*587+b*114)/1000; };
  const dark=br(color1)<br(color2)?color1:color2, light=br(color1)<br(color2)?color2:color1;
  document.getElementById('bannerBottom').style.background = `linear-gradient(to right, ${dark}, ${light})`;
}

// ════════════════════════════════════════
// CROPPER
// ════════════════════════════════════════
function openCropper(file, target, aspectRatio) {
  cropTarget = target;
  const valid = ['image/jpeg','image/png','image/jpg','image/gif'];
  if (!valid.includes(file.type)) { showNotification('Format non supporté !'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    cropImage.src = e.target.result;
    cropModal.classList.add('active');
    cropImage.onload = () => {
      cropperInstance = new Cropper(cropImage, {
        aspectRatio, viewMode:1, movable:true, zoomable:true,
        scalable:false, cropBoxResizable:true, background:false
      });
    };
  };
  reader.readAsDataURL(file);
}

function closeCropper() {
  cropModal.classList.remove('active');
  if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
  document.getElementById('profileInput').value = '';
  document.getElementById('bannerInput').value  = '';
}

document.getElementById('cropConfirm').addEventListener('click', () => {
  if (!cropperInstance) { showNotification('Erreur cropper.'); return; }
  const canvas = cropperInstance.getCroppedCanvas({
    width:  cropTarget === 'profile' ? 300  : 1200,
    height: cropTarget === 'profile' ? 300  : 400,
    imageSmoothingQuality: 'high'
  });
  if (!canvas) { showNotification('Erreur image.'); return; }
  const url = canvas.toDataURL('image/jpeg', 0.92);

  if (cropTarget === 'profile') {
    document.getElementById('profilePreview').src = url;
    const navImg    = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');
    navImg.src = url; navImg.style.display = 'block'; navLetter.style.display = 'none';
    uploadImage(canvas, 'profil'); // ← save to server
  } else {
    const t = document.getElementById('bannerTop');
    t.style.backgroundImage = `url('${url}')`;
    t.style.backgroundSize = 'cover'; t.style.backgroundPosition = 'center';
    const cols = getDominantColors(canvas, 2);
    if (!cols || cols.length === 0 || !cols[0] || !cols[0].hex) {
      console.warn('Could not extract colors from banner image');
      return;
    }
    const dark  = cols[0].hex;
    const light = adaptColor(cols[0].hex);
    changeBannerColor(dark, light);
    saveBannerColor(dark, light);
    uploadImage(canvas, 'banniere'); // ← save to server
  }
  closeCropper();
});

document.getElementById('cropCancel').addEventListener('click', closeCropper);
cropModal.addEventListener('click', e => { if (e.target === cropModal) closeCropper(); });

document.getElementById('profileInput').addEventListener('change', function() {
  if (this.files[0]) openCropper(this.files[0], 'profile', 1);
});
document.getElementById('bannerInput').addEventListener('change', function() {
  if (this.files[0]) openCropper(this.files[0], 'banner', 125/27);
});

// ════════════════════════════════════════
// UPLOAD IMAGE TO SERVER
// ════════════════════════════════════════
async function uploadImage(canvas, type) {
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('image', blob, `${type}.jpg`);
    formData.append('type', type); // 'profil' or 'banniere'

    try {
      const res  = await fetch('../../../api/Update image.php', { method: 'POST', body: formData });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { console.error('Upload PHP returned:', text); return; }
      if (data.success) { showNotification('✓ Photo mise à jour !'); }
      else { showNotification('❌ ' + (data.message || 'Erreur upload.')); }
    } catch (err) {
      console.error('uploadImage error:', err);
    }
  }, 'image/jpeg', 0.92);
}

// ════════════════════════════════════════
// COLOR SWATCHES
// ════════════════════════════════════════
const COLORS = [
  '#f5c5a3','#fbd8b4','#fce4c5','#fbcbc8','#f9b8c5',
  '#c8e6c9','#b2ebf2','#bbdefb','#e1bee7','#fff9c4',
  '#ffccbc','#dcedc8','#f8bbd0','#b3e5fc','#d7ccc8',
  '#ffe0b2','#c5cae9','#b2dfdb','#e8eaf6','#fce4ec',
];
const grid = document.getElementById('colorGrid');
let activeSwatch = null;

COLORS.forEach((c, i) => {
  const sw = document.createElement('button');
  sw.className = 'color-swatch' + (i === 0 ? ' active' : '');
  sw.style.background = c; sw.title = c;
  if (i === 0) activeSwatch = sw;
  sw.addEventListener('click', () => {
    if (activeSwatch) activeSwatch.classList.remove('active');
    sw.classList.add('active'); activeSwatch = sw;
    const dark  = adaptColor(c, 70);
    const light = c;
    document.getElementById('bannerBottom').style.background = `linear-gradient(120deg, ${dark}, ${light})`;
    saveBannerColor(dark, light); // ✅ save to DB
  });
  grid.appendChild(sw);
});

// ════════════════════════════════════════
// LIVE PREVIEW
// ════════════════════════════════════════
function updatePreview() {
  const nom     = document.getElementById('inputNom').value;
  const prenom  = document.getElementById('inputPrenom').value;
  const role    = document.getElementById('inputRole').value;
  const adresse = document.getElementById('inputAdresse').value;
  const full    = [nom, prenom].filter(Boolean).join(' ');

  document.getElementById('displayName').innerHTML =
    (full || 'Votre Nom') + ' <button class="cv-btn"><label for="cvInput">+ Ajouter Votre CV</label></button><span id="cvName"></span>';
  document.getElementById('displayRole').textContent    = role    || 'Votre rôle';
  document.getElementById('displayLocation').innerHTML =
    `<i class="fa-solid fa-location-dot"></i> ${adresse || 'Votre adresse'}`;

  const navImg = document.getElementById('navAvatarImg');
  if (navImg.style.display === 'none' || !navImg.src || navImg.src.endsWith('person.png')) {
    document.getElementById('navAvatarLetter').textContent =
      ([nom[0], prenom[0]].filter(Boolean).join('').toUpperCase()[0]) || '?';
  }
}

['inputNom','inputPrenom','inputRole','inputAdresse'].forEach(id =>
  document.getElementById(id).addEventListener('input', updatePreview));

// ════════════════════════════════════════
// APPLY BUTTON → saves to DB
// ════════════════════════════════════════
document.getElementById('applyBtn').addEventListener('click', saveProfile);

// ════════════════════════════════════════
// CV UPLOAD
// ════════════════════════════════════════
const cvInput = document.getElementById('cvInput');
const cvName  = document.getElementById('cvName');
let fileURL   = null;

if (cvInput) {
  cvInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      const file = this.files[0];
      fileURL = URL.createObjectURL(file);
      cvName.textContent = '📄 ' + file.name;
      cvName.style.cursor = 'pointer';
      cvName.style.textDecoration = 'underline';
    }
  });
}
if (cvName) {
  cvName.addEventListener('click', function() { if (fileURL) window.open(fileURL, '_blank'); });
}

// ════════════════════════════════════════
// SEE ALL SUGGESTIONS
// ════════════════════════════════════════
const seeAllBtn   = document.getElementById('seeAllBtn');
const listPreview = document.getElementById('suggestListPreview');
const listAll     = document.getElementById('suggestListAll');
let showingAll    = false;

if (seeAllBtn) {
  seeAllBtn.addEventListener('click', e => {
    e.preventDefault(); showingAll = !showingAll;
    if (showingAll) {
      if (listPreview) listPreview.style.display = 'none';
      if (listAll)     listAll.style.display = 'flex';
      seeAllBtn.textContent = '← réduire les suggestions';
    } else {
      if (listAll)     listAll.style.display = 'none';
      if (listPreview) listPreview.style.display = 'flex';
      seeAllBtn.textContent = 'voir tous les suggestions →';
    }
  });
}

// ════════════════════════════════════════
// CHAT PANEL + CHATBOT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  const panel      = document.getElementById('chatPanel');
  const closeBtn   = document.getElementById('chatPanelClose');
  const fabChatBtn = document.getElementById('fabMsgBtn');
  const navChatBtn = document.getElementById('navChat');
  const input      = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSend');
  const messages   = document.getElementById('chatMessages');

  const botPanel    = document.getElementById('chatbotPanel');
  const botCloseBtn = document.getElementById('chatbotClose');
  const fabHelpBtn  = document.getElementById('fabHelpBtn');
  const botInput    = document.getElementById('chatbotInput');
  const botSendBtn  = document.getElementById('chatbotSend');
  const botMessages = document.getElementById('chatbotMessages');

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  if (fabChatBtn) fabChatBtn.addEventListener('click', () => panel?.classList.add('active'));
  if (navChatBtn) navChatBtn.addEventListener('click', () => panel?.classList.add('active'));
  if (closeBtn)   closeBtn.addEventListener('click',   () => panel?.classList.remove('active'));
  if (fabHelpBtn) fabHelpBtn.addEventListener('click',  () => botPanel?.classList.add('active'));
  if (botCloseBtn) botCloseBtn.addEventListener('click',() => botPanel?.classList.remove('active'));

  function sendMessage() {
    if (!input) return;
    const text = input.value.trim(); if (!text) return;
    const now  = new Date(), time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    const msg  = document.createElement('div'); msg.className = 'chat-msg sent';
    msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${time}</span>`;
    messages.appendChild(msg); input.value = ''; messages.scrollTop = messages.scrollHeight;
  }

  function sendBotMessage() {
    if (!botInput) return;
    const text = botInput.value.trim(); if (!text) return;
    const now  = new Date(), time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    const userMsg = document.createElement('div'); userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${time}</span>`;
    botMessages.appendChild(userMsg); botInput.value = ''; botMessages.scrollTop = botMessages.scrollHeight;

    fetch('http://localhost:5000/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, user_id: 'anonymous' }),
    })
    .then(r => r.json())
    .then(data => {
      const t = new Date();
      const botMsg = document.createElement('div'); botMsg.className = 'chat-msg received';
      botMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(data.response || 'Désolé, une erreur s\'est produite.')}</div><span class="msg-time">${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}</span>`;
      botMessages.appendChild(botMsg); botMessages.scrollTop = botMessages.scrollHeight;
    })
    .catch(() => {
      const t = new Date();
      const errMsg = document.createElement('div'); errMsg.className = 'chat-msg received';
      errMsg.innerHTML = `<div class="msg-bubble">Impossible de contacter l'assistant.</div><span class="msg-time">${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}</span>`;
      botMessages.appendChild(errMsg); botMessages.scrollTop = botMessages.scrollHeight;
    });
  }

  if (sendBtn)    sendBtn.addEventListener('click', sendMessage);
  if (input)      input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });
});

// ════════════════════════════════════════
// HELP PANEL
// ════════════════════════════════════════
const helpOverlay = document.getElementById('helpOverlay');
const helpClose   = document.getElementById('helpClose');
if (helpClose)   helpClose.addEventListener('click',   () => helpOverlay?.classList.remove('active'));
if (helpOverlay) helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.classList.remove('active'); });

// ════════════════════════════════════════
// LINKS WIDGET
// ════════════════════════════════════════
const openBtn   = document.getElementById('openModal');
const modal     = document.getElementById('linkModal');
const closeBtn  = document.getElementById('closeModal');
const saveBtn   = document.querySelector('.save-btn');
const linkInput = document.getElementById('modalLinkInput');
const container = document.getElementById('linksContainer');
const emptyMsg  = document.getElementById('linksEmpty');
const badge     = document.getElementById('linksBadge');
const toggleBtn = document.getElementById('linksToggleBtn');
const dropdown  = document.getElementById('linksDropdown');

let links = JSON.parse(localStorage.getItem('links')) || [];

if (toggleBtn) toggleBtn.addEventListener('click', e => {
  e.stopPropagation(); dropdown?.classList.toggle('open'); toggleBtn.classList.toggle('active');
});
document.addEventListener('click', e => {
  if (dropdown && !dropdown.contains(e.target) && e.target !== toggleBtn) {
    dropdown.classList.remove('open'); toggleBtn?.classList.remove('active');
  }
});

function displayLinks() {
  if (!container) return;
  container.innerHTML = '';
  links.forEach((link, index) => {
    const div = document.createElement('div'); div.className = 'link-item';
    const icon = document.createElement('div'); icon.className = 'link-item-icon'; icon.innerHTML = '<i class="fa-solid fa-link"></i>';
    const a = document.createElement('a');
    try { a.textContent = new URL(link).hostname.replace('www.',''); } catch { a.textContent = link; }
    a.href = link; a.title = link; a.target = '_blank';
    a.addEventListener('click', e => e.stopPropagation());
    const delBtn = document.createElement('button'); delBtn.innerHTML = '&#x2715;'; delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', e => {
      e.stopPropagation(); links.splice(index, 1); localStorage.setItem('links', JSON.stringify(links)); displayLinks();
    });
    div.appendChild(icon); div.appendChild(a); div.appendChild(delBtn); container.appendChild(div);
  });
  if (emptyMsg) emptyMsg.style.display = links.length === 0 ? 'block' : 'none';
  if (badge) { badge.textContent = links.length; badge.style.display = links.length > 0 ? 'flex' : 'none'; }
}

if (openBtn) openBtn.addEventListener('click', e => {
  e.stopPropagation(); dropdown?.classList.remove('open'); toggleBtn?.classList.remove('active');
  if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
  setTimeout(() => linkInput?.focus(), 50);
});
if (closeBtn) closeBtn.addEventListener('click', () => {
  if (modal) modal.style.display = 'none'; document.body.classList.remove('modal-open'); if (linkInput) linkInput.value = '';
});
window.addEventListener('click', e => {
  if (e.target === modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); if (linkInput) linkInput.value = ''; }
});
if (linkInput) linkInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn?.click(); });
if (saveBtn) saveBtn.addEventListener('click', () => {
  const link = linkInput?.value.trim();
  if (!link) { showNotification('⚠️  Entrez un lien !'); return; }
  if (!link.startsWith('http')) { showNotification('⚠️  Lien invalide !'); return; }
  links.push(link); localStorage.setItem('links', JSON.stringify(links));
  if (linkInput) linkInput.value = ''; if (modal) modal.style.display = 'none';
  document.body.classList.remove('modal-open'); displayLinks(); showNotification('✓  Lien ajouté !');
});

async function loadAllUsers() {
  const list = document.getElementById('usersList');
  if (!list) {
    console.warn('usersList container not found');
    return;
  }

  list.innerHTML = 'Chargement...';

  try {
    const res = await fetch('/Mini-Projet%20-%20Copy/api/get-all-users.php');
    console.log('Fetch response status:', res.status);

    if (!res.ok) {
      list.innerHTML = 'Erreur serveur: ' + res.status;
      return;
    }

    const users = await res.json();
    console.log('Users loaded:', users);

    if (!Array.isArray(users)) {
      list.innerHTML = 'Données invalides';
      console.error('Expected array, got:', users);
      return;
    }

    list.innerHTML = '';

    users.forEach(user => {
      const item = document.createElement('div');
      item.className = 'suggest-item';

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'suggest-avatar';

      if (user.photo_profil) {
        const img = document.createElement('img');
        img.src = user.photo_profil;
        img.alt = user.prenom;
        img.onerror = () => {
          avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
          avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
        avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
      }

      const infoDiv = document.createElement('div');
      infoDiv.className = 'suggest-info';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = `${user.prenom} ${user.nom}`;

      const roleDiv = document.createElement('div');
      roleDiv.className = 'role';
      roleDiv.textContent = user.specialite || user.niveau || user.role || 'Utilisateur';

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(roleDiv);

      item.appendChild(avatarDiv);
      item.appendChild(infoDiv);

      // Make clickable to view profile
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        showNotification(`Profil de ${user.prenom} ${user.nom}`);
      });

      list.appendChild(item);
    });

  } catch (err) {
    console.error('Fetch error:', err);
    list.innerHTML = 'Erreur connexion: ' + err.message;
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadAllUsers);
// Also call immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllUsers);
} else {
  loadAllUsers();
}

displayLinks();