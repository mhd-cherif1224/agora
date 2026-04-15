// ========================
// VARIABLES GLOBALES
// ========================
let cropperInstance = null;
let cropTarget      = null;
let profileBase64   = null;
let banniereBase64  = null;

const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");

const COMPLETE_URL = "../../Controller/complete-signup.php";

console.log("script loaded");

// ========================
// NOTIFICATIONS
// ========================
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

// ========================
// DOMINANT COLORS
// ========================
function getDominantColors(source, topN = 2) {
    let canvas, ctx;
    if (source instanceof HTMLCanvasElement) {
        canvas = source;
        ctx = canvas.getContext('2d');
    } else {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        const MAX = 200;
        let w = source.naturalWidth || source.width;
        let h = source.naturalHeight || source.height;
        if (w > MAX || h > MAX) {
            const scale = MAX / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
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
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { rgb: `rgb(${r},${g},${b})`, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') };
        });
}

function adaptColor(hex, amount = 80) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const brightness = (r*299 + g*587 + b*114) / 1000;
    if (brightness > 128) { r=Math.max(0,r-amount); g=Math.max(0,g-amount); b=Math.max(0,b-amount); }
    else                  { r=Math.min(255,r+amount); g=Math.min(255,g+amount); b=Math.min(255,b+amount); }
    return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function changeBannerColor(color1, color2) {
    const brightness = hex => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return (r*299+g*587+b*114)/1000; };
    const dark  = brightness(color1) < brightness(color2) ? color1 : color2;
    const light = brightness(color1) < brightness(color2) ? color2 : color1;
    document.querySelector(".banner-bottom").style.background = `linear-gradient(to right, ${dark}, ${light})`;
}

// ========================
// CROPPER
// ========================
function openCropper(file, target, aspectRatio) {
    cropTarget = target;
    const validTypes = ["image/jpeg","image/png","image/jpg","image/gif"];
    if (!validTypes.includes(file.type)) { showNotification("Format non supporté !"); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        cropImage.src = e.target.result;
        cropModal.classList.add("active");
        cropImage.onload = function() {
            cropperInstance = new Cropper(cropImage, {
                aspectRatio, viewMode:1, movable:true, zoomable:true,
                scalable:false, cropBoxResizable:true, background:false,
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

document.getElementById("cropConfirm").addEventListener("click", function() {
    if (!cropperInstance) { showNotification("Erreur : cropper non initialisé."); return; }

    const canvas = cropperInstance.getCroppedCanvas({
        width:  cropTarget === "profile" ? 300  : 1200,
        height: cropTarget === "profile" ? 300  : 400,
        imageSmoothingQuality: "high",
    });
    if (!canvas) { showNotification("Erreur : impossible de récupérer l'image."); return; }

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);

    if (cropTarget === "profile") {
        document.getElementById("profilePreview").src = croppedDataUrl;
        profileBase64 = croppedDataUrl;
    } else {
        const bannerTop = document.querySelector(".banner-top");
        bannerTop.style.backgroundImage    = `url('${croppedDataUrl}')`;
        bannerTop.style.backgroundSize     = "cover";
        bannerTop.style.backgroundPosition = "center";
        banniereBase64 = croppedDataUrl;
        const colors = getDominantColors(canvas, 2);
        changeBannerColor(colors[0].hex, adaptColor(colors[0].hex));
    }
    closeCropper();
});

document.getElementById("cropCancel").addEventListener("click", closeCropper);
cropModal.addEventListener("click", e => { if (e.target === cropModal) closeCropper(); });

document.getElementById("profileInput").addEventListener("change", function() {
    if (this.files[0]) openCropper(this.files[0], "profile", 1);
});
document.getElementById("bannerInput").addEventListener("change", function() {
    if (this.files[0]) openCropper(this.files[0], "banner", 125/27);
});

// ========================
// ENVOI FINAL → BDD
// ========================
async function finaliserInscription() {
    const btn = document.querySelector(".finish") || document.querySelector(".skip");
    if (btn) { btn.disabled = true; btn.textContent = "Enregistrement..."; }

    try {
        const response = await fetch(COMPLETE_URL, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                photo_profil:   profileBase64  || null,
                photo_banniere: banniereBase64 || null,
            }),
        });

        const result = await response.json();

        if (result.success) {
            showNotification("Inscription terminée !");
            setTimeout(() => { window.location.href = "login-user.html"; }, 1500);
        } else {
            showNotification("Erreur : " + (result.message || "Inscription échouée."));
            if (btn) { btn.disabled = false; btn.textContent = btn.classList.contains("finish") ? "Terminer" : "Passer"; }
        }
    } catch (err) {
        showNotification("Erreur réseau : " + err.message);
        if (btn) { btn.disabled = false; }
    }
}

document.querySelector(".finish").addEventListener("click", finaliserInscription);
document.querySelector(".skip").addEventListener("click",   finaliserInscription);

// ========================
// BACK
// ========================
document.getElementById("back").addEventListener("click", () => {
    window.location.href = "user-formulaire.html";
});

// ========================
// PROGRESS BAR
// ========================
const progressBar = document.querySelector(".progress-bar");

function animateProgress(from, to, duration = 600) {
    const style    = document.createElement("style");
    const animName = `loadProgress${Date.now()}`;
    style.innerHTML = `@keyframes ${animName} { from { width: ${from}; } to { width: ${to}; } }`;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;
    setTimeout(() => { progressBar.style.width = to; progressBar.style.animation = ""; style.remove(); }, duration);
}

if (progressBar) animateProgress("75%", "98%");

const response = await fetch("../../Controller/complet-signupuser.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
});
const result = await response.json();

if (result.success) {
    window.location.href = "dashboard.html"; // ou ta page d'accueil
} else {
    alert("Erreur : " + result.message);
}