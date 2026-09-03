const express = require('express');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const EXCEL_FILE = path.join(__dirname, 'MAIN DATA TRANSFORMATION', 'WWF Template.xlsx');
const DATA_SHEET = 'Fact_Forestry_Data';
const WHITELIST_SHEET = 'Whitelist';

const RECORD_COLS = [
  'Record_ID','Practice','Tab_Name','Project_Name',
  'Intervention_Category','Intervention_Code','Intervention_Name',
  'Intervention_Description','Year','Plants_Count','Area_Covered_ha',
  'Survival_Rate_pct','Remarks_Evidence'
];

const DEFAULT_WHITELIST = [
  { email: 'admin@wwf.org', name: 'WWF Admin', role: 'admin', addedAt: '2024-01-01' },
  { email: 'field.officer@wwf.org', name: 'KP Field Officer', role: 'editor', addedAt: '2024-01-15' },
  { email: 'mne.manager@wwf.org', name: 'M&E Coordinator', role: 'editor', addedAt: '2024-02-01' },
  { email: 'tayyab@wwf.org', name: 'Tayyab - Project Lead', role: 'editor', addedAt: '2024-02-10' },
  { email: 'viewer@wwf.org', name: 'Observer Viewer', role: 'viewer', addedAt: '2024-03-01' }
];

const DEFAULT_DOMAINS = [
  { domain: 'wwf.org', role: 'editor', addedAt: '2024-01-01' },
  { domain: 'wwfpak.org', role: 'editor', addedAt: '2024-01-01' },
  { domain: 'wwf-pakistan.org', role: 'editor', addedAt: '2024-01-01' },
  { domain: 'panda.org', role: 'viewer', addedAt: '2024-01-01' }
];

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

function readWorkbook() {
  return xlsx.readFile(EXCEL_FILE);
}

function ensureSheet(wb, name, defaultData) {
  if (!wb.SheetNames.includes(name)) {
    const ws = xlsx.utils.json_to_sheet(defaultData);
    xlsx.utils.book_append_sheet(wb, ws, name);
  }
}

// GET /api/records
app.get('/api/records', (req, res) => {
  try {
    const wb = readWorkbook();
    const ws = wb.Sheets[DATA_SHEET];
    if (!ws) return res.status(404).json({ error: 'Sheet not found: ' + DATA_SHEET });
    const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
    res.json(rows);
  } catch (err) {
    console.error('GET /api/records:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/records
app.post('/api/records', (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'Expected JSON array' });
    const wb = readWorkbook();
    const ws = xlsx.utils.json_to_sheet(records, { header: RECORD_COLS });
    const colWidths = [8,20,30,45,50,12,42,60,8,18,18,18,60];
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
    wb.Sheets[DATA_SHEET] = ws;
    if (!wb.SheetNames.includes(DATA_SHEET)) wb.SheetNames.push(DATA_SHEET);
    xlsx.writeFile(wb, EXCEL_FILE);
    res.json({ success: true, count: records.length });
  } catch (err) {
    console.error('POST /api/records:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/whitelist
app.get('/api/whitelist', (req, res) => {
  try {
    const wb = readWorkbook();
    ensureSheet(wb, WHITELIST_SHEET, DEFAULT_WHITELIST);
    ensureSheet(wb, 'AllowedDomains', DEFAULT_DOMAINS);
    const users = xlsx.utils.sheet_to_json(wb.Sheets[WHITELIST_SHEET], { defval: null });
    const domains = xlsx.utils.sheet_to_json(wb.Sheets['AllowedDomains'], { defval: null });
    const pending = wb.SheetNames.includes('PendingRequests')
      ? xlsx.utils.sheet_to_json(wb.Sheets['PendingRequests'], { defval: null })
      : [];
    res.json({ users, domains, pending });
  } catch (err) {
    console.error('GET /api/whitelist:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whitelist
app.post('/api/whitelist', (req, res) => {
  try {
    const { users, domains, pending } = req.body;
    const wb = readWorkbook();
    if (users !== undefined) {
      wb.Sheets[WHITELIST_SHEET] = xlsx.utils.json_to_sheet(users.length ? users : [{ note: 'empty' }]);
      if (!wb.SheetNames.includes(WHITELIST_SHEET)) wb.SheetNames.push(WHITELIST_SHEET);
    }
    if (domains !== undefined) {
      wb.Sheets['AllowedDomains'] = xlsx.utils.json_to_sheet(domains.length ? domains : [{ note: 'empty' }]);
      if (!wb.SheetNames.includes('AllowedDomains')) wb.SheetNames.push('AllowedDomains');
    }
    if (pending !== undefined) {
      wb.Sheets['PendingRequests'] = xlsx.utils.json_to_sheet(pending.length ? pending : [{ note: 'empty' }]);
      if (!wb.SheetNames.includes('PendingRequests')) wb.SheetNames.push('PendingRequests');
    }
    xlsx.writeFile(wb, EXCEL_FILE);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/whitelist:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'forestry_dashboard.html')));

app.listen(PORT, () => {
  console.log('');
  console.log('  ===================================================');
  console.log('  WWF Forestry Portal is RUNNING');
  console.log('  Open in browser: http://localhost:' + PORT);
  console.log('  Excel file     : ' + EXCEL_FILE);
  console.log('  Press Ctrl+C to stop the server.');
  console.log('  ===================================================');
  console.log('');
});
