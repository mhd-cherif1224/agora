// Sign-up User
// Password principal
// const togglePassword = document.getElementById("togglePassword");
// const password = document.getElementById("password");

// togglePassword.addEventListener("click", function(){
//     const type = password.type === "password" ? "text" : "password";
//     password.type = type;

//     this.classList.toggle("fa-eye");
//     this.classList.toggle("fa-eye-slash");
// });


// // Confirmation password
// const toggleConfirm = document.getElementById("toggleConfirm");
// const confirmationPassword = document.getElementById("confirmation-password");

// toggleConfirm.addEventListener("click", function(){
//     const type = confirmationPassword.type === "password" ? "text" : "password";
//     confirmationPassword.type = type;

//     this.classList.toggle("fa-eye");
//     this.classList.toggle("fa-eye-slash");
// });


// const errorMessage = document.getElementById("error-message");
// const button = document.querySelector("button");

// button.addEventListener("click", function(e){
    
//     if(password.value !== confirmationPassword.value){
//         e.preventDefault(); // empêche l'envoi

//         errorMessage.style.display = "block";
//     } else {
//         errorMessage.style.display = "none";
//     }
// });

const form = document.querySelector("form");
const inputs = form.querySelectorAll("input");
const signUpControllerUrl = "../../Controller/signup-user.php";

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = inputs[0].value.trim();
    const password = inputs[1].value;
    const confirm = inputs[2].value;

    if (!email || !password || !confirm) {
        alert("Tous les champs sont obligatoires");
        return;
    }

    if (password !== confirm) {
        alert("Les mots de passe ne correspondent pas !");
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
            alert(`Utilisateur enregistré et email envoyé à ${result.email}`);
            window.location.href = "../html/user-verification.html";
        } else {
            alert(`Erreur 1:  ${result.message}`);
        }
    } catch (error) {
        alert("Erreur lors de l'inscription: " + error.message);

    }
});