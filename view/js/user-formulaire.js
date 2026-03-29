function showError(inputId, message){
    const input = document.getElementById(inputId);

    // Ajouter bordure rouge
    input.classList.add("error");

    // Supprimer ancien message s'il existe
    let oldError = input.parentElement.querySelector(".error-message");
    if(oldError) oldError.remove();

    // Créer nouveau message
    const error = document.createElement("div");
    error.className = "error-message";
    error.innerText = message;

    input.parentElement.appendChild(error);
}


function clearErrors(){
    document.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
    document.querySelectorAll(".error-message").forEach(el => {
        if(el.id !== "date-error"){
            el.remove();
        }
    });

    const dateError = document.getElementById("date-error");
    if(dateError){
        dateError.innerText = "";
    }
}

function showDateError(message){
    const error = document.getElementById("date-error");
    error.innerText = message;
}


document.getElementById("continueBtn").addEventListener("click", () => {

    clearErrors();

    // Récupération des valeurs
    let nom = document.getElementById("nom").value.trim();
    let prenom = document.getElementById("prenom").value.trim();
    let sexe = document.getElementById("sexe").value;

    let jour = document.getElementById("jour").value.trim();
    let mois = document.getElementById("mois").value.trim();
    let annee = document.getElementById("annee").value.trim();

    // Vérification des champs obligatoires
    let hasError = false;

    if (!nom){
        showError("nom", "*Entrez un nom*");
        hasError = true;
    }

    if (!prenom){
        showError("prenom", "*Entrez un prénom*");
        hasError = true;
    }

    if (sexe === "- choisissez -"){
        showError("sexe", "*Choisissez un sexe*");
        hasError = true;
    }

    if (!jour || !mois || !annee){
        showDateError("*Complétez toute la date*");
        
        if(!jour) document.getElementById("jour").classList.add("error");
        if(!mois) document.getElementById("mois").classList.add("error");
        if(!annee) document.getElementById("annee").classList.add("error");

        hasError = true;
    }

    if(hasError) return;

    // Validation de la date
    let day = parseInt(jour, 10);
    let month = parseInt(mois, 10);
    let year = parseInt(annee, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        showDateError("*La date doit contenir uniquement des chiffres*");

        if(isNaN(day)) document.getElementById("jour").classList.add("error");
        if(isNaN(month)) document.getElementById("mois").classList.add("error");
        if(isNaN(year)) document.getElementById("annee").classList.add("error");

        return;
    }

    // Vérification du mois
    if (month < 1 || month > 12) {
        showDateError("*Choisissez un mois entre 1 et 12*");
        document.getElementById("mois").classList.add("error");
        return;
    }

    // Vérification du jour selon le mois
    const mois30 = [4, 6, 9, 11]; // avril, juin, septembre, novembre

    if (mois30.includes(month) && day > 30) {
        showDateError("*Ce mois contient maximum 30 jours*");
        document.getElementById("jour").classList.add("error");
        return;
    }

    if (!mois30.includes(month) && month !== 2 && day > 31) {
        showDateError("*Ce mois contient maximum 31 jours*");
        document.getElementById("jour").classList.add("error");
        return;
    }

    if (month === 2 && day > 29) {
        showDateError("*Février max 29 jours*");
        document.getElementById("jour").classList.add("error");
        return;
    }


    //  stockage temporaire
    localStorage.setItem("nom", nom);
    localStorage.setItem("prenom", prenom);
    localStorage.setItem("sexe", sexe);
    localStorage.setItem("date_naissance", `${jour.padStart(2,'0')}/${mois.padStart(2,'0')}/${annee}`);

    // Passage à l'étape suivante
    window.location.href = "photo-profil.html";
});

document.getElementById("back").addEventListener("click", () => {
    
    window.location.href = "user-choice.html";
});