// ─────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────
let conversations = [];
let activeId = null;
let currentUser = null;
let socket = null;

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadUserProfile();     // must be first
  await loadConversations();   // depends on session

  document.getElementById('convSearch')
    ?.addEventListener('input', renderConvList);

  const msgInput = document.getElementById('msgInput');
  const sendBtn  = document.getElementById('sendBtn');

  sendBtn?.addEventListener('click', sendMessage);
  msgInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });
});

// ─────────────────────────────────────────
// LOAD USER PROFILE
// ─────────────────────────────────────────
async function loadUserProfile() {
  try {
    const res = await fetch('../../../api/get-profile.php');

    if (res.status === 401) {
      window.location.href = '../../../html/login-user.html';
      return;
    }

    const data = await res.json();

    if (!data.success || !data.id) {
      console.error('Invalid profile response', data);
      return;
    }

    currentUser = {
      id: data.id,
      nom: data.nom,
      prenom: data.prenom,
      avatar: buildPhotoUrl(data.avatar)
    };

    // NAV avatar
    const navImg = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');

    if (data.avatar) {
      navImg.src = buildPhotoUrl(data.avatar);
      navImg.style.display = 'block';
      navLetter.style.display = 'none';
    } else {
      navLetter.textContent = (data.prenom[0] + data.nom[0]).toUpperCase();
      navImg.style.display = 'none';
      navLetter.style.display = 'block';
    }

    initWebSocket();
    // ── Hide notification button for Chercheur users ──
    if (data.status === 'Chercheur') {
        const notifBtn = document.querySelector('.nav-icon-btn[title="Notifications"]');
        if (notifBtn) notifBtn.style.display = 'none';
    }

    loadNavDots();

  } catch (err) {
    console.error('Profile error:', err);
  }
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

// ─────────────────────────────────────────
// LOAD CONVERSATIONS (LEFT COLUMN)
// ─────────────────────────────────────────
async function loadConversations() {
  const list = document.getElementById('convList');
  list.innerHTML = 'Chargement...';

  try {
    const res = await fetch('../../../api/get-conversations.php');

    if (!res.ok) {
      list.innerHTML = 'Erreur serveur';
      return;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      list.innerHTML = 'Données invalides';
      console.error(data);
      return;
    }

    conversations = data.map(u => ({
      id: u.ID,
      name: `${u.nom} ${u.prenom}`,
      preview: u.last_message || '',
      time: formatTime(
        u.last_message_time
          ? (String(u.last_message_time).includes('Z') || String(u.last_message_time).includes('+')
              ? u.last_message_time
              : String(u.last_message_time).replace(' ', 'T') + 'Z')
          : null
      ),
      unread: u.unread_count || 0,  // ← était 0, maintenant récupère la vraie valeur
      avatar: buildPhotoUrl(u.photo_profil),
      initials: getInitials(u.nom, u.prenom),
      messages: []
    }));

    renderConvList();

  } catch (err) {
    console.error('Fetch error:', err);
    list.innerHTML = 'Erreur connexion';
  }
}

// ─────────────────────────────────────────
// WEBSOCKET
// ─────────────────────────────────────────
function initWebSocket() {
  if (!currentUser?.id) return;

  socket = io('http://localhost:3000', {
    query: { userId: currentUser.id }
  });

  socket.on('connect', () => {
    console.log('WS connected');
    // Recharger l'historique si une conversation est active
    if (activeId) loadMessageHistory(activeId);
  });

  socket.on(`msg_${currentUser.id}`, msg => {
    const otherId =
      msg.ID_Expediteur === currentUser.id
        ? msg.ID_Destinataire
        : msg.ID_Expediteur;

    const conv = conversations.find(c => c.id === otherId);
    if (!conv) return;

    conv.preview = msg.contenue;
    conv.time = formatTime(msg.DateEnvoie);

    if (msg.ID_Expediteur !== currentUser.id) {
      conv.unread = (conv.unread || 0) + 1;
    }

    renderConvList();

    if (activeId === otherId) {
      loadMessageHistory(otherId);  // ← recharge depuis le serveur
    }
  });

  socket.on('conversation_history', ({ otherUserId, messages }) => {
    const conv = conversations.find(c => c.id === otherUserId);
    if (!conv) return;

    conv.messages = messages.map(m => ({
      text: m.contenue,
      time: m.DateEnvoie
        ? (m.DateEnvoie.includes?.('Z') || m.DateEnvoie.includes?.('+')
            ? m.DateEnvoie
            : String(m.DateEnvoie).replace(' ', 'T') + 'Z')
        : null,
      sent: m.ID_Expediteur === currentUser.id
    }));

    if (activeId === otherUserId) {
      renderMessages(otherUserId);
    }
  });
}

// ─────────────────────────────────────────
// RENDER CONVERSATIONS
// ─────────────────────────────────────────
function renderConvList() {
  const list = document.getElementById('convList');
  const search = document.getElementById('convSearch');
  const q = search ? search.value.toLowerCase() : '';

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.preview.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    list.innerHTML = 'Aucune conversation';
    return;
  }

  list.innerHTML = '';

  filtered.forEach(conv => {
    const el = document.createElement('div');
    el.className = `conv-item ${conv.id === activeId ? 'active' : ''}`;

    el.innerHTML = `
      <div class="conv-avatar">
        ${conv.avatar
          ? `<img src="${conv.avatar}">`
          : conv.initials}
      </div>
      <div class="conv-info">
        <div class="conv-name">${conv.name}</div>
        <div class="conv-preview">${conv.preview}</div>
      </div>
      <div class="conv-meta">
        <span>${conv.time}</span>
        ${conv.unread ? `<span class="conv-unread">${conv.unread}</span>` : ''}
      </div>
    `;

    el.onclick = () => openConversation(conv.id);

    list.appendChild(el);
  });
}

// ─────────────────────────────────────────
// OPEN CONVERSATION
// ─────────────────────────────────────────
function openConversation(id) {
  activeId = id;

  const conv = conversations.find(c => c.id === id);
  if (!conv) return;

  // Marquer comme lu côté serveur (toujours, pas seulement si unread > 0)
  fetch('../../../api/mark-messages-read.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ other_id: id })
  }).catch(() => {});

  conv.unread = 0;
  renderConvList();

  document.getElementById('chatEmpty').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'flex';
  document.getElementById('chatInputBar').style.display = 'flex';

  loadMessageHistory(id);
}

// ─────────────────────────────────────────
// MESSAGE HISTORY
// ─────────────────────────────────────────
function loadMessageHistory(id) {
  socket?.emit('get_history', { otherUserId: id });
}

// ─────────────────────────────────────────
// RENDER MESSAGES
// ─────────────────────────────────────────
function renderMessages(id) {
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;

  const el = document.getElementById('chatMessages');
  el.innerHTML = '';

  conv.messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `msg-group ${msg.sent ? 'sent' : 'received'}`;

    div.innerHTML = `
      <div class="msg-bubble">${msg.text}</div>
      <div class="msg-time">${formatTime(msg.time)}</div>
    `;

    el.appendChild(div);
  });

  el.scrollTop = el.scrollHeight;
}

// ─────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();

  if (!text || !activeId || !socket) return;

  // Envoyer via socket
  socket.emit('send_message', {
    ID_Expediteur:   currentUser.id,
    ID_Destinataire: activeId,
    contenue:        text
  });

  // Optimistic render — afficher immédiatement sans attendre le serveur
  const conv = conversations.find(c => c.id === activeId);
  if (conv) {
    conv.messages.push({ text, time: new Date(), sent: true });
    conv.preview = text;
    conv.time    = formatTime(new Date());
  }

  renderMessages(activeId);
  renderConvList();

  input.value = '';

  // Recharger depuis le serveur après un court délai pour synchroniser
  setTimeout(() => {
    if (activeId) loadMessageHistory(activeId);
  }, 500);
}
// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function getInitials(n, p) {
  return ((n?.[0] || '') + (p?.[0] || '')).toUpperCase();
}

function formatTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


function showNotification(message, color = '#16376E') {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.innerText = message;
    notif.style.background = color; // 
    notif.style.display = 'flex';
    clearTimeout(notif._t);
    notif._t = setTimeout(() => { notif.style.display = 'none'; }, 3000); // 
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
        showNotification('Compte supprimé. Redirection...', '#16376E');
        setTimeout(() => {
            window.location.href = '../../html/signUp-user.html'; // 
        }, 2000);
    } else {
        showNotification('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'), '#b91c1c');
    }
});