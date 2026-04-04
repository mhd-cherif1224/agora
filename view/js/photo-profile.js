// ========================
// VARIABLES GLOBALES
// ========================
let cropperInstance = null;
let cropTarget = null; // "profile" ou "banner"

const cropModal  = document.getElementById("cropModal");
const cropImage  = document.getElementById("cropImage");

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
// CROPPER — ouvre la modale
// ========================
function openCropper(file, target, aspectRatio) {
    cropTarget = target;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!validTypes.includes(file.type)) {
        showNotification("Format non supporté ! Utilisez .jpg, .png, .jpeg ou .gif");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {

        // Reset l'ancien cropper proprement
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }

        // Met l'image dans la modale
        cropImage.src = e.target.result;

        // Ouvre la modale
        cropModal.classList.add("active");

        // Attend que l'image soit chargée dans le DOM avant d'initialiser Cropper
        cropImage.onload = function () {
            cropperInstance = new Cropper(cropImage, {
                aspectRatio:        aspectRatio,  // 1 = carré, 16/9 = banner
                viewMode:           1,            // image ne sort pas du canvas
                movable:            true,
                zoomable:           true,
                scalable:           false,
                cropBoxResizable:   true,
                background:         false,
            });
        };
    };

    reader.readAsDataURL(file);
}

// ========================
// CROPPER — ferme la modale
// ========================
function closeCropper() {
    cropModal.classList.remove("active");

    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }

    // Reset les inputs pour pouvoir re-sélectionner le même fichier
    document.getElementById("profileInput").value = "";
    document.getElementById("bannerInput").value  = "";
}

// ========================
// BOUTON CONFIRMER
// ========================
document.getElementById("cropConfirm").addEventListener("click", function () {

    if (!cropperInstance) {
        showNotification("Erreur : cropper non initialisé.");
        return;
    }

    const canvas = cropperInstance.getCroppedCanvas({
        width:  cropTarget === "profile" ? 300  : 1200,
        height: cropTarget === "profile" ? 300  : 400,
        imageSmoothingQuality: "high",
    });

    if (!canvas) {
        showNotification("Erreur : impossible de récupérer l'image.");
        return;
    }

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);

    if (cropTarget === "profile") {
        // Applique sur la preview ronde
        document.getElementById("profilePreview").src = croppedDataUrl;

    } else if (cropTarget === "banner") {
        // Applique sur le banner-top
        const bannerTop = document.querySelector(".banner-top");
        bannerTop.style.backgroundImage    = `url('${croppedDataUrl}')`;
        bannerTop.style.backgroundSize     = "cover";
        bannerTop.style.backgroundPosition = "center";
        bannerTop.style.backgroundRepeat   = "no-repeat";
    }

    closeCropper();
});

// ========================
// BOUTON ANNULER
// ========================
document.getElementById("cropCancel").addEventListener("click", closeCropper);

// Ferme aussi si on clique sur le fond sombre
cropModal.addEventListener("click", function (e) {
    if (e.target === cropModal) closeCropper();
});

// ========================
// PROFILE INPUT → ouvre cropper carré
// ========================
document.getElementById("profileInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    openCropper(file, "profile", 1);
});

// ========================
// BANNER INPUT → ouvre cropper 16:9
// ========================
document.getElementById("bannerInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    openCropper(file, "banner", 16 / 9);
});

// ========================
// BUTTONS NAVIGATION
// ========================
document.querySelector(".finish").addEventListener("click", () => {
    showNotification("Inscription terminée !");
    window.location.href = "login-user.html";
});

document.querySelector(".skip").addEventListener("click", () => {
    showNotification("Inscription terminée !");
    window.location.href = "login-user.html";
});

// ========================
// BACK
// ========================
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem("step", "back");
    window.location.href = "user-formulaire.html";
});

// ========================
// PROGRESS BAR
// ========================
const progressBar = document.querySelector(".progress-bar");
let step = localStorage.getItem("step") || 3;

function animateProgress(from, to, duration = 600) {
    const style    = document.createElement("style");
    const animName = `loadProgress${Date.now()}`;

    style.innerHTML = `
        @keyframes ${animName} {
            from { width: ${from}; }
            to   { width: ${to};   }
        }
    `;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;

    setTimeout(() => {
        progressBar.style.width     = to;
        progressBar.style.animation = "";
        style.remove();
    }, duration);
}

if (progressBar) {
    if (step === "back") {
        animateProgress("100%", "60%");
        localStorage.setItem("step", 2);
    } else {
        animateProgress("60%", "98%");
    }
}