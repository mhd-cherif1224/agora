// ── sidebar.js ──
// Handles follow button toggle in the suggestions sidebar

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleFollow(btn));
  });

});

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}


function toggleFollow(btn) {
  const isFollowing = btn.classList.toggle('following');
  btn.textContent = isFollowing ? '✓ Suivi' : '+ Suivre';
}

const seeAllBtn       = document.getElementById('seeAllBtn');
const listPreview     = document.getElementById('suggestListPreview');
const listAll         = document.getElementById('suggestListAll');
let showingAll        = false;

// seeAllBtn.addEventListener('click', e => {
//     e.preventDefault();
//     showingAll = !showingAll;
//     if (showingAll) {
//         listPreview.style.display = 'none';
//         listAll.style.display     = 'flex';
//         seeAllBtn.textContent     = '← réduire les suggestions';
//     } else {
//         listAll.style.display     = 'none';
//         listPreview.style.display = 'flex';
//         seeAllBtn.textContent     = 'voir tous les suggestions →';
//     }
// });

const PREVIEW_COUNT = 4;

async function loadAllUsers() {
  const list = document.getElementById('usersList');
  if (!list) return;

  list.innerHTML = 'Chargement...';

  try {
    const res = await fetch('../../../api/get-all-users.php');
    if (!res.ok) { list.innerHTML = 'Erreur serveur: ' + res.status; return; }

    const users = await res.json();
    if (!Array.isArray(users)) { list.innerHTML = 'Données invalides'; return; }

    list.innerHTML = '';

    // Build all items
    const items = users.map((user, i) => {
      const item = document.createElement('div');
      item.className = 'suggest-item';
      if (i >= PREVIEW_COUNT) item.classList.add('suggest-item--hidden');

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'suggest-avatar';

      if (user.photo_profil) {
        const img = document.createElement('img');
        img.src = buildPhotoUrl(user.photo_profil);
        img.alt = user.prenom;
        img.onerror = () => {
          avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
          avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
        avatarDiv.style.background = 'linear-gradient(135deg,#6366f1,#4338ca)';
      }

      const infoDiv = document.createElement('div');
      infoDiv.className = 'suggest-info';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      nameDiv.textContent = `${user.prenom} ${user.nom}`;

      const roleDiv = document.createElement('div');
      roleDiv.className = 'role';
      roleDiv.textContent = user.specialite || user.niveau || user.role || 'Utilisateur';

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(roleDiv);
      item.appendChild(avatarDiv);
      item.appendChild(infoDiv);

      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        window.location.href = `../../UI/profile/profile.html?id=${user.ID}`;
      });

      list.appendChild(item);
      return item;
    });

    // Toggle button — only if there are more than PREVIEW_COUNT users
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
        toggleBtn.innerHTML = expanded
          ? `<i class="fa-solid fa-chevron-up"></i>`
          : `<i class="fa-solid fa-chevron-down"></i>`;
        toggleBtn.title = expanded ? 'Réduire' : 'Voir plus';
      });

      list.appendChild(toggleBtn);
    }

  } catch (err) {
    console.error('Fetch error:', err);
    list.innerHTML = 'Erreur connexion: ' + err.message;
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadAllUsers);
// Also call immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllUsers);
} else {
  loadAllUsers();
}

