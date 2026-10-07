/* FMS v1.10.25 — Document categories shared by CPGRAMS, RTI and DISHA. */
(function (window) {
  'use strict';
  const TYPES = ['Grievance', 'Appeal', 'Memo', 'ATR', 'Final Reply', 'RTI Application', 'First Appeal', 'Second Appeal', 'PoM', 'Meeting Notice', 'Agenda', 'Other'];
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function options(value) {
    const chosen = String(value || 'Other').trim();
    const list = TYPES.includes(chosen) ? TYPES : [chosen, ...TYPES];
    return list.map(label => `<option value="${escape(label)}"${label===chosen?' selected':''}>${escape(label)}</option>`).join('');
  }
  window.FMSDocumentTypes = {TYPES, options, escape};
})(window);
