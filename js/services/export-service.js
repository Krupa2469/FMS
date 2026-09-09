/* ============================================================
   FMS EXPORT SERVICE
   Excel / PDF / JPEG / Print + native device sharing.
   Version 1.2.2
   ============================================================ */
(function(window,document){
  "use strict";

  const DEFAULT_HEADER=[
    "GOVERNMENT OF TELANGANA",
    "OFFICE OF THE COMMISSIONER, RURAL DEVELOPMENT",
    "#6-3-607, Anand Nagar Colony, Khairatabad,Hyderabad-500 004"
  ];

  function slug(v){
    return String(v||"FMS_Report").trim().replace(/[^a-z0-9._-]+/gi,"_").replace(/^_+|_+$/g,"")||"FMS_Report";
  }
  function clean(v){
    if(v===null||v===undefined)return "";
    if(v instanceof Date)return v.toLocaleDateString("en-GB");
    if(v&&typeof v.toDate==="function")return v.toDate().toLocaleDateString("en-GB");
    if(typeof v==="object"){
      try{return JSON.stringify(v);}catch(e){return String(v);}
    }
    return String(v);
  }
  function normalizeColumns(rows,columns){
    if(Array.isArray(columns)&&columns.length)return columns.map(c=>typeof c==="string"?{key:c,label:c}:{key:c.key,label:c.label||c.key});
    const first=(rows||[])[0]||{};return Object.keys(first).map(k=>({key:k,label:k}));
  }
  function exportRows(rows,columns){
    const cols=normalizeColumns(rows,columns);
    return (rows||[]).map(r=>{const out={};cols.forEach(c=>out[c.label||c.key]=clean(r?.[c.key]));return out;});
  }
  function ensureRows(rows){if(!Array.isArray(rows)||!rows.length)throw new Error("No records are available to export.");}
  function headerLines(opts){return Array.isArray(opts.headerLines)&&opts.headerLines.length?opts.headerLines:DEFAULT_HEADER;}
  function summaryItems(opts,rows){
    if(Array.isArray(opts.summary)&&opts.summary.length)return opts.summary.map(x=>({label:String(x.label||x.name||""),value:clean(x.value)}));
    return [{label:"Total Records",value:String((rows||[]).length)}];
  }
  function metaLines(opts,rows){
    const out=[];
    if(opts.financialYear)out.push(`Financial Year: ${opts.financialYear}`);
    if(opts.periodLabel)out.push(String(opts.periodLabel));
    out.push(`Records: ${(rows||[]).length}`);
    return out;
  }
  function saveBlob(blob,filename){
    const url=URL.createObjectURL(blob);
    try{
      const a=document.createElement("a");
      a.href=url;a.download=filename;a.rel="noopener";a.style.display="none";
      document.body.appendChild(a);a.click();a.remove();
    }finally{
      setTimeout(()=>URL.revokeObjectURL(url),2500);
    }
    return {downloaded:true,filename};
  }
  function fileFromBlob(blob,filename,type){
    try{return new File([blob],filename,{type:type||blob.type||"application/octet-stream",lastModified:Date.now()});}
    catch(e){blob.name=filename;return blob;}
  }
  function today(){return new Date().toLocaleDateString("en-GB");}
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  function buildExcelFile(opts={}){
    const rows=opts.rows||[];ensureRows(rows);
    if(!window.XLSX)throw new Error("Excel export library is not loaded.");
    const cols=normalizeColumns(rows,opts.columns);
    const headers=headerLines(opts),summary=summaryItems(opts,rows),meta=metaLines(opts,rows);
    const aoa=[];
    headers.forEach(line=>aoa.push([line]));
    aoa.push([]);
    aoa.push([String(opts.title||"FMS Report")]);
    meta.forEach(line=>aoa.push([line]));
    aoa.push([]);
    aoa.push(["SUMMARY"]);
    summary.forEach(item=>aoa.push([item.label,item.value]));
    aoa.push([]);
    aoa.push(cols.map(c=>c.label||c.key));
    rows.forEach(r=>aoa.push(cols.map(c=>clean(r?.[c.key]))));

    const ws=window.XLSX.utils.aoa_to_sheet(aoa);
    const colCount=Math.max(cols.length,2);
    ws["!merges"]=[];
    const mergeRows=[0,1,2,4];
    // meta/title positions vary with number of header lines; merge all one-cell presentation rows.
    for(let r=0;r<aoa.length;r++){
      if(aoa[r]&&aoa[r].length===1&&aoa[r][0])ws["!merges"].push({s:{r,c:0},e:{r,c:colCount-1}});
    }
    ws["!cols"]=cols.map(c=>({wch:Math.min(Math.max(String(c.label||c.key).length+4,14),38)}));
    if(ws["!cols"].length<2)ws["!cols"].push({wch:18});
    ws["!freeze"]={xSplit:0,ySplit:headers.length+meta.length+summary.length+5};

    const wb=window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb,ws,String(opts.sheetName||"FMS Report").slice(0,31));
    const bytes=window.XLSX.write(wb,{bookType:"xlsx",type:"array"});
    const blob=new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    return fileFromBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".xlsx",blob.type);
  }

  function buildPDFDocument(opts={}){
    const rows=opts.rows||[];ensureRows(rows);
    if(!window.jspdf?.jsPDF)throw new Error("PDF export library is not loaded.");
    const cols=normalizeColumns(rows,opts.columns),{jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:opts.orientation||"landscape",unit:"mm",format:"a4"});
    const pageWidth=doc.internal.pageSize.getWidth();
    let y=10;
    const center=(text,size,bold=false)=>{doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);doc.text(String(text),pageWidth/2,y,{align:"center"});y+=size*0.42+2;};
    const headers=headerLines(opts);
    center(headers[0]||"",14,true);
    center(headers[1]||"",10,true);
    center(headers[2]||"",9,false);
    y+=2;
    center(String(opts.title||"FMS Report"),12,true);
    metaLines(opts,rows).forEach(line=>center(line,8,false));
    y+=2;
    if(typeof doc.autoTable!=="function")throw new Error("PDF table library is not loaded.");
    const summary=summaryItems(opts,rows);
    doc.autoTable({
      head:[["Summary","Value"]],body:summary.map(x=>[x.label,x.value]),startY:y,
      theme:"grid",styles:{fontSize:8,cellPadding:1.5},headStyles:{fontStyle:"bold"},
      margin:{left:12,right:12},tableWidth:95
    });
    y=(doc.lastAutoTable?.finalY||y)+5;
    doc.autoTable({
      head:[cols.map(c=>c.label||c.key)],body:rows.map(r=>cols.map(c=>clean(r?.[c.key]))),startY:y,
      styles:{fontSize:7,cellPadding:1.5,overflow:"linebreak"},headStyles:{fontStyle:"bold"},margin:{left:8,right:8}
    });
    return doc;
  }
  function buildPDFFile(opts={}){
    const doc=buildPDFDocument(opts),blob=doc.output("blob");
    return fileFromBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".pdf","application/pdf");
  }

  function buildExportSheet(opts={}){
    const rows=opts.rows||[],cols=normalizeColumns(rows,opts.columns),headers=headerLines(opts),summary=summaryItems(opts,rows);
    const wrap=document.createElement("div");
    wrap.style.cssText="position:fixed;left:-100000px;top:0;background:#fff;color:#111;padding:28px;width:max-content;min-width:1200px;z-index:-1;font-family:Arial,sans-serif";
    const addLine=(text,css)=>{const d=document.createElement("div");d.textContent=text;d.style.cssText=css;wrap.appendChild(d);};
    addLine(headers[0]||"","text-align:center;font-weight:700;font-size:24px;margin-bottom:5px");
    addLine(headers[1]||"","text-align:center;font-weight:700;font-size:17px;margin-bottom:4px");
    addLine(headers[2]||"","text-align:center;font-size:14px;margin-bottom:14px");
    addLine(opts.title||"FMS Report","text-align:center;font-weight:700;font-size:20px;margin-bottom:5px");
    metaLines(opts,rows).forEach(line=>addLine(line,"text-align:center;font-size:12px;margin-bottom:3px"));
    const sum=document.createElement("table");sum.style.cssText="border-collapse:collapse;margin:14px auto 16px;font-size:12px;min-width:520px";
    sum.innerHTML='<thead><tr><th colspan="2" style="border:1px solid #555;padding:6px;background:#eee">SUMMARY</th></tr></thead><tbody>'+summary.map(x=>`<tr><td style="border:1px solid #777;padding:6px;font-weight:600">${escapeHtml(x.label)}</td><td style="border:1px solid #777;padding:6px;text-align:right">${escapeHtml(x.value)}</td></tr>`).join("")+"</tbody>";wrap.appendChild(sum);
    const table=document.createElement("table");table.style.cssText="border-collapse:collapse;width:100%;font-size:12px";
    const trh=document.createElement("tr");cols.forEach(c=>{const th=document.createElement("th");th.textContent=c.label||c.key;th.style.cssText="border:1px solid #555;padding:6px;background:#eee;text-align:center;white-space:nowrap";trh.appendChild(th);});
    const thead=document.createElement("thead");thead.appendChild(trh);table.appendChild(thead);
    const tbody=document.createElement("tbody");rows.forEach(r=>{const tr=document.createElement("tr");cols.forEach(c=>{const td=document.createElement("td");td.textContent=clean(r?.[c.key]);td.style.cssText="border:1px solid #777;padding:5px;vertical-align:top;max-width:300px;white-space:pre-wrap";tr.appendChild(td);});tbody.appendChild(tr);});table.appendChild(tbody);wrap.appendChild(table);document.body.appendChild(wrap);return wrap;
  }
  async function jpegBlobFromElement(element){
    if(!element)throw new Error("Nothing is available to export as JPEG.");
    if(!window.html2canvas)throw new Error("JPEG export library is not loaded.");
    const canvas=await window.html2canvas(element,{backgroundColor:"#ffffff",scale:1.5,useCORS:true,logging:false,width:element.scrollWidth,height:element.scrollHeight,windowWidth:element.scrollWidth,windowHeight:element.scrollHeight});
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Unable to create JPEG image.")),"image/jpeg",0.92));
  }
  async function buildJPEGFile(opts={}){
    const rows=opts.rows||[];ensureRows(rows);const sheet=buildExportSheet(opts);
    try{const blob=await jpegBlobFromElement(sheet);return fileFromBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".jpg","image/jpeg");}
    finally{sheet.remove();}
  }
  async function buildFile(type,opts={}){
    const kind=String(type||"").toLowerCase();
    if(kind==="excel"||kind==="xlsx")return buildExcelFile(opts);
    if(kind==="pdf")return buildPDFFile(opts);
    if(kind==="jpeg"||kind==="jpg")return await buildJPEGFile(opts);
    throw new Error("Unsupported share/export format: "+type);
  }
  async function toExcel(opts={}){const file=buildExcelFile(opts);saveBlob(file,file.name);return file;}
  async function toPDF(opts={}){const file=buildPDFFile(opts);saveBlob(file,file.name);return file;}
  async function elementToJPEG(opts={}){const blob=await jpegBlobFromElement(opts.element);const file=fileFromBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".jpg","image/jpeg");saveBlob(file,file.name);return file;}
  async function toJPEG(opts={}){const file=await buildJPEGFile(opts);saveBlob(file,file.name);return file;}

  async function shareFile(type,opts={}){
    const rows=opts.rows||[];ensureRows(rows);
    const file=await buildFile(type,opts),title=String(opts.title||"FMS Report");
    const text=String(opts.shareText||`${title}\nRecords: ${rows.length}\nGenerated: ${new Date().toLocaleString("en-IN")}`);

    if(typeof navigator.share==="function"){
      let canShareFile=false;
      try{canShareFile=typeof navigator.canShare==="function"&&navigator.canShare({files:[file]});}catch(e){canShareFile=false;}
      if(canShareFile){
        try{
          await navigator.share({title,text,files:[file]});
          return {shared:true,fileShared:true,file};
        }catch(error){
          if(error?.name==="AbortError")return {shared:false,cancelled:true,file};
          // Windows/Edge and some managed browsers can report NotAllowedError/Permission denied
          // even though navigator.canShare() returned true. Do not show a blocking error.
          if(error?.name!=="NotAllowedError"&&error?.name!=="SecurityError")console.warn("File share failed; falling back:",error);
        }
      }
      try{
        await navigator.share({title,text});
        return {shared:true,fileShared:false,file,textOnly:true};
      }catch(error){
        if(error?.name==="AbortError")return {shared:false,cancelled:true,file};
        if(error?.name!=="NotAllowedError"&&error?.name!=="SecurityError")console.warn("Text share failed; downloading instead:",error);
      }
    }

    saveBlob(file,file.name);
    return {shared:false,fileShared:false,file,downloaded:true,fallback:true,message:"Device sharing is not permitted by this browser. The report file was downloaded instead."};
  }

  async function printRows(opts={}){
    const rows=opts.rows||[];ensureRows(rows);const cols=normalizeColumns(rows,opts.columns),headers=headerLines(opts),summary=summaryItems(opts,rows);
    const w=window.open("","_blank","width=1200,height=800");if(!w)throw new Error("Popup blocked. Please allow popups for printing.");
    const htmlRows=rows.map(r=>`<tr>${cols.map(c=>`<td>${escapeHtml(clean(r?.[c.key]))}</td>`).join("")}</tr>`).join("");
    const sumRows=summary.map(x=>`<tr><td>${escapeHtml(x.label)}</td><td style="text-align:right">${escapeHtml(x.value)}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(opts.title||"FMS Report")}</title><style>body{font-family:Arial;padding:18px;color:#111}.gov{text-align:center;margin:0}.gov1{font-size:22px;font-weight:700}.gov2{font-size:15px;font-weight:700;margin-top:4px}.gov3{font-size:13px;margin-top:4px}.title{text-align:center;font-size:18px;font-weight:700;margin:14px 0 5px}.meta{text-align:center;font-size:11px;margin:2px}.summary{border-collapse:collapse;min-width:480px;margin:14px auto}table.data{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #555;padding:5px;vertical-align:top}th{background:#eee}@media print{button{display:none}}</style></head><body><div class="gov gov1">${escapeHtml(headers[0]||"")}</div><div class="gov gov2">${escapeHtml(headers[1]||"")}</div><div class="gov gov3">${escapeHtml(headers[2]||"")}</div><div class="title">${escapeHtml(opts.title||"FMS Report")}</div>${metaLines(opts,rows).map(x=>`<div class="meta">${escapeHtml(x)}</div>`).join("")}<table class="summary"><thead><tr><th colspan="2">SUMMARY</th></tr></thead><tbody>${sumRows}</tbody></table><table class="data"><thead><tr>${cols.map(c=>`<th>${escapeHtml(c.label||c.key)}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table><script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close();
  }
  function fromTable(table,options={}){
    if(!table)return {rows:[],columns:[]};
    const headers=[...table.querySelectorAll("thead th")].map((th,i)=>({key:`c${i}`,label:th.innerText.trim()}));
    const rows=[...table.querySelectorAll("tbody tr")].filter(tr=>!tr.querySelector("td[colspan]")).map(tr=>{const r={};[...tr.children].forEach((td,i)=>r[`c${i}`]=td.innerText.trim());return r;});
    if(options.dropLastColumn&&headers.length){headers.pop();rows.forEach(r=>delete r[`c${headers.length}`]);}
    return {rows,columns:headers};
  }

  window.FMSExportService={toExcel,toPDF,toJPEG,elementToJPEG,printRows,fromTable,exportRows,slug,buildFile,shareFile,buildExcelFile,buildPDFFile,buildJPEGFile,DEFAULT_HEADER};
})(window,document);
