"use strict";
/* DISHA FY 2026-27 source data supplied in DISHA Meetings_Status_2026_27.xlsx on 2026-09-27. */
(function(){
  const SOURCE_VERSION="DISHA-2026-27-2026-09-27-v169";
  const rows=[
    ["Sangareddy","2026-06-24","YES","YES","PoM Uploaded Already"],
    ["Mulugu","2026-06-19","YES","YES","PoM Uploaded Already"],
    ["Bhadradri Kothagudem","2026-04-08","YES","YES","PoM Uploaded Already"],
    ["Wanaparthy","2026-04-23","YES","YES","PoM Uploaded Already"],
    ["Nagarkurnool","2026-04-24","YES","YES","PoM Uploaded Already"],
    ["Mahabubnagar","2026-04-28","YES","YES","PoM Uploaded Already"],
    ["Narayanpet","2026-05-14","YES","YES","PoM Uploaded Already"],
    ["Rangareddy","2026-05-16","YES","YES","PoM Uploaded Already"],
    ["Jogulamba Gadwal","2026-05-18","YES","YES","PoM Uploaded Already"],
    ["Yadadri Bhuvanagiri","2026-06-09","YES","YES","PoM Uploaded Already"],
    ["Warangal","2026-06-18","YES","YES","PoM Uploaded Already"],
    ["Jagtial","2026-07-03","YES","YES","PoM Uploaded"],
    ["Adilabad","2026-07-04","YES","YES","PoM Uploaded"],
    ["KB Asifabad","2026-07-07","YES","NO","49 Days Delay for PoM Upload"],
    ["Mahabubabad","2026-07-07","YES","YES","PoM Uploaded"],
    ["Kamareddy","2026-07-17","YES","YES","PoM Uploaded"],
    ["Bhadradri Kothagudem","2026-08-18","YES","YES","PoM Uploaded"],
    ["Narayanpet","2026-09-29","NO","NO","5 Days Left for the Meeting to be Held"]
  ];
  const norm=v=>String(v||"").trim().toLowerCase().replace(/\s+/g," ");
  const key=(district,date)=>`${norm(district)}|${String(date||"").slice(0,10)}`;
  const due=date=>{const d=new Date(date+"T00:00:00");d.setDate(d.getDate()+30);return d.toISOString().slice(0,10);};
  const payload=(r,index)=>({slNo:index+1,district:r[0],dateOfMeeting:r[1],meetingDataUploaded:r[2]==="YES"?"Yes":"No",pomUploaded:r[3]==="YES"?"Yes":"No",pomDueDate:due(r[1]),statusOfMeeting:new Date(r[1]+"T00:00:00")>new Date()?"To be held":"Held",remarks:r[4]||"",financialYear:"2026-27",sourceVersion:SOURCE_VERSION,active:true});
  async function sync(db){
    if(!db) return {created:0,updated:0};
    const snap=await db.collection("dishaMeetings").get();
    const existing=new Map();snap.forEach(doc=>{const d=doc.data()||{};existing.set(key(d.district||d.nameOfDistrict,d.dateOfMeeting||d.meetingDate),{id:doc.id,data:d});});
    let created=0,updated=0;
    for(const [index,r] of rows.entries()){const data=payload(r,index), k=key(data.district,data.dateOfMeeting), hit=existing.get(k);
      if(hit){
        if(hit.data.sourceVersion!==SOURCE_VERSION || Number(hit.data.slNo)!==data.slNo){await db.collection("dishaMeetings").doc(hit.id).set({...data,slNo:data.slNo,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});updated++;}
      }else{await db.collection("dishaMeetings").add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});created++;}
    }
    return {created,updated,total:rows.length};
  }
  window.FMSDishaDataSync={SOURCE_VERSION,rows:rows.map((r,index)=>payload(r,index)),key,sync};
})();
