let selectedRole = null;
const cards = document.querySelectorAll(".card");

cards.forEach(card => {
    card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedRole = card.dataset.role;
    });
});

document.getElementById("back").addEventListener("click", () => {
    
    window.location.href = "signUp-user.html";
});



/* ==============================
NOTIFICATION
============================== */

function showNotification(message){
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";

    setTimeout(() => {
        notif.style.display = "none";
    }, 3000);
}


// Pour la gestion entre les roles
document.getElementById("continueBtn").addEventListener("click", () => {

    if(!selectedRole){
        showNotification("Choisissez un rôle !");
    }else{
        window.location.href = "user-formulaire.html";
    }

});

     