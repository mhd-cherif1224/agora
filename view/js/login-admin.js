// Récupère l'icône de l'œil (le bouton pour afficher/cacher le mot de passe)
const togglePassword = document.getElementById("togglePassword");

// Récupère le champ mot de passe
const password = document.getElementById("password");

// Quand l'utilisateur clique sur l'icône de l'œil
togglePassword.addEventListener("click", function(){

    // Vérifie le type actuel du champ :
    // Si type="password" → on le change en "text" (mot de passe visible)
    // Si type="text"     → on le change en "password" (mot de passe caché)
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    
    // Applique le nouveau type au champ
    password.setAttribute("type", type);

    // Change l'icône :
    // fa-eye      = œil ouvert  (mot de passe visible)
    // fa-eye-slash = œil barré  (mot de passe caché)
    // toggle = si la classe existe on la supprime, sinon on l'ajoute
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
});