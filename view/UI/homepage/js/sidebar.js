// ── sidebar.js ──
// Handles follow button toggle in the suggestions sidebar

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleFollow(btn));
  });

});

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

async function loadAllUsers() {
  const list = document.getElementById('usersList');
  if (!list) {
    console.warn('usersList container not found');
    return;
  }

  list.innerHTML = 'Chargement...';

  try {
    const res = await fetch('/Mini-Projet%20-%20Copy/api/get-all-users.php');
    console.log('Fetch response status:', res.status);

    if (!res.ok) {
      list.innerHTML = 'Erreur serveur: ' + res.status;
      return;
    }

    const users = await res.json();
    console.log('Users loaded:', users);

    if (!Array.isArray(users)) {
      list.innerHTML = 'Données invalides';
      console.error('Expected array, got:', users);
      return;
    }

    list.innerHTML = '';

    users.forEach(user => {
      const item = document.createElement('div');
      item.className = 'suggest-item';

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'suggest-avatar';

      if (user.photo_profil) {
        const img = document.createElement('img');
        img.src = user.photo_profil;
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

      // Make clickable to view profile
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
  window.location.href = `../../UI/profile/profile.html?id=${user.ID}`;
});

      list.appendChild(item);
    });

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

