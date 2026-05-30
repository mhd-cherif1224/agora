// ════════════════════════════════════════
// MAKE A POST MODAL + POST-MORE MENU
// ════════════════════════════════════════

function buildPhotoUrl(path) {
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('http')) return path;
  return `../../../${path}`;
}

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

// ── user profile load ──
loadUserProfile();

async function loadUserProfile() {
  try {
    const res = await fetch('../../../api/get-profile.php');
    if (res.status === 401) {
      window.location.href = '../../../html/login.html';
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
      role: data.role,
      avatar: buildPhotoUrl(data.avatar)
    };
    const pmAvatar      = document.getElementById('pmAvatar');
    const postModalName = document.querySelector('.post-modal-name');
    const postModalRole = document.querySelector('.post-modal-role');
    if (data.nom) {
      postModalName.textContent = data.nom;
    } else {
      console.log("error loading the post modal name");
    }
    if (data.role || data.status || data.specialite) {
      postModalRole.textContent = data.role || data.status || data.specialite || '';
    } else {
      postModalRole.style.display = 'none';
    }
    if (data.avatar) {
      pmAvatar.src = buildPhotoUrl(data.avatar);
      pmAvatar.style.display = 'block';
    } else {
      console.log("error loading the pmAvatar");
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
// CONVERT a File to a JPEG Blob via canvas
// ════════════════════════════════════════
function fileToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load failed'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
          'image/jpeg',
          0.92
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════
// MAKE A POST MODAL
// ════════════════════════════════════════
(function () {

  let selectedCats = new Set(), scheduledAt = null, locationValue = '';
  let pollActive = false, pollOptions = ['', ''], pollDuration = '1';
  let selectedStatus = 'disponible';
  let categories = [];
  let selectedCategories = [];

  const overlay         = document.getElementById('postModalOverlay');
  const closeBtn        = document.getElementById('postModalClose');
  const preview         = document.getElementById('postPreview');
  const publishBtn      = document.getElementById('postPublishBtn');
  const pmPhotoBtn      = document.getElementById('pmPhotoBtn');
  const pmPhotoInput    = document.getElementById('pmPhotoInput');
  const pmLocBtn        = document.getElementById('pmLocBtn');
  const locModal        = document.getElementById('locModal');
  const locInput        = document.getElementById('locInput');
  const locConfirm      = document.getElementById('locConfirm');
  const locationChip    = document.getElementById('locationChip');
  const locationText    = document.getElementById('locationText');
  const locationRemove  = document.getElementById('locationRemove');
  const pmCatBtn        = document.getElementById('pmCatBtn');
  const catDropdown     = document.getElementById('catDropdown');
  const catChipsBox     = document.getElementById('categoryChips');
  const pmTimerBtn      = document.getElementById('pmTimerBtn');
  const timerModal      = document.getElementById('timerModal');
  const timerDate       = document.getElementById('timerDate');
  const timerTime       = document.getElementById('timerTime');
  const timerConfirm    = document.getElementById('timerConfirm');
  const timerClose      = document.getElementById('timerModalClose');
  const scheduledChip   = document.getElementById('scheduledChip');
  const scheduledText   = document.getElementById('scheduledText');
  const scheduledRemove = document.getElementById('scheduledRemove');
  const pmStatusBtn     = document.getElementById('pmStatusBtn');
  const statusModal     = document.getElementById('statusModal');

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

  // ── Modal open / close / reset ──
  function openModal(focusOnPhoto) {
    const tmr = new Date(Date.now() + 86400000);
    timerDate.value = tmr.toISOString().split('T')[0];
    timerTime.value = '10:00';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { if (focusOnPhoto) pmPhotoInput.click(); }, 80);
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function resetModal() {
    selectedCats.clear(); scheduledAt = null; locationValue = '';
    pollActive = false; pollOptions = ['', '']; pollDuration = '1';
    attachedPhotos = [];
    renderPreview();
    [scheduledChip, locationChip].forEach(c => c.classList.remove('visible'));
    [pmTimerBtn, pmCatBtn, pmLocBtn].forEach(b => b.classList.remove('active'));

    // ← Toujours réinitialiser le bouton (supprimer la condition editMode)
    publishBtn.classList.remove('scheduled');
    publishBtn.innerHTML = 'publier';
    delete publishBtn.dataset.editMode;
    delete publishBtn.dataset.editId;

    catDropdown.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
    selectedStatus = 'disponible';
    statusModal.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
    pmStatusBtn.classList.remove('active');

    const postTitle = document.getElementById('postTitle');
    const postDesc  = document.getElementById('postDesc');
    const postPrice = document.getElementById('postPrice');
    if (postTitle) postTitle.value = '';
    if (postDesc)  postDesc.value  = '';
    if (postPrice) postPrice.value = '';

    selectedCategories = [];
    if (catChipsBox) catChipsBox.innerHTML = '';
}

  // ── Composer triggers ──
  const composerInput = document.getElementById('composerTrigger');
  const composerPhoto = document.getElementById('composerPhotoBtn');
  const composerCal   = document.getElementById('composerCalBtn');
  if (composerInput) composerInput.addEventListener('click', () => openModal(false));
  if (composerPhoto) composerPhoto.addEventListener('click', () => openModal(true));
  if (composerCal)   composerCal.addEventListener('click', () => { openModal(false); setTimeout(() => pmTimerBtn.click(), 120); });

  closeBtn.addEventListener('click', () => { closeModal(); resetModal(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) { closeModal(); resetModal(); } });

  // ── Photo ──
  pmPhotoBtn.addEventListener('click', () => { pmPhotoInput.click(); });
  pmPhotoInput.addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      if (file.type === 'image/gif') {
        showNotification('⚠️ Les GIFs animés ne sont pas acceptés');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        attachedPhotos.push({ url: e.target.result, file: file });
        renderPreview();
      };
      reader.readAsDataURL(file);
    });
    this.value = '';
  });

  function renderPreview() {
    preview.innerHTML = '';
    attachedPhotos.forEach((photo, idx) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `<img src="${photo.url}" alt="">`;
      const rm = document.createElement('button');
      rm.className = 'preview-remove';
      rm.innerHTML = '×';
      rm.addEventListener('click', () => { attachedPhotos.splice(idx, 1); renderPreview(); });
      div.appendChild(rm);
      preview.appendChild(div);
    });
    preview.classList.toggle('has-items', attachedPhotos.length > 0);
  }

  // ── Location ──
  pmLocBtn.addEventListener('click', e => {
    e.stopPropagation();
    locModal.classList.toggle('open');
    timerModal.classList.remove('open');
    if (locModal.classList.contains('open')) setTimeout(() => locInput.focus(), 50);
  });
  locConfirm.addEventListener('click', () => {
    const val = locInput.value.trim();
    if (!val) return;
    locationValue = val;
    locationText.textContent = val;
    locationChip.classList.add('visible');
    pmLocBtn.classList.add('active');
    locModal.classList.remove('open');
  });
  locInput.addEventListener('keydown', e => { if (e.key === 'Enter') locConfirm.click(); });
  locationRemove.addEventListener('click', () => {
    locationValue = '';
    locationChip.classList.remove('visible');
    pmLocBtn.classList.remove('active');
    locInput.value = '';
  });

  // ── Category ──
  pmCatBtn.addEventListener('click', e => {
    e.stopPropagation();
    catDropdown.classList.toggle('open');
    timerModal.classList.remove('open');
    locModal.classList.remove('open');
    pmCatBtn.classList.toggle('active', catDropdown.classList.contains('open'));
    loadCategories();
  });

  async function loadCategories() {
    if (categories.length > 0) { renderCategoryDropdown(); return; }
    try {
      const response = await fetch('../../../api/get-all-categories.php');
      const result   = await response.json();
      if (result.success) { categories = result.data; renderCategoryDropdown(); }
    } catch (error) {
      console.error("Category loading error:", error);
    }
  }

  function renderCategoryDropdown() {
    catDropdown.innerHTML = '';
    categories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'cat-option';
      item.textContent = category.titre;
      item.addEventListener('click', () => selectCategory(category));
      catDropdown.appendChild(item);
    });
  }

  function selectCategory(category) {
    const exists = selectedCategories.some(c => c.ID == category.ID);
    if (exists) { showNotification("⚠️ Catégorie déjà ajoutée"); return; }
    selectedCategories.push(category);
    renderCatChips();
    catDropdown.classList.remove('open');
  }

  function renderCatChips() {
    if (!catChipsBox) return;
    catChipsBox.innerHTML = '';
    selectedCategories.forEach(category => {
      const chip = document.createElement('div');
      chip.className = 'category-chip';
      chip.innerHTML = `<span>${category.titre}</span><button>x</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        selectedCategories = selectedCategories.filter(cat => cat.ID != category.ID);
        renderCatChips();
      });
      catChipsBox.appendChild(chip);
    });
  }

  // ── Timer ──
  pmTimerBtn.addEventListener('click', e => {
    e.stopPropagation();
    timerModal.classList.toggle('open');
    catDropdown.classList.remove('open');
    locModal.classList.remove('open');
    pmTimerBtn.classList.toggle('active', timerModal.classList.contains('open'));
  });
  timerClose.addEventListener('click', () => { timerModal.classList.remove('open'); pmTimerBtn.classList.remove('active'); });
  timerConfirm.addEventListener('click', () => {
    const d = timerDate.value, t = timerTime.value;
    if (!d || !t) { showNotification('⚠️ Choisissez une date et une heure'); return; }
    scheduledAt = new Date(`${d}T${t}`);
    if (scheduledAt <= new Date()) { showNotification('⚠️ La date doit être dans le futur'); scheduledAt = null; return; }
    const fmt = scheduledAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' à ' + t;
    scheduledText.textContent = `Programmé · ${fmt}`;
    scheduledChip.classList.add('visible');
    pmTimerBtn.classList.add('active');
    publishBtn.classList.add('scheduled');
    publishBtn.innerHTML = `<i class="fa-regular fa-clock"></i> Programmer`;
    timerModal.classList.remove('open');
  });
  scheduledRemove.addEventListener('click', () => {
    scheduledAt = null;
    scheduledChip.classList.remove('visible');
    pmTimerBtn.classList.remove('active');
    publishBtn.classList.remove('scheduled');
    publishBtn.innerHTML = 'publier';
  });

  // ── Status ──
  pmStatusBtn.addEventListener('click', e => {
    e.stopPropagation();
    statusModal.classList.toggle('open');
    timerModal.classList.remove('open');
    locModal.classList.remove('open');
    catDropdown.classList.remove('open');
  });
  statusModal.querySelectorAll('.status-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedStatus = opt.dataset.value;
      statusModal.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      pmStatusBtn.classList.add('active');
      statusModal.classList.remove('open');
      showNotification(`✓ Statut : ${opt.textContent.trim()}`);
    });
  });

  // ── Poll chip ──
  setTimeout(() => {
    const scrollArea = document.querySelector('.post-modal-scroll');
    if (scrollArea && !document.getElementById('pollChip')) {
      const pollChipEl = document.createElement('div');
      pollChipEl.className = 'poll-chip';
      pollChipEl.id = 'pollChip';
      pollChipEl.innerHTML = `<i class="fa-solid fa-chart-bar"></i><span>Sondage actif</span><button class="poll-chip-remove" id="pollChipRemove"><i class="fa-solid fa-xmark"></i></button>`;
      scrollArea.appendChild(pollChipEl);
      const pollBuilderEl = document.createElement('div');
      pollBuilderEl.className = 'poll-builder';
      pollBuilderEl.id = 'pollBuilder';
      scrollArea.appendChild(pollBuilderEl);
    }
  }, 0);

  // ── Close sub-popups on outside click ──
  document.addEventListener('click', e => {
    if (!catDropdown.contains(e.target) && e.target !== pmCatBtn) catDropdown.classList.remove('open');
    if (!timerModal.contains(e.target) && e.target !== pmTimerBtn) timerModal.classList.remove('open');
    if (!statusModal.contains(e.target) && e.target !== pmStatusBtn) statusModal.classList.remove('open');
  });

  // ════════════════════════════════════════
  // PUBLISH BUTTON
  // ════════════════════════════════════════
  publishBtn.addEventListener('click', async () => {
    const isEdit = publishBtn.dataset.editMode === 'true';
    await publierService();
    if (!isEdit) {
      if (scheduledAt) {
        const delay = scheduledAt - Date.now();
        const fmt = scheduledAt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        showNotification(`🕐 Post programmé · ${fmt}`);
        setTimeout(() => { showNotification('✓ Post publié automatiquement !'); }, delay);
      }
      closeModal();
      resetModal();
    }
  });

  // ════════════════════════════════════════
  // PUBLIER SERVICE — à l'intérieur du IIFE
  // ════════════════════════════════════════
  async function publierService() {
    const isEdit  = publishBtn.dataset.editMode === 'true';
    const editId  = publishBtn.dataset.editId;

    console.log("isEdit:", isEdit, "editId:", editId);

    const titre       = document.getElementById("postTitle").value.trim();
    const prixRaw     = document.getElementById("postPrice").value.trim();
    const prix        = isNaN(parseFloat(prixRaw)) ? 0 : parseFloat(prixRaw);
    const description = document.getElementById("postDesc").value.trim();

    if (!titre) { showNotification('⚠️ Le titre est obligatoire'); return; }

    // Vérification catégorie ──
    if (selectedCategories.length === 0) {
        showNotification('⚠️ Veuillez sélectionner au moins une catégorie');
        return;
    }

    const formData = new FormData();
    formData.append("titre", titre);
    formData.append("description", description);
    formData.append("prix", prix);
    formData.append("prix_affichage", prixRaw);
    formData.append("status", selectedStatus);

    // ── Photos ──
    if (attachedPhotos.length > 0) {
      try {
        const photoBlobs = await Promise.all(
          attachedPhotos.map(photo => fileToBlob(photo.file))
        );
        photoBlobs.forEach((blob, i) => {
          formData.append('photos[]', blob, `photo_${i + 1}.jpg`);
        });
      } catch (imgErr) {
        showNotification('❌ Erreur lors du traitement des images');
        return;
      }
    }

    // ── Catégories ──
    selectedCategories.forEach(category => {
      formData.append("categories[]", category.ID);
    });

   if (isEdit) {
      formData.append("id", editId);
      try {
        const res    = await fetch('../../../api/update-service.php', {
          method: 'POST', credentials: 'include', body: formData
        });
        const result = JSON.parse(await res.text());
        if (result.success) {
          showNotification('✅ Service modifié avec succès !');
          closeModal();  
          resetModal();  
          if (typeof window.loadServices === 'function') await window.loadServices();
          else if (typeof refreshService === 'function') await refreshService(editId);
        } else {
          showNotification('❌ ' + (result.message || 'Erreur'));
        }
      } catch (err) {
        console.error(err);
        showNotification('❌ Erreur réseau');
      }
    } 
  }

  // ════════════════════════════════════════
  // OPEN MODAL EN MODE ÉDITION (appelé depuis feed.js)
  // ════════════════════════════════════════
  window.openEditServiceFromFeed = async function(service, serviceId) {

    // 1. Réinitialiser d'abord
    resetModal();

    // 2. Remplir les champs texte
    const matchPrix = (service.description || '').match(/\[prix_texte:(.+?)\]/);
    const cleanDesc = matchPrix
      ? service.description.replace(/\[prix_texte:.+?\]/, '').trim()
      : (service.description || '');

    document.getElementById('postTitle').value = service.titre || '';
    document.getElementById('postPrice').value = matchPrix ? matchPrix[1] : (service.prix || '');
    document.getElementById('postDesc').value  = cleanDesc;

    // 3. Statut
    selectedStatus = service.status || 'disponible';
    statusModal.querySelectorAll('.status-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.value === selectedStatus);
    });
    if (selectedStatus !== 'disponible') pmStatusBtn.classList.add('active');

    // 4. Photo existante
    if (service.service_photo) {
      const photoUrl = buildPhotoUrl(service.service_photo);
      attachedPhotos = [{ url: photoUrl, file: null, existing: true }];
      preview.innerHTML = `
        <div class="preview-item">
          <img src="${photoUrl}" alt="">
          <button class="preview-remove" id="existingPhotoRemove">×</button>
        </div>`;
      preview.classList.add('has-items');
      document.getElementById('existingPhotoRemove').addEventListener('click', () => {
        attachedPhotos = [];
        preview.innerHTML = '';
        preview.classList.remove('has-items');
      });
    }

    // 5. Catégories — charger si besoin puis pré-remplir selectedCategories
    if (categories.length === 0) {
      try {
        const res    = await fetch('../../../api/get-all-categories.php');
        const result = await res.json();
        if (result.success) categories = result.data;
      } catch(e) { console.error(e); }
    }

    selectedCategories = [];
    if (service.categorie) {
      service.categorie.split(',').map(c => c.trim()).filter(Boolean).forEach(catName => {
        const found = categories.find(c => c.titre === catName);
        if (found) selectedCategories.push(found);
      });
    }
    renderCatChips();

    // 6. Marquer le bouton en mode édition
    publishBtn.dataset.editMode = 'true';
    publishBtn.dataset.editId   = serviceId;
    publishBtn.innerHTML = '<i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Enregistrer';

    // 7. Ouvrir le modal
    openModal(false);
  };

})(); // ← fermeture du premier IIFE


// ════════════════════════════════════════
// POST-MORE MENU + FULL EDIT MODAL
// ════════════════════════════════════════
(function () {

  

  // ════ EDIT MODAL ════
  const editOverlay = document.createElement('div');
  editOverlay.className = 'edit-post-overlay';
  editOverlay.id = 'editPostOverlay';
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

  function closeEditModal() {
    editOverlay.classList.remove('active');
    document.body.style.overflow = '';
    editTargetCard = null;
  }

  function _addEditPreviewItem(area, src, isExisting) {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `<img src="${src}" alt="">`;
    const rm = document.createElement('button');
    rm.className = 'preview-remove';
    rm.innerHTML = '×';
    rm.addEventListener('click', () => {
      if (isExisting) editKeptPhotos = editKeptPhotos.filter(k => k.src !== src);
      else editNewPhotos = editNewPhotos.filter(p => p.url !== src);
      div.remove();
    });
    div.appendChild(rm);
    area.appendChild(div);
  }

  // Photo input
  document.getElementById('editPhotoBtn').addEventListener('click', () => document.getElementById('editPhotoInput').click());
  document.getElementById('editPhotoInput').addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        editNewPhotos.push({ url: e.target.result });
        _addEditPreviewItem(document.getElementById('editPreviewArea'), e.target.result, false);
      };
      reader.readAsDataURL(file);
    });
    this.value = '';
  });

  // Location in edit modal
  const editLocBtn   = document.getElementById('editLocBtn');
  const editLocModal = document.getElementById('editLocModal');
  const editLocInput = document.getElementById('editLocInput');
  const editCatBtn   = document.getElementById('editCatBtn');
  const editCatDD    = document.getElementById('editCatDropdown');

  editLocBtn.addEventListener('click', e => {
    e.stopPropagation();
    editLocModal.classList.toggle('open');
    editCatDD.classList.remove('open');
    if (editLocModal.classList.contains('open')) setTimeout(() => editLocInput.focus(), 40);
  });
  document.getElementById('editLocConfirm').addEventListener('click', () => {
    const val = editLocInput.value.trim();
    if (!val) return;
    editLocation = val;
    document.getElementById('editLocChipText').textContent = val;
    document.getElementById('editLocChip').classList.add('visible');
    editLocBtn.classList.add('active');
    editLocModal.classList.remove('open');
  });
  editLocInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('editLocConfirm').click(); });
  document.getElementById('editLocChipRemove').addEventListener('click', () => {
    editLocation = '';
    document.getElementById('editLocChip').classList.remove('visible');
    editLocBtn.classList.remove('active');
    editLocInput.value = '';
  });

  // Category in edit modal
  editCatBtn.addEventListener('click', e => {
    e.stopPropagation();
    editCatDD.classList.toggle('open');
    editLocModal.classList.remove('open');
    editCatBtn.classList.toggle('active', editCatDD.classList.contains('open'));
  });

  document.addEventListener('click', e => {
    if (editOverlay.classList.contains('active')) {
      if (!editCatDD.contains(e.target) && e.target !== editCatBtn) editCatDD.classList.remove('open');
      if (!editLocModal.contains(e.target) && e.target !== editLocBtn) editLocModal.classList.remove('open');
    }
  });

  document.getElementById('editPostClose').addEventListener('click', closeEditModal);
  editOverlay.addEventListener('click', e => { if (e.target === editOverlay) closeEditModal(); });

  // SAVE edit
  document.getElementById('editSaveBtn').addEventListener('click', () => {
    if (!editTargetCard) return;
    const card    = editTargetCard;
    const newText = document.getElementById('editPostTextarea').value.trim();

    // 1. Text
    let bodyEl = card.querySelector('.post-body');
    if (newText) {
      if (!bodyEl) {
        bodyEl = document.createElement('div');
        bodyEl.className = 'post-body';
        bodyEl.style.cssText = 'padding:0 18px 14px;';
        const anchor = card.querySelector('.post-actions') || card.querySelector('.post-rating-summary');
        anchor ? anchor.before(bodyEl) : card.appendChild(bodyEl);
      }
      bodyEl.innerHTML = newText.replace(/\n/g, '<br>');
    } else if (bodyEl) { bodyEl.remove(); }

    // 2. Location
    let locDiv = card.querySelector('[data-loc]');
    if (editLocation) {
      if (!locDiv) {
        locDiv = document.createElement('div');
        locDiv.className = 'post-loc-chip';
        locDiv.style.cssText = 'padding:0 18px 10px;font-size:11px;color:#8c8580;display:flex;align-items:center;gap:5px;';
        const anchor = card.querySelector('.post-body') || card.querySelector('.post-actions') || card.querySelector('.post-rating-summary');
        anchor ? anchor.before(locDiv) : card.appendChild(locDiv);
      }
      locDiv.dataset.loc = editLocation;
      locDiv.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#e8734a;font-size:10px;"></i>${editLocation}`;
    } else if (locDiv) { locDiv.remove(); }

    // 3. Remove old images
    card.querySelectorAll('img.post-image, .post-card > img:not(.post-avatar)').forEach(img => img.remove());

    // 4. Re-inject kept + new images
    const imgAnchor = card.querySelector('.post-rating-summary') || card.querySelector('.post-actions');
    editKeptPhotos.forEach(({ src }) => {
      const img = document.createElement('img');
      img.className = 'post-image'; img.src = src; img.style.display = 'block';
      imgAnchor ? imgAnchor.before(img) : card.appendChild(img);
    });
    editNewPhotos.forEach(({ url }) => {
      const img = document.createElement('img');
      img.className = 'post-image'; img.src = url; img.style.display = 'block';
      imgAnchor ? imgAnchor.before(img) : card.appendChild(img);
    });

    // 5. Edit mark
    const timeEl = card.querySelector('.post-time');
    if (timeEl) {
      const fmt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      let mark = timeEl.querySelector('.edit-mark');
      if (!mark) {
        mark = document.createElement('span');
        mark.className = 'edit-mark';
        mark.style.cssText = 'margin-left:6px;font-size:10px;color:#8c8580;font-style:italic;';
        timeEl.appendChild(mark);
      }
      mark.textContent = `· modifié à ${fmt}`;
    }

    closeEditModal();
    showNotification('✏️ Post modifié avec succès !');
  });

})(); 