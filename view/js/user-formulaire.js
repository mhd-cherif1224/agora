/* ══════════════════════════════════════════
   USER-FORMULAIRE.JS
   Étape : nom, prénom, sexe, date de naissance
══════════════════════════════════════════ */
const SAVE_STEP_URL = "../../Controller/savestep.php";

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
        animateProgress("100%", "75%");
    } else {
        animateProgress("50%", "75%");
    }
    localStorage.setItem("step", "3");
}

// ── Gestion des erreurs ──
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add("error");
    let oldError = input.parentElement.querySelector(".error-message");
    if (oldError) oldError.remove();
    const error = document.createElement("div");
    error.className  = "error-message";
    error.innerText  = message;
    input.parentElement.appendChild(error);
}

function clearErrors() {
    document.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
    document.querySelectorAll(".error-message").forEach(el => {
        if (el.id !== "date-error") el.remove();
    });
    const dateError = document.getElementById("date-error");
    if (dateError) dateError.innerText = "";
}

function showDateError(message) {
    document.getElementById("date-error").innerText = message;
}

// ── Bouton Continuer ──
document.getElementById("continueBtn").addEventListener("click", async () => {
    clearErrors();

    const nom    = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();
    const sexeRaw = document.getElementById("sexe").value;   // "Homme" ou "Femme"
    const jour   = document.getElementById("jour").value.trim();
    const mois   = document.getElementById("mois").value.trim();
    const annee  = document.getElementById("annee").value.trim();
    let hasError = false;

    if (!nom)    { showError("nom",    "*Entrez un nom*");    hasError = true; }
    if (!prenom) { showError("prenom", "*Entrez un prénom*"); hasError = true; }
    if (sexeRaw === "- choisissez -") { showError("sexe", "*Choisissez un sexe*"); hasError = true; }

    if (!jour || !mois || !annee) {
        showDateError("*Complétez toute la date*");
        if (!jour)  document.getElementById("jour").classList.add("error");
        if (!mois)  document.getElementById("mois").classList.add("error");
        if (!annee) document.getElementById("annee").classList.add("error");
        hasError = true;
    }
    if (hasError) return;

    const day   = parseInt(jour,  10);
    const month = parseInt(mois,  10);
    const year  = parseInt(annee, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        showDateError("*La date doit contenir uniquement des chiffres*");
        return;
    }

    const mois30 = [4, 6, 9, 11];
    if (month < 1 || month > 12)                             { showDateError("*Choisissez un mois entre 1 et 12*"); return; }
    if (mois30.includes(month) && day > 30)                  { showDateError("*Ce mois contient maximum 30 jours*"); return; }
    if (!mois30.includes(month) && month !== 2 && day > 31)  { showDateError("*Ce mois contient maximum 31 jours*"); return; }
    if (month === 2 && day > 29)                             { showDateError("*Février max 29 jours*");             return; }

    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
        showDateError(`La date est invalide (année entre 1900 et ${currentYear})`);
        return;
    }

    // BUG CORRIGÉ : conversion Homme/Femme → M/F (enum BDD)
    const sexe = sexeRaw === "Homme" ? "M" : "F";

    const dateNaissance = `${jour.padStart(2, "0")}/${mois.padStart(2, "0")}/${annee}`;

    try {
        const response = await fetch(SAVE_STEP_URL, {
            method:      "POST",
            credentials: "include",              // IMPORTANT : cookie de session
            headers:     { "Content-Type": "application/json" },
            body: JSON.stringify({
                action:         "save_formulaire",
                nom,
                prenom,
                sexe,                            // M ou F
                date_naissance: dateNaissance
            })
        });
        const result = await response.json();

        if (result.success) {
            window.location.href = "photo-profil.html";
        } else {
            alert("Erreur : " + result.message);
        }
    } catch (err) {
        alert("Erreur réseau : " + err.message);
    }
});

// ── Bouton Retour ──
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem("step", "back");
    window.location.href = "user-choice.html";
});