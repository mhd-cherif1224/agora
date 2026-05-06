/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
let notifications = [];
let activeFilter = 'all';

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
  return `../../../${path}`;
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  loadNotifications();
  setupFilters();
  setupMarkAll();
});

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
        avatar:  buildPhotoUrl(data.avatar)
      };
    } catch (err) {
      console.warn('chat.js: could not load profile', err);
    }
  }


async function loadNotifications() {
  try {
    const res = await fetch('../../../api/get-notifications.php');
    const data = await res.json();

    if (!data.success) throw new Error('API error');

    notifications = data.notifications;

    renderNotifications();
    updateUnreadCount(data.unread_count);

  } catch (err) {
    console.error('❌ Load error:', err);
  }
}

/* ─────────────────────────────────────────────
   RENDER
───────────────────────────────────────────── */
function renderNotifications() {
  const container = document.querySelector('.main-col');
  
  // remove old cards (keep header + filters)
  document.querySelectorAll('.notif-card').forEach(el => el.remove());

  notifications.forEach(n => {
    if (activeFilter !== 'all' && n.type !== activeFilter) return;

    const card = document.createElement('div');
    card.className = `notif-card ${n.is_read ? 'read' : 'unread'}`;
    card.dataset.type = n.type;
    card.dataset.id = n.ID;

    card.innerHTML = `
  <div class="notif-inner">
    <div class="notif-avatar-wrap">
      <div class="notif-avatar">${
    n.photo_profil
      ? `<img src="${ buildPhotoUrl(n.photo_profil)}" alt="${escapeHtml(n.title)}">`
      : getInitials(n.title)
  }</div>
      <div class="notif-type-icon ${n.type}">
        ${getIcon(n.type)}
      </div>
    </div>

    <div class="notif-body">
      <div class="notif-text">
        <strong>${escapeHtml(n.title)}</strong> a laissé une évaluation
      </div>

      ${renderStars(n.note)}

      <div class="notif-preview">
        "${escapeHtml(n.message || '')}"
      </div>

      <div class="notif-time">
        ${formatTime(n.created_at)}
      </div>
    </div>

    <div class="notif-aside">
      <button class="notif-menu-btn" data-id="${n.ID}">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>
    </div>
  </div>
`;

    // click → mark as read
    card.addEventListener('click', () => markAsRead(n.ID, card));

    container.appendChild(card);
  });

  checkEmpty();
}

/* ─────────────────────────────────────────────
   FILTERS
───────────────────────────────────────────── */
function setupFilters() {
  document.getElementById('filterTabs').addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;

    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    activeFilter = tab.dataset.filter;
    renderNotifications();
  });
}

/* ─────────────────────────────────────────────
   MARK AS READ
───────────────────────────────────────────── */
function markAsRead(id, card) {
  if (card.classList.contains('read')) return;

  card.classList.remove('unread');
  card.classList.add('read');

  // update state
  const notif = notifications.find(n => n.ID == id);
  if (notif) notif.is_read = true;

  fetch('../../../api/mark-notification-read.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });

  updateUnreadCount();
}

/* ─────────────────────────────────────────────
   MARK ALL
───────────────────────────────────────────── */
function setupMarkAll() {
  document.getElementById('markAllBtn').addEventListener('click', () => {

    document.querySelectorAll('.notif-card.unread').forEach(card => {
      card.classList.remove('unread');
      card.classList.add('read');
    });

    fetch('../../../api/mark-all-notification-read.php', { method: 'POST' });

    updateUnreadCount(0);
  });
}
//stars
function renderStars(note) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= note
      ? '<i class="fa-solid fa-star"></i>'
      : '<i class="fa-regular fa-star"></i>';
  }
  return `<div class="notif-stars">${stars} <span>${note}/5</span></div>`;
}

/* ─────────────────────────────────────────────
   UNREAD COUNT
───────────────────────────────────────────── */
function updateUnreadCount(force = null) {
  let unread;

  if (force !== null) {
    unread = force;
  } else {
    unread = document.querySelectorAll('.notif-card.unread').length;
  }

  const badge = document.getElementById('unreadBadge');
  const dot   = document.querySelector('.nav-icon-btn.active .notif-dot');

  badge.textContent = unread;
  badge.style.display = unread ? '' : 'none';

  if (dot) dot.style.display = unread ? '' : 'none';
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(text) {
  return text ? text.slice(0, 2).toUpperCase() : '?';
}

function getIcon(type) {
  switch (type) {
    case 'eval': return '<i class="fa-solid fa-star"></i>';
    case 'comment': return '<i class="fa-solid fa-comment"></i>';
    default: return '<i class="fa-solid fa-bell"></i>';
  }
}


function formatTime(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;

  if (diff < 60) return 'à l’instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;

  return d.toLocaleDateString('fr-FR');
}

function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function checkEmpty() {
  const empty = document.getElementById('emptyState');
  const hasItems = document.querySelectorAll('.notif-card').length > 0;
  empty.classList.toggle('visible', !hasItems);
}


// ════════════════════════════════════════
// CHAT PANEL + CHATBOT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  const panel      = document.getElementById('chatPanel');
  const closeBtn   = document.getElementById('chatClose');
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

  
/* ─────────────────────────────────────────────
   FETCH FROM API
───────────────────────────────────────────── */
 
  //scroll to bottom of chat func
  function scrollToBottom() {
  if (!messages) return;
  messages.scrollTop = messages.scrollHeight;
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
        avatar:    buildPhotoUrl(u.photo_profil) || null,
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
    const panel      = document.getElementById('chatPanel');
    const nameEl   = panel.querySelector('.chat-panel-name');
    const avatarEl = panel.querySelector('.chat-panel-avatar');

    if (nameEl) nameEl.textContent = lastConv.name;

    if (avatarEl) {
      if (lastConv.avatar) {
        avatarEl.innerHTML = `<img src="${ lastConv.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        avatarEl.style.background = 'none';
      } else {
        avatarEl.textContent = lastConv.initials;
        avatarEl.style.background = lastConv.gradient;
      }
    }
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


  


async function loadUserProfile() {
  try {
    const res = await fetch('../../../api/get-profile.php');

    if (res.status === 401) {
      window.location.href = '/Mini-Projet/view/html/login.html';
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
      avatar : buildPhotoUrl(data.avatar)
    };

    // NAV avatar
    const navImg = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');

    if (data.avatar) {
      navImg.src =  buildPhotoUrl(data.avatar);
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

  
});


updateUnreadCount();