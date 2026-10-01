const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const home=read('index.html');
const app=read('js/app.js');
function a(c,m){if(!c)throw new Error(m)}
a(!home.includes('home-sidebar-title'),'Sidebar must not display a Modules title');
a(!home.includes('id="dashboardReady"'),'Home financial-year/summary strip must be removed');
a(!home.includes('Total Records | CPGRAMS:'),'Home must not show an aggregate summary line above cards');
a(home.includes('href="pages/utilities.html"'),'Utilities must be in sidebar');
a(home.includes('href="pages/admin/master-management.html"'),'Master Tables must be in sidebar');
a(home.includes('href="pages/reports.html"'),'Reports must be in sidebar');
a(home.includes('font-weight:700;font-size:1rem;line-height:1.2'),'Sidebar links must be bold and dashboard-sized');
a(home.includes('Main Home shows Total values across all financial years.'),'Home cards must continue showing all-years totals');
a(app.includes('VERSION: "1.9.8"'),'App version must be 1.9.8');
console.log('v1.9.8 sidebar/navigation cleanup checks passed');
