const API_URL = '../../../api/get-search-result.php';

const params       = new URLSearchParams(window.location.search);
let currentQ       = params.get('q') || '';
let currentSort    = 'date';
let currentOrder   = 'DESC';
let currentCat     = '0';

document.addEventListener('DOMContentLoaded', () => {

  // Afficher la query dans l'input et le titre
  const input = document.getElementById('navSearchInput');
  if (input) input.value = currentQ;

  // Sync le select de tri existant
  const sortSelect = document.querySelector('.sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value === 'popular' ? 'id' : 'date';
      fetchResults();
    });
  }

  fetchResults();
});

async function fetchResults() {

  // Vider le feed et le carousel
  document.querySelector('.feed').innerHTML        = '<div style="padding:20px;color:#8c8580;">Chargement...</div>';
  document.querySelector('.people-carousel').innerHTML = '<div style="padding:20px;color:#8c8580;">Chargement...</div>';

  // Mettre à jour le titre
  document.querySelector('.results-title').textContent = 'Les publications trouvées';

  const url = `${API_URL}?q=${encodeURIComponent(currentQ)}&sort=${currentSort}&order=${currentOrder}&categorie=${currentCat}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      document.querySelector('.feed').innerHTML = `<div style="padding:20px;color:red;">${data.message}</div>`;
      return;
    }

    // Mettre à jour le compteur
    const total = data.count.services + data.count.utilisateurs;
    document.querySelector('.results-count').textContent =
      `${total} résultat(s) pour "${currentQ}"`;

    // Render
    renderPeopleCarousel(data.results.utilisateurs);
    renderServicesFeed(data.results.services);

  } catch (err) {
    document.querySelector('.feed').innerHTML =
      `<div style="padding:20px;color:red;">Erreur : ${err.message}</div>`;
  }
}

/* ══ CAROUSEL UTILISATEURS ══ */
function renderPeopleCarousel(users) {
  const carousel = document.querySelector('.people-carousel');
  carousel.innerHTML = '';

  if (users.length === 0) {
    carousel.innerHTML = '<div style="padding:16px;color:#8c8580;font-size:13px;">Aucun utilisateur trouvé</div>';
    return;
  }

  users.forEach(u => {
    const initials = (u.prenom[0] + u.nom[0]).toUpperCase();
    const card = document.createElement('div');
    card.className = 'people-card';
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="people-avatar">
        ${u.photo_profil
          ? `<img src="../../../${u.photo_profil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${initials}'">`
          : initials}
      </div>
      <div class="people-name">${u.prenom} ${u.nom}</div>
      <div class="people-role">${u.specialite || u.niveau || 'Utilisateur'}</div>
      <button class="people-msg-btn" onclick="event.stopPropagation();window.location.href='../messagerie/messagerie.html?id=${u.ID}'">
        envoyer un message
      </button>
    `;

    card.addEventListener('click', () => {
      window.location.href = `../../UI/profile/profile.html?id=${u.ID}`;
    });

    carousel.appendChild(card);
  });

  // Bouton "Voir plus" à la fin
  const voirPlus = document.createElement('div');
  voirPlus.className = 'voir-plus-card';
  voirPlus.innerHTML = `
    <div class="voir-plus-circle"><i class="fa-solid fa-arrow-right" style="font-size:16px;"></i></div>
    <div class="voir-plus-label">Voir plus</div>
  `;
  carousel.appendChild(voirPlus);
}

/* ══ FEED SERVICES ══ */
function renderServicesFeed(services) {
    const feed = document.querySelector('.feed');
    feed.innerHTML = '';

    if (services.length === 0) {
        feed.innerHTML = '<div style="padding:20px;color:#8c8580;">Aucun service trouvé</div>';
        return;
    }

    services.forEach(s => {
        // Normaliser les champs pour correspondre à ce qu'attend createServiceCard
        const normalized = {
            ID:               s.ID,
            titre:            s.titre,
            description:      s.description || '',
            prix:             s.prix,
            status:           s.status,
            DateDePublication: s.DateDePublication,
            nom:              s.utilisateur_nom,
            prenom:           s.utilisateur_prenom,
            photo_profil:     s.photo_profil,
            service_photo:    s.photo_service,
            categorie:        (s.categories || []).join(','),
            note_moyenne:     s.Evaluation_Moyenne || 0,
            nb_avis:          s.nb_avis || 0,
            ID_Utilisateur:   s.ID_Utilisateur
        };

        feed.innerHTML += createServiceCard(normalized);
    });
}


function generateStars(note) {
  note = parseFloat(note) || 0;
  const full = Math.floor(note);
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += i < full
      ? '<i class="fa-solid fa-star"></i>'
      : '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

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
        showNotification('Compte supprimé. Redirection...');
        setTimeout(() => { window.location.href = '../../html/signUp-user.html'; }, 2000);
    } else {
        showNotification('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'));
    }
});