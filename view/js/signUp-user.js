/* ══════════════════════════════════════════
   SIGNUP-USER.JS
   Étape 1 : email + mot de passe
   → appel signup-user.php → OTP envoyé
══════════════════════════════════════════ */
const form = document.querySelector("form");
const signUpControllerUrl = "../../Controller/signup-user.php";

// ── Validation mot de passe ──
function validatePassword(password) {
    return {
        length:    password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number:    /[0-9]/.test(password),
        special:   /[^A-Za-z0-9]/.test(password),
    };
}

// ── Notifications ──
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText      = message;
    notif.style.display  = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

// ── Soumission du formulaire ──
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const inputs   = form.querySelectorAll("input");
    const email    = inputs[0].value.trim();
    const password = inputs[1].value;
    const confirm  = inputs[2].value;

    if (!email || !password || !confirm) {
        showNotification("Tous les champs sont obligatoires");
        return;
    }

    if (password !== confirm) {
        showNotification("Les mots de passe ne correspondent pas !");
        return;
    }

    const rules = validatePassword(password);
    if (!Object.values(rules).every(Boolean)) {
        showNotification("Le mot de passe ne respecte pas les règles de sécurité.");
        return;
    }

    try {
        const response = await fetch(signUpControllerUrl, {
            method:      "POST",
            credentials: "include",              // IMPORTANT : partage le cookie de session
            headers:     { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            // Stocker l'email pour l'afficher sur la page OTP
            localStorage.setItem("pendingEmail", result.email);
            localStorage.removeItem("step");     // reset progress bar
            window.location.href = "../html/user-verification.html";
        } else {
            showNotification("Erreur : " + result.message);
        }
    } catch (error) {
        showNotification("Erreur réseau : " + error.message);
    }
});

// ── Remember me ──
const emailInput    = form.querySelector("input[type='email']");
// BUG CORRIGÉ : l'HTML n'avait pas id="check" sur la checkbox
// Assurez-vous que votre HTML a : <input type="checkbox" id="check">
const rememberCheck = document.getElementById("check");

window.addEventListener("load", () => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheck) rememberCheck.checked = true;
    }
});

if (rememberCheck) {
    rememberCheck.addEventListener("change", () => {
        if (rememberCheck.checked) {
            localStorage.setItem("rememberedEmail", emailInput.value.trim());
        } else {
            localStorage.removeItem("rememberedEmail");
        }
    });
}

// ── Toggle visibilité mot de passe ──
const toggle1       = document.getElementById("togglePassword1");
const passwordInput1 = document.getElementById("password1");
if (toggle1 && passwordInput1) {
    toggle1.addEventListener("click", () => {
        const isHidden = passwordInput1.type === "password";
        passwordInput1.type = isHidden ? "text" : "password";
        toggle1.classList.replace(
            isHidden ? "fa-eye-slash" : "fa-eye",
            isHidden ? "fa-eye"       : "fa-eye-slash"
        );
    });
}

const toggle2        = document.getElementById("togglePassword2");
const passwordInput2 = document.getElementById("password2");
if (toggle2 && passwordInput2) {
    toggle2.addEventListener("click", () => {
        const isHidden = passwordInput2.type === "password";
        passwordInput2.type = isHidden ? "text" : "password";
        toggle2.classList.replace(
            isHidden ? "fa-eye-slash" : "fa-eye",
            isHidden ? "fa-eye"       : "fa-eye-slash"
        );
    });
}

// ── Barre de force du mot de passe ──
const strengthFill  = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");

const levels = [
    { w: "0%",    bg: "",          txt: ""          },
    { w: "25%",   bg: "#e74c3c",   txt: "Très faible" },
    { w: "50%",   bg: "#e67e22",   txt: "Faible"     },
    { w: "75%",   bg: "#f1c40f",   txt: "Moyen"      },
    { w: "100%",  bg: "#1a7a46",   txt: "Fort"       },
];

function checkStrength(pw) {
    let score = 0;
    if (pw.length >= 8)          score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const l = levels[score];
    if (strengthFill)  { strengthFill.style.width = l.w; strengthFill.style.background = l.bg; }
    if (strengthLabel) { strengthLabel.textContent = l.txt; strengthLabel.style.color = l.bg || "var(--muted)"; }
}

function setReq(id, ok) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("ok", ok);
}

if (passwordInput1) {
    passwordInput1.addEventListener("input", () => {
        const v = passwordInput1.value;
        checkStrength(v);
        setReq("req-len", v.length >= 8);
        setReq("req-up",  /[A-Z]/.test(v));
        setReq("req-num", /[0-9]/.test(v));
        setReq("req-sym", /[^A-Za-z0-9]/.test(v));
    });
}