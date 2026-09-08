/* =========================================================
   FMS CENTRAL WHATSAPP SERVICE
   Version 3.0
   Purpose: One-click module WhatsApp button -> custom message composer.
   No template messages are generated or scheduled by the client.
   Lekha Technologies
========================================================= */
(function(window, document){
  "use strict";

  const MAX_MESSAGE_LENGTH=4000;
  let modal=null;

  function esc(v){return String(v??"").trim();}
  function html(v){return esc(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
  function normalizePhone(v){return String(v||"").replace(/[^0-9]/g,"");}
  function firebaseFunctions(){
    try{
      if(window.getFMSFunctions) return window.getFMSFunctions();
      if(window.firebase?.functions) return window.firebase.functions("asia-south1");
    }catch(e){}
    return null;
  }
  function defaultMessage(module,options){
    const title=esc(options.title||`${module} update`);
    const date=new Date().toLocaleDateString("en-IN");
    const summary=esc(options.summaryText||"");
    return `${title}\nModule: ${module}\nStatus as on: ${date}\n\n${summary ? summary+"\n\n" : ""}Please type your message here.`;
  }
  function ensureModal(){
    if(modal) return modal;
    const wrap=document.createElement("div");
    wrap.id="fmsWhatsAppModal";
    wrap.innerHTML=`
      <div class="fms-wa-backdrop"></div>
      <div class="fms-wa-dialog" role="dialog" aria-modal="true" aria-labelledby="fmsWaTitle">
        <div class="fms-wa-header"><strong id="fmsWaTitle">Send WhatsApp Message</strong><button type="button" id="fmsWaClose" aria-label="Close">&times;</button></div>
        <div class="fms-wa-body">
          <div class="mb-2"><label class="form-label fw-semibold">Module</label><input id="fmsWaModule" class="form-control" readonly></div>
          <div class="mb-2"><label class="form-label fw-semibold">Recipient WhatsApp Number</label><input id="fmsWaRecipient" class="form-control" inputmode="numeric" placeholder="9198XXXXXXXX" maxlength="20"><div class="form-text">Use international format without + or spaces.</div></div>
          <div class="mb-2"><label class="form-label fw-semibold">Custom Message</label><textarea id="fmsWaMessage" class="form-control" rows="9" maxlength="4000"></textarea><div class="form-text text-end"><span id="fmsWaCount">0</span>/4000</div></div>
          <div id="fmsWaInfo" class="alert alert-info py-2 small mb-0">Custom text messages are sent through the WhatsApp Cloud API. Meta permits free-form text during an active customer-service window; outside that window Meta may require an approved template.</div>
          <div id="fmsWaStatus" class="mt-2 small"></div>
        </div>
        <div class="fms-wa-footer"><button type="button" class="btn btn-secondary" id="fmsWaCancel">Cancel</button><button type="button" class="btn btn-success" id="fmsWaSend"><i class="bi bi-whatsapp"></i> Send WhatsApp</button></div>
      </div>`;
    const style=document.createElement("style");
    style.textContent=`#fmsWhatsAppModal{position:fixed;inset:0;z-index:99999;display:none}.fms-wa-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55)}.fms-wa-dialog{position:relative;width:min(620px,calc(100% - 28px));max-height:92vh;overflow:auto;margin:4vh auto;background:#fff;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.3)}.fms-wa-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #ddd}.fms-wa-header button{border:0;background:transparent;font-size:28px;line-height:1}.fms-wa-body{padding:18px}.fms-wa-footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #ddd}`;
    document.head.appendChild(style); document.body.appendChild(wrap); modal=wrap;
    const close=()=>{wrap.style.display="none";};
    wrap.querySelector("#fmsWaClose").onclick=close; wrap.querySelector("#fmsWaCancel").onclick=close; wrap.querySelector(".fms-wa-backdrop").onclick=close;
    wrap.querySelector("#fmsWaMessage").addEventListener("input",()=>{wrap.querySelector("#fmsWaCount").textContent=wrap.querySelector("#fmsWaMessage").value.length;});
    return wrap;
  }
  async function sendCustomMessage({module,recipient,message}){
    const to=normalizePhone(recipient), text=esc(message);
    if(to.length<8 || to.length>15) throw new Error("Enter a valid international WhatsApp number, e.g. 9198XXXXXXXX.");
    if(!text) throw new Error("Please enter a message.");
    if(text.length>MAX_MESSAGE_LENGTH) throw new Error("Message is too long. Maximum 4000 characters.");
    const fn=firebaseFunctions();
    if(!fn) throw new Error("Firebase Functions client is not loaded. Please refresh the page.");
    const callable=fn.httpsCallable("sendCustomWhatsAppMessage");
    const result=await callable({module:esc(module||"FMS"),to,message:text});
    return result.data||{success:true};
  }
  async function compose(options={}){
    const module=esc(options.module||"FMS").toUpperCase();
    const el=ensureModal();
    el.querySelector("#fmsWaModule").value=module;
    el.querySelector("#fmsWaRecipient").value=esc(options.recipient||"");
    el.querySelector("#fmsWaMessage").value=esc(options.defaultMessage||defaultMessage(module,options));
    el.querySelector("#fmsWaCount").textContent=el.querySelector("#fmsWaMessage").value.length;
    el.querySelector("#fmsWaStatus").textContent="";
    el.style.display="block";
    setTimeout(()=>el.querySelector("#fmsWaRecipient").focus(),50);
    const send=el.querySelector("#fmsWaSend");
    send.onclick=async()=>{
      const status=el.querySelector("#fmsWaStatus");
      send.disabled=true; status.className="mt-2 small text-muted"; status.textContent="Sending...";
      try{
        await sendCustomMessage({module,recipient:el.querySelector("#fmsWaRecipient").value,message:el.querySelector("#fmsWaMessage").value});
        status.className="mt-2 small text-success fw-semibold"; status.textContent="WhatsApp message sent successfully.";
        if(typeof options.message==="function") options.message("WhatsApp message sent successfully.","success");
      }catch(e){
        console.error("WhatsApp custom message failed:",e);
        status.className="mt-2 small text-danger"; status.textContent=e?.message||"Unable to send WhatsApp message.";
        if(typeof options.message==="function") options.message(status.textContent,"danger");
      }finally{send.disabled=false;}
    };
    return {success:true,method:"custom-composer",module};
  }
  function openWhatsApp(text){
    const url="https://wa.me/?text="+encodeURIComponent(text||"");
    window.open(url,"_blank","noopener,noreferrer");
  }
  window.FMSWhatsAppService={compose,sendCustomMessage,openWhatsApp};
})(window,document);
