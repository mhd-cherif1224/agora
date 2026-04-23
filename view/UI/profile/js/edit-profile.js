// ========================
// VARIABLES GLOBALES
// ========================
let cropperInstance = null;
let cropTarget      = null;
const cropModal     = document.getElementById("cropModal");
const cropImage     = document.getElementById("cropImage");

// ========================
// NOTIFICATIONS TOAST
// ========================
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "flex";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

// ========================
// DOMINANT COLORS
// ========================
function getDominantColors(source, topN = 2) {
    let canvas, ctx;
    if (source instanceof HTMLCanvasElement) {
        canvas = source; ctx = canvas.getContext('2d');
    } else {
        canvas = document.createElement('canvas'); ctx = canvas.getContext('2d');
        const MAX = 200;
        let w = source.naturalWidth || source.width;
        let h = source.naturalHeight || source.height;
        if (w > MAX || h > MAX) { const s = MAX / Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(source, 0, 0, w, h);
    }
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts = {};
    for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] < 128) continue;
        const r = Math.round(data[i]   /16)*16;
        const g = Math.round(data[i+1] /16)*16;
        const b = Math.round(data[i+2] /16)*16;
        const key = `${r},${g},${b}`;
        counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
        .sort((a,b) => b[1]-a[1]).slice(0,topN)
        .map(([key]) => {
            const [r,g,b] = key.split(',').map(Number);
            return { hex: '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('') };
        });
}

function adaptColor(hex, amount = 80) {
    let r = parseInt(hex.slice(1,3),16);
    let g = parseInt(hex.slice(3,5),16);
    let b = parseInt(hex.slice(5,7),16);
    const br = (r*299+g*587+b*114)/1000;
    if (br > 128) { r=Math.max(0,r-amount); g=Math.max(0,g-amount); b=Math.max(0,b-amount); }
    else          { r=Math.min(255,r+amount); g=Math.min(255,g+amount); b=Math.min(255,b+amount); }
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function changeBannerColor(color1, color2) {
    const br = h => {
        const r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
        return (r*299+g*587+b*114)/1000;
    };
    const dark  = br(color1) < br(color2) ? color1 : color2;
    const light = br(color1) < br(color2) ? color2 : color1;
    document.getElementById("bannerBottom").style.background =
        `linear-gradient(to right, ${dark}, ${light})`;
}

// ========================
// CROPPER
// ========================
function openCropper(file, target, aspectRatio) {
    cropTarget = target;
    const valid = ["image/jpeg","image/png","image/jpg","image/gif"];
    if (!valid.includes(file.type)) { showNotification("Format non supporté !"); return; }
    const reader = new FileReader();
    reader.onload = e => {
        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        cropImage.src = e.target.result;
        cropModal.classList.add("active");
        cropImage.onload = () => {
            cropperInstance = new Cropper(cropImage, {
                aspectRatio, viewMode:1, movable:true, zoomable:true,
                scalable:false, cropBoxResizable:true, background:false
            });
        };
    };
    reader.readAsDataURL(file);
}

function closeCropper() {
    cropModal.classList.remove("active");
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    document.getElementById("profileInput").value = "";
    document.getElementById("bannerInput").value  = "";
}

// Confirmer crop
document.getElementById("cropConfirm").addEventListener("click", () => {
    if (!cropperInstance) { showNotification("Erreur cropper."); return; }
    const canvas = cropperInstance.getCroppedCanvas({
        width:  cropTarget === "profile" ? 300  : 1200,
        height: cropTarget === "profile" ? 300  : 400,
        imageSmoothingQuality: "high"
    });
    if (!canvas) { showNotification("Erreur image."); return; }
    const url = canvas.toDataURL("image/jpeg", 0.92);

    if (cropTarget === "profile") {
        // Update profile circle
        document.getElementById("profilePreview").src = url;
        // Update nav avatar with same photo
        const navImg    = document.getElementById("navAvatarImg");
        const navLetter = document.getElementById("navAvatarLetter");
        navImg.src = url;
        navImg.style.display    = "block";
        navLetter.style.display = "none";
    } else {
        const t = document.getElementById("bannerTop");
        t.style.backgroundImage    = `url('${url}')`;
        t.style.backgroundSize     = "cover";
        t.style.backgroundPosition = "center";
        t.style.backgroundRepeat   = "no-repeat";
        const cols = getDominantColors(canvas, 2);
        changeBannerColor(cols[0].hex, adaptColor(cols[0].hex));
    }
    closeCropper();
});

document.getElementById("cropCancel").addEventListener("click", closeCropper);
cropModal.addEventListener("click", e => { if (e.target === cropModal) closeCropper(); });

// File inputs
document.getElementById("profileInput").addEventListener("change", function() {
    if (this.files[0]) openCropper(this.files[0], "profile", 1);
});
document.getElementById("bannerInput").addEventListener("change", function() {
    if (this.files[0]) openCropper(this.files[0], "banner", 125/27);
});

// ========================
// COLOR SWATCHES
// ========================
const COLORS = [
    '#f5c5a3','#fbd8b4','#fce4c5','#fbcbc8','#f9b8c5',
    '#c8e6c9','#b2ebf2','#bbdefb','#e1bee7','#fff9c4',
    '#ffccbc','#dcedc8','#f8bbd0','#b3e5fc','#d7ccc8',
    '#ffe0b2','#c5cae9','#b2dfdb','#e8eaf6','#fce4ec',
];
const grid = document.getElementById('colorGrid');
let activeSwatch = null;

COLORS.forEach((c, i) => {
    const sw = document.createElement('button');
    sw.className = 'color-swatch' + (i === 0 ? ' active' : '');
    sw.style.background = c;
    sw.title = c;
    if (i === 0) activeSwatch = sw;
    sw.addEventListener('click', () => {
        if (activeSwatch) activeSwatch.classList.remove('active');
        sw.classList.add('active');
        activeSwatch = sw;
        const dark = adaptColor(c, 70);
        document.getElementById('bannerBottom').style.background =
            `linear-gradient(120deg, ${dark}, ${c})`;
    });
    grid.appendChild(sw);
});

// ========================
// LIVE PREVIEW
// ========================
function updatePreview() {
    const nom     = document.getElementById('inputNom').value;
    const prenom  = document.getElementById('inputPrenom').value;
    const role    = document.getElementById('inputRole').value;
    const adresse = document.getElementById('inputAdresse').value;
    const full    = [nom, prenom].filter(Boolean).join(' ');

    document.getElementById('displayName').innerHTML =
        (full || 'Votre Nom') + ' <button class="cv-btn">+ Ajouter Votre CV</button>';
    document.getElementById('displayRole').textContent     = role    || 'Votre rôle';
    document.getElementById('displayLocation').innerHTML  =
        `<i class="fa-solid fa-location-dot"></i> ${adresse || 'Votre adresse'}`;

    // Update nav avatar letter only if no photo is set
    const navImg = document.getElementById("navAvatarImg");
    if (navImg.style.display === "none" || !navImg.src || navImg.src.endsWith("person.png")) {
        document.getElementById("navAvatarLetter").textContent =
            ([nom[0], prenom[0]].filter(Boolean).join('').toUpperCase()[0]) || 'M';
    }
}

['inputNom','inputPrenom','inputRole','inputAdresse'].forEach(id =>
    document.getElementById(id).addEventListener('input', updatePreview));

// ========================
// APPLY BUTTON
// ========================
document.getElementById('applyBtn').addEventListener('click', () => {
    updatePreview();
    showNotification("✓  Profil mis à jour !");
});


// ========================
// SEE ALL SUGGESTIONS
// ========================
const seeAllBtn       = document.getElementById('seeAllBtn');
const listPreview     = document.getElementById('suggestListPreview');
const listAll         = document.getElementById('suggestListAll');
let showingAll        = false;

seeAllBtn.addEventListener('click', e => {
    e.preventDefault();
    showingAll = !showingAll;
    if (showingAll) {
        listPreview.style.display = 'none';
        listAll.style.display     = 'flex';
        seeAllBtn.textContent     = '← réduire les suggestions';
    } else {
        listAll.style.display     = 'none';
        listPreview.style.display = 'flex';
        seeAllBtn.textContent     = 'voir tous les suggestions →';
    }
});

// ========================
// FAB — MESSAGE shortcut
// ========================
// document.getElementById('fabMsgBtn').addEventListener('click', () => {
//     window.location.href = 'messagerie.html';
// });

// ========================
// FAB — MESSAGE panel
// ========================
// ── chat.js ──
// Handles the floating chat panel open/close and message sending

document.addEventListener('DOMContentLoaded', () => {

  const panel      = document.getElementById('chatPanel');
  const closeBtn   = document.getElementById('chatPanelClose');
  const fabChatBtn = document.getElementById('fabMsgBtn');
  const navChatBtn = document.getElementById('navChat');
  const input      = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSend');
  const messages   = document.getElementById('chatMessages');

  const botPanel   = document.getElementById('chatbotPanel');
  const botCloseBtn= document.getElementById('chatbotClose');
  const fabHelpBtn = document.getElementById('fabHelpBtn');
  const botInput   = document.getElementById('chatbotInput');
  const botSendBtn = document.getElementById('chatbotSend');
  const botMessages= document.getElementById('chatbotMessages');

  function openChat()  { panel.classList.add('active'); }
  function closeChat() { panel.classList.remove('active'); }

  function openBotChat() { botPanel.classList.add('active'); }
  function closeBotChat() { botPanel.classList.remove('active'); }

  if (fabChatBtn) fabChatBtn.addEventListener('click', openChat);
  if (navChatBtn) navChatBtn.addEventListener('click', openChat);
  if (closeBtn)   closeBtn.addEventListener('click', closeChat);

  if (fabHelpBtn) fabHelpBtn.addEventListener('click', openBotChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const msg = document.createElement('div');
    msg.className = 'chat-msg sent';
    msg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    `;
    messages.appendChild(msg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  }

  function sendBotMessage() {
    const text = botInput.value.trim();
    if (!text) return;

    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    `;
    botMessages.appendChild(userMsg);
    botInput.value = '';
    botMessages.scrollTop = botMessages.scrollHeight;

    // Get user ID from localStorage
    const userId = localStorage.getItem('utilisateur_id') || localStorage.getItem('admin_id') || 'anonymous';

    // Send to bot API
    fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: text,
        user_id: userId
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg received';
        botMsg.innerHTML = `
          <div class="msg-bubble">${escapeHtml(data.response)}</div>
          <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
        `;
        botMessages.appendChild(botMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      } else if (data.error) {
        console.error('Bot error:', data.error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'chat-msg received';
        errorMsg.innerHTML = `
          <div class="msg-bubble">Désolé, une erreur s'est produite.</div>
          <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
        `;
        botMessages.appendChild(errorMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'chat-msg received';
      errorMsg.innerHTML = `
        <div class="msg-bubble">Impossible de contacter l'assistant.</div>
        <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
      `;
      botMessages.appendChild(errorMsg);
      botMessages.scrollTop = botMessages.scrollHeight;
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input)   input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

});



const cvInput = document.getElementById("cvInput");
const cvName = document.getElementById("cvName");

let fileURL = null;

cvInput.addEventListener("change", function () {
    if (this.files.length > 0) {
        const file = this.files[0];

        // créer un lien temporaire
        fileURL = URL.createObjectURL(file);

        // afficher le nom
        cvName.textContent = "📄 " + file.name;

        // rendre cliquable
        cvName.style.cursor = "pointer";
        cvName.style.textDecoration = "underline";
    }
});

// ouvrir le fichier au clic
cvName.addEventListener("click", function () {
    if (fileURL) {
        window.open(fileURL, "_blank");
    }
});


// ========================
// LINKS WIDGET
// Remplace tout le bloc depuis "const openBtn" jusqu'à "displayLinks();"
// ========================

const openBtn      = document.getElementById("openModal");
const modal        = document.getElementById("linkModal");
const closeBtn     = document.getElementById("closeModal");
const saveBtn      = document.querySelector(".save-btn");
const input        = document.getElementById("modalLinkInput");
const container    = document.getElementById("linksContainer");
const emptyMsg     = document.getElementById("linksEmpty");
const badge        = document.getElementById("linksBadge");
const toggleBtn    = document.getElementById("linksToggleBtn");
const dropdown     = document.getElementById("linksDropdown");

let links = JSON.parse(localStorage.getItem("links")) || [];

// ── Toggle dropdown ──
toggleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("open");
  toggleBtn.classList.toggle("active");
});

// Fermer dropdown en cliquant ailleurs
document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target) && e.target !== toggleBtn) {
    dropdown.classList.remove("open");
    toggleBtn.classList.remove("active");
  }
});

// ── Afficher les liens ──
function displayLinks() {
  container.innerHTML = "";

  links.forEach((link, index) => {
    const div = document.createElement("div");
    div.className = "link-item";

    // Icône
    const icon = document.createElement("div");
    icon.className = "link-item-icon";
    icon.innerHTML = '<i class="fa-solid fa-link"></i>';

    // Lien — afficher le domaine seulement
    const a = document.createElement("a");
    try {
      a.textContent = new URL(link).hostname.replace("www.", "");
    } catch {
      a.textContent = link;
    }
    a.href   = link;
    a.title  = link;
    a.target = "_blank";
    a.addEventListener("click", (e) => e.stopPropagation());

    // Bouton supprimer
    const delBtn = document.createElement("button");
    delBtn.innerHTML  = "&#x2715;";
    delBtn.className  = "delete-btn";
    delBtn.title      = "Supprimer";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      links.splice(index, 1);
      localStorage.setItem("links", JSON.stringify(links));
      displayLinks();
    });

    div.appendChild(icon);
    div.appendChild(a);
    div.appendChild(delBtn);
    container.appendChild(div);
  });

  // Vide ou pas
  emptyMsg.style.display = links.length === 0 ? "block" : "none";

  // Badge
  if (links.length > 0) {
    badge.textContent    = links.length;
    badge.style.display  = "flex";
  } else {
    badge.style.display  = "none";
  }
}

// ── Ouvrir modal ──
openBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.remove("open");
  toggleBtn.classList.remove("active");
  modal.style.display = "flex";
  document.body.classList.add("modal-open");
  setTimeout(() => input.focus(), 50);
});

// ── Fermer modal ──
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
  input.value = "";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    input.value = "";
  }
});

// Touche Entrée pour valider
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

// ── Enregistrer lien ──
saveBtn.addEventListener("click", () => {
  const link = input.value.trim();
  if (!link)                    { showNotification("⚠️  Entrez un lien !"); return; }
  if (!link.startsWith("http")) { showNotification("⚠️  Lien invalide !"); return; }

  links.push(link);
  localStorage.setItem("links", JSON.stringify(links));
  input.value = "";
  modal.style.display = "none";
  document.body.classList.remove("modal-open");

  displayLinks();
  showNotification("✓  Lien ajouté !");
});

// ── Init ──
displayLinks();