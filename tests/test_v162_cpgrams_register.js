const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'modules/cpgrams/cpgrams.html'), 'utf8');
const workspace = fs.readFileSync(path.join(root, 'js/grievance-workspace.js'), 'utf8');
const register = fs.readFileSync(path.join(root, 'modules/cpgrams/cpgrams-register.js'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Section captions: no numeric prefixes.
assert(html.includes('<h5 class="mb-0">GRIEVANCE DETAILS</h5>'), 'Section 1 heading must be GRIEVANCE DETAILS');
assert(/<h5 class="mb-0">\s*COMPLAINANT DETAILS\s*<\/h5>/.test(html), 'Section 2 heading must be COMPLAINANT DETAILS');
assert(html.includes('<h5 class="mb-0">OFFICE PROCESSING</h5>'), 'Section 3 heading must be OFFICE PROCESSING');
assert(!html.includes('SECTION 1 : GRIEVANCE DETAILS'), 'Section 1 numeric prefix must be removed');
assert(!html.includes('SECTION 2 : COMPLAINANT DETAILS'), 'Section 2 numeric prefix must be removed');
assert(!html.includes('SECTION 3 : OFFICE PROCESSING'), 'Section 3 numeric prefix must be removed');

const expectedColumnsLiteral = '[["registrationNo","Grievance No."],["dateReceived","Date Received"],["complainantName","Complaint Name"],["subject","Subject"],["district","District"],["mandal","Mandal"],["village","Village"],["atrStatusView","ATR Status"],["finalStatusView","Grievance Status"]]';
assert(workspace.includes(`if(key==="cpgrams")return ${expectedColumnsLiteral};`), 'Inline CPGRAMS register columns must match the approved 9 fields');
assert(register.includes(`if(k==="cpgrams")return ${expectedColumnsLiteral};`), 'Full-screen CPGRAMS register columns must match the approved 9 fields');

// CPGRAMS tables must not prepend Sl.No.; Action remains appended by renderer.
assert(!workspace.includes('head.innerHTML=`<tr><th>Sl.No.</th>${cols.map'), 'Inline CPGRAMS register must not force Sl.No.');
assert(!register.includes("head.innerHTML='<th>Sl.No.</th>'+cols.map"), 'Full-screen CPGRAMS register must not force Sl.No.');

assert(/case "atrStatusView":return fv\(r,"atrStatus"\)\|\|/.test(workspace), 'Inline register must prefer saved ATR Status');
assert(/case "atrStatusView":return first\(r,\["atrStatus"/.test(register), 'Full-screen register must prefer saved ATR Status');

console.log('v1.6.2 CPGRAMS headings/register layout checks passed');
