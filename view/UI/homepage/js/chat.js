// ── chat.js ──
// Handles the floating chat panel open/close and message sending

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
  if (navChatBtn) navChatBtn.addEventListener('click', openChat);
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
      const res  = await fetch('/Mini-Projet%20-%20Copy/api/get-profile.php');
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
      const res  = await fetch('/Mini-Projet%20-%20Copy/api/get-conversations.php');
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
        avatarEl.innerHTML = `<img src="${lastConv.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
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


socket.on('conversation_history', (data) => {
  console.log('HISTORY RECEIVED:', data); // 👈 add this
});