const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
const reports=read('js/reports/reports.js');
const inline=read('js/module-inline-dashboard.js');
const gw=read('js/grievance-workspace.js');
const cpr=read('modules/cpgrams/cpgrams-register.js');
const rtir=read('modules/rti/rti-register.js');
assert(reports.includes('Districts Conducted Meetings'),'DISHA report summary uses Districts Conducted Meetings');
assert(!reports.includes('{label:"Meetings Held"'),'DISHA report summary no longer renders Meetings Held card');
assert(gw.includes('Appeals Received')&&gw.includes('Appeals Pending')&&gw.includes('Appeals Disposed'),'CPGRAMS dashboard has appeal cards');
assert(cpr.includes('appeals-received')&&cpr.includes('appeals-pending')&&cpr.includes('appeals-disposed'),'CPGRAMS register supports appeal card filters');
assert(inline.includes('First Appeals Received')&&inline.includes('First Appeals Pending')&&inline.includes('First Appeals Disposed')&&inline.includes('Second Appeals Received')&&inline.includes('Second Appeals Pending')&&inline.includes('Second Appeals Disposed'),'RTI dashboard has first and second appeal cards');
assert(rtir.includes('first-appeals-received')&&rtir.includes('first-appeals-pending')&&rtir.includes('first-appeals-disposed')&&rtir.includes('second-appeals-received')&&rtir.includes('second-appeals-pending')&&rtir.includes('second-appeals-disposed'),'RTI register supports appeal card filters');
if(process.exitCode) process.exit(process.exitCode);
