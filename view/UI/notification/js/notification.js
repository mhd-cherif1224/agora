/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let notifications = [];
let activeFilter  = 'all';
let sparkChart    = null;

let currentUser = { id: null, nom: '', prenom: '', avatar: null };
let socket      = null;
let lastConv    = null;

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  loadNotifications();
  setupFilters();
  setupMarkAll();
});

/* ══════════════════════════════════════════
   USER PROFILE
══════════════════════════════════════════ */
async function loadUserProfile() {
  try {
    const res = await fetch('../../../api/get-profile.php');
    if (res.status === 401) { window.location.href = '/Mini-Projet/view/html/login.html'; return; }
    const data = await res.json();
    if (!data.success || !data.id) return;

    currentUser = { id: data.id, nom: data.nom, prenom: data.prenom, avatar: buildPhotoUrl(data.avatar) };

    const navImg    = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');

    if (data.avatar) {
      navImg.src = buildPhotoUrl(data.avatar);
      navImg.style.display    = 'block';
      navLetter.style.display = 'none';
    } else {
      navLetter.textContent   = ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase();
      navImg.style.display    = 'none';
      navLetter.style.display = 'block';
    }

    initWebSocket();
  } catch (err) { console.warn('loadUserProfile:', err); }
}

/* ══════════════════════════════════════════
   LOAD NOTIFICATIONS
══════════════════════════════════════════ */
async function loadNotifications() {
  try {
    const res  = await fetch('../../../api/get-notifications.php');
    const data = await res.json();
    if (!data.success) throw new Error('API error');

    notifications = data.notifications;

    renderNotifications();
    updateUnreadCount(data.unread_count);
    updateSummaryStats(data.stats_today, data.totals);
    renderSparkline(data.stats_week);

  } catch (err) {
    console.error('❌ Load error:', err);
  }
}

/* ══════════════════════════════════════════
   RENDER NOTIFICATIONS
══════════════════════════════════════════ */
function renderNotifications() {
  document.querySelectorAll('.notif-card').forEach(el => el.remove());
  document.querySelectorAll('.section-label').forEach(el => el.style.display = 'none');

  const container  = document.querySelector('.main-col');
  const todayLabel = document.querySelector('[data-section="today"]');
  const weekLabel  = document.querySelector('[data-section="week"]');
  const todayStr   = new Date().toDateString();

  const filtered = notifications.filter(n =>
    activeFilter === 'all' || n.type === activeFilter
  );

  let hasToday = false, hasWeek = false;

  filtered.forEach(n => {
    const isToday = new Date(n.created_at).toDateString() === todayStr;
    if (isToday) hasToday = true; else hasWeek = true;

    const card = document.createElement('div');
    card.className = `notif-card ${n.is_read ? 'read' : 'unread'}`;
    card.dataset.id   = n.ID;
    card.dataset.dbId = n.db_id;
    card.dataset.type = n.type;

    const avatarHtml = n.photo_profil
      ? `<img src="${buildPhotoUrl(n.photo_profil)}" alt="${escapeHtml(n.title)}">`
      : `<span>${getInitials(n.title)}</span>`;

    // Corps selon le type
    let bodyContent = '';

    if (n.type === 'eval') {
      bodyContent = `
        <div class="notif-text">
          <strong>${escapeHtml(n.title)}</strong> a laissé une évaluation
        </div>
        ${renderStars(n.note)}`;
    } else if (n.type === 'comment') {
      bodyContent = `
        <div class="notif-text">
          <strong>${escapeHtml(n.title)}</strong> a laissé un commentaire
        </div>
        <div class="notif-preview">"${escapeHtml(n.message)}"</div>`;
    }

    card.innerHTML = `
      <div class="notif-inner">
        <div class="notif-avatar-wrap">
          <div class="notif-avatar">${avatarHtml}</div>
          <div class="notif-type-icon ${n.type}">${getIcon(n.type)}</div>
        </div>
        <div class="notif-body">
          ${bodyContent}
          <div class="notif-time">
            <i class="fa-regular fa-clock"></i> ${formatTime(n.created_at)}
          </div>
        </div>
        <div class="notif-aside">
          ${!n.is_read ? '<div class="unread-dot"></div>' : ''}
          <button class="notif-menu-btn" title="Options">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
      </div>`;

    card.addEventListener('click', e => {
      if (!e.target.closest('.notif-menu-btn')) markAsRead(n, card);
    });

    container.appendChild(card);
  });

  if (todayLabel) todayLabel.style.display = hasToday ? '' : 'none';
  if (weekLabel)  weekLabel.style.display  = hasWeek  ? '' : 'none';

  checkEmpty(filtered.length === 0);
}

/* ══════════════════════════════════════════
   SUMMARY STATS
══════════════════════════════════════════ */
function updateSummaryStats(today, totals) {
  const evalEl  = document.getElementById('statEval');
  const cmtEl   = document.getElementById('statComment');
  const evalTot = document.getElementById('statEvalTotal');
  const cmtTot  = document.getElementById('statCommentTotal');

  if (evalEl)  evalEl.textContent  = today?.evals    ?? 0;
  if (cmtEl)   cmtEl.textContent   = today?.comments ?? 0;
  if (evalTot && totals) evalTot.textContent = `/ ${totals.evals} total`;
  if (cmtTot  && totals) cmtTot.textContent  = `/ ${totals.comments} total`;
}

/* ══════════════════════════════════════════
   SPARKLINE — Chart.js grouped bar
══════════════════════════════════════════ */
function renderSparkline(weekData) {
  const canvas = document.getElementById('sparklineCanvas');
  if (!canvas || typeof Chart === 'undefined') return;

  const days   = [];
  const labels = [];
  const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
    labels.push(i === 0 ? 'Auj.' : dayNames[d.getDay()]);
  }

  const evalsByDay    = {};
  const commentsByDay = {};
  (weekData || []).forEach(r => {
    evalsByDay[r.jour]    = r.evals;
    commentsByDay[r.jour] = r.comments;
  });

  const evalsArr    = days.map(d => evalsByDay[d]    || 0);
  const commentsArr = days.map(d => commentsByDay[d] || 0);

  if (sparkChart) { sparkChart.destroy(); sparkChart = null; }

  sparkChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Évaluations',
          data: evalsArr,
          backgroundColor: 'rgba(75,72,236,0.85)',
          hoverBackgroundColor: '#7299f4',
          borderRadius: 5,
          borderSkipped: false,
          barPercentage: 0.72,
        },
        {
          label: 'Commentaires',
          data: commentsArr,
          backgroundColor: 'rgba(52,211,153,0.75)',
          hoverBackgroundColor: '#34d399',
          borderRadius: 5,
          borderSkipped: false,
          barPercentage: 0.72,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,13,20,0.95)',
          borderColor: 'rgba(75,72,236,0.35)',
          borderWidth: 1,
          titleColor: '#f1f0f5',
          bodyColor: '#8b8a99',
          padding: 10,
          callbacks: {
            label: item => ` ${item.dataset.label} : ${item.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#8b8a99', font: { size: 10, family: "'DM Sans', sans-serif" } }
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            stepSize: 1,
            color: '#8b8a99',
            font: { size: 10, family: "'DM Sans', sans-serif" },
            callback: v => Number.isInteger(v) ? v : ''
          }
        }
      }
    }
  });
}

/* ══════════════════════════════════════════
   FILTERS
══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   MARK AS READ — utilise db_id pour l'API
══════════════════════════════════════════ */
function markAsRead(notif, card) {
  if (card.classList.contains('read')) return;
  card.classList.replace('unread', 'read');
  card.querySelector('.unread-dot')?.remove();

  // Marquer les deux entrées (eval + comment du même db_id) comme lues en mémoire
  notifications.forEach(n => {
    if (n.db_id === notif.db_id) n.is_read = true;
  });

  // Un seul appel API avec le vrai ID de la BDD
  fetch('../../../api/mark-notification-read.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: notif.db_id })
  });

  // Marquer aussi visuellement la carte sœur (eval ↔ comment du même enregistrement)
  const sisterId = notif.type === 'eval'
    ? notif.db_id + '_comment'
    : notif.db_id + '_eval';

  document.querySelector(`.notif-card[data-id="${sisterId}"]`)
    ?.classList.replace('unread', 'read');
  document.querySelector(`.notif-card[data-id="${sisterId}"] .unread-dot`)?.remove();

  updateUnreadCount();
}

/* ══════════════════════════════════════════
   MARK ALL
══════════════════════════════════════════ */
function setupMarkAll() {
  document.getElementById('markAllBtn').addEventListener('click', () => {
    document.querySelectorAll('.notif-card.unread').forEach(card => {
      card.classList.replace('unread', 'read');
      card.querySelector('.unread-dot')?.remove();
    });
    notifications.forEach(n => n.is_read = true);
    fetch('../../../api/mark-all-notification-read.php', { method: 'POST' });
    updateUnreadCount(0);
    showToast('Toutes les notifications sont marquées comme lues');
  });
}

/* ══════════════════════════════════════════
   UNREAD COUNT
══════════════════════════════════════════ */
function updateUnreadCount(force = null) {
  const unread = force !== null
    ? force
    : document.querySelectorAll('.notif-card.unread').length;

  const badge = document.getElementById('unreadBadge');
  const dot   = document.querySelector('.nav-icon-btn.active .notif-dot');

  if (badge) { badge.textContent = unread; badge.style.display = unread ? '' : 'none'; }
  if (dot)   dot.style.display = unread ? '' : 'none';
}

/* ══════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════ */
function checkEmpty(isEmpty) {
  document.getElementById('emptyState')?.classList.toggle('visible', isEmpty);
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function showToast(msg) {
  const toast = document.getElementById('toast');
  const span  = document.getElementById('toastMsg');
  if (!toast || !span) return;
  span.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function renderStars(note) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= note
      ? '<i class="fa-solid fa-star"></i>'
      : '<i class="fa-regular fa-star"></i>';
  }
  return `<div class="notif-stars">${stars}<span>${note}/5</span></div>`;
}

function getInitials(text) {
  if (!text) return '?';
  const parts = text.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : text.slice(0, 2).toUpperCase();
}

function getIcon(type) {
  switch (type) {
    case 'eval':    return '<i class="fa-solid fa-star"></i>';
    case 'comment': return '<i class="fa-solid fa-comment"></i>';
    default:        return '<i class="fa-solid fa-bell"></i>';
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(
    dateStr.includes('Z') || dateStr.includes('+')
      ? dateStr
      : dateStr.replace(' ', 'T') + 'Z'
  );
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════
   CHAT PANEL + CHATBOT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  const panel      = document.getElementById('chatPanel');
  const closeBtn   = document.getElementById('chatClose');
  const fabChatBtn = document.getElementById('fabMsgBtn');
  const input      = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSend');
  const messages   = document.getElementById('chatMessages');

  const botPanel    = document.getElementById('chatbotPanel');
  const botCloseBtn = document.getElementById('chatbotClose');
  const botInput    = document.getElementById('chatbotInput');
  const botSendBtn  = document.getElementById('chatbotSend');
  const botMessages = document.getElementById('chatbotMessages');
  const fabHelpBtn  = document.getElementById('fabHelpBtn');

  fabChatBtn?.addEventListener('click',  () => panel?.classList.add('active'));
  closeBtn?.addEventListener('click',    () => panel?.classList.remove('active'));
  fabHelpBtn?.addEventListener('click',  () => botPanel?.classList.add('active'));
  botCloseBtn?.addEventListener('click', () => botPanel?.classList.remove('active'));

  loadLastConversation();

  function scrollToBottom(el) { if (el) el.scrollTop = el.scrollHeight; }

  function initWebSocket() {
    if (!currentUser?.id || !lastConv || socket) return;
    socket = io('http://localhost:3000', { query: { userId: currentUser.id } });
    socket.on('connect', () => socket.emit('get_history', { otherUserId: lastConv.id }));
    socket.on('conversation_history', ({ otherUserId, messages: msgs }) => {
      if (!lastConv || otherUserId !== lastConv.id) return;
      lastConv.messages = msgs.map(m => ({
        text: m.contenue, time: m.DateEnvoie,
        sent: m.ID_Expediteur === currentUser.id
      }));
      renderMessages();
    });
    socket.on(`msg_${currentUser.id}`, msg => {
      if (!lastConv) return;
      const other = msg.ID_Expediteur === currentUser.id ? msg.ID_Destinataire : msg.ID_Expediteur;
      if (other !== lastConv.id) return;
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
    scrollToBottom(messages);
  }

  async function loadLastConversation() {
    try {
      const res  = await fetch('../../../api/get-conversations.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;
      const u = data[0];
      lastConv = {
        id: u.ID, name: `${u.prenom} ${u.nom}`,
        avatar: buildPhotoUrl(u.photo_profil) || null,
        initials: ((u.nom?.[0] || '') + (u.prenom?.[0] || '')).toUpperCase(),
        gradient: randomGradient(u.ID), messages: []
      };
      const nameEl   = panel?.querySelector('.chat-panel-name');
      const avatarEl = panel?.querySelector('.chat-panel-avatar');
      if (nameEl) nameEl.textContent = lastConv.name;
      if (avatarEl) {
        if (lastConv.avatar) {
          avatarEl.innerHTML = `<img src="${lastConv.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          avatarEl.style.background = 'none';
        } else {
          avatarEl.textContent = lastConv.initials;
          avatarEl.style.background = lastConv.gradient;
        }
      }
      initWebSocket();
    } catch (err) { console.warn('loadLastConversation:', err); }
  }

  function randomGradient(seed) {
    const g = ['linear-gradient(135deg,#e44,#f97316)','linear-gradient(135deg,#059669,#34d399)',
      'linear-gradient(135deg,#7c3aed,#a78bfa)','linear-gradient(135deg,#0ea5e9,#38bdf8)',
      'linear-gradient(135deg,#db2777,#f472b6)'];
    return g[(seed || 0) % g.length];
  }

  function sendMessage() {
    const text = input?.value.trim();
    if (!text) return;
    const div = document.createElement('div');
    div.className = 'chat-msg sent';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    messages?.appendChild(div);
    input.value = '';
    scrollToBottom(messages);
    if (socket && lastConv && currentUser) {
      socket.emit('send_message', { ID_Expediteur: currentUser.id, ID_Destinataire: lastConv.id, contenue: text });
    }
  }

  async function sendBotMessage() {
    const text = botInput?.value.trim();
    if (!text) return;
    const div = document.createElement('div');
    div.className = 'chat-msg sent';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    botMessages?.appendChild(div);
    botInput.value = '';
    scrollToBottom(botMessages);
    try {
      const r    = await fetch('http://localhost:5000/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, user_id: currentUser?.id || 'anonymous' }) });
      const data = await r.json();
      appendBotReply(data.response || "Désolé, une erreur s'est produite.");
    } catch { appendBotReply("Impossible de contacter l'assistant."); }
  }

  function appendBotReply(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg received';
    div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="msg-time">${formatTime(new Date().toISOString())}</span>`;
    botMessages?.appendChild(div);
    scrollToBottom(botMessages);
  }

  sendBtn?.addEventListener('click', sendMessage);
  input?.addEventListener('keydown',   e => { if (e.key === 'Enter') sendMessage(); });
  botSendBtn?.addEventListener('click', sendBotMessage);
  botInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });
});


// ════════════════════════════════════════
// NOTIFICATIONS TOAST
// ════════════════════════════════════════
function showNotification(message, color = '#16376E') {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.innerText = message;
    notif.style.background = color; 
    notif.style.display = 'flex';
    clearTimeout(notif._t);
    notif._t = setTimeout(() => { notif.style.display = 'none'; }, 3000); 
}

// ── Nav dropdown ──
const navMenuBtn  = document.getElementById('navMenuBtn');
const navDropdown = document.getElementById('navDropdown');

navMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navDropdown.hidden = !navDropdown.hidden;
});

document.addEventListener('click', () => {
    navDropdown.hidden = true;
});

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
        showNotification('Compte supprimé. Redirection...', '#16376E');
        setTimeout(() => {
            window.location.href = '../../html/signUp-user.html'; // 
        }, 2000);
    } else {
        showNotification('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'), '#b91c1c');
    }
});