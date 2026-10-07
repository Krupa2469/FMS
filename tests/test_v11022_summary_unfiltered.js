const fs=require('fs');
const assert=require('assert');
const reportsJs=fs.readFileSync('js/reports/reports.js','utf8');
assert(reportsJs.includes('function summaryDataset(module)'), 'A dedicated unfiltered summary dataset helper must exist');
assert(reportsJs.includes('const summaryData=summaryDataset(def.module||"all")'), 'Custom reports must build summary data independently of detail filters');
assert(reportsJs.includes('buildSummary(def.module,summaryData.raw,summaryData.transformed,def.summaryCards)'), 'Custom report summary cards must use the full FY/date-range dataset');
assert(reportsJs.includes('buildSummary("disha",summaryData.raw,summaryData.transformed,def.summaryCards)'), 'DISHA custom summary cards must use the full FY/date-range dataset');
assert(reportsJs.includes('section/report filters affect detail rows only'), 'The intended summary/detail filter separation should be documented in code');
console.log('PASS v1.10.24 Reports: summary cards use full FY/date-range data while section/report filters affect detail rows only');
