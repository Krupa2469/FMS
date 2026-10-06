const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const code=scripts.find(t=>t.includes('function renderPendingRoll('));
assert.ok(code, 'The inline dashboard controller is available');
const roll={hidden:true},list={innerHTML:''};
const document={getElementById:(id)=>({pendingRoll:roll,pendingRollList:list}[id]||null),addEventListener:()=>{}};
const context={window:{},document,console,Date,URLSearchParams,setTimeout:()=>{},location:{}};
context.window=context;context.addEventListener=()=>{};
vm.runInNewContext(code,context,{filename:'index.html dashboard inline script'});
function dateDaysAgo(days){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
const records=[
 {grievanceType:'CPGRAMS',grievanceNumber:'GR-1',complainantName:'Balamallu',dateReceived:dateDaysAgo(16),finalStatus:'Pending',appealNumber:'AP-1',appellantName:'Ravi Appellant',appealReceivedDate:dateDaysAgo(57),appealStatus:'Pending'},
 {grievanceType:'CPGRAMS',grievanceNumber:'GR-2',complainantName:'Disposed Grievance',dateReceived:dateDaysAgo(60),finalStatus:'Closed',appealNumber:'AP-2',appellantName:'Asha Appellant',appealReceivedDate:dateDaysAgo(3),appealStatus:'Pending'},
 {grievanceType:'CPGRAMS',grievanceNumber:'GR-3',complainantName:'Anil',dateReceived:dateDaysAgo(20),finalStatus:'Pending',appealStatus:'No Appeal'},
 {grievanceType:'Prajavani',complainantName:'Prajavani Person',dateReceived:dateDaysAgo(14),finalStatus:'Pending'},
 {grievanceType:'Public Grievances',complainantName:'Closed Case',dateReceived:dateDaysAgo(10),finalStatus:'Disposed / Closed'},
 {grievanceType:'CPGRAMS',grievanceNumber:'GR-X',complainantName:'Eve <img src=x onerror=alert(1)>',dateReceived:dateDaysAgo(1),finalStatus:'Pending'},
 {grievanceType:'CPGRAMS',grievanceNumber:'GR-4',complainantName:'Missing date',finalStatus:'Pending'},
 {grievanceType:'CPGRAMS',grievanceNumber:'GR-5',complainantName:'Deleted',dateReceived:dateDaysAgo(5),finalStatus:'Pending',deleted:true}
];
context.renderPendingRoll(records,[],[]);
const out=list.innerHTML;
assert.equal(roll.hidden,false);
assert.match(out,/CPGRAMS Grievances/);
assert.match(out,/CPGRAMS Appeals/);
assert.match(out,/Balamallu/);
assert.match(out,/Ravi Appellant/);
assert.match(out,/57 days pending/);
assert.match(out,/16 days pending/);
assert.match(out,/Asha Appellant/);
assert.match(out,/3 days pending/);
assert.match(out,/Prajavani Person/);
assert.match(out,/14 days pending/);
assert.match(out,/Date not recorded/);
assert.doesNotMatch(out,/Disposed Grievance/);
assert.doesNotMatch(out,/Closed Case/);
assert.doesNotMatch(out,/Deleted/);
assert.doesNotMatch(out,/No Appeal/);
assert.match(out,/Eve &lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(out,/<img src=x onerror=/);
assert.match(out,/register=appeals/);
assert.match(out,/register=grievances/);
const grievanceHeadingPosition=out.indexOf('CPGRAMS Grievances');
const anilPosition=out.indexOf('Anil');
const balamalluPosition=out.indexOf('Balamallu');
assert.ok(grievanceHeadingPosition>=0 && anilPosition>grievanceHeadingPosition && anilPosition<balamalluPosition,'Oldest grievance first');
context.renderPendingRoll([],[],[]);
assert.equal(roll.hidden,false,'DISHA no meetings alert remains even without pending grievance cases');
console.log('PASS: per-complainant and per-appellant days, sorting, exclusions, escaped names, and links');
