// ========================
// PIXEL ART BANNER (Mario-style)
// ========================
(function drawPixelBanner() {
  const canvas = document.getElementById('pixelCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = 800, H = 180;
  canvas.width  = W;
  canvas.height = H;

  const S = 8; // pixel size

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  sky.addColorStop(0, '#6b8cff');
  sky.addColorStop(1, '#9bb8ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.65);

  // Ground
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(0, H * 0.68, W, H * 0.32);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(0, H * 0.68, W, S);

  // Draw green hills
  function drawHill(cx, cy, rx, ry, color, darkColor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0);
    ctx.fill();
    // Highlight
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.2, cy - ry * 0.5, rx * 0.3, ry * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHill(100, H * 0.68, 90, 60, '#3d8b3d', '#5ab75a');
  drawHill(380, H * 0.68, 130, 75, '#2d7a2d', '#4aa84a');
  drawHill(650, H * 0.68, 100, 55, '#3d8b3d', '#5ab75a');
  drawHill(780, H * 0.68, 70, 45, '#2d7a2d', '#4aa84a');

  // Brick tiles (ground level)
  const brickColor  = '#c84b11';
  const brickDark   = '#a0360a';
  const brickLight  = '#e06020';
  const groundY = Math.floor(H * 0.68 / S) * S;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < Math.ceil(W / S); col++) {
      const x = col * S;
      const y = groundY + row * S;
      const offset = row % 2 === 0 ? 0 : S / 2;
      ctx.fillStyle = brickColor;
      ctx.fillRect(x, y, S - 1, S - 1);
      ctx.fillStyle = brickDark;
      ctx.fillRect(x, y + S - 2, S - 1, 2);
      ctx.fillRect(x + S - 2, y, 2, S - 1);
    }
  }

  // Brick blocks (floating)
  function drawBrick(gx, gy) {
    const x = gx * S, y = gy * S;
    ctx.fillStyle = brickColor;
    ctx.fillRect(x, y, S - 1, S - 1);
    ctx.fillStyle = brickLight;
    ctx.fillRect(x, y, S - 1, 2);
    ctx.fillRect(x, y, 2, S - 1);
    ctx.fillStyle = brickDark;
    ctx.fillRect(x, y + S - 2, S - 1, 2);
    ctx.fillRect(x + S - 2, y, 2, S - 1);
  }

  function drawQBlock(gx, gy) {
    const x = gx * S, y = gy * S;
    ctx.fillStyle = '#e8a000';
    ctx.fillRect(x, y, S - 1, S - 1);
    ctx.fillStyle = '#ffd040';
    ctx.fillRect(x + 1, y + 1, S - 4, 2);
    ctx.fillRect(x + 1, y + 1, 2, S - 4);
    ctx.fillStyle = '#c87000';
    ctx.fillRect(x, y + S - 2, S - 1, 2);
    ctx.fillRect(x + S - 2, y, 2, S - 1);
    // "?" mark
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${S * 0.7}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('?', x + S / 2, y + S * 0.75);
  }

  // Row of bricks + ? blocks
  const blockRow = Math.floor(H * 0.45 / S);
  [20,21,22].forEach(c => drawBrick(c, blockRow));
  drawQBlock(24, blockRow);
  drawBrick(25, blockRow);
  drawQBlock(26, blockRow);
  drawQBlock(27, blockRow);
  drawBrick(28, blockRow);

  // Second set (right side)
  const blockRow2 = Math.floor(H * 0.35 / S);
  [70,71,72,73].forEach(c => drawBrick(c, blockRow2));
  drawQBlock(74, blockRow2);
  drawBrick(75, blockRow2);

  // Pipe
  function drawPipe(gx, height) {
    const x  = gx * S;
    const y  = groundY - height * S;
    const w  = 4 * S;
    const hw = 5 * S;
    const hh = S;
    // Body
    ctx.fillStyle = '#00a800';
    ctx.fillRect(x, y, w, height * S);
    ctx.fillStyle = '#00c800';
    ctx.fillRect(x, y, 4, height * S);
    ctx.fillStyle = '#006600';
    ctx.fillRect(x + w - 4, y, 4, height * S);
    // Head
    ctx.fillStyle = '#00a800';
    ctx.fillRect(x - 4, y - hh, hw, hh);
    ctx.fillStyle = '#00c800';
    ctx.fillRect(x - 4, y - hh, hw, 4);
    ctx.fillStyle = '#006600';
    ctx.fillRect(x - 4, y - 4, hw, 4);
  }

  drawPipe(45, 5);
  drawPipe(90, 7);

  // Mario sprite (simple pixel art)
  function drawMario(gx, gy) {
    const x = gx * S, y = gy * S;
    const P = S / 2; // half pixel

    const m = [
      [0,0,'#ff0000',2,0],
      // hat
      ...(() => {
        const pixels = [];
        // Hat (red)
        for (let c = 1; c < 5; c++) pixels.push([c, 0, '#cc0000']);
        // Skin row 1
        pixels.push([0,1,'#ffaa77'],[1,1,'#ffaa77'],[2,1,'#cc0000'],[3,1,'#ffaa77'],[4,1,'#ffaa77'],[5,1,'#ffaa77']);
        // Skin row 2
        pixels.push([0,2,'#ffaa77'],[1,2,'#ff0000'],[2,2,'#ffaa77'],[3,2,'#ffaa77'],[4,2,'#ff0000'],[5,2,'#33aaff']);
        // Overall row 1
        pixels.push([0,3,'#0044ff'],[1,3,'#0044ff'],[2,3,'#0044ff'],[3,3,'#0044ff'],[4,3,'#0044ff'],[5,3,'#0044ff']);
        // Overall row 2
        pixels.push([0,4,'#0044ff'],[1,4,'#ffaa77'],[2,4,'#0044ff'],[3,4,'#0044ff'],[4,4,'#ffaa77'],[5,4,'#0044ff']);
        // Legs
        pixels.push([0,5,'#cc7700'],[1,5,'#cc7700'],[2,5,'#000000'],[3,5,'#000000'],[4,5,'#cc7700'],[5,5,'#cc7700']);
        return pixels;
      })()
    ];

    // Draw a simplified mario silhouette
    const mario = [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,1,0],
      [0,0,2,2,3,2,0,0],
      [0,2,3,2,2,3,2,0],
      [0,2,2,2,2,2,2,0],
      [0,0,1,4,4,1,0,0],
      [0,1,4,1,1,4,1,0],
      [1,1,0,0,0,0,1,1],
    ];
    // 0=transparent, 1=red(hat/shirt), 2=skin, 3=brown(hair/shoes), 4=blue(overalls)
    const colors = ['', '#cc2200', '#ffaa77', '#885500', '#2244bb'];
    for (let row = 0; row < mario.length; row++) {
      for (let col = 0; col < mario[row].length; col++) {
        const c = mario[row][col];
        if (!c) continue;
        ctx.fillStyle = colors[c];
        ctx.fillRect(x + col * S, y + row * S, S - 1, S - 1);
      }
    }
  }

  const marioGroundRow = Math.floor(groundY / S) - 8;
  drawMario(34, marioGroundRow);

  // Cloud
  function drawCloud(gx, gy) {
    const x = gx * S, y = gy * S;
    ctx.fillStyle = '#fff';
    [
      [1,2,4,2],[0,1,6,3],[0,0,6,4],[1,-1,4,2]
    ].forEach(([dx,dy,w,h]) => {
      ctx.fillRect(x + dx * S, y + dy * S, w * S, h * S);
    });
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x, y + 2 * S, 6 * S, 2);
  }

  drawCloud(5, 2);
  drawCloud(55, 1);
  drawCloud(80, 3);

  // Star / coins
  function drawCoin(gx, gy) {
    const x = gx * S + S/2, y = gy * S + S/2;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y, S * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(x, y, S * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let c = 22; c <= 28; c++) drawCoin(c, blockRow - 2);

})();


// ========================
// VOIR PLUS TOGGLE
// ========================
const voirPlusBtn = document.getElementById('voirPlusBtn');
const expandedSection = document.getElementById('expandedSection');

voirPlusBtn.addEventListener('click', () => {
  const isOpen = expandedSection.classList.toggle('open');
  voirPlusBtn.classList.toggle('open', isOpen);
  voirPlusBtn.innerHTML = isOpen
    ? 'voir moins <i class="fa-solid fa-chevron-up"></i>'
    : 'voir plus <i class="fa-solid fa-chevron-down"></i>';
});


// ========================
// MORE DROPDOWN
// ========================
const moreBtn = document.getElementById('moreBtn');
const moreDropdown = document.getElementById('moreDropdown');

moreBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  moreDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
  moreDropdown.classList.remove('open');
});


// ========================
// SEE MORE TEXT
// ========================
const seeMoreBtn1 = document.getElementById('seeMoreBtn1');
const seeMoreText1 = document.getElementById('seeMoreText1');
let expanded1 = false;

seeMoreBtn1.addEventListener('click', () => {
  expanded1 = !expanded1;
  seeMoreText1.style.display = expanded1 ? 'inline' : 'none';
  seeMoreBtn1.textContent = expanded1 ? ' voir moins' : '...voir plus';
});


// ========================
// LIKE BUTTONS
// ========================
function setupLike(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('liked');
    const icon = btn.querySelector('i');
    if (btn.classList.contains('liked')) {
      icon.className = 'fa-solid fa-heart';
      btn.querySelector('span').textContent = "J'aime (1)";
    } else {
      icon.className = 'fa-regular fa-heart';
      btn.querySelector('span').textContent = "J'aime";
    }
  });
}

setupLike('likeBtn1');
setupLike('likeBtn2');


// ========================
// CHAT PANEL
// ========================
const chatPanel     = document.getElementById('chatPanel');
const chatPanelClose = document.getElementById('chatPanelClose');
const chatInput     = document.getElementById('chatInput');
const chatMessages  = document.getElementById('chatMessages');
const fabMsgBtn     = document.getElementById('fabMsgBtn');
const openChatBtn   = document.getElementById('openChatBtn');

function openChat() {
  chatPanel.classList.add('active');
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.focus();
  }, 50);
}

fabMsgBtn.addEventListener('click', () => chatPanel.classList.toggle('active'));
if (openChatBtn) openChatBtn.addEventListener('click', openChat);
chatPanelClose.addEventListener('click', () => chatPanel.classList.remove('active'));

document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  const txt = chatInput.value.trim();
  if (!txt) return;
  const now = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
  const msg = document.createElement('div');
  msg.className = 'chat-msg sent';
  msg.innerHTML = `<div class="msg-bubble">${txt}</div><div class="msg-time">${time}</div>`;
  chatMessages.appendChild(msg);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


// ========================
// NOTIFICATION TOAST
// ========================
function showNotification(message) {
  const notif = document.getElementById('notification');
  notif.innerText = message;
  notif.style.display = 'flex';
  setTimeout(() => { notif.style.display = 'none'; }, 3500);
}


// ========================
// LINK / CV BUTTONS
// ========================
document.getElementById('linkBtn').addEventListener('click', () => {
  showNotification('⚠️  Aucun lien ajouté pour ce profil.');
});

document.getElementById('cvBtn').addEventListener('click', () => {
  showNotification('⚠️  Aucun CV disponible pour ce profil.');
});