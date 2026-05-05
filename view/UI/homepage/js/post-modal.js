// ════════════════════════════════════════
// MAKE A POST MODAL + POST-MORE MENU
// ConnectU — accueil/feed
// ════════════════════════════════════════

// ── Inject all required CSS ──



// ════════════════════════════════════════
// HIDDEN POSTS PANEL
// ════════════════════════════════════════
let attachedPhotos = [];
const hiddenPostsOverlay = document.createElement('div');
hiddenPostsOverlay.className = 'hidden-posts-overlay';
hiddenPostsOverlay.id = 'hiddenPostsOverlay';
hiddenPostsOverlay.innerHTML = `
  <div class="hidden-posts-panel">
    <div class="hidden-posts-header">
      <i class="fa-solid fa-eye-slash" style="color:#8c8580;font-size:16px;"></i>
      <span class="hidden-posts-title">Posts masqués</span>
      <button class="hidden-posts-close" id="hiddenPostsClose"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="hidden-posts-list" id="hiddenPostsList">
      <div class="hidden-posts-empty"><i class="fa-regular fa-eye-slash"></i>Aucun post masqué pour l'instant</div>
    </div>
  </div>`;
document.body.appendChild(hiddenPostsOverlay);

document.getElementById('hiddenPostsClose').addEventListener('click', () => hiddenPostsOverlay.classList.remove('active'));
hiddenPostsOverlay.addEventListener('click', e => { if (e.target === hiddenPostsOverlay) hiddenPostsOverlay.classList.remove('active'); });

const _hiddenPosts = [];

function addToHiddenPanel(card) {
  const name    = card.querySelector('.post-name')?.textContent?.trim() || 'Post';
  const preview = card.querySelector('.post-body')?.innerText?.slice(0, 70)
    || card.querySelector('.post-title')?.textContent?.trim()
    || 'Post sans texte';
  _hiddenPosts.push({ card, name, preview });
  _renderHiddenPanel();
}

function _renderHiddenPanel() {
  const list = document.getElementById('hiddenPostsList');
  list.innerHTML = '';
  if (_hiddenPosts.length === 0) {
    list.innerHTML = '<div class="hidden-posts-empty"><i class="fa-regular fa-eye-slash"></i>Aucun post masqué pour l\'instant</div>';
    return;
  }
  _hiddenPosts.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'hidden-post-item';
    item.innerHTML = `
      <div class="hidden-post-item-info">
        <div class="hidden-post-item-name">${entry.name}</div>
        <div class="hidden-post-item-preview">${entry.preview}</div>
      </div>
      <button class="hidden-post-restore-btn"><i class="fa-solid fa-eye" style="margin-right:5px;"></i>Restaurer</button>`;
    item.querySelector('.hidden-post-restore-btn').addEventListener('click', () => {
      entry.card.style.display = '';
      entry.card.style.opacity = '1';
      entry.card.style.transform = '';
      _hiddenPosts.splice(idx, 1);
      _renderHiddenPanel();
      showNotification('👁️ Post restauré dans le feed');
    });
    list.appendChild(item);
  });
}

//user profile load

loadUserProfile();


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
      role : data.role,
      avatar: data.avatar
    };

    // NAV avatar
    const pmAvatar = document.getElementById('pmAvatar');
    const postModalName = document.querySelector('.post-modal-name');
    const postModalRole = document.querySelector('.post-modal-role');
    
    if(data.nom){
      postModalName.textContent = data.nom;
    }else{
      console.log("error loading the post modal name ")
    }

    if(data.role){
      postModalRole.textContent = data.role;
    }else{
      console.log("error loading the post modal role ")
    }

   
    console.log(pmAvatar)

    if (data.avatar) {
      pmAvatar.src = data.avatar;
      pmAvatar.style.display = 'block';
      
      
    } else{

      console.log("error loading the pmAvatar ")
    }

  } catch (err) {
    console.error('Profile error:', err);
  }
}


// ════════════════════════════════════════
// NOTIFICATION helper
// ════════════════════════════════════════
function showNotification(msg) {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'flex';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3500);
}


// ════════════════════════════════════════
// MAKE A POST MODAL
// ════════════════════════════════════════
(function () {
  

  let attachedPhotos = [], selectedCats = new Set(), scheduledAt = null, locationValue = '';
  let pollActive = false, pollOptions = ['', ''], pollDuration = '1';

  const overlay        = document.getElementById('postModalOverlay');
  const closeBtn       = document.getElementById('postModalClose');
  const preview        = document.getElementById('postPreview');
  const publishBtn     = document.getElementById('postPublishBtn');
  const pmPhotoBtn     = document.getElementById('pmPhotoBtn');
  const pmPhotoInput   = document.getElementById('pmPhotoInput');
  const pmLocBtn       = document.getElementById('pmLocBtn');
  const locModal       = document.getElementById('locModal');
  const locInput       = document.getElementById('locInput');
  const locConfirm     = document.getElementById('locConfirm');
  const locationChip   = document.getElementById('locationChip');
  const locationText   = document.getElementById('locationText');
  const locationRemove = document.getElementById('locationRemove');
  const pmCatBtn       = document.getElementById('pmCatBtn');
  const catDropdown    = document.getElementById('catDropdown');
  const catChipsBox    = document.getElementById('categoryChips');
  const pmTimerBtn     = document.getElementById('pmTimerBtn');
  const timerModal     = document.getElementById('timerModal');
  const timerDate      = document.getElementById('timerDate');
  const timerTime      = document.getElementById('timerTime');
  const timerConfirm   = document.getElementById('timerConfirm');
  const timerClose     = document.getElementById('timerModalClose');
  const scheduledChip  = document.getElementById('scheduledChip');
  const scheduledText  = document.getElementById('scheduledText');
  const scheduledRemove = document.getElementById('scheduledRemove');

  // ── Wrap modal inner content in scroll div ──
  const postModal = document.getElementById('postModal');
  if (postModal) {
    const header = postModal.querySelector('.post-modal-header');
    const footer = postModal.querySelector('.post-modal-footer');
    if (header && footer && !postModal.querySelector('.post-modal-scroll')) {
      const scrollDiv = document.createElement('div');
      scrollDiv.className = 'post-modal-scroll';
      const children = Array.from(postModal.children);
      children.forEach(child => {
        if (child !== header && child !== footer) scrollDiv.appendChild(child);
      });
      postModal.insertBefore(scrollDiv, footer);
    }
  }

  // ── Build category dropdown ──
  


  function openModal(focusOnPhoto) {
    const tmr = new Date(Date.now() + 86400000);
    timerDate.value = tmr.toISOString().split('T')[0]; timerTime.value = '10:00';
    overlay.classList.add('active'); document.body.style.overflow = 'hidden';
    setTimeout(() => { if (focusOnPhoto) pmPhotoInput.click(); }, 80);
  }
  function closeModal() { overlay.classList.remove('active'); document.body.style.overflow = ''; }
  function resetModal() {
    ; attachedPhotos = []; selectedCats.clear(); scheduledAt = null; locationValue = '';
    pollActive = false; pollOptions = ['', '']; pollDuration = '1';
    renderPreview(); renderCatChips();
    [scheduledChip, locationChip].forEach(c => c.classList.remove('visible'));
    [pmTimerBtn, pmCatBtn, pmLocBtn].forEach(b => b.classList.remove('active'));
    publishBtn.classList.remove('scheduled'); publishBtn.innerHTML = 'publier';
    catDropdown.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
    locInput.value = '';
    const pollChip = document.getElementById('pollChip'), pollBuilder = document.getElementById('pollBuilder'), pmPollBtn = document.getElementById('pmPollBtn');
    if (pollChip) pollChip.classList.remove('visible');
    if (pollBuilder) { pollBuilder.classList.remove('visible'); renderPollBuilder(); }
    if (pmPollBtn) pmPollBtn.classList.remove('active');
  }

  // Composer triggers
  const composerInput = document.getElementById('composerTrigger');
  const composerPhoto = document.getElementById('composerPhotoBtn');
  const composerCal   = document.getElementById('composerCalBtn');
  if (composerInput) composerInput.addEventListener('click', () => openModal(false));
  if (composerPhoto) composerPhoto.addEventListener('click', () => openModal(true));
  if (composerCal)   composerCal.addEventListener('click', () => { openModal(false); setTimeout(() => pmTimerBtn.click(), 120); });
  const composerPollBtn = document.querySelector('.composer-btn[title="Sondage"]');
  if (composerPollBtn) composerPollBtn.addEventListener('click', () => { openModal(false); setTimeout(() => activatePoll(), 150); });

  closeBtn.addEventListener('click', () => { closeModal(); resetModal(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) { closeModal(); resetModal(); } });

  // Photo
  pmPhotoBtn.addEventListener('click', () => pmPhotoInput.click());
  pmPhotoInput.addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      if (file.type === 'image/gif') { showNotification('⚠️ Les GIFs animés ne sont pas acceptés'); return; }
      const reader = new FileReader();
      reader.onload = e => { attachedPhotos.push({ url: e.target.result, file: file }); renderPreview(); };
      reader.readAsDataURL(file);
    });
    this.value = '';
  });
  function renderPreview() {
    preview.innerHTML = '';
    attachedPhotos.forEach((photo, idx) => {
      const div = document.createElement('div'); div.className = 'preview-item';
      div.innerHTML = `<img src="${photo.url}" alt="">`;
      const rm = document.createElement('button'); rm.className = 'preview-remove'; rm.innerHTML = '×';
      rm.addEventListener('click', () => { attachedPhotos.splice(idx, 1); renderPreview(); });
      div.appendChild(rm); preview.appendChild(div);
    });
    preview.classList.toggle('has-items', attachedPhotos.length > 0);
  }

  // Location
  pmLocBtn.addEventListener('click', e => { e.stopPropagation(); locModal.classList.toggle('open'); timerModal.classList.remove('open');  if (locModal.classList.contains('open')) setTimeout(() => locInput.focus(), 50); });
  locConfirm.addEventListener('click', () => { const val = locInput.value.trim(); if (!val) return; locationValue = val; locationText.textContent = val; locationChip.classList.add('visible'); pmLocBtn.classList.add('active'); locModal.classList.remove('open'); });
  locInput.addEventListener('keydown', e => { if (e.key === 'Enter') locConfirm.click(); });
  locationRemove.addEventListener('click', () => { locationValue = ''; locationChip.classList.remove('visible'); pmLocBtn.classList.remove('active'); locInput.value = ''; });

  // Category
  pmCatBtn.addEventListener('click', e => { e.stopPropagation(); catDropdown.classList.toggle('open'); timerModal.classList.remove('open'); locModal.classList.remove('open'); pmCatBtn.classList.toggle('active', catDropdown.classList.contains('open')); });

  // Timer
  pmTimerBtn.addEventListener('click', e => { e.stopPropagation(); timerModal.classList.toggle('open'); catDropdown.classList.remove('open'); locModal.classList.remove('open'); pmTimerBtn.classList.toggle('active', timerModal.classList.contains('open')); });
  timerClose.addEventListener('click', () => { timerModal.classList.remove('open'); pmTimerBtn.classList.remove('active'); });
  timerConfirm.addEventListener('click', () => {
    const d = timerDate.value, t = timerTime.value;
    if (!d || !t) { showNotification('⚠️ Choisissez une date et une heure'); return; }
    scheduledAt = new Date(`${d}T${t}`);
    if (scheduledAt <= new Date()) { showNotification('⚠️ La date doit être dans le futur'); scheduledAt = null; return; }
    const fmt = scheduledAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' à ' + t;
    scheduledText.textContent = `Programmé · ${fmt}`; scheduledChip.classList.add('visible'); pmTimerBtn.classList.add('active');
    publishBtn.classList.add('scheduled'); publishBtn.innerHTML = `<i class="fa-regular fa-clock"></i> Programmer`;
    timerModal.classList.remove('open');
  });
  scheduledRemove.addEventListener('click', () => { scheduledAt = null; scheduledChip.classList.remove('visible'); pmTimerBtn.classList.remove('active'); publishBtn.classList.remove('scheduled'); publishBtn.innerHTML = 'publier'; });

  // Poll button in footer
  const modalFooter = document.querySelector('.post-modal-footer');
  const sep = modalFooter?.querySelector('.post-tool-sep');
  if (sep) {
    const pmPollBtnEl = document.createElement('button');
    pmPollBtnEl.className = 'post-tool-btn'; pmPollBtnEl.id = 'pmPollBtn'; pmPollBtnEl.title = 'Créer un sondage';
    pmPollBtnEl.innerHTML = '<i class="fa-solid fa-chart-bar"></i>';
    modalFooter.insertBefore(pmPollBtnEl, sep);
    pmPollBtnEl.addEventListener('click', e => { e.stopPropagation(); if (pollActive) deactivatePoll(); else activatePoll(); });
  }

  // Poll chip + builder injected into scroll area
  setTimeout(() => {
    const scrollArea = document.querySelector('.post-modal-scroll');
    if (scrollArea && !document.getElementById('pollChip')) {
      const pollChipEl = document.createElement('div');
      pollChipEl.className = 'poll-chip'; pollChipEl.id = 'pollChip';
      pollChipEl.innerHTML = `<i class="fa-solid fa-chart-bar"></i><span>Sondage actif</span><button class="poll-chip-remove" id="pollChipRemove"><i class="fa-solid fa-xmark"></i></button>`;
      scrollArea.appendChild(pollChipEl);
      const pollBuilderEl = document.createElement('div');
      pollBuilderEl.className = 'poll-builder'; pollBuilderEl.id = 'pollBuilder';
      scrollArea.appendChild(pollBuilderEl);
      document.getElementById('pollChipRemove').addEventListener('click', () => deactivatePoll());
    }
  }, 0);

  function activatePoll() {
    pollActive = true; pollOptions = ['', '']; pollDuration = '1';
    document.getElementById('pmPollBtn')?.classList.add('active');
    document.getElementById('pollChip')?.classList.add('visible');
    const pb = document.getElementById('pollBuilder'); if (pb) { pb.classList.add('visible'); renderPollBuilder(); }
  }
  function deactivatePoll() {
    pollActive = false;
    document.getElementById('pmPollBtn')?.classList.remove('active');
    document.getElementById('pollChip')?.classList.remove('visible');
    document.getElementById('pollBuilder')?.classList.remove('visible');
  }
  function renderPollBuilder() {
    const container = document.getElementById('pollBuilder'); if (!container) return;
    container.innerHTML = `<div class="poll-builder-title">Options du sondage</div>`;
    pollOptions.forEach((val, idx) => {
      const row = document.createElement('div'); row.className = 'poll-option-row';
      const input = document.createElement('input'); input.type = 'text'; input.className = 'poll-option-input';
      input.placeholder = `Option ${idx + 1}`; input.value = val;
      input.addEventListener('input', () => { pollOptions[idx] = input.value; });
      const rmBtn = document.createElement('button'); rmBtn.className = 'poll-option-remove';
      rmBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>'; rmBtn.style.display = pollOptions.length <= 2 ? 'none' : 'flex';
      rmBtn.addEventListener('click', () => { pollOptions.splice(idx, 1); renderPollBuilder(); });
      row.appendChild(input); row.appendChild(rmBtn); container.appendChild(row);
    });
    if (pollOptions.length < 5) {
      const addBtn = document.createElement('button'); addBtn.className = 'poll-add-option-btn';
      addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Ajouter une option';
      addBtn.addEventListener('click', () => { if (pollOptions.length >= 5) return; pollOptions.push(''); renderPollBuilder(); });
      container.appendChild(addBtn);
    }
    const durRow = document.createElement('div'); durRow.className = 'poll-duration-row';
    durRow.innerHTML = `<span class="poll-duration-label">Durée :</span>
      <select class="poll-duration-select" id="pollDurationSelect">
        <option value="1" ${pollDuration==='1'?'selected':''}>1 jour</option>
        <option value="3" ${pollDuration==='3'?'selected':''}>3 jours</option>
        <option value="7" ${pollDuration==='7'?'selected':''}>1 semaine</option>
        <option value="14" ${pollDuration==='14'?'selected':''}>2 semaines</option>
      </select>`;
    container.appendChild(durRow);
    document.getElementById('pollDurationSelect').addEventListener('change', e => { pollDuration = e.target.value; });
  }

  // Close sub-popups on outside click
  document.addEventListener('click', e => {
    if (!catDropdown.contains(e.target) && e.target !== pmCatBtn) catDropdown.classList.remove('open');
    if (!timerModal.contains(e.target) && e.target !== pmTimerBtn) timerModal.classList.remove('open');
    if (!locModal.contains(e.target) && e.target !== pmLocBtn) locModal.classList.remove('open');
  });

  // Publish
  publishBtn.addEventListener('click', () => {
    const text = ""
    
    if (pollActive && pollOptions.filter(o => o.trim()).length < 2) { showNotification('⚠️ Ajoutez au moins 2 options'); return; }
    const snapPhotos = [...attachedPhotos], snapCats = new Set(selectedCats), snapLoc = locationValue;
    const snapPoll = pollActive ? { options: pollOptions.filter(o => o.trim()), duration: pollDuration } : null;
    if (scheduledAt) {
      const delay = scheduledAt - Date.now();
      const fmt = scheduledAt.toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      showNotification(`🕐 Post programmé · ${fmt}`);
      setTimeout(() => { createPost(text, snapPhotos, snapCats, snapLoc, snapPoll); showNotification('✓ Post publié automatiquement !'); }, delay);
    } else {
      createPost(text, snapPhotos, snapCats, snapLoc, snapPoll);
      showNotification('✓ Post publié avec succès !');
    }
    closeModal(); resetModal();
  });

  function createPost(text, photos, cats, loc, poll) {
    const classMap = { freelance:'green', html:'orange', react:'green', js:'orange', python:'green', design:'pink', mobile:'blue', data:'blue', emploi:'orange', article:'purple' };
    const tagHtml = Array.from(cats).map(id => { const cat = CATEGORIES.find(c => c.id === id); return cat ? `<span class="post-tag ${classMap[id]||''}" style="color:${cat.color};background:${cat.bg};">${cat.label}</span>` : ''; }).join('');
    const photosHtml = photos.map(p => `<img class="post-image" src="${p.url}" alt="" style="display:block;">`).join('');
    const locHtml = loc ? `<div class="post-loc-chip" data-loc="${loc}" style="padding:0 18px 10px;font-size:11px;color:#8c8580;display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-location-dot" style="color:#e8734a;font-size:10px;"></i>${loc}</div>` : '';
    let pollHtml = '';
    if (poll) {
      const uid = 'poll' + Date.now();
      const opts = poll.options.map((opt, i) => `<label class="poll-vote-option" data-idx="${i}"><input type="radio" name="${uid}" value="${i}"><div class="poll-vote-bar-wrap"><div class="poll-vote-fill"></div><span class="poll-vote-text">${opt}</span><span class="poll-vote-pct">0%</span></div></label>`).join('');
      const dur = poll.duration==='1'?'1 jour':poll.duration==='7'?'1 semaine':poll.duration==='14'?'2 semaines':poll.duration+' jours';
      pollHtml = `<div class="poll-card"><div class="poll-votes-wrap">${opts}</div><div class="poll-meta">0 vote · ${dur}</div></div>`;
    }
    const article = document.createElement('article');
    article.className = 'post-card new-feed-post'; article.dataset.serviceId = 'new-' + Date.now(); article.dataset.owner = 'me';
    article.innerHTML = `
      <div class="post-pin-badge"><i class="fa-solid fa-thumbtack"></i> Épinglé</div>
      <div class="post-header">
        <div class="post-avatar" style="background:linear-gradient(135deg,#e44,#f97316);">MC</div>
        <div class="post-meta">
          <div class="post-name">mehdi cherif</div>
          <div class="post-role">etudiant a l univ d abderrahmane mira</div>
          <div class="post-time-row"><span class="post-time">À l'instant</span><span class="post-globe"><i class="fa-solid fa-earth-africa"></i></span></div>
        </div>
        <button class="post-more"><i class="fa-solid fa-ellipsis"></i></button>
      </div>
      ${tagHtml ? `<div class="post-tags" style="padding:0 18px 14px;">${tagHtml}</div>` : ''}
      ${locHtml}
      ${poll ? (text ? `<div class="post-body" style="padding:0 18px 8px;font-weight:700;">${text.replace(/\n/g,'<br>')}</div>` : '') + pollHtml : (text ? `<div class="post-body" style="padding:0 18px 14px;">${text.replace(/\n/g,'<br>')}</div>` : '')}
      ${photosHtml}
      <div class="post-rating-summary"><div class="rating-stars-display"><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i></div><span class="rating-score">—</span><span class="rating-count">(0 évaluations)</span></div>
      <div class="post-actions"><button class="post-action-btn" data-action="rate"><i class="fa-regular fa-star"></i> Évaluer</button></div>
      <div class="rating-panel" hidden><div class="rating-panel-inner"><p class="rating-panel-label">Votre évaluation</p><div class="star-picker"><i class="fa-regular fa-star" data-star="1"></i><i class="fa-regular fa-star" data-star="2"></i><i class="fa-regular fa-star" data-star="3"></i><i class="fa-regular fa-star" data-star="4"></i><i class="fa-regular fa-star" data-star="5"></i></div><textarea class="rating-comment-input" placeholder="Laissez un commentaire (optionnel)..."></textarea><div class="rating-panel-actions"><button class="rating-cancel-btn">Annuler</button><button class="rating-submit-btn">Soumettre</button></div></div></div>
      <div class="comments-list" hidden></div>`;

    if (poll) {
      const votes = new Array(poll.options.length).fill(0);
      let totalVotes = 0, hasVoted = false;
      article.querySelectorAll('.poll-vote-option').forEach((opt, i) => {
        opt.addEventListener('click', () => {
          if (hasVoted) return; hasVoted = true; votes[i]++; totalVotes++;
          article.querySelector('.poll-votes-wrap').classList.add('poll-revealed');
          article.querySelectorAll('.poll-vote-option').forEach((o, j) => {
            const pct = Math.round((votes[j] / totalVotes) * 100);
            o.querySelector('.poll-vote-fill').style.width = pct + '%';
            o.querySelector('.poll-vote-pct').textContent = pct + '%';
            if (j === i) o.classList.add('voted'); o.style.cursor = 'default';
          });
          const meta = article.querySelector('.poll-meta'); if (meta) meta.textContent = `${totalVotes} vote${totalVotes>1?'s':''} · Sondage actif`;
        });
      });
    }
    document.querySelector('.feed').insertBefore(article, document.querySelector('.feed').firstChild);
  }
})();


// ════════════════════════════════════════
// POST-MORE MENU + FULL EDIT MODAL
// ════════════════════════════════════════
(function () {

  
  // Add pin badges to all existing cards
  document.querySelectorAll('.post-card').forEach(card => {
    if (!card.querySelector('.post-pin-badge')) {
      const badge = document.createElement('div');
      badge.className = 'post-pin-badge';
      badge.innerHTML = '<i class="fa-solid fa-thumbtack"></i> Épinglé';
      card.insertBefore(badge, card.firstChild);
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    loadSessionUser();
});

async function loadSessionUser() {

    try {

        const userId = localStorage.getItem("userId");

        if (!userId) return;

        const response = await fetch(
            `/Mini-Projet%20-%20Copy/api/get-profile.php?id=${userId}`
        );

        const data = await response.json();

        if (!data.success) return;

        const user = data.user;

        const profileImage = user.photo_profil
            ? `/Mini-Projet%20-%20Copy/${user.photo_profil}`
            : "";

        document.getElementById("postModalAvatar").src =
            profileImage;

        document.getElementById("postModalName").textContent =
            `${user.nom} ${user.prenom}`;

        document.getElementById("postModalRole").textContent =
            `${user.specialite || ""} ${user.niveau || ""}`;

    } catch (error) {
        console.error(error);
    }
}

  // ════ EDIT MODAL ════


  const editOverlay = document.createElement('div');
  editOverlay.className = 'edit-post-overlay'; editOverlay.id = 'editPostOverlay';
  editOverlay.innerHTML = `
    <div class="edit-post-modal" id="editPostModal">
      <div class="edit-post-header">
        <div class="post-modal-avatar-placeholder" id="editPmAvatar" style="width:38px;height:38px;font-size:14px;flex-shrink:0;">M</div>
        <span class="edit-post-title"><i class="fa-solid fa-pen-to-square" style="margin-right:7px;color:#16376E;font-size:13px;"></i>Modifier le post</span>
        <button class="edit-post-close-btn" id="editPostClose"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="edit-post-scroll">
        <div class="edit-post-body-area">
          <textarea class="edit-post-textarea" id="editPostTextarea" placeholder="Quoi de neuf ?"></textarea>
        </div>
        <div class="edit-loc-chip" id="editLocChip">
          <i class="fa-solid fa-location-dot"></i>
          <span id="editLocChipText"></span>
          <button class="edit-loc-chip-remove" id="editLocChipRemove"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="edit-cat-chips" id="editCatChips"></div>
        <div class="edit-preview-area" id="editPreviewArea"></div>
      </div>
      <div class="edit-post-footer" id="editPostFooter">
        <input type="file" id="editPhotoInput" hidden accept="image/jpeg,image/png,image/jpg" multiple>
        <button class="post-tool-btn" id="editPhotoBtn" title="Ajouter une photo"><i class="fa-regular fa-image"></i></button>
        <div style="position:relative;">
          <button class="post-tool-btn" id="editLocBtn" title="Localisation"><i class="fa-solid fa-location-dot"></i></button>
          <div class="loc-modal" id="editLocModal">
            <input type="text" id="editLocInput" placeholder="Ex : Bejaia, Algeria">
            <button class="loc-confirm-btn" id="editLocConfirm">Confirmer</button>
          </div>
        </div>
        <div style="position:relative;">
          <button class="post-tool-btn" id="editCatBtn" title="Catégorie"><i class="fa-solid fa-plus"></i></button>
          <div class="cat-dropdown" id="editCatDropdown"></div>
        </div>
        <div class="post-tool-sep"></div>
        <div class="post-footer-push"></div>
        <button class="post-publish-btn" id="editSaveBtn" style="background:#16376E;">
          <i class="fa-solid fa-floppy-disk"></i> Enregistrer
        </button>
      </div>
    </div>`;
  document.body.appendChild(editOverlay);

  let editTargetCard = null, editNewPhotos = [], editKeptPhotos = [], editSelectedCats = new Set(), editLocation = '';

  // Build edit cat dropdown
  

  function renderEditCatChips() {
    const box = document.getElementById('editCatChips'); box.innerHTML = '';
    editSelectedCats.forEach(id => {
      const cat = CATEGORIES.find(c => c.id === id); if (!cat) return;
      const chip = document.createElement('span'); chip.className = 'cat-chip';
      chip.style.cssText = `color:${cat.color};background:${cat.bg};border-color:${cat.color}`;
      chip.textContent = cat.label; box.appendChild(chip);
    });
    box.classList.toggle('visible', editSelectedCats.size > 0);
  }

  function openEditModal(card) {
    editTargetCard = card; editNewPhotos = []; editKeptPhotos = []; editSelectedCats = new Set(); editLocation = '';

    // Pre-fill text
    const bodyEl = card.querySelector('.post-body');
    document.getElementById('editPostTextarea').value = bodyEl ? bodyEl.innerText.replace(/voir plus\s*$/, '').trim() : '';

    // Pre-fill tags
    editCatDD.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
    card.querySelectorAll('.post-tags [class*="post-tag"], .post-tags .post-tag').forEach(tag => {
      const label = tag.textContent.trim();
      const cat = CATEGORIES.find(c => c.label === label);
      if (cat) { editSelectedCats.add(cat.id); editCatDD.querySelector(`[data-id="${cat.id}"]`)?.classList.add('selected'); }
    });
    renderEditCatChips();

    // Pre-fill location
    const locEl = card.querySelector('[data-loc]');
    if (locEl) {
      editLocation = locEl.dataset.loc || locEl.textContent.replace(/\s+/g,' ').trim();
      document.getElementById('editLocChipText').textContent = editLocation;
      document.getElementById('editLocChip').classList.add('visible');
      document.getElementById('editLocInput').value = editLocation;
      document.getElementById('editLocBtn').classList.add('active');
    } else {
      document.getElementById('editLocChip').classList.remove('visible');
      document.getElementById('editLocBtn').classList.remove('active');
    }

    // Pre-fill images
    const previewArea = document.getElementById('editPreviewArea'); previewArea.innerHTML = '';
    card.querySelectorAll('img.post-image, .post-card > img').forEach(img => {
      if (editKeptPhotos.find(k => k.src === img.src)) return;
      editKeptPhotos.push({ src: img.src });
      _addEditPreviewItem(previewArea, img.src, true);
    });

    // Reset dropdown states
    editCatDD.classList.remove('open'); document.getElementById('editLocModal').classList.remove('open');
    document.getElementById('editCatBtn').classList.toggle('active', false);

    editOverlay.classList.add('active'); document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('editPostTextarea').focus(), 80);
  }

  function closeEditModal() {
    editOverlay.classList.remove('active'); document.body.style.overflow = ''; editTargetCard = null;
  }

  function _addEditPreviewItem(area, src, isExisting) {
    const div = document.createElement('div'); div.className = 'preview-item';
    div.innerHTML = `<img src="${src}" alt="">`;
    const rm = document.createElement('button'); rm.className = 'preview-remove'; rm.innerHTML = '×';
    rm.addEventListener('click', () => {
      if (isExisting) editKeptPhotos = editKeptPhotos.filter(k => k.src !== src);
      else editNewPhotos = editNewPhotos.filter(p => p.url !== src);
      div.remove();
    });
    div.appendChild(rm); area.appendChild(div);
  }

  // Photo input
  document.getElementById('editPhotoBtn').addEventListener('click', () => document.getElementById('editPhotoInput').click());
  document.getElementById('editPhotoInput').addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => { editNewPhotos.push({ url: e.target.result }); _addEditPreviewItem(document.getElementById('editPreviewArea'), e.target.result, false); };
      reader.readAsDataURL(file);
    });
    this.value = '';
  });

  // Location in edit modal
  const editLocBtn = document.getElementById('editLocBtn'), editLocModal = document.getElementById('editLocModal'), editLocInput = document.getElementById('editLocInput');
  editLocBtn.addEventListener('click', e => { e.stopPropagation(); editLocModal.classList.toggle('open'); editCatDD.classList.remove('open'); if (editLocModal.classList.contains('open')) setTimeout(() => editLocInput.focus(), 40); });
  document.getElementById('editLocConfirm').addEventListener('click', () => {
    const val = editLocInput.value.trim(); if (!val) return;
    editLocation = val; document.getElementById('editLocChipText').textContent = val;
    document.getElementById('editLocChip').classList.add('visible');
    editLocBtn.classList.add('active'); editLocModal.classList.remove('open');
  });
  editLocInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('editLocConfirm').click(); });
  document.getElementById('editLocChipRemove').addEventListener('click', () => {
    editLocation = ''; document.getElementById('editLocChip').classList.remove('visible');
    editLocBtn.classList.remove('active'); editLocInput.value = '';
  });

  // Category in edit modal
  const editCatBtn = document.getElementById('editCatBtn');
  editCatBtn.addEventListener('click', e => { e.stopPropagation(); editCatDD.classList.toggle('open'); editLocModal.classList.remove('open'); editCatBtn.classList.toggle('active', editCatDD.classList.contains('open')); });

  document.addEventListener('click', e => {
    if (editOverlay.classList.contains('active')) {
      if (!editCatDD.contains(e.target) && e.target !== editCatBtn) editCatDD.classList.remove('open');
      if (!editLocModal.contains(e.target) && e.target !== editLocBtn) editLocModal.classList.remove('open');
    }
  });

  document.getElementById('editPostClose').addEventListener('click', closeEditModal);
  editOverlay.addEventListener('click', e => { if (e.target === editOverlay) closeEditModal(); });

  // SAVE
  document.getElementById('editSaveBtn').addEventListener('click', () => {
    if (!editTargetCard) return;
    const card = editTargetCard;
    const newText = document.getElementById('editPostTextarea').value.trim();

    // 1. Text
    let bodyEl = card.querySelector('.post-body');
    if (newText) {
      if (!bodyEl) {
        bodyEl = document.createElement('div'); bodyEl.className = 'post-body'; bodyEl.style.cssText = 'padding:0 18px 14px;';
        const anchor = card.querySelector('.post-actions') || card.querySelector('.post-rating-summary'); anchor ? anchor.before(bodyEl) : card.appendChild(bodyEl);
      }
      bodyEl.innerHTML = newText.replace(/\n/g, '<br>');
    } else if (bodyEl) { bodyEl.remove(); }

    // 2. Tags
    let tagsEl = card.querySelector('.post-tags');
    if (editSelectedCats.size > 0) {
      if (!tagsEl) {
        tagsEl = document.createElement('div'); tagsEl.className = 'post-tags'; tagsEl.style.cssText = 'padding:0 18px 14px;';
        const header = card.querySelector('.post-header'); header ? header.after(tagsEl) : card.insertBefore(tagsEl, card.children[1]);
      }
      tagsEl.innerHTML = Array.from(editSelectedCats).map(id => { const cat = CATEGORIES.find(c => c.id === id); return cat ? `<span class="post-tag" style="background:${cat.bg};color:${cat.color}">${cat.label}</span>` : ''; }).join('');
    } else if (tagsEl) { tagsEl.remove(); }

    // 3. Location
    let locDiv = card.querySelector('[data-loc]');
    if (editLocation) {
      if (!locDiv) {
        locDiv = document.createElement('div'); locDiv.className = 'post-loc-chip';
        locDiv.style.cssText = 'padding:0 18px 10px;font-size:11px;color:#8c8580;display:flex;align-items:center;gap:5px;';
        const anchor = card.querySelector('.post-body') || card.querySelector('.post-actions') || card.querySelector('.post-rating-summary'); anchor ? anchor.before(locDiv) : card.appendChild(locDiv);
      }
      locDiv.dataset.loc = editLocation; locDiv.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#e8734a;font-size:10px;"></i>${editLocation}`;
    } else if (locDiv) { locDiv.remove(); }

    // 4. Remove old images
    card.querySelectorAll('img.post-image, .post-card > img:not(.post-avatar)').forEach(img => img.remove());

    // 5. Re-inject kept + new images
    const imgAnchor = card.querySelector('.post-rating-summary') || card.querySelector('.post-actions');
    editKeptPhotos.forEach(({ src }) => {
      const img = document.createElement('img'); img.className = 'post-image'; img.src = src; img.style.display = 'block';
      imgAnchor ? imgAnchor.before(img) : card.appendChild(img);
    });
    editNewPhotos.forEach(({ url }) => {
      const img = document.createElement('img'); img.className = 'post-image'; img.src = url; img.style.display = 'block';
      imgAnchor ? imgAnchor.before(img) : card.appendChild(img);
    });

    // 6. Edit mark
    const timeEl = card.querySelector('.post-time');
    if (timeEl) {
      const fmt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      let mark = timeEl.querySelector('.edit-mark');
      if (!mark) { mark = document.createElement('span'); mark.className = 'edit-mark'; mark.style.cssText = 'margin-left:6px;font-size:10px;color:#8c8580;font-style:italic;'; timeEl.appendChild(mark); }
      mark.textContent = `· modifié à ${fmt}`;
    }

    closeEditModal(); showNotification('✏️ Post modifié avec succès !');
  });


  // ════ CONTEXT MENU ════
  function buildMenu(card) {
    document.querySelectorAll('.post-more-menu').forEach(m => m.remove());
    const isPinned = card.querySelector('.post-pin-badge')?.classList.contains('visible');

    const menu = document.createElement('div'); menu.className = 'post-more-menu open';
    const items = [
      { icon: 'fa-pen-to-square', label: 'Modifier le post',              action: 'edit' },
      { icon: 'fa-thumbtack',     label: isPinned ? 'Désépingler' : 'Épingler', action: 'pin' },
      { icon: 'fa-eye-slash',     label: 'Masquer le post',               action: 'hide' },
      'sep',
      { icon: 'fa-trash',         label: 'Supprimer le post',             action: 'delete', danger: true },
    ];

    items.forEach(item => {
      if (item === 'sep') { const sep = document.createElement('div'); sep.className = 'post-more-sep'; menu.appendChild(sep); return; }
      const el = document.createElement('div'); el.className = 'post-more-item' + (item.danger ? ' danger' : '');
      el.innerHTML = `<i class="fa-solid ${item.icon}"></i><span>${item.label}</span>`;
      el.addEventListener('click', e => { e.stopPropagation(); handleAction(item.action, card); menu.remove(); });
      menu.appendChild(el);
    });
    return menu;
  }

  function handleAction(action, card) {
    if (action === 'edit') {
      openEditModal(card);

    } else if (action === 'pin') {
      const badge = card.querySelector('.post-pin-badge');
      if (!badge) return;
      const willPin = !badge.classList.contains('visible');
      badge.classList.toggle('visible', willPin);
      if (willPin) {
        const feed = document.querySelector('.feed');
        if (feed) feed.insertBefore(card, feed.firstChild);
        showNotification('📌 Post épinglé');
      } else {
        showNotification('📌 Post désépinglé');
      }

    } else if (action === 'hide') {
      addToHiddenPanel(card);
      card.style.transition = 'opacity .3s, transform .3s';
      card.style.opacity = '0'; card.style.transform = 'translateX(20px)';
      setTimeout(() => { card.style.display = 'none'; card.style.opacity = ''; card.style.transform = ''; }, 310);
      // Notification with shortcut to open panel
      const el = document.getElementById('notification');
      if (el) {
        el.innerHTML = `👁️ Post masqué &nbsp;<span id="_openHiddenBtn" style="text-decoration:underline;cursor:pointer;font-weight:900;">Voir les posts masqués →</span>`;
        el.style.display = 'flex'; clearTimeout(el._t); el._t = setTimeout(() => { el.style.display = 'none'; }, 5000);
        document.getElementById('_openHiddenBtn')?.addEventListener('click', () => { hiddenPostsOverlay.classList.add('active'); el.style.display = 'none'; });
      }

    } else if (action === 'delete') {
      const confirmOverlay = document.createElement('div');
      confirmOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,.6);backdrop-filter:blur(6px);z-index:2000;display:flex;justify-content:center;align-items:center;';
      confirmOverlay.innerHTML = `<div style="background:#fff;border:1px solid #e2ddd7;border-radius:18px;padding:28px 24px;width:100%;max-width:320px;box-shadow:0 24px 64px rgba(0,0,0,.22);text-align:center;animation:postModalIn .22s cubic-bezier(.34,1.3,.64,1) both;">
        <div style="width:48px;height:48px;background:#fee2e2;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:22px;">🗑️</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;color:#1a1714;margin-bottom:8px;">Supprimer ce post ?</div>
        <div style="font-size:12px;color:#8c8580;margin-bottom:22px;line-height:1.55;">Cette action est irréversible.</div>
        <div style="display:flex;gap:10px;">
          <button id="delCancelBtn" style="flex:1;padding:10px;border:1px solid #e2ddd7;border-radius:12px;background:transparent;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;cursor:pointer;">Annuler</button>
          <button id="delConfirmBtn" style="flex:1;padding:10px;border:none;border-radius:12px;background:#dc2626;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;cursor:pointer;">Supprimer</button>
        </div></div>`;
      document.body.appendChild(confirmOverlay);
      document.getElementById('delCancelBtn').addEventListener('click', () => confirmOverlay.remove());
      confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) confirmOverlay.remove(); });
      document.getElementById('delConfirmBtn').addEventListener('click', () => {
        confirmOverlay.remove();
        card.style.transition = 'opacity .3s, transform .3s'; card.style.opacity = '0'; card.style.transform = 'scale(.97)';
        setTimeout(() => card.remove(), 300); showNotification('🗑️ Post supprimé');
      });
    }
  }

  // Delegate .post-more clicks (works for dynamically added posts too)
  document.addEventListener('click', e => {
    const moreBtn = e.target.closest('.post-more');
    if (moreBtn) {
      e.stopPropagation();
      const card = moreBtn.closest('.post-card'); if (!card) return;
      const existing = card.querySelector('.post-more-menu');
      if (existing) { existing.remove(); return; }
      moreBtn.closest('.post-header').appendChild(buildMenu(card));
      return;
    }
    document.querySelectorAll('.post-more-menu').forEach(m => m.remove());
  });

  async function loadCategories() {
  const dropdown = document.getElementById('catDropdown');
  if (!dropdown) return;

  try {
    const res = await fetch('/Mini-Projet%20-%20Copy/api/get-all-categories.php');

    if (!res.ok) throw new Error('HTTP error ' + res.status);

    const result = await res.json();
    console.log('categories:', result);

    // ✅ FIX HERE
    const categories = result.data;

    if (!Array.isArray(categories)) {
      console.error('Not an array:', result);
      return;
    }

    dropdown.innerHTML = '';

    categories.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'cat-item';
      div.textContent = cat.titre;

      div.addEventListener('click', () => {
        addCategoryChip(cat); // your existing function
      });

      dropdown.appendChild(div);
    });

  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

loadCategories();

let categoriesLoaded = false;

if (pmCatBtn) {
  pmCatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    catDropdown.classList.toggle('open');

    // load only once or reload every time
    if (!categoriesLoaded) {
      loadCategories();
      categoriesLoaded = true;
    }
  });
}

// close when clicking outside

const selectedCategories = [];

function addCategoryChip(cat) {
  const container = document.getElementById('categoryChips');
  if (!container) return;

  // avoid duplicates
  if (selectedCategories.find(c => c.ID === cat.ID)) return;

  selectedCategories.push(cat);

  const chip = document.createElement('div');
  chip.className = 'category-chip';
  chip.dataset.id = cat.ID;

  chip.innerHTML = `
    <span>${cat.titre}</span>
    <button class="chip-remove">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  chip.querySelector('.chip-remove').addEventListener('click', () => {
    removeCategoryChip(cat.ID, chip);
  });

  container.appendChild(chip);
}

  function removeCategoryChip(id, element) {
  const index = selectedCategories.findIndex(c => c.ID === id);
  if (index !== -1) {
    selectedCategories.splice(index, 1);
  }

  element.remove();
}

const postPublishBtn = document.getElementById('postPublishBtn');


  postPublishBtn.addEventListener('click',publierService );


// Call function (for testing / auto run)


// ======================================
// Fonction pour publier un service
// ======================================
async function publierService() {
    console.log("publierService is called");

    try {
        const titre       = document.getElementById("postTitle").value.trim();
        const prix        = document.getElementById("postPrice").value.trim();
        const description = document.getElementById("postDesc").value.trim();

        // Validation
        if (!titre) {
            showNotification('⚠️ Le titre est obligatoire');
            return;
        }

        // Create form data
        const formData = new FormData();
        formData.append("titre", titre);
        formData.append("prix", prix);
        formData.append("description", description);

        // Add photos
        const photoInput = document.getElementById('pmPhotoInput');
        if (photoInput && photoInput.files.length > 0) {
            Array.from(photoInput.files).forEach(file => {
                formData.append('photos[]', file);
            });
        }

        // Add selected categories
        selectedCategories.forEach(category => {
            formData.append("categories[]", category.ID);
        });

        // Debug
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        const response = await fetch(
            '/Mini-Projet%20-%20Copy/api/update-service.php',
            {
                method: "POST",
                credentials: "include",
                body: formData
            }
        );

        const result = await response.json();
        console.log("Server response:", result);

    } catch (error) {
        console.error("Publish error:", error);
    }
}


// Exécuter la fonction au clic sur publier
document
    .getElementById("postPublishBtn")
    .addEventListener("click", publierService);



// ===============================
// Publish button click event
// ===============================
document
    .getElementById("postPublishBtn")
    .addEventListener(
        "click",
        publierService
    );



})();