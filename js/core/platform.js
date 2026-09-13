/* Rose Gardens platform helpers */
(function(){
  window.RGMS = window.RGMS || {};
  window.RGMS.openPaymentApp = window.RGMS.openPaymentApp || function(){ return false; };
  window.RGMS.openP2PPaymentApp = window.RGMS.openP2PPaymentApp || function(){ return false; };
  window.RGMS.openUpiChooser = window.RGMS.openUpiChooser || function(uri){
    if(!uri) return false;
    try { window.location.href = uri; return true; } catch (_) { return false; }
  };
  window.RGMS.openUpiApp = window.RGMS.openUpiApp || function(_app, uri){
    if(!uri) return false;
    try { window.location.href = uri; return true; } catch (_) { return false; }
  };
  window.RGMS.openExternal = function(url){
    if(!url) return false;
    try{
      if(window.RGMSNativeAuth?.openExternal && window.RGMSNativeAuth.openExternal(url)) return true;
    }catch(e){}
    try{ window.open(url,'_blank','noopener,noreferrer'); return true; }catch(e){ return false; }
  };
})();

// Keep external service/payment pages outside the WebView. This preserves the
// current Rose Gardens screen underneath them so Android Back/return always
// comes back to the screen the resident was using.
document.addEventListener('click', function(e){
  const a=e.target.closest('a[href]');
  if(!a) return;
  const href=a.getAttribute('href') || '';
  if(!/^https?:\/\//i.test(href)) return;
  if(a.closest('[data-allow-internal-http]')) return;
  if(window.RGMS?.openExternal){
    e.preventDefault();
    window.RGMS.openExternal(href);
  }
}, true);
