const fs=require('fs'),assert=require('assert');
const nav=fs.readFileSync(__dirname+'/../js/module-navigation.js','utf8');
const ws=fs.readFileSync(__dirname+'/../js/grievance-workspace.js','utf8');
assert(/grievanceType/.test(nav) && /cpgrams-register\.html\?/.test(nav), 'Back to Register must preserve grievanceType in target URL');
assert(/\bfy\b/.test(nav), 'Back to Register must preserve FY in target URL');
assert(!/class="fs-3 fw-bold text-\$\{theme\} lh-1"/.test(ws), 'Dashboard values must not use oversized fs-3');
assert(/fms-dashboard-card-value/.test(ws), 'Dashboard values need compact dedicated styling');
console.log('v1.6.4 navigation/dashboard assertions passed');
