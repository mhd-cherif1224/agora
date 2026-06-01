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

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}

async function loadNavDots() {
        try {
            const res  = await fetch('../../../api/get-notifications.php');
            const data = await res.json();
            if (data.success && data.unread_count > 0) {
            const notifBtn = document.querySelector('.nav-icon-btn[title="Notifications"]');
            if (notifBtn && !notifBtn.querySelector('.notif-dot')) {
                const dot = document.createElement('span');
                dot.className = 'notif-dot';
                notifBtn.appendChild(dot);
                notifBtn.addEventListener('click', () => dot.remove(), { once: true });
            }
            }
        } catch (e) {}

        try {
            const res  = await fetch('../../../api/get-conversations.php');
            const data = await res.json();
            const hasUnread = Array.isArray(data) && data.some(c => c.unread_count > 0);
            if (hasUnread) {
            const msgBtn = document.getElementById('navChat');
            if (msgBtn && !msgBtn.querySelector('.notif-dot')) {
                const dot = document.createElement('span');
                dot.className = 'notif-dot';
                msgBtn.appendChild(dot);
                msgBtn.addEventListener('click', () => dot.remove(), { once: true });
            }
            }
        } catch (e) {}
    }


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
// initialisation
let currentUser = null;
  let lastConv    = null;   // { id, name, avatar, initials, gradient, messages[] }
  let socket      = null;

// ════════════════════════════════════════
// LOAD PROFILE FROM SESSION
// ════════════════════════════════════════
async function loadProfile() {
  try {
    const res  = await fetch('../../../api/get-profile.php');
    if (res.status === 401) { window.location.href = '../../../html/login-user.html'; return; }

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
      document.getElementById('profilePreview').src = buildPhotoUrl(data.avatar);
      navImg.src = buildPhotoUrl(data.avatar); navImg.style.display = 'block';
      navLetter.style.display = 'none';
    } else {
      navLetter.textContent = ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase()[0] || '?';
    }

    // ── Banner ──
    if (data.banner) {
      const t = document.getElementById('bannerTop');
      t.style.backgroundImage    = `url('${buildPhotoUrl(data.banner)}')`;
      t.style.backgroundSize     = 'cover';
      t.style.backgroundPosition = 'center';
    }

    const bannerBottom = document.getElementById('bannerBottom');
    if (bannerBottom && data.banner_color_dark && data.banner_color_light) {
      bannerBottom.style.background = `linear-gradient(to right, ${data.banner_color_dark}, ${data.banner_color_light})`;
    }

    updatePreview();         
    

    await loadExistingCV();

    // ── Hide notification button for Chercheur users ──
    if (data.status === 'Chercheur') {
        const notifBtn = document.querySelector('.nav-icon-btn[title="Notifications"]');
        if (notifBtn) notifBtn.style.display = 'none';
    }

    loadNavDots();
    
  } catch (err) {
    console.error('loadProfile error:', err);
  }
}

loadProfile();

// ════════════════════════════════════════
// SAVE PROFILE TO DB
// ════════════════════════════════════════
async function saveProfile() {
  const nom          = document.getElementById('inputNom').value.trim();
  const prenom       = document.getElementById('inputPrenom').value.trim();
  const localisation = document.getElementById('inputAdresse').value.trim();
  const niveau       = document.getElementById('inputNiveau').value.trim();
  const specialite   = document.getElementById('inputSpecialite').value.trim();

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
      // ── Sauvegarder la couleur en attente si elle existe ──
      if (pendingColors) {
        await saveBannerColor(pendingColors.dark, pendingColors.light);
        pendingColors = null;
      }
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
  // Pastels chauds
  '#fca5a5','#fdba74','#fcd34d','#fde68a','#bbf7d0',
  // Pastels froids
  '#6ee7b7','#67e8f9','#7dd3fc','#93c5fd','#c4b5fd',
  // Tons moyens vifs
  '#f472b6','#fb7185','#34d399','#38bdf8','#818cf8',
  // Tons profonds / sobres
  '#1e3a5f','#1e4d3b','#3b1f5e','#4a1f2e','#1c2340',
];

const grid = document.getElementById('colorGrid');
let activeSwatch  = null;
let pendingColors = null; // { dark, light } — en attente de sauvegarde

COLORS.forEach((c, i) => {
  const sw = document.createElement('button');
  sw.className = 'color-swatch' + (i === 0 ? ' active' : '');
  sw.style.background = c;
  sw.title = c;
  if (i === 0) activeSwatch = sw;

  sw.addEventListener('click', () => {
    if (activeSwatch) activeSwatch.classList.remove('active');
    sw.classList.add('active');
    activeSwatch = sw;

    const dark  = adaptColor(c, 70);
    const light = c;

    // ── Prévisualisation uniquement, pas de sauvegarde ──
    document.getElementById('bannerBottom').style.background =
      `linear-gradient(120deg, ${dark}, ${light})`;

    // Stocker en attente
    pendingColors = { dark, light };
  });

    grid.appendChild(sw);
    // Réinitialiser la prévisualisation si on quitte sans sauvegarder
    window.addEventListener('beforeunload', () => {
      if (pendingColors) {
        // Le rechargement annulera automatiquement — rien à faire
        pendingColors = null;
      }
    });
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

  // ── Met à jour uniquement le texte du nom, sans toucher au bouton CV ──
  const displayName = document.getElementById('displayName');
  if (displayName) {
    // Préserver le bouton CV et le span cvName s'ils existent déjà
    const existingCvBtn  = displayName.querySelector('.cv-btn');
    const existingCvName = displayName.querySelector('#cvName');

    const nameText = full || 'Votre Nom';

    if (!existingCvBtn) {
      // Première initialisation : créer tout le HTML
      displayName.innerHTML =
        nameText +
        ' <button class="cv-btn"><label for="cvInput">+ Ajouter Votre CV</label></button>' +
        '<span id="cvName"></span>';
    } else {
      // Mise à jour : modifier seulement le texte du nœud sans détruire le reste
      displayName.childNodes[0].textContent = nameText + ' ';
    }
  }

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
// ════════════════════════════════════════
// CV UPLOAD — init après updatePreview()
// ════════════════════════════════════════
let cvFileURL = null;

async function loadExistingCV() {
  try {
    const res  = await fetch('../../../api/get-profile.php');
    const data = await res.json();
    if (data.success && data.cv_path) {
      cvFileURL = buildPhotoUrl(data.cv_path);
      const filename = data.cv_path.split('/').pop();

      // Attendre que updatePreview() ait créé #cvName dans le DOM
      const waitForCvName = () => new Promise(resolve => {
        const check = () => {
          const el = document.getElementById('cvName');
          if (el) { resolve(el); return; }
          requestAnimationFrame(check);
        };
        check();
      });

      const cvNameEl = await waitForCvName();
      cvNameEl.textContent      = '📄';
      cvNameEl.dataset.filename = filename;
      cvNameEl.style.cursor     = 'pointer';
    }
  } catch (e) {
    console.warn('loadExistingCV error:', e);
  }
}

// Helpers pour accéder à cvName après création dynamique
function getCvInput()  { return document.getElementById('cvInput'); }
function getCvName()   { return document.getElementById('cvName'); }

const cvInput_ref = document.getElementById('cvInput');
if (cvInput_ref) {
  cvInput_ref.addEventListener('change', async function () {
    if (!this.files.length) return;
    const file = this.files[0];

    cvFileURL = URL.createObjectURL(file);
    const cvNameEl = getCvName();
    if (cvNameEl) {
      cvNameEl.textContent      = '📄';
      cvNameEl.dataset.filename = file.name;
      cvNameEl.style.cursor     = 'pointer';
    }

    const fd = new FormData();
    fd.append('cv', file);
    try {
      const res  = await fetch('../../../api/upload-cv.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        cvFileURL = buildPhotoUrl(data.cv_path);
        const cvNameEl2 = getCvName();
        if (cvNameEl2) cvNameEl2.dataset.filename = file.name;
        showNotification('✅ CV sauvegardé !');
      } else {
        showNotification('❌ ' + (data.message || 'Erreur upload CV'));
      }
    } catch (err) {
      showNotification('❌ Erreur réseau lors de l\'upload du CV');
    }
  });
}

// Délégation d'événement sur displayName pour gérer le clic sur #cvName (créé dynamiquement)
document.getElementById('displayName')?.addEventListener('click', e => {
  if (e.target.id === 'cvName' || e.target.closest('#cvName')) {
    if (cvFileURL) window.open(cvFileURL, '_blank');
  }
});



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
// ════════════════════════════════════════
// CHAT PANEL (FIXED)
// ════════════════════════════════════════


// ── chat.js ──
// Handles the floating chat panel open/close and message sending

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

  // ── State ──
  let currentUser = null;
  let lastConv    = null;   // { id, name, avatar, initials, gradient, messages[] }
  let socket      = null;

  // ── Open / Close ──
  function openChat()    { panel.classList.add('active'); }
  function closeChat()   { panel.classList.remove('active'); }
  function openBotChat() { botPanel.classList.add('active'); }
  function closeBotChat(){ botPanel.classList.remove('active'); }

  if (fabChatBtn) fabChatBtn.addEventListener('click', openChat);
  if (closeBtn)   closeBtn.addEventListener('click', closeChat);
  if (fabHelpBtn)  fabHelpBtn.addEventListener('click', openBotChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);

  // ── Bootstrap ──
  initChat();

  async function initChat() {
    await loadUserProfile();
    await loadLastConversation();
  }

  // ─────────────────────────────────────────
  // 1. LOAD CURRENT USER PROFILE
  // ─────────────────────────────────────────
  async function loadUserProfile() {
    try {
      const res  = await fetch('../../../api/get-profile.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.id) return;

      currentUser = {
        id:     data.id,
        nom:    data.nom,
        prenom: data.prenom,
        avatar: data.avatar
      };
    } catch (err) {
      console.warn('chat.js: could not load profile', err);
    }
  }

  //scroll to bottom of chat func
  function scrollToBottom() {
  if (!messages) return;
  messages.scrollTop = messages.scrollHeight;
}

  // ─────────────────────────────────────────
  // 2. LOAD LAST CONVERSATION
  // ─────────────────────────────────────────
  async function loadLastConversation() {
    try {
      const res  = await fetch('../../../api/get-conversations.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      // API returns convos sorted by last_message_time — first = most recent
      const u = data[0];
      lastConv = {
        id:       u.ID,
        name:     `${u.prenom} ${u.nom}`,
        avatar:   u.photo_profil || null,
        initials: getInitials(u.nom, u.prenom),
        gradient: randomGradient(u.ID),
        messages: []
      };
      

      updateChatPanelHeader();
      initWebSocket();

    } catch (err) {
      console.warn('chat.js: could not load conversations', err);
    }
  }

  // ─────────────────────────────────────────
  // 3. UPDATE CHAT PANEL HEADER
  // ─────────────────────────────────────────
  function updateChatPanelHeader() {
    if (!lastConv) return;

    const nameEl   = panel.querySelector('.chat-panel-name');
    const avatarEl = panel.querySelector('.chat-panel-avatar');

    if (nameEl) nameEl.textContent = lastConv.name;

    if (avatarEl) {
      if (lastConv.avatar) {
        avatarEl.innerHTML = `<img src="${buildPhotoUrl(lastConv.avatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        avatarEl.style.background = 'none';
      } else {
        avatarEl.textContent = lastConv.initials;
        avatarEl.style.background = lastConv.gradient;
      }
    }
  }

  // ─────────────────────────────────────────
  // 4. WEBSOCKET — fetch & receive history
  // ─────────────────────────────────────────
  function initWebSocket() {
    if (!currentUser?.id || !lastConv) return;

    // Avoid double-connecting
    if (socket) return;

    socket = io('http://localhost:3000', {
      query: { userId: currentUser.id }
    });

    socket.on('connect', () => {
      // Request message history for the most recent conversation
      socket.emit('get_history', { otherUserId: lastConv.id });
    });

    socket.on('conversation_history', ({ otherUserId, messages: msgs }) => {
      if (!lastConv || otherUserId !== lastConv.id) return;

      lastConv.messages = msgs.map(m => ({
        text: m.contenue,
        time: m.DateEnvoie,
        sent: m.ID_Expediteur === currentUser.id
      }));

      renderMessages();
    });

    // Live incoming messages
    socket.on(`msg_${currentUser.id}`, msg => {
      if (!lastConv) return;
      const otherId =
        msg.ID_Expediteur === currentUser.id
          ? msg.ID_Destinataire
          : msg.ID_Expediteur;

      if (otherId !== lastConv.id) return;

      lastConv.messages.push({
        text: msg.contenue,
        time: msg.DateEnvoie,
        sent: msg.ID_Expediteur === currentUser.id
      });
      renderMessages();
    });
  }

  // ─────────────────────────────────────────
  // 5. RENDER MESSAGES IN CHAT PANEL
  // ─────────────────────────────────────────
  function renderMessages() {
    if (!lastConv || !messages) return;

    messages.innerHTML = '';

    lastConv.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat-msg ${msg.sent ? 'sent' : 'received'}`;
      div.innerHTML = `
        <div class="msg-bubble">${escapeHtml(msg.text)}</div>
        <span class="msg-time">${formatTime(msg.time)}</span>
      `;
      messages.appendChild(div);
    });

    scrollToBottom();

  }



  // ─────────────────────────────────────────
  // 6. SEND MESSAGE (human chat panel)
  // ─────────────────────────────────────────
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Optimistic render
    const div = document.createElement('div');
    div.className = 'chat-msg sent';
    div.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${formatTime(new Date().toISOString())}</span>
    `;
    messages.appendChild(div);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Send via socket if connected
    if (socket && lastConv && currentUser) {
      socket.emit('send_message', {
        ID_Expediteur:   currentUser.id,
        ID_Destinataire: lastConv.id,
        contenue:        text
      });
    }
  }

  // ─────────────────────────────────────────
  // 7. CHATBOT
  // ─────────────────────────────────────────
  function sendBotMessage() {
    const text = botInput.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${formatTime(new Date().toISOString())}</span>
    `;
    botMessages.appendChild(userMsg);
    botInput.value = '';
    botMessages.scrollTop = botMessages.scrollHeight;

    const userId = currentUser?.id
      || localStorage.getItem('utilisateur_id')
      || localStorage.getItem('admin_id')
      || 'anonymous';

    fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, user_id: userId }),
    })
    .then(r => r.json())
    .then(data => appendBotReply(data.response || 'Désolé, une erreur s\'est produite.'))
    .catch(() => appendBotReply('Impossible de contacter l\'assistant.'));
  }

  function appendBotReply(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg received';
    div.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${formatTime(new Date().toISOString())}</span>
    `;
    botMessages.appendChild(div);
    botMessages.scrollTop = botMessages.scrollHeight;
  }

  // ─────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input)   input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getInitials(nom, prenom) {
    return ((nom?.[0] || '') + (prenom?.[0] || '')).toUpperCase();
  }

  function formatTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function randomGradient(seed) {
    const gradients = [
      'linear-gradient(135deg,#e44,#f97316)',
      'linear-gradient(135deg,#059669,#34d399)',
      'linear-gradient(135deg,#7c3aed,#a78bfa)',
      'linear-gradient(135deg,#0ea5e9,#38bdf8)',
      'linear-gradient(135deg,#db2777,#f472b6)',
    ];
    return gradients[(seed || 0) % gradients.length];
  }

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

  const PREVIEW_COUNT = 4;
  list.innerHTML = 'Chargement...';

  try {
    const res = await fetch('../../../api/get-all-users.php');
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

    const items = users.map((user, i) => {
      const item = document.createElement('div');
      item.className = 'suggest-item';
      if (i >= PREVIEW_COUNT) item.classList.add('suggest-item--hidden');

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'suggest-avatar';

      if (user.photo_profil) {
        const img = document.createElement('img');
        img.src = buildPhotoUrl(user.photo_profil);
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

      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        window.location.href = `../../UI/profile/profile.html?id=${user.ID}`;
      });

      list.appendChild(item);
      return item;
    });

    if (users.length > PREVIEW_COUNT) {
  const suggestToggleBtn = document.createElement('button');  
  suggestToggleBtn.className = 'suggest-toggle-btn';
  suggestToggleBtn.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
  suggestToggleBtn.title = 'Voir plus';
  let expanded = false;
  suggestToggleBtn.addEventListener('click', () => {
    expanded = !expanded;
    items.forEach((item, i) => {
      if (i >= PREVIEW_COUNT) {
        item.classList.toggle('suggest-item--hidden', !expanded);
        item.classList.toggle('suggest-item--visible', expanded);
      }
    });
    suggestToggleBtn.innerHTML = expanded
      ? `<i class="fa-solid fa-chevron-up"></i>`
      : `<i class="fa-solid fa-chevron-down"></i>`;
    suggestToggleBtn.title = expanded ? 'Réduire' : 'Voir plus';
  });
  list.appendChild(suggestToggleBtn);
}

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


// ════════════════════════════════════════
// NOTIFICATIONS TOAST
// ════════════════════════════════════════
function showNotification1(message, color = '#16376E') {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.innerText = message;
    notif.style.background = color; 
    notif.style.display = 'flex';
    clearTimeout(notif._t);
    notif._t = setTimeout(() => { notif.style.display = 'none'; }, 3000); 
}

// ── Nav dropdown (menu burger) ──
const navMenuBtn  = document.getElementById('navMenuBtn');
const navDropdown = document.getElementById('navDropdown');

navMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navDropdown.hidden = !navDropdown.hidden;
});

// Fermer si on clique ailleurs
document.addEventListener('click', () => {
    navDropdown.hidden = true;
});


// Suppression du compte
document.getElementById('btnSupprimerCompte').addEventListener('click', () => {
    navDropdown.hidden = true;
    document.getElementById('modalSupprimer').hidden = false;
});

// Annuler
document.getElementById('modalCancel').addEventListener('click', () => {
    document.getElementById('modalSupprimer').hidden = true;
});

// Fermer en cliquant sur l'overlay
document.getElementById('modalOverlay').addEventListener('click', () => {
    document.getElementById('modalSupprimer').hidden = true;
});

// Déconnexion
document.getElementById('btnDeconnexion').addEventListener('click', () => {
    window.location.href = '../../html/login-user.html'; 
});

// Confirmer suppression
document.getElementById('modalConfirm').addEventListener('click', async () => {
    document.getElementById('modalSupprimer').hidden = true;

    const res  = await fetch('../../../api/delete-account.php', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
        showNotification1('Compte supprimé. Redirection...', '#16376E');
        setTimeout(() => {
            window.location.href = '../../html/signUp-user.html'; // 
        }, 2000);
    } else {
        showNotification1('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'), '#b91c1c');
    }
});