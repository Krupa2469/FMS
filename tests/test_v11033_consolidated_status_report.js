const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const reports=fs.readFileSync(path.join(root,'js/reports/reports.js'),'utf8');
const html=fs.readFileSync(path.join(root,'pages/reports.html'),'utf8');
function ok(v,m){if(!v)throw new Error(m);}
ok(html.includes('value="status">Status Report — Consolidated'),'Consolidated Status Report option missing');
ok(reports.includes('function generateConsolidatedStatus()'),'Consolidated generator missing');
ok(reports.includes('render("Status Report")'),'Status Report heading missing');
ok(reports.includes('STATUS_GRIEVANCE_TYPES'),'Grievance type section catalogue missing');
ok(reports.includes('CPGRAMS Pending Appeals'),'Pending appeals section missing');
ok(reports.includes('RTI Pending Applications'),'Pending RTI section missing');
ok(reports.includes('quarterLabel(q,fy)'), 'DISHA quarter section generation missing');
ok(reports.includes('if(sec)sections.push(sec)'), 'Empty section suppression missing');
ok(reports.includes('d>today'), 'Future DISHA meeting exclusion missing');
console.log('PASS v1.10.34 consolidated Status Report');
