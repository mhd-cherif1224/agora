const form = document.querySelector("form");

// Validation mot de passe
function validatePassword(password) {
    const rules = {
        length:    password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number:    /[0-9]/.test(password),
        underscore:/\_/.test(password),
    };
    return rules;
}

// Affiche les erreurs sous le champ password
function showPasswordErrors(rules) {
    // Supprimer l'ancien message s'il existe
    const old = document.getElementById("password-hint");
    if (old) old.remove();

    const allValid = Object.values(rules).every(Boolean);
    if (allValid) return;

    const messages = [
        { key: "length",    text: "Au moins 8 caractères" },
        { key: "uppercase", text: "Au moins une lettre majuscule" },
        { key: "number",    text: "Au moins un chiffre" },
        { key: "underscore",text: "Au moins un underscore (_)" },
    ];

    const hint = document.createElement("ul");
    hint.id = "password-hint";
    hint.style.cssText = `
        list-style: none;
        font-size: 12px;
        margin-top: 6px;
        text-align: left;
        margin-left: 8%;
        padding: 0;
    `;

    messages.forEach(({ key, text }) => {
        if (!rules[key]) {
            const li = document.createElement("li");
            li.textContent = "✗ " + text;
            li.style.color = "#c0392b";
            hint.appendChild(li);
        }
    });

    const passwordGroup = form.querySelector("input[type='password']").closest(".input-group");
    passwordGroup.insertAdjacentElement("afterend", hint);
}


// ========================
// NOTIFICATIONS
// ========================
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

const inputs = form.querySelectorAll("input");
const signUpControllerUrl = "../../Controller/signup-user.php";

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = inputs[0].value.trim();
    const password = inputs[1].value;
    const confirm = inputs[2].value;

    if (!email || !password || !confirm) {
        showNotification("Tous les champs sont obligatoires");
        return;
    }

    if (password !== confirm) {
        showNotification("Les mots de passe ne correspondent pas !");
        return;
    }

    try {
        const response = await fetch(`${signUpControllerUrl}?action=register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Utilisateur enregistré et email envoyé à ${result.email}`);
            localStorage.setItem('pendingEmail', email);
 
            window.location.href = "../html/user-verification.html";
        } else {
            showNotification(`Erreur 1:  ${result.message}`);
        }
    } catch (error) {
        showNotification("Erreur lors de l'inscription: " + error.message);
    }

    
});

// ========================
// REMEMBER ME
// ========================
const emailInput   = form.querySelector("input[type='email']");
const rememberCheck = document.getElementById("check");

// Au chargement : si email sauvegardé, on le remet
window.addEventListener("load", () => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheck.checked = true;
    }
});

// ========================
// Toggle password visibility
// ========================
const toggle1 = document.getElementById("togglePassword1");
const passwordInput1 = document.getElementById("password1");

toggle1.addEventListener("click", () => {
    if (passwordInput1.type === "password") {
        passwordInput1.type = "text";
        toggle1.classList.replace("fa-eye-slash", "fa-eye");
    } else {
        passwordInput1.type = "password";
        toggle1.classList.replace("fa-eye", "fa-eye-slash");
    }
});

const toggle2 = document.getElementById("togglePassword2");
const passwordInput2 = document.getElementById("password2");

toggle2.addEventListener("click", () => {
    if (passwordInput2.type === "password") {
        passwordInput2.type = "text";
        toggle2.classList.replace("fa-eye-slash", "fa-eye");
    } else {
        passwordInput2.type = "password";
        toggle2.classList.replace("fa-eye", "fa-eye-slash");
    }
});


// ========================
// STRENGTH BAR + REQUIREMENTS
// ========================
const strengthFill  = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");

const levels = [
    { w: "0%",   bg: "",          txt: "" },
    { w: "25%",  bg: "#e74c3c",   txt: "Très faible" },
    { w: "50%",  bg: "#e67e22",   txt: "Faible" },
    { w: "75%",  bg: "#f1c40f",   txt: "Moyen" },
    { w: "100%", bg: "#1a7a46",   txt: "Fort" },
];

function checkStrength(pw) {
    let s = 0;
    if (pw.length >= 8)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const l = levels[s];
    strengthFill.style.width      = l.w;
    strengthFill.style.background = l.bg;
    strengthLabel.textContent     = l.txt;
    strengthLabel.style.color     = l.bg || "var(--muted)";
}

function setReq(id, ok) {
    document.getElementById(id).classList.toggle("ok", ok);
}

passwordInput1.addEventListener("input", () => {
    const v = passwordInput1.value;
    checkStrength(v);
    setReq("req-len", v.length >= 8);
    setReq("req-up",  /[A-Z]/.test(v));
    setReq("req-num", /[0-9]/.test(v));
    setReq("req-sym", /[^A-Za-z0-9]/.test(v));
});
