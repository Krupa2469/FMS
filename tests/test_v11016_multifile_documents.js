const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
class Element {
  constructor(tag='div') { this.tagName=tag;this.children=[];this.listeners={};this.innerHTML='';this.textContent='';this.value='';this.files=[];this.disabled=false;this.style={};}
  addEventListener(type,listener){this.listeners[type]=listener;}
  async click(){return await this.listeners.click?.();}
  appendChild(child){this.children.push(child);return child;}
  append(...children){for(const child of children)this.appendChild(child);}
  replaceChildren(...children){this.children=[...children];}
  insertRow(){return this.appendChild(new Row());}
  insertCell(){return this.appendChild(new Element('td'));}
  querySelector(){return null;}
}
class Row extends Element{constructor(){super('tr');}}
function makeContext(){
 const rows=new Map(), calls={view:[],updates:[],created:[],deletes:[],messages:[]};
 const input=new Element('input');input.value='selected';
 const button=new Element('button');
 const list=new Element('div');
 const type=new Element('select');type.value='PoM';
 const elements={fmsAttachmentFile:input,fmsUploadAttachment:button,fmsAttachmentList:list,dishaAttachmentDocumentType:type};
 const document={getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),addEventListener(){}};
 const store={ref:storagePath=>({put:async()=>({ref:{getDownloadURL:async()=>`https://files.example/${storagePath}`}}),delete:async()=>{}})};
 let idSeq=0;
 const FMSCrud={
  create:async(name,item)=>{const id=`id${++idSeq}`;const saved={id,...item};rows.set(id,saved);calls.created.push(saved);return {success:true,id};},
  list:async()=>({success:true,data:[...rows.values()].filter(x=>x.active!==false)}),
  update:async(name,id,update)=>{calls.updates.push(update);Object.assign(rows.get(id),update);return {success:true};},
  softDelete:async(name,id)=>{rows.get(id).active=false;calls.deletes.push(id);return {success:true};}
 };
 const firebase={firestore:{FieldValue:{serverTimestamp:()=>new Date('2026-10-06T00:00:00.000Z')}}};
 const window={db:{},storage:store,FMSCrud,open:(...args)=>calls.view.push(args)};
 const context={window,document,firebase,console,alert:msg=>calls.messages.push(msg),confirm:()=>true,Date,Math};
 vm.runInNewContext(read('js/document-types.js'),context);
 vm.runInNewContext(read('js/services/attachment-service.js'),context);
 return {context,elements,rows,calls};
}
(async()=>{
 const {context,elements,rows,calls}=makeContext();
 const api=context.window.FMSAttachmentService;
 assert.ok(api?.wireUI&&api?.update);
 const ui=api.wireUI({module:'DISHA',inputId:'fmsAttachmentFile',buttonId:'fmsUploadAttachment',listId:'fmsAttachmentList',typeSelectId:'dishaAttachmentDocumentType',getRecordId:()=> 'record1',message:(m,t)=>calls.messages.push(`${t}:${m}`)});
 elements.fmsAttachmentFile.files=[{name:'Minutes.pdf',type:'application/pdf',size:2500},{name:'Attendance.pdf',type:'application/pdf',size:5600}];
 await elements.fmsUploadAttachment.click();
 assert.equal(calls.created.length,2,'multiple files are uploaded in one operation');
 assert.ok(calls.created.every(x=>x.fileRole==='PoM'),'document type persists for all selected files');
 assert.equal(elements.fmsAttachmentFile.value,'','the file selector clears');
 assert.equal(elements.fmsAttachmentList.children.length,1);
 const table=elements.fmsAttachmentList.children[0].children[0];
 const tbody=table.children[0];
 assert.equal(tbody.children.length,2,'document register shows both files');
 const first=tbody.children[0];const actions=first.children[4];
 assert.deepEqual(actions.children.map(x=>x.textContent),['View','Edit','Delete']);
 await actions.children[0].click();
 assert.equal(calls.view.length,1,'view opens uploaded document');
 await actions.children[1].click();
 const select=first.children[2].children[0];select.value='ATR';
 await actions.children[0].click();
 assert.equal([...rows.values()][0].fileRole,'ATR','Edit saves the selected document type');
 assert.equal(calls.updates.length,1,'edit persists to Firestore');
 const latestTable=elements.fmsAttachmentList.children[0].children[0];
 const latestActions=latestTable.children[0].children[1].children[4];
 await latestActions.children[2].click();
 assert.equal(calls.deletes.length,1,'Delete remains available');
 console.log('PASS DISHA/shared: two files uploaded, typed, viewed, edited, deleted');

 // CPGRAMS-specific attachment collection persists its classification and lets it be updated.
 const cpRows=new Map();let cpId=0;
 const cpCrud={
  create:async(collection,data)=>{const id=`cp${++cpId}`;cpRows.set(id,{id,...data});return {success:true,id};},
  list:async()=>({success:true,data:[...cpRows.values()]}),
  update:async(collection,id,changes)=>{Object.assign(cpRows.get(id),changes);return {success:true};}
 };
 const cpWindow={db:{},storage:context.window.storage,FMSCrud:cpCrud};
 const cpContext={window:cpWindow,firebase:context.firebase,console,Date,Math,FileReader:class{}};
 vm.runInNewContext(read('js/repository/attachment-repository.js'),cpContext);
 const upload=await cpWindow.uploadAttachmentRepository('case1',{name:'Memo.pdf',type:'application/pdf',size:1200},{fileRole:'Memo'});
 assert.equal(upload.success,true);
 const listed=await cpWindow.getAttachmentsRepository('case1');
 assert.equal(listed.data[0].fileRole,'Memo');
 const updated=await cpWindow.updateAttachmentRepository(upload.data.id,{fileRole:'Final Reply'});
 assert.equal(updated.success,true);
 assert.equal(cpRows.get(upload.data.id).fileRole,'Final Reply');

 // CPGRAMS UI: multi-selection and the saved documents register with View/Edit/Delete.
 const cpAttachmentInput=new Element('input');cpAttachmentInput.value='selected';
 cpAttachmentInput.files=[{name:'Notice.pdf',type:'application/pdf',size:1400},{name:'Reply.pdf',type:'application/pdf',size:1700}];
 const cpType={value:'ATR'};
 const cpBody=new Element('tbody');const cpCount=new Element('input');
 const cpElements={fileAttachment:cpAttachmentInput,attachmentDocumentType:cpType,attachmentBody:cpBody,txtAttachmentCount:cpCount};
 cpContext.document={getElementById:id=>cpElements[id]||null,createElement:tag=>new Element(tag)};
 cpContext.currentDocumentId='case1';
 cpContext.showLoading=()=>{};cpContext.hideLoading=()=>{};
 cpContext.uploadAttachmentRepository=cpWindow.uploadAttachmentRepository;
 cpContext.getAttachmentsRepository=cpWindow.getAttachmentsRepository;
 cpContext.updateAttachmentRepository=cpWindow.updateAttachmentRepository;
 cpContext.deleteAttachmentRepository=cpWindow.deleteAttachmentRepository;
 cpContext.showMessage=()=>{};cpContext.confirm=()=>true;
 cpContext.alert=()=>{};cpContext.window.open=(...args)=>calls.view.push(args);
 vm.runInNewContext(read('js/document-types.js'),cpContext);
 vm.runInNewContext(read('modules/cpgrams/attachment.js'),cpContext);
 await cpContext.uploadAttachment();
 assert.equal(cpRows.size,3,'CPGRAMS multi-upload adds both new documents');
 assert.equal(cpBody.children.length,3,'CPGRAMS register displays all documents');
 const cpLast=cpBody.children[2];
 const cpActionCell=cpLast.children[4];
 assert.deepEqual(cpActionCell.children.map(x=>x.textContent),['View','Edit','Download','Delete']);
 await cpActionCell.children[0].click();
 assert.equal(calls.view.length,2,'CPGRAMS View opens the document');
 await cpActionCell.children[1].click();
 cpLast.children[2].children[0].value='Final Reply';
 await cpActionCell.children[0].click();
 assert.equal(cpRows.get('cp3').fileRole,'Final Reply','CPGRAMS Edit persists a revised type');
 console.log('PASS CPGRAMS UI: batch upload, View, Edit, Download, Delete');
 console.log('PASS CPGRAMS repository: upload with type, retrieve, edit type');

 // RTI saves files under the individual RTI record. Verify multi-file persistence and view/edit actions.
 const rtiUpdates=[];
 const rtiElements={attachmentFile:{files:[{name:'RTI1.pdf',type:'application/pdf',size:300},{name:'RTI2.pdf',type:'application/pdf',size:400}],value:'selected'},
  rtiAttachmentDocumentType:{value:'ATR'},attachmentList:{innerHTML:''}};
 const rtiDB={collection:()=>({doc:()=>({update:async changes=>{rtiUpdates.push(changes);}})})};
 const rtiWindow={db:rtiDB,storage:context.window.storage,waitForFMSFirebase:()=>{}};
 const rtiDocument={getElementById:id=>rtiElements[id]||null,addEventListener(){},createElement:tag=>new Element(tag)};
 const rtiContext={window:rtiWindow,document:rtiDocument,firebase:context.firebase,console,Date,Math,alert(){},confirm(){return true},setTimeout(){},location:{}};
 vm.runInNewContext(read('js/document-types.js'),rtiContext);
 vm.runInNewContext(read('modules/rti/rti.js'),rtiContext);
 vm.runInNewContext('currentRTIRecordId="rti42";',rtiContext);
 await rtiContext.uploadRTIAttachment('Attachment','attachmentFile');
 assert.equal(rtiUpdates.length,2,'RTI saves each newly uploaded file, protecting partial success');
 assert.equal(rtiUpdates[1].documents.length,2);
 assert.equal(rtiUpdates[1].documents[0].type,'ATR');
 assert.match(rtiElements.attachmentList.innerHTML,/View/);
 assert.match(rtiElements.attachmentList.innerHTML,/Edit/);
 assert.match(rtiElements.attachmentList.innerHTML,/Delete/);
 const rtiTypeCell=new Element('td'),rtiActionCell=new Element('td');
 const rtiRow={querySelector:s=>s==='[data-doc-type]'?rtiTypeCell:rtiActionCell};
 rtiContext.document.querySelector=()=>rtiRow;
 await rtiContext.editRTIAttachment(0);
 rtiTypeCell.children[0].value='Final Reply';
 await rtiActionCell.children[0].click();
 assert.equal(rtiUpdates.length,3,'RTI Edit saves updated document metadata to Firestore');
 assert.equal(rtiUpdates[2].documents[0].type,'Final Reply');
 console.log('PASS RTI: two-file upload, document type, View/Edit/Delete controls and persisted Edit');
})().catch(err=>{console.error(err);process.exitCode=1;});
