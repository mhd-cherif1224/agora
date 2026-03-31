
// ========================
// PROFILE & BANNER PREVIEW
// ========================
document.getElementById("profileInput").addEventListener("change", function(){
    const file = this.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = function(e){
            const img = document.createElement("img");
            img.src = e.target.result;
            const profile = document.querySelector(".profile");
            profile.innerHTML = "";
            profile.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById("bannerInput").addEventListener("change", function(){
    const file = this.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = function(e){
            const img = document.createElement("img");
            img.src = e.target.result;
            const banner = document.querySelector(".banner");
            banner.innerHTML = "";
            banner.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// ========================
// BUTTONS
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
// BACK → revenir à user-formulaire
// ========================
document.getElementById("back").addEventListener("click", () => {
    localStorage.setItem("step", "back");
    window.location.href = "user-formulaire.html";
});

// ========================
// PROGRESS BAR
// // ========================
const progressBar = document.querySelector(".progress-bar");
let step = localStorage.getItem("step") || 3;

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

// afficher la barre
if(progressBar){
    if(step == 3) progressBar.style.width = "100%";
    if(step == "back"){
        // revenir de 100% → 60%
        animateProgress("100%", "60%");
        localStorage.setItem("step", 3);
    }
    if(step == 2) progressBar.style.width = "60%";
}

// Notification
function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";
    setTimeout(() => { notif.style.display = "none"; }, 4000);
}