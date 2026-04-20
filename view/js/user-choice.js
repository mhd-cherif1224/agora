
/* ══════════════════════════════════════════
   USER-CHOICE.JS
   Étape : choix du rôle (Chercheur / Proposeur)
══════════════════════════════════════════ */
const SAVE_STEP_URL = "../../Controller/savestep.php";

let selectedRole = null;
const cards = document.querySelectorAll(".card");

// ── Sélection d'une carte ──
cards.forEach(card => {
    card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        const raw = card.dataset.role || "";
        // Capitalisation : "chercheur" → "Chercheur", "proposeur" → "Proposeur"
        selectedRole = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    });
});

// ── Bouton Continuer ──
document.getElementById("continueBtn").addEventListener("click", async () => {
    if (!selectedRole) {
        showNotification("Choisissez un rôle !");
        return;
    }

    // Vérification locale avant d'envoyer
    if (selectedRole !== "Chercheur" && selectedRole !== "Proposeur") {
        showNotification("Rôle invalide côté JS : " + selectedRole);
        return;
    }

    try {
        const response = await fetch(SAVE_STEP_URL, {
            method:      "POST",
            credentials: "include",
            headers:     { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save_role", role: selectedRole })
        });

        // Vérifier que la réponse est bien du JSON
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            showNotification("Réponse serveur invalide : " + text.substring(0, 100));
            return;
        }

        if (result.success) {
            window.location.href = "user-formulaire.html";
        } else {
            showNotification("Erreur : " + result.message);
        }
    } catch (err) {
        showNotification("Erreur réseau : " + err.message);
    }
});

// ── Bouton Retour ──
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem("step", "back");
    window.location.href = "user-verification.html";
});

// ── Barre de progression ──
const progressBar = document.querySelector(".progress-bar");

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
    const step = localStorage.getItem("step");
    if (step === "back") {
        animateProgress("75%", "50%");
    } else {
        animateProgress("25%", "50%");
    }
    localStorage.setItem("step", "2");
}

// ── Notification ──
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}