const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function ok(cond,msg){if(!cond){throw new Error(msg);}}
const nav=read('js/module-navigation.js');
ok(nav.includes('label:"CPGRAMS"'),'CPGRAMS must remain in top navigation');
ok(!nav.includes('label:"Grievances"'),'Grievances must be removed from top navigation');
ok(!nav.includes('label:"Appeals"'),'Appeals must be removed from top navigation');
ok(/if\(\/\^cpgrams\$\/i\.test\(type\)\) return "cpgrams";/.test(nav),'CPGRAMS register contexts should highlight CPGRAMS');
const disha=read('modules/disha/disha.html');
ok(!disha.includes('position: fixed !important;'),'DISHA must not contain legacy fixed layout rules');
ok(disha.includes('position: sticky !important;'),'DISHA navigation should use normal sticky navigation');
ok(disha.indexOf('class="fms-global-header"') < disha.indexOf('id="moduleDashboardPanel"'),'DISHA common header must appear before dashboard content');
console.log('v1.10.10 navigation / DISHA header checks passed');
