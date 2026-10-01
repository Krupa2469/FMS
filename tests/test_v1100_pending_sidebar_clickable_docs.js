const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const home=read('index.html');
const cpHtml=read('modules/cpgrams/cpgrams-register.html');
const cpJs=read('modules/cpgrams/cpgrams-register.js');
const rtiJs=read('modules/rti/rti-register.js');
const dishaJs=read('modules/disha/disha-register.js');
const app=read('js/app.js');
function a(c,m){if(!c)throw new Error(m)}
for(const id of [
  'sidebarPrajavaniPendingCount','sidebarPublicGrievancesPendingCount','sidebarDirectComplaintsPendingCount',
  'sidebarLAQPendingCount','sidebarLCQPendingCount','sidebarCourtCasesPendingCount','sidebarVIPReferencesPendingCount',
  'sidebarCMOReferencesPendingCount','sidebarPMOReferencesPendingCount','sidebarAuditParasPendingCount',
  'sidebarVigilanceCasesPendingCount','sidebarRTIPendingCount','sidebarDISHAPendingCount'
]) a(home.includes(`id="${id}"`),`Missing Home pending count ${id}`);
a(home.includes('grievanceType=Prajavani&fy=all&filter=pending&fullscreen=1&register=grievances'),'Prajavani pending link missing');
a(home.includes('modules/rti/rti-register.html?fy=all&filter=pending&fullscreen=1'),'RTI pending link missing');
a(home.includes('modules/disha/disha-register.html?fy=all&scope=all&filter=pending-files&fullscreen=1'),'DISHA pending files link missing');
a(home.includes('updateHomeSidebarPendingCounts'),'Home pending counts updater missing');
a(cpHtml.includes('table-layout:auto'),'CPGRAMS registers must auto-fit columns');
a(cpJs.includes('if(view==="appeals")'),'Appeals-only register view missing');
a(cpJs.includes('view==="grievances"'),'Grievances-only register view missing');
a(cpJs.includes('if(c[0]==="registrationNo")return `<td>${linkCell(r,"grievance",value)}</td>`'),'Grievance No must be clickable for all grievance types');
a(cpJs.includes('(k==="laq"||k==="lcq")&&c[0]==="questionNo"'),'LAQ/LCQ number must be clickable');
a(rtiJs.includes('data-rti-application-doc'),'RTI Application No must be clickable');
a(rtiJs.includes('openRTIApplicationDocument'),'RTI document opener missing');
a(dishaJs.includes('case "pending-files"'),'DISHA pending-files filter missing');
a(dishaJs.includes('["officeStatus", "File Status"]'),'DISHA pending file register must display File Status');
a(app.includes('VERSION: "1.10.0"'),'App version must be 1.10.0');
console.log('v1.10.0 pending sidebar / clickable document checks passed');
