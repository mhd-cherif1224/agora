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

function showPasswordErrors(rules) {
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
function showNotification(message, color = "#16376E") {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.background = color;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}

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
// FORGOT PASSWORD
// ========================
const forgotLink = document.querySelector(".options a");

// forgotLink.addEventListener("click", function(e) {
//     e.preventDefault();

//     // Supprimer ancien modal si existe
//     const oldModal = document.getElementById("forgot-modal");
//     if (oldModal) oldModal.remove();

//     const modal = document.createElement("div");
//     modal.id = "forgot-modal";
//     modal.innerHTML = `
//         <div id="forgot-overlay"></div>
//         <div id="forgot-box">
//             <h3>Mot de passe oublié</h3>
//             <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>
//             <div class="input-group" style="margin: 20px 0;">
//                 <i class="fa-solid fa-envelope icon-left"></i>
//                 <input type="email" id="forgot-email" placeholder="Votre email" />
//             </div>
//             <div id="forgot-actions">
//                 <button type="button" id="forgot-cancel">Annuler</button>
//                 <button type="button" id="forgot-send">Envoyer</button>
//             </div>
//         </div>
//     `;
//     document.body.appendChild(modal);

//     // Fermer en cliquant sur l'overlay
//     document.getElementById("forgot-overlay").addEventListener("click", () => modal.remove());

//     document.getElementById("forgot-cancel").addEventListener("click", () => modal.remove());

//     document.getElementById("forgot-send").addEventListener("click", () => {
//         const forgotEmail = document.getElementById("forgot-email").value;
//         if (!forgotEmail || !forgotEmail.includes("@")) {
//             showNotification("Entrez un email valide.", "#c0392b");
//             modal.remove();
//             return;
//         }
//         modal.remove();
//         showNotification(`✔ Lien envoyé à ${forgotEmail}`, "#16376E");
//     });
// });

// ========================
// SUBMIT
// ========================
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email    = emailInput.value;
    const password = form.querySelector("input[type='password']").value;

    if (!email || !password) {
        showNotification("Veuillez remplir tous les champs !", "#c0392b");
        return;
    }

    if (!email.includes("@")) {
        showNotification("Entrez un email valide.", "#c0392b");
        return;
    }

    const rules = validatePassword(password);
    const allValid = Object.values(rules).every(Boolean);

    if (!allValid) {
        showPasswordErrors(rules);
        return;
    }

    const old = document.getElementById("password-hint");
    if (old) old.remove();

    // Remember Me : sauvegarder ou effacer
    if (rememberCheck.checked) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    console.log("Login envoyé :", email, password);
    window.location.href = "../html/landing-page.html";
});

// ========================
// TOGGLE PASSWORD
// ========================
const toggle = document.getElementById("togglePassword");
const passwordInput = document.querySelector("input[type='password']");

toggle.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggle.classList.replace("fa-eye-slash", "fa-eye");
    } else {
        passwordInput.type = "password";
        toggle.classList.replace("fa-eye", "fa-eye-slash");
    }
});