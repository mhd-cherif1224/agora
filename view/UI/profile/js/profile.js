//profile.js

// ════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════
let currentProfileSrc = null;

// currentUser = utilisateur CONNECTÉ (chargé via get-profile.php)
let currentUser = {
  id: null,
  nom: '',
  prenom: '',
  initiales: '',
  avatar: null
};

// profileOwnerId = ID du profil qu'on est en train de consulter (depuis ?id=)
let profileOwnerId = null;

let socket   = null;
let lastConv = null;

// ════════════════════════════════════════
// PATH HELPER
// ════════════════════════════════════════
function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}

// ════════════════════════════════════════
// LOAD PROFILE FROM SESSION (PHP API)
// Affiche les données du profil visité (?id=)
// ════════════════════════════════════════
async function loadProfile() {
  try {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    const url = userId
      ? `../../../api/get-user.php?id=${userId}`
      : `../../../api/get-profile.php`;

    const res = await fetch(url);
    if (res.status === 401) {
      window.location.href = '../../../html/login-user.html';
      return;
    }

    const data = await res.json();
    if (!data.success) return;

    const user = data.user || data;

    const displayName = document.getElementById('displayName');
    if (displayName) displayName.childNodes[0].textContent = `${user.prenom} ${user.nom}`.trim();

    const displayRole = document.getElementById('displayRole');
    if (displayRole) displayRole.textContent = user.specialite || user.niveau || user.role || '';

    const displayLocation = document.getElementById('displayLocation');
    if (displayLocation)
      displayLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${user.localisation || 'Algérie'}`;

    const profilePreview = document.getElementById('profilePreview');
    if (profilePreview && user.photo_profil)
      profilePreview.src = buildPhotoUrl(user.photo_profil);

    const bannerTop = document.getElementById('bannerTop');
    if (bannerTop && user.photo_banniere) {
      bannerTop.style.backgroundImage    = `url('${buildPhotoUrl(user.photo_banniere)}')`;
      bannerTop.style.backgroundSize     = 'cover';
      bannerTop.style.backgroundPosition = 'center';
      bannerTop.style.backgroundRepeat   = 'no-repeat';
    }

    const bannerBottom = document.getElementById('bannerBottom');
    if (bannerBottom && user.banner_color_dark && user.banner_color_light) {
      bannerBottom.style.background = `linear-gradient(to right, ${user.banner_color_dark}, ${user.banner_color_light})`;
    }

    const messageBtn = document.getElementById('messageBtn');
    if (messageBtn && user.ID) {
      messageBtn.dataset.userId = user.ID;
    }

    // Stocker l'ID du propriétaire du profil visité
    profileOwnerId = user.ID || null;

  } catch (err) {
    console.error('loadProfile error:', err);
  }
}

loadProfile();

// ════════════════════════════════════════
// NOTIFICATIONS TOAST
// ════════════════════════════════════════
function showNotification(message, duration = 3500) {
  const notif = document.getElementById('notification');
  if (!notif) return;
  notif.innerText = message;
  notif.style.display = 'flex';
  clearTimeout(notif._t);
  notif._t = setTimeout(() => { notif.style.display = 'none'; }, duration);
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
    if (w > MAX || h > MAX) { const s = MAX / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    canvas.width = w; canvas.height = h; ctx.drawImage(source, 0, 0, w, h);
  }
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data, counts = {};
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = Math.round(data[i] / 16) * 16, g = Math.round(data[i + 1] / 16) * 16, b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`; counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([key]) => { const [r, g, b] = key.split(',').map(Number); return { hex: '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('') }; });
}

function adaptColor(hex, amount = 80) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const br = (r * 299 + g * 587 + b * 114) / 1000;
  if (br > 128) { r = Math.max(0, r - amount); g = Math.max(0, g - amount); b = Math.max(0, b - amount); }
  else { r = Math.min(255, r + amount); g = Math.min(255, g + amount); b = Math.min(255, b + amount); }
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function changeBannerColor(color1, color2) {
  const br = h => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return (r * 299 + g * 587 + b * 114) / 1000; };
  const dark  = br(color1) < br(color2) ? color1 : color2;
  const light = br(color1) < br(color2) ? color2 : color1;
  const bannerBottom = document.getElementById('bannerBottom');
  if (bannerBottom) bannerBottom.style.background = `linear-gradient(to right, ${dark}, ${light})`;
}

// ════════════════════════════════════════
// UPDATE ALL POST AVATARS
// ════════════════════════════════════════
function updateAllPostAvatars(src) {
  currentProfileSrc = src;
  document.querySelectorAll('.post-avatar-dyn').forEach(el => {
    if (el.tagName === 'IMG') { el.src = src; }
    else {
      const img = document.createElement('img');
      img.src = src; img.className = el.className;
      img.style.cssText = el.style.cssText || 'width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0;';
      el.replaceWith(img);
    }
  });
  document.querySelectorAll('.comment-input-avatar, .comment-avatar').forEach(av => {
    av.style.backgroundImage    = `url(${src})`;
    av.style.backgroundSize     = 'cover';
    av.style.backgroundPosition = 'center';
    av.textContent = '';
  });
  const npAv = document.getElementById('newPostAvatar');
  if (npAv) {
    npAv.style.backgroundImage    = `url(${src})`;
    npAv.style.backgroundSize     = 'cover';
    npAv.style.backgroundPosition = 'center';
    npAv.textContent = '';
  }
}

// ════════════════════════════════════════
// CROPPER
// ════════════════════════════════════════
let cropperInstance = null, cropTarget = null;
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');

function openCropper(file, target, aspectRatio) {
  cropTarget = target;
  const valid = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  if (!valid.includes(file.type)) { showNotification('Format non supporté !'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    cropImage.src = e.target.result;
    cropModal.classList.add('active');
    cropImage.onload = () => {
      cropperInstance = new Cropper(cropImage, {
        aspectRatio, viewMode: 1, movable: true, zoomable: true,
        scalable: false, cropBoxResizable: true, background: false,
      });
    };
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════
// CV — lecture seule (profil visité)
// ════════════════════════════════════════
const cvName = document.getElementById('cvName');
let cvFileURL = null;

async function loadProfileCV() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  if (!userId) return;
  try {
    const res  = await fetch(`../../../api/get-profile.php?id=${userId}`);  // ou get-user.php selon votre API
    const data = await res.json();
    if (data.success && data.cv_path && cvName) {
      cvFileURL = buildPhotoUrl(data.cv_path);
      const filename = data.cv_path.split('/').pop();
      cvName.textContent      = '📄';
      cvName.dataset.filename = filename;
      cvName.style.cursor     = 'pointer';
    }
  } catch (e) {}
}

if (cvName) {
  cvName.addEventListener('click', () => { if (cvFileURL) window.open(cvFileURL, '_blank'); });
}

loadProfileCV();

// ════════════════════════════════════════
// SEE ALL SUGGESTIONS
// ════════════════════════════════════════
const seeAllBtn   = document.getElementById('seeAllBtn');
const listPreview = document.getElementById('suggestListPreview');
const listAll     = document.getElementById('suggestListAll');
let showingAll = false;

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
  const input      = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSendBtn');
  const messages   = document.getElementById('chatMessages');

  const botPanel    = document.getElementById('chatbotPanel');
  const botCloseBtn = document.getElementById('chatbotClose');
  const botInput    = document.getElementById('chatbotInput');
  const botSendBtn  = document.getElementById('chatbotSend');
  const botMessages = document.getElementById('chatbotMessages');
  const messageBtn  = document.getElementById('messageBtn');
  const fabHelpBtn  = document.getElementById('fabHelpBtn');

  // ── Charge l'utilisateur CONNECTÉ (pas le profil visité) ──
  async function loadUserProfile() {
    try {
      const res = await fetch('../../../api/get-profile.php');
      if (res.status === 401) { window.location.href = '../../../html/login.html'; return; }
      const data = await res.json();
      if (!data.success || !data.id) return;

      currentUser = {
        id:       data.id,
        nom:      data.nom,
        prenom:   data.prenom,
        initiales: ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase() || '?',
        avatar:   data.avatar
      };

      const navImg    = document.getElementById('navAvatarImg');
      const navLetter = document.getElementById('navAvatarLetter');
      if (data.avatar) {
        if (navImg)    { navImg.src = buildPhotoUrl(data.avatar); navImg.style.display = 'block'; }
        if (navLetter)   navLetter.style.display = 'none';
      } else {
        if (navLetter) {
          navLetter.textContent = ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase();
          navLetter.style.display = 'block';
        }
        if (navImg) navImg.style.display = 'none';
      }

      // Charger les liens APRÈS avoir currentUser.id, et appliquer la visibilité
      loadLinks();
      applyLinksVisibility();
      loadNavDots(); 

    } catch (err) {
      console.error('Profile error:', err);
    }
  }

  function initWebSocket() {
    if (!currentUser?.id || !lastConv) return;
    if (socket) return;
    socket = io('http://localhost:3000', { query: { userId: currentUser.id } });
    socket.on('connect', () => { socket.emit('get_history', { otherUserId: lastConv.id }); });
    socket.on('conversation_history', ({ otherUserId, messages: msgs }) => {
      if (!lastConv || otherUserId !== lastConv.id) return;
      lastConv.messages = msgs.map(m => ({ text: m.contenue, time: m.DateEnvoie, sent: m.ID_Expediteur === currentUser.id }));
      renderMessages();
    });
    socket.on(`msg_${currentUser.id}`, msg => {
      if (!lastConv) return;
      const otherId = msg.ID_Expediteur === currentUser.id ? msg.ID_Destinataire : msg.ID_Expediteur;
      if (otherId !== lastConv.id) return;
      lastConv.messages.push({ text: msg.contenue, time: msg.DateEnvoie, sent: msg.ID_Expediteur === currentUser.id });
      renderMessages();
    });
  }

  function renderMessages() {
    if (!lastConv || !messages) return;
    messages.innerHTML = '';
    lastConv.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat-msg ${msg.sent ? 'sent' : 'received'}`;
      div.innerHTML = `<div class="msg-bubble">${escapeHtml(msg.text)}</div><span class="msg-time">${formatTime(msg.time)}</span>`;
      messages.appendChild(div);
    });
    scrollToBottom();
  }

  function openChat()    { panel.classList.add('active'); }
  function closeChat()   { panel.classList.remove('active'); }
  function openBotChat() { botPanel.classList.add('active'); }
  function closeBotChat(){ botPanel.classList.remove('active'); }

  if (fabChatBtn) fabChatBtn.addEventListener('click', openChat);
  if (closeBtn)   closeBtn.addEventListener('click', closeChat);
  if (fabHelpBtn)  fabHelpBtn.addEventListener('click', openBotChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);

  initChat();

  async function initChat() {
    await loadUserProfile();
    await loadLastConversation();
  }

  function scrollToBottom() {
    if (!messages) return;
    messages.scrollTop = messages.scrollHeight;
  }

  async function loadLastConversation() {
    try {
      const res  = await fetch('../../../api/get-conversations.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;
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
      console.warn('could not load conversations', err);
    }
  }

  async function switchConversation(userId) {
    try {
      const res  = await fetch(`../../../api/get-user.php?id=${userId}`);
      const data = await res.json();
      if (!data.success) return;
      const user = data.user || data;
      if (!lastConv) {
        lastConv = { id: null, name: '', avatar: null, initials: '', gradient: '', messages: [] };
      }
      lastConv.id       = user.ID;
      lastConv.name     = `${user.prenom} ${user.nom}`;
      lastConv.avatar   = user.photo_profil || null;
      lastConv.initials = (user.prenom[0] + user.nom[0]).toUpperCase();
      lastConv.messages = [];
      updateChatPanelHeader();
      const msgs = document.getElementById('chatMessages');
      if (msgs) msgs.innerHTML = '';
      if (socket) socket.emit('get_history', { otherUserId: user.ID });
      document.getElementById('chatPanel')?.classList.add('active');
    } catch (err) { console.error(err); }
  }

  if (messageBtn) {
    messageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = messageBtn.dataset.userId;
      if (!userId) return;
      switchConversation(userId);
    });
  }

  function updateChatPanelHeader() {
    if (!lastConv) return;
    const nameEl   = panel.querySelector('.chat-panel-name');
    const avatarEl = panel.querySelector('.chat-panel-avatar');
    if (nameEl) nameEl.textContent = lastConv.name;
    if (lastConv.avatar) {
      avatarEl.innerHTML = `<img src="../../../${lastConv.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      avatarEl.style.background = 'none';
    } else {
      avatarEl.textContent = lastConv.initials;
      avatarEl.style.background = lastConv.gradient;
    }
  }

  function sendMessage() {
    const text = input.value.trim(); if (!text) return;
    if (!lastConv?.id || !currentUser?.id) { showNotification('Conversation non initialisée.'); return; }
    const div = document.createElement('div');
    div.className = 'chat-msg sent';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    messages.appendChild(div); input.value = ''; messages.scrollTop = messages.scrollHeight;
    const payload = { ID_Expediteur: currentUser.id, ID_Destinataire: lastConv.id, contenue: text };
    if (socket?.connected) {
      socket.emit('send_message', payload);
    } else {
      if (!socket) initWebSocket();
      socket.once('connect', () => socket.emit('send_message', payload));
    }
  }

  function sendBotMessage() {
    const text = botInput.value.trim(); if (!text) return;
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    botMessages.appendChild(userMsg); botInput.value = ''; botMessages.scrollTop = botMessages.scrollHeight;
    const userId = currentUser?.id || 'anonymous';
    fetch('http://localhost:5000/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, user_id: userId }),
    })
    .then(r => r.json())
    .then(data => appendBotReply(data.response || 'Désolé, une erreur s\'est produite.'))
    .catch(() => appendBotReply('Impossible de contacter l\'assistant.'));
  }

  function appendBotReply(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg received';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    botMessages.appendChild(div); botMessages.scrollTop = botMessages.scrollHeight;
  }

  if (sendBtn)    sendBtn.addEventListener('click', sendMessage);
  if (input)      input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

  function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function getInitials(nom, prenom) { return ((nom?.[0] || '') + (prenom?.[0] || '')).toUpperCase(); }
  function formatTime(d) { if (!d) return ''; return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function randomGradient(seed) {
    const gradients = [
      'linear-gradient(135deg,#e44,#f97316)', 'linear-gradient(135deg,#059669,#34d399)',
      'linear-gradient(135deg,#7c3aed,#a78bfa)', 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
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
if (helpClose)   helpClose.addEventListener('click', () => helpOverlay?.classList.remove('active'));
if (helpOverlay) helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.classList.remove('active'); });

// ════════════════════════════════════════
// LINKS WIDGET
// ════════════════════════════════════════
const openBtn        = document.getElementById('openModal');
const modal          = document.getElementById('linkModal');
const closeModalBtn  = document.getElementById('closeModal');
const saveBtn        = document.querySelector('.save-btn');
const linkInput      = document.getElementById('modalLinkInput');
const linksContainer = document.getElementById('linksContainer');
const emptyMsg       = document.getElementById('linksEmpty');
const badge          = document.getElementById('linksBadge');
const toggleBtn      = document.getElementById('linksToggleBtn');
const dropdown       = document.getElementById('linksDropdown');

// ── Clé localStorage isolée par utilisateur connecté ──
function getLinksKey() {
  return `links_${currentUser?.id || 'guest'}`;
}

let links = [];

function loadLinks() {
  links = JSON.parse(localStorage.getItem(getLinksKey())) || [];
  displayLinks();
}

function saveLinks() {
  localStorage.setItem(getLinksKey(), JSON.stringify(links));
}

// ── Détecter si on est sur son propre profil ──
function isOwnProfile() {
  const params    = new URLSearchParams(window.location.search);
  const profileId = params.get('id');
  // Pas de ?id= → forcément son propre profil
  if (!profileId) return true;
  // Avec ?id= → comparer avec l'utilisateur connecté
  return String(profileId) === String(currentUser?.id);
}

// ── Appliquer la visibilité du widget selon le profil ──
function applyLinksVisibility() {
  const own    = isOwnProfile();
  const addBtn = document.getElementById('openModal');

  if (own) {
    // ── Propre profil : afficher ses propres liens, permettre l'ajout ──
    if (addBtn) addBtn.style.display = '';
    // links déjà chargés via loadLinks() → displayLinks() s'occupera des boutons supprimer
  } else {
    // ── Profil étranger : afficher les liens du PROPRIÉTAIRE en lecture seule ──
    if (addBtn) addBtn.style.display = 'none';

    const params    = new URLSearchParams(window.location.search);
    const ownerId   = params.get('id');
    links = JSON.parse(localStorage.getItem(`links_${ownerId}`)) || [];
    displayLinks();

    // Masquer tous les boutons de suppression après le rendu
    document.querySelectorAll('#linksContainer .delete-btn').forEach(b => b.style.display = 'none');
  }
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown?.classList.toggle('open');
    toggleBtn.classList.toggle('active');
  });
}
document.addEventListener('click', e => {
  if (dropdown && !dropdown.contains(e.target) && e.target !== toggleBtn) {
    dropdown.classList.remove('open');
    toggleBtn?.classList.remove('active');
  }
});

function displayLinks() {
  if (!linksContainer) return;
  linksContainer.innerHTML = '';
  links.forEach((link, index) => {
    const div  = document.createElement('div'); div.className = 'link-item';
    const icon = document.createElement('div'); icon.className = 'link-item-icon';
    icon.innerHTML = '<i class="fa-solid fa-link"></i>';
    const a = document.createElement('a');
    try { a.textContent = new URL(link).hostname.replace('www.', ''); } catch { a.textContent = link; }
    a.href = link; a.title = link; a.target = '_blank';
    a.addEventListener('click', e => e.stopPropagation());
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '&#x2715;'; delBtn.className = 'delete-btn'; delBtn.title = 'Supprimer';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      links.splice(index, 1);
      saveLinks();
      displayLinks();
    });
    div.appendChild(icon); div.appendChild(a); div.appendChild(delBtn);
    linksContainer.appendChild(div);
  });
  if (emptyMsg) emptyMsg.style.display = links.length === 0 ? 'block' : 'none';
  if (badge) {
    badge.textContent   = links.length;
    badge.style.display = links.length > 0 ? 'flex' : 'none';
  }
}

if (openBtn) {
  openBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown?.classList.remove('open');
    toggleBtn?.classList.remove('active');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
    setTimeout(() => linkInput?.focus(), 50);
  });
}
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    if (linkInput) linkInput.value = '';
  });
}
window.addEventListener('click', e => {
  if (e.target === modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    if (linkInput) linkInput.value = '';
  }
});
if (linkInput) linkInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn?.click(); });
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    if (!isOwnProfile()) return; // sécurité supplémentaire
    const link = linkInput?.value.trim();
    if (!link) { showNotification('⚠️  Entrez un lien !'); return; }
    if (!link.startsWith('http')) { showNotification('⚠️  Lien invalide !'); return; }
    links.push(link);
    saveLinks();
    if (linkInput) linkInput.value = '';
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    displayLinks();
    showNotification('✓  Lien ajouté !');
  });
}

// NE PAS appeler displayLinks() ici — sera appelé par loadUserProfile() → loadLinks() → applyLinksVisibility()

// ════════════════════════════════════════
// LOAD ALL USERS FOR SIDEBAR
// ════════════════════════════════════════
async function loadAllUsers() {
  const list = document.getElementById('usersList');
  if (!list) return;
  list.innerHTML = 'Chargement...';
  try {
    const res = await fetch('../../../api/get-all-users.php');
    if (!res.ok) { list.innerHTML = 'Erreur serveur: ' + res.status; return; }
    const users = await res.json();
    if (!Array.isArray(users)) { list.innerHTML = 'Données invalides'; return; }
    list.innerHTML = '';
    users.forEach(user => {
      const item      = document.createElement('div'); item.className = 'suggest-item';
      const avatarDiv = document.createElement('div'); avatarDiv.className = 'suggest-avatar';
      if (user.photo_profil) {
        const img = document.createElement('img');
        img.src = buildPhotoUrl(user.photo_profil); img.alt = user.prenom;
        img.onerror = () => {
          avatarDiv.innerHTML = '';
          avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
          avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
        avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
      }
      const infoDiv = document.createElement('div'); infoDiv.className = 'suggest-info';
      const nameDiv = document.createElement('div'); nameDiv.className = 'name';
      nameDiv.textContent = `${user.prenom} ${user.nom}`;
      const roleDiv = document.createElement('div'); roleDiv.className = 'role';
      roleDiv.textContent = user.specialite || user.niveau || user.role || 'Utilisateur';
      infoDiv.appendChild(nameDiv); infoDiv.appendChild(roleDiv);
      item.appendChild(avatarDiv); item.appendChild(infoDiv);
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        window.location.href = `profile.html?id=${user.ID}`;
      });
      list.appendChild(item);
    });
  } catch (err) {
    console.error('Fetch error:', err);
    list.innerHTML = 'Erreur connexion: ' + err.message;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllUsers);
} else {
  loadAllUsers();
}

// ════════════════════════════════════════
// INJECT STYLES
// ════════════════════════════════════════
(function () {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes postCardIn{from{transform:translateY(-14px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes postCardOut{to{opacity:0;transform:translateX(30px)}}
    .post-ctx-menu{display:none;position:absolute;top:34px;right:0;width:185px;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.14);z-index:500;padding:6px;animation:ctxIn .18s cubic-bezier(.34,1.3,.64,1) both}
    .post-ctx-menu.open{display:block}
    @keyframes ctxIn{from{transform:translateY(-6px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
    .ctx-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;font-family:'DM Sans',sans-serif;color:var(--text);transition:background .15s}
    .ctx-item:hover{background:var(--input-bg)}
    .ctx-item i{width:16px;text-align:center;color:var(--muted);font-size:12px}
    .ctx-item.danger{color:#dc2626}.ctx-item.danger i{color:#dc2626}
    .post-menu-btn{position:relative}
    .comment-item{display:flex;gap:8px;align-items:flex-start;padding:8px 18px}
    .comment-avatar{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;overflow:hidden;}
    .comment-avatar img{width:100%;height:100%;object-fit:cover;display:block}
    .comment-body{flex:1}
    .comment-header{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
    .comment-name{font-weight:700;font-size:12px;color:var(--text)}
    .comment-stars{font-size:10px;color:#f59e0b}
    .comment-date{font-size:10px;color:var(--muted);margin-left:auto}
    .comment-text{font-size:12px;color:var(--text);line-height:1.5;margin:0}
    .post-pin-badge{display:none;position:absolute;top:12px;right:48px;background:#fef3e2;border:1px solid #fed7aa;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:#d97706;align-items:center;gap:4px}
    .post-pin-badge.visible{display:flex}
    .post-card{position:relative}
  `;
  document.head.appendChild(s);
})();

// ════════════════════════════════════════
// BUILD HELPERS
// ════════════════════════════════════════
function buildDynAvatar(src, size) {
  if (src) {
    const img = document.createElement('img');
    img.src = src; img.className = 'post-avatar post-avatar-dyn';
    img.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0;`;
    return img;
  }
  const div = document.createElement('div');
  div.className = 'post-avatar-placeholder post-avatar-dyn';
  div.style.cssText = `width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;`;
  div.textContent = currentUser.initiales || '?';
  return div;
}

function buildCommentSection(card) {
  const sec = document.createElement('div'); sec.className = 'comments-section';
  const initiales  = currentUser.initiales || '?';
  const cmtAvStyle = currentProfileSrc
    ? `background-image:url(${currentProfileSrc});background-size:cover;background-position:center`
    : '';
  sec.innerHTML = `
    <div class="comment-list"></div>
    <div class="comment-input-row">
      <div class="comment-input-avatar" style="${cmtAvStyle}">${currentProfileSrc ? '' : initiales}</div>
      <input class="comment-input" placeholder="Écrire un commentaire…">
      <button class="comment-send"><i class="fa-solid fa-paper-plane"></i></button>
    </div>`;
  card.appendChild(sec);
  const cmtInput = sec.querySelector('.comment-input');
  const cmtSend  = sec.querySelector('.comment-send');
  const cmtList  = sec.querySelector('.comment-list');
  function addComment() {
    const txt = cmtInput.value.trim(); if (!txt) return;
    const now  = new Date(); const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    const item = document.createElement('div'); item.className = 'comment-item';
    const fullName = `${currentUser.prenom} ${currentUser.nom}`.trim() || 'Moi';
    const avHTML   = currentProfileSrc
      ? `<div class="comment-avatar" style="background-image:url(${currentProfileSrc});background-size:cover;background-position:center;background-color:transparent"></div>`
      : `<div class="comment-avatar">${initiales}</div>`;
    item.innerHTML = `${avHTML}<div class="comment-bubble"><div class="comment-author">${fullName}</div><div class="comment-text">${txt.replace(/</g, '&lt;')}</div><div class="comment-time">${time}</div></div>`;
    cmtList.appendChild(item); cmtInput.value = '';
    showNotification('💬 Commentaire ajouté avec succès !');
  }
  cmtSend.addEventListener('click', addComment);
  cmtInput.addEventListener('keydown', e => { if (e.key === 'Enter') addComment(); });
  return sec;
}

// ════════════════════════════════════════
// BUILD COMMENT ITEM (ratings from API)
// ════════════════════════════════════════
function buildProfileCommentItem(name, note, text, date, photoProfile) {
  const item      = document.createElement('div'); item.className = 'comment-item';
  const initials  = name.slice(0, 2).toUpperCase();
  const starsHtml = Array.from({ length: 5 }, (_, i) =>
    `<i class="${i < note ? 'fa-solid' : 'fa-regular'} fa-star"></i>`).join('');
  const avatarHtml = photoProfile
    ? `<img src="../../../${photoProfile}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : initials;
  item.innerHTML = `
    <div class="comment-avatar" style="${photoProfile ? '' : 'background:linear-gradient(135deg,#4b48ec,#7299f4);'}">
      ${avatarHtml}
    </div>
    <div class="comment-body">
      <div class="comment-header">
        <span class="comment-name">${name}</span>
        <div class="comment-stars">${starsHtml}</div>
        <span class="comment-date">${date}</span>
      </div>
      ${text ? `<p class="comment-text">${text}</p>` : ''}
    </div>`;
  return item;
}

// ════════════════════════════════════════
// RATING HELPERS
// ════════════════════════════════════════
function renderPickerStars(picker, upTo, isHover = false) {
  picker.querySelectorAll('[data-star]').forEach(s => {
    const n = parseInt(s.dataset.star);
    s.className = n <= upTo
      ? (isHover ? 'fa-regular fa-star hovered' : 'fa-solid fa-star selected')
      : 'fa-regular fa-star';
  });
}

function closeRatingPanel(card) {
  const panel    = card.querySelector('.rating-panel');
  const picker   = card.querySelector('.star-picker');
  const textarea = card.querySelector('.rating-comment-input');
  if (!panel || !picker || !textarea) return;
  panel.hidden = true;
  picker.dataset.selected = 0;
  renderPickerStars(picker, 0);
  textarea.value = '';
}

async function submitRating(card) {
  const picker   = card.querySelector('.star-picker');
  const textarea = card.querySelector('.rating-comment-input');
  const note     = parseInt(picker?.dataset.selected || 0);
  if (note === 0) {
    textarea.placeholder = '⚠ Choisissez une note avant de soumettre...';
    textarea.classList.add('input-error');
    setTimeout(() => { textarea.placeholder = 'Commentaire...'; textarea.classList.remove('input-error'); }, 2000);
    return;
  }
  const commentaire = textarea.value.trim();
  const dateEval    = new Date().toLocaleDateString('fr-FR');
  const serviceId   = card.dataset.serviceId;
  const payload     = { note, commentaire: commentaire || null, DateEval: dateEval, ID_Service: serviceId };
  try {
    const response = await fetch('../../../api/submit-rating.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Erreur');
    updateRatingSummary(card, note);
    closeRatingPanel(card);
    const commentsList = card.querySelector('.comments-list');
    if (commentsList) { commentsList.dataset.loaded = 'false'; commentsList.innerHTML = ''; commentsList.hidden = true; }
    const rateBtn = card.querySelector('.post-action-btn[data-action="rate"]');
    if (rateBtn) {
        rateBtn.classList.add('rated');
        rateBtn.innerHTML = result.updated
            ? `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`
            : `<i class="fa-solid fa-star"></i> Évalué`;
    }
    
    showNotification(result.updated ? 'Évaluation mise à jour !' : 'Évaluation soumise avec succès !');
  } catch (err) {
    console.error('Erreur lors de la soumission :', err);
    textarea.placeholder = '⚠ Erreur lors de la soumission...';
    textarea.classList.add('input-error');
    setTimeout(() => { textarea.placeholder = 'Commentaire...'; textarea.classList.remove('input-error'); }, 2000);
  }
}

function updateRatingSummary(card, newNote) {
  const summary = card.querySelector('.post-rating-summary');
  if (!summary) return;
  const scoreEl  = summary.querySelector('.rating-score');
  const countEl  = summary.querySelector('.rating-count');
  const starsEl  = summary.querySelector('.rating-stars-display');
  const oldScore = parseFloat(scoreEl.textContent) || 0;
  const oldCount = parseInt(countEl.textContent.match(/\d+/)?.[0] || '0');
  const newCount = oldCount + 1;
  const rounded  = Math.round(((oldScore * oldCount) + newNote) / newCount * 10) / 10;
  scoreEl.textContent = rounded.toFixed(1);
  countEl.textContent = `(${newCount} évaluations)`;
  const full = Math.floor(rounded), half = rounded - full >= 0.5;
  starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '<i class="fa-solid fa-star"></i>';
    if (i === full && half) return '<i class="fa-solid fa-star-half-stroke"></i>';
    return '<i class="fa-regular fa-star"></i>';
  }).join('');
}

// ════════════════════════════════════════
// ENRICH CARD
// ════════════════════════════════════════
function enrichCard(card) {
  if (!card.querySelector('.post-pin-badge')) {
    const pinBadge = document.createElement('div');
    pinBadge.className = 'post-pin-badge';
    pinBadge.innerHTML = '<i class="fa-solid fa-thumbtack"></i> Épinglé';
    card.insertBefore(pinBadge, card.firstChild);
  }

  const oldAv = card.querySelector('.post-top .post-avatar-placeholder:not(.post-avatar-dyn)');
  if (oldAv) { const dyn = buildDynAvatar(currentProfileSrc, 36); oldAv.replaceWith(dyn); }

  const footer = card.querySelector('.post-footer');
  if (footer) {
    footer.querySelectorAll('.post-action').forEach(btn => {
      if (btn.querySelector('.fa-comment') || btn.querySelector('[class*="fa-comment"]')) btn.classList.add('comment-btn');
      if (btn.querySelector('.fa-arrow-up-from-bracket')) btn.classList.add('share-btn');
      if (btn.querySelector('.fa-heart')) btn.classList.add('like-btn');
    });
  }

  const menuBtn = card.querySelector('.post-menu-btn');
  if (menuBtn && !menuBtn.querySelector('.post-ctx-menu')) {
    const ctx = document.createElement('div'); ctx.className = 'post-ctx-menu';
    ctx.innerHTML = `
      <div class="ctx-item" data-action="pin"><i class="fa-solid fa-thumbtack"></i> Épingler</div>
      <div class="ctx-item" data-action="edit"><i class="fa-solid fa-pen"></i> Modifier</div>
      <div class="ctx-item danger" data-action="delete"><i class="fa-solid fa-trash"></i> Supprimer</div>`;
    menuBtn.appendChild(ctx);
    menuBtn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.post-ctx-menu.open').forEach(m => { if (m !== ctx) m.classList.remove('open'); });
      ctx.classList.toggle('open');
    });
    ctx.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation(); ctx.classList.remove('open');
        const action = item.dataset.action;
        if (action === 'delete') {
          const confirmOverlay = document.createElement('div');
          confirmOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,.6);backdrop-filter:blur(6px);z-index:2000;display:flex;justify-content:center;align-items:center;';
          confirmOverlay.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px 24px;width:100%;max-width:320px;box-shadow:0 24px 64px rgba(0,0,0,.22);text-align:center;">
              <div style="width:48px;height:48px;background:#fee2e2;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:22px;">🗑️</div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--text);margin-bottom:8px;">Supprimer ce post ?</div>
              <div style="font-size:12px;color:var(--muted);margin-bottom:22px;line-height:1.55;">Cette action est irréversible.</div>
              <div style="display:flex;gap:10px;">
                <button id="delCancelBtn" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:12px;background:transparent;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;">Annuler</button>
                <button id="delConfirmBtn" style="flex:1;padding:10px;border:none;border-radius:12px;background:#dc2626;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;">Supprimer</button>
              </div>
            </div>`;
          document.body.appendChild(confirmOverlay);
          document.getElementById('delCancelBtn').addEventListener('click', () => confirmOverlay.remove());
          confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) confirmOverlay.remove(); });
          document.getElementById('delConfirmBtn').addEventListener('click', () => {
            confirmOverlay.remove();
            card.style.animation = 'postCardOut .3s ease forwards';
            setTimeout(() => card.remove(), 280);
            showNotification('Post supprimé');
          });
        } else if (action === 'edit') {
          openEditModal(card);
        } else if (action === 'pin') {
          const pinBadge = card.querySelector('.post-pin-badge');
          if (pinBadge) {
            pinBadge.classList.toggle('visible');
            const isPinned = pinBadge.classList.contains('visible');
            item.innerHTML = `<i class="fa-solid fa-thumbtack"></i> ${isPinned ? 'Désépingler' : 'Épingler'}`;
            showNotification(isPinned ? '📌 Post épinglé' : '📌 Post désépinglé');
          }
        }
      });
    });
  }

  const likeBtn = card.querySelector('.like-btn');
  if (likeBtn && !likeBtn._bound) {
    likeBtn._bound = true;
    likeBtn.addEventListener('click', function () {
      this.classList.toggle('liked');
      const n = parseInt(this.textContent.match(/\d+/)?.[0] || '0');
      this.innerHTML = this.classList.contains('liked')
        ? `<i class="fa-solid fa-heart"></i> ${n + 1}`
        : `<i class="fa-regular fa-heart"></i> ${Math.max(0, n - 1)}`;
    });
  }

  const commentSectionBtn = card.querySelector('.comment-btn');
  if (commentSectionBtn && !commentSectionBtn._bound) {
    commentSectionBtn._bound = true;
    commentSectionBtn.addEventListener('click', () => {
      let sec = card.querySelector('.comments-section');
      if (!sec) { sec = buildCommentSection(card); }
      sec.classList.toggle('open');
      if (sec.classList.contains('open')) sec.querySelector('.comment-input').focus();
    });
  }

  const shareBtn = card.querySelector('.share-btn');
  if (shareBtn && !shareBtn._bound) {
    shareBtn._bound = true;
    shareBtn.addEventListener('click', () => {
      const title = card.querySelector('.post-title')?.textContent || '';
      const body  = card.querySelector('.post-body')?.textContent  || '';
      shareText = `${title}\n${body}\n${location.href}`;
      shareOverlay?.classList.add('active');
    });
  }

  const rateBtn     = card.querySelector('.post-action-btn[data-action="rate"]');
  const commentBtn  = card.querySelector('.post-action-btn[data-action="comment"]');
  const ratingPanel = card.querySelector('.rating-panel');
  const starPicker  = card.querySelector('.star-picker');
  const cancelBtn   = card.querySelector('.rating-cancel-btn');
  const submitBtn   = card.querySelector('.rating-submit-btn');

  if (rateBtn && !rateBtn._bound) {
    rateBtn._bound = true;
    rateBtn.addEventListener('click', () => {
      if (!ratingPanel) return;
      const commentsList = card.querySelector('.comments-list');
      ratingPanel.hidden = !ratingPanel.hidden;
      if (!ratingPanel.hidden && commentsList && !commentsList.hidden) commentsList.hidden = true;
    });
  }

  if (commentBtn && !commentBtn._bound) {
  commentBtn._bound = true;
  commentBtn.addEventListener('click', async () => {
    const commentsList = card.querySelector('.comments-list');
    if (!commentsList) return;

    // Fermer le panneau de notation si ouvert
    if (ratingPanel && !ratingPanel.hidden) {
      ratingPanel.hidden = true;
    }

    // ✅ Toggle : si visible → fermer et sortir
    const isVisible = !commentsList.classList.contains('is-hidden');
    if (isVisible) {
      commentsList.classList.add('is-hidden');
      return;
    }

    // Ouvrir
    commentsList.classList.remove('is-hidden');

    // Ne pas relancer si déjà chargé ou en cours
    if (commentsList.dataset.loaded === 'true' || commentsList.dataset.loaded === 'loading') return;

    // Premier chargement
    commentsList.dataset.loaded = 'loading';
    commentsList.innerHTML = `
      <div style="padding:14px 18px;color:#8c8580;font-size:12px;
                  font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;gap:8px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Chargement des avis...
      </div>`;

    const serviceId = card.dataset.serviceId;
    try {
      const res  = await fetch(`../../../api/get-ratings.php?service_id=${serviceId}`);
      const data = await res.json();
      commentsList.innerHTML = '';

      if (!data.success || !data.ratings || data.ratings.length === 0) {
        commentsList.innerHTML = `
          <div style="padding:14px 18px;color:#8c8580;font-size:12px;
                      font-family:'Space Grotesk',sans-serif;text-align:center;">
            <i class="fa-regular fa-comment-dots" style="font-size:20px;display:block;margin-bottom:6px;"></i>
            Aucun avis pour l'instant
          </div>`;
      } else {
        data.ratings.forEach(r => {
          const dateStr = new Date(r.DateEval).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
          commentsList.appendChild(buildProfileCommentItem(`${r.prenom} ${r.nom}`, parseInt(r.note), r.commentaire || '', dateStr, r.photo_profil));
        });
      }
      commentsList.dataset.loaded = 'true';

      if (data.userEval) {
        const picker   = card.querySelector('.star-picker');
        const textarea = card.querySelector('.rating-comment-input');
        const rBtn     = card.querySelector('.post-action-btn[data-action="rate"]');
        if (picker)   { picker.dataset.selected = data.userEval.note; renderPickerStars(picker, parseInt(data.userEval.note)); }
        if (textarea)   textarea.value = data.userEval.commentaire || '';
        if (rBtn)     { rBtn.classList.add('rated'); rBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`; }
      }
    } catch (err) {
      console.error(err);
      commentsList.innerHTML = `
        <div style="padding:14px 18px;color:#ef4444;font-size:12px;font-family:'Space Grotesk',sans-serif;">
          <i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement
        </div>`;
      commentsList.dataset.loaded = 'false';
    }
  });
}

  if (starPicker && !starPicker._bound) {
    starPicker._bound = true;
    starPicker.addEventListener('click', (e) => {
      const star = e.target.closest('[data-star]');
      if (!star) return;
      starPicker.dataset.selected = star.dataset.star;
      renderPickerStars(starPicker, parseInt(star.dataset.star));
    });
  }
  if (cancelBtn && !cancelBtn._bound) { cancelBtn._bound = true; cancelBtn.addEventListener('click', () => closeRatingPanel(card)); }
  if (submitBtn && !submitBtn._bound) { submitBtn._bound = true; submitBtn.addEventListener('click', () => submitRating(card)); }
}

// ════════════════════════════════════════
// LOAD SERVICES
// ════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => { loadServices(); });

async function loadServices() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userId    = urlParams.get("id");
    const response  = await fetch(`../../../api/get-user-service.php?id=${userId}`);
    const data      = await response.json();
    if (!data.success) return;
    const container = document.getElementById("servicesContainer");
    if (!container) return;
    container.innerHTML = "";
    data.services.forEach(service => { container.innerHTML += createServiceCard(service); });
    container.querySelectorAll('.post-card').forEach(enrichCard);
    
    container.querySelectorAll('.post-card').forEach(async (card) => {
        const serviceId = card.dataset.serviceId;
        const rateBtn   = card.querySelector('.post-action-btn[data-action="rate"]');
        if (!rateBtn) return;

        try {
            const res  = await fetch(`../../../api/get-ratings.php?service_id=${serviceId}`);
            const data = await res.json();
            if (data.userEval) {
                const picker   = card.querySelector('.star-picker');
                const textarea = card.querySelector('.rating-comment-input');
                if (picker) {
                    picker.dataset.selected = data.userEval.note;
                    renderPickerStars(picker, parseInt(data.userEval.note));
                }
                if (textarea) textarea.value = data.userEval.commentaire || '';
                rateBtn.classList.add('rated');
                rateBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`;
            }
        } catch (e) { /* silencieux */ }
    });
  } catch (error) { console.error(error); }
}

// ════════════════════════════════════════
// CREATE SERVICE CARD
// ════════════════════════════════════════
function createServiceCard(service) {
  const profileImage = service.photo_profil  ? `../../../${service.photo_profil}`  : "";
  const serviceImage = service.service_photo ? `../../../${service.service_photo}` : null;
  const categories   = service.categorie ? service.categorie.split(",") : [];

  return `
  <article class="post-card" data-service-id="${service.ID}">
    <div class="post-header">
      <div class="post-avatar">
        <img src="${profileImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
      </div>
      <div class="post-meta">
        <div class="post-name">${service.nom} ${service.prenom}</div>
        <div class="post-time-row"><span class="post-time">${getTimeAgo(service.DateDePublication)}</span></div>
      </div>
    </div>
    <div class="post-title">${service.titre}</div>
    <div class="post-tags">
      <span class="post-tag">
        ${categories.map(cat => `
          <span class="category-pill green" style="cursor:pointer"
                onclick="window.location.href='../categorie-services/categorie-services.html?cat=${encodeURIComponent(cat.trim())}'">
            ${cat.trim()}
          </span>`).join("")}
      </span>
    </div>
    <div class="post-body">${service.description}<br>prix : ${service.prix} DZD</div>
    <div class="post-body">${service.status}</div>
    ${serviceImage ? `<img class="post-image" src="${serviceImage}">` : ""}
    <div class="post-rating-summary">
      <div class="rating-stars-display">${generateStars(service.note_moyenne)}</div>
      <span class="rating-score">${service.note_moyenne}</span>
      <span class="rating-count">(${service.nb_avis} évaluations)</span>
    </div>
    <div class="post-actions">
      <button class="post-action-btn" data-action="rate"><i class="fa-regular fa-star"></i> Évaluer</button>
      <button class="post-action-btn" data-action="comment">
        <i class="fa-regular fa-comment"></i> Commentaires
        <span style="background:rgba(75,72,236,0.15);color:#4b48ec;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:4px;">${service.nb_avis || 0}</span>
      </button>
    </div>
    <div class="rating-panel" hidden>
      <div class="rating-panel-inner">
        <p class="rating-panel-label">Votre évaluation</p>
        <div class="star-picker">
          <i class="fa-regular fa-star" data-star="1"></i>
          <i class="fa-regular fa-star" data-star="2"></i>
          <i class="fa-regular fa-star" data-star="3"></i>
          <i class="fa-regular fa-star" data-star="4"></i>
          <i class="fa-regular fa-star" data-star="5"></i>
        </div>
        <textarea class="rating-comment-input" placeholder="Commentaire..."></textarea>
        <div class="rating-panel-actions">
          <button class="rating-cancel-btn">Annuler</button>
          <button class="rating-submit-btn">Soumettre</button>
        </div>
      </div>
    </div>
    <div class="comments-list is-hidden" data-loaded="false"></div>
  </article>`;
}

// ════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════
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


function getTimeAgo(dateString) {
  const now  = new Date();
  const date = new Date(dateString.includes('Z') || dateString.includes('+') ? dateString : dateString.replace(' ', 'T') + 'Z');
  const diffMs  = now - date;
  const minutes = Math.floor(diffMs / 60000);
  const hours   = Math.floor(diffMs / 3600000);
  const days    = Math.floor(diffMs / 86400000);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(months / 12);
  if (minutes < 1)  return `à l'instant`;
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours   < 24) return `il y a ${hours} h`;
  if (days    < 30) return `il y a ${days} jours`;
  if (months  < 12) return `il y a ${months} mois`;
  return `il y a ${years} an(s)`;
}

function generateStars(note) {
  note = parseFloat(note);
  const fullStars = Math.floor(note);
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += i < fullStars ? `<i class="fa-solid fa-star"></i>` : `<i class="fa-regular fa-star"></i>`;
  }
  return html;
}

document.addEventListener('click', () =>
  document.querySelectorAll('.post-ctx-menu.open').forEach(m => m.classList.remove('open'))
);

document.querySelectorAll('.post-card').forEach(enrichCard);

// ════════════════════════════════════════
// NAV DROPDOWN
// ════════════════════════════════════════
const navMenuBtn  = document.getElementById('navMenuBtn');
const navDropdown = document.getElementById('navDropdown');

navMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); navDropdown.hidden = !navDropdown.hidden; });
document.addEventListener('click', () => { navDropdown.hidden = true; });

document.getElementById('btnDeconnexion').addEventListener('click', () => {
  window.location.href = '../../html/login-user.html';
});
document.getElementById('btnSupprimerCompte').addEventListener('click', () => {
  navDropdown.hidden = true;
  document.getElementById('modalSupprimer').hidden = false;
});
document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('modalSupprimer').hidden = true;
});
document.getElementById('modalOverlay').addEventListener('click', () => {
  document.getElementById('modalSupprimer').hidden = true;
});
document.getElementById('modalConfirm').addEventListener('click', async () => {
  document.getElementById('modalSupprimer').hidden = true;
  const res  = await fetch('../../../api/delete-account.php', { method: 'POST' });
  const data = await res.json();
  if (data.success) {
    showNotification('Compte supprimé. Redirection...');
    setTimeout(() => { window.location.href = '../../html/signUp-user.html'; }, 2000);
  } else {
    showNotification('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'));
  }
});