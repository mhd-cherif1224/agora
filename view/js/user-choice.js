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
document.getElementById("continueBtn").addEventListener("click", () => {
    if(!selectedRole){
        showNotification("Choisissez un rôle !");
    } else {
        localStorage.setItem("step", 2);
        window.location.href = "user-formulaire.html";
    }
});

// Back
document.getElementById("back").addEventListener("click", () => {
    window.location.href = "signUp-user.html";
});

// ========================
// PROGRESS BAR
// ========================
const progressBar = document.querySelector(".progress-bar");
let step = localStorage.getItem("step") || 2;

function animateProgress(from, to, duration = 600){
    const style = document.createElement('style');
    const animName = `loadProgress${Date.now()}`;
    style.innerHTML = `
        @keyframes ${animName} {
            from { width: ${from}; }
            to { width: ${to}; }
        }
    `;
    document.head.appendChild(style);
    progressBar.style.animation = `${animName} ${duration}ms ease-out forwards`;

    setTimeout(() => {
        progressBar.style.width = to;
        progressBar.style.animation = '';
        style.remove();
    }, duration);
}

if(progressBar){
    if(step === "back"){
        animateProgress("75%", "50%");
        localStorage.setItem("step", 2);
    } else {
        animateProgress("25%", "50%");
    }
}


// Notification
function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 3000);
}