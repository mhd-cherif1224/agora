// Sign-up User
// Password principal
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function(){
    const type = password.type === "password" ? "text" : "password";
    password.type = type;

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
});


// Confirmation password
const toggleConfirm = document.getElementById("toggleConfirm");
const confirmationPassword = document.getElementById("confirmation-password");

toggleConfirm.addEventListener("click", function(){
    const type = confirmationPassword.type === "password" ? "text" : "password";
    confirmationPassword.type = type;

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
});


const errorMessage = document.getElementById("error-message");
const button = document.querySelector("button");

button.addEventListener("click", function(e){
    
    if(password.value !== confirmationPassword.value){
        e.preventDefault(); // empêche l'envoi

        errorMessage.style.display = "block";
    } else {
        errorMessage.style.display = "none";
    }
});