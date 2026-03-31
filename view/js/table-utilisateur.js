// ==============================
// SELECTION LIGNE
// ==============================
let selectedRow = null;
const table = document.getElementById("userTable");

table.addEventListener("click", function(e){

    let row = e.target.closest("tr");

    if(!row || row.rowIndex === 0) return;

    if(selectedRow){
        selectedRow.classList.remove("selected");
    }

    selectedRow = row;
    row.classList.add("selected");

});

document.addEventListener("click", function(e){

    if(selectedRow && !e.target.closest("#userTable tbody tr") && !e.target.closest(".buttons") && !e.target.closest(".modal-content")){
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }

});


/* ==============================
MODAL MODIFIER - VERSION CORRIGÉE
============================== */

const modal = document.getElementById("modal");
const modifierBtn = document.getElementById("modifierBtn");
const cancelBtn = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".close");

cancelBtn.onclick = () => { modal.style.display = "none"; showNotification("Modification annulé"); };
closeModal.onclick = () => { modal.style.display = "none"; showNotification("Modification annulé"); };


modifierBtn.onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un utilisateur");
        return;
    }

    // Récupération sécurisée de la date (gère "undefined", null, ou chaîne vide)
    let rawDate = selectedRow.cells[3].innerText.trim();


    let formattedDate = "";

    if (rawDate && rawDate !== "undefined" && rawDate !== "Non définie") {
        // Cas 1 : Format DD/MM/YYYY (comme affiché dans le tableau)
        if (rawDate.includes("/")) {
            let parts = rawDate.split("/");
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        } 
        // Cas 2 : Format YYYY-MM-DD (déjà bon)
        else if (rawDate.includes("-")) {
            formattedDate = rawDate;
        }
    }

    // Remplissage du formulaire
    document.getElementById("nomInput").value        = selectedRow.cells[1].innerText || "";
    document.getElementById("prenomInput").value     = selectedRow.cells[2].innerText || "";
    document.getElementById("dateInput").value       = formattedDate;   // ← Plus jamais "undefined"
    document.getElementById("sexeInput").value       = selectedRow.cells[4].innerText || "";
    document.getElementById("emailInput").value      = selectedRow.cells[5].innerText || "";
    document.getElementById("telInput").value        = selectedRow.cells[6].innerText || "";
    document.getElementById("niveauInput").value     = selectedRow.cells[7].innerText || "";
    document.getElementById("specialiteInput").value = selectedRow.cells[8].innerText || "";
    document.getElementById("localisationInput").value      = selectedRow.cells[9].innerText || "";
    document.getElementById("statusInput").value     = selectedRow.cells[10].innerText || "";


    modal.style.display = "block";
};
/* ==============================
MODIFIER UTILISATEUR — AVEC PHP
============================== */

document.getElementById("confirmAdd").onclick = function(){

    let nom        = document.getElementById("nomInput").value.trim();
    let prenom     = document.getElementById("prenomInput").value.trim();
    let dateVal    = document.getElementById("dateInput").value;
    let sexe       = document.getElementById("sexeInput").value;
    let email      = document.getElementById("emailInput").value.trim();
    let tel        = document.getElementById("telInput").value.trim();
    let niveau     = document.getElementById("niveauInput").value.trim();
    let specialite = document.getElementById("specialiteInput").value.trim();
    let localisation      = document.getElementById("localisationInput").value.trim();
    let status     = document.getElementById("statusInput").value;

    // Vérification des champs obligatoires
    if(nom == "" || prenom == "" || email == "" || dateVal == "" || sexe == ""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    // Récupère l'ID de la ligne sélectionnée
    let userId = selectedRow.cells[0].innerText;

    // Envoie les données vers le Controller PHP
    fetch("../../Controller/utilisateur-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action    : "modifier",
            id        : userId,
            nom       : nom,
            prenom    : prenom,
            date      : dateVal,
            sexe      : sexe,
            email     : email,
            tel       : tel,
            niveau    : niveau,
            specialite: specialite,
            localisation : localisation,
            status : status

        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){

            // Convert YYYY-MM-DD → DD/MM/YYYY
            // let parts = dateVal.split("-");
            // let formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateVal;


            
            // Met à jour la ligne dans le tableau HTML
            selectedRow.cells[1].innerText = nom;
            selectedRow.cells[2].innerText = prenom;
            selectedRow.cells[3].innerText = dateVal.split("-").reverse().join("/");
            selectedRow.cells[4].innerText = (sexe === "M") ? "Masculin" : "Féminin";
            selectedRow.cells[5].innerText = email;
            selectedRow.cells[6].innerText = tel;
            selectedRow.cells[7].innerText = niveau;
            selectedRow.cells[8].innerText = specialite;
            selectedRow.cells[9].innerText = localisation;
            selectedRow.cells[10].innerText = (status === "chercheur") ? "chercheur" : "proposeur";

            modal.style.display = "none";
            showNotification("Utilisateur modifié avec succès ✅");

        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error(err);
    });

};


/* ==============================
SUPPRESSION UTILISATEUR — AVEC PHP
============================== */

const confirmModal = document.getElementById("confirmModal");
const deleteBtn = document.getElementById("deleteBtn");

deleteBtn.onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un utilisateur");
        return;
    }

    confirmModal.style.display = "block";

};

document.getElementById("confirmYes").onclick = function(){

    // Récupère l'ID de l'utilisateur sélectionné
    let userId = selectedRow.cells[0].innerText;

    // Envoie la demande de suppression au PHP
    fetch("../../Controller/utilisateur-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "supprimer",
            id    : userId
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            // Supprime la ligne du tableau HTML
            selectedRow.remove();
            selectedRow = null;
            confirmModal.style.display = "none";
            showNotification("Utilisateur supprimé avec succès ✅");
        } else {
            showNotification("Erreur : " + data.message);
        }
    })
    .catch(err => {
        showNotification("Erreur de connexion au serveur");
        console.error(err);
    });

};

document.querySelector(".closeConfirm").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};

document.getElementById("confirmNo").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};



window.onclick = function(event){
    if(event.target === modal){
        modal.style.display = "none";
        showNotification("Modification annulée");
    }
    if(event.target === confirmModal){
        confirmModal.style.display = "none";
        showNotification("Suppression annulée");
    }
};


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


/* ==============================
CHARGEMENT DES DONNÉES BDD
============================== */

window.onload = function(){

    // Récupère le rôle depuis localStorage
    let role = localStorage.getItem("role");

    // Grise le bouton Table d'Admins si admin simple
    let btn = document.getElementById("adminTableBtn");
    if(role === "admin"){
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    // Charge les utilisateurs depuis la BDD via PHP
    fetch("../../Controller/utilisateur-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lister" })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            let tbody = document.querySelector("#userTable tbody");
            tbody.innerHTML = ""; // Vide les données statiques HTML

            // Remplit le tableau avec les vraies données de la BDD
            data.utilisateurs.forEach(user => {
                let row = tbody.insertRow();
                row.innerHTML = `
                    <td>${user.ID}</td>
                    <td>${user.nom}</td>
                    <td>${user.prenom}</td>
                    <td>${user.DateDeNaissance}</td>
                    <td>${user.sexe}</td>
                    <td>${user.email}</td>
                    <td>${user.NumTel ?? ''}</td>
                    <td>${user.niveau ?? ''}</td>
                    <td>${user.specialite ?? ''}</td>
                    <td>${user.localisation ?? ''}</td>
                    <td>${user.status ?? ''}</td>
                `;
            });
        }
    })
    .catch(err => console.error("Erreur chargement utilisateurs:", err));

};