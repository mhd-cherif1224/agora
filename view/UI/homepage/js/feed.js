// ── feed.js ──
let socket = []
let currentUser = {}

document.addEventListener("DOMContentLoaded", async () => {

    const sortSelect = document.querySelector(".sort-select");

    // Catégorie active (null = toutes)
    let activeCategory = null;

    // Exposer setCategory globalement (appelé depuis les onclick des pills)
    if (!window.IS_SEARCH_PAGE) {
        window.setCategory = async (encoded) => {
            activeCategory = encoded ? decodeURIComponent(encoded) : null;
            await loadServices(sortSelect.value, activeCategory);
        };
    }

    

    sortSelect.addEventListener("change", async () => {
        if (window.IS_SEARCH_PAGE) return; // ← la page recherche gère son propre tri
        await loadServices(sortSelect.value, activeCategory);
    });

    await loadUserProfile();

    async function loadUserProfile() {
        try {
            const res = await fetch('../../../api/get-profile.php');

            if (res.status === 401) {
                window.location.href = '../../html/login-user.html';
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
                avatar: data.avatar,
                role: data.role
            };

            const navImg      = document.getElementById('navAvatarImg');
            const navLetter   = document.getElementById('navAvatarLetter');
            const composetImg = document.querySelector("#composerAvatar");
            const composerCard = document.querySelector(".composer-card");

            // ── Hide composer for Chercheur users ──
            if (data.status === 'Chercheur' && composerCard) {
                composerCard.style.display = 'none';
            }

            console.log("le role,",data.status )

            if (data.avatar) {
              navImg.src              = buildPhotoUrl(data.avatar);
              navImg.style.display    = 'block';
              navLetter.style.display = 'none';
           if (composetImg) {                                   // ← guard ajouté
              composetImg.src           = buildPhotoUrl(data.avatar);
              composetImg.style.display = 'block';
           }
           } else {
              navLetter.textContent      = (data.prenom[0] + data.nom[0]).toUpperCase();
              navImg.style.display       = 'none';
              navLetter.style.display    = 'block';
           if (composetImg) {                                   // ← guard ajouté
              composetImg.textContent   = (data.prenom[0] + data.nom[0]).toUpperCase();
              composetImg.style.display = 'block';
    }
}

        } catch (err) {
            console.error('Profile error:', err);
        }
    }

    if (!window.IS_SEARCH_PAGE) {
    await loadServices(sortSelect.value, activeCategory);
}

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


            await applyUserEvals();


        } catch (error) {
            console.error("Error:", error);
        }
    }

    window.loadServices = () => loadServices(sortSelect.value, activeCategory);
    async function applyUserEvals() {
    await Promise.all(
        [...document.querySelectorAll('.post-card')].map(async (card) => {
            const serviceId = card.dataset.serviceId;
            const rateBtn = card.querySelector('.post-action-btn[data-action="rate"]');
            if (!rateBtn) return;
            try {
                const res  = await fetch(`../../../api/get-ratings.php?service_id=${serviceId}`);
                const json = await res.json();
                if (json.userEval) {
                    const picker   = card.querySelector('.star-picker');
                    const textarea = card.querySelector('.rating-comment-input');
                    if (picker) { picker.dataset.selected = json.userEval.note; renderPickerStars(picker, parseInt(json.userEval.note)); }
                    if (textarea) textarea.value = json.userEval.commentaire || '';
                    rateBtn.classList.add('rated');
                    rateBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`;
                }
            } catch (e) {}
        })
    );
}

// Exposer pour la page recherche
window.applyUserEvals = applyUserEvals;

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

    <div class="post-header" style="position:relative;">
       <div class="post-header-left post-owner" 
     data-owner-id="${service.ID_Utilisateur || service.utilisateur_id || service.user_id || ''}" 
     style="cursor:${currentUser.id == (service.ID_Utilisateur || service.utilisateur_id || service.user_id) ? 'default' : 'pointer'};display:flex;align-items:flex-start;gap:12px;flex:1;">
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
        ${!window.IS_SEARCH_PAGE && currentUser.id == (service.ID_Utilisateur || service.utilisateur_id || service.user_id) ? `
            <button class="post-more" data-action="more">
                <i class="fa-solid fa-ellipsis"></i>
            </button>
            <div class="post-more-menu" hidden>
                <button class="more-menu-item" data-action="edit">
                    <i class="fa-regular fa-pen-to-square"></i> Modifier le service
                </button>
                <button class="more-menu-item danger" data-action="delete">
                    <i class="fa-regular fa-trash-can"></i> Supprimer le service
                </button>
            </div>
            ` : ''}
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

    <div class="comments-list is-hidden" data-loaded="false"></div>

</article>`;
}

    window.createServiceCard = createServiceCard; 
    // ── Events du feed ──
   document.querySelector('.feed').addEventListener('click', async (e) => {

        // ── PRIORITÉ 1 : bouton "..." ──
        if (e.target.closest('.post-more[data-action="more"]')) {
            const card = e.target.closest('.post-card');
            if (!card) return;
            const menu = card.querySelector('.post-more-menu');
            if (!menu) return;

            const wasHidden = menu.hidden;
            document.querySelectorAll('.post-more-menu').forEach(m => m.hidden = true);
            menu.hidden = !wasHidden;
            e.stopPropagation(); // ← stoppe la propagation vers document
            return;
        }

        if (e.target.closest('.more-menu-item[data-action="delete"]')) {
            const card = e.target.closest('.post-card');
            const menu = card.querySelector('.post-more-menu');
            menu.hidden = true;

            // Créer le modal de confirmation
            const confirmOverlay = document.createElement('div');
            confirmOverlay.style.cssText = `
                position:fixed;inset:0;
                background:rgba(0,0,0,0.6);
                backdrop-filter:blur(8px);
                z-index:2000;
                display:flex;justify-content:center;align-items:center;
            `;
            confirmOverlay.innerHTML = `
                <div style="
                    background:rgba(13,13,28,0.97);
                    border:1px solid rgba(75,72,236,0.30);
                    border-radius:18px;
                    padding:28px 24px;
                    width:100%;max-width:320px;
                    box-shadow:0 24px 64px rgba(0,0,0,0.5);
                    text-align:center;
                    animation:fadeUp .25s ease both;
                ">
                    <div style="
                        width:52px;height:52px;
                        background:rgba(248,113,113,0.12);
                        border:1px solid rgba(248,113,113,0.25);
                        border-radius:14px;
                        display:flex;align-items:center;justify-content:center;
                        margin:0 auto 16px;font-size:22px;
                    ">🗑️</div>
                    <div style="
                        font-family:'Space Grotesk',sans-serif;
                        font-weight:700;font-size:16px;
                        color:#f1f0f5;margin-bottom:8px;
                    ">Supprimer ce service ?</div>
                    <div style="
                        font-size:13px;color:#8b8a99;
                        margin-bottom:24px;line-height:1.55;
                    ">Cette action est irréversible. Le service sera définitivement supprimé.</div>
                    <div style="display:flex;gap:10px;">
                        <button id="delCancelBtn" style="
                            flex:1;padding:11px;
                            border:1px solid rgba(75,72,236,0.30);
                            border-radius:10px;
                            background:rgba(255,255,255,0.05);
                            color:#f1f0f5;
                            font-family:'Space Grotesk',sans-serif;
                            font-weight:700;font-size:13px;
                            cursor:pointer;
                            transition:background .2s;
                        ">Annuler</button>
                        <button id="delConfirmBtn" style="
                            flex:1;padding:11px;
                            border:none;border-radius:10px;
                            background:linear-gradient(135deg,#ef4444,#dc2626);
                            color:#fff;
                            font-family:'Space Grotesk',sans-serif;
                            font-weight:700;font-size:13px;
                            cursor:pointer;
                            box-shadow:0 4px 14px rgba(220,38,38,0.35);
                            transition:opacity .2s;
                        ">Supprimer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmOverlay);

            document.getElementById('delCancelBtn').addEventListener('click', () => confirmOverlay.remove());
            confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) confirmOverlay.remove(); });

            document.getElementById('delConfirmBtn').addEventListener('click', async () => {
                confirmOverlay.remove();
                const serviceId = card.dataset.serviceId;
                try {
                    const res = await fetch('../../../api/delete-service.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: serviceId })
                    });
                    const data = await res.json();
                    if (data.success) {
                        card.style.transition = 'opacity .3s, transform .3s';
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.97)';
                        setTimeout(() => card.remove(), 300);
                    } else {
                        alert('Erreur : ' + (data.message || 'Impossible de supprimer.'));
                    }
                } catch (err) {
                    console.error(err);
                }
            });
            return;
        }

       if (e.target.closest('.more-menu-item[data-action="edit"]')) {
    const card = e.target.closest('.post-card');
    card.querySelector('.post-more-menu').hidden = true;
    const serviceId = card.dataset.serviceId;
    try {
        const res  = await fetch(`../../../api/get-single-service.php?id=${serviceId}`);
        const data = await res.json();
        if (!data.success) return;
        await window.openEditServiceFromFeed(data.service, serviceId);
    } catch(err) {
        console.error(err);
    }
    return;
}

        // ── PRIORITÉ 3 : navigation vers profil ──
        const ownerClick = e.target.closest('.post-owner');
        if (ownerClick) {
            if (e.target.closest('.post-more') || e.target.closest('.post-more-menu')) return;
            const userId = ownerClick.dataset.ownerId;
            // Ne pas naviguer si c'est l'utilisateur actuel
            if (userId && userId != currentUser.id) {
                window.location.href = '../profile/profile.html?id=' + encodeURIComponent(userId);
            }
            return;
        }
        // ── PRIORITÉ 4 : reste des actions ──
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
    const card         = e.target.closest('.post-card');
    const commentsList = card.querySelector('.comments-list');
    const panel        = card.querySelector('.rating-panel');

    if (!panel.hidden) panel.hidden = true;

    // Toggle : si visible → fermer
    if (!commentsList.classList.contains('is-hidden')) {
        commentsList.classList.add('is-hidden');
        return;
    }

    // Ouvrir
    commentsList.classList.remove('is-hidden');

    // Ne pas relancer si déjà chargé ou en cours
    if (commentsList.dataset.loaded === 'true' || commentsList.dataset.loaded === 'loading') return;

    commentsList.dataset.loaded = 'loading';
    commentsList.innerHTML = `<div style="padding:14px 18px;color:#8c8580;font-size:12px;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-spinner fa-spin"></i> Chargement des avis...</div>`;

    const serviceId = card.dataset.serviceId;
    try {
        const res  = await fetch(`../../../api/get-ratings.php?service_id=${serviceId}`);
        const data = await res.json();
        commentsList.innerHTML = '';
        if (!data.success || !data.ratings || data.ratings.length === 0) {
            commentsList.innerHTML = `<div style="padding:14px 18px;color:#8c8580;font-size:12px;font-family:'Space Grotesk',sans-serif;text-align:center;"><i class="fa-regular fa-comment-dots" style="font-size:20px;display:block;margin-bottom:6px;"></i>Aucun avis pour l'instant</div>`;
        } else {
            data.ratings.forEach(r => {
                const dateStr = new Date(r.DateEval).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                commentsList.appendChild(buildCommentItem(`${r.prenom} ${r.nom}`, parseInt(r.note), r.commentaire || '', dateStr, r.photo_profil));
            });
        }
        commentsList.dataset.loaded = 'true';
        if (data.userEval) {
            const picker  = card.querySelector('.star-picker');
            const textarea = card.querySelector('.rating-comment-input');
            const rateBtn = card.querySelector('.post-action-btn[data-action="rate"]');
            if (picker)   { picker.dataset.selected = data.userEval.note; renderPickerStars(picker, parseInt(data.userEval.note)); }
            if (textarea)   textarea.value = data.userEval.commentaire || '';
            if (rateBtn)  { rateBtn.classList.add('rated'); rateBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modifier l'évaluation`; }
        }
    } catch (err) {
        console.error(err);
        commentsList.innerHTML = `<div style="padding:14px 18px;color:#ef4444;font-size:12px;font-family:'Space Grotesk',sans-serif;"><i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement</div>`;
        commentsList.dataset.loaded = 'false';
    }
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

    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.post-more') && !e.target.closest('.post-more-menu')) {
            document.querySelectorAll('.post-more-menu').forEach(m => m.hidden = true);
        }
        if (navDropdown && !e.target.closest('#navMenuBtn') && !e.target.closest('#navDropdown')) {
            navDropdown.hidden = true;
        }
    });

    
});



// ── Fonctions utilitaires ──

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

function goToUserProfile(userId) {
    if (!userId) return;
    window.location.href = '../profile/profile.html?id=' + encodeURIComponent(userId);
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

async function submitRating(card) {
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

    try {
        const response = await fetch('../../../api/submit-rating.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(evaluation)
        });

        const text = await response.text();
        const result = JSON.parse(text);

        if (!result.success) {
            textarea.placeholder = '⚠ ' + (result.message || 'Erreur lors de la soumission...');
            textarea.classList.add('input-error');
            setTimeout(() => {
                textarea.placeholder = 'Laissez un commentaire (optionnel)...';
                textarea.classList.remove('input-error');
            }, 2000);
            return;
        }

        // ── Tout dans le try pour avoir accès à result ──
        updateRatingSummary(card, note, result.updated);
        closeRatingPanel(card);

        const commentsList = card.querySelector('.comments-list');
        commentsList.dataset.loaded = 'false';
        commentsList.innerHTML = '';
        commentsList.classList.add('is-hidden');

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
        console.error('Erreur lors de la soumission:', err);
        textarea.placeholder = '⚠ Erreur réseau...';
        textarea.classList.add('input-error');
        setTimeout(() => {
            textarea.placeholder = 'Laissez un commentaire (optionnel)...';
            textarea.classList.remove('input-error');
        }, 2000);
    }
}

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

function updateRatingSummary(card, newNote, isUpdate = false) {
    const summary  = card.querySelector('.post-rating-summary');
    if (!summary) return;
    const scoreEl  = summary.querySelector('.rating-score');
    const countEl  = summary.querySelector('.rating-count');
    const starsEl  = summary.querySelector('.rating-stars-display');
    const oldScore = parseFloat(scoreEl.textContent) || 0;
    const oldCount = parseInt(countEl.textContent.match(/\d+/)?.[0] || '0');

    let rounded;
    if (isUpdate) {
        rounded = oldScore; 
    } else {
        const newCount = oldCount + 1;
        rounded = Math.round(((oldScore * oldCount) + newNote) / newCount * 10) / 10;
        countEl.textContent = `(${newCount} évaluations)`;
    }

    scoreEl.textContent = rounded.toFixed(1);
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

// Fermer si on clique ailleurs
document.addEventListener('click', () => {
    navDropdown.hidden = true;
});

// Déconnexion
document.getElementById('btnDeconnexion').addEventListener('click', () => {
    window.location.href = '../../html/login-user.html';
});

// Suppression du compte
document.getElementById('btnSupprimerCompte').addEventListener('click', () => {
    navDropdown.hidden = true;
    document.getElementById('modalSupprimer').hidden = false;
});

// Annuler
document.getElementById('modalCancel').addEventListener('click', () => {
    document.getElementById('modalSupprimer').hidden = true;
});

// Fermer en cliquant sur l'overlay
document.getElementById('modalOverlay').addEventListener('click', () => {
    document.getElementById('modalSupprimer').hidden = true;
});

// Confirmer suppression
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