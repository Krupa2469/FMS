/*=========================================================
  RGMS Receipt Engine
=========================================================*/
(function () {
    function esc(value){return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

    async function resolveTreasurerName() {
        try {
            const profiles = (typeof getAllRecords === 'function' && window.STORAGE_KEYS?.USER_PROFILES) ? getAllRecords(STORAGE_KEYS.USER_PROFILES) : [];
            const profile = profiles.find(r => String(r.role || '').toLowerCase() === 'treasurer' && (r.displayName || r.name));
            if (profile) return profile.displayName || profile.name;
        } catch(e) {}
        try {
            const residents = (typeof getAllRecords === 'function' && window.STORAGE_KEYS?.RESIDENTS) ? RGMS.store.getResidentMaster({includeVacant:true}) : [];
            const t = residents.find(r => String(r.role || '').toLowerCase() === 'treasurer' && (r.ownerName || r.displayName));
            if (t) return t.ownerName || t.displayName;
        } catch(e) {}
        return SOCIETY.treasurerName || 'Treasurer';
    }

    async function buildDevelopmentFundReceipt(payment) {
        const treasurerName = payment.treasurerName || await resolveTreasurerName();
        const fundType = payment.fundType || 'Colony Fund';
        const month = payment.collectionPeriod ? (()=>{ const m=String(payment.collectionPeriod).match(/^(\d{4})-(\d{2})$/); return m ? new Date(Number(m[1]),Number(m[2])-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : payment.collectionPeriod; })() : '—';
        const paymentDate = payment.paymentDate ? formatDate(payment.paymentDate) : '—';
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Colony Fund Receipt - ${payment.receiptNo}</title>
<style>
body{font-family:Arial,sans-serif;margin:30px;color:#222}
.receipt{border:2px solid #123f68;padding:28px;max-width:760px;margin:auto}
.header{text-align:center;border-bottom:2px solid #123f68;padding-bottom:16px;margin-bottom:20px}
.header h2{margin:0;color:#123f68}.header h3{margin:6px 0}
table{width:100%;border-collapse:collapse}td{padding:9px;border-bottom:1px solid #ddd}
.footer{margin-top:45px;text-align:right}
.amount{font-size:22px;font-weight:700}
</style>
</head>
<body>
<div class="receipt">
<div class="header">
<h2>Rose Gardens</h2>
<h3>${esc(fundType.toUpperCase())} RECEIPT</h3>
<p>Rose Gardens, Cheeryal Ward, Keesara Circle, Medchal Malkajgiri District -501303</p>
</div>
<p style="font-size:17px;line-height:1.7"><b>Received with thanks from Sri/Smt ${esc(payment.ownerName || 'Resident')}, H.No. ${esc(payment.plotNo || payment.houseNo || '')}, towards ${esc(fundType)} on ${esc(paymentDate)} for the month of ${esc(month)}.</b></p>
<table>
<tr><td><b>Receipt No.</b></td><td>${esc(payment.receiptNo)}</td></tr>
<tr><td><b>Date</b></td><td>${esc(paymentDate)}</td></tr>
<tr><td><b>H.No.</b></td><td>${esc(formatHNo(payment.houseNo || payment.plotNo))}</td></tr>
<tr><td><b>Resident Name</b></td><td>${esc(payment.ownerName)}</td></tr>
<tr><td><b>Month</b></td><td>${esc(month)}</td></tr>
<tr><td><b>Amount Paid</b></td><td class="amount">${esc(formatCurrency(payment.amountPaid))}</td></tr>
<tr><td><b>Payment Mode</b></td><td>${esc(payment.paymentMode || '—')}</td></tr>
<tr><td><b>Transaction No.</b></td><td>${esc(payment.transactionNo || '-')}</td></tr>
</table>
<div class="footer"><div style="height:55px"></div><b>${esc(treasurerName)}</b><br><span>Treasurer</span><br><span>Rose Gardens</span></div>
</div>
</body></html>`;
    }

    async function printDevelopmentFundReceipt(payment) {
        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) { alert("Please allow pop-ups to print the receipt."); return; }
        win.document.open();
        win.document.write(await buildDevelopmentFundReceipt(payment));
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }


    async function buildGaneshFestivalReceipt(payment) {
        const treasurerName = payment.treasurerName || await resolveTreasurerName();
        const isAuction = String(payment.recordType || '').toLowerCase() === 'ladduauction';
        const fundType = isAuction ? 'Laddu Auction Amount' : 'Ganesh Festival Chanda';
        const amount = Number(isAuction ? payment.auctionAmount : (payment.chandaAmount ?? payment.amountPaid ?? 0));
        const date = payment.paymentDate || payment.auctionDate || payment.date || '';
        const residentName = isAuction ? (payment.winnerName || payment.ownerName || 'Laddu Auction Winner') : (payment.ownerName || 'Resident');
        const plot = isAuction ? (payment.winnerPlotNo || payment.plotNo || '') : (payment.plotNo || '');
        const festivalYear = payment.festivalYear || new Date().getFullYear();
        const sentence = isAuction
            ? `Received with thanks from Sri/Smt ${esc(residentName)}, H.No. ${esc(formatHNo(plot))}, towards Laddu Auction Amount on ${esc(date ? formatDate(date) : '—')} for Ganesh Festival ${esc(festivalYear)}.`
            : `Received with thanks from Sri/Smt ${esc(residentName)}, H.No. ${esc(formatHNo(plot))}, towards Ganesh Festival Chanda on ${esc(date ? formatDate(date) : '—')} for Ganesh Festival ${esc(festivalYear)}.`;
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ganesh Festival Receipt - ${esc(payment.receiptNo || '')}</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#222}.receipt{border:2px solid #123f68;padding:28px;max-width:760px;margin:auto}.header{text-align:center;border-bottom:2px solid #123f68;padding-bottom:16px;margin-bottom:20px}.header h2{margin:0;color:#123f68}.header h3{margin:6px 0}table{width:100%;border-collapse:collapse}td{padding:9px;border-bottom:1px solid #ddd}.footer{margin-top:45px;text-align:right}.amount{font-size:22px;font-weight:700}</style></head><body><div class="receipt"><div class="header"><h2>Rose Gardens</h2><h3>${esc(fundType.toUpperCase())} RECEIPT</h3><p>Rose Gardens, Cheeryal Ward, Keesara Circle, Medchal Malkajgiri District -501303</p></div><p style="font-size:17px;line-height:1.7"><b>${sentence}</b></p><table><tr><td><b>Receipt No.</b></td><td>${esc(payment.receiptNo || '—')}</td></tr><tr><td><b>Financial Year</b></td><td>${esc(festivalYear)}</td></tr><tr><td><b>H.No.</b></td><td>${esc(formatHNo(plot))}</td></tr><tr><td><b>Name</b></td><td>${esc(residentName)}</td></tr><tr><td><b>Amount</b></td><td class="amount">${esc(formatCurrency(amount))}</td></tr><tr><td><b>Date</b></td><td>${esc(date ? formatDate(date) : '—')}</td></tr><tr><td><b>Payment Mode</b></td><td>${esc(payment.paymentMode || '—')}</td></tr><tr><td><b>Transaction No.</b></td><td>${esc(payment.transactionNo || '—')}</td></tr></table><div class="footer"><div style="height:55px"></div><b>${esc(treasurerName)}</b><br><span>Treasurer</span><br><span>Rose Gardens</span></div></div></body></html>`;
    }
    async function printGaneshFestivalReceipt(payment) {
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) { alert('Please allow pop-ups to print the receipt.'); return; }
        win.document.open(); win.document.write(await buildGaneshFestivalReceipt(payment)); win.document.close(); win.focus(); setTimeout(() => win.print(), 500);
    }

    window.RGMS.receipt = {
        buildDevelopmentFundReceipt,
        printDevelopmentFundReceipt,
        buildGaneshFestivalReceipt,
        printGaneshFestivalReceipt
    };
})();
