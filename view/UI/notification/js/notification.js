/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
let notifications = [];
let activeFilter = 'all';

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
  setupFilters();
  setupMarkAll();
});

/* ─────────────────────────────────────────────
   FETCH FROM API
───────────────────────────────────────────── */
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
      ? `<img src="${n.photo_profil}" alt="${escapeHtml(n.title)}">`
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

updateUnreadCount();