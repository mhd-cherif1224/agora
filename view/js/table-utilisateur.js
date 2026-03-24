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


/* MODAL */

const modal = document.getElementById("modal");
const modifierBtn = document.getElementById("modifierBtn");
const cancelBtn = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".close");


modifierBtn.onclick = function(){

    if(!selectedRow){
        showNotification("Il faut d'abord sélectionner un utilisateur");
        return;
    }

    // Convert DD/MM/YYYY → YYYY-MM-DD for the date input
    let rawDate = selectedRow.cells[3].innerText;
    let parts = rawDate.split("/");
    let formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : rawDate;

    document.getElementById("nomInput").value        = selectedRow.cells[1].innerText;
    document.getElementById("prenomInput").value     = selectedRow.cells[2].innerText;
    document.getElementById("dateInput").value       = formattedDate;
    document.getElementById("sexeInput").value       = selectedRow.cells[4].innerText;
    document.getElementById("emailInput").value      = selectedRow.cells[5].innerText;
    document.getElementById("telInput").value        = selectedRow.cells[6].innerText;
    document.getElementById("niveauInput").value     = selectedRow.cells[7].innerText;
    document.getElementById("specialiteInput").value = selectedRow.cells[8].innerText;

    modal.style.display = "block";

};

cancelBtn.onclick = () =>{
    modal.style.display = "none";
    showNotification("Modification annulée");
};

closeModal.onclick = cancelBtn.onclick;


/* MODIFICATION */
document.getElementById("confirmAdd").onclick = function(){

    let nom        = document.getElementById("nomInput").value;
    let prenom     = document.getElementById("prenomInput").value;
    let dateVal    = document.getElementById("dateInput").value;  // renamed
    let sexe       = document.getElementById("sexeInput").value;
    let email      = document.getElementById("emailInput").value;
    let tel        = document.getElementById("telInput").value;
    let niveau     = document.getElementById("niveauInput").value;
    let specialite = document.getElementById("specialiteInput").value;

    if(nom == "" || prenom == "" || email == "" || dateVal =="" || sexe ==""){
        showNotification("Veuillez remplir les champs");
        return;
    }

    // Convert YYYY-MM-DD → DD/MM/YYYY
    let parts = dateVal.split("-");
    let formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateVal;

    selectedRow.cells[1].innerText = nom;
    selectedRow.cells[2].innerText = prenom;
    selectedRow.cells[3].innerText = formattedDate;
    selectedRow.cells[4].innerText = (sexe === "M") ? "Masculin" : "Féminin";
    selectedRow.cells[5].innerText = email;
    selectedRow.cells[6].innerText = tel;
    selectedRow.cells[7].innerText = niveau;
    selectedRow.cells[8].innerText = specialite;

    modal.style.display = "none";
    showNotification("Utilisateur modifié");

};


/* SUPPRESSION */

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

    selectedRow.remove();
    selectedRow = null;
    confirmModal.style.display = "none";

    showNotification("Utilisateur supprimé");

};

document.querySelector(".closeConfirm").onclick = function(){

    confirmModal.style.display = "none";

    showNotification("Suppression annulée");

};

document.getElementById("confirmNo").onclick = function(){
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};


/* NOTIFICATION */

function showNotification(message){

    const notif = document.getElementById("notification");

    notif.innerText = message;
    notif.style.display = "block";

    setTimeout(()=>{
        notif.style.display="none";
    },3000);

}

// Ce code s'exécute lorsque la page est complètement chargée
window.onload = function(){

    // Récupère le rôle de l'utilisateur depuis le localStorage
    // La valeur a été stockée lors du login (super_admin ou admin)
    let role = localStorage.getItem("role");

    // Sélectionne le bouton "Table d'Admins" sur la page
    let btn = document.getElementById("adminTableBtn");

    // Si l'utilisateur est un admin simple (pas super_admin)
    if(role === "admin"){
        // On grise le bouton pour montrer qu'il n'est pas cliquable
        btn.style.opacity = "0.5";

        // On désactive complètement le clic sur le bouton
        btn.style.pointerEvents = "none";
    }

    // Affiche l'email de l'utilisateur connecté dans la page
    // Récupéré depuis le localStorage
    let email = localStorage.getItem("email");
    document.getElementById("userName").innerText = email;
};