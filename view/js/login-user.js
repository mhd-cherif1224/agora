/* ══════════════════════════════════════════
   LOGIN-USER.JS
   Authentification via fetch JSON → login-user.php
══════════════════════════════════════════ */
const form              = document.querySelector("form");
const LOGIN_CONTROLLER  = "../../Controller/login-user.php";

// ── Notification ──
function showNotification(message, isError = true) {
    const notif = document.getElementById("notification");
    notif.innerText        = message;
    notif.style.background = isError ? "#c0392b" : "#1a7a46";
    notif.style.display    = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

// ── Remember me : pré-remplissage au chargement ──
const emailInput    = form.querySelector("input[type='email']");
const rememberCheck = document.getElementById("check");

window.addEventListener("load", () => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheck) rememberCheck.checked = true;
    }
});

// ── Toggle visibilité mot de passe ──
const toggle        = document.getElementById("togglePassword");
const passwordInput = document.getElementById("passwordInput");

if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        toggle.classList.replace(
            isHidden ? "fa-eye-slash" : "fa-eye",
            isHidden ? "fa-eye"       : "fa-eye-slash"
        );
    });
}

// ── Soumission ──
form.addEventListener("submit", async function (e) {
    e.preventDefault();   // BUG CORRIGÉ : empêche le submit HTML natif vers le PHP

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showNotification("Veuillez remplir tous les champs !");
        return;
    }

    // Gestion remember me
    if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    const btn = form.querySelector("button[type='submit']");
    btn.disabled    = true;
    btn.textContent = "Connexion…";

    try {
        // BUG CORRIGÉ : vrai appel fetch au PHP (avant, le JS faisait juste window.location.href)
        const response = await fetch(LOGIN_CONTROLLER, {
            method:      "POST",
            credentials: "include",          // IMPORTANT : envoie le cookie de session
            headers:     { "Content-Type": "application/json" },
            body:        JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Bienvenue, ${result.prenom} !`, false);
            setTimeout(() => {
                window.location.href = "../UI/homepage/home-page.html";
            }, 1000);
        } else {
            showNotification(result.message || "Identifiants incorrects.");
        }

    } catch (err) {
        showNotification("Erreur réseau : " + err.message);
    } finally {
        btn.disabled    = false;
        btn.textContent = "Se connecter";
    }
});