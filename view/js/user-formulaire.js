document.getElementById("continueBtn").addEventListener("click", () => {

    // Récupération des valeurs
    let nom = document.getElementById("nom").value.trim();
    let prenom = document.getElementById("prenom").value.trim();
    let sexe = document.getElementById("sexe").value;

    let jour = document.getElementById("jour").value.trim();
    let mois = document.getElementById("mois").value.trim();
    let annee = document.getElementById("annee").value.trim();

    // Vérification des champs obligatoires
    if (!nom || !prenom || sexe === "- choisissez -" || !jour || !mois || !annee) {
        alert("Remplissez tous les champs !");
        return;
    }

    // Validation de la date
    let day = parseInt(jour, 10);
    let month = parseInt(mois, 10);
    let year = parseInt(annee, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        alert("La date doit être composée uniquement de chiffres !");
        return;
    }

    if (day < 1 || day > 31) {
        alert("Jour invalide (1-31)");
        return;
    }

    if (month < 1 || month > 12) {
        alert("Mois invalide (1-12)");
        return;
    }

    let currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
        alert(`Année invalide (1900-${currentYear})`);
        return;
    }

    // Vérification des mois avec 30 jours et février 
    if ([4, 6, 9, 11].includes(month) && day > 30) {
        alert("Ce mois ne peut pas avoir plus de 30 jours");
        return;
    }
    if (month === 2 && day > 29) {
        alert("Février ne peut pas avoir plus de 29 jours");
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