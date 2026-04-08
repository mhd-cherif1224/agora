// ========================
// TOGGLE PASSWORD
// ========================
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function() {
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
});

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
const form = document.querySelector("form");           // ← manquait !
const emailInput = document.getElementById("in-email"); // ← utilise l'id directement
const rememberCheck = document.getElementById("checkbox"); // ← c'est "checkbox" pas "check"

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

forgotLink.addEventListener("click", function(e) {
    e.preventDefault();

    const oldModal = document.getElementById("forgot-modal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "forgot-modal";
    modal.innerHTML = `
        <div id="forgot-overlay"></div>
        <div id="forgot-box">
            <h3>Mot de passe oublié</h3>
            <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>
            <div class="input-group" style="margin: 20px 0;">
                <i class="fa-solid fa-envelope icon-left"></i>
                <input type="email" id="forgot-email" placeholder="Votre email" />
            </div>
            <div id="forgot-actions">
                <button type="button" id="forgot-cancel">Annuler</button>
                <button type="button" id="forgot-send">Envoyer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("forgot-overlay").addEventListener("click", () => modal.remove());
    document.getElementById("forgot-cancel").addEventListener("click", () => modal.remove());

    document.getElementById("forgot-send").addEventListener("click", () => {
        const forgotEmail = document.getElementById("forgot-email").value;
        if (!forgotEmail || !forgotEmail.includes("@")) {
            showNotification("Entrez un email valide.", "#c0392b");
            modal.remove();
            return;
        }
        modal.remove();
        showNotification(`✔ Lien envoyé à ${forgotEmail}`, "#16376E");
    });
});

// ========================
// SUBMIT
// ========================
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = emailInput.value;
    const pwd   = password.value;

    if (!email || !pwd) {
        showNotification("Veuillez remplir tous les champs !", "#c0392b");
        return;
    }

    if (rememberCheck.checked) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    console.log("Login admin :", email);
    form.submit();
});