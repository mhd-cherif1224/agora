
/* ── Data & state ── */
const ALL_TYPES = ['eval','follow','comment','mention','share','system'];
let activeFilter = 'all';
let ctxTargetId  = null;

/* ── Sparkline ── */
(function buildSparkline() {
  const vals = [3, 7, 2, 11, 5, 8, 14];
  const max  = Math.max(...vals);
  const wrap = document.getElementById('sparkline');
  vals.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'spark-bar' + (i === vals.length - 1 ? ' today' : '');
    bar.style.height = Math.round((v / max) * 100) + '%';
    bar.title = `${v} notification${v > 1 ? 's' : ''}`;
    wrap.appendChild(bar);
  });
})();

/* ── Update unread count ── */
function updateUnreadCount() {
  const unread = document.querySelectorAll('.notif-card.unread:not(.dismissing)').length;
  const badge  = document.getElementById('unreadBadge');
  const dot    = document.getElementById('navNotifDot');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? '' : 'none';
  dot.style.display   = unread > 0 ? '' : 'none';
}

/* ── Filter tabs ── */
document.getElementById('filterTabs').addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeFilter = tab.dataset.filter;

  let visibleCount = 0;
  document.querySelectorAll('.notif-card').forEach(card => {
    const type   = card.dataset.type;
    const match  = activeFilter === 'all' || type === activeFilter;
    card.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  // Section labels — hide if all cards in that section are hidden
  document.querySelectorAll('.section-label').forEach(label => {
    const section = label.dataset.section;
    // find following sibling cards until next section-label
    let next = label.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('section-label') && !next.classList.contains('empty-state')) {
      if (next.classList.contains('notif-card') && next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    label.style.display = hasVisible ? '' : 'none';
  });

  document.getElementById('emptyState').classList.toggle('visible', visibleCount === 0);
});

/* ── Mark all read ── */
document.getElementById('markAllBtn').addEventListener('click', () => {
  document.querySelectorAll('.notif-card.unread').forEach(card => {
    card.classList.remove('unread');
    card.classList.add('read');
    const dot = card.querySelector('.unread-dot');
    if (dot) dot.remove();
  });
  updateUnreadCount();
  showToast('Toutes les notifications sont marquées comme lues');
});

/* ── Mark individual card as read on click ── */
document.querySelectorAll('.notif-card').forEach(card => {
  card.addEventListener('click', e => {
    if (e.target.closest('.notif-menu-btn') || e.target.closest('.notif-btn') || e.target.closest('.ctx-menu')) return;
    if (card.classList.contains('unread')) {
      card.classList.remove('unread');
      card.classList.add('read');
      const dot = card.querySelector('.unread-dot');
      if (dot) dot.remove();
      updateUnreadCount();
    }
  });
});

/* ── Context menu ── */
const ctxMenu = document.getElementById('ctxMenu');

document.querySelectorAll('.notif-menu-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    ctxTargetId = btn.dataset.id;
    const rect  = btn.getBoundingClientRect();
    ctxMenu.style.top  = `${rect.bottom + window.scrollY + 4}px`;
    ctxMenu.style.left = `${rect.left + window.scrollX - 140}px`;
    ctxMenu.classList.add('open');
  });
});

document.addEventListener('click', e => {
  if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('open');
});

document.getElementById('ctxMarkRead').addEventListener('click', () => {
  const card = document.querySelector(`.notif-card[data-id="${ctxTargetId}"]`);
  if (card && card.classList.contains('unread')) {
    card.classList.remove('unread');
    card.classList.add('read');
    const dot = card.querySelector('.unread-dot');
    if (dot) dot.remove();
    updateUnreadCount();
    showToast('Notification marquée comme lue');
  }
  ctxMenu.classList.remove('open');
});

document.getElementById('ctxMute').addEventListener('click', () => {
  const card = document.querySelector(`.notif-card[data-id="${ctxTargetId}"]`);
  if (card) {
    const type  = card.dataset.type;
    showToast(`Notifications de type "${type}" désactivées`);
  }
  ctxMenu.classList.remove('open');
});

document.getElementById('ctxDelete').addEventListener('click', () => {
  const card = document.querySelector(`.notif-card[data-id="${ctxTargetId}"]`);
  if (card) {
    const wasUnread = card.classList.contains('unread');
    card.classList.add('dismissing');
    setTimeout(() => {
      card.remove();
      if (wasUnread) updateUnreadCount();
      checkEmpty();
    }, 300);
    showToast('Notification supprimée');
  }
  ctxMenu.classList.remove('open');
});

/* ── Follow / ignore buttons ── */
function handleFollow(btn) {
  btn.textContent = '✓ Suivi';
  btn.classList.remove('primary');
  btn.classList.add('secondary');
  btn.disabled = true;
  btn.style.opacity = '.6';
  const ignore = btn.closest('.notif-actions')?.querySelector('.notif-btn.secondary');
  if (ignore && ignore !== btn) ignore.remove();
  showToast('Vous suivez maintenant cet utilisateur');
}
function handleIgnore(btn) {
  const actions = btn.closest('.notif-actions');
  if (actions) actions.remove();
  showToast('Demande ignorée');
}

// ── chat.js ──
// Handles the floating chat panel open/close and message sending
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

  const botPanel   = document.getElementById('chatbotPanel');
  const botCloseBtn= document.getElementById('chatbotClose');
  const fabHelpBtn = document.getElementById('fabHelpBtn');
  const botInput   = document.getElementById('chatbotInput');
  const botSendBtn = document.getElementById('chatbotSend');
  const botMessages= document.getElementById('chatbotMessages');

  function openChat()  { panel.classList.add('active'); }
  function closeChat() { panel.classList.remove('active'); }

  function openBotChat() { botPanel.classList.add('active'); }
  function closeBotChat() { botPanel.classList.remove('active'); }

  if (fabChatBtn) fabChatBtn.addEventListener('click', openChat);
  if (navChatBtn) navChatBtn.addEventListener('click', openChat);
  if (closeBtn)   closeBtn.addEventListener('click', closeChat);

  if (fabHelpBtn) fabHelpBtn.addEventListener('click', openBotChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const msg = document.createElement('div');
    msg.className = 'chat-msg sent';
    msg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    `;
    messages.appendChild(msg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  }

  function sendBotMessage() {
    const text = botInput.value.trim();
    if (!text) return;

    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    `;
    botMessages.appendChild(userMsg);
    botInput.value = '';
    botMessages.scrollTop = botMessages.scrollHeight;

    // Get user ID from localStorage
    const userId = localStorage.getItem('utilisateur_id') || localStorage.getItem('admin_id') || 'anonymous';

    // Send to bot API
    fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: text,
        user_id: userId
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg received';
        botMsg.innerHTML = `
          <div class="msg-bubble">${escapeHtml(data.response)}</div>
          <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
        `;
        botMessages.appendChild(botMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      } else if (data.error) {
        console.error('Bot error:', data.error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'chat-msg received';
        errorMsg.innerHTML = `
          <div class="msg-bubble">Désolé, une erreur s'est produite.</div>
          <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
        `;
        botMessages.appendChild(errorMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'chat-msg received';
      errorMsg.innerHTML = `
        <div class="msg-bubble">Impossible de contacter l'assistant.</div>
        <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
      `;
      botMessages.appendChild(errorMsg);
      botMessages.scrollTop = botMessages.scrollHeight;
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input)   input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

});



/* ── Check for empty feed after deletions ── */
function checkEmpty() {
  const remaining = [...document.querySelectorAll('.notif-card')]
    .filter(c => c.style.display !== 'none' && !c.classList.contains('dismissing'));
  document.getElementById('emptyState').classList.toggle('visible', remaining.length === 0);
}

/* ── Toast ── */
function showToast(msg) {
  const toast   = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── Initial count ── */
updateUnreadCount();