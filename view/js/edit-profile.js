// ========================
// VARIABLES GLOBALES
// ========================
let cropperInstance = null;
let cropTarget      = null;
const cropModal     = document.getElementById("cropModal");
const cropImage     = document.getElementById("cropImage");

// ========================
// NOTIFICATIONS
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
        if (w > MAX || h > MAX) {
            const s = MAX / Math.max(w, h);
            w = Math.round(w * s); h = Math.round(h * s);
        }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(source, 0, 0, w, h);
    }
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts = {};
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = Math.round(data[i]     / 16) * 16;
        const g = Math.round(data[i + 1] / 16) * 16;
        const b = Math.round(data[i + 2] / 16) * 16;
        const key = `${r},${g},${b}`;
        counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]).slice(0, topN)
        .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { hex: '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('') };
        });
}

function adaptColor(hex, amount = 80) {
    let r = parseInt(hex.slice(1,3),16);
    let g = parseInt(hex.slice(3,5),16);
    let b = parseInt(hex.slice(5,7),16);
    const br = (r*299 + g*587 + b*114) / 1000;
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

// ── Confirmer ──
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
        document.getElementById("profilePreview").src = url;
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

// ── File inputs ──
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
        // change the banner-bottom gradient with chosen color
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
    document.getElementById('displayRole').textContent = role    || 'Votre rôle';
    document.getElementById('displayLocation').innerHTML =
        `<i class="fa-solid fa-location-dot"></i> ${adresse || 'Votre adresse'}`;

    document.getElementById('navAvatar').textContent =
        ([nom[0], prenom[0]].filter(Boolean).join('').toUpperCase()[0]) || 'M';
}

['inputNom','inputPrenom','inputRole','inputAdresse'].forEach(id =>
    document.getElementById(id).addEventListener('input', updatePreview));

// ========================
// APPLY
// ========================
document.getElementById('applyBtn').addEventListener('click', () => {
    updatePreview();
    showNotification("✓  Profil mis à jour !");
});

