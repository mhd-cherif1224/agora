const form = document.querySelector("form");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = form.querySelector("input[type='email']").value;
    const password = form.querySelector("input[type='password']").value;

    if (!email || !password) {
        alert("Veuillez remplir tous les champs !");
        return;
    }

    if (!email.includes("@")) {
    alert("Enter a valid email.");
    
  }

  if(password && email){
        alert("bienvenue")
    }else{
        alert("tghletet")
    }

    console.log("Login envoyé :", email, password);
});

const toggle = document.getElementById("togglePassword");
const passwordInput = document.querySelector("input[type='password']");

toggle.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggle.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        passwordInput.type = "password";
        toggle.classList.replace("fa-eye-slash", "fa-eye");
    }
});





