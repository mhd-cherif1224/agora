/* ══════════════════════════════════════════
   PHOTO-PROFILE.JS
   Dernière étape du signup :
   - Upload + crop photo de profil / bannière
   - Bouton "Sautez" → inscription sans photo
   - Bouton "Terminez" → inscription avec photo
══════════════════════════════════════════ */
const COMPLETE_URL = "../../Controller/complet-signupuser.php";

// ── Barre de progression ──
const progressBar = document.querySelector(".progress-bar");
if (progressBar) {
    const style    = document.createElement("style");
    const animName = `loadProgress${Date.now()}`;
    style.innerHTML = `
        @keyframes ${animName} {
            from { width: 75%; }
            to   { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} 600ms ease-out forwards`;
    setTimeout(() => {
        progressBar.style.width     = "100%";
        progressBar.style.animation = "";
        style.remove();
    }, 600);
}

// ── Notification ──
function showNotification(msg, isError = true) {
    const notif = document.getElementById("notification");
    notif.innerText           = msg;
    notif.style.display       = "block";
    notif.style.background    = isError ? "#e74c3c" : "#1a7a46";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

// ══════════════════════════════════════════
// CROP — état global
// ══════════════════════════════════════════
let cropperInstance = null;
let currentTarget   = null;   // 'profile' | 'banner'
let croppedBlobs    = { profile: null, banner: null };

const cropModal   = document.getElementById("cropModal");
const cropImage   = document.getElementById("cropImage");
const cropConfirm = document.getElementById("cropConfirm");
const cropCancel  = document.getElementById("cropCancel");

// ── Ouvre le modal de crop ──
function openCrop(file, target) {
    currentTarget = target;
    const reader  = new FileReader();
    reader.onload = e => {
        cropImage.src = e.target.result;
        cropModal.style.display = "flex";

        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }

        const isProfile = target === "profile";
        cropperInstance = new Cropper(cropImage, {
            aspectRatio:     isProfile ? 1 : 16 / 5,
            viewMode:        1,
            autoCropArea:    0.9,
            movable:         true,
            zoomable:        true,
            rotatable:       false,
            scalable:        false,
            responsive:      true,
        });
    };
    reader.readAsDataURL(file);
}

// ── Confirmer le crop ──
cropConfirm.addEventListener("click", () => {
    if (!cropperInstance) return;

    cropperInstance.getCroppedCanvas({
        width:  currentTarget === "profile" ? 400 : 1200,
        height: currentTarget === "profile" ? 400 : 375,
    }).toBlob(blob => {
        croppedBlobs[currentTarget] = blob;

        if (currentTarget === "profile") {
            const url = URL.createObjectURL(blob);
            document.getElementById("profilePreview").src = url;
        } else {
            const url = URL.createObjectURL(blob);
            document.querySelector(".banner-top").style.backgroundImage = `url(${url})`;
            document.querySelector(".banner-top").style.backgroundSize  = "cover";
        }

        closeCropModal();
    }, "image/jpeg", 0.9);
});

cropCancel.addEventListener("click", closeCropModal);

function closeCropModal() {
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    cropModal.style.display = "none";
    cropImage.src = "";
}

// ── Input photo de profil ──
document.getElementById("profileInput").addEventListener("change", function () {
    if (this.files && this.files[0]) openCrop(this.files[0], "profile");
    this.value = "";   // reset pour permettre de rechoisir le même fichier
});

// ── Input bannière ──
document.getElementById("bannerInput").addEventListener("change", function () {
    if (this.files && this.files[0]) openCrop(this.files[0], "banner");
    this.value = "";
});

// ══════════════════════════════════════════
// SOUMISSION
// ══════════════════════════════════════════
async function submitSignup(withPhotos) {
    const formData = new FormData();

    if (withPhotos) {
        if (croppedBlobs.profile) {
            formData.append("photo_profil",   croppedBlobs.profile,   "profil.jpg");
        }
        if (croppedBlobs.banner) {
            formData.append("photo_banniere", croppedBlobs.banner,    "banniere.jpg");
        }
    }

    try {
        const response = await fetch(COMPLETE_URL, {
            method:      "POST",
            credentials: "include",   // IMPORTANT : cookie de session
            body:        formData     // pas de Content-Type manuel → le navigateur gère le boundary
        });
        const result = await response.json();

        if (result.success) {
            showNotification("Inscription réussie ! Redirection…", false);
            localStorage.removeItem("pendingEmail");
            localStorage.removeItem("step");
            setTimeout(() => {
                window.location.href = "../html/login-user.html";
            }, 1500);
        } else {
            showNotification("Erreur : " + result.message);
        }
    } catch (err) {
        showNotification("Erreur réseau : " + err.message);
    }
}

// ── Bouton "Terminez" ──
document.querySelector(".finish").addEventListener("click", () => {
    submitSignup(true);
});

// ── Bouton "Sautez" ──
document.querySelector(".skip").addEventListener("click", () => {
    submitSignup(false);
});

// ── Bouton Retour ──
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem("step", "back");
    window.location.href = "user-formulaire.html";
});