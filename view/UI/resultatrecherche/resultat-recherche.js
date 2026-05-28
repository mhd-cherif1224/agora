const API_URL = '../../../api/get-search-result.php';

const params    = new URLSearchParams(window.location.search);
let currentQ    = params.get('q') || '';
let currentSort = 'recent';
let currentCat  = null;

window.setCategory = (encoded) => {
    currentCat = encoded ? decodeURIComponent(encoded) : null;
    fetchResults();
};

document.addEventListener('DOMContentLoaded', () => {

    const input = document.getElementById('navSearchInput');
    if (input) input.value = currentQ;

    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            fetchResults();
        });
    }

    fetchResults();
});

async function fetchResults() {

    document.querySelector('.feed').innerHTML =
        '<div style="padding:20px;color:#8c8580;">Chargement...</div>';
    document.querySelector('.people-carousel').innerHTML =
        '<div style="padding:20px;color:#8c8580;">Chargement...</div>';

    const url = `${API_URL}?q=${encodeURIComponent(currentQ)}&sort=${currentSort}`
              + (currentCat ? `&categorie=${encodeURIComponent(currentCat)}` : '');

    try {
        const res  = await fetch(url);
        const data = await res.json();

        if (!data.success) {
            document.querySelector('.feed').innerHTML =
                `<div style="padding:20px;color:red;">${data.message}</div>`;
            return;
        }

        const total = data.count.services + data.count.utilisateurs;
        document.querySelector('.results-count').textContent =
            `${total} résultat(s) pour "${currentQ}"`;

        renderPeopleCarousel(data.results.utilisateurs);
        renderServicesFeed(data.results.services);

    } catch (err) {
        document.querySelector('.feed').innerHTML =
            `<div style="padding:20px;color:red;">Erreur : ${err.message}</div>`;
    }
}

function renderPeopleCarousel(users) {
    const carousel = document.querySelector('.people-carousel');
    carousel.innerHTML = '';

    if (!users || users.length === 0) {
        carousel.innerHTML =
            '<div style="padding:16px;color:#8c8580;font-size:13px;">Aucun utilisateur trouvé</div>';
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
                    ? `<img src="../../../${u.photo_profil}"
                            style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                            onerror="this.parentElement.textContent='${initials}'">`
                    : initials}
            </div>
            <div class="people-name">${u.prenom} ${u.nom}</div>
            <div class="people-role">${u.specialite || u.niveau || 'Utilisateur'}</div>
            <button class="people-msg-btn"
                onclick="event.stopPropagation();
                         window.location.href='../profile/profile.html?id=${u.ID}'">
                envoyer un message
            </button>
        `;

        card.addEventListener('click', () => {
            window.location.href = `../../UI/profile/profile.html?id=${u.ID}`;
        });

        carousel.appendChild(card);
    });

    const voirPlus = document.createElement('div');
    voirPlus.className = 'voir-plus-card';
    voirPlus.innerHTML = `
        <div class="voir-plus-circle">
            <i class="fa-solid fa-arrow-right" style="font-size:16px;"></i>
        </div>
        <div class="voir-plus-label">Voir plus</div>
    `;
    carousel.appendChild(voirPlus);
}

function renderServicesFeed(services) {
    const feed = document.querySelector('.feed');
    feed.innerHTML = '';

    if (!services || services.length === 0) {
        feed.innerHTML =
            '<div style="padding:20px;color:#8c8580;">Aucun service trouvé</div>';
        return;
    }

    feed.innerHTML = services.map(s => createServiceCard(s)).join('');
}