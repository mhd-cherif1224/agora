// ════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════
let currentProfileSrc = null;

// ========================
// NOTIFICATIONS TOAST
// ========================
function showNotification(message, duration = 3500) {
    const notif = document.getElementById("notification");
    notif.innerText = message;
    notif.style.display = "flex";
    clearTimeout(notif._t);
    notif._t = setTimeout(() => { notif.style.display = "none"; }, duration);
}

// ========================
// DOMINANT COLORS
// ========================
function getDominantColors(source, topN = 2) {
    let canvas, ctx;
    if (source instanceof HTMLCanvasElement) { canvas = source; ctx = canvas.getContext('2d'); }
    else {
        canvas = document.createElement('canvas'); ctx = canvas.getContext('2d');
        const MAX = 200; let w = source.naturalWidth||source.width, h = source.naturalHeight||source.height;
        if (w>MAX||h>MAX){const s=MAX/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}
        canvas.width=w; canvas.height=h; ctx.drawImage(source,0,0,w,h);
    }
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data, counts={};
    for(let i=0;i<data.length;i+=4){
        if(data[i+3]<128) continue;
        const r=Math.round(data[i]/16)*16, g=Math.round(data[i+1]/16)*16, b=Math.round(data[i+2]/16)*16;
        const key=`${r},${g},${b}`; counts[key]=(counts[key]||0)+1;
    }
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,topN)
        .map(([key])=>{const [r,g,b]=key.split(',').map(Number);return{hex:'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')};});
}
function adaptColor(hex,amount=80){
    let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    const br=(r*299+g*587+b*114)/1000;
    if(br>128){r=Math.max(0,r-amount);g=Math.max(0,g-amount);b=Math.max(0,b-amount);}
    else{r=Math.min(255,r+amount);g=Math.min(255,g+amount);b=Math.min(255,b+amount);}
    return'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function changeBannerColor(color1,color2){
    const br=h=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return(r*299+g*587+b*114)/1000;};
    const dark=br(color1)<br(color2)?color1:color2,light=br(color1)<br(color2)?color2:color1;
    document.getElementById("bannerBottom").style.background=`linear-gradient(to right, ${dark}, ${light})`;
}

// ========================
// UPDATE ALL POST AVATARS
// ========================
function updateAllPostAvatars(src) {
    currentProfileSrc = src;
    document.querySelectorAll('.post-avatar-dyn').forEach(el => {
        if (el.tagName === 'IMG') { el.src = src; }
        else {
            const img = document.createElement('img');
            img.src = src; img.className = el.className;
            img.style.cssText = el.style.cssText || 'width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0;';
            el.replaceWith(img);
        }
    });
    // Update comment input avatars
    document.querySelectorAll('.comment-input-avatar, .comment-avatar').forEach(av => {
        av.style.backgroundImage = `url(${src})`;
        av.style.backgroundSize = 'cover';
        av.style.backgroundPosition = 'center';
        av.textContent = '';
    });
    // new-post-box avatar
    const npAv = document.getElementById('newPostAvatar');
    if (npAv) { npAv.style.backgroundImage=`url(${src})`; npAv.style.backgroundSize='cover'; npAv.style.backgroundPosition='center'; npAv.textContent=''; }
}

// ========================
// CROPPER
// ========================
let cropperInstance=null, cropTarget=null;
const cropModal=document.getElementById("cropModal"), cropImage=document.getElementById("cropImage");

function openCropper(file,target,aspectRatio){
    cropTarget=target;
    const valid=["image/jpeg","image/png","image/jpg","image/gif"];
    if(!valid.includes(file.type)){showNotification("Format non supporté !");return;}
    const reader=new FileReader();
    reader.onload=e=>{
        if(cropperInstance){cropperInstance.destroy();cropperInstance=null;}
        cropImage.src=e.target.result; cropModal.classList.add("active");
        cropImage.onload=()=>{cropperInstance=new Cropper(cropImage,{aspectRatio,viewMode:1,movable:true,zoomable:true,scalable:false,cropBoxResizable:true,background:false});};
    };
    reader.readAsDataURL(file);
}
function closeCropper(){
    cropModal.classList.remove("active");
    if(cropperInstance){cropperInstance.destroy();cropperInstance=null;}
    document.getElementById("profileInput").value="";
    document.getElementById("bannerInput").value="";
}
document.getElementById("cropConfirm").addEventListener("click",()=>{
    if(!cropperInstance){showNotification("Erreur cropper.");return;}
    const canvas=cropperInstance.getCroppedCanvas({width:cropTarget==="profile"?300:1200,height:cropTarget==="profile"?300:400,imageSmoothingQuality:"high"});
    if(!canvas){showNotification("Erreur image.");return;}
    const url=canvas.toDataURL("image/jpeg",0.92);
    if(cropTarget==="profile"){
        document.getElementById("profilePreview").src=url;
        const navImg=document.getElementById("navAvatarImg"),navLetter=document.getElementById("navAvatarLetter");
        navImg.src=url; navImg.style.display="block"; navLetter.style.display="none";
        updateAllPostAvatars(url); // ← updates ALL avatars everywhere
    } else {
        const t=document.getElementById("bannerTop");
        t.style.backgroundImage=`url('${url}')`; t.style.backgroundSize="cover"; t.style.backgroundPosition="center"; t.style.backgroundRepeat="no-repeat";
        const cols=getDominantColors(canvas,2);
        changeBannerColor(cols[0].hex,adaptColor(cols[0].hex));
    }
    closeCropper();
});
document.getElementById("cropCancel").addEventListener("click",closeCropper);
cropModal.addEventListener("click",e=>{if(e.target===cropModal)closeCropper();});
document.getElementById("profileInput").addEventListener("change",function(){if(this.files[0])openCropper(this.files[0],"profile",1);});
document.getElementById("bannerInput").addEventListener("change",function(){if(this.files[0])openCropper(this.files[0],"banner",125/27);});

// ========================
// CV
// ========================
const cvInput=document.getElementById("cvInput"),cvName=document.getElementById("cvName");
let cvFileURL=null;
cvInput.addEventListener("change",function(){if(this.files.length>0){const file=this.files[0];cvFileURL=URL.createObjectURL(file);cvName.textContent="📄 "+file.name;cvName.style.cursor="pointer";cvName.style.textDecoration="underline";}});
cvName.addEventListener("click",function(){if(cvFileURL)window.open(cvFileURL,"_blank");});

// ========================
// SEE ALL SUGGESTIONS
// ========================
const seeAllBtn=document.getElementById('seeAllBtn'),listPreview=document.getElementById('suggestListPreview'),listAll=document.getElementById('suggestListAll');
let showingAll=false;
seeAllBtn.addEventListener('click',e=>{
    e.preventDefault(); showingAll=!showingAll;
    if(showingAll){listPreview.style.display='none';listAll.style.display='flex';seeAllBtn.textContent='← réduire les suggestions';}
    else{listAll.style.display='none';listPreview.style.display='flex';seeAllBtn.textContent='voir tous les suggestions →';}
});

// ========================
// CHAT PANEL
// ========================
const chatPanel=document.getElementById('chatPanel'),chatPanelClose=document.getElementById('chatPanelClose'),chatInput=document.getElementById('chatInput'),chatMessages=document.getElementById('chatMessages');
document.getElementById('fabMsgBtn').addEventListener('click',()=>{chatPanel.classList.toggle('active');if(chatPanel.classList.contains('active')){setTimeout(()=>{chatMessages.scrollTop=chatMessages.scrollHeight;},50);chatInput.focus();}});
chatPanelClose.addEventListener('click',()=>{chatPanel.classList.remove('active');});
document.getElementById('chatSendBtn').addEventListener('click',sendChatMessage);
chatInput.addEventListener('keydown',e=>{if(e.key==='Enter')sendChatMessage();});
function sendChatMessage(){const txt=chatInput.value.trim();if(!txt)return;const now=new Date(),time=now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');const msg=document.createElement('div');msg.className='chat-msg sent';msg.innerHTML=`<div class="msg-bubble">${txt}</div><div class="msg-time">${time}</div>`;chatMessages.appendChild(msg);chatInput.value='';chatMessages.scrollTop=chatMessages.scrollHeight;}

// ========================
// HELP PANEL
// ========================
const helpOverlay=document.getElementById('helpOverlay'),helpClose=document.getElementById('helpClose');
document.getElementById('fabHelpBtn').addEventListener('click',()=>{helpOverlay.classList.add('active');});
helpClose.addEventListener('click',()=>{helpOverlay.classList.remove('active');});
helpOverlay.addEventListener('click',e=>{if(e.target===helpOverlay)helpOverlay.classList.remove('active');});

// ========================
// LINKS WIDGET
// ========================
const openBtn=document.getElementById("openModal"),modal=document.getElementById("linkModal"),closeBtn=document.getElementById("closeModal"),saveBtn=document.querySelector(".save-btn"),input=document.getElementById("modalLinkInput"),container=document.getElementById("linksContainer"),emptyMsg=document.getElementById("linksEmpty"),badge=document.getElementById("linksBadge"),toggleBtn=document.getElementById("linksToggleBtn"),dropdown=document.getElementById("linksDropdown");
let links=JSON.parse(localStorage.getItem("links"))||[];
toggleBtn.addEventListener("click",e=>{e.stopPropagation();dropdown.classList.toggle("open");toggleBtn.classList.toggle("active");});
document.addEventListener("click",e=>{if(!dropdown.contains(e.target)&&e.target!==toggleBtn){dropdown.classList.remove("open");toggleBtn.classList.remove("active");}});
function displayLinks(){container.innerHTML="";links.forEach((link,index)=>{const div=document.createElement("div");div.className="link-item";const icon=document.createElement("div");icon.className="link-item-icon";icon.innerHTML='<i class="fa-solid fa-link"></i>';const a=document.createElement("a");try{a.textContent=new URL(link).hostname.replace("www.","");}catch{a.textContent=link;}a.href=link;a.title=link;a.target="_blank";a.addEventListener("click",e=>e.stopPropagation());const delBtn=document.createElement("button");delBtn.innerHTML="&#x2715;";delBtn.className="delete-btn";delBtn.title="Supprimer";delBtn.addEventListener("click",e=>{e.stopPropagation();links.splice(index,1);localStorage.setItem("links",JSON.stringify(links));displayLinks();});div.appendChild(icon);div.appendChild(a);div.appendChild(delBtn);container.appendChild(div);});emptyMsg.style.display=links.length===0?"block":"none";if(links.length>0){badge.textContent=links.length;badge.style.display="flex";}else{badge.style.display="none";}}
openBtn.addEventListener("click",e=>{e.stopPropagation();dropdown.classList.remove("open");toggleBtn.classList.remove("active");modal.style.display="flex";document.body.classList.add("modal-open");setTimeout(()=>input.focus(),50);});
closeBtn.addEventListener("click",()=>{modal.style.display="none";document.body.classList.remove("modal-open");input.value="";});
window.addEventListener("click",e=>{if(e.target===modal){modal.style.display="none";document.body.classList.remove("modal-open");input.value="";}});
input.addEventListener("keydown",e=>{if(e.key==="Enter")saveBtn.click();});
saveBtn.addEventListener("click",()=>{const link=input.value.trim();if(!link){showNotification("⚠️  Entrez un lien !");return;}if(!link.startsWith("http")){showNotification("⚠️  Lien invalide !");return;}links.push(link);localStorage.setItem("links",JSON.stringify(links));input.value="";modal.style.display="none";document.body.classList.remove("modal-open");displayLinks();showNotification("✓  Lien ajouté !");});
displayLinks();

// ════════════════════════════════════════
// INJECT STYLES FOR POST INTERACTIONS
// ════════════════════════════════════════
(function(){
    const s=document.createElement('style');
    s.textContent=`
    @keyframes postCardIn{from{transform:translateY(-14px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes postCardOut{to{opacity:0;transform:translateX(30px)}}

    .post-ctx-menu{display:none;position:absolute;top:34px;right:0;width:185px;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.14);z-index:500;padding:6px;animation:ctxIn .18s cubic-bezier(.34,1.3,.64,1) both}
    .post-ctx-menu.open{display:block}
    @keyframes ctxIn{from{transform:translateY(-6px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
    .ctx-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;font-family:'DM Sans',sans-serif;color:var(--text);transition:background .15s}
    .ctx-item:hover{background:var(--input-bg)}
    .ctx-item i{width:16px;text-align:center;color:var(--muted);font-size:12px}
    .ctx-item.danger{color:#dc2626}.ctx-item.danger i{color:#dc2626}
    .post-menu-btn{position:relative}

    .comments-section{border-top:1px solid var(--border);padding:12px 0 4px;margin-top:4px;display:none}
    .comments-section.open{display:block}
    .comment-list{display:flex;flex-direction:column;gap:10px;margin-bottom:10px}
    .comment-item{display:flex;gap:8px;align-items:flex-start}
    .comment-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#e8734a,#c9543a);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;color:#fff;border:1.5px solid var(--border);overflow:hidden;background-size:cover;background-position:center}
    .comment-avatar img{width:100%;height:100%;object-fit:cover;display:block}
    .comment-bubble{flex:1;background:var(--input-bg);border:1px solid var(--border);border-radius:12px;padding:8px 12px}
    .comment-author{font-weight:700;font-size:11px;color:var(--text);margin-bottom:2px}
    .comment-text{font-size:12px;color:var(--text);line-height:1.45}
    .comment-time{font-size:10px;color:var(--muted);margin-top:3px}
    .comment-input-row{display:flex;align-items:center;gap:8px}
    .comment-input-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#e8734a,#c9543a);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;color:#fff;border:1.5px solid var(--border);overflow:hidden;background-size:cover;background-position:center}
    .comment-input{flex:1;padding:7px 14px;border:1.5px solid var(--border);border-radius:20px;background:var(--input-bg);font-family:'DM Sans',sans-serif;font-size:12.5px;color:var(--text);outline:none;transition:border-color .2s}
    .comment-input:focus{border-color:var(--accent)}
    .comment-send{width:30px;height:30px;border:none;border-radius:50%;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;transition:background .2s,transform .1s;flex-shrink:0}
    .comment-send:hover{background:#0e2e6e}.comment-send:active{transform:scale(.93)}

    .edit-post-overlay{display:none;position:fixed;inset:0;background:rgba(26,23,20,.55);backdrop-filter:blur(6px);z-index:1300;justify-content:center;align-items:center}
    .edit-post-overlay.active{display:flex}
    .edit-post-modal{background:var(--surface);border:1px solid var(--border);border-radius:18px;width:100%;max-width:480px;padding:24px;box-shadow:0 24px 64px rgba(0,0,0,.2);animation:postModalIn .25s cubic-bezier(.34,1.3,.64,1) both}
    @keyframes postModalIn{from{transform:translateY(-16px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
    .edit-post-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:14px}
    .edit-post-textarea{width:100%;min-height:120px;padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--input-bg);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;resize:none;transition:border-color .2s;margin-bottom:14px}
    .edit-post-textarea:focus{border-color:var(--accent)}
    .edit-post-actions{display:flex;gap:10px;justify-content:flex-end}
    .edit-cancel-btn{padding:8px 20px;border:1px solid var(--border);border-radius:20px;background:transparent;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background .2s}
    .edit-cancel-btn:hover{background:var(--input-bg)}
    .edit-save-btn{padding:8px 20px;border:none;border-radius:20px;background:var(--text);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:background .2s}
    .edit-save-btn:hover{background:var(--accent)}

    .share-overlay{display:none;position:fixed;inset:0;background:rgba(26,23,20,.45);backdrop-filter:blur(5px);z-index:1300;justify-content:center;align-items:flex-end;padding-bottom:20px}
    .share-overlay.active{display:flex}
    .share-sheet{background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:420px;padding:20px 20px 14px;box-shadow:0 -4px 32px rgba(0,0,0,.15);animation:shareUp .28s cubic-bezier(.34,1.3,.64,1) both}
    @keyframes shareUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
    .share-title{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:16px;text-align:center;color:var(--text)}
    .share-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
    .share-item{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:8px;border-radius:12px;transition:background .18s}
    .share-item:hover{background:var(--input-bg)}
    .share-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff}
    .share-label{font-size:10px;color:var(--muted);font-family:'DM Sans',sans-serif;text-align:center}
    .share-copy-btn{width:100%;padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg);font-family:'Syne',sans-serif;font-weight:700;font-size:12.5px;cursor:pointer;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px}
    .share-copy-btn:hover{background:var(--border)}
    .share-close-btn{width:100%;padding:8px;border:none;border-radius:12px;background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);cursor:pointer;transition:background .2s}
    .share-close-btn:hover{background:var(--input-bg)}

    .post-pin-badge{display:none;position:absolute;top:12px;right:48px;background:#fef3e2;border:1px solid #fed7aa;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:#d97706;align-items:center;gap:4px}
    .post-pin-badge.visible{display:flex}
    .post-card{position:relative}

    .file-dl-link{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--input-bg);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;font-size:12px;color:var(--text);text-decoration:none;transition:background .15s;cursor:pointer}
    .file-dl-link:hover{background:var(--border)}
    .file-dl-link i:first-child{color:var(--accent);font-size:14px}
    .dl-icon{margin-left:auto;color:var(--muted);font-size:12px}
    `;
    document.head.appendChild(s);
})();

// ════════════════════════════════════════
// EDIT POST MODAL — défini plus bas via openEditModal()
// ════════════════════════════════════════
// (le système complet est injecté en bas du fichier)

// ════════════════════════════════════════
// SHARE SHEET
// ════════════════════════════════════════
const shareOverlay=document.createElement('div');
shareOverlay.className='share-overlay'; shareOverlay.id='shareOverlay';
const SHARE_PLATFORMS=[
    {label:'Facebook', color:'#1877F2', icon:'fa-brands fa-facebook-f',  url:t=>`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${encodeURIComponent(t)}`},
    {label:'WhatsApp', color:'#25D366', icon:'fa-brands fa-whatsapp',    url:t=>`https://api.whatsapp.com/send?text=${encodeURIComponent(t)}`},
    {label:'Twitter/X',color:'#000',    icon:'fa-brands fa-x-twitter',   url:t=>`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`},
    {label:'LinkedIn', color:'#0A66C2', icon:'fa-brands fa-linkedin-in', url:t=>`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(location.href)}`},
    {label:'Telegram', color:'#26A5E4', icon:'fa-brands fa-telegram',    url:t=>`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(t)}`},
    {label:'Gmail',    color:'#EA4335', icon:'fa-solid fa-envelope',     url:t=>`mailto:?subject=Post intéressant&body=${encodeURIComponent(t)}`},
    {label:'Reddit',   color:'#FF4500', icon:'fa-brands fa-reddit-alien',url:t=>`https://www.reddit.com/submit?url=${encodeURIComponent(location.href)}&title=${encodeURIComponent(t)}`},
    {label:'Snapchat', color:'#FFFC00', icon:'fa-brands fa-snapchat',    url:t=>`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(location.href)}`, textColor:'#000'},
];
shareOverlay.innerHTML=`<div class="share-sheet"><div class="share-title">Partager ce post</div><div class="share-grid" id="shareGrid"></div><button class="share-copy-btn" id="shareCopyBtn"><i class="fa-regular fa-copy"></i> Copier le lien</button><button class="share-close-btn" id="shareCloseBtn">Fermer</button></div>`;
document.body.appendChild(shareOverlay);
let shareText='';
SHARE_PLATFORMS.forEach(p=>{
    const div=document.createElement('div'); div.className='share-item';
    div.innerHTML=`<div class="share-icon" style="background:${p.color};color:${p.textColor||'#fff'}"><i class="${p.icon}"></i></div><span class="share-label">${p.label}</span>`;
    div.addEventListener('click',()=>{window.open(p.url(shareText),'_blank');shareOverlay.classList.remove('active');});
    document.getElementById('shareGrid').appendChild(div);
});
document.getElementById('shareCopyBtn').addEventListener('click',()=>{
    navigator.clipboard.writeText(location.href).catch(()=>{});
    showNotification('✓ Lien copié dans le presse-papiers !');
    shareOverlay.classList.remove('active');
});
document.getElementById('shareCloseBtn').addEventListener('click',()=>{shareOverlay.classList.remove('active');});
shareOverlay.addEventListener('click',e=>{if(e.target===shareOverlay)shareOverlay.classList.remove('active');});

// ════════════════════════════════════════
// BIND POST INTERACTIONS
// ════════════════════════════════════════
function enrichCard(card) {
    // Pin badge
    if (!card.querySelector('.post-pin-badge')) {
        const badge=document.createElement('div'); badge.className='post-pin-badge';
        badge.innerHTML='<i class="fa-solid fa-thumbtack"></i> Épinglé';
        card.insertBefore(badge,card.firstChild);
    }

    // Dynamic avatar in post-top
    const oldAv=card.querySelector('.post-top .post-avatar-placeholder:not(.post-avatar-dyn)');
    if(oldAv){
        const dyn=buildDynAvatar(currentProfileSrc,36);
        oldAv.replaceWith(dyn);
    }

    // Classify footer buttons
    const footer=card.querySelector('.post-footer');
    if(footer){
        footer.querySelectorAll('.post-action').forEach(btn=>{
            if(btn.querySelector('.fa-comment')||btn.querySelector('[class*="fa-comment"]')) btn.classList.add('comment-btn');
            if(btn.querySelector('.fa-arrow-up-from-bracket')) btn.classList.add('share-btn');
            if(btn.querySelector('.fa-heart')) btn.classList.add('like-btn');
        });
    }

    // 3-dot menu
    const menuBtn=card.querySelector('.post-menu-btn');
    if(menuBtn&&!menuBtn.querySelector('.post-ctx-menu')){
        const ctx=document.createElement('div'); ctx.className='post-ctx-menu';
        ctx.innerHTML=`
          <div class="ctx-item" data-action="pin"><i class="fa-solid fa-thumbtack"></i> Épingler</div>
          <div class="ctx-item" data-action="edit"><i class="fa-solid fa-pen"></i> Modifier</div>
          <div class="ctx-item danger" data-action="delete"><i class="fa-solid fa-trash"></i> Supprimer</div>`;
        menuBtn.appendChild(ctx);
        menuBtn.addEventListener('click',e=>{
            e.stopPropagation();
            document.querySelectorAll('.post-ctx-menu.open').forEach(m=>{if(m!==ctx)m.classList.remove('open');});
            ctx.classList.toggle('open');
        });
        ctx.querySelectorAll('.ctx-item').forEach(item=>{
            item.addEventListener('click',e=>{
                e.stopPropagation(); ctx.classList.remove('open');
                const action=item.dataset.action;
                if(action==='delete'){
                    // Modal de confirmation sans alert()
                    const confirmOverlay=document.createElement('div');
                    confirmOverlay.style.cssText='position:fixed;inset:0;background:rgba(26,23,20,.6);backdrop-filter:blur(6px);z-index:2000;display:flex;justify-content:center;align-items:center;';
                    confirmOverlay.innerHTML=`
                      <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;
                          padding:28px 24px;width:100%;max-width:320px;
                          box-shadow:0 24px 64px rgba(0,0,0,.22);text-align:center;
                          animation:postModalIn .22s cubic-bezier(.34,1.3,.64,1) both;">
                        <div style="width:48px;height:48px;background:#fee2e2;border-radius:14px;
                            display:flex;align-items:center;justify-content:center;
                            margin:0 auto 14px;font-size:22px;">🗑️</div>
                        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;
                            color:var(--text);margin-bottom:8px;">Supprimer ce post ?</div>
                        <div style="font-size:12px;color:var(--muted);margin-bottom:22px;line-height:1.55;">
                            Cette action est irréversible.<br>Le post sera définitivement supprimé.</div>
                        <div style="display:flex;gap:10px;">
                          <button id="delCancelBtn" style="flex:1;padding:10px;border:1px solid var(--border);
                              border-radius:12px;background:transparent;font-family:'Syne',sans-serif;
                              font-weight:700;font-size:13px;cursor:pointer;transition:background .2s;">Annuler</button>
                          <button id="delConfirmBtn" style="flex:1;padding:10px;border:none;
                              border-radius:12px;background:#dc2626;color:#fff;
                              font-family:'Syne',sans-serif;font-weight:700;font-size:13px;
                              cursor:pointer;transition:background .2s;">Supprimer</button>
                        </div>
                      </div>`;
                    document.body.appendChild(confirmOverlay);
                    document.getElementById('delCancelBtn').addEventListener('click',()=>confirmOverlay.remove());
                    confirmOverlay.addEventListener('click',e=>{if(e.target===confirmOverlay)confirmOverlay.remove();});
                    document.getElementById('delConfirmBtn').addEventListener('click',()=>{
                        confirmOverlay.remove();
                        card.style.animation='postCardOut .3s ease forwards';
                        setTimeout(()=>card.remove(),280);
                        showNotification('🗑️ Post supprimé');
                    });
                } else if(action==='edit'){
                    openEditModal(card);
                } else if(action==='pin'){
                    const pinBadge=card.querySelector('.post-pin-badge');
                    if(pinBadge){
                        pinBadge.classList.toggle('visible');
                        const isPinned=pinBadge.classList.contains('visible');
                        item.innerHTML=`<i class="fa-solid fa-thumbtack"></i> ${isPinned?'Désépingler':'Épingler'}`;
                        showNotification(isPinned?'📌 Post épinglé':'📌 Post désépinglé');
                        if(isPinned){
                            const newPostBox=document.querySelector('.new-post-box');
                            newPostBox.insertAdjacentElement('afterend',card);
                        }
                    }
                }
            });
        });
    }

    // Like
    const likeBtn=card.querySelector('.like-btn');
    if(likeBtn&&!likeBtn._bound){
        likeBtn._bound=true;
        likeBtn.addEventListener('click',function(){
            this.classList.toggle('liked');
            const icon=this.querySelector('i');
            const n=parseInt(this.textContent.match(/\d+/)?.[0]||'0');
            if(this.classList.contains('liked')){icon.className='fa-solid fa-heart';this.innerHTML=`<i class="fa-solid fa-heart"></i> ${n+1}`;}
            else{icon.className='fa-regular fa-heart';this.innerHTML=`<i class="fa-regular fa-heart"></i> ${Math.max(0,n-1)}`;}
        });
    }

    // Comment
    const commentBtn=card.querySelector('.comment-btn');
    if(commentBtn&&!commentBtn._bound){
        commentBtn._bound=true;
        commentBtn.addEventListener('click',()=>{
            let sec=card.querySelector('.comments-section');
            if(!sec){sec=buildCommentSection(card);}
            sec.classList.toggle('open');
            if(sec.classList.contains('open'))sec.querySelector('.comment-input').focus();
        });
    }

    // Share
    const shareBtn=card.querySelector('.share-btn');
    if(shareBtn&&!shareBtn._bound){
        shareBtn._bound=true;
        shareBtn.addEventListener('click',()=>{
            const title=card.querySelector('.post-title')?.textContent||'';
            const body=card.querySelector('.post-body')?.innerText||'';
            shareText=[title,body].filter(Boolean).join('\n\n')||location.href;
            shareOverlay.classList.add('active');
        });
    }
}

function buildDynAvatar(src,size){
    if(src){
        const img=document.createElement('img');
        img.src=src; img.className='post-avatar post-avatar-dyn';
        img.style.cssText=`width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0;`;
        return img;
    }
    const div=document.createElement('div');
    div.className='post-avatar-placeholder post-avatar-dyn';
    div.style.cssText=`width:${size}px;height:${size}px;font-size:${Math.round(size*.36)}px;`;
    div.textContent='M'; return div;
}

function buildCommentSection(card){
    const uid=Date.now();
    const sec=document.createElement('div'); sec.className='comments-section';
    const cmtAvStyle=currentProfileSrc?`background-image:url(${currentProfileSrc});background-size:cover;background-position:center`:'';
    sec.innerHTML=`
      <div class="comment-list"></div>
      <div class="comment-input-row">
        <div class="comment-input-avatar" style="${cmtAvStyle}">${currentProfileSrc?'':'M'}</div>
        <input class="comment-input" placeholder="Écrire un commentaire…">
        <button class="comment-send"><i class="fa-solid fa-paper-plane"></i></button>
      </div>`;
    card.appendChild(sec);
    const cmtInput=sec.querySelector('.comment-input'), cmtSend=sec.querySelector('.comment-send'), cmtList=sec.querySelector('.comment-list');
    function addComment(){
        const txt=cmtInput.value.trim(); if(!txt) return;
        const now=new Date(), time=now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
        const item=document.createElement('div'); item.className='comment-item';
        const avHTML=currentProfileSrc
            ?`<div class="comment-avatar" style="background-image:url(${currentProfileSrc});background-size:cover;background-position:center;background-color:transparent"></div>`
            :`<div class="comment-avatar">M</div>`;
        item.innerHTML=`${avHTML}<div class="comment-bubble"><div class="comment-author">Mehdi cherif</div><div class="comment-text">${txt.replace(/</g,'&lt;')}</div><div class="comment-time">${time}</div></div>`;
        cmtList.appendChild(item); cmtInput.value='';
        const cBtn=card.querySelector('.comment-btn');
        if(cBtn){const n=parseInt(cBtn.textContent.match(/\d+/)?.[0]||'0');cBtn.innerHTML=`<i class="fa-regular fa-comment"></i> ${n+1}`;}
        showNotification('💬 Commentaire ajouté avec succès !');
    }
    cmtSend.addEventListener('click',addComment);
    cmtInput.addEventListener('keydown',e=>{if(e.key==='Enter')addComment();});
    return sec;
}

/* Close ctx menus on outside click */
document.addEventListener('click',()=>document.querySelectorAll('.post-ctx-menu.open').forEach(m=>m.classList.remove('open')));

/* Enrich all existing cards */
document.querySelectorAll('.post-card').forEach(enrichCard);


// ════════════════════════════════════════
// MAKE A POST MODAL
// ════════════════════════════════════════
(function(){
    const CATEGORIES=[
        {id:'freelance',label:'Freelance',    color:'#7c3aed',bg:'#f5f3ff'},
        {id:'html',     label:'HTML/CSS',     color:'#d97706',bg:'#fef3e2'},
        {id:'react',    label:'React.js',     color:'#059669',bg:'#ecfdf5'},
        {id:'js',       label:'JavaScript',   color:'#ca8a04',bg:'#fefce8'},
        {id:'python',   label:'Python',       color:'#16a34a',bg:'#f0fdf4'},
        {id:'design',   label:'UI/UX',        color:'#9d174d',bg:'#fdf2f8'},
        {id:'mobile',   label:'Mobile',       color:'#0891b2',bg:'#ecfeff'},
        {id:'data',     label:'Data Science', color:'#2563eb',bg:'#eff6ff'},
        {id:'emploi',   label:'Emploi',       color:'#c2410c',bg:'#fff7ed'},
        {id:'article',  label:'Article',      color:'#6d28d9',bg:'#f5f3ff'},
    ];
    let attachedFiles=[],selectedCats=new Set(),scheduledAt=null,locationValue='';
    const overlay=document.getElementById('postModalOverlay'),closeBtn2=document.getElementById('postModalClose'),textarea=document.getElementById('postTextarea'),preview=document.getElementById('postPreview'),publishBtn=document.getElementById('postPublishBtn'),newPostInput=document.querySelector('.new-post-input');
    const pmFileBtn=document.getElementById('pmFileBtn'),pmFileInput=document.getElementById('pmFileInput'),pmPhotoBtn=document.getElementById('pmPhotoBtn'),pmPhotoInput=document.getElementById('pmPhotoInput');
    const pmLocBtn=document.getElementById('pmLocBtn'),locModal=document.getElementById('locModal'),locInput=document.getElementById('locInput'),locConfirm=document.getElementById('locConfirm');
    const locationChip=document.getElementById('locationChip'),locationText=document.getElementById('locationText'),locationRemove=document.getElementById('locationRemove');
    const pmCatBtn=document.getElementById('pmCatBtn'),catDropdown=document.getElementById('catDropdown'),catChipsBox=document.getElementById('categoryChips');
    const pmTimerBtn=document.getElementById('pmTimerBtn'),timerModal=document.getElementById('timerModal'),timerDate=document.getElementById('timerDate'),timerTime=document.getElementById('timerTime'),timerConfirm=document.getElementById('timerConfirm'),timerClose=document.getElementById('timerModalClose');
    const scheduledChip=document.getElementById('scheduledChip'),scheduledText=document.getElementById('scheduledText'),scheduledRemove=document.getElementById('scheduledRemove');

    /* Build cat dropdown */
    catDropdown.innerHTML='<div class="cat-dropdown-title">Catégorie</div>';
    CATEGORIES.forEach(cat=>{
        const opt=document.createElement('div'); opt.className='cat-option'; opt.dataset.id=cat.id;
        opt.innerHTML=`<span class="cat-dot" style="background:${cat.color}"></span><span>${cat.label}</span><i class="fa-solid fa-check cat-check"></i>`;
        opt.addEventListener('click',e=>{e.stopPropagation();opt.classList.toggle('selected');if(selectedCats.has(cat.id))selectedCats.delete(cat.id);else selectedCats.add(cat.id);renderCatChips();});
        catDropdown.appendChild(opt);
    });

    function renderCatChips(){catChipsBox.innerHTML='';selectedCats.forEach(id=>{const cat=CATEGORIES.find(c=>c.id===id);if(!cat)return;const chip=document.createElement('span');chip.className='cat-chip';chip.style.cssText=`color:${cat.color};background:${cat.bg};border-color:${cat.color}`;chip.textContent=cat.label;catChipsBox.appendChild(chip);});catChipsBox.classList.toggle('visible',selectedCats.size>0);}

    function openPostModal(){
        syncPmAvatar();
        const tmr=new Date(Date.now()+86400000);
        timerDate.value=tmr.toISOString().split('T')[0]; timerTime.value='10:00';
        overlay.classList.add('active'); document.body.classList.add('modal-open');
        setTimeout(()=>textarea.focus(),80);
    }
    function closePostModal(){overlay.classList.remove('active');document.body.classList.remove('modal-open');}
    function resetModal(){
        textarea.value=''; attachedFiles=[]; selectedCats.clear(); scheduledAt=null; locationValue='';
        renderPreview(); renderCatChips();
        [scheduledChip,locationChip].forEach(c=>c.classList.remove('visible'));
        [pmTimerBtn,pmCatBtn,pmLocBtn].forEach(b=>b.classList.remove('active'));
        [timerModal,catDropdown,locModal].forEach(m=>m.classList.remove('open'));
        publishBtn.classList.remove('scheduled'); publishBtn.innerHTML='publier';
        catDropdown.querySelectorAll('.cat-option').forEach(o=>o.classList.remove('selected'));
        locInput.value='';
    }
    function syncPmAvatar(){
        const el=document.getElementById('pmAvatar'); if(!el||!currentProfileSrc)return;
        const img=document.createElement('img'); img.src=currentProfileSrc; img.className='post-modal-avatar'; img.id='pmAvatar';
        el.replaceWith(img);
    }

    if(newPostInput)newPostInput.addEventListener('click',openPostModal);
    closeBtn2.addEventListener('click',()=>{closePostModal();resetModal();});
    overlay.addEventListener('click',e=>{if(e.target===overlay){closePostModal();resetModal();}});

    /* File */
    pmFileBtn.addEventListener('click',()=>pmFileInput.click());
    pmFileInput.addEventListener('change',function(){
        Array.from(this.files).forEach(file=>{
            const ext=file.name.split('.').pop().toLowerCase();
            const iconMap={pdf:'fa-file-pdf',doc:'fa-file-word',docx:'fa-file-word',xls:'fa-file-excel',xlsx:'fa-file-excel',ppt:'fa-file-powerpoint',pptx:'fa-file-powerpoint',txt:'fa-file-lines',csv:'fa-file-csv'};
            const blobURL=URL.createObjectURL(file);
            attachedFiles.push({type:'file',name:file.name,icon:iconMap[ext]||'fa-file',blobURL});
        });
        this.value=''; renderPreview();
    });

    /* Photo */
    pmPhotoBtn.addEventListener('click',()=>pmPhotoInput.click());
    pmPhotoInput.addEventListener('change',function(){
        Array.from(this.files).forEach(file=>{
            if(file.type==='image/gif'){showNotification('⚠️ Les GIFs animés ne sont pas acceptés');return;}
            const reader=new FileReader();
            reader.onload=e=>{attachedFiles.push({type:'photo',url:e.target.result,name:file.name});renderPreview();};
            reader.readAsDataURL(file);
        });
        this.value='';
    });

    function renderPreview(){
        preview.innerHTML='';
        attachedFiles.forEach((item,idx)=>{
            const div=document.createElement('div'); div.className='preview-item'+(item.type==='file'?' file-preview':'');
            if(item.type==='photo'){div.innerHTML=`<img src="${item.url}" alt="">`;}
            else{div.innerHTML=`<i class="fa-solid ${item.icon} file-icon"></i><span class="file-name">${item.name}</span>`;}
            const rm=document.createElement('button'); rm.className='preview-remove'; rm.innerHTML='×';
            rm.addEventListener('click',()=>{attachedFiles.splice(idx,1);renderPreview();});
            div.appendChild(rm); preview.appendChild(div);
        });
        preview.classList.toggle('has-items',attachedFiles.length>0);
    }

    /* Location */
    pmLocBtn.addEventListener('click',e=>{e.stopPropagation();locModal.classList.toggle('open');timerModal.classList.remove('open');catDropdown.classList.remove('open');if(locModal.classList.contains('open'))setTimeout(()=>locInput.focus(),50);});
    locConfirm.addEventListener('click',()=>{const val=locInput.value.trim();if(!val)return;locationValue=val;locationText.textContent=val;locationChip.classList.add('visible');pmLocBtn.classList.add('active');locModal.classList.remove('open');});
    locInput.addEventListener('keydown',e=>{if(e.key==='Enter')locConfirm.click();});
    locationRemove.addEventListener('click',()=>{locationValue='';locationChip.classList.remove('visible');pmLocBtn.classList.remove('active');locInput.value='';});

    /* Category */
    pmCatBtn.addEventListener('click',e=>{e.stopPropagation();catDropdown.classList.toggle('open');timerModal.classList.remove('open');locModal.classList.remove('open');pmCatBtn.classList.toggle('active',catDropdown.classList.contains('open'));});

    /* Timer */
    pmTimerBtn.addEventListener('click',e=>{e.stopPropagation();timerModal.classList.toggle('open');catDropdown.classList.remove('open');locModal.classList.remove('open');pmTimerBtn.classList.toggle('active',timerModal.classList.contains('open'));});
    timerClose.addEventListener('click',()=>{timerModal.classList.remove('open');pmTimerBtn.classList.remove('active');});
    timerConfirm.addEventListener('click',()=>{
        const d=timerDate.value,t=timerTime.value;
        if(!d||!t){showNotification('⚠️ Choisissez une date et une heure');return;}
        scheduledAt=new Date(`${d}T${t}`);
        if(scheduledAt<=new Date()){showNotification('⚠️ La date doit être dans le futur');scheduledAt=null;return;}
        const fmt=scheduledAt.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})+' à '+t;
        scheduledText.textContent=`Programmé · ${fmt}`;
        scheduledChip.classList.add('visible'); pmTimerBtn.classList.add('active');
        publishBtn.classList.add('scheduled'); publishBtn.innerHTML=`<i class="fa-regular fa-clock"></i> Programmer`;
        timerModal.classList.remove('open');
    });
    scheduledRemove.addEventListener('click',()=>{scheduledAt=null;scheduledChip.classList.remove('visible');pmTimerBtn.classList.remove('active');publishBtn.classList.remove('scheduled');publishBtn.innerHTML='publier';});

    /* Close sub-popups outside */
    document.addEventListener('click',e=>{
        if(!catDropdown.contains(e.target)&&e.target!==pmCatBtn)catDropdown.classList.remove('open');
        if(!timerModal.contains(e.target)&&e.target!==pmTimerBtn)timerModal.classList.remove('open');
        if(!locModal.contains(e.target)&&e.target!==pmLocBtn)locModal.classList.remove('open');
    });

    /* Publish */
    publishBtn.addEventListener('click',()=>{
        const text=textarea.value.trim();
        if(!text&&attachedFiles.length===0){showNotification('⚠️ Écrivez quelque chose avant de publier');return;}
        const snapFiles=[...attachedFiles],snapCats=new Set(selectedCats),snapLoc=locationValue,snapSrc=currentProfileSrc;
        if(scheduledAt){
            const delay=scheduledAt-Date.now();
            const fmt=scheduledAt.toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
            showNotification(`🕐 Post programmé · ${fmt}`);
            setTimeout(()=>{createPost(text,snapFiles,snapCats,snapLoc,snapSrc);showNotification('✓ Post publié automatiquement !');},delay);
        } else {
            createPost(text,snapFiles,snapCats,snapLoc,snapSrc);
            showNotification('✓ Post publié avec succès !');
        }
        closePostModal(); resetModal();
    });

    function createPost(text,files,cats,loc,avatarSrc){
        const tagHtml=Array.from(cats).map(id=>{const cat=CATEGORIES.find(c=>c.id===id);return cat?`<span class="post-tag" style="background:${cat.bg};color:${cat.color}">${cat.label}</span>`:''}).join('');
        const photosHtml=files.filter(f=>f.type==='photo').map(f=>`<div style="margin-bottom:10px;"><img src="${f.url}" style="width:100%;border-radius:10px;display:block;max-height:320px;object-fit:cover;border:1px solid var(--border);"></div>`).join('');
        const filesHtml=files.filter(f=>f.type==='file').map(f=>`<a href="${f.blobURL}" download="${f.name}" class="file-dl-link"><i class="fa-solid ${f.icon}"></i><span>${f.name}</span><i class="fa-solid fa-download dl-icon"></i></a>`).join('');
        const locHtml=loc?`<div style="font-size:11px;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-location-dot" style="color:#e8734a;font-size:10px;"></i>${loc}</div>`:'';

        const card=document.createElement('div'); card.className='post-card'; card.style.animation='postCardIn .35s cubic-bezier(.34,1.2,.64,1) both';
        card.innerHTML=`
          <div class="post-pin-badge"><i class="fa-solid fa-thumbtack"></i> Épinglé</div>
          <div class="post-top">
            <div class="post-avatar-placeholder post-avatar-dyn" style="width:36px;height:36px;font-size:13px;">M</div>
            <div class="post-meta"><div class="post-author">mehdi cherif</div><div class="post-time">À l'instant · <i class="fa-solid fa-earth-africa" style="font-size:9px;color:var(--muted)"></i></div></div>
            <button class="post-menu-btn"><i class="fa-solid fa-ellipsis"></i></button>
          </div>
          ${tagHtml?`<div class="post-tags">${tagHtml}</div>`:''}
          ${locHtml}
          ${text?`<div class="post-body" style="color:var(--text);font-size:13px;margin-bottom:10px;">${text.replace(/\n/g,'<br>')}</div>`:''}
          ${photosHtml}${filesHtml}
          <div class="post-footer">
            <button class="post-action like-btn"><i class="fa-regular fa-heart"></i> 0</button>
            <button class="post-action comment-btn"><i class="fa-regular fa-comment"></i> 0</button>
            <button class="post-action share-btn"><i class="fa-solid fa-arrow-up-from-bracket"></i> Partager</button>
            <span class="post-action-sep"></span>
            <span style="font-size:10px;color:var(--muted);">0 vues</span>
          </div>`;

        // Snapshot avatar
        if(avatarSrc){
            const avEl=card.querySelector('.post-avatar-dyn');
            const img=document.createElement('img'); img.src=avatarSrc; img.className='post-avatar post-avatar-dyn';
            img.style.cssText='width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--border);flex-shrink:0;';
            avEl.replaceWith(img);
        }

        const newPostBox=document.querySelector('.new-post-box');
        newPostBox.insertAdjacentElement('afterend',card);
        enrichCard(card);
    }
})();
// ════════════════════════════════════════
// EDIT POST — système complet
// Remplace l'ancien editOverlay + le bloc else if(action==='edit')
// À ajouter dans mon-profile.js, après la déclaration de editOverlay
// ════════════════════════════════════════

/* ── Supprimer l'ancien editOverlay s'il existe ── */
const oldEditOverlay = document.getElementById('editPostOverlay');
if (oldEditOverlay) oldEditOverlay.remove();

/* ══════════════════════════════════════════════
   BUILD EDIT MODAL (clone visuel de make-a-post)
   ══════════════════════════════════════════════ */
const editPostOverlay = document.createElement('div');
editPostOverlay.id = 'editPostOverlay';
editPostOverlay.style.cssText = `
    display:none;position:fixed;inset:0;
    background:rgba(26,23,20,.6);backdrop-filter:blur(7px);
    z-index:1400;justify-content:center;align-items:flex-start;padding-top:60px;`;

editPostOverlay.innerHTML = `
<div id="editPostModal" style="
    background:var(--surface);border:1px solid var(--border);
    border-radius:18px;width:100%;max-width:520px;
    box-shadow:0 24px 64px rgba(0,0,0,.22);
    overflow:visible;position:relative;
    animation:postModalIn .28s cubic-bezier(.34,1.3,.64,1) both;">

  <!-- Header -->
  <div style="display:flex;align-items:center;gap:12px;padding:16px 18px 12px;border-bottom:1px solid var(--border);">
    <div id="editPmAvatar" style="width:42px;height:42px;border-radius:50%;flex-shrink:0;
        background:linear-gradient(135deg,#e8734a,#c9543a);
        display:flex;align-items:center;justify-content:center;
        font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:#fff;
        border:2px solid var(--border);overflow:hidden;background-size:cover;background-position:center;">M</div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--text);">mehdi cherif</div>
      <div style="font-size:11px;color:var(--muted);margin-top:1px;">Modification du post</div>
    </div>
    <button id="editPostClose" style="width:30px;height:30px;border:none;background:var(--input-bg);
        border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;
        color:var(--muted);font-size:14px;transition:background .2s;">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>

  <!-- Textarea -->
  <div style="padding:14px 18px;min-height:110px;">
    <textarea id="editPostTextarea" style="width:100%;min-height:90px;border:none;outline:none;
        resize:none;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);
        background:transparent;line-height:1.6;"
        placeholder="Quoi de neuf ? Partagez quelque chose…"></textarea>
  </div>

  <!-- Location chip -->
  <div id="editLocationChip" style="display:none;align-items:center;gap:6px;
      margin:0 18px 10px;padding:6px 12px;background:var(--input-bg);
      border:1px solid var(--border);border-radius:20px;font-size:12px;color:var(--muted);
      font-family:'DM Sans',sans-serif;width:fit-content;">
    <i class="fa-solid fa-location-dot" style="color:#e8734a;font-size:11px;"></i>
    <span id="editLocationText"></span>
    <button id="editLocationRemove" style="border:none;background:transparent;cursor:pointer;
        color:var(--muted);font-size:11px;padding:0;margin-left:2px;display:flex;align-items:center;">
      <i class="fa-solid fa-xmark"></i></button>
  </div>

  <!-- Category chips -->
  <div id="editCategoryChips" style="display:none;flex-wrap:wrap;gap:6px;padding:0 18px 10px;"></div>

  <!-- Scheduled chip -->
  <div id="editScheduledChip" style="display:none;align-items:center;gap:6px;
      margin:0 18px 10px;padding:6px 12px;background:#eff6ff;border:1px solid #bfdbfe;
      border-radius:20px;font-size:12px;color:#1d4ed8;font-family:'DM Sans',sans-serif;
      font-weight:500;width:fit-content;">
    <i class="fa-regular fa-clock" style="font-size:11px;"></i>
    <span id="editScheduledText">Programmé</span>
    <button id="editScheduledRemove" style="border:none;background:transparent;cursor:pointer;
        color:#93c5fd;font-size:11px;padding:0;margin-left:2px;display:flex;align-items:center;">
      <i class="fa-solid fa-xmark"></i></button>
  </div>

  <!-- Media preview (existing + new) -->
  <div id="editPreviewArea" style="padding:0 18px 12px;display:flex;flex-wrap:wrap;gap:8px;"></div>

  <!-- Footer toolbar -->
  <div style="display:flex;align-items:center;gap:4px;padding:12px 16px;border-top:1px solid var(--border);position:relative;">

    <!-- File -->
    <input type="file" id="editFileInput" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv">
    <button class="post-tool-btn" id="editFileBtn" title="Joindre un fichier"><i class="fa-solid fa-file-arrow-up"></i></button>

    <!-- Photo -->
    <input type="file" id="editPhotoInput" hidden accept="image/jpeg,image/png,image/jpg" multiple>
    <button class="post-tool-btn" id="editPhotoBtn" title="Ajouter une photo"><i class="fa-regular fa-image"></i></button>

    <!-- Location -->
    <div style="position:relative;">
      <button class="post-tool-btn" id="editLocBtn" title="Localisation"><i class="fa-solid fa-location-dot"></i></button>
      <div id="editLocModal" style="display:none;position:absolute;bottom:calc(100% + 8px);left:50%;
          transform:translateX(-50%);width:240px;background:var(--surface);
          border:1px solid var(--border);border-radius:14px;
          box-shadow:0 12px 36px rgba(0,0,0,.18);z-index:10;padding:14px;">
        <input type="text" id="editLocInput" placeholder="Ex : Bejaia, Algeria"
            style="width:100%;padding:8px 12px;border:1.5px solid var(--border);
            border-radius:10px;background:var(--input-bg);font-family:'DM Sans',sans-serif;
            font-size:13px;color:var(--text);outline:none;margin-bottom:8px;">
        <button id="editLocConfirm" style="width:100%;padding:8px;background:var(--text);color:#fff;
            border:none;border-radius:10px;font-family:'Syne',sans-serif;
            font-weight:700;font-size:12px;cursor:pointer;">Confirmer</button>
      </div>
    </div>

    <!-- Category -->
    <div style="position:relative;">
      <button class="post-tool-btn" id="editCatBtn" title="Catégorie"><i class="fa-solid fa-plus"></i></button>
      <div id="editCatDropdown" style="display:none;position:absolute;bottom:calc(100% + 8px);
          left:50%;transform:translateX(-50%);width:220px;background:var(--surface);
          border:1px solid var(--border);border-radius:14px;
          box-shadow:0 8px 28px rgba(0,0,0,.16);z-index:10;padding:8px;"></div>
    </div>

    <div style="width:1px;height:22px;background:var(--border);margin:0 4px;"></div>
    <div style="flex:1;"></div>

    <!-- Timer -->
    <div style="position:relative;">
      <button class="post-tool-btn" id="editTimerBtn" title="Programmer"><i class="fa-regular fa-clock"></i></button>
      <div id="editTimerModal" style="display:none;position:absolute;bottom:calc(100% + 8px);right:0;
          width:300px;background:var(--surface);border:1px solid var(--border);
          border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.18);z-index:10;padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;">Programmer un timer</span>
          <button id="editTimerClose" style="width:24px;height:24px;border:none;background:var(--input-bg);
              border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;
              color:var(--muted);font-size:12px;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:11px;font-weight:500;color:var(--muted);
              letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;">Fixer la date</label>
          <input type="date" id="editTimerDate" style="width:100%;padding:9px 13px;
              border:1.5px solid var(--border);border-radius:10px;background:var(--input-bg);
              font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;">
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:11px;font-weight:500;color:var(--muted);
              letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;">Fixer l'heure</label>
          <input type="time" id="editTimerTime" style="width:100%;padding:9px 13px;
              border:1.5px solid var(--border);border-radius:10px;background:var(--input-bg);
              font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;">
        </div>
        <button id="editTimerConfirm" style="width:100%;padding:10px;background:var(--text);color:#fff;
            border:none;border-radius:10px;font-family:'Syne',sans-serif;
            font-weight:700;font-size:13px;cursor:pointer;">Confirmer</button>
      </div>
    </div>

    <!-- Save -->
    <button id="editSaveBtn" style="display:flex;align-items:center;gap:7px;padding:9px 22px;
        background:var(--text);color:#fff;border:none;border-radius:20px;
        font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;
        transition:background .2s,transform .1s,box-shadow .2s;">
      <i class="fa-solid fa-floppy-disk"></i> Enregistrer
    </button>
  </div>
</div>`;

document.body.appendChild(editPostOverlay);

/* ── State for edit modal ── */
let editTargetCard  = null;
let editNewFiles    = [];   // newly added attachments {type,name,url/blobURL,icon}
let editKeptMedia   = [];   // existing media nodes to keep (img src / file link)
let editSelectedCats= new Set();
let editLocation    = '';
let editScheduledAt = null;

const EDIT_CATEGORIES = [
    {id:'freelance',label:'Freelance',    color:'#7c3aed',bg:'#f5f3ff'},
    {id:'html',     label:'HTML/CSS',     color:'#d97706',bg:'#fef3e2'},
    {id:'react',    label:'React.js',     color:'#059669',bg:'#ecfdf5'},
    {id:'js',       label:'JavaScript',   color:'#ca8a04',bg:'#fefce8'},
    {id:'python',   label:'Python',       color:'#16a34a',bg:'#f0fdf4'},
    {id:'design',   label:'UI/UX',        color:'#9d174d',bg:'#fdf2f8'},
    {id:'mobile',   label:'Mobile',       color:'#0891b2',bg:'#ecfeff'},
    {id:'data',     label:'Data Science', color:'#2563eb',bg:'#eff6ff'},
    {id:'emploi',   label:'Emploi',       color:'#c2410c',bg:'#fff7ed'},
    {id:'article',  label:'Article',      color:'#6d28d9',bg:'#f5f3ff'},
];

/* Build edit cat dropdown */
const editCatDD = document.getElementById('editCatDropdown');
editCatDD.innerHTML = `<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;
    color:var(--muted);padding:4px 8px 8px;letter-spacing:.06em;text-transform:uppercase;">Catégorie</div>`;
EDIT_CATEGORIES.forEach(cat => {
    const opt = document.createElement('div');
    opt.className = 'cat-option'; opt.dataset.id = cat.id;
    opt.innerHTML = `<span class="cat-dot" style="background:${cat.color}"></span><span>${cat.label}</span><i class="fa-solid fa-check cat-check"></i>`;
    opt.addEventListener('click', e => {
        e.stopPropagation(); opt.classList.toggle('selected');
        if (editSelectedCats.has(cat.id)) editSelectedCats.delete(cat.id);
        else editSelectedCats.add(cat.id);
        renderEditCatChips();
    });
    editCatDD.appendChild(opt);
});

function renderEditCatChips() {
    const box = document.getElementById('editCategoryChips');
    box.innerHTML = '';
    editSelectedCats.forEach(id => {
        const cat = EDIT_CATEGORIES.find(c => c.id === id); if (!cat) return;
        const chip = document.createElement('span'); chip.className = 'cat-chip';
        chip.style.cssText = `color:${cat.color};background:${cat.bg};border-color:${cat.color}`;
        chip.textContent = cat.label; box.appendChild(chip);
    });
    box.style.display = editSelectedCats.size > 0 ? 'flex' : 'none';
}

/* ── Open edit modal ── */
function openEditModal(card) {
    editTargetCard   = card;
    editNewFiles     = [];
    editKeptMedia    = [];
    editSelectedCats = new Set();
    editLocation     = '';
    editScheduledAt  = null;

    // Sync avatar
    const avEl = document.getElementById('editPmAvatar');
    if (currentProfileSrc) {
        avEl.style.backgroundImage = `url(${currentProfileSrc})`;
        avEl.style.backgroundSize  = 'cover';
        avEl.style.backgroundPosition = 'center';
        avEl.textContent = '';
    }

    // Pre-fill text
    const bodyEl = card.querySelector('.post-body');
    document.getElementById('editPostTextarea').value = bodyEl ? bodyEl.innerText : '';

    // Pre-fill tags
    card.querySelectorAll('.post-tags .post-tag').forEach(tag => {
        const label = tag.textContent.trim();
        const cat = EDIT_CATEGORIES.find(c => c.label === label);
        if (cat) {
            editSelectedCats.add(cat.id);
            const opt = editCatDD.querySelector(`[data-id="${cat.id}"]`);
            if (opt) opt.classList.add('selected');
        }
    });
    renderEditCatChips();

    // Pre-fill location
    const locEl = card.querySelector('[data-loc]');
    if (locEl) { editLocation = locEl.dataset.loc; showEditLocationChip(editLocation); }
    else {
        // try reading from inline loc div
        const locDiv = card.querySelector('.post-loc-chip');
        if (locDiv) { editLocation = locDiv.dataset.loc || locDiv.textContent.trim(); showEditLocationChip(editLocation); }
    }

    // Pre-fill existing media (photos + files)
    renderEditPreview(card);

    // Timer defaults
    const tmr = new Date(Date.now() + 86400000);
    document.getElementById('editTimerDate').value = tmr.toISOString().split('T')[0];
    document.getElementById('editTimerTime').value = '10:00';

    // Reset toolbar states
    document.getElementById('editTimerBtn').classList.remove('active');
    document.getElementById('editCatBtn').classList.remove('active');
    document.getElementById('editLocBtn').classList.remove('active');
    [document.getElementById('editTimerModal'),
     document.getElementById('editCatDropdown'),
     document.getElementById('editLocModal')].forEach(m => { if(m) m.style.display='none'; });

    // Show
    editPostOverlay.style.display = 'flex';
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('editPostTextarea').focus(), 80);
}

function closeEditModal() {
    editPostOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
    editCatDD.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('editCategoryChips').style.display = 'none';
    document.getElementById('editLocationChip').style.display = 'none';
    document.getElementById('editScheduledChip').style.display = 'none';
    editTargetCard = null;
}

/* ── Render existing media from card ── */
function renderEditPreview(card) {
    const area = document.getElementById('editPreviewArea');
    area.innerHTML = '';
    editKeptMedia = [];

    // Existing photos
    card.querySelectorAll('.post-body ~ div img, .post-tags ~ div img').forEach(img => {
        addPreviewItem(area, 'photo-existing', null, img.src, null, img);
    });
    // All images inside the card that are post content (not avatar)
    card.querySelectorAll('img:not(.post-avatar):not(.post-avatar-dyn)').forEach(img => {
        if (!editKeptMedia.includes(img.src)) addPreviewItem(area, 'photo-existing', null, img.src, null, img);
    });
    // Existing file links
    card.querySelectorAll('.file-dl-link').forEach(link => {
        addPreviewItem(area, 'file-existing', link.querySelector('span')?.textContent, null, link, null);
    });
}

function addPreviewItem(area, type, name, src, originalEl, originalImg) {
    const div = document.createElement('div');
    div.className = 'preview-item' + (type.includes('file') ? ' file-preview' : '');
    div.style.position = 'relative';

    if (type === 'photo-existing' || type === 'photo-new') {
        div.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
        editKeptMedia.push({ type: 'photo', src, originalEl: originalImg });
    } else if (type === 'file-existing') {
        const icon = originalEl?.querySelector('i')?.className?.match(/fa-file-\w+/)?.[0] || 'fa-file';
        div.innerHTML = `<i class="fa-solid ${icon} file-icon"></i><span class="file-name">${name}</span>`;
        editKeptMedia.push({ type: 'file', name, originalEl });
    } else if (type === 'file-new') {
        div.innerHTML = `<i class="fa-solid fa-file file-icon"></i><span class="file-name">${name}</span>`;
    }

    const rm = document.createElement('button');
    rm.className = 'preview-remove'; rm.innerHTML = '×';
    rm.addEventListener('click', () => {
        // Remove from kept or new
        editKeptMedia = editKeptMedia.filter(m => !(m.src === src || m.name === name));
        editNewFiles  = editNewFiles.filter(f => f.name !== name);
        div.remove();
    });
    div.appendChild(rm);
    area.appendChild(div);
}

/* ── File / Photo inputs ── */
document.getElementById('editFileBtn').addEventListener('click', () => document.getElementById('editFileInput').click());
document.getElementById('editFileInput').addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        const iconMap = {pdf:'fa-file-pdf',doc:'fa-file-word',docx:'fa-file-word',xls:'fa-file-excel',xlsx:'fa-file-excel',ppt:'fa-file-powerpoint',pptx:'fa-file-powerpoint',txt:'fa-file-lines',csv:'fa-file-csv'};
        const blobURL = URL.createObjectURL(file);
        const item = {type:'file',name:file.name,icon:iconMap[ext]||'fa-file',blobURL};
        editNewFiles.push(item);
        addPreviewItem(document.getElementById('editPreviewArea'), 'file-new', file.name, null, null, null);
        // patch: store blobURL on last added item
        editKeptMedia[editKeptMedia.length - 1] && (editKeptMedia[editKeptMedia.length - 1].blobURL = blobURL);
        editNewFiles[editNewFiles.length - 1].blobURL = blobURL;
    });
    this.value = '';
});

document.getElementById('editPhotoBtn').addEventListener('click', () => document.getElementById('editPhotoInput').click());
document.getElementById('editPhotoInput').addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const item = {type:'photo',src:e.target.result,name:file.name};
            editNewFiles.push(item);
            addPreviewItem(document.getElementById('editPreviewArea'), 'photo-new', null, e.target.result, null, null);
        };
        reader.readAsDataURL(file);
    });
    this.value = '';
});

/* ── Location ── */
const editLocBtn   = document.getElementById('editLocBtn');
const editLocModal = document.getElementById('editLocModal');
const editLocInput = document.getElementById('editLocInput');
editLocBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = editLocModal.style.display === 'block';
    [document.getElementById('editTimerModal'), editCatDD, editLocModal].forEach(m => m.style.display='none');
    if (!open) { editLocModal.style.display = 'block'; setTimeout(() => editLocInput.focus(), 40); }
});
document.getElementById('editLocConfirm').addEventListener('click', () => {
    const val = editLocInput.value.trim(); if (!val) return;
    editLocation = val; showEditLocationChip(val);
    editLocModal.style.display = 'none'; editLocBtn.classList.add('active');
});
editLocInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('editLocConfirm').click(); });

function showEditLocationChip(val) {
    const chip = document.getElementById('editLocationChip');
    document.getElementById('editLocationText').textContent = val;
    chip.style.display = 'flex';
}
document.getElementById('editLocationRemove').addEventListener('click', () => {
    editLocation = ''; document.getElementById('editLocationChip').style.display = 'none';
    editLocBtn.classList.remove('active'); editLocInput.value = '';
});

/* ── Category ── */
const editCatBtn = document.getElementById('editCatBtn');
editCatBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = editCatDD.style.display === 'block';
    [document.getElementById('editTimerModal'), editLocModal, editCatDD].forEach(m => m.style.display='none');
    editCatDD.style.display = open ? 'none' : 'block';
    editCatBtn.classList.toggle('active', editCatDD.style.display === 'block');
});

/* ── Timer ── */
const editTimerBtn   = document.getElementById('editTimerBtn');
const editTimerModal = document.getElementById('editTimerModal');
editTimerBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = editTimerModal.style.display === 'block';
    [editLocModal, editCatDD, editTimerModal].forEach(m => m.style.display='none');
    editTimerModal.style.display = open ? 'none' : 'block';
    editTimerBtn.classList.toggle('active', editTimerModal.style.display === 'block');
});
document.getElementById('editTimerClose').addEventListener('click', () => { editTimerModal.style.display='none'; editTimerBtn.classList.remove('active'); });
document.getElementById('editTimerConfirm').addEventListener('click', () => {
    const d = document.getElementById('editTimerDate').value, t = document.getElementById('editTimerTime').value;
    if (!d || !t) { showNotification('⚠️ Choisissez une date et une heure'); return; }
    editScheduledAt = new Date(`${d}T${t}`);
    if (editScheduledAt <= new Date()) { showNotification('⚠️ La date doit être dans le futur'); editScheduledAt = null; return; }
    const fmt = editScheduledAt.toLocaleDateString('fr-FR', {day:'2-digit',month:'short'}) + ' à ' + t;
    document.getElementById('editScheduledText').textContent = `Programmé · ${fmt}`;
    document.getElementById('editScheduledChip').style.display = 'flex';
    editTimerBtn.classList.add('active'); editTimerModal.style.display = 'none';
});
document.getElementById('editScheduledRemove').addEventListener('click', () => {
    editScheduledAt = null;
    document.getElementById('editScheduledChip').style.display = 'none';
    editTimerBtn.classList.remove('active');
});

/* ── Close sub-popups on outside click ── */
document.addEventListener('click', e => {
    if (!editCatDD.contains(e.target) && e.target !== editCatBtn) editCatDD.style.display = 'none';
    if (!editTimerModal.contains(e.target) && e.target !== editTimerBtn) editTimerModal.style.display = 'none';
    if (!editLocModal.contains(e.target) && e.target !== editLocBtn) editLocModal.style.display = 'none';
});

/* ── Close modal ── */
document.getElementById('editPostClose').addEventListener('click', closeEditModal);
editPostOverlay.addEventListener('click', e => { if (e.target === editPostOverlay) closeEditModal(); });

/* ── SAVE ── */
document.getElementById('editSaveBtn').addEventListener('click', () => {
    if (!editTargetCard) return;
    const card = editTargetCard;
    const newText = document.getElementById('editPostTextarea').value.trim();

    // 1. Update text
    let bodyEl = card.querySelector('.post-body');
    if (newText) {
        if (!bodyEl) { bodyEl = document.createElement('div'); bodyEl.className = 'post-body'; card.querySelector('.post-footer').before(bodyEl); }
        bodyEl.innerHTML = newText.replace(/\n/g, '<br>'); bodyEl.style.color = 'var(--text)'; bodyEl.style.fontSize = '13px';
    } else if (bodyEl) { bodyEl.remove(); }

    // 2. Update tags
    let tagsEl = card.querySelector('.post-tags');
    if (editSelectedCats.size > 0) {
        if (!tagsEl) { tagsEl = document.createElement('div'); tagsEl.className = 'post-tags'; card.querySelector('.post-top').after(tagsEl); }
        tagsEl.innerHTML = Array.from(editSelectedCats).map(id => {
            const cat = EDIT_CATEGORIES.find(c => c.id === id);
            return cat ? `<span class="post-tag" style="background:${cat.bg};color:${cat.color}">${cat.label}</span>` : '';
        }).join('');
    } else if (tagsEl) { tagsEl.remove(); }

    // 3. Update location
    let locDiv = card.querySelector('.post-loc-chip');
    if (editLocation) {
        if (!locDiv) { locDiv = document.createElement('div'); locDiv.className = 'post-loc-chip'; locDiv.style.cssText = 'font-size:11px;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:5px;'; const footer = card.querySelector('.post-footer'); footer.before(locDiv); }
        locDiv.dataset.loc = editLocation;
        locDiv.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#e8734a;font-size:10px;"></i>${editLocation}`;
    } else if (locDiv) { locDiv.remove(); }

    // 4. Remove all existing media from card (photos + files)
    card.querySelectorAll('img:not(.post-avatar):not(.post-avatar-dyn)').forEach(img => img.closest('div[style*="margin-bottom"]')?.remove() || img.remove());
    card.querySelectorAll('.file-dl-link').forEach(el => el.remove());

    // 5. Re-inject kept media
    const footer = card.querySelector('.post-footer');
    editKeptMedia.forEach(m => {
        if (m.type === 'photo' && m.src) {
            const wrap = document.createElement('div'); wrap.style.marginBottom = '10px';
            wrap.innerHTML = `<img src="${m.src}" style="width:100%;border-radius:10px;display:block;max-height:320px;object-fit:cover;border:1px solid var(--border);">`;
            footer.before(wrap);
        } else if (m.type === 'file' && m.originalEl) {
            footer.before(m.originalEl.cloneNode(true));
        }
    });

    // 6. Inject new files/photos
    editNewFiles.forEach(f => {
        if (f.type === 'photo') {
            const wrap = document.createElement('div'); wrap.style.marginBottom = '10px';
            wrap.innerHTML = `<img src="${f.src}" style="width:100%;border-radius:10px;display:block;max-height:320px;object-fit:cover;border:1px solid var(--border);">`;
            footer.before(wrap);
        } else if (f.type === 'file') {
            const iconMap = {pdf:'fa-file-pdf',doc:'fa-file-word',docx:'fa-file-word',xls:'fa-file-excel',xlsx:'fa-file-excel',ppt:'fa-file-powerpoint',pptx:'fa-file-powerpoint',txt:'fa-file-lines',csv:'fa-file-csv'};
            const ext = f.name.split('.').pop().toLowerCase();
            const a = document.createElement('a'); a.href = f.blobURL; a.download = f.name; a.className = 'file-dl-link';
            a.innerHTML = `<i class="fa-solid ${iconMap[ext]||'fa-file'}"></i><span>${f.name}</span><i class="fa-solid fa-download dl-icon"></i>`;
            footer.before(a);
        }
    });

    // 7. Add "modifié" timestamp
    const timeEl = card.querySelector('.post-time');
    if (timeEl) {
        const now = new Date();
        const fmt = now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
        if (!timeEl.querySelector('.edit-mark')) {
            const mark = document.createElement('span'); mark.className = 'edit-mark';
            mark.style.cssText = 'margin-left:6px;font-size:10px;color:var(--muted);font-style:italic;';
            mark.textContent = `· modifié à ${fmt}`; timeEl.appendChild(mark);
        } else { timeEl.querySelector('.edit-mark').textContent = `· modifié à ${fmt}`; }
    }

    closeEditModal();
    showNotification('✏️ Post modifié avec succès !');
});