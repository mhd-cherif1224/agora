// ── feed.js ──
let socket = []

document.addEventListener("DOMContentLoaded", async () => {

    const sortSelect = document.querySelector(".sort-select");

    // Catégorie active (null = toutes)
    let activeCategory = null;

    // Exposer setCategory globalement (appelé depuis les onclick des pills)
    window.setCategory = async (encoded) => {
        activeCategory = encoded ? decodeURIComponent(encoded) : null;
        await loadServices(sortSelect.value, activeCategory);
    };

    sortSelect.addEventListener("change", async () => {
        await loadServices(sortSelect.value, activeCategory);
    });

    await loadUserProfile();

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
                avatar: data.avatar
            };

            const navImg      = document.getElementById('navAvatarImg');
            const navLetter   = document.getElementById('navAvatarLetter');
            const composetImg = document.querySelector("#composerAvatar");

            if (data.avatar) {
                navImg.src             = buildPhotoUrl(data.avatar);
                navImg.style.display   = 'block';
                navLetter.style.display = 'none';
                composetImg.src        = buildPhotoUrl(data.avatar);
                composetImg.style.display = 'block';
            } else {
                navLetter.textContent     = (data.prenom[0] + data.nom[0]).toUpperCase();
                navImg.style.display      = 'none';
                navLetter.style.display   = 'block';
                composetImg.textContent   = (data.prenom[0] + data.nom[0]).toUpperCase();
                composetImg.style.display = 'block';
            }

        } catch (err) {
            console.error('Profile error:', err);
        }
    }

    await loadServices(sortSelect.value, activeCategory);

    async function loadServices(sort = "recent", cat = null) {
        try {
            // ── Fetch services (avec filtre si cat actif) ──
            const url = new URL('../../../api/get-services.php', window.location.href);
            url.searchParams.set('sort', sort);
            if (cat) url.searchParams.set('cat', cat);
            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                console.error(data.message);
                return;
            }

            // ── Pills de catégories (toujours toutes les catégories dispo) ──
            const allUrl = new URL('../../../api/get-services.php', window.location.href);
            allUrl.searchParams.set('sort', sort);
            const allRes  = await fetch(allUrl);
            const allData = await allRes.json();

            const allCategories = [...new Set(
                (allData.services || []).flatMap(s =>
                    s.categorie ? s.categorie.split(",").map(c => c.trim()) : []
                )
            )];

            const filterContainer = document.querySelector(".categories-filter");
            if (filterContainer) {
                filterContainer.innerHTML =
                    `<span class="categorie-pill ${!cat ? 'active' : ''}"
                           onclick="setCategory(null)">Toutes</span>` +
                    allCategories.map(c => `
                        <span class="categorie-pill ${cat === c ? 'active' : ''}"
                              onclick="setCategory('${encodeURIComponent(c)}')">
                            ${c}
                        </span>
                    `).join("");
            }

            // ── Remplir le feed ──
            const feed = document.querySelector(".feed");
            feed.innerHTML = data.services
                .map(service => createServiceCard(service))
                .join("");

        } catch (error) {
            console.error("Error:", error);
        }
    }


    function createServiceCard(service) {

        const initials = (service.nom?.charAt(0) || "") + (service.prenom?.charAt(0) || "");

        const profileImage = service.photo_profil
            ? `../../../${service.photo_profil}`
            : null;

        const serviceImage = service.service_photo
            ? `../../../${service.service_photo}`
            : null;

        const categories = service.categorie
            ? service.categorie.split(",")
            : [];

        const timeAgo = getTimeAgo(service.DateDePublication);

        return `
<article class="post-card" data-service-id="${service.ID}">

    <div class="post-header">
        <div class="post-avatar">
            <img src="${profileImage}"
                 style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
        </div>
        <div class="post-meta">
            <div class="post-name">${service.nom} ${service.prenom}</div>
            <div class="post-time-row">
                <span class="post-time">${timeAgo}</span>
            </div>
        </div>
    </div>

    <div class="post-title">${service.titre}</div>

    <div class="post-tags">
        <span class="post-tag">
            ${categories.map(cat => `
                <span class="category-pill green" style="cursor:pointer"
                      onclick="window.location.href='../categorie-services/categorie-services.html?cat=${encodeURIComponent(cat.trim())}'">
                    ${cat.trim()}
                </span>
            `).join("")}
        </span>
    </div>

    <div class="post-body">
        ${service.description}
        <br>
        prix : ${service.prix} DZD
    </div>

    <div class="post-body">${service.status}</div>

    ${serviceImage ? `<img class="post-image" src="${serviceImage}">` : ""}

    <div class="post-rating-summary">
        <div class="rating-stars-display">${generateStars(service.note_moyenne)}</div>
        <span class="rating-score">${service.note_moyenne}</span>
        <span class="rating-count">(${service.nb_avis} évaluations)</span>
    </div>

    <div class="post-actions">
        <button class="post-action-btn" data-action="rate">
            <i class="fa-regular fa-star"></i> Évaluer
        </button>
    </div>

    <div class="rating-panel" hidden>
        <div class="rating-panel-inner">
            <p class="rating-panel-label">Votre évaluation</p>
            <div class="star-picker">
                <i class="fa-regular fa-star" data-star="1"></i>
                <i class="fa-regular fa-star" data-star="2"></i>
                <i class="fa-regular fa-star" data-star="3"></i>
                <i class="fa-regular fa-star" data-star="4"></i>
                <i class="fa-regular fa-star" data-star="5"></i>
            </div>
            <textarea class="rating-comment-input" placeholder="Commentaire..."></textarea>
            <div class="rating-panel-actions">
                <button class="rating-cancel-btn">Annuler</button>
                <button class="rating-submit-btn">Soumettre</button>
            </div>
        </div>
    </div>

    <div class="comments-list" hidden></div>

</article>`;
    }


    // ── Events du feed ──
    document.querySelector('.feed').addEventListener('click', (e) => {

        if (e.target.closest('.post-action-btn[data-action="rate"]')) {
            const card = e.target.closest('.post-card');
            const panel = card.querySelector('.rating-panel');
            const commentsList = card.querySelector('.comments-list');
            const isOpen = !panel.hidden;
            panel.hidden = isOpen;
            if (!isOpen && !commentsList.hidden) commentsList.hidden = true;
            return;
        }

        if (e.target.closest('.post-action-btn[data-action="comment"]')) {
            const card = e.target.closest('.post-card');
            const commentsList = card.querySelector('.comments-list');
            const panel = card.querySelector('.rating-panel');
            commentsList.hidden = !commentsList.hidden;
            if (!commentsList.hidden && !panel.hidden) panel.hidden = true;
            return;
        }

        if (e.target.closest('.star-picker')) {
            const star = e.target.closest('[data-star]');
            if (!star) return;
            const picker = star.closest('.star-picker');
            const val = parseInt(star.dataset.star);
            picker.dataset.selected = val;
            renderPickerStars(picker, val);
            return;
        }

        if (e.target.closest('.rating-cancel-btn')) {
            const card = e.target.closest('.post-card');
            closeRatingPanel(card);
            return;
        }

        if (e.target.closest('.rating-submit-btn')) {
            const card = e.target.closest('.post-card');
            submitRating(card);
            return;
        }
    });

    document.querySelector('.feed').addEventListener('mouseover', (e) => {
        const star = e.target.closest('.star-picker [data-star]');
        if (!star) return;
        const picker = star.closest('.star-picker');
        renderPickerStars(picker, parseInt(star.dataset.star), true);
    });

    document.querySelector('.feed').addEventListener('mouseout', (e) => {
        const star = e.target.closest('.star-picker [data-star]');
        if (!star) return;
        const picker = star.closest('.star-picker');
        renderPickerStars(picker, parseInt(picker.dataset.selected || 0));
    });

});


// ── Fonctions utilitaires ──

function getTimeAgo(dateString) {
    const now = new Date();
    const diffMs = now - new Date(dateString);
    const minutes = Math.floor(diffMs / 60000);
    const hours   = Math.floor(diffMs / 3600000);
    const days    = Math.floor(diffMs / 86400000);
    const months  = Math.floor(days / 30);
    const years   = Math.floor(months / 12);

    if (minutes < 60)  return `il y a ${minutes} min`;
    if (hours < 24)    return `il y a ${hours} h`;
    if (days < 30)     return `il y a ${days} jours`;
    if (months < 12)   return `il y a ${months} mois`;
    return `il y a ${years} an(s)`;
}

function generateStars(note) {
    note = parseFloat(note);
    const full = Math.floor(note);
    return Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < full ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
    ).join('');
}

async function refreshService(serviceId) {
    try {
        const response = await fetch(`../../../api/get-single-service.php?id=${serviceId}`);
        const data = await response.json();
        if (!data.success) return;
        const oldCard = document.querySelector(`[data-service-id="${serviceId}"]`);
        if (oldCard) oldCard.outerHTML = createServiceCard(data.service);
    } catch (error) {
        console.error(error);
    }
}

function renderPickerStars(picker, upTo, isHover = false) {
    picker.querySelectorAll('[data-star]').forEach(s => {
        const n = parseInt(s.dataset.star);
        s.className = n <= upTo
            ? (isHover ? 'fa-regular fa-star hovered' : 'fa-solid fa-star selected')
            : 'fa-regular fa-star';
    });
}

function closeRatingPanel(card) {
    const panel    = card.querySelector('.rating-panel');
    const picker   = card.querySelector('.star-picker');
    const textarea = card.querySelector('.rating-comment-input');
    panel.hidden = true;
    picker.dataset.selected = 0;
    renderPickerStars(picker, 0);
    textarea.value = '';
}

function submitRating(card) {
    const picker   = card.querySelector('.star-picker');
    const textarea = card.querySelector('.rating-comment-input');
    const note     = parseInt(picker.dataset.selected || 0);

    if (note === 0) {
        textarea.placeholder = '⚠ Choisissez une note avant de soumettre...';
        textarea.classList.add('input-error');
        setTimeout(() => {
            textarea.placeholder = 'Laissez un commentaire (optionnel)...';
            textarea.classList.remove('input-error');
        }, 2000);
        return;
    }

    const commentaire = textarea.value.trim();
    const dateEval    = new Date().toLocaleDateString('fr-FR');
    const serviceId   = card.dataset.serviceId;

    const evaluation = {
        note,
        commentaire: commentaire || null,
        DateEval: dateEval,
        ID_Utilisateur: currentUser.id,
        ID_Service: serviceId
    };

    console.log('Évaluation soumise :', evaluation);

    const commentsList = card.querySelector('.comments-list');
    if (commentaire) {
        commentsList.appendChild(buildCommentItem('Moi', note, commentaire, dateEval));
        commentsList.hidden = false;
    }

    updateRatingSummary(card, note);
    closeRatingPanel(card);

    const rateBtn = card.querySelector('.post-action-btn[data-action="rate"]');
    rateBtn.classList.add('rated');
    rateBtn.innerHTML = `<i class="fa-solid fa-star"></i> Évalué`;
}

function buildCommentItem(name, note, text, date) {
    const item = document.createElement('div');
    item.className = 'comment-item';
    const initials  = name.slice(0, 2).toUpperCase();
    const starsHtml = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < note ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
    ).join('');
    item.innerHTML = `
        <div class="comment-avatar" style="background:linear-gradient(135deg,#4b48ec,#7299f4);">${initials}</div>
        <div class="comment-body">
            <div class="comment-header">
                <span class="comment-name">${name}</span>
                <div class="comment-stars">${starsHtml}</div>
                <span class="comment-date">${date}</span>
            </div>
            <p class="comment-text">${text}</p>
        </div>`;
    return item;
}

function updateRatingSummary(card, newNote) {
    const summary  = card.querySelector('.post-rating-summary');
    const scoreEl  = summary.querySelector('.rating-score');
    const countEl  = summary.querySelector('.rating-count');
    const starsEl  = summary.querySelector('.rating-stars-display');
    const oldScore = parseFloat(scoreEl.textContent);
    const oldCount = parseInt(countEl.textContent.match(/\d+/)[0]);
    const newCount = oldCount + 1;
    const rounded  = Math.round(((oldScore * oldCount) + newNote) / newCount * 10) / 10;

    scoreEl.textContent = rounded.toFixed(1);
    countEl.textContent = `(${newCount} évaluations)`;

    const full = Math.floor(rounded);
    const half = rounded - full >= 0.5;
    starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
        if (i < full) return '<i class="fa-solid fa-star"></i>';
        if (i === full && half) return '<i class="fa-solid fa-star-half-stroke"></i>';
        return '<i class="fa-regular fa-star"></i>';
    }).join('');
}