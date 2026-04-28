// ════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════
let currentProfileSrc = null;
let currentUser = { prenom: '', nom: '', initiales: '?' };

// ════════════════════════════════════════
// PATH HELPER
// ════════════════════════════════════════
function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `/Mini-Projet - Copy/${path}`;
}

// ════════════════════════════════════════
// LOAD PROFILE FROM SESSION (PHP API)
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
      window.location.href = '../html/login.html';
      return;
    }

    const data = await res.json();
    if (!data.success) return;

    const user = data.user || data;

    currentUser.prenom    = user.prenom || '';
    currentUser.nom       = user.nom    || '';
    currentUser.initiales = ((user.prenom?.[0] || '') + (user.nom?.[0] || '')).toUpperCase() || '?';

    const fullName = `${user.prenom} ${user.nom}`.trim();

    const displayName = document.getElementById('displayName');
    if (displayName) displayName.childNodes[0].textContent = fullName;

    const displayRole = document.getElementById('displayRole');
    if (displayRole) displayRole.textContent = user.specialite || user.niveau || user.role || '';

    const displayLocation = document.getElementById('displayLocation');
    if (displayLocation)
      displayLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${user.localisation || 'Algérie'}`;

    const letter = document.getElementById('navAvatarLetter');
    const img    = document.getElementById('navAvatarImg');

    if (user.photo_profil) {
      // Always store the fully-built URL so every consumer gets the right path
      currentProfileSrc = buildPhotoUrl(user.photo_profil);

      if (img) {
        img.src = currentProfileSrc;
        img.style.display = 'block';
      }
      if (letter) letter.style.display = 'none';

      updateAllPostAvatars(currentProfileSrc);
    } else {
      if (letter) {
        letter.textContent = currentUser.initiales[0] || '?';
        letter.style.display = '';
      }
    }

    const profilePreview = document.getElementById('profilePreview');
    if (profilePreview && user.photo_profil)
      profilePreview.src = buildPhotoUrl(user.photo_profil);

    // Banner image
    const bannerTop = document.getElementById('bannerTop');
    if (bannerTop && user.photo_banniere) {
      bannerTop.style.backgroundImage    = `url('${buildPhotoUrl(user.photo_banniere)}')`;
      bannerTop.style.backgroundSize     = 'cover';
      bannerTop.style.backgroundPosition = 'center';
      bannerTop.style.backgroundRepeat   = 'no-repeat';
    }

    // Banner gradient colors
    const bannerBottom = document.getElementById('bannerBottom');
    if (bannerBottom) {
      const dark  = user.banner_color_dark;
      const light = user.banner_color_light;
      if (dark && light) {
        bannerBottom.style.background = `linear-gradient(to right, ${dark}, ${light})`;
      }
    }

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
// DOMINANT COLORS (banner auto-gradient)
// ════════════════════════════════════════
function getDominantColors(source, topN = 2) {
  let canvas, ctx;
  if (source instanceof HTMLCanvasElement) {
    canvas = source;
    ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    const MAX = 200;
    let w = source.naturalWidth || source.width;
    let h = source.naturalHeight || source.height;
    if (w > MAX || h > MAX) {
      const s = MAX / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(source, 0, 0, w, h);
  }

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const counts = {};

  // Fixed: was `user.length`, must be `data.length`
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = Math.round(data[i]     / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      return { hex: '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('') };
    });
}

function adaptColor(hex, amount = 80) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  const br = (r * 299 + g * 587 + b * 114) / 1000;
  if (br > 128) {
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
  } else {
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
  }
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function changeBannerColor(color1, color2) {
  const br = h => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  const dark  = br(color1) < br(color2) ? color1 : color2;
  const light = br(color1) < br(color2) ? color2 : color1;
  const bannerBottom = document.getElementById('bannerBottom');
  if (bannerBottom)
    bannerBottom.style.background = `linear-gradient(to right, ${dark}, ${light})`;
}

// ════════════════════════════════════════
// UPDATE ALL POST AVATARS
// ════════════════════════════════════════
function updateAllPostAvatars(src) {
  currentProfileSrc = src;

  document.querySelectorAll('.post-avatar-dyn').forEach(el => {
    if (el.tagName === 'IMG') {
      el.src = src;
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.className = el.className;
      img.style.cssText = el.style.cssText ||
        'width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0;';
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
// CV UPLOAD
// ════════════════════════════════════════
const cvInput = document.getElementById('cvInput');
const cvName  = document.getElementById('cvName');
let cvFileURL = null;

if (cvInput) {
  cvInput.addEventListener('change', function () {
    if (this.files.length > 0) {
      const file = this.files[0];
      cvFileURL = URL.createObjectURL(file);
      cvName.textContent = '📄 ' + file.name;
      cvName.style.cursor = 'pointer';
      cvName.style.textDecoration = 'underline';
    }
  });
}
if (cvName) {
  cvName.addEventListener('click', function () { if (cvFileURL) window.open(cvFileURL, '_blank'); });
}

// ════════════════════════════════════════
// SEE ALL SUGGESTIONS
// ════════════════════════════════════════
const seeAllBtn   = document.getElementById('seeAllBtn');
const listPreview = document.getElementById('suggestListPreview');
const listAll     = document.getElementById('suggestListAll');
let showingAll = false;

if (seeAllBtn) {
  seeAllBtn.addEventListener('click', e => {
    e.preventDefault();
    showingAll = !showingAll;
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
  const botInput    = document.getElementById('chatbotInput');
  const botSendBtn  = document.getElementById('chatbotSend');
  const botMessages = document.getElementById('chatbotMessages');

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function openChat()    { if (panel)    panel.classList.add('active'); }
  function closeChat()   { if (panel)    panel.classList.remove('active'); }
  function openBotChat() { if (botPanel) botPanel.classList.add('active'); }
  function closeBotChat(){ if (botPanel) botPanel.classList.remove('active'); }

  if (fabChatBtn) fabChatBtn.addEventListener('click', openChat);
  if (navChatBtn) navChatBtn.addEventListener('click', openChat);
  if (closeBtn)   closeBtn.addEventListener('click', closeChat);

  // fabHelpBtn opens the CHATBOT panel only (help overlay handled separately below)
  const fabHelpBtn = document.getElementById('fabHelpBtn');
  if (fabHelpBtn)  fabHelpBtn.addEventListener('click', openBotChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);

  // ── User chat ──
  function sendMessage() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msg  = document.createElement('div');
    msg.className = 'chat-msg sent';
    msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${time}</span>`;
    messages.appendChild(msg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input)   input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  // ── Chatbot ──
  function sendBotMessage() {
    if (!botInput) return;
    const text = botInput.value.trim();
    if (!text) return;
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${time}</span>`;
    botMessages.appendChild(userMsg);
    botInput.value = '';
    botMessages.scrollTop = botMessages.scrollHeight;

    fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, user_id: currentUser.prenom || 'anonymous' }),
    })
      .then(r => r.json())
      .then(data => {
        // Fixed: was `user.response`, must be `data.response`
        const reply = data.response || 'Désolé, une erreur s\'est produite.';
        const t = new Date();
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg received';
        botMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(reply)}</div><span class="msg-time">${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}</span>`;
        botMessages.appendChild(botMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      })
      .catch(() => {
        const t = new Date();
        const errorMsg = document.createElement('div');
        errorMsg.className = 'chat-msg received';
        errorMsg.innerHTML = `<div class="msg-bubble">Impossible de contacter l'assistant.</div><span class="msg-time">${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}</span>`;
        botMessages.appendChild(errorMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      });
  }

  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

});

// ════════════════════════════════════════
// HELP PANEL  (separate from chatbot)
// ════════════════════════════════════════
const helpOverlay = document.getElementById('helpOverlay');
const helpClose   = document.getElementById('helpClose');

// Note: fabHelpBtn is already bound to openBotChat() inside DOMContentLoaded.
// Only bind helpOverlay open/close here — do NOT re-bind fabHelpBtn.
if (helpClose)   helpClose.addEventListener('click', () => helpOverlay?.classList.remove('active'));
if (helpOverlay) helpOverlay.addEventListener('click', e => {
  if (e.target === helpOverlay) helpOverlay.classList.remove('active');
});

// ════════════════════════════════════════
// LINKS WIDGET
// ════════════════════════════════════════
const openBtn       = document.getElementById('openModal');
const modal         = document.getElementById('linkModal');
const closeModalBtn = document.getElementById('closeModal');
const saveBtn       = document.querySelector('.save-btn');
const linkInput     = document.getElementById('modalLinkInput');
const container     = document.getElementById('linksContainer');
const emptyMsg      = document.getElementById('linksEmpty');
const badge         = document.getElementById('linksBadge');
const toggleBtn     = document.getElementById('linksToggleBtn');
const dropdown      = document.getElementById('linksDropdown');

let links = JSON.parse(localStorage.getItem('links')) || [];

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
  if (!container) return;
  container.innerHTML = '';
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
      localStorage.setItem('links', JSON.stringify(links));
      displayLinks();
    });
    div.appendChild(icon); div.appendChild(a); div.appendChild(delBtn);
    container.appendChild(div);
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
    const link = linkInput?.value.trim();
    if (!link) { showNotification('⚠️  Entrez un lien !'); return; }
    if (!link.startsWith('http')) { showNotification('⚠️  Lien invalide !'); return; }
    links.push(link);
    localStorage.setItem('links', JSON.stringify(links));
    if (linkInput) linkInput.value = '';
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    displayLinks();
    showNotification('✓  Lien ajouté !');
  });
}
displayLinks();

// ════════════════════════════════════════
// LOAD ALL USERS FOR SIDEBAR
// ════════════════════════════════════════
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
        // Fixed: was `buildImagePath` (undefined) → correct function is `buildPhotoUrl`
        img.src = buildPhotoUrl(user.photo_profil);
        img.alt = user.prenom;
        img.onerror = () => {
          avatarDiv.innerHTML   = '';
          avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
          avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent  = (user.prenom[0] + user.nom[0]).toUpperCase();
        avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
      }

      const infoDiv = document.createElement('div');
      infoDiv.className = 'suggest-info';

      const nameDiv = document.createElement('div');
      nameDiv.className   = 'name';
      nameDiv.textContent = `${user.prenom} ${user.nom}`;

      const roleDiv = document.createElement('div');
      roleDiv.className   = 'role';
      roleDiv.textContent = user.specialite || user.niveau || user.role || 'Utilisateur';

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(roleDiv);
      item.appendChild(avatarDiv);
      item.appendChild(infoDiv);

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

// Fixed: removed duplicate DOMContentLoaded registration
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllUsers);
} else {
  loadAllUsers();
}

// ════════════════════════════════════════
// INJECT STYLES FOR POST INTERACTIONS
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

    .comments-section{border-top:1px solid var(--border);padding:12px 0 4px;margin-top:4px;display:none}
    .comments-section.open{display:block}
    .comment-list{display:flex;flex-direction:column;gap:10px;margin-bottom:10px}
    .comment-item{display:flex;gap:8px;align-items:flex-start}
    .comment-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#e8734a,#c9543a);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;color:#fff;border:1.5px solid var(--border);overflow:hidden;background-size:cover;background-position:center}
    .comment-avatar img{width:100%;height:100%;object-fit:cover;display:block}
    .comment-bubble{flex:1;background:var(--input-bg);border:1px solid var(--border);border-radius:12px;padding:8px 12px}
    .comment-author{font-weight:700;font-size:11px;color:var(--text);margin-bottom:2px}
    .comment-text{font-size:12px;color:var(--text);line-height:1.45}
    .comment-time{font-size:10px;color:var(--muted);margin-top:3px}
    .comment-input-row{display:flex;align-items:center;gap:8px}
    .comment-input-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#e8734a,#c9543a);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;color:#fff;border:1.5px solid var(--border);overflow:hidden;background-size:cover;background-position:center}
    .comment-input{flex:1;padding:7px 14px;border:1.5px solid var(--border);border-radius:20px;background:var(--input-bg);font-family:'DM Sans',sans-serif;font-size:12.5px;color:var(--text);outline:none;transition:border-color .2s}
    .comment-input:focus{border-color:var(--accent)}
    .comment-send{width:30px;height:30px;border:none;border-radius:50%;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;transition:background .2s,transform .1s;flex-shrink:0}
    .comment-send:hover{background:#0e2e6e}.comment-send:active{transform:scale(.93)}

    .edit-post-overlay{display:none;position:fixed;inset:0;background:rgba(26,23,20,.55);backdrop-filter:blur(6px);z-index:1300;justify-content:center;align-items:center}
    .edit-post-overlay.active{display:flex}
    .edit-post-modal{background:var(--surface);border:1px solid var(--border);border-radius:18px;width:100%;max-width:480px;padding:24px;box-shadow:0 24px 64px rgba(0,0,0,.2);animation:postModalIn .25s cubic-bezier(.34,1.3,.64,1) both}
    @keyframes postModalIn{from{transform:translateY(-16px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
    .edit-post-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:14px}
    .edit-post-textarea{width:100%;min-height:120px;padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--input-bg);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;resize:none;transition:border-color .2s;margin-bottom:14px}
    .edit-post-textarea:focus{border-color:var(--accent)}
    .edit-post-actions{display:flex;gap:10px;justify-content:flex-end}
    .edit-cancel-btn{padding:8px 20px;border:1px solid var(--border);border-radius:20px;background:transparent;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background .2s}
    .edit-cancel-btn:hover{background:var(--input-bg)}
    .edit-save-btn{padding:8px 20px;border:none;border-radius:20px;background:var(--text);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background .2s}
    .edit-save-btn:hover{background:var(--accent)}

    .share-overlay{display:none;position:fixed;inset:0;background:rgba(26,23,20,.45);backdrop-filter:blur(5px);z-index:1300;justify-content:center;align-items:flex-end;padding-bottom:20px}
    .share-overlay.active{display:flex}
    .share-sheet{background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:420px;padding:20px 20px 14px;box-shadow:0 -4px 32px rgba(0,0,0,.15);animation:shareUp .28s cubic-bezier(.34,1.3,.64,1) both}
    @keyframes shareUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
    .share-title{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:16px;text-align:center;color:var(--text)}
    .share-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
    .share-item{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:8px;border-radius:12px;transition:background .18s}
    .share-item:hover{background:var(--input-bg)}
    .share-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff}
    .share-label{font-size:10px;color:var(--muted);font-family:'DM Sans',sans-serif;text-align:center}
    .share-copy-btn{width:100%;padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg);font-family:'Syne',sans-serif;font-weight:700;font-size:12.5px;cursor:pointer;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px}
    .share-copy-btn:hover{background:var(--border)}
    .share-close-btn{width:100%;padding:8px;border:none;border-radius:12px;background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);cursor:pointer;transition:background .2s}
    .share-close-btn:hover{background:var(--input-bg)}

    .post-pin-badge{display:none;position:absolute;top:12px;right:48px;background:#fef3e2;border:1px solid #fed7aa;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:#d97706;align-items:center;gap:4px}
    .post-pin-badge.visible{display:flex}
    .post-card{position:relative}

    .file-dl-link{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;font-size:12px;color:var(--text);text-decoration:none;transition:background .15s;cursor:pointer}
    .file-dl-link:hover{background:var(--border)}
    .file-dl-link i:first-child{color:var(--accent);font-size:14px}
    .dl-icon{margin-left:auto;color:var(--muted);font-size:12px}
  `;
  document.head.appendChild(s);
})();

// ════════════════════════════════════════
// SHARE SHEET
// ════════════════════════════════════════
const shareOverlay = document.createElement('div');
shareOverlay.className = 'share-overlay';
shareOverlay.id        = 'shareOverlay';

const SHARE_PLATFORMS = [
  { label: 'Facebook',  color: '#1877F2', icon: 'fa-brands fa-facebook-f',   url: t => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${encodeURIComponent(t)}` },
  { label: 'WhatsApp',  color: '#25D366', icon: 'fa-brands fa-whatsapp',     url: t => `https://api.whatsapp.com/send?text=${encodeURIComponent(t)}` },
  { label: 'Twitter/X', color: '#000',    icon: 'fa-brands fa-x-twitter',    url: t => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}` },
  { label: 'LinkedIn',  color: '#0A66C2', icon: 'fa-brands fa-linkedin-in',  url: t => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(location.href)}` },
  { label: 'Telegram',  color: '#26A5E4', icon: 'fa-brands fa-telegram',     url: t => `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(t)}` },
  { label: 'Gmail',     color: '#EA4335', icon: 'fa-solid fa-envelope',      url: t => `mailto:?subject=Post intéressant&body=${encodeURIComponent(t)}` },
  { label: 'Reddit',    color: '#FF4500', icon: 'fa-brands fa-reddit-alien', url: t => `https://www.reddit.com/submit?url=${encodeURIComponent(location.href)}&title=${encodeURIComponent(t)}` },
  { label: 'Snapchat',  color: '#FFFC00', icon: 'fa-brands fa-snapchat',     url: t => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(location.href)}`, textColor: '#000' },
];

shareOverlay.innerHTML = `
  <div class="share-sheet">
    <div class="share-title">Partager ce post</div>
    <div class="share-grid" id="shareGrid"></div>
    <button class="share-copy-btn" id="shareCopyBtn"><i class="fa-regular fa-copy"></i> Copier le lien</button>
    <button class="share-close-btn" id="shareCloseBtn">Fermer</button>
  </div>`;
document.body.appendChild(shareOverlay);

let shareText = '';
SHARE_PLATFORMS.forEach(p => {
  const div = document.createElement('div');
  div.className = 'share-item';
  div.innerHTML = `<div class="share-icon" style="background:${p.color};color:${p.textColor || '#fff'}"><i class="${p.icon}"></i></div><span class="share-label">${p.label}</span>`;
  div.addEventListener('click', () => { window.open(p.url(shareText), '_blank'); shareOverlay.classList.remove('active'); });
  document.getElementById('shareGrid').appendChild(div);
});
document.getElementById('shareCopyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(location.href).catch(() => {});
  showNotification('✓ Lien copié dans le presse-papiers !');
  shareOverlay.classList.remove('active');
});
document.getElementById('shareCloseBtn').addEventListener('click', () => shareOverlay.classList.remove('active'));
shareOverlay.addEventListener('click', e => { if (e.target === shareOverlay) shareOverlay.classList.remove('active'); });

// ════════════════════════════════════════
// EDIT POST MODAL
// ════════════════════════════════════════
const oldEditOverlay = document.getElementById('editPostOverlay');
if (oldEditOverlay) oldEditOverlay.remove();

const editPostOverlay = document.createElement('div');
editPostOverlay.className = 'edit-post-overlay';
editPostOverlay.id        = 'editPostOverlay';
editPostOverlay.innerHTML = `
  <div class="edit-post-modal">
    <div class="edit-post-title">✏️ Modifier le post</div>
    <textarea class="edit-post-textarea" id="editPostTextarea" placeholder="Contenu du post…"></textarea>
    <div class="edit-post-actions">
      <button class="edit-cancel-btn" id="editCancelBtn">Annuler</button>
      <button class="edit-save-btn"   id="editSaveBtn">Enregistrer</button>
    </div>
  </div>`;
document.body.appendChild(editPostOverlay);

let editTargetCard = null;
function openEditModal(card) {
  editTargetCard = card;
  const body = card.querySelector('.post-body');
  document.getElementById('editPostTextarea').value = body ? body.textContent.trim() : '';
  editPostOverlay.classList.add('active');
  setTimeout(() => document.getElementById('editPostTextarea').focus(), 80);
}
document.getElementById('editCancelBtn').addEventListener('click', () => editPostOverlay.classList.remove('active'));
editPostOverlay.addEventListener('click', e => { if (e.target === editPostOverlay) editPostOverlay.classList.remove('active'); });
document.getElementById('editSaveBtn').addEventListener('click', () => {
  if (!editTargetCard) return;
  const body = editTargetCard.querySelector('.post-body');
  if (body) body.textContent = document.getElementById('editPostTextarea').value.trim();
  editPostOverlay.classList.remove('active');
  showNotification('✓ Post modifié avec succès !');
});

// ════════════════════════════════════════
// BUILD HELPERS
// ════════════════════════════════════════
function buildDynAvatar(src, size) {
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'post-avatar post-avatar-dyn';
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
  const sec = document.createElement('div');
  sec.className = 'comments-section';
  const initiales   = currentUser.initiales || '?';
  const cmtAvStyle  = currentProfileSrc
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
    const txt = cmtInput.value.trim();
    if (!txt) return;
    const now  = new Date();
    const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    const item = document.createElement('div');
    item.className = 'comment-item';
    const fullName = `${currentUser.prenom} ${currentUser.nom}`.trim() || 'Moi';
    const avHTML   = currentProfileSrc
      ? `<div class="comment-avatar" style="background-image:url(${currentProfileSrc});background-size:cover;background-position:center;background-color:transparent"></div>`
      : `<div class="comment-avatar">${initiales}</div>`;
    item.innerHTML = `${avHTML}<div class="comment-bubble"><div class="comment-author">${fullName}</div><div class="comment-text">${txt.replace(/</g, '&lt;')}</div><div class="comment-time">${time}</div></div>`;
    cmtList.appendChild(item);
    cmtInput.value = '';
    const cBtn = card.querySelector('.comment-btn');
    if (cBtn) {
      const n = parseInt(cBtn.textContent.match(/\d+/)?.[0] || '0');
      cBtn.innerHTML = `<i class="fa-regular fa-comment"></i> ${n + 1}`;
    }
    showNotification('💬 Commentaire ajouté avec succès !');
  }

  cmtSend.addEventListener('click', addComment);
  cmtInput.addEventListener('keydown', e => { if (e.key === 'Enter') addComment(); });
  return sec;
}

// ════════════════════════════════════════
// BIND POST INTERACTIONS
// ════════════════════════════════════════
function enrichCard(card) {
  // Pin badge
  if (!card.querySelector('.post-pin-badge')) {
    const pinBadge = document.createElement('div');
    pinBadge.className = 'post-pin-badge';
    pinBadge.innerHTML = '<i class="fa-solid fa-thumbtack"></i> Épinglé';
    card.insertBefore(pinBadge, card.firstChild);
  }

  // Dynamic avatar in post-top
  const oldAv = card.querySelector('.post-top .post-avatar-placeholder:not(.post-avatar-dyn)');
  if (oldAv) { const dyn = buildDynAvatar(currentProfileSrc, 36); oldAv.replaceWith(dyn); }

  // Classify footer buttons
  const footer = card.querySelector('.post-footer');
  if (footer) {
    footer.querySelectorAll('.post-action').forEach(btn => {
      if (btn.querySelector('.fa-comment') || btn.querySelector('[class*="fa-comment"]')) btn.classList.add('comment-btn');
      if (btn.querySelector('.fa-arrow-up-from-bracket')) btn.classList.add('share-btn');
      if (btn.querySelector('.fa-heart')) btn.classList.add('like-btn');
    });
  }

  // 3-dot menu
  const menuBtn = card.querySelector('.post-menu-btn');
  if (menuBtn && !menuBtn.querySelector('.post-ctx-menu')) {
    const ctx = document.createElement('div');
    ctx.className = 'post-ctx-menu';
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
        e.stopPropagation();
        ctx.classList.remove('open');
        const action = item.dataset.action;

        if (action === 'delete') {
          const confirmOverlay = document.createElement('div');
          confirmOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,.6);backdrop-filter:blur(6px);z-index:2000;display:flex;justify-content:center;align-items:center;';
          confirmOverlay.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px 24px;width:100%;max-width:320px;box-shadow:0 24px 64px rgba(0,0,0,.22);text-align:center;animation:postModalIn .22s cubic-bezier(.34,1.3,.64,1) both;">
              <div style="width:48px;height:48px;background:#fee2e2;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:22px;">🗑️</div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--text);margin-bottom:8px;">Supprimer ce post ?</div>
              <div style="font-size:12px;color:var(--muted);margin-bottom:22px;line-height:1.55;">Cette action est irréversible.<br>Le post sera définitivement supprimé.</div>
              <div style="display:flex;gap:10px;">
                <button id="delCancelBtn" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:12px;background:transparent;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s;">Annuler</button>
                <button id="delConfirmBtn" style="flex:1;padding:10px;border:none;border-radius:12px;background:#dc2626;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s;">Supprimer</button>
              </div>
            </div>`;
          document.body.appendChild(confirmOverlay);
          document.getElementById('delCancelBtn').addEventListener('click', () => confirmOverlay.remove());
          confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) confirmOverlay.remove(); });
          document.getElementById('delConfirmBtn').addEventListener('click', () => {
            confirmOverlay.remove();
            card.style.animation = 'postCardOut .3s ease forwards';
            setTimeout(() => card.remove(), 280);
            showNotification('🗑️ Post supprimé');
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
            if (isPinned) {
              const newPostBox = document.querySelector('.new-post-box');
              newPostBox?.insertAdjacentElement('afterend', card);
            }
          }
        }
      });
    });
  }

  // Like
  const likeBtn = card.querySelector('.like-btn');
  if (likeBtn && !likeBtn._bound) {
    likeBtn._bound = true;
    likeBtn.addEventListener('click', function () {
      this.classList.toggle('liked');
      const n = parseInt(this.textContent.match(/\d+/)?.[0] || '0');
      if (this.classList.contains('liked')) {
        this.innerHTML = `<i class="fa-solid fa-heart"></i> ${n + 1}`;
      } else {
        this.innerHTML = `<i class="fa-regular fa-heart"></i> ${Math.max(0, n - 1)}`;
      }
    });
  }

  // Comment
  const commentBtn = card.querySelector('.comment-btn');
  if (commentBtn && !commentBtn._bound) {
    commentBtn._bound = true;
    commentBtn.addEventListener('click', () => {
      let sec = card.querySelector('.comments-section');
      if (!sec) { sec = buildCommentSection(card); }
      sec.classList.toggle('open');
      if (sec.classList.contains('open')) sec.querySelector('.comment-input').focus();
    });
  }

  // Share
  const shareBtn = card.querySelector('.share-btn');
  if (shareBtn && !shareBtn._bound) {
    shareBtn._bound = true;
    shareBtn.addEventListener('click', () => {
      const title = card.querySelector('.post-title')?.textContent || '';
      const body  = card.querySelector('.post-body')?.textContent  || '';
      shareText = `${title}\n${body}\n${location.href}`;
      shareOverlay.classList.add('active');
    });
  }
}

/* Close ctx menus on outside click */
document.addEventListener('click', () =>
  document.querySelectorAll('.post-ctx-menu.open').forEach(m => m.classList.remove('open'))
);

/* Enrich all existing cards */
document.querySelectorAll('.post-card').forEach(enrichCard);