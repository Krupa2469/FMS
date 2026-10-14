const fs=require('fs');
const assert=require('assert');
const reportsJs=fs.readFileSync('js/reports/reports.js','utf8');
assert(reportsJs.includes('function filteredSummaryRows(module,def,ignoreRange=false)'), 'Filtered summary dataset helper must exist');
assert(reportsJs.includes('summaryDataset(p.module,def,false)'), 'Custom summary cards must use the report definition filters');
assert(reportsJs.includes('filteredScope:true'), 'GRIEVANCES summary cards must calculate from the filtered rows');
assert(reportsJs.includes('relevant.some(sec=>passesSectionFilters'), 'Section-wise filters must feed the summary dataset');
assert(reportsJs.includes('summaryDataset(p.module,def,true)'), 'All-time summary cards must keep the same filters while ignoring the date range');
console.log('PASS v1.10.32 Reports: summary cards follow report/section filters');
