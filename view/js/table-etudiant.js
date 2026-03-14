let selectedRow = null;
const table = document.getElementById("studentTable");

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

    if(selectedRow && !e.target.closest("#studentTable tbody tr") && !e.target.closest(".buttons")){
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }

});


/* MODAL */

const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBtn");
const cancelBtn = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".close");

addBtn.onclick = () =>{
    modal.style.display = "block";
};

cancelBtn.onclick = () =>{
    modal.style.display = "none";
    showNotification("Ajout annulé");
};

closeModal.onclick = cancelBtn.onclick;


/* AJOUTER */

document.getElementById("confirmAdd").onclick = function(){

    let nom = document.getElementById("nomInput").value;
    let prenom = document.getElementById("prenomInput").value;
    let date = document.getElementById("dateInput").value;
    let sexe = document.getElementById("sexeInput").value;
    let email = document.getElementById("emailInput").value;
    let tel = document.getElementById("telInput").value;
    let niveau = document.getElementById("niveauInput").value;
    let specialite = document.getElementById("specialiteInput").value;

    if(nom=="" || prenom=="" || email==""){
    showNotification("Veuillez remplir les champs");
    return;
}

let tbody = document.querySelector("#studentTable tbody");

let maxId = 0;

for(let row of tbody.rows){
    let id = parseInt(row.cells[0].innerText);
    if(id > maxId) maxId = id;
}

let newRow = tbody.insertRow();

newRow.innerHTML = `
    <td>${maxId+1}</td>
    <td>${nom}</td>
    <td>${prenom}</td>
    <td>${date}</td>
    <td>${sexe}</td>
    <td>${email}</td>
    <td>${tel}</td>
    <td>${niveau}</td>
    <td>${specialite}</td>
    <td>0</td>
`;

modal.style.display = "none";

showNotification("Étudiant ajouté");

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
