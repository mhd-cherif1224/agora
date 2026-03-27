let selectedRole = null;
const cards = document.querySelectorAll(".card");

cards.forEach(card => {
    card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedRole = card.dataset.role;
    });
});

document.getElementById("continueBtn").addEventListener("click", () => {
    if (!selectedRole) {
        alert("Choisissez un rôle !");
        return;
    }

    localStorage.setItem("role", selectedRole);
    window.location.href = "user-formulaire.html";
});

document.getElementById("back").addEventListener("click", () => {
    
    window.location.href = "signUp-user.html";
});