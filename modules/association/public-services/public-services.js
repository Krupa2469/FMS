/* Rose Gardens - Citizen Services */
(function(){
  function mapSearch(term){
    const q=encodeURIComponent(`${term} near Rose Gardens Hyderabad`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank','noopener');
  }
  function bind(){
    document.getElementById('btnFindHospitals')?.addEventListener('click',()=>mapSearch('hospitals'));
    document.getElementById('btnFindPolice')?.addEventListener('click',()=>mapSearch('police stations'));
    document.getElementById('btnFindFire')?.addEventListener('click',()=>mapSearch('fire stations'));
    document.getElementById('btnFindPharmacies')?.addEventListener('click',()=>mapSearch('pharmacies'));
    document.getElementById('btnOpenMaps')?.addEventListener('click',()=>mapSearch('Rose Gardens'));
  }
  window.initializePublicServices=bind;
})();
