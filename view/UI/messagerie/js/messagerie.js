// ── messagerie.js ──

const conversations = [
  {
    id: 1,
    name: 'benzian ahmed',
    preview: 'slt!',
    time: '09:14',
    unread: 2,
    online: true,
    gradient: 'linear-gradient(135deg,#1d4ed8,#60a5fa)',
    initials: 'BA',
    messages: [
      { from: 'them', text: 'slt!', time: '09:14' },
    ]
  },
  {
    id: 2,
    name: 'elhankalis slimane',
    preview: 'Bonjour monsieur, je vous envoye ce message afin...',
    time: '08:52',
    unread: 0,
    online: false,
    gradient: 'linear-gradient(135deg,#0f766e,#2dd4bf)',
    initials: 'ES',
    messages: [
      { from: 'them', text: 'Bonjour monsieur, je vous envoye ce message afin de vous proposer une collaboration sur mon projet.', time: '08:52' },
      { from: 'me',   text: 'Bonjour ! Avec plaisir, pouvez-vous me donner plus de détails ?', time: '08:55' },
    ]
  },
  {
    id: 3,
    name: 'alqayrawan abdellah',
    preview: 'a demain.',
    time: 'Hier',
    unread: 0,
    online: true,
    gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    initials: 'AA',
    messages: [
      { from: 'me',   text: 'Tu seras disponible demain pour la réunion ?', time: 'Hier 17:00' },
      { from: 'them', text: 'a demain.', time: 'Hier 17:12' },
    ]
  },
  {
    id: 4,
    name: 'elhashas didouch',
    preview: 'il est important ce message...',
    time: 'Hier',
    unread: 1,
    online: false,
    gradient: 'linear-gradient(135deg,#b45309,#fbbf24)',
    initials: 'ED',
    messages: [
      { from: 'them', text: 'il est important ce message, merci de le lire attentivement.', time: 'Hier 14:30' },
    ]
  },
  {
    id: 5,
    name: 'elhankalis slimane',
    preview: 'repondez sur mon email svp',
    time: 'Lun',
    unread: 0,
    online: false,
    gradient: 'linear-gradient(135deg,#0f766e,#2dd4bf)',
    initials: 'ES',
    messages: [
      { from: 'them', text: 'repondez sur mon email svp', time: 'Lun 10:00' },
    ]
  },
  {
    id: 6,
    name: 'alqayrawan abdellah',
    preview: 'URGENT!!!',
    time: 'Lun',
    unread: 3,
    online: true,
    gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    initials: 'AA',
    messages: [
      { from: 'them', text: 'URGENT!!! appelle moi dès que possible.', time: 'Lun 08:00' },
    ]
  },
  {
    id: 7,
    name: 'mehdi cherif',
    preview: 'je cherche un dev web freelance',
    time: 'Dim',
    unread: 0,
    online: true,
    gradient: 'linear-gradient(135deg,#e44,#f97316)',
    initials: 'MC',
    messages: [
      { from: 'them', text: 'Bonjour, je cherche un développeur web freelance pour mon projet.', time: 'Dim 15:00' },
      { from: 'me',   text: 'Bonjour ! Je suis disponible, quel est votre projet ?', time: 'Dim 15:10' },
      { from: 'them', text: 'Un site e-commerce, budget 50k DA.', time: 'Dim 15:12' },
    ]
  }
];

let activeId = null;

// ── Build conversation list ──
function renderConvList() {
  const list = document.getElementById('convList');
  list.innerHTML = '';
  const q = document.getElementById('convSearch').value.toLowerCase();

  conversations
    .filter(c => c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
    .forEach(conv => {
      const item = document.createElement('div');
      item.className = `conv-item${conv.unread ? ' unread' : ''}${conv.id === activeId ? ' active' : ''}`;
      item.dataset.id = conv.id;

      item.innerHTML = `
        <div class="conv-avatar" style="background:${conv.gradient}">
          ${conv.initials}
          ${conv.online ? '<div class="conv-online-ring"></div>' : ''}
        </div>
        <div class="conv-info">
          <div class="conv-name">${conv.name}</div>
          <div class="conv-preview">${conv.preview}</div>
        </div>
        <div class="conv-meta">
          <span class="conv-time">${conv.time}</span>
          ${conv.unread ? `<span class="conv-badge">${conv.unread}</span>` : ''}
        </div>
      `;

      item.addEventListener('click', () => openConversation(conv.id));
      list.appendChild(item);
    });
}

// ── Open a conversation ──
function openConversation(id) {
  activeId = id;
  const conv = conversations.find(c => c.id === id);

  // Mark read
  conv.unread = 0;

  // Update list highlight
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  const activeEl = document.querySelector(`.conv-item[data-id="${id}"]`);
  if (activeEl) {
    activeEl.classList.add('active');
    activeEl.classList.remove('unread');
    const badge = activeEl.querySelector('.conv-badge');
    if (badge) badge.remove();
    const nameEl = activeEl.querySelector('.conv-name');
    if (nameEl) nameEl.style.color = '';
    const previewEl = activeEl.querySelector('.conv-preview');
    if (previewEl) { previewEl.style.color = ''; previewEl.style.fontWeight = ''; }
  }

  // Show header
  const header = document.getElementById('chatHeader');
  header.classList.add('visible');
  header.querySelector('.chat-header-avatar').style.background = conv.gradient;
  header.querySelector('.chat-header-avatar').textContent = conv.initials;
  header.querySelector('.chat-header-name').textContent = conv.name;
  header.querySelector('.chat-header-status').innerHTML =
    conv.online
      ? '<span class="status-dot"></span> En ligne'
      : '<span style="width:7px;height:7px;border-radius:50%;background:var(--color-muted);display:inline-block;"></span> Hors ligne';

  // Hide empty state
  document.getElementById('chatEmpty').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'flex';
  document.getElementById('chatInputBar').style.display = 'flex';

  // Render messages
  renderMessages(conv);

  // Mobile: show chat panel
  document.querySelector('.msg-layout').classList.add('chat-open');
}

// ── Render messages ──
function renderMessages(conv) {
  const area = document.getElementById('chatMessages');
  area.innerHTML = '';

  // Date divider
  const divider = document.createElement('div');
  divider.className = 'msg-date-divider';
  divider.textContent = "Aujourd'hui";
  area.appendChild(divider);

  conv.messages.forEach(msg => {
    const group = document.createElement('div');
    group.className = `msg-group ${msg.from === 'me' ? 'sent' : 'received'}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = msg.text;

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = msg.time;

    group.appendChild(bubble);
    group.appendChild(time);
    area.appendChild(group);
  });

  area.scrollTop = area.scrollHeight;
}

// ── Send message ──
function sendMessage() {
  const input = document.getElementById('msgInput');
  const text  = input.value.trim();
  if (!text || !activeId) return;

  const conv = conversations.find(c => c.id === activeId);
  const now  = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  conv.messages.push({ from: 'me', text, time });
  conv.preview = text;
  conv.time    = time;

  input.value = '';
  renderMessages(conv);
  renderConvList();

  // Re-select active item
  setTimeout(() => {
    const el = document.querySelector(`.conv-item[data-id="${activeId}"]`);
    if (el) el.classList.add('active');
  }, 10);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  renderConvList();

  document.getElementById('convSearch').addEventListener('input', renderConvList);

  const msgInput = document.getElementById('msgInput');
  const sendBtn  = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
});
