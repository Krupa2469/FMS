
/* Rose Gardens Resident Access Validation
   Open resident access is by stored phone number, not by H.No. selection.
   H.No. is displayed as 2-1/<house number>. Resident Type Owner, Tenant
   and Family Member are eligible for every Occupation Status.
*/
(function(global){
  const KEY_PHONE = "rg_verified_phone";
  const KEY_RESIDENT = "rg_current_resident";

  function normPhone(v){
    return String(v||"").replace(/\D/g,"").replace(/^91(?=\d{10}$)/,"");
  }
  function plotLabel(plot){
    const p=String(plot||"").trim();
    if(!p) return "";
    return p.toLowerCase().startsWith("2-1/") ? p : "2-1/"+p;
  }
  function isVacant(r){
    const s=String(r.status||r.occupancyStatus||"").toLowerCase();
    return r.isVacant===true || s==="vacant" || s.includes("vacant");
  }
  function residentPhone(r){
    return r.phone||r.mobile||r.mobileNumber||r.phoneNumber||"";
  }
  function isLoginResident(r){
    const t=String(r?.residentType||r?.ResidentType||r?.['Resident Type']||'').trim().toLowerCase();
    return ['owner','owners','property owner','propertyowner','tenant','tenants','family member','family members','familymember','familymembers'].includes(t);
  }
  function findByPhone(residents, phone){
    const p=normPhone(phone);
    return (residents||[]).find(r=>isLoginResident(r) && normPhone(residentPhone(r))===p);
  }
  function allowedResidents(residents){
    return (residents||[]).filter(isLoginResident);
  }
  function validateSelection(selectedPlot, phone, residents){
    const resident=findByPhone(residents,phone);
    if(!resident) return {ok:false,message:"Resident phone number is not registered for an Owner/Tenant/Family Member login."};
    const expected=String(resident.plotNo||resident.hNo||resident.houseNo||"").trim();
    if(String(selectedPlot||"").trim()!==expected){
      return {ok:false,message:"Please select your H.No."};
    }
    sessionStorage.setItem(KEY_PHONE,normPhone(phone));
    sessionStorage.setItem(KEY_RESIDENT,JSON.stringify(resident));
    return {ok:true,resident};
  }
  global.RoseResidentAccess={normPhone,plotLabel,isVacant,residentPhone,findByPhone,allowedResidents,validateSelection};
})(window);
