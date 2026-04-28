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
    const res = await fetch('/Mini-Projet%20-%20Copy/api/get-profile.php');

    if (res.status === 401) {
      window.location.href = '/Mini-Projet - Copy/view/html/login.html';
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
      avatar: data.avatar
    };

    // NAV avatar
    const navImg = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');

    if (data.avatar) {
      navImg.src = data.avatar;
      navImg.style.display = 'block';
      navLetter.style.display = 'none';
    } else {
      navLetter.textContent = (data.prenom[0] + data.nom[0]).toUpperCase();
      navImg.style.display = 'none';
      navLetter.style.display = 'block';
    }

    initWebSocket();

  } catch (err) {
    console.error('Profile error:', err);
  }
}

// ─────────────────────────────────────────
// LOAD CONVERSATIONS (LEFT COLUMN)
// ─────────────────────────────────────────
async function loadConversations() {
  const list = document.getElementById('convList');
  list.innerHTML = 'Chargement...';

  try {
    const res = await fetch('/Mini-Projet%20-%20Copy/api/get-conversations.php');

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
      time: formatTime(u.last_message_time),
      unread: 0,
      avatar: u.photo_profil,
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

  socket.on('connect', () => console.log('WS connected'));

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
      loadMessageHistory(otherId);
    }
  });

  socket.on('conversation_history', ({ otherUserId, messages }) => {
    const conv = conversations.find(c => c.id === otherUserId);
    if (!conv) return;

    conv.messages = messages.map(m => ({
      text: m.contenue,
      time: m.DateEnvoie,
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

  const now = new Date();

  // 1. Emit to server
  socket.emit('send_message', {
    ID_Expediteur: currentUser.id,
    ID_Destinataire: activeId,
    contenue: text
  });

  // 2. UPDATE LOCAL STATE (this is what you're missing)
  const conv = conversations.find(c => c.id === activeId);
  if (conv) {
    const msgObj = {
      text: text,
      time: now,
      sent: true
    };

    conv.messages.push(msgObj);
    conv.preview = text;
    conv.time = formatTime(now);
  }

  // 3. Re-render immediately
  renderMessages(activeId);
  renderConvList();

  input.value = '';
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