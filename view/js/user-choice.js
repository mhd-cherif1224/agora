const SAVE_STEP_URL = "../../Controller/savestep.php";

let selectedRole = null;
const cards = document.querySelectorAll(".card");

// Sélection du rôle
cards.forEach(card => {
    card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedRole = card.dataset.role;
    });
});

// Continue
document.getElementById("continueBtn").addEventListener("click", async () => {
    if (!selectedRole) {
        showNotification("Choisissez un rôle !");
        return;
    }

    try {
        const response = await fetch(SAVE_STEP_URL, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action: "save_role", role: selectedRole })
        });
        const result = await response.json();

        if (result.success) {
            window.location.href = "user-formulaire.html";
        } else {
            showNotification("Erreur : " + result.message);
        }
    } catch (err) {
        showNotification("Erreur réseau : " + err.message);
    }
});

// Back
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem('step', 'back');
    window.location.href = "user-verification.html";
});

// ========================
// PROGRESS BAR
// ========================
const progressBar = document.querySelector(".progress-bar");
let step = localStorage.getItem("step");

function animateProgress(from, to, duration = 600) {
    const style    = document.createElement('style');
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
        progressBar.style.animation = '';
        style.remove();
    }, duration);
}

if (progressBar) {
    if (step === "back") {
        animateProgress("75%", "50%");
        localStorage.setItem("step", 2);
    } else {
        animateProgress("25%", "50%");
        localStorage.setItem("step", 2);
    }
}

// Notification
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}