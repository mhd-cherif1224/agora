// PROFILE PREVIEW
document.getElementById("profileInput").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            let img = document.createElement("img");
            img.src = e.target.result;

            const profile = document.querySelector(".profile");
            profile.innerHTML = "";
            profile.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
});

// BANNER PREVIEW
document.getElementById("bannerInput").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            let img = document.createElement("img");
            img.src = e.target.result;

            const banner = document.querySelector(".banner");
            banner.innerHTML = "";
            banner.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
});

// BUTTONS
document.querySelector(".finish").addEventListener("click", () => {
    alert("Inscription terminée !");
    window.location.href = "login-user.html";
});

document.querySelector(".skip").addEventListener("click", () => {
    window.location.href = "login-user.html";
});

document.getElementById("back").addEventListener("click", () => {
    
    window.location.href = "user-formulaire.html";
});