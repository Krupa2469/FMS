/* ============================================================
   FMS EXPORT SERVICE
   Excel / PDF / JPEG / Print + native device sharing.
   Version 1.10.27
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
  function normalizeSections(opts,rows,columns){
    if(!Array.isArray(opts?.sections)||!opts.sections.length)return [];
    return opts.sections.map((sec,i)=>{const sectionRows=Array.isArray(sec?.rows)?sec.rows:rows;return {heading:String(sec?.heading||`Section ${i+1}`).trim(),columns:normalizeColumns(sectionRows,sec?.columns||[]),rows:sectionRows};}).filter(sec=>sec.heading&&sec.columns.length);
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
  function columnWidthScores(columns,rows){
    const data=Array.isArray(rows)?rows:[];
    return (columns||[]).map((c,idx)=>{
      const label=String(c?.label||c?.key||"");
      const key=c?.key;
      const lower=label.toLowerCase();
      let maxLen=Math.max(label.length,6);
      data.slice(0,150).forEach(r=>{const v=clean(r?.[key]);maxLen=Math.max(maxLen,Math.min(String(v).length,60));});
      if(/^(s\.?no\.?|sl\.?no\.?|serial)/i.test(label))return 6;
      if(/date/i.test(lower))return Math.max(12,Math.min(maxLen,14));
      if(/status|type|district|mandal|village/i.test(lower))return Math.max(12,Math.min(maxLen,18));
      if(/name/i.test(lower))return Math.max(14,Math.min(maxLen,24));
      if(/subject|description|remarks|information|question|answer/i.test(lower))return Math.max(20,Math.min(maxLen,34));
      if(/number|no\.?$/i.test(lower))return Math.max(14,Math.min(maxLen,22));
      return Math.max(9,Math.min(maxLen,24));
    });
  }
  function columnWidthsCh(columns,rows){
    return columnWidthScores(columns,rows).map((score,i)=>{
      const label=String(columns?.[i]?.label||columns?.[i]?.key||"").toLowerCase();
      if(/^(s\.?no\.?|sl\.?no\.?|serial)/i.test(label))return 7;
      if(/date/i.test(label))return Math.min(score,13);
      if(/status|type/i.test(label))return Math.min(score,15);
      if(/name/i.test(label))return Math.min(score,22);
      if(/subject|description|remarks|information|question|answer/i.test(label))return Math.min(score,32);
      return Math.min(score,22);
    });
  }
  function tableWidthCh(columns,rows){return columnWidthsCh(columns,rows).reduce((a,b)=>a+b,0)+2;}
  function colgroupHtml(columns,rows){
    return '<colgroup>'+columnWidthsCh(columns,rows).map(w=>`<col style="width:${w}ch">`).join('')+'</colgroup>';
  }

  function buildExcelFile(opts={}){
    const rows=opts.rows||[];ensureRows(rows);
    if(!window.XLSX)throw new Error("Excel export library is not loaded.");
    const cols=normalizeColumns(rows,opts.columns),sections=normalizeSections(opts,rows,cols);
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
    if(sections.length){
      sections.forEach((sec,idx)=>{
        if(idx)aoa.push([]);
        aoa.push([sec.heading]);
        aoa.push(sec.columns.map(c=>c.label||c.key));
        sec.rows.forEach(r=>aoa.push(sec.columns.map(c=>clean(r?.[c.key]))));
      });
    }else{
      aoa.push(cols.map(c=>c.label||c.key));
      rows.forEach(r=>aoa.push(cols.map(c=>clean(r?.[c.key]))));
    }

    const ws=window.XLSX.utils.aoa_to_sheet(aoa);
    const widthColumns=sections.length?sections.flatMap(sec=>sec.columns):cols;
    const colCount=Math.max(...(sections.length?sections.map(sec=>sec.columns.length):[cols.length]),2);
    ws["!merges"]=[];
    for(let r=0;r<aoa.length;r++){
      if(aoa[r]&&aoa[r].length===1&&aoa[r][0])ws["!merges"].push({s:{r,c:0},e:{r,c:colCount-1}});
    }
    const widths=[];for(let i=0;i<colCount;i++){let maxLen=8;aoa.forEach(row=>{const v=row?.[i];if(v!==undefined&&v!==null)maxLen=Math.max(maxLen,Math.min(String(v).length+2,32));});widths.push({wch:maxLen});}ws["!cols"]=widths;
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
    const cols=normalizeColumns(rows,opts.columns),sections=normalizeSections(opts,rows,cols),{jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:opts.orientation||"landscape",unit:"mm",format:"a4"});
    const pageWidth=doc.internal.pageSize.getWidth(),pageHeight=doc.internal.pageSize.getHeight();
    const reportMargin=8,reportTableWidth=pageWidth-(reportMargin*2);
    let y=10;
    const center=(text,size,bold=false)=>{doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);doc.text(String(text),pageWidth/2,y,{align:"center"});y+=size*0.42+2;};
    const headers=headerLines(opts);
    center(headers[0]||"",14,true);center(headers[1]||"",10,true);center(headers[2]||"",9,false);y+=2;
    center(String(opts.title||"FMS Report"),12,true);metaLines(opts,rows).forEach(line=>center(line,8,false));y+=2;
    if(typeof doc.autoTable!=="function")throw new Error("PDF table library is not loaded.");
    const summary=summaryItems(opts,rows);
    doc.setFillColor(234,244,255);doc.setDrawColor(199,217,235);doc.roundedRect(reportMargin,y-3,reportTableWidth,7,1.2,1.2,"FD");doc.setTextColor(35,64,92);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text("SUMMARY",pageWidth/2,y+1.5,{align:"center"});doc.setTextColor(17,24,39);y+=7;
    const summaryCardRows=[];for(let i=0;i<summary.length;i+=4){const row=[];for(let j=0;j<4;j++){const x=summary[i+j];row.push(x?`${x.label}\n${x.value}`:"");}summaryCardRows.push(row);}
    doc.autoTable({body:summaryCardRows,startY:y,theme:"grid",styles:{fontSize:8,cellPadding:2.2,halign:"center",valign:"middle",fontStyle:"bold",textColor:[35,64,92],lineColor:[203,216,230]},didParseCell:data=>{const palette=[[238,246,255],[239,248,243],[255,248,232],[255,241,241],[244,239,255],[238,248,248]];data.cell.styles.fillColor=palette[(data.row.index*4+data.column.index)%palette.length];},margin:{left:reportMargin,right:reportMargin},tableWidth:reportTableWidth});
    y=(doc.lastAutoTable?.finalY||y)+5;
    const drawTable=(tableCols,heading="",tableRows=rows)=>{
      if(heading){
        if(y>pageHeight-24){doc.addPage();y=12;}
        doc.setFillColor(232,243,255);doc.setDrawColor(187,211,235);doc.roundedRect(reportMargin,y-3,reportTableWidth,7,1.2,1.2,"FD");
        doc.setTextColor(35,64,92);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text(String(heading),reportMargin+3,y+1.5);doc.setTextColor(17,24,39);y+=7;
      }
      const scores=columnWidthScores(tableCols,tableRows),rawWidths=scores.map((score,i)=>{const label=String(tableCols?.[i]?.label||"").toLowerCase();if(/^(s\.?no\.?|sl\.?no\.?|serial)/i.test(label))return 9;if(/date/i.test(label))return 18;if(/status|type/i.test(label))return Math.min(24,Math.max(16,score*1.25));if(/name/i.test(label))return Math.min(34,Math.max(20,score*1.3));if(/subject|description|remarks|information|question|answer/i.test(label))return Math.min(46,Math.max(26,score*1.25));return Math.min(32,Math.max(14,score*1.25));}),rawTotal=rawWidths.reduce((a,b)=>a+b,0)||1,scale=Math.min(1,reportTableWidth/rawTotal),columnStyles={};
      rawWidths.forEach((w,i)=>columnStyles[i]={cellWidth:w*scale});
      const naturalTableWidth=rawTotal*scale;
      doc.autoTable({head:[tableCols.map(c=>c.label||c.key)],body:tableRows.map(r=>tableCols.map(c=>clean(r?.[c.key]))),startY:y,styles:{fontSize:7,cellPadding:1.6,overflow:"linebreak",textColor:[31,41,55],lineColor:[203,216,230],lineWidth:.15},headStyles:{fontStyle:"bold",fillColor:[235,245,255],textColor:[32,67,96],lineColor:[187,211,235],halign:"center"},alternateRowStyles:{fillColor:[248,251,255]},columnStyles,margin:{left:reportMargin,right:reportMargin},tableWidth:naturalTableWidth});
      y=(doc.lastAutoTable?.finalY||y)+6;
    };
    if(sections.length)sections.forEach(sec=>drawTable(sec.columns,sec.heading,sec.rows));else drawTable(cols);
    return doc;
  }

  function buildPDFFile(opts={}){
    const doc=buildPDFDocument(opts),blob=doc.output("blob");
    return fileFromBlob(blob,slug(opts.filename||opts.title||"FMS_Report")+".pdf","application/pdf");
  }

  function buildExportSheet(opts={}){
    const rows=opts.rows||[],cols=normalizeColumns(rows,opts.columns),sections=normalizeSections(opts,rows,cols),headers=headerLines(opts),summary=summaryItems(opts,rows);
    const wrap=document.createElement("div");
    const sectionWidths=sections.map(sec=>tableWidthCh(sec.columns,sec.rows));const flatWidth=tableWidthCh(cols,rows);const widestCh=Math.max(flatWidth,...sectionWidths,70);const reportWidth=Math.max(900,Math.min(1500,Math.round(widestCh*8.2+80)));
    wrap.style.cssText=`position:fixed;left:-100000px;top:0;background:#fff;color:#111;padding:28px;width:${reportWidth}px;box-sizing:border-box;z-index:-1;font-family:Arial,sans-serif`;
    const addLine=(text,css)=>{const d=document.createElement("div");d.textContent=text;d.style.cssText=css;wrap.appendChild(d);};
    addLine(headers[0]||"","text-align:center;font-weight:700;font-size:24px;margin-bottom:5px");addLine(headers[1]||"","text-align:center;font-weight:700;font-size:17px;margin-bottom:4px");addLine(headers[2]||"","text-align:center;font-size:14px;margin-bottom:14px");addLine(opts.title||"FMS Report","text-align:center;font-weight:700;font-size:17px;margin-bottom:5px");metaLines(opts,rows).forEach(line=>addLine(line,"text-align:center;font-size:12px;margin-bottom:3px"));
    const sumHeading=document.createElement("div");sumHeading.textContent="SUMMARY";sumHeading.style.cssText="width:100%;box-sizing:border-box;text-align:center;font-weight:700;background:#eaf4ff;color:#23405c;border:1px solid #c7d9eb;padding:7px;margin-top:14px";wrap.appendChild(sumHeading);
    const sum=document.createElement("div");sum.className="summary-cards";sum.style.cssText="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%;box-sizing:border-box;margin:8px 0 16px";const lightCards=["#eef6ff","#eff8f3","#fff8e8","#fff1f1","#f4efff","#eef8f8"];sum.innerHTML=summary.map((x,i)=>`<div style="border:1px solid #d3e1ee;border-radius:8px;padding:9px 7px;text-align:center;min-height:58px;display:flex;flex-direction:column;justify-content:center;background:${lightCards[i%lightCards.length]};color:#29445f"><div style="font-size:11px;font-weight:600">${escapeHtml(x.label)}</div><div style="font-size:18px;font-weight:700;margin-top:4px">${escapeHtml(x.value)}</div></div>`).join("");wrap.appendChild(sum);
    const appendTable=(tableCols,heading="",tableRows=rows)=>{
      if(heading)addLine(heading,"font-weight:700;font-size:14px;background:#e8f3ff;color:#23405c;border:1px solid #c6d9ec;padding:8px 10px;margin-top:12px;border-radius:7px 7px 0 0");
      const table=document.createElement("table");table.style.cssText=`border-collapse:collapse;width:${tableWidthCh(tableCols,tableRows)}ch;max-width:none;font-size:12px;table-layout:fixed;margin-bottom:18px;background:#fff`;
      const colgroup=document.createElement("colgroup");columnWidthsCh(tableCols,tableRows).forEach(w=>{const col=document.createElement("col");col.style.width=w+"ch";colgroup.appendChild(col);});table.appendChild(colgroup);
      const trh=document.createElement("tr");tableCols.forEach(c=>{const th=document.createElement("th");th.textContent=c.label||c.key;th.style.cssText="border:1px solid #c7d8e8;padding:7px;background:#edf6ff;color:#29445f;text-align:center;white-space:normal;overflow-wrap:normal;word-break:normal;font-weight:700";trh.appendChild(th);});const thead=document.createElement("thead");thead.appendChild(trh);table.appendChild(thead);
      const tbody=document.createElement("tbody");tableRows.forEach((r,ri)=>{const tr=document.createElement("tr");if(ri%2===1)tr.style.background="#f9fbfd";tableCols.forEach(c=>{const td=document.createElement("td");td.textContent=clean(r?.[c.key]);td.style.cssText="border:1px solid #d6e1eb;padding:6px;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:normal;color:#263747";tr.appendChild(td);});tbody.appendChild(tr);});table.appendChild(tbody);wrap.appendChild(table);
    };
    if(sections.length)sections.forEach(sec=>appendTable(sec.columns,sec.heading,sec.rows));else appendTable(cols);document.body.appendChild(wrap);return wrap;
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
    const rows=opts.rows||[];ensureRows(rows);const cols=normalizeColumns(rows,opts.columns),sections=normalizeSections(opts,rows,cols),headers=headerLines(opts),summary=summaryItems(opts,rows);
    const w=window.open("","_blank","width=1200,height=800");if(!w)throw new Error("Popup blocked. Please allow popups for printing.");
    const tableHtml=(tableCols,heading="",tableRows=rows)=>`${heading?`<div class="section-heading">${escapeHtml(heading)}</div>`:""}<table class="data" style="width:${tableWidthCh(tableCols,tableRows)}ch">${colgroupHtml(tableCols,tableRows)}<thead><tr>${tableCols.map(c=>`<th>${escapeHtml(c.label||c.key)}</th>`).join("")}</tr></thead><tbody>${tableRows.map(r=>`<tr>${tableCols.map(c=>`<td>${escapeHtml(clean(r?.[c.key]))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const bodyTables=sections.length?sections.map(sec=>tableHtml(sec.columns,sec.heading,sec.rows)).join(""):tableHtml(cols);
    const sumCards=summary.map(x=>`<div class="summary-card"><div class="summary-label">${escapeHtml(x.label)}</div><div class="summary-value">${escapeHtml(x.value)}</div></div>`).join("");
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(opts.title||"FMS Report")}</title><style>body{font-family:Arial;padding:18px;color:#111}.report-shell{width:100%;margin:0 auto}.gov{text-align:center;margin:0;width:100%}.gov1{font-size:22px;font-weight:700}.gov2{font-size:15px;font-weight:700;margin-top:4px}.gov3{font-size:13px;margin-top:4px}.title{text-align:center;font-size:16px;font-weight:700;margin:14px 0 5px}.meta{text-align:center;font-size:11px;margin:2px}.summary-heading{text-align:center;font-weight:700;background:#eaf4ff;color:#23405c;border:1px solid #c7d9eb;padding:6px;margin-top:14px}.summary-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;width:100%;margin:8px 0 14px;box-sizing:border-box}.summary-card{border:1px solid #d3e1ee;border-radius:7px;padding:8px;text-align:center;min-height:52px;display:flex;flex-direction:column;justify-content:center;background:#f8fbff;color:#29445f}.summary-card:nth-child(6n+1){background:#eef6ff}.summary-card:nth-child(6n+2){background:#eff8f3}.summary-card:nth-child(6n+3){background:#fff8e8}.summary-card:nth-child(6n+4){background:#fff1f1}.summary-card:nth-child(6n+5){background:#f4efff}.summary-card:nth-child(6n+6){background:#eef8f8}.summary-label{font-size:10px;font-weight:600}.summary-value{font-size:16px;font-weight:700;margin-top:3px}.section-heading{font-weight:700;background:#e8f3ff;color:#23405c;padding:7px 9px;margin-top:14px;border:1px solid #c6d9ec;border-radius:6px 6px 0 0}table.data{border-collapse:collapse;width:auto;max-width:100%;font-size:11px;table-layout:fixed;margin-bottom:14px}th,td{border:1px solid #d3dfe9;padding:5px;vertical-align:top;word-break:normal}th{background:#edf6ff;color:#29445f;white-space:normal;overflow-wrap:normal;hyphens:none;text-align:center}td{overflow-wrap:anywhere;color:#263747}tbody tr:nth-child(even){background:#f9fbfd}@media print{button{display:none}}</style></head><body><div class="report-shell"><div class="gov gov1">${escapeHtml(headers[0]||"")}</div><div class="gov gov2">${escapeHtml(headers[1]||"")}</div><div class="gov gov3">${escapeHtml(headers[2]||"")}</div><div class="title">${escapeHtml(opts.title||"FMS Report")}</div>${metaLines(opts,rows).map(x=>`<div class="meta">${escapeHtml(x)}</div>`).join("")}<div class="summary-heading">SUMMARY</div><div class="summary-cards">${sumCards}</div>${bodyTables}</div><script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close();
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
