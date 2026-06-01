// mon-profile.js
// ════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════
let currentProfileSrc = null;
let currentUser = {
  id: null,
  nom: '',
  prenom: '',
  initiales: '',
  avatar: null
};

let socket = null;
let lastConv = null;

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../${path}`;
}

// ════════════════════════════════════════
// LOAD PROFILE FROM SESSION (PHP API)
// ════════════════════════════════════════
async function loadProfile() {
  try {
    const res = await fetch('../../api/get-profile.php');
    if (res.status === 401) {
      window.location.href = '../html/login-user.html';
      return;
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('PHP returned non-JSON:', text);
      return;
    }
    if (!data.success) return;

    currentUser.id       = data.id;
    currentUser.prenom   = data.prenom || '';
    currentUser.nom      = data.nom || '';
    currentUser.initiales = ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase() || '?';
    currentUser.avatar   = data.avatar || null;
    currentUser._cvPath = data.cv_path || null;

    const fullName = `${data.prenom} ${data.nom}`.trim();

    const displayName = document.getElementById('displayName');
    if (displayName) displayName.childNodes[0].textContent = fullName;

    const displayRole = document.getElementById('displayRole');
    if (displayRole) displayRole.textContent = data.specialite || data.niveau || data.role || '';

    const displayLocation = document.getElementById('displayLocation');
    if (displayLocation)
      displayLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.localisation || 'Algérie'}`;

    const letter = document.getElementById('navAvatarLetter');
    const img    = document.getElementById('navAvatarImg');

    if (data.avatar) {
      currentProfileSrc = data.avatar;
      if (img)    { img.src = buildPhotoUrl(data.avatar); img.style.display = 'block'; }
      if (letter)   letter.style.display = 'none';
      updateAllPostAvatars(data.avatar);
    } else {
      if (letter) letter.textContent = currentUser.initiales[0] || '?';
    }

    const profilePreview = document.getElementById('profilePreview');
    if (profilePreview && data.avatar) profilePreview.src = buildPhotoUrl(data.avatar);

    const bannerTop = document.getElementById('bannerTop');
    if (bannerTop && data.banner) {
      bannerTop.style.backgroundImage  = `url('${buildPhotoUrl(data.banner)}')`;
      bannerTop.style.backgroundSize   = 'cover';
      bannerTop.style.backgroundPosition = 'center';
      bannerTop.style.backgroundRepeat  = 'no-repeat';
    }

    const bannerBottom = document.getElementById('bannerBottom');
    if (bannerBottom && data.banner_color_dark && data.banner_color_light) {
      bannerBottom.style.background =
        `linear-gradient(to right, ${data.banner_color_dark}, ${data.banner_color_light})`;
    }

  await loadNavDots();
  } catch (err) {
    console.error('loadProfile error:', err);
  }
}

async function loadNavDots() {
  try {
    const res  = await fetch('../../api/get-notifications.php');
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
    const res  = await fetch('../../api/get-conversations.php');
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

function showNotification1(message, color = '#16376E') {
  const notif = document.getElementById('notification');
  if (!notif) return;
  notif.innerText = message;
  notif.style.background = color;
  notif.style.display = 'flex';
  clearTimeout(notif._t);
  notif._t = setTimeout(() => { notif.style.display = 'none'; }, 3000);
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
  else          { r = Math.min(255, r + amount); g = Math.min(255, g + amount); b = Math.min(255, b + amount); }
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function changeBannerColor(color1, color2) {
  const br = h => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return (r * 299 + g * 587 + b * 114) / 1000; };
  const dark = br(color1) < br(color2) ? color1 : color2, light = br(color1) < br(color2) ? color2 : color1;
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
    av.style.backgroundImage   = `url(${src})`;
    av.style.backgroundSize    = 'cover';
    av.style.backgroundPosition = 'center';
    av.textContent = '';
  });
  const npAv = document.getElementById('newPostAvatar');
  if (npAv) { npAv.style.backgroundImage = `url(${src})`; npAv.style.backgroundSize = 'cover'; npAv.style.backgroundPosition = 'center'; npAv.textContent = ''; }
}

// ════════════════════════════════════════
// CROPPER
// ════════════════════════════════════════
let cropperInstance = null, cropTarget = null;

function openCropper(file, target, aspectRatio) {
  const cropModal = document.getElementById('cropModal');
  const cropImage = document.getElementById('cropImage');
  cropTarget = target;
  const valid = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  if (!valid.includes(file.type)) { showNotification('Format non supporté !'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    cropImage.src = e.target.result;
    cropModal.classList.add('active');
    cropImage.onload = () => {
      cropperInstance = new Cropper(cropImage, { aspectRatio, viewMode: 1, movable: true, zoomable: true, scalable: false, cropBoxResizable: true, background: false });
    };
  };
  reader.readAsDataURL(file);
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
    .comments-list.is-hidden{display:none !important;}
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
    .post-card{position:relative}
    .file-dl-link{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;font-size:12px;color:var(--text);text-decoration:none;transition:background .15s;cursor:pointer}
    .file-dl-link:hover{background:var(--border)}
    .file-dl-link i:first-child{color:var(--accent);font-size:14px}
    .dl-icon{margin-left:auto;color:var(--muted);font-size:12px}
  `;
  document.head.appendChild(s);
})();
  function scheduleFromStorageProfile() {
  const raw = localStorage.getItem('pendingScheduledPost');
  if (!raw) return;

  let pending;
  try { pending = JSON.parse(raw); } catch { localStorage.removeItem('pendingScheduledPost'); return; }

  const scheduledAt = new Date(pending.scheduledAt);
  const delay = scheduledAt - Date.now();

  if (delay <= 0) { publishPendingProfile(pending); return; }

  const fmt = scheduledAt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  showNotification(`⏳ Modification planifiée pour le ${fmt}`);
  setTimeout(() => publishPendingProfile(pending), delay);
}

async function publishPendingProfile(pending) {
  const fd = new FormData();
  const apiUrl = pending.type === 'edit'
    ? '../../api/update-service.php'
    : '../../api/create-service.php';

  if (pending.type === 'edit') fd.append('id', pending.editId);
  fd.append('titre',          pending.titre);
  fd.append('description',    pending.description);
  fd.append('prix',           pending.prix);
  fd.append('prix_affichage', pending.prixRaw);
  fd.append('status',         pending.status);

  if (pending.type === 'edit') {
    (pending.categories || []).forEach(id => fd.append('categories[]', id));
  } else {
    (pending.categories || []).forEach(cat => fd.append('categories[]', cat.ID));
  }

  // ── Reconvertir base64 → Blob ──
  if (pending.photos && pending.photos.length > 0) {
    try {
      const blobs = await Promise.all(
        pending.photos.map(photo => new Promise(resolve => {
          const [header, data] = photo.base64.split(',');
          const mime   = header.match(/:(.*?);/)[1];
          const binary = atob(data);
          const arr    = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j);
          resolve(new Blob([arr], { type: mime }));
        }))
      );
      blobs.forEach((blob, i) => fd.append('photos[]', blob, `photo_${i + 1}.jpg`));
    } catch (err) { console.error('Erreur reconversion photos:', err); }
  }

  try {
    const res    = await fetch(apiUrl, { method: 'POST', credentials: 'include', body: fd });
    const result = JSON.parse(await res.text());
    if (result.success) {
      localStorage.removeItem('pendingScheduledPost');
      const msg = pending.type === 'edit' ? '✅ Service modifié automatiquement !' : '✅ Service publié automatiquement !';
      showNotification(msg);
      if (typeof loadServices === 'function') await loadServices();
    }
  } catch (err) { console.error('Erreur publication planifiée:', err); }
}


// ════════════════════════════════════════
// SHARE SHEET
// ════════════════════════════════════════
const shareOverlay = document.createElement('div');
shareOverlay.className = 'share-overlay'; shareOverlay.id = 'shareOverlay';
const SHARE_PLATFORMS = [
  { label: 'Facebook', color: '#1877F2', icon: 'fa-brands fa-facebook-f', url: t => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${encodeURIComponent(t)}` },
  { label: 'WhatsApp', color: '#25D366', icon: 'fa-brands fa-whatsapp', url: t => `https://api.whatsapp.com/send?text=${encodeURIComponent(t)}` },
  { label: 'Twitter/X', color: '#000', icon: 'fa-brands fa-x-twitter', url: t => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}` },
  { label: 'LinkedIn', color: '#0A66C2', icon: 'fa-brands fa-linkedin-in', url: t => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(location.href)}` },
  { label: 'Telegram', color: '#26A5E4', icon: 'fa-brands fa-telegram', url: t => `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(t)}` },
  { label: 'Gmail', color: '#EA4335', icon: 'fa-solid fa-envelope', url: t => `mailto:?subject=Post intéressant&body=${encodeURIComponent(t)}` },
  { label: 'Reddit', color: '#FF4500', icon: 'fa-brands fa-reddit-alien', url: t => `https://www.reddit.com/submit?url=${encodeURIComponent(location.href)}&title=${encodeURIComponent(t)}` },
  { label: 'Snapchat', color: '#FFFC00', icon: 'fa-brands fa-snapchat', url: t => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(location.href)}`, textColor: '#000' },
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
  const div = document.createElement('div'); div.className = 'share-item';
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
editPostOverlay.className = 'edit-post-overlay'; editPostOverlay.id = 'editPostOverlay';
editPostOverlay.innerHTML = `
  <div class="edit-post-modal">
    <div class="edit-post-title">✏️ Modifier le post</div>
    <textarea class="edit-post-textarea" id="editPostTextarea" placeholder="Contenu du post…"></textarea>
    <div class="edit-post-actions">
      <button class="edit-cancel-btn" id="editCancelBtn">Annuler</button>
      <button class="edit-save-btn" id="editSaveBtn">Enregistrer</button>
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

// ════════════════════════════════════════
// ENRICH CARD
// ════════════════════════════════════════
function enrichCard(card) {
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
        if (item.dataset.action === 'delete') {
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
            showNotification('🗑️ Post supprimé');
          });
        } else if (item.dataset.action === 'edit') {
          openEditModal(card);
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
      if (this.classList.contains('liked')) { this.innerHTML = `<i class="fa-solid fa-heart"></i> ${n + 1}`; }
      else { this.innerHTML = `<i class="fa-regular fa-heart"></i> ${Math.max(0, n - 1)}`; }
    });
  }

  const shareBtn = card.querySelector('.share-btn');
  if (shareBtn && !shareBtn._bound) {
    shareBtn._bound = true;
    shareBtn.addEventListener('click', () => {
      const title = card.querySelector('.post-title')?.textContent || '';
      const body  = card.querySelector('.post-body')?.textContent || '';
      shareText = `${title}\n${body}\n${location.href}`;
      shareOverlay.classList.add('active');
    });
  }
}

document.addEventListener('click', () => document.querySelectorAll('.post-ctx-menu.open').forEach(m => m.classList.remove('open')));

// ════════════════════════════════════════
// LOAD SERVICES
// ════════════════════════════════════════
async function loadServices() {
  try {
    const response = await fetch("../../api/get-my-services.php");
    const data = await response.json();
    if (!data.success) return;

    const container = document.getElementById("servicesContainer");
    if (!container) return;

    container.innerHTML = "";

    // if (data.services.length === 0) {
    //   container.innerHTML = `
    //     <div style="text-align:center;padding:40px;color:#8b8a99;font-family:'DM Sans',sans-serif;">
    //       <i class="fa-regular fa-folder-open" style="font-size:32px;margin-bottom:12px;display:block;opacity:0.4;"></i>
    //       Vous n'avez pas encore sollicité de service.
    //     </div>`;
    //   return;
    // }

    container.innerHTML = data.services.map(service => createServiceCard(service)).join("");
    attachProfileCardEvents(container);

  } catch (error) {
    console.error("loadServices error:", error);
  }
}

// ════════════════════════════════════════
// CREATE SERVICE CARD
// ════════════════════════════════════════
function createServiceCard(service) {
  const profileImage = service.photo_profil ? `../../${service.photo_profil}` : null;
  const serviceImage = service.service_photo ? `../../${service.service_photo}` : null;
  const categories   = service.categorie ? service.categorie.split(",") : [];
  const timeAgo      = getTimeAgo(service.DateDePublication);

  let prixAffiche = service.prix + ' DZD';
  const match = service.description ? service.description.match(/\[prix_texte:(.+?)\]/) : null;
  if (match) {
    prixAffiche        = match[1];
    service.description = service.description.replace(/\[prix_texte:.+?\]/, '').trim();
  }

  const statusConfig = {
    'disponible': { color: '#16a34a', bg: '#eaf5ee', label: 'Disponible' },
    'en cours':   { color: '#d97706', bg: '#fef9c3', label: 'En cours' },
    'terminé':    { color: '#6b7280', bg: '#f3f4f6', label: 'Terminé' }
  };
  const st = statusConfig[service.status] || statusConfig['disponible'];

  return `
<article class="post-card" data-service-id="${service.ID}" data-owner-id="${service.ID_Utilisateur || ''}">
  <div class="post-header" style="position:relative;">
    <div class="post-avatar">
      <img src="${profileImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
    </div>
    <div class="post-meta" style="flex:1;">
      <div class="post-name">${service.nom} ${service.prenom}</div>
      <div class="post-time-row"><span class="post-time">${timeAgo}</span></div>
    </div>
    <button class="post-more" data-action="more"><i class="fa-solid fa-ellipsis"></i></button>
    <div class="post-more-menu" hidden>
      <button class="more-menu-item" data-action="edit"><i class="fa-regular fa-pen-to-square"></i> Modifier le service</button>
      <button class="more-menu-item danger" data-action="delete"><i class="fa-regular fa-trash-can"></i> Supprimer le service</button>
    </div>
  </div>

  <div class="post-title">${service.titre}</div>

  <div class="post-tags">
    <span class="post-tag">
      ${categories.map(cat => `
        <span class="category-pill green" style="cursor:pointer"
              onclick="window.location.href='../UI/categorie-services/categorie-services.html?cat=${encodeURIComponent(cat.trim())}'">
          ${cat.trim()}
        </span>`).join("")}
    </span>
  </div>

  <div class="post-body">
    ${service.description ? service.description.replace(/\n/g, '<br>') : ''}
    <br>prix : ${prixAffiche}
  </div>

  <span style="display:inline-block;margin:0 18px 10px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;font-family:'Space Grotesk',sans-serif;background:${st.bg};color:${st.color};">
    <i class="fa-solid fa-circle" style="font-size:7px;margin-right:4px;"></i>${st.label}
  </span>

  ${serviceImage ? `<img class="post-image" src="${serviceImage}">` : ""}

  <div class="post-rating-summary">
    <div class="rating-stars-display">${generateStars(service.note_moyenne)}</div>
    <span class="rating-score">${service.note_moyenne}</span>
    <span class="rating-count">(${service.nb_avis} évaluations)</span>
  </div>

  <div class="post-actions">
    <button class="post-action-btn" data-action="comment">
      <i class="fa-regular fa-comment"></i> Commentaires
      <span class="comments-count-badge" style="
        background:rgba(75,72,236,0.15);color:#4b48ec;font-size:10px;
        font-weight:700;padding:1px 6px;border-radius:10px;margin-left:4px;
      ">${service.nb_avis || 0}</span>
    </button>
  </div>

  <div class="comments-list is-hidden" data-loaded="false"></div>
</article>`;

}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function getTimeAgo(dateString) {
  const now  = new Date();
  const date = new Date(
    dateString.includes('Z') || dateString.includes('+')
      ? dateString
      : dateString.replace(' ', 'T') + 'Z'
  );
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
  const full = Math.floor(note);
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += i < full ? `<i class="fa-solid fa-star"></i>` : `<i class="fa-regular fa-star"></i>`;
  }
  return html;
}


function buildCommentItem(name, note, text, date, photoProfile) {
  const item = document.createElement('div');
  item.className = 'comment-item';
  const initials  = name.slice(0, 2).toUpperCase();
  const starsHtml = Array.from({ length: 5 }, (_, i) =>
    `<i class="${i < note ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
  ).join('');

  const avatarSrc  = photoProfile ? buildPhotoUrl(photoProfile) : null;
  const avatarHtml = avatarSrc
    ? `<img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : initials;

  item.innerHTML = `
    <div class="comment-avatar" style="${avatarSrc ? '' : 'background:linear-gradient(135deg,#4b48ec,#7299f4);'}">
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

function attachProfileCardEvents(container) {
  container.addEventListener('click', async (e) => {

    // Bouton Commentaires
    if (e.target.closest('.post-action-btn[data-action="comment"]')) {
      const card = e.target.closest('.post-card');
      const commentsList = card.querySelector('.comments-list');

      if (!commentsList.classList.contains('is-hidden')) {
        commentsList.classList.add('is-hidden');
        return;
      }

      commentsList.classList.remove('is-hidden');
      if (commentsList.dataset.loaded === 'true' || commentsList.dataset.loaded === 'loading') return;

      commentsList.dataset.loaded = 'loading';
      commentsList.innerHTML = `<div style="padding:14px 18px;color:#8c8580;font-size:12px;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;gap:8px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Chargement des avis...</div>`;

      const serviceId = card.dataset.serviceId;
      try {
        const res  = await fetch(`../../api/get-ratings.php?service_id=${serviceId}`);
        const data = await res.json();
        commentsList.innerHTML = '';

        if (!data.success || !data.ratings || data.ratings.length === 0) {
          commentsList.innerHTML = `<div style="padding:14px 18px;color:#8c8580;font-size:12px;font-family:'Space Grotesk',sans-serif;text-align:center;">
            <i class="fa-regular fa-comment-dots" style="font-size:20px;display:block;margin-bottom:6px;"></i>Aucun avis pour l'instant</div>`;
        } else {
          data.ratings.forEach(r => {
            const dateStr = new Date(r.DateEval).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
            commentsList.appendChild(buildCommentItem(`${r.prenom} ${r.nom}`, parseInt(r.note), r.commentaire || '', dateStr, r.photo_profil));
          });
        }
        commentsList.dataset.loaded = 'true';
      } catch (err) {
        console.error(err);
        commentsList.innerHTML = `<div style="padding:14px 18px;color:#ef4444;font-size:12px;">
          <i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement</div>`;
        commentsList.dataset.loaded = 'false';
      }
      return;
    }

  });
}

// ════════════════════════════════════════
// LOAD ALL USERS FOR SIDEBAR
// ════════════════════════════════════════
async function loadAllUsers() {
  const list = document.getElementById('usersList');
  if (!list) return;
  list.innerHTML = 'Chargement...';

  const PREVIEW_COUNT = 4;

  try {
    const res = await fetch('../../api/get-all-users.php');
    if (!res.ok) { list.innerHTML = 'Erreur serveur: ' + res.status; return; }
    const users = await res.json();
    if (!Array.isArray(users)) { list.innerHTML = 'Données invalides'; return; }

    list.innerHTML = '';

    const items = users.map((user, i) => {
      const item      = document.createElement('div'); item.className = 'suggest-item';
      if (i >= PREVIEW_COUNT) item.classList.add('suggest-item--hidden');

      const avatarDiv = document.createElement('div'); avatarDiv.className = 'suggest-avatar';
      if (user.photo_profil) {
        const img = document.createElement('img');
        img.src = buildPhotoUrl(user.photo_profil); img.alt = user.prenom;
        img.onerror = () => {
          avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
          avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
        avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
      }

      const infoDiv = document.createElement('div'); infoDiv.className = 'suggest-info';
      const nameDiv = document.createElement('div'); nameDiv.className = 'name'; nameDiv.textContent = `${user.prenom} ${user.nom}`;
      const roleDiv = document.createElement('div'); roleDiv.className = 'role'; roleDiv.textContent = user.specialite || user.niveau || user.role || 'Utilisateur';
      infoDiv.appendChild(nameDiv); infoDiv.appendChild(roleDiv);
      item.appendChild(avatarDiv); item.appendChild(infoDiv);
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => { window.location.href = `../UI/profile/profile.html?id=${user.ID}`; });
      list.appendChild(item);
      return item;
    });

    if (users.length > PREVIEW_COUNT) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'suggest-toggle-btn';
      toggleBtn.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
      toggleBtn.title = 'Voir plus';
      let expanded = false;
      toggleBtn.addEventListener('click', () => {
        expanded = !expanded;
        items.forEach((item, i) => {
          if (i >= PREVIEW_COUNT) {
            item.classList.toggle('suggest-item--hidden', !expanded);
            item.classList.toggle('suggest-item--visible', expanded);
          }
        });
        toggleBtn.innerHTML = expanded ? `<i class="fa-solid fa-chevron-up"></i>` : `<i class="fa-solid fa-chevron-down"></i>`;
        toggleBtn.title = expanded ? 'Réduire' : 'Voir plus';
      });
      list.appendChild(toggleBtn);
    }

  } catch (err) {
    console.error('Fetch error:', err);
    list.innerHTML = 'Erreur connexion: ' + err.message;
  }
}

// ════════════════════════════════════════
// CHAT PANEL + CHATBOT (fonction, pas DOMContentLoaded)
// ════════════════════════════════════════
function initChatPanel() {
  const panel     = document.getElementById('chatPanel');
  const closeBtn  = document.getElementById('chatPanelClose');
  const fabChatBtn = document.getElementById('fabMsgBtn');
  const input     = document.getElementById('chatInput');
  const sendBtn   = document.getElementById('chatSend');
  const messages  = document.getElementById('chatMessages');
  const botPanel  = document.getElementById('chatbotPanel');
  const botCloseBtn = document.getElementById('chatbotClose');
  const botInput  = document.getElementById('chatbotInput');
  const botSendBtn = document.getElementById('chatbotSend');
  const botMessages = document.getElementById('chatbotMessages');
  const fabHelpBtn = document.getElementById('fabHelpBtn');

  function openChat()    { if (panel)    panel.classList.add('active'); }
  function closeChat()   { if (panel)    panel.classList.remove('active'); }
  function openBotChat() { if (botPanel) botPanel.classList.add('active'); }
  function closeBotChat(){ if (botPanel) botPanel.classList.remove('active'); }

  if (fabChatBtn)  fabChatBtn.addEventListener('click', openChat);
  if (closeBtn)    closeBtn.addEventListener('click', closeChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);
  if (fabHelpBtn)  fabHelpBtn.addEventListener('click', openBotChat);

  initChat();

  async function initChat() {
    await loadChatUserProfile();
    await loadLastConversation();
  }

  async function loadChatUserProfile() {
    try {
      const res  = await fetch('../../api/get-profile.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.id) return;
      currentUser = { id: data.id, nom: data.nom, prenom: data.prenom, avatar: data.avatar,
                      initiales: ((data.prenom?.[0]||'') + (data.nom?.[0]||'')).toUpperCase() };
    } catch (err) { console.warn('chat: could not load profile', err); }
  }

  function scrollToBottom() { if (messages) messages.scrollTop = messages.scrollHeight; }

  async function loadLastConversation() {
    try {
      const res  = await fetch('../../api/get-conversations.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;
      const u = data[0];
      lastConv = {
        id: u.ID, name: `${u.prenom} ${u.nom}`,
        avatar: buildPhotoUrl(u.photo_profil),
        initials: ((u.nom?.[0]||'') + (u.prenom?.[0]||'')).toUpperCase(),
        gradient: ['linear-gradient(135deg,#e44,#f97316)','linear-gradient(135deg,#059669,#34d399)','linear-gradient(135deg,#7c3aed,#a78bfa)','linear-gradient(135deg,#0ea5e9,#38bdf8)','linear-gradient(135deg,#db2777,#f472b6)'][(u.ID||0)%5],
        messages: []
      };
      updateChatPanelHeader();
      initWebSocket();
    } catch (err) { console.warn('chat: could not load conversations', err); }
  }

  function updateChatPanelHeader() {
    if (!lastConv || !panel) return;
    const nameEl   = panel.querySelector('.chat-panel-name');
    const avatarEl = panel.querySelector('.chat-panel-avatar');
    if (nameEl) nameEl.textContent = lastConv.name;
    if (avatarEl) {
      if (lastConv.avatar) { avatarEl.innerHTML = `<img src="${lastConv.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`; avatarEl.style.background = 'none'; }
      else { avatarEl.textContent = lastConv.initials; avatarEl.style.background = lastConv.gradient; }
    }
  }

  function initWebSocket() {
    if (!currentUser?.id || !lastConv || socket) return;
    socket = io('http://localhost:3000', { query: { userId: currentUser.id } });
    socket.on('connect', () => socket.emit('get_history', { otherUserId: lastConv.id }));
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

  function sendMessage() {
    if (!input) return;
    const text = input.value.trim(); if (!text) return;
    const div = document.createElement('div'); div.className = 'chat-msg sent';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    if (messages) messages.appendChild(div);
    input.value = '';
    if (messages) messages.scrollTop = messages.scrollHeight;
    if (socket && lastConv && currentUser) {
      socket.emit('send_message', { ID_Expediteur: currentUser.id, ID_Destinataire: lastConv.id, contenue: text });
    }
  }

  function sendBotMessage() {
    if (!botInput) return;
    const text = botInput.value.trim(); if (!text) return;
    const userMsg = document.createElement('div'); userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    if (botMessages) botMessages.appendChild(userMsg);
    botInput.value = '';
    if (botMessages) botMessages.scrollTop = botMessages.scrollHeight;
    const userId = currentUser?.id || 'anonymous';
    fetch('http://localhost:5000/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, user_id: userId })
    }).then(r => r.json()).then(data => appendBotReply(data.response || 'Désolé, une erreur s\'est produite.')).catch(() => appendBotReply('Impossible de contacter l\'assistant.'));
  }

  function appendBotReply(text) {
    const div = document.createElement('div'); div.className = 'chat-msg received';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    if (botMessages) { botMessages.appendChild(div); botMessages.scrollTop = botMessages.scrollHeight; }
  }

  if (sendBtn)  sendBtn.addEventListener('click', sendMessage);
  if (input)    input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

  function escapeHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatTime(d)   { if (!d) return ''; return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
}

// ════════════════════════════════════════
// EVENTS MENU ... PAGE PROFIL
// ════════════════════════════════════════
document.addEventListener('click', async (e) => {

  if (e.target.closest('.post-more[data-action="more"]')) {
    const card = e.target.closest('.post-card'); if (!card) return;
    const menu = card.querySelector('.post-more-menu'); if (!menu) return;
    const wasHidden = menu.hidden;
    document.querySelectorAll('.post-more-menu').forEach(m => m.hidden = true);
    menu.hidden = !wasHidden;
    e.stopPropagation(); return;
  }

  if (e.target.closest('.more-menu-item[data-action="delete"]')) {
    const card = e.target.closest('.post-card');
    const menu = card.querySelector('.post-more-menu'); menu.hidden = true;
    const confirmOverlay = document.createElement('div');
    confirmOverlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);z-index:2000;display:flex;justify-content:center;align-items:center;`;
    confirmOverlay.innerHTML = `
      <div style="background:rgba(13,13,28,0.97);border:1px solid rgba(75,72,236,0.30);border-radius:18px;padding:28px 24px;width:100%;max-width:320px;box-shadow:0 24px 64px rgba(0,0,0,0.5);text-align:center;animation:fadeUp .25s ease both;">
        <div style="width:52px;height:52px;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.25);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:22px;">🗑️</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:16px;color:#f1f0f5;margin-bottom:8px;">Supprimer ce service ?</div>
        <div style="font-size:13px;color:#8b8a99;margin-bottom:24px;line-height:1.55;">Cette action est irréversible.</div>
        <div style="display:flex;gap:10px;">
          <button id="delCancelBtn" style="flex:1;padding:11px;border:1px solid rgba(75,72,236,0.30);border-radius:10px;background:rgba(255,255,255,0.05);color:#f1f0f5;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;cursor:pointer;">Annuler</button>
          <button id="delConfirmBtn" style="flex:1;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;cursor:pointer;">Supprimer</button>
        </div>
      </div>`;
    document.body.appendChild(confirmOverlay);
    document.getElementById('delCancelBtn').addEventListener('click', () => confirmOverlay.remove());
    confirmOverlay.addEventListener('click', ev => { if (ev.target === confirmOverlay) confirmOverlay.remove(); });
    document.getElementById('delConfirmBtn').addEventListener('click', async () => {
      confirmOverlay.remove();
      const serviceId = card.dataset.serviceId;
      try {
        const res  = await fetch('../../api/delete-service.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: serviceId }) });
        const data = await res.json();
        if (data.success) {
          card.style.transition = 'opacity .3s, transform .3s';
          card.style.opacity    = '0';
          card.style.transform  = 'scale(0.97)';
          setTimeout(() => card.remove(), 300);
        } else { alert('Erreur : ' + (data.message || 'Impossible de supprimer.')); }
      } catch (err) { console.error(err); }
    });
    return;
  }

  if (e.target.closest('.more-menu-item[data-action="edit"]')) {
    const card = e.target.closest('.post-card');
    card.querySelector('.post-more-menu').hidden = true;
    const serviceId = card.dataset.serviceId;
    try {
      const res  = await fetch(`../../api/get-single-service.php?id=${serviceId}`);
      const data = await res.json();
      if (!data.success) return;
      openServiceEditModal(data.service, serviceId);
    } catch (err) { console.error(err); }
    return;
  }

  if (!e.target.closest('.post-more') && !e.target.closest('.post-more-menu')) {
    document.querySelectorAll('.post-more-menu').forEach(m => m.hidden = true);
  }
});

// ════════════════════════════════════════
// POINT D'ENTRÉE UNIQUE
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {

  // ── 1. Profil + Services + Users ──
  await loadProfile();
  await loadServices();
  loadAllUsers();
  scheduleFromStorageProfile();

  // ── 2. Enrich existing cards ──
  document.querySelectorAll('.post-card').forEach(enrichCard);

  // ── 3. Chat Panel ──
  initChatPanel();

  // ── 4. CV Upload ──
const cvInput   = document.getElementById('cvInput');
const cvName    = document.getElementById('cvName');
let   cvFileURL = null;

// Charger le CV existant depuis le profil
if (currentUser._cvPath) {
  const url      = buildPhotoUrl(currentUser._cvPath);
  const filename = currentUser._cvPath.split('/').pop();
  cvFileURL = url;
  if (cvName) {
    cvName.textContent      = '📄';
    cvName.dataset.filename = filename;
    cvName.style.cursor     = 'pointer';
  }
}

if (cvInput) {
  cvInput.addEventListener('change', async function () {
    if (!this.files.length) return;
    const file = this.files[0];

    // Affichage immédiat
    cvFileURL = URL.createObjectURL(file);
    if (cvName) {
      cvName.textContent      = '📄';
      cvName.dataset.filename = file.name;   // ← file.name, pas filename
      cvName.style.cursor     = 'pointer';
    }

    // Upload
    const fd = new FormData();
    fd.append('cv', file);
    try {
      const res  = await fetch('../../api/upload-cv.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        currentUser._cvPath         = data.cv_path;
        cvFileURL                   = buildPhotoUrl(data.cv_path);
        if (cvName) cvName.dataset.filename = file.name;  // ← mettre à jour
        showNotification('✅ CV sauvegardé !');
      } else {
        showNotification('❌ ' + (data.message || 'Erreur upload CV'));
      }
    } catch (err) {
      console.error('CV upload error:', err);
      showNotification('❌ Erreur réseau lors de l\'upload du CV');
    }
  });
}

if (cvName) {
  cvName.addEventListener('click', () => { if (cvFileURL) window.open(cvFileURL, '_blank'); });
}

  // ── 5. Help Panel ──
  const helpOverlay      = document.getElementById('helpOverlay');
  const helpClose        = document.getElementById('helpClose');
  const fabHelpBtnGlobal = document.getElementById('fabHelpBtn');
  if (fabHelpBtnGlobal) fabHelpBtnGlobal.addEventListener('click', () => helpOverlay?.classList.add('active'));
  if (helpClose)         helpClose.addEventListener('click', () => helpOverlay?.classList.remove('active'));
  if (helpOverlay)       helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.classList.remove('active'); });

  // ── 6. Links Widget ──
  const openBtn       = document.getElementById('openModal');
  const modal         = document.getElementById('linkModal');
  const closeModalBtn = document.getElementById('closeModal');
  const saveBtn       = document.querySelector('.save-btn');
  const linkInput     = document.getElementById('modalLinkInput');
  const linksContainer = document.getElementById('linksContainer');
  const emptyMsg      = document.getElementById('linksEmpty');
  const badge         = document.getElementById('linksBadge');
  const toggleBtn     = document.getElementById('linksToggleBtn');
  const dropdown      = document.getElementById('linksDropdown');
  let   links         = JSON.parse(localStorage.getItem('links')) || [];

  function displayLinks() {
    if (!linksContainer) return;
    linksContainer.innerHTML = '';
    links.forEach((link, index) => {
      const div  = document.createElement('div'); div.className = 'link-item';
      const icon = document.createElement('div'); icon.className = 'link-item-icon'; icon.innerHTML = '<i class="fa-solid fa-link"></i>';
      const a    = document.createElement('a');
      try { a.textContent = new URL(link).hostname.replace('www.', ''); } catch { a.textContent = link; }
      a.href = link; a.title = link; a.target = '_blank';
      a.addEventListener('click', e => e.stopPropagation());
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '&#x2715;'; delBtn.className = 'delete-btn'; delBtn.title = 'Supprimer';
      delBtn.addEventListener('click', e => {
        e.stopPropagation(); links.splice(index, 1);
        localStorage.setItem('links', JSON.stringify(links)); displayLinks();
      });
      div.appendChild(icon); div.appendChild(a); div.appendChild(delBtn);
      linksContainer.appendChild(div);
    });
    if (emptyMsg) emptyMsg.style.display = links.length === 0 ? 'block' : 'none';
    if (badge) { if (links.length > 0) { badge.textContent = links.length; badge.style.display = 'flex'; } else badge.style.display = 'none'; }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', e => { e.stopPropagation(); dropdown?.classList.toggle('open'); toggleBtn.classList.toggle('active'); });
  }
  document.addEventListener('click', e => {
    if (dropdown && !dropdown.contains(e.target) && e.target !== toggleBtn) {
      dropdown.classList.remove('open'); toggleBtn?.classList.remove('active');
    }
  });
  if (openBtn) {
    openBtn.addEventListener('click', e => {
      e.stopPropagation(); dropdown?.classList.remove('open'); toggleBtn?.classList.remove('active');
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
    if (e.target === modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); if (linkInput) linkInput.value = ''; }
  });
  if (linkInput) linkInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn?.click(); });
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const link = linkInput?.value.trim();
      if (!link) { showNotification('⚠️  Entrez un lien !'); return; }
      if (!link.startsWith('http')) { showNotification('⚠️  Lien invalide !'); return; }
      links.push(link); localStorage.setItem('links', JSON.stringify(links));
      if (linkInput) linkInput.value = '';
      if (modal) modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      displayLinks(); showNotification('✓  Lien ajouté !');
    });
  }
  displayLinks();

  // ── 7. Nav dropdown ──
  const navMenuBtn  = document.getElementById('navMenuBtn');
  const navDropdown = document.getElementById('navDropdown');
  if (navMenuBtn) {
    navMenuBtn.addEventListener('click', e => { e.stopPropagation(); if (navDropdown) navDropdown.hidden = !navDropdown.hidden; });
  }
  document.addEventListener('click', () => { if (navDropdown) navDropdown.hidden = true; });

  // ── 8. Déconnexion / Suppression compte ──
  document.getElementById('btnDeconnexion')?.addEventListener('click', () => { window.location.href = '../html/login-user.html'; });
  document.getElementById('btnSupprimerCompte')?.addEventListener('click', () => {
    if (navDropdown) navDropdown.hidden = true;
    document.getElementById('modalSupprimer').hidden = false;
  });
  document.getElementById('modalCancel')?.addEventListener('click',  () => { document.getElementById('modalSupprimer').hidden = true; });
  document.getElementById('modalOverlay')?.addEventListener('click', () => { document.getElementById('modalSupprimer').hidden = true; });
  document.getElementById('modalConfirm')?.addEventListener('click', async () => {
    document.getElementById('modalSupprimer').hidden = true;
    const res  = await fetch('../../api/delete-account.php', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showNotification1('Compte supprimé. Redirection...', '#16376E');
      setTimeout(() => { window.location.href = '../html/signUp-user.html'; }, 2000);
    } else {
      showNotification('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'), '#b91c1c');
    }
  });

});

// ════════════════════════════════════════
// EDIT SERVICE MODAL (autonome)
// ════════════════════════════════════════
(function () {

  // ── Créer l'overlay ──
  const overlay = document.createElement('div');
  overlay.id = 'editServiceOverlay';
  overlay.style.cssText = `display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);z-index:99999;justify-content:center;align-items:center;`;
  overlay.innerHTML = `
    <div style="background:#ffffff;color-scheme:light;border-radius:16px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(0,0,0,0.15);overflow:hidden;font-family:'DM Sans',sans-serif;color:#1a1714;">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 18px 14px;border-bottom:1px solid #f0f0f0;">
        <img id="editPmAvatar" src="" alt="" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;flex-shrink:0;">
        <div style="flex:1;">
          <div id="editPmName" style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;color:#1a1714;"></div>
          <div id="editPmRole" style="font-size:11px;color:#6b7280;margin-top:1px;"></div>
        </div>
        <button id="editServiceClose" style="width:30px;height:30px;border-radius:50%;border:none;background:#f3f4f6;color:#6b7280;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="padding:16px 18px;display:flex;flex-direction:column;gap:10px;">
        <input id="editServiceTitre" type="text" placeholder="Titre du service" style="width:100%;box-sizing:border-box;background:#f9fafb;border:1px solid #e5e7eb;border-radius:30px;padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:13px;color:#1a1714;outline:none;">
        <input id="editServicePrix" type="text" placeholder="Prix" style="width:100%;box-sizing:border-box;background:#f9fafb;border:1px solid #e5e7eb;border-radius:30px;padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:13px;color:#1a1714;outline:none;">
        <textarea id="editServiceDesc" placeholder="Décrivez votre service..." style="width:100%;box-sizing:border-box;background:transparent;border:none;padding:4px;font-family:'DM Sans',sans-serif;font-size:13px;color:#1a1714;outline:none;resize:none;min-height:100px;"></textarea>
      </div>
      <div style="display:flex;align-items:center;padding:10px 18px 14px;border-top:1px solid #f0f0f0;gap:8px;">
        <span style="font-size:11px;color:#6b7280;">Statut :</span>
        <button data-status="disponible" class="edit-status-btn" style="padding:4px 12px;border-radius:20px;border:1.5px solid rgba(22,163,74,0.4);background:rgba(22,163,74,0.08);color:#16a34a;font-size:11px;font-weight:600;cursor:pointer;">● Disponible</button>
        <button data-status="en cours"  class="edit-status-btn" style="padding:4px 12px;border-radius:20px;border:1.5px solid rgba(217,119,6,0.4);background:rgba(217,119,6,0.08);color:#d97706;font-size:11px;font-weight:600;cursor:pointer;">⏳ En cours</button>
        <button data-status="terminé"   class="edit-status-btn" style="padding:4px 12px;border-radius:20px;border:1.5px solid rgba(107,114,128,0.4);background:rgba(107,114,128,0.08);color:#6b7280;font-size:11px;font-weight:600;cursor:pointer;">✗ Terminé</button>
        <div style="flex:1;"></div>
        <button id="editServiceSave" style="padding:9px 22px;border-radius:30px;border:none;background:#1a1714;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;cursor:pointer;"><i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  let currentEditId     = null;
  let currentEditStatus = 'disponible';
  let _profileCategories = [];
  let attachedPhotos     = [];

  overlay.querySelectorAll('.edit-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentEditStatus = btn.dataset.status;
      overlay.querySelectorAll('.edit-status-btn').forEach(b => b.style.outline = 'none');
      btn.style.outline = '2px solid currentColor';
    });
  });

  function closeModal() { overlay.style.display = 'none'; document.body.style.overflow = ''; }
  document.getElementById('editServiceClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // ── Charger les catégories ──
  async function _loadProfileCategoriesSilent() {
    try {
      const res    = await fetch('../../api/get-all-categories.php');
      const result = await res.json();
      if (result.success) _profileCategories = result.data;
    } catch (err) { console.error('Erreur chargement catégories:', err); }
  }

  function _renderProfileCatDropdown(catDropdown) {
    if (!catDropdown) return;
    catDropdown.innerHTML = '';
    _profileCategories.forEach(category => {
      const opt = document.createElement('div');
      opt.className = 'cat-option';
      opt.dataset.cat = category.ID;
      opt.textContent = category.titre;
      opt.style.cssText = 'padding:7px 10px;cursor:pointer;border-radius:6px;font-size:12px;color:#1a1714;transition:background .15s;';
      opt.addEventListener('mouseenter', () => opt.style.background = '#f3f4f6');
      opt.addEventListener('mouseleave', () => opt.style.background = '');
      opt.addEventListener('click', () => {
        const chips = document.getElementById('categoryChips');
        if (chips && !chips.querySelector(`[data-cat="${category.ID}"]`)) {
          const chip = document.createElement('span');
          chip.dataset.cat = category.ID;
          chip.innerHTML   = `${category.titre} <span data-remove>×</span>`;
          chip.querySelector('[data-remove]').addEventListener('click', () => chip.remove());
          chips.appendChild(chip);
        }
        catDropdown.classList.remove('open');
      });
      catDropdown.appendChild(opt);
    });
  }

  // ── fileToBlob ──
  function fileToBlob(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.onload  = e => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image load failed'));
        img.onload  = () => {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth; canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.92);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ════════════════════════════════════════
  // openServiceEditModal — exposé globalement
  // ════════════════════════════════════════
  window.openServiceEditModal = async function (service, serviceId) {
    const modalOverlay = document.getElementById('postModalOverlay');
    if (!modalOverlay) { console.error('postModalOverlay introuvable'); return; }

    attachedPhotos = [];

    // Extraire prix / description
    const matchPrix = (service.description || '').match(/\[prix_texte:(.+?)\]/);
    const cleanDesc  = matchPrix ? service.description.replace(/\[prix_texte:.+?\]/, '').trim() : (service.description || '');

    document.getElementById('postTitle').value = service.titre || '';
    document.getElementById('postPrice').value = matchPrix ? matchPrix[1] : (service.prix || '');
    document.getElementById('postDesc').value  = cleanDesc;

    // Photo existante
    const preview = document.getElementById('postPreview');
    preview.innerHTML = ''; preview.classList.remove('has-items');
    if (service.service_photo) {
      const photoUrl = buildPhotoUrl(service.service_photo);
      preview.innerHTML = `
        <div class="preview-item" style="position:relative;display:inline-block;margin-top:8px;">
          <img src="${photoUrl}" style="width:100%;border-radius:10px;max-height:200px;object-fit:cover;">
          <button type="button" class="preview-remove" style="position:absolute;top:6px;right:6px;background:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);z-index:10;padding:0;color:#000;">×</button>
        </div>`;
      preview.classList.add('has-items');
      preview.querySelector('.preview-remove').addEventListener('click', () => { preview.innerHTML = ''; preview.classList.remove('has-items'); });
    }

    // Avatar + nom
    const pmAvatar = document.getElementById('pmAvatar');
    const pmName   = document.querySelector('.post-modal-name');
    const pmRole   = document.querySelector('.post-modal-role');
    if (pmAvatar && currentUser?.avatar) { pmAvatar.src = buildPhotoUrl(currentUser.avatar); pmAvatar.style.display = 'block'; }
    if (pmName) pmName.textContent = `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim();
    if (pmRole) pmRole.textContent = currentUser?.role || 'Proposeur';

    // Catégories — charger si besoin, puis pré-remplir les chips
    if (_profileCategories.length === 0) await _loadProfileCategoriesSilent();

    const chipsBox = document.getElementById('categoryChips');
    if (chipsBox) {
      chipsBox.innerHTML = '';
      if (service.categorie) {
        service.categorie.split(',').map(c => c.trim()).filter(Boolean).forEach(catName => {
          const found = _profileCategories.find(c => c.titre === catName);
          const catId = found ? found.ID : catName;
          if (!chipsBox.querySelector(`[data-cat="${catId}"]`)) {
            const chip = document.createElement('span');
            chip.dataset.cat = catId;
            chip.innerHTML   = `${catName} <span data-remove>×</span>`;
            chip.querySelector('[data-remove]').addEventListener('click', () => chip.remove());
            chipsBox.appendChild(chip);
          }
        });
      }
    }

    // Bouton publier → mode édition
    const publishBtn = document.getElementById('postPublishBtn');
    publishBtn.innerHTML        = '<i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Enregistrer';
    publishBtn.dataset.editMode = 'true';
    publishBtn.dataset.editId   = serviceId;

    // Bouton X
    const closeBtn = document.getElementById('postModalClose');
    if (closeBtn) {
      const newClose = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newClose, closeBtn);
      newClose.addEventListener('click', _resetAndClose);
    }

    // Clic sur le fond
    modalOverlay._closeHandler && modalOverlay.removeEventListener('click', modalOverlay._closeHandler);
    modalOverlay._closeHandler = e => { if (e.target === modalOverlay) _resetAndClose(); };
    modalOverlay.addEventListener('click', modalOverlay._closeHandler);

    // ── Footer buttons ──
    const pmPhotoBtn   = document.getElementById('pmPhotoBtn');
    const pmPhotoInput = document.getElementById('pmPhotoInput');
    const pmCatBtn     = document.getElementById('pmCatBtn');
    const catDropdown  = document.getElementById('catDropdown');
    const pmStatusBtn  = document.getElementById('pmStatusBtn');
    const statusModal  = document.getElementById('statusModal');
    const pmTimerBtn   = document.getElementById('pmTimerBtn');
    const timerModal   = document.getElementById('timerModal');
    const timerModalClose = document.getElementById('timerModalClose');
    const timerConfirm = document.getElementById('timerConfirm');
    const scheduledChip = document.getElementById('scheduledChip');
    const scheduledText = document.getElementById('scheduledText');
    const scheduledRemove = document.getElementById('scheduledRemove');

    if (pmPhotoBtn && !pmPhotoBtn._editBound) {
      pmPhotoBtn._editBound = true;
      pmPhotoBtn.addEventListener('click', () => pmPhotoInput?.click());
    }
    if (pmPhotoInput && !pmPhotoInput._editBound) {
      pmPhotoInput._editBound = true;
      pmPhotoInput.addEventListener('change', () => {
        const file = pmPhotoInput.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          attachedPhotos.push({ url: e.target.result, file });
          const prev = document.getElementById('postPreview');
          if (prev) {
            prev.innerHTML = ''; prev.classList.add('has-items');
            attachedPhotos.forEach((photo, idx) => {
              const div = document.createElement('div'); div.style.cssText = 'position:relative;display:inline-block;margin-top:8px;width:100%;';
              const img = document.createElement('img'); img.src = photo.url; img.style.cssText = 'width:100%;border-radius:10px;max-height:200px;object-fit:cover;display:block;';
              const rm  = document.createElement('button'); rm.type = 'button'; rm.style.cssText = 'position:absolute;top:6px;right:6px;background:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);z-index:10;padding:0;';
              rm.textContent = '×';
              rm.addEventListener('click', ev => { ev.stopPropagation(); attachedPhotos.splice(idx, 1); div.remove(); if (attachedPhotos.length === 0) prev.classList.remove('has-items'); });
              div.appendChild(img); div.appendChild(rm); prev.appendChild(div);
            });
          }
        };
        reader.readAsDataURL(file); pmPhotoInput.value = '';
      });
    }

    // Catégories dropdown
    if (pmCatBtn && !pmCatBtn._editBound) {
      pmCatBtn._editBound = true;
      pmCatBtn.addEventListener('click', async e => {
        e.stopPropagation(); catDropdown?.classList.toggle('open');
        if (catDropdown?.classList.contains('open')) {
          if (_profileCategories.length === 0) await _loadProfileCategoriesSilent();
          _renderProfileCatDropdown(catDropdown);
        }
      });
    }

    // Statut
    if (pmStatusBtn && !pmStatusBtn._editBound) {
      pmStatusBtn._editBound = true;
      pmStatusBtn.addEventListener('click', e => { e.stopPropagation(); statusModal?.classList.toggle('open'); });
    }
    if (statusModal && !statusModal._editBound) {
      statusModal._editBound = true;
      statusModal.querySelectorAll('.status-option').forEach(opt => {
        opt.addEventListener('click', () => {
          statusModal.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          modalOverlay.dataset.selectedStatus = opt.dataset.value;
          document.getElementById('pmStatusBtn')?.classList.add('active');
          statusModal.classList.remove('open');
          showNotification(`✓ Statut : ${opt.textContent.trim()}`);
        });
      });
    }

    // ── Timer ──
    if (pmTimerBtn && !pmTimerBtn._editBound) {
      pmTimerBtn._editBound = true;
      pmTimerBtn.addEventListener('click', e => {
        e.stopPropagation();
        const timerDate = document.getElementById('timerDate');
        const timerTime = document.getElementById('timerTime');
        const now = new Date();
        if (timerDate) timerDate.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        if (timerTime) timerTime.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        timerModal?.classList.toggle('open');
      });
    }
    if (timerModalClose && !timerModalClose._editBound) {
      timerModalClose._editBound = true;
      timerModalClose.addEventListener('click', () => timerModal?.classList.remove('open'));
    }
    if (timerConfirm && !timerConfirm._editBound) {
      timerConfirm._editBound = true;
      timerConfirm.addEventListener('click', () => {
        const date = document.getElementById('timerDate')?.value;
        const time = document.getElementById('timerTime')?.value || '00:00';
        if (date && scheduledText && scheduledChip) {
          // Afficher date/heure lisible
          const dt = new Date(`${date}T${time}:00`);
          scheduledText.textContent = dt.toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
          scheduledChip.style.display = 'flex';
          timerModal?.classList.remove('open');
        }
      });
    }
    if (scheduledRemove && !scheduledRemove._editBound) {
      scheduledRemove._editBound = true;
      scheduledRemove.addEventListener('click', () => { if (scheduledChip) scheduledChip.style.display = 'none'; });
    }

    // Fermer dropdowns au clic dehors
    [catDropdown, statusModal, timerModal].forEach(el => el?.addEventListener('click', e => e.stopPropagation()));
    document.addEventListener('click', () => {
      catDropdown?.classList.remove('open');
      statusModal?.classList.remove('open');
      timerModal?.classList.remove('open');
    });

    // Ouvrir le modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // ── postPublishBtn ──
    const publishBtnEl = document.getElementById('postPublishBtn');
    if (publishBtnEl && !publishBtnEl._publishBound) {
      publishBtnEl._publishBound = true;
      publishBtnEl.addEventListener('click', async function () {
        const isEdit = this.dataset.editMode === 'true';
        const editId = this.dataset.editId;
        if (!isEdit) return;

        const titre   = document.getElementById('postTitle').value.trim();
        const prixRaw = document.getElementById('postPrice').value.trim();
        const desc    = document.getElementById('postDesc').value.trim();
        const status  = modalOverlay.dataset.selectedStatus || 'disponible';

        if (!titre) { showNotification('⚠️ Le titre est obligatoire'); return; }

        const chips = document.getElementById('categoryChips');
        if (!chips || chips.querySelectorAll('[data-cat]').length === 0) {
          showNotification('⚠️ Veuillez sélectionner au moins une catégorie'); return;
        }

        // ── Vérifier le timer ──
const scheduledChipEl = document.getElementById('scheduledChip');
if (scheduledChipEl && scheduledChipEl.style.display !== 'none') {
  const rawDate = document.getElementById('timerDate')?.value;
  const rawTime = document.getElementById('timerTime')?.value || '00:00';
  if (rawDate) {
    const scheduledDate = new Date(`${rawDate}T${rawTime}:00`);
    const delayMs = scheduledDate - new Date();
    if (delayMs > 0) {
      const titreSaved  = titre, descSaved = desc, prixSaved = prixRaw,
            statusSaved = status, editIdSaved = editId;
      const chipsSaved  = [...chips.querySelectorAll('[data-cat]')].map(c => c.dataset.cat);

      // ── Convertir photos en base64 avant localStorage ──
      const photosBase64 = await Promise.all(
        attachedPhotos.map(photo => {
          if (photo.file) {
            return new Promise(resolve => {
              const reader = new FileReader();
              reader.onload = e => resolve({ base64: e.target.result });
              reader.readAsDataURL(photo.file);
            });
          }
          return Promise.resolve({ base64: photo.url });
        })
      );

      const pendingEdit = {
        editId: editIdSaved, titre: titreSaved, description: descSaved,
        prix: isNaN(parseFloat(prixSaved)) ? 0 : parseFloat(prixSaved),
        prixRaw: prixSaved, status: statusSaved,
        categories: chipsSaved,
        scheduledAt: scheduledDate.toISOString(),
        photos: photosBase64,
        type: 'edit'  // ← distinguer création vs édition
      };

      try {
        localStorage.setItem('pendingScheduledPost', JSON.stringify(pendingEdit));
      } catch (e) {
        pendingEdit.photos = [];
        localStorage.setItem('pendingScheduledPost', JSON.stringify(pendingEdit));
        showNotification('⚠️ Photo trop lourde, sera publiée sans image');
      }

      const mins = Math.round(delayMs / 60000);
      showNotification(`⏰ Modification planifiée dans ${mins < 60 ? mins + ' min' : Math.round(mins/60) + ' h'}`);
      _resetAndClose();
      scheduledChipEl.style.display = 'none';
      scheduleFromStorageProfile();
      return;
    }
  }
}
        // ── Publication immédiate ──
        const formData = new FormData();
        formData.append('id', editId); formData.append('titre', titre); formData.append('description', desc);
        formData.append('prix', isNaN(parseFloat(prixRaw)) ? 0 : parseFloat(prixRaw)); formData.append('prix_affichage', prixRaw);
        formData.append('status', status);
        chips.querySelectorAll('[data-cat]').forEach(chip => formData.append('categories[]', chip.dataset.cat));

        if (attachedPhotos.length > 0) {
          try {
            const blobs = await Promise.all(attachedPhotos.map(p => fileToBlob(p.file)));
            blobs.forEach((b, i) => formData.append('photos[]', b, `photo_${i+1}.jpg`));
          } catch { showNotification('❌ Erreur traitement image'); return; }
        }

        try {
          const res    = await fetch('../../api/update-service.php', { method: 'POST', credentials: 'include', body: formData });
          const result = JSON.parse(await res.text());
          if (result.success) {
            showNotification('✅ Service modifié avec succès !');
            _resetAndClose();
            await loadServices();
          } else {
            showNotification('❌ ' + (result.message || 'Erreur'));
          }
        } catch (err) { console.error(err); showNotification('❌ Erreur réseau'); }
      });
    }


    function _resetAndClose() {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
      const pb = document.getElementById('postPublishBtn');
      if (pb) { delete pb.dataset.editMode; delete pb.dataset.editId; pb.innerHTML = 'publier'; pb._publishBound = false; }
      attachedPhotos = [];
      const prev = document.getElementById('postPreview');
      if (prev) { prev.innerHTML = ''; prev.classList.remove('has-items'); }
      const pt = document.getElementById('postTitle'); if (pt) pt.value = '';
      const pp = document.getElementById('postPrice'); if (pp) pp.value = '';
      const pd = document.getElementById('postDesc');  if (pd) pd.value = '';
    }
  };

})();