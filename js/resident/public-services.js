(function(){
  'use strict';

  const WEATHER='https://api.open-meteo.com/v1/forecast';
  const AIR='https://air-quality-api.open-meteo.com/v1/air-quality';
  const $=id=>document.getElementById(id);
  const LAST_LOCATION_KEY='rgms:lastLocation';
  const ROSE_GARDENS_MAP_LABEL='Rose Gardens, Cheeryal, Keesara, Medchal, Telangana';

  function msg(text,error=false){
    const el=$('residentPublicMessage') || $('publicServicesMessage');
    if(el){
      el.textContent=text;
      el.style.color=error?'#c62828':'';
    }
  }
  function setText(ids,value){
    for(const id of ids){
      const el=$(id);
      if(el){ el.textContent=value; return true; }
    }
    return false;
  }

  function savedCoords(){
    try{
      const x=JSON.parse(sessionStorage.getItem(LAST_LOCATION_KEY)||'null');
      return x && Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lon)) ? {lat:Number(x.lat),lon:Number(x.lon)} : null;
    }catch(_){ return null; }
  }
  function saveCoords(lat,lon){
    try{ sessionStorage.setItem(LAST_LOCATION_KEY,JSON.stringify({lat,lon,at:Date.now()})); }catch(_){}
  }

  function openMaps(query){
    const c=savedCoords();
    const q=c ? `${query} near ${c.lat},${c.lon}` : `${query} near ${ROSE_GARDENS_MAP_LABEL}`;
    const url='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
    if(window.RGMS?.openExternal) window.RGMS.openExternal(url);
    else window.open(url,'_blank','noopener');
  }

  async function requestNativePermission(){
    try{
      const direct=window.RGMSNativeAuth;
      if(direct && typeof direct.requestLocationPermission==='function'){
        direct.requestLocationPermission();
        await new Promise(r=>setTimeout(r,450));
        return;
      }
      const bridge=await window.RGMS?.getNativeFirebaseAuth?.();
      if(bridge && typeof bridge.requestLocationPermission==='function'){
        bridge.requestLocationPermission();
        await new Promise(r=>setTimeout(r,450));
      }
    }catch(e){ console.warn('RGMS location permission bridge:',e); }
  }

  function browserPosition(){
    if(!navigator.geolocation) return Promise.reject(new Error('Location is not available on this device.'));
    return new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(
        p=>resolve(p.coords),
        e=>reject(new Error(
          e.code===1
            ? 'Location permission is blocked. Please allow Location for Rose Gardens in your browser/app settings and try again.'
            : e.code===2
              ? 'Current location could not be determined.'
              : 'Location request timed out. Please try again.'
        )),
        {enableHighAccuracy:false,timeout:15000,maximumAge:300000}
      );
    });
  }

  async function permissionState(){
    try{
      if(navigator.permissions?.query){
        const result=await navigator.permissions.query({name:'geolocation'});
        return result?.state || 'prompt';
      }
    }catch(_){}
    return 'prompt';
  }

  function ensureLocationPrompt(){
    let modal=$('rgLocationPermissionModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='rgLocationPermissionModal';
    modal.style.cssText='position:fixed;inset:0;z-index:22000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45);padding:18px;box-sizing:border-box';
    modal.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="rgLocationPermissionTitle" style="width:min(430px,94vw);background:#fff;border-radius:16px;padding:20px;box-shadow:0 18px 55px rgba(0,0,0,.28);font-family:inherit">
      <h2 id="rgLocationPermissionTitle" style="margin:0 0 8px;color:#0b4f8a;font-size:21px">Allow Location</h2>
      <p style="margin:0 0 16px;color:#52636f;line-height:1.45">Rose Gardens uses your current location for local weather, air quality, rain information and nearby services. Your location is not shown in your profile.</p>
      <div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end">
        <button type="button" id="rgLocationNotNow" style="border:1px solid #cbd7df;background:#fff;color:#415561;border-radius:9px;padding:10px 14px;font-weight:700;cursor:pointer">Not now</button>
        <button type="button" id="rgLocationAllow" style="border:0;background:#0b4f8a;color:#fff;border-radius:9px;padding:10px 16px;font-weight:800;cursor:pointer">Allow Location</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    $('rgLocationNotNow')?.addEventListener('click',()=>{modal.style.display='none';});
    $('rgLocationAllow')?.addEventListener('click',async()=>{
      modal.style.display='none';
      await requestNativePermission();
      await loadLiveData({requestPermission:true});
    });
    return modal;
  }

  async function askForLocationPermission(){
    if(!navigator.geolocation){
      msg('Location is not available on this device.',true);
      return;
    }
    const state=await permissionState();
    if(state==='granted'){
      loadLiveData({requestPermission:false});
      return;
    }
    if(state==='denied'){
      msg('Location is blocked. Enable Location permission for Rose Gardens in browser/app settings.',true);
      return;
    }
    // Show a short in-app explanation first; the browser/Android permission
    // dialog is triggered only after the resident taps Allow Location.
    const modal=ensureLocationPrompt();
    modal.style.display='flex';
  }

  async function requestLocationAgain(){
    await requestNativePermission();
    await loadLiveData({requestPermission:true});
  }

  async function loadLiveData(options={}){
    try{
      msg('Getting live public data…');

      if(!navigator.geolocation){
        throw new Error('Location is not available on this device.');
      }

      const state=await permissionState();
      if(state==='denied'){
        throw new Error('Location permission is blocked. Please allow Location for Rose Gardens in your browser/app settings and try again.');
      }
      if(state==='prompt' && !options.requestPermission){
        msg('Location permission is required for local weather and nearby services.');
        return;
      }

      const coords=await browserPosition();
      const lat=coords.latitude, lon=coords.longitude;
      saveCoords(lat,lon);

      const [wr,ar]=await Promise.all([
        fetch(`${WEATHER}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m&hourly=precipitation_probability&forecast_days=1&timezone=auto`),
        fetch(`${AIR}?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`)
      ]);

      if(!wr.ok || !ar.ok) throw new Error('Live public data service is temporarily unavailable.');

      const w=await wr.json();
      const a=await ar.json();
      const c=w.current||{};
      const ac=a.current||{};
      const rain=w.hourly?.precipitation_probability?.[0];

      setText(['psWeatherTemp','residentWeather','residentPublicWeather'], c.temperature_2m==null?'--':`${Math.round(c.temperature_2m)}°C`);
      setText(['psHumidity','residentHumidity','residentPublicHumidity'], c.relative_humidity_2m==null?'--':`${Math.round(c.relative_humidity_2m)}%`);
      setText(['psAqi','residentAqi','residentPublicAqi'], ac.us_aqi==null?'--':`${Math.round(ac.us_aqi)} AQI`);
      setText(['psRain','residentRain','residentPublicRain'], rain==null?'--':`${Math.round(rain)}%`);

      const locationText=`${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      setText(['psWeatherDesc','residentWeatherDesc'],'Live local temperature');
      setText(['psWeatherLocation','residentWeatherLocation'],locationText);
      setText(['psAqiDesc','residentAqiDesc'],'Live Open-Meteo AQI');

      msg(`Updated ${new Date().toLocaleTimeString('en-IN')}.`);
    }catch(e){
      console.error('RGMS Public Services:',e);
      msg(e.message||'Live public data unavailable.',true);
    }
  }

  window.RGMSResidentPublic={
    refresh:()=>loadLiveData({requestPermission:true}),
    requestLocation:askForLocationPermission,
    maps:()=>openMaps(ROSE_GARDENS_MAP_LABEL)
  };

  document.addEventListener('DOMContentLoaded',()=>{
    $('btnRefreshPublicServices')?.addEventListener('click',requestLocationAgain);
    $('btnRequestLocation')?.addEventListener('click',askForLocationPermission);

    $('btnFindHospitals')?.addEventListener('click',()=>openMaps('hospitals'));
    $('btnFindPolice')?.addEventListener('click',()=>openMaps('police stations'));
    $('btnFindFire')?.addEventListener('click',()=>openMaps('fire stations'));
    $('btnFindPharmacies')?.addEventListener('click',()=>openMaps('pharmacies'));
    $('btnOpenMaps')?.addEventListener('click',()=>openMaps(ROSE_GARDENS_MAP_LABEL));

    $('btnRefreshPublicServices')?.addEventListener('contextmenu',e=>e.preventDefault());

    // Ask once the Resident Dashboard has rendered. This works in the browser
    // and also invokes the native Android permission bridge when present.
    setTimeout(askForLocationPermission,900);
  });
})();
