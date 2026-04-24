// ── chat.js ──
// Handles the floating chat panel open/close and message sending

document.addEventListener('DOMContentLoaded', () => {

  const panel      = document.getElementById('chatPanel');
  const closeBtn   = document.getElementById('chatClose');
  const fabChatBtn = document.getElementById('fabMsgBtn');
  const navChatBtn = document.getElementById('navChat');
  const input      = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSend');
  const messages   = document.getElementById('chatMessages');

  const botPanel   = document.getElementById('chatbotPanel');
  const botCloseBtn= document.getElementById('chatbotClose');
  const fabHelpBtn = document.getElementById('fabHelpBtn');
  const botInput   = document.getElementById('chatbotInput');
  const botSendBtn = document.getElementById('chatbotSend');
  const botMessages= document.getElementById('chatbotMessages');

  function openChat()  { panel.classList.add('active'); }
  function closeChat() { panel.classList.remove('active'); }

  function openBotChat() { botPanel.classList.add('active'); }
  function closeBotChat() { botPanel.classList.remove('active'); }

  if (fabChatBtn) fabChatBtn.addEventListener('click', openChat);
  if (navChatBtn) navChatBtn.addEventListener('click', openChat);
  if (closeBtn)   closeBtn.addEventListener('click', closeChat);

  if (fabHelpBtn) fabHelpBtn.addEventListener('click', openBotChat);
  if (botCloseBtn) botCloseBtn.addEventListener('click', closeBotChat);

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const msg = document.createElement('div');
    msg.className = 'chat-msg sent';
    msg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    `;
    messages.appendChild(msg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
  }

  function sendBotMessage() {
    const text = botInput.value.trim();
    if (!text) return;

    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg sent';
    userMsg.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    `;
    botMessages.appendChild(userMsg);
    botInput.value = '';
    botMessages.scrollTop = botMessages.scrollHeight;

    // Get user ID from localStorage
    const userId = localStorage.getItem('utilisateur_id') || localStorage.getItem('admin_id') || 'anonymous';

    // Send to bot API
    fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: text,
        user_id: userId
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg received';
        botMsg.innerHTML = `
          <div class="msg-bubble">${escapeHtml(data.response)}</div>
          <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
        `;
        botMessages.appendChild(botMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      } else if (data.error) {
        console.error('Bot error:', data.error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'chat-msg received';
        errorMsg.innerHTML = `
          <div class="msg-bubble">Désolé, une erreur s'est produite.</div>
          <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
        `;
        botMessages.appendChild(errorMsg);
        botMessages.scrollTop = botMessages.scrollHeight;
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'chat-msg received';
      errorMsg.innerHTML = `
        <div class="msg-bubble">Impossible de contacter l'assistant.</div>
        <span class="msg-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
      `;
      botMessages.appendChild(errorMsg);
      botMessages.scrollTop = botMessages.scrollHeight;
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input)   input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  if (botSendBtn) botSendBtn.addEventListener('click', sendBotMessage);
  if (botInput)   botInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendBotMessage(); });

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

});
