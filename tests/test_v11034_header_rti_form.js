const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function assert(cond,msg){if(!cond){throw new Error(msg);}}
const rtiHtml=read('modules/rti/rti.html');
const rtiJs=read('modules/rti/rti.js');
assert(!rtiHtml.includes('>RTI Application Number</label>'),'Visible RTI Application Number label still present');
assert(rtiHtml.includes('<input id="applicationNumber" type="hidden"/>'),'Hidden legacy applicationNumber value missing');
assert(!rtiJs.includes('Please enter RTI Application Number.'),'RTI Application Number is still required');
assert(rtiJs.includes('["applicationDate","Please enter Application Date."]'),'Application Date validation missing');
const files=['index.html','modules/cpgrams/cpgrams.html','modules/rti/rti.html','modules/disha/disha.html','pages/reports.html'];
for(const f of files){
  const s=read(f);
  assert(s.includes('#6-3-605, Anand Nagar Colony, Khairatabad, Hyderabad-500 004'),`${f}: new header address missing`);
  assert(!s.includes('#6-3-6-605'),`${f}: old 6-3-6-605 remains`);
  assert(!s.includes('#6-3-607'),`${f}: old 6-3-607 remains`);
}
console.log('PASS v1.10.34 header + RTI form changes');
