// ── feed.js ──
// Handles star rating + comment system on post cards

let socket = []

document.addEventListener("DOMContentLoaded", async () => {

    const sortSelect = document.querySelector(".sort-select");

    sortSelect.addEventListener("change", async () => {
        await loadServices(sortSelect.value);
    });

await loadUserProfile();


async function loadUserProfile() {
  try {
    const res = await fetch('/Mini-Projet%20-%20Copy/api/get-profile.php');

    if (res.status === 401) {
      window.location.href = '/Mini-Projet - Copy/view/html/login.html';
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

    // NAV avatar
    const navImg = document.getElementById('navAvatarImg');
    const navLetter = document.getElementById('navAvatarLetter');
    const composetImg = document.querySelector("#composerAvatar");

    if (data.avatar) {
      navImg.src = data.avatar;
      navImg.style.display = 'block';
      navLetter.style.display = 'none';

      composetImg.src = data.avatar;
      composetImg.style.display = 'block';
      
    } else {
      navLetter.textContent = (data.prenom[0] + data.nom[0]).toUpperCase();
      navImg.style.display = 'none';
      navLetter.style.display = 'block';

      composetImg.textContent = (data.prenom[0] + data.nom[0]).toUpperCase();
      composetImg.style.display = 'block';
    }

  } catch (err) {
    console.error('Profile error:', err);
  }
}

    await loadServices(sortSelect.value);


    async function loadServices(sort = "recent") {

        try {

            const response = await fetch(
                `../../../api/get-services.php?sort=${sort}`
            );

            const data = await response.json();

            if (!data.success) {
                console.error(data.message);
                return;
            }

            const feed = document.querySelector(".feed");

            feed.innerHTML = data.services
                .map(service => createServiceCard(service))
                .join("");

        } catch (error) {

            console.error("Error:", error);

        }

    }


function createServiceCard(service) {

    const initials =
    (service.nom?.charAt(0) || "") +
    (service.prenom?.charAt(0) || "");

const profileImage = service.photo_profil
    ? `/Mini-Projet%20-%20Copy/${service.photo_profil}`
    : null;

const serviceImage = service.service_photo
    ? `/Mini-Projet%20-%20Copy/${service.service_photo}`
    : null;

const categories = service.categorie
    ? service.categorie.split(",")
    : [];

const timeAgo = getTimeAgo(service.DateDePublication);

return `

<article class="post-card" data-service-id="${service.ID}">
        
        <div class="post-header">

            <div class="post-avatar">
                <img 
                    src="${profileImage}" 
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                >
            </div>

            <div class="post-meta">

                <div class="post-name">
                    ${service.nom} ${service.prenom}
                </div>

                <div class="post-time-row">
                    <span class="post-time">
                        ${getTimeAgo(service.DateDePublication)}
                    </span>
                </div>

            </div>

        </div>

        <div class="post-title">
            ${service.titre}
        </div>

        <div class="post-tags">
          <span class="post-tag ">
            ${
                categories.map(cat => `
                    <span class="category-pill green">
                        ${cat.trim()}
                    </span>
                `).join("")
            }
          </span>
        </div>

        <div class="post-body">
            ${service.description}
            <br>
            prix : ${service.prix} DZD
        </div>
        <div class="post-body">${service.status}</div>

        ${
            serviceImage
            ? `
                <img 
                    class="post-image"
                    src="${serviceImage}"
                >
            `
            : ""
        }
    <div class="post-rating-summary">

        <div class="rating-stars-display">
            ${generateStars(service.note_moyenne)}
        </div>

        <span class="rating-score">
            ${service.note_moyenne}
        </span>

        <span class="rating-count">
            (${service.nb_avis} évaluations)
        </span>

    </div>

    <div class="post-actions">

        <button class="post-action-btn" data-action="rate">
            <i class="fa-regular fa-star"></i>
            Évaluer
        </button>

    </div>

    <div class="rating-panel" hidden>

        <div class="rating-panel-inner">

            <p class="rating-panel-label">
                Votre évaluation
            </p>

            <div class="star-picker">
                <i class="fa-regular fa-star" data-star="1"></i>
                <i class="fa-regular fa-star" data-star="2"></i>
                <i class="fa-regular fa-star" data-star="3"></i>
                <i class="fa-regular fa-star" data-star="4"></i>
                <i class="fa-regular fa-star" data-star="5"></i>
            </div>

            <textarea 
                class="rating-comment-input"
                placeholder="Commentaire..."
            ></textarea>

            <div class="rating-panel-actions">

                <button class="rating-cancel-btn">
                    Annuler
                </button>

                <button class="rating-submit-btn">
                    Soumettre
                </button>

            </div>

        </div>

    </div>

    <div class="comments-list" hidden></div>

</article>

`;
}
function getTimeAgo(dateString) {
    const now = new Date();
    const serviceDate = new Date(dateString);

    const diffMs = now - serviceDate;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return `il y a ${minutes} min`;
    }

    if (hours < 24) {
        return `il y a ${hours} h`;
    }

    if (days < 30) {
        return `il y a ${days} jours`;
    }

    const months = Math.floor(days / 30);

    if (months < 12) {
        return `il y a ${months} mois`;
    }

    const years = Math.floor(months / 12);

    return `il y a ${years} an(s)`;
}

function generateStars(note) {

    note = parseFloat(note);

    const fullStars = Math.floor(note);

    let html = "";

    for(let i = 0; i < 5; i++){

        if(i < fullStars){
            html += `<i class="fa-solid fa-star"></i>`;
        } else {
            html += `<i class="fa-regular fa-star"></i>`;
        }

    }

    return html;
}

async function refreshService(serviceId) {

    try {

        const response = await fetch(
            `../../../api/get-single-service.php?id=${serviceId}`
        );

        const data = await response.json();

        if (!data.success) return;

        const newCard = createServiceCard(data.service);

        const oldCard = document.querySelector(
            `[data-service-id="${serviceId}"]`
        );

        if (oldCard) {
            oldCard.outerHTML = newCard;
        }

    } catch (error) {
        console.error(error);
    }
}

  document.querySelector('.feed').addEventListener('click', (e) => {

    // ── RATE button → toggle rating panel
    if (e.target.closest('.post-action-btn[data-action="rate"]')) {
      const card = e.target.closest('.post-card');
      const panel = card.querySelector('.rating-panel');
      const commentsList = card.querySelector('.comments-list');
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      if (!isOpen && !commentsList.hidden) commentsList.hidden = true;
      return;
    }

    // ── COMMENT button → toggle comments list
    if (e.target.closest('.post-action-btn[data-action="comment"]')) {
      const card = e.target.closest('.post-card');
      const commentsList = card.querySelector('.comments-list');
      const panel = card.querySelector('.rating-panel');
      commentsList.hidden = !commentsList.hidden;
      if (!commentsList.hidden && !panel.hidden) panel.hidden = true;
      return;
    }

    // ── STAR hover/click in picker
    if (e.target.closest('.star-picker')) {
      const star = e.target.closest('[data-star]');
      if (!star) return;
      const picker = star.closest('.star-picker');
      const val = parseInt(star.dataset.star);
      // store selected value on the picker element
      picker.dataset.selected = val;
      renderPickerStars(picker, val);
      return;
    }

    // ── CANCEL button
    if (e.target.closest('.rating-cancel-btn')) {
      const card = e.target.closest('.post-card');
      closeRatingPanel(card);
      return;
    }

    // ── SUBMIT button
    if (e.target.closest('.rating-submit-btn')) {
      const card = e.target.closest('.post-card');
      submitRating(card);
      return;
    }

  });

  // Star hover effects
  document.querySelector('.feed').addEventListener('mouseover', (e) => {
    const star = e.target.closest('.star-picker [data-star]');
    if (!star) return;
    const picker = star.closest('.star-picker');
    const val = parseInt(star.dataset.star);
    renderPickerStars(picker, val, true);
  });

  document.querySelector('.feed').addEventListener('mouseout', (e) => {
    const star = e.target.closest('.star-picker [data-star]');
    if (!star) return;
    const picker = star.closest('.star-picker');
    const selected = parseInt(picker.dataset.selected || 0);
    renderPickerStars(picker, selected);
  });

});

// ── Render stars in picker (hover or selected)
function renderPickerStars(picker, upTo, isHover = false) {
  picker.querySelectorAll('[data-star]').forEach(s => {
    const n = parseInt(s.dataset.star);
    s.className = n <= upTo
      ? (isHover ? 'fa-regular fa-star hovered' : 'fa-solid fa-star selected')
      : 'fa-regular fa-star';
  });
}

// ── Close and reset rating panel
function closeRatingPanel(card) {
  const panel = card.querySelector('.rating-panel');
  const picker = card.querySelector('.star-picker');
  const textarea = card.querySelector('.rating-comment-input');
  panel.hidden = true;
  picker.dataset.selected = 0;
  renderPickerStars(picker, 0);
  textarea.value = '';
}

// ── Submit rating
function submitRating(card) {
  const picker = card.querySelector('.star-picker');
  const textarea = card.querySelector('.rating-comment-input');
  const note = parseInt(picker.dataset.selected || 0);

  if (note === 0) {
    textarea.placeholder = '⚠ Choisissez une note avant de soumettre...';
    textarea.classList.add('input-error');
    setTimeout(() => {
      textarea.placeholder = 'Laissez un commentaire (optionnel)...';
      textarea.classList.remove('input-error');
    }, 2000);

    refreshService(serviceId);
    return;
  }

  const commentaire = textarea.value.trim();
  const dateEval    = new Date().toLocaleDateString('fr-FR');
  const serviceId   = card.dataset.serviceId;

  // Build the evaluation object (matches your DB columns)
  const evaluation = {
    note,
    commentaire: commentaire || null,
    DateEval: dateEval,
    ID_Utilisateur: currentUser.id,   // replace with real session user id
    ID_Service: serviceId
  };

  console.log('Évaluation soumise :', evaluation);

  // Add comment to the list if there's text
  const commentsList = card.querySelector('.comments-list');
  if (commentaire) {
    const item = buildCommentItem('Moi', note, commentaire, dateEval);
    commentsList.appendChild(item);
    commentsList.hidden = false;
  }

  // Update the summary bar
  updateRatingSummary(card, note);

  // Close panel
  closeRatingPanel(card);

  // Mark rate button as rated
  const rateBtn = card.querySelector('.post-action-btn[data-action="rate"]');
  rateBtn.classList.add('rated');
  rateBtn.innerHTML = `<i class="fa-solid fa-star"></i> Évalué`;
}

// ── Build a new comment DOM element
function buildCommentItem(name, note, text, date) {
  const item = document.createElement('div');
  item.className = 'comment-item';

  const initials = name.slice(0, 2).toUpperCase();
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

// ── Recalculate and update the rating summary bar
function updateRatingSummary(card, newNote) {
  const summary   = card.querySelector('.post-rating-summary');
  const scoreEl   = summary.querySelector('.rating-score');
  const countEl   = summary.querySelector('.rating-count');
  const starsEl   = summary.querySelector('.rating-stars-display');

  const oldScore  = parseFloat(scoreEl.textContent);
  const oldCount  = parseInt(countEl.textContent.match(/\d+/)[0]);
  const newCount  = oldCount + 1;
  const newScore  = ((oldScore * oldCount) + newNote) / newCount;
  const rounded   = Math.round(newScore * 10) / 10;

  scoreEl.textContent = rounded.toFixed(1);
  countEl.textContent = `(${newCount} évaluations)`;

  // Re-render display stars
  const full  = Math.floor(rounded);
  const half  = rounded - full >= 0.5;
  starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '<i class="fa-solid fa-star"></i>';
    if (i === full && half) return '<i class="fa-solid fa-star-half-stroke"></i>';
    return '<i class="fa-regular fa-star"></i>';
  }).join('');
}