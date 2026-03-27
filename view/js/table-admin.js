// ============================================================
// CONFIGURATION — chemin vers le fichier PHP
// ============================================================
const PHP_URL = "manage_admins.php";


// ============================================================
// CHARGEMENT INITIAL — récupère les admins depuis la BDD
// ============================================================
window.onload = function () {
    chargerAdmins();
};

function chargerAdmins() {
    fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lister" })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            showNotification("Erreur lors du chargement des admins");
            return;
        }
        const tbody = document.querySelector("#adminTable tbody");
        tbody.innerHTML = "";

        data.admins.forEach(a => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${a.ID}</td>
                <td>${a.nom}</td>
                <td>${a.prenom}</td>
                <td>${a.DateDeNaissance}</td>
                <td>${a.email}</td>
                <td>${a.numTel ?? ""}</td>
                <td>${a.role}</td>
            `;
        });
    })
    .catch(() => showNotification("Impossible de contacter le serveur"));
}


// ============================================================
// SÉLECTION DE LIGNE
// ============================================================
let selectedRow = null;
const table = document.getElementById("adminTable");

table.addEventListener("click", function (e) {
    const row = e.target.closest("tr");
    if (!row || row.rowIndex === 0) return;

    if (selectedRow) selectedRow.classList.remove("selected");
    selectedRow = row;
    row.classList.add("selected");
});

document.addEventListener("click", function (e) {
    if (
        selectedRow &&
        !e.target.closest("#adminTable tbody tr") &&
        !e.target.closest(".buttons") &&
        !e.target.closest(".modal-content")
    ) {
        selectedRow.classList.remove("selected");
        selectedRow = null;
    }
});


// ============================================================
// MODAL AJOUT
// ============================================================
const modal      = document.getElementById("modal");
const addBtn     = document.getElementById("addBtn");
const cancelBtn  = document.getElementById("cancelAdd");
const closeModal = document.querySelector(".close");

addBtn.onclick = () => {
    modal.style.display = "block";
};

cancelBtn.onclick = () => {
    modal.style.display = "none";
    showNotification("Ajout annulé");
};

closeModal.onclick = cancelBtn.onclick;


// ============================================================
// AJOUTER UN ADMIN
// ============================================================
document.getElementById("confirmAdd").onclick = function () {
    const nomAdd    = document.getElementById("nomInputAdd").value.trim();
    const prenomAdd = document.getElementById("prenomInputAdd").value.trim();
    const dateAdd   = document.getElementById("dateInputAdd").value;
    const emailAdd  = document.getElementById("emailInputAdd").value.trim();
    const telAdd    = document.getElementById("telInputAdd").value.trim();
    const passAdd   = document.getElementById("passWordAdd").value;
    const roleAdd   = document.getElementById("roleInputAdd").value;

    if (!nomAdd || !prenomAdd || !dateAdd || !emailAdd || !passAdd || !roleAdd) {
        showNotification("Veuillez remplir tous les champs obligatoires");
        return;
    }

    fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action:   "ajouter",
            nom:      nomAdd,
            prenom:   prenomAdd,
            date:     dateAdd,
            email:    emailAdd,
            tel:      telAdd,
            password: passAdd,
            role:     roleAdd
        })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            showNotification(data.message);
            return;
        }

        // Ajouter la ligne avec l'ID RÉEL retourné par MySQL
        const tbody = document.querySelector("#adminTable tbody");
        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>${data.id}</td>
            <td>${nomAdd}</td>
            <td>${prenomAdd}</td>
            <td>${dateAdd}</td>
            <td>${emailAdd}</td>
            <td>${telAdd}</td>
            <td>${roleAdd}</td>
        `;

        // Vider les champs du formulaire
        document.getElementById("nomInputAdd").value    = "";
        document.getElementById("prenomInputAdd").value = "";
        document.getElementById("dateInputAdd").value   = "";
        document.getElementById("emailInputAdd").value  = "";
        document.getElementById("telInputAdd").value    = "";
        document.getElementById("passWordAdd").value    = "";
        document.getElementById("roleInputAdd").value   = "";

        modal.style.display = "none";
        showNotification("Admin ajouté avec succès");
    })
    .catch(() => showNotification("Erreur réseau lors de l'ajout"));
};


// ============================================================
// MODAL MODIFIER
// ============================================================
const modifierModal = document.getElementById("modifierModal");
const editBtn       = document.getElementById("editBtn");

editBtn.onclick = function () {
    if (!selectedRow) {
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }

    // Conversion DD/MM/YYYY → YYYY-MM-DD pour l'input date
    const rawDate = selectedRow.cells[3].innerText;
    const parts   = rawDate.split("/");
    const formattedDate = parts.length === 3
        ? `${parts[2]}-${parts[1]}-${parts[0]}`
        : rawDate;

    document.getElementById("nomInput").value        = selectedRow.cells[1].innerText;
    document.getElementById("prenomInput").value     = selectedRow.cells[2].innerText;
    document.getElementById("dateInput").value       = formattedDate;
    document.getElementById("emailInput2").value     = selectedRow.cells[4].innerText;
    document.getElementById("telInput").value        = selectedRow.cells[5].innerText;
    document.getElementById("passWordEdit").value    = "";   // ne jamais pré-remplir le mot de passe
    document.getElementById("roleInputEdit").value   = selectedRow.cells[6].innerText;

    modifierModal.style.display = "block";
};

document.getElementById("confirmModifier").onclick = function () {
    const id     = parseInt(selectedRow.cells[0].innerText);
    const nom    = document.getElementById("nomInput").value.trim();
    const prenom = document.getElementById("prenomInput").value.trim();
    const date   = document.getElementById("dateInput").value;
    const email  = document.getElementById("emailInput2").value.trim();
    const tel    = document.getElementById("telInput").value.trim();
    const pass   = document.getElementById("passWordEdit").value;
    const role   = document.getElementById("roleInputEdit").value;

    if (!nom || !prenom || !date || !email || !role) {
        showNotification("Veuillez remplir tous les champs obligatoires");
        return;
    }

    fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action:   "modifier",
            id:       id,
            nom:      nom,
            prenom:   prenom,
            date:     date,
            email:    email,
            tel:      tel,
            password: pass,   // vide = on garde l'ancien mot de passe (géré côté PHP)
            role:     role
        })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            showNotification(data.message);
            return;
        }

        // Conversion YYYY-MM-DD → DD/MM/YYYY pour l'affichage
        const p = date.split("-");
        const displayDate = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : date;

        selectedRow.cells[1].innerText = nom;
        selectedRow.cells[2].innerText = prenom;
        selectedRow.cells[3].innerText = displayDate;
        selectedRow.cells[4].innerText = email;
        selectedRow.cells[5].innerText = tel;
        selectedRow.cells[6].innerText = role;

        modifierModal.style.display = "none";
        showNotification("Admin modifié avec succès");
    })
    .catch(() => showNotification("Erreur réseau lors de la modification"));
};

document.querySelector(".closeModifier").onclick = function () {
    modifierModal.style.display = "none";
    showNotification("Modification annulée");
};

document.getElementById("cancelModifier").onclick = function () {
    modifierModal.style.display = "none";
    showNotification("Modification annulée");
};


// ============================================================
// SUPPRESSION D'UN ADMIN
// ============================================================
const confirmModal = document.getElementById("confirmModal");
const deleteBtn    = document.getElementById("deleteBtn");

deleteBtn.onclick = function () {
    if (!selectedRow) {
        showNotification("Il faut d'abord sélectionner un Admin");
        return;
    }
    confirmModal.style.display = "block";
};

document.getElementById("confirmYes").onclick = function () {
    const id = parseInt(selectedRow.cells[0].innerText);

    fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "supprimer", id: id })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            showNotification(data.message);
            return;
        }
        selectedRow.remove();
        selectedRow = null;
        confirmModal.style.display = "none";
        showNotification("Admin supprimé avec succès");
    })
    .catch(() => showNotification("Erreur réseau lors de la suppression"));
};

document.querySelector(".closeConfirm").onclick = function () {
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};

document.getElementById("confirmNo").onclick = function () {
    confirmModal.style.display = "none";
    showNotification("Suppression annulée");
};


// ============================================================
// FERMETURE DES MODALS EN CLIQUANT À L'EXTÉRIEUR
// ============================================================
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
        showNotification("Ajout annulé");
    }
    if (event.target === confirmModal) {
        confirmModal.style.display = "none";
        showNotification("Suppression annulée");
    }
    if (event.target === modifierModal) {
        modifierModal.style.display = "none";
        showNotification("Modification annulée");
    }
};


// ============================================================
// NOTIFICATION
// ============================================================
function showNotification(message) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "block";

    setTimeout(() => {
        notif.style.display = "none";
    }, 3000);
}