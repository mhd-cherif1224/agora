// ── feed.js ──
// Handles star rating + comment system on post cards

document.addEventListener('DOMContentLoaded',async () => {

  await loadServices();
  async function loadServices() {

    try {

        const response = await fetch(
      "../../../api/get-services.php"
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

return `

<article class="post-card" data-service-id="${service.ID}">
    
    <div class="post-header">

        <div class="post-avatar">
            ${
                profileImage
                ? `
                    <img 
                        src="${profileImage}" 
                        style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                    >
                  `
                : initials
            }
        </div>

        <div class="post-meta">

            <div class="post-name">
                ${service.nom} ${service.prenom}
            </div>

            <div class="post-role">
                ${service.specialite || ""}
                ${service.niveau || ""}
            </div>

            <div class="post-time-row">
                <span class="post-time">
                    ${service.DateDePublication}
                </span>
            </div>

        </div>

    </div>

    <div class="post-title">
        ${service.titre}
    </div>

    <div class="post-categories">
        ${
            categories.map(cat => `
                <span class="category-pill">
                    ${cat.trim()}
                </span>
            `).join("")
        }
    </div>

    ${
        serviceImage
        ? `
            <img 
                class="post-image"
                src="${serviceImage}"
                style="width:100%;object-fit:cover;"
            >
        `
        : ""
    }

    <div class="post-body">
        ${service.description}
    </div>

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
    ID_Utilisateur: 1,   // replace with real session user id
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