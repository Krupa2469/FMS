/* =========================================================
   FMS CENTRAL EXPORT SERVICE
   Version 1.0
   Excel / PDF / JPEG / Print exports for registers and reports.
========================================================= */
(function(window, document){
  "use strict";

  function clean(v){
    if(v===null||v===undefined) return "";
    if(v&&typeof v.toDate==="function") v=v.toDate();
    if(v instanceof Date) return v.toLocaleDateString("en-GB");
    return String(v);
  }
  function slug(v){return String(v||"FMS_Export").trim().replace(/[^a-z0-9_-]+/gi,"_").replace(/^_+|_+$/g,"")||"FMS_Export";}
  function normalizeColumns(rows,columns){
    if(Array.isArray(columns)&&columns.length){
      return columns.map(c=>typeof c==="string"?{key:c,label:c}:c);
    }
    const first=rows&&rows[0]?rows[0]:{};
    return Object.keys(first).map(k=>({key:k,label:k}));
  }
  function exportRows(rows,columns){
    const cols=normalizeColumns(rows,columns);
    return (rows||[]).map(r=>{
      const out={}; cols.forEach(c=>out[c.label||c.key]=clean(r?.[c.key])); return out;
    });
  }
  function ensureRows(rows){if(!Array.isArray(rows)||!rows.length) throw new Error("No records are available to export.");}
  function saveBlob(blob,filename){
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }
  async function toExcel(opts={}){
    const rows=opts.rows||[]; ensureRows(rows);
    if(!window.XLSX) throw new Error("Excel export library is not loaded.");
    const data=exportRows(rows,opts.columns), ws=window.XLSX.utils.json_to_sheet(data);
    const wb=window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb,ws,String(opts.sheetName||"FMS Report").slice(0,31));
    window.XLSX.writeFile(wb,slug(opts.filename||opts.title||"FMS_Report")+".xlsx");
  }
  async function toPDF(opts={}){
    const rows=opts.rows||[]; ensureRows(rows);
    if(!window.jspdf?.jsPDF) throw new Error("PDF export library is not loaded.");
    const cols=normalizeColumns(rows,opts.columns), {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:opts.orientation||"landscape",unit:"mm",format:"a4"});
    const title=String(opts.title||"FMS Report");
    doc.setFontSize(14); doc.text(title,14,14);
    doc.setFontSize(9); doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`,14,20);
    if(typeof doc.autoTable!=="function") throw new Error("PDF table library is not loaded.");
    doc.autoTable({
      head:[cols.map(c=>c.label||c.key)],
      body:rows.map(r=>cols.map(c=>clean(r?.[c.key]))),
      startY:25,
      styles:{fontSize:7,cellPadding:1.5,overflow:"linebreak"},
      headStyles:{fontStyle:"bold"},
      margin:{left:8,right:8}
    });
    doc.save(slug(opts.filename||title)+".pdf");
  }
  function buildExportSheet(opts={}){
    const rows=opts.rows||[], cols=normalizeColumns(rows,opts.columns);
    const wrap=document.createElement("div");
    wrap.style.cssText="position:fixed;left:-100000px;top:0;background:#fff;color:#111;padding:22px;width:max-content;min-width:1200px;z-index:-1;font-family:Arial,sans-serif";
    const title=document.createElement("div"); title.style.cssText="text-align:center;font-weight:700;font-size:22px;margin-bottom:6px"; title.textContent=opts.title||"FMS Report"; wrap.appendChild(title);
    const meta=document.createElement("div"); meta.style.cssText="text-align:center;font-size:12px;margin-bottom:14px"; meta.textContent=`Generated: ${new Date().toLocaleString("en-IN")} • Records: ${rows.length}`;wrap.appendChild(meta);
    const table=document.createElement("table");table.style.cssText="border-collapse:collapse;width:100%;font-size:12px";
    const trh=document.createElement("tr"); cols.forEach(c=>{const th=document.createElement("th");th.textContent=c.label||c.key;th.style.cssText="border:1px solid #555;padding:6px;background:#eee;text-align:center;white-space:nowrap";trh.appendChild(th);});
    const thead=document.createElement("thead");thead.appendChild(trh);table.appendChild(thead);
    const tbody=document.createElement("tbody"); rows.forEach(r=>{const tr=document.createElement("tr");cols.forEach(c=>{const td=document.createElement("td");td.textContent=clean(r?.[c.key]);td.style.cssText="border:1px solid #777;padding:5px;vertical-align:top;max-width:300px;white-space:pre-wrap";tr.appendChild(td);});tbody.appendChild(tr);});table.appendChild(tbody);wrap.appendChild(table);document.body.appendChild(wrap);return wrap;
  }
  async function elementToJPEG(opts={}){
    const element=opts.element; if(!element) throw new Error("Nothing is available to export as JPEG.");
    if(!window.html2canvas) throw new Error("JPEG export library is not loaded.");
    const canvas=await window.html2canvas(element,{backgroundColor:"#ffffff",scale:1.5,useCORS:true,logging:false,width:element.scrollWidth,height:element.scrollHeight,windowWidth:element.scrollWidth,windowHeight:element.scrollHeight});
    await new Promise((resolve,reject)=>canvas.toBlob(blob=>{if(!blob)return reject(new Error("Unable to create JPEG image."));saveBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".jpg");resolve();},"image/jpeg",0.92));
  }
  async function toJPEG(opts={}){
    const rows=opts.rows||[]; ensureRows(rows);
    if(!window.html2canvas) throw new Error("JPEG export library is not loaded.");
    const sheet=buildExportSheet(opts);
    try{
      const canvas=await window.html2canvas(sheet,{backgroundColor:"#ffffff",scale:1.5,useCORS:true,logging:false,width:sheet.scrollWidth,height:sheet.scrollHeight,windowWidth:sheet.scrollWidth,windowHeight:sheet.scrollHeight});
      await new Promise((resolve,reject)=>canvas.toBlob(blob=>{if(!blob)return reject(new Error("Unable to create JPEG image."));saveBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".jpg");resolve();},"image/jpeg",0.92));
    }finally{sheet.remove();}
  }
  async function printRows(opts={}){
    const rows=opts.rows||[]; ensureRows(rows); const cols=normalizeColumns(rows,opts.columns);
    const w=window.open("","_blank","width=1200,height=800"); if(!w) throw new Error("Popup blocked. Please allow popups for printing.");
    const htmlRows=rows.map(r=>`<tr>${cols.map(c=>`<td>${String(clean(r?.[c.key])).replace(/[&<>]/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[x]))}</td>`).join("")}</tr>`).join("");
    w.document.write(`<!doctype html><html><head><title>${opts.title||"FMS Report"}</title><style>body{font-family:Arial;padding:18px}h2{text-align:center}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #555;padding:5px;vertical-align:top}th{background:#eee}@media print{button{display:none}}</style></head><body><h2>${opts.title||"FMS Report"}</h2><div style="text-align:center;margin-bottom:10px">Generated: ${new Date().toLocaleString("en-IN")} • Records: ${rows.length}</div><table><thead><tr>${cols.map(c=>`<th>${c.label||c.key}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table><script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close();
  }
  function fromTable(table,options={}){
    if(!table) return {rows:[],columns:[]};
    const headers=[...table.querySelectorAll("thead th")].map((th,i)=>({key:`c${i}`,label:th.innerText.trim()}));
    const rows=[...table.querySelectorAll("tbody tr")].filter(tr=>!tr.querySelector("td[colspan]")).map(tr=>{const r={};[...tr.children].forEach((td,i)=>r[`c${i}`]=td.innerText.trim());return r;});
    if(options.dropLastColumn&&headers.length){headers.pop();rows.forEach(r=>delete r[`c${headers.length}`]);}
    return {rows,columns:headers};
  }
  window.FMSExportService={toExcel,toPDF,toJPEG,elementToJPEG,printRows,fromTable,exportRows,slug};
})(window,document);
