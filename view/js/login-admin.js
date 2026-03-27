const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function(){
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
});

// On intercepte l'envoi du formulaire pour gérer le login en front-end
document.querySelector("form").addEventListener("submit", function(e){

    e.preventDefault(); // Empêche le rechargement automatique de la page

    let email = document.getElementById("in-email").value; // Récupère l'email saisi

    let role;

    // Simulation simple du rôle selon l'email
    if(email === "super@admin.com"){
        role = "super_admin"; // super admin a tous les droits
    } else {
        role = "admin";       // admin simple a des droits limités
    }

    // On stocke temporairement le rôle et l'email dans le localStorage
    // Cela permet de gérer les permissions côté front-end
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);

    // Redirection vers la page d'accueil de l'admin
    window.location.href = "../html/home-page-admin.html";
});