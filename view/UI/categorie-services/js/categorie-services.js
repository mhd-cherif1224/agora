//categorie-services.js
// ── Utilitaires ──
let currentUser = {};

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}

// ── Barre de recherche nav ──
const navSearchInput = document.querySelector('.nav-search input');
const navSearchIcon  = document.querySelector('.nav-search svg');

function doSearch() {
    const query = navSearchInput?.value.trim();
    if (!query) return;
    window.location.href = `../resultatrecherche/resultat-recherche.html?q=${encodeURIComponent(query)}`;
}

if (navSearchInput) {
    navSearchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') doSearch();
    });
}
if (navSearchIcon) {
    navSearchIcon.addEventListener('click', doSearch);
    navSearchIcon.style.cursor = 'pointer';
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

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(
        dateString.includes('Z') || dateString.includes('+')
            ? dateString
            : dateString.replace(' ', 'T') + 'Z'
    );
    const diffMs = now - date;
    const minutes = Math.floor(diffMs / 60000);
    const hours   = Math.floor(diffMs / 3600000);
    const days    = Math.floor(diffMs / 86400000);
    const months  = Math.floor(days / 30);
    const years   = Math.floor(months / 12);

    if (minutes < 1)   return `à l'instant`;
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

// ════════════════════════════════════════
// BUILD COMMENT ITEM  ← au niveau global
// ════════════════════════════════════════
function buildCommentItem(name, note, text, date, photoProfile) {
    const item = document.createElement('div');
    item.className = 'comment-item';
    const initials  = name.slice(0, 2).toUpperCase();
    const starsHtml = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < note ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
    ).join('');
    const avatarHtml = photoProfile
        ? `<img src="../../../${photoProfile}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : initials;
    item.innerHTML = `
        <div class="comment-avatar" style="${photoProfile ? '' : 'background:linear-gradient(135deg,#4b48ec,#7299f4);'}">
            ${avatarHtml}
        </div>
        <div class="comment-body">
            <div class="comment-header">
                <span class="comment-name">${name}</span>
                <div class="comment-stars">${starsHtml}</div>
                <span class="comment-date">${date}</span>
            </div>
            ${text ? `<p class="comment-text">${text}</p>` : ''}
        </div>`;
    return item;
}

function createServiceCard(service) {

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

    // Prix
    let prixAffiche = service.prix + ' DZD';
    const match = service.description.match(/\[prix_texte:(.+?)\]/);
    if (match) {
        prixAffiche = match[1];
        service.description = service.description.replace(/\[prix_texte:.+?\]/, '').trim();
    }

    // Status
    const statusConfig = {
        'disponible': { color: '#16a34a', bg: '#eaf5ee', border: '#bbf7d0', icon: 'fa-circle-check', label: 'Disponible' },
        'en cours':   { color: '#d97706', bg: '#fef9c3', border: '#fde68a', icon: 'fa-circle-half-stroke', label: 'En cours' },
        'terminé':    { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'fa-circle-xmark', label: 'Terminé' }
    };
    const st = statusConfig[service.status] || statusConfig['disponible'];

    return `
<article class="post-card" data-service-id="${service.ID}" data-owner-id="${service.ID_Utilisateur || service.utilisateur_id || service.user_id || ''}">

    <div class="post-header post-owner" data-owner-id="${service.ID_Utilisateur || service.utilisateur_id || service.user_id || ''}" style="cursor:${currentUser.id == (service.ID_Utilisateur || service.utilisateur_id || service.user_id) ? 'default' : 'pointer'}">
        <div class="post-avatar">
            <img src="${profileImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
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
        ${categories.map(cat => `
            <span class="category-pill green" style="cursor:pointer"
                onclick="window.location.href='../categorie-services/categorie-services.html?cat=${encodeURIComponent(cat.trim())}'">
                ${cat.trim()}
            </span>
        `).join("")}
    </div>

    <div class="post-body">
        ${service.description.replace(/\n/g, '<br>')}
        <br>
        prix : ${prixAffiche}
    </div>

    <span style="display:inline-block;margin:0 18px 10px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;font-family:'Space Grotesk',sans-serif;background:${st.bg};color:${st.color};">
        <i class="fa-solid fa-circle" style="font-size:7px;margin-right:4px;"></i>${st.label}
    </span>

    ${serviceImage ? `<img class="post-image" src="${serviceImage}">` : ""}

    <div class="post-rating-summary">
        <div class="rating-stars-display">${generateStars(service.note_moyenne)}</div>
        <span class="rating-score">${service.note_moyenne}</span>
        <span class="rating-count">(${service.nb_avis} évaluations)</span>
    </div>

    <div class="post-actions">
        ${currentUser.id !== (service.ID_Utilisateur || service.utilisateur_id || service.user_id) ? `
        <button class="post-action-btn" data-action="rate">
            <i class="fa-regular fa-star"></i> Évaluer
        </button>
        ` : ''}
        <button class="post-action-btn" data-action="comment">
            <i class="fa-regular fa-comment"></i> Commentaires
            <span class="comments-count-badge" style="
                background:rgba(75,72,236,0.15);
                color:#4b48ec;
                font-size:10px;
                font-weight:700;
                padding:1px 6px;
                border-radius:10px;
                margin-left:4px;
            ">${service.nb_avis || 0}</span>
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

    <div class="comments-list" hidden data-loaded="false"></div>

</article>`;
}

// ── Page catégorie ──

document.addEventListener("DOMContentLoaded", async () => {

    const params          = new URLSearchParams(window.location.search);
    const initialCategory = params.get("cat");
    const categorySelect  = document.getElementById("categorySelect");
    const sortSelect      = document.getElementById("sortSelect");

    const icons = {
        "Sport":           "⚽",
        "Musique":         "🎵",
        "Informatique":    "💻",
        "Cuisine":         "🍳",
        "Art":             "🎨",
        "Education":       "📚",
        "Médecine":        "🩺",
        "Santé":           "💊",
        "Aide aux cours":  "✏️",
        "Tuteur":          "🎓",
        "Langues":         "🌍",
        "Mathématiques":   "📐",
        "Physique":        "⚛️",
        "Chimie":          "🧪",
        "Histoire":        "🏛️",
        "Droit":           "⚖️",
        "Comptabilité":    "🧾",
        "Finance":         "💰",
        "Marketing":       "📣",
        "Design":          "🎨",
        "Photographie":    "📷",
        "Vidéo":           "🎬",
        "Rédaction":       "✍️",
        "Traduction":      "🔤",
        "Jardinage":       "🌱",
        "Bricolage":       "🔧",
        "Électricité":     "⚡",
        "Plomberie":       "🚿",
        "Nettoyage":       "🧹",
        "Garde d'enfants": "👶",
        "Coiffure":        "💇",
        "Beauté":          "💄",
        "Fitness":         "🏋️",
        "Yoga":            "🧘",
        "Livraison":       "🚚",
        "Transport":       "🚗",
        "Vétérinaire":     "🐾",
        "Psychologie":     "🧠",
        "Architecture":    "🏗️",
        "Couture":         "🧵",
    };

    await loadUserProfile();

    async function loadUserProfile() {
        try {
            const res = await fetch('../../../api/get-profile.php');

            if (res.status === 401) {
                window.location.href = '../../view/html/login-user.html';
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

            const navImg    = document.getElementById('navAvatarImg');
            const navLetter = document.getElementById('navAvatarLetter');

            if (data.avatar) {
                navImg.src              = buildPhotoUrl(data.avatar);
                navImg.style.display    = 'block';
                navLetter.style.display = 'none';
            } else {
                navLetter.textContent   = (data.prenom[0] + data.nom[0]).toUpperCase();
                navImg.style.display    = 'none';
                navLetter.style.display = 'block';
            }

        } catch (err) {
            console.error('Profile error:', err);
        }
    }

    function updateCategoryHeader(selectedCategory) {
        document.getElementById("pageTitle").textContent =
            selectedCategory || "Tous les services";
        document.getElementById("categoryIcon").textContent =
            icons[selectedCategory] || "🏷️";
    }

    categorySelect.addEventListener("change", () => {
        const selected = categorySelect.value;
        const url = new URL(window.location.href);
        if (selected) {
            url.searchParams.set("cat", selected);
        } else {
            url.searchParams.delete("cat");
        }
        window.history.replaceState(null, "", url);
        updateCategoryHeader(selected);
        loadServices(sortSelect.value, selected);
    });

    sortSelect.addEventListener("change", () => {
        const cat = categorySelect.value || initialCategory || null;
        loadServices(sortSelect.value, cat);
    });

    await loadCategories(initialCategory);
    updateCategoryHeader(initialCategory);
    await loadServices(sortSelect.value, initialCategory);

    async function loadCategories(selectedCategory = "") {
        try {
            const response = await fetch('../../../api/get-all-categories.php');
            if (response.status === 401) {
                window.location.href = '../../view/html/login-user.html';
                return;
            }

            const data = await response.json();
            if (!data.success || !Array.isArray(data.data)) {
                throw new Error('Invalid categories response');
            }

            categorySelect.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Toutes les catégories';
            categorySelect.appendChild(defaultOption);

            data.data.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.titre;
                option.textContent = cat.titre;
                categorySelect.appendChild(option);
            });

            if (selectedCategory && data.data.some(cat => cat.titre === selectedCategory)) {
                categorySelect.value = selectedCategory;
            } else {
                categorySelect.value = '';
            }
        } catch (err) {
            console.error('Categories error:', err);
        }
    }

    async function loadServices(sort = "recent", category = undefined) {
        const container = document.getElementById("servicesContainer");
        const currentCategory = (category !== undefined && category !== null)
            ? category
            : categorySelect.value || initialCategory;

        container.innerHTML = `
            <div class="posts-header">
                <h3>${currentCategory ? `Services — ${currentCategory}` : "Tous les services"}</h3>
            </div>
        `;

        try {
            let url = "../../../api/get-services.php?sort=" + sort;
            if (currentCategory) {
                url += "&categorie=" + encodeURIComponent(currentCategory);
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (!data.success || data.services.length === 0) {
                container.innerHTML += `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <p>Aucun service trouvé pour cette catégorie.</p>
                    </div>
                `;
                document.getElementById("postsCount").textContent = "0 service";
                return;
            }

            document.getElementById("postsCount").textContent =
                `${data.services.length} service${data.services.length > 1 ? "s" : ""}`;

            container.innerHTML += data.services
                .map(service => createServiceCard(service))
                .join("");

            attachRatingEvents(container);

        } catch (err) {
            console.error("Erreur:", err);
            container.innerHTML += `
                <p style="color:var(--color-muted);padding:20px;text-align:center">
                    Erreur de chargement.
                </p>
            `;
        }
    }

});


// ── Attacher les événements rating sur un conteneur ──
function attachRatingEvents(container) {

    container.addEventListener('click', async (e) => {

        const ownerClick = e.target.closest('.post-owner');
        if (ownerClick) {
            const userId = ownerClick.dataset.ownerId;
            if (userId && userId != currentUser.id) {
                window.location.href = '../profile/profile.html?id=' + encodeURIComponent(userId);
            }
            return;
        }

        if (e.target.closest('.post-action-btn[data-action="rate"]')) {
            const card  = e.target.closest('.post-card');
            const panel = card.querySelector('.rating-panel');
            const commentsList = card.querySelector('.comments-list');
            panel.hidden = !panel.hidden;
            if (!panel.hidden && !commentsList.hidden) commentsList.hidden = true;
            return;
        }

        if (e.target.closest('.post-action-btn[data-action="comment"]')) {
            const card         = e.target.closest('.post-card');
            const commentsList = card.querySelector('.comments-list');
            const panel        = card.querySelector('.rating-panel');

            const isOpen = !commentsList.hidden;
            if (!panel.hidden) panel.hidden = true;

            if (isOpen) {
                commentsList.hidden = true;
                return;
            }

            if (commentsList.dataset.loaded === 'false') {
                commentsList.dataset.loaded = 'loading';
                commentsList.hidden = false;
                commentsList.innerHTML = `
                    <div style="padding:14px 18px;color:#8c8580;font-size:12px;
                                font-family:'Space Grotesk',sans-serif;display:flex;
                                align-items:center;gap:8px;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Chargement des avis...
                    </div>`;

                const serviceId = card.dataset.serviceId;
                try {
                    const res  = await fetch(`../../../api/get-ratings.php?service_id=${serviceId}`);
                    const data = await res.json();
                    commentsList.innerHTML = '';

                    if (!data.success || !data.ratings || data.ratings.length === 0) {
                        commentsList.innerHTML = `
                            <div style="padding:14px 18px;color:#8c8580;font-size:12px;
                                        font-family:'Space Grotesk',sans-serif;text-align:center;">
                                <i class="fa-regular fa-comment-dots" style="font-size:20px;display:block;margin-bottom:6px;"></i>
                                Aucun avis pour l'instant
                            </div>`;
                    } else {
                        data.ratings.forEach(r => {
                            const dateStr = new Date(r.DateEval).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric'
                            });
                            commentsList.appendChild(
                                buildCommentItem(
                                    `${r.prenom} ${r.nom}`,
                                    parseInt(r.note),
                                    r.commentaire || '',
                                    dateStr,
                                    r.photo_profil
                                )
                            );
                        });
                    }
                    commentsList.dataset.loaded = 'true';

                    if (data.userEval) {
                        const picker   = card.querySelector('.star-picker');
                        const textarea = card.querySelector('.rating-comment-input');
                        const rateBtn  = card.querySelector('.post-action-btn[data-action="rate"]');

                        // Pré-remplir les étoiles
                        if (picker) {
                            picker.dataset.selected = data.userEval.note;
                            renderPickerStars(picker, parseInt(data.userEval.note));
                        }
                        // Pré-remplir le commentaire
                        if (textarea) {
                            textarea.value = data.userEval.commentaire || '';
                        }
                        // Changer le libellé du bouton
                        if (rateBtn) {
                            rateBtn.classList.add('rated');
                            rateBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`;
                        }
                    }
                } catch (err) {
                    console.error(err);
                    commentsList.innerHTML = `
                        <div style="padding:14px 18px;color:#ef4444;font-size:12px;
                                    font-family:'Space Grotesk',sans-serif;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement
                        </div>`;
                    commentsList.dataset.loaded = 'false';
                }
            } else {
                commentsList.hidden = false;
            }
            return;
        }

        if (e.target.closest('.star-picker')) {
            const star = e.target.closest('[data-star]');
            if (!star) return;
            const picker = star.closest('.star-picker');
            picker.dataset.selected = star.dataset.star;
            renderPickerStars(picker, parseInt(star.dataset.star));
            return;
        }

        if (e.target.closest('.rating-cancel-btn')) {
            closeRatingPanel(e.target.closest('.post-card'));
            return;
        }

        if (e.target.closest('.rating-submit-btn')) {
            submitRating(e.target.closest('.post-card'));
            return;
        }
    });

    container.addEventListener('mouseover', (e) => {
        const star = e.target.closest('.star-picker [data-star]');
        if (!star) return;
        renderPickerStars(star.closest('.star-picker'), parseInt(star.dataset.star), true);
    });

    container.addEventListener('mouseout', (e) => {
        const star = e.target.closest('.star-picker [data-star]');
        if (!star) return;
        const picker = star.closest('.star-picker');
        renderPickerStars(picker, parseInt(picker.dataset.selected || 0));
    });
}


// ── Helpers rating ──

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

async function submitRating(card) {
    const picker   = card.querySelector('.star-picker');
    const textarea = card.querySelector('.rating-comment-input');
    const note     = parseInt(picker.dataset.selected || 0);

    if (note === 0) {
        textarea.placeholder = '⚠ Choisissez une note avant de soumettre...';
        textarea.classList.add('input-error');
        setTimeout(() => {
            textarea.placeholder = 'Commentaire...';
            textarea.classList.remove('input-error');
        }, 2000);
        return;
    }

    const commentaire = textarea.value.trim();
    const dateEval    = new Date().toLocaleDateString('fr-FR');
    const serviceId   = card.dataset.serviceId;

    const payload = {
        note,
        commentaire: commentaire || null,
        DateEval: dateEval,
        ID_Service: serviceId
    };

    try {
        const response = await fetch('../../../api/submit-rating.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Erreur lors de la soumission');
        }

        updateRatingSummary(card, note);
        closeRatingPanel(card);

        // Réinitialiser le cache pour forcer un rechargement
        const commentsList = card.querySelector('.comments-list');
        commentsList.dataset.loaded = 'false';
        commentsList.innerHTML = '';
        commentsList.hidden = true;

        const rateBtn = card.querySelector('.post-action-btn[data-action="rate"]');
        if (rateBtn) {
            rateBtn.classList.add('rated');
            rateBtn.innerHTML = result.updated
                ? `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`
                : `<i class="fa-solid fa-star"></i> Évalué`;
        }

        showNotification(
            result.updated ? 'Évaluation mise à jour !' : 'Évaluation soumise avec succès !',
            '#16a34a'
        );

    } catch (err) {
        console.error('Erreur lors de la soumission :', err);
        textarea.placeholder = '⚠ Erreur lors de la soumission...';
        textarea.classList.add('input-error');
        setTimeout(() => {
            textarea.placeholder = 'Commentaire...';
            textarea.classList.remove('input-error');
        }, 2000);
    }
}

function updateRatingSummary(card, newNote) {
    const summary = card.querySelector('.post-rating-summary');
    if (!summary) return;
    const scoreEl  = summary.querySelector('.rating-score');
    const countEl  = summary.querySelector('.rating-count');
    const starsEl  = summary.querySelector('.rating-stars-display');
    const oldScore = parseFloat(scoreEl.textContent) || 0;
    const oldCount = parseInt(countEl.textContent.match(/\d+/)?.[0] || '0');
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

// ── Nav dropdown (menu burger) ──
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
            window.location.href = '../../html/signUp-user.html';
        }, 2000);
    } else {
        showNotification('Erreur : ' + (data.message || 'Impossible de supprimer le compte.'), '#b91c1c');
    }
});