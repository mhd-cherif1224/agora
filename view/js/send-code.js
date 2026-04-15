const emailInput   = document.getElementById('email');
  const errorMsg     = document.getElementById('errorMsg');
  const errorText    = document.getElementById('errorText');
  const sendBtn      = document.getElementById('sendBtn');
  const formView     = document.getElementById('formView');
  const successView  = document.getElementById('successView');
  const sentEmail    = document.getElementById('sentEmail');
  const progressFill = document.getElementById('progressFill');
  const card         = document.getElementById('card');

  const RESEND_URL = "../../Controller/resend-code.php";

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  function showError(msg) {
    errorText.textContent = msg;
    errorMsg.classList.add('visible');
    emailInput.style.borderColor = '#e74c3c';
    emailInput.style.boxShadow   = '0 0 0 3px rgba(231,76,60,.15)';
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  }
  function clearError() {
    errorMsg.classList.remove('visible');
    emailInput.style.borderColor = '';
    emailInput.style.boxShadow   = '';
  }

  emailInput.addEventListener('input', clearError);

 
async function handleSend() {
    const val = emailInput.value.trim();
    if (!val)              { showError("L'adresse e-mail est requise."); return; }
    if (!isValidEmail(val)) { showError("Format d'e-mail invalide."); return; }

    clearError();
    sendBtn.classList.add('loading');
    sendBtn.disabled = true;

     try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: val })
    });

    const result = await response.json();

    if (result.success) {
      // Sauvegarde l'email pour la page de vérification
      localStorage.setItem("pendingEmail", val);

      // Affiche le succès + barre de progression
      sentEmail.textContent = val;
      formView.style.display = 'none';
      successView.classList.add('visible');
      requestAnimationFrame(() => { progressFill.style.width = '100%'; });

      // Redirige vers la vérification après 3.2s
      setTimeout(() => {
        window.location.href = 'code-verification.html?email=' + encodeURIComponent(val);
      }, 3200);

    } else {
      showError(result.message || "Impossible d'envoyer le code.");
      sendBtn.classList.remove('loading');
      sendBtn.disabled = false;
    }

  } catch (err) {
    showError("Erreur réseau : " + err.message);
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }
}

emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });