// â”€â”€ Constants & Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwu9qP959cjUM7h303nyJxiyTdpnHhDF1r2wFPs-My22peV8yv0Ph1hEgWRg-6KAIB-/exec";
const ADMIN_PASSWORD = "admin@wwf.org";

const CATALOG = [
  { cat:'A. AFFORESTATION, REFORESTATION AND REVEGETATION', code:'A-1', name:'Planting of seedlings',                        desc:'Establishing trees by planting nursery-raised seedlings.',                              practice:'Forests'    },
  { cat:'A. AFFORESTATION, REFORESTATION AND REVEGETATION', code:'A-2', name:'Assisted Natural Regeneration',                desc:'Restoring forests by protecting natural regeneration.',                               practice:'Forests'    },
  { cat:'A. AFFORESTATION, REFORESTATION AND REVEGETATION', code:'A-3', name:'Dry afforestation',                           desc:'Establishing trees in dry areas using conservation techniques.',                      practice:'Forests'    },
  { cat:'B. RANGELAND AND GRASSLAND MANAGEMENT',            code:'B-1', name:'Protection of rangelands/grasslands',          desc:'Protection through fencing, watchers, controlled grazing.',                          practice:'Freshwater' },
  { cat:'B. RANGELAND AND GRASSLAND MANAGEMENT',            code:'B-2', name:'Reseeding of native grasses',                 desc:'Restoration of degraded rangelands by sowing native grass species.',                 practice:'Freshwater' },
  { cat:'B. RANGELAND AND GRASSLAND MANAGEMENT',            code:'B-3', name:'Planting/sowing of palatable native trees',   desc:'Establishing native fodder trees and shrubs.',                                       practice:'Freshwater' },
  { cat:'C. WATERSHED MANAGEMENT AND FLOOD-CONTROL MEASURES',code:'C-1',name:'Slope stabilization through bioengineering', desc:'Brushwood layering, soft-gabion retaining structures.',                              practice:'Freshwater' },
  { cat:'C. WATERSHED MANAGEMENT AND FLOOD-CONTROL MEASURES',code:'C-2',name:'Vegetated flood-control structures',         desc:'Live spurs and brushwood check dams.',                                               practice:'Freshwater' },
  { cat:'C. WATERSHED MANAGEMENT AND FLOOD-CONTROL MEASURES',code:'C-3',name:'Combined engineering and vegetative measures',desc:'Vegetated loose-stone spurs for flood control.',                                    practice:'Freshwater' },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-1', name:'Fruit plants under forestry projects',        desc:'Planting/distribution as part of forestry interventions.',                           practice:'Forests'    },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-2', name:'Grafting of wild olive trees',                desc:'Grafting wild olive trees with cultivated varieties.',                               practice:'Forests'    },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-3', name:'Distribution of seedlings',                  desc:'Seedling distribution to farmers and communities.',                                  practice:'Forests'    },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-4', name:'Campaign/event plantations',                  desc:'Plantations established during campaigns/events.',                                   practice:'Forests'    },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-5', name:'Forest/community protection',                 desc:'Protection of existing forest cover through agreements.',                            practice:'Forests'    },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-6', name:'Agroforestry/farm forestry',                  desc:'Integration of trees on agricultural farmland.',                                     practice:'Food'       },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-7', name:'Mangrove/coastal forest restoration',         desc:'Restoration of coastal mangrove forests.',                                          practice:'Marine'     },
  { cat:'D. OTHER FORESTRY-RELATED MEASURES',               code:'D-8', name:'Urban Greening & School Plantation',          desc:'Urban tree planting in metropolitan schools.',                                       practice:'Forests'    },
];

const DEFAULT_TABS = [
  'Engro Project',
  'WRAP Project',
  'Recharge Pakistan Project',
  'BTASP Project',
  'Agroforestry Projects',
  'Flood Projects',
  'Freshwater Projects',
  'Carporate Engagement Project',
  'Ocean & Freshwater Project'
];
const YEAR_RANGE = [2023,2024,2025,2026];

function getProjectTabs() {
  const tabsFromData = [...new Set(records.map(r => (r.Tab_Name || '').trim()).filter(Boolean))];
  return tabsFromData.length ? tabsFromData : DEFAULT_TABS;
}

// â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let currentUser   = null;
let records       = [];
let whitelist     = { users: [], domains: [], pending: [] };
let charts        = {};
let isTableExpanded = false;
let activeNav     = 'dashboard';
let dashboardSubtab = 'overview';
let activeDataTab = null;
let isWideEditMode = false;
let wideCurrentRows = [];
let pendingConfirmCallback = null;
let previewMode   = ''; // 'row' or 'category'
let previewMeta   = { title: '', subtitle: '' };

// â”€â”€ Formatters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const numFmt   = n => n != null && n !== '' ? Number(n).toLocaleString('en-US') : 'â€”';
const floatFmt = n => n != null && n !== '' ? Number(n).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1}) : 'â€”';

// â”€â”€ Toast Notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showToast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const colors = { success:'bg-emerald-600', error:'bg-rose-600', info:'bg-blue-600', warning:'bg-amber-500' };
  const t = document.createElement('div');
  t.className = `pointer-events-auto px-4 py-3 rounded-2xl text-white text-xs font-semibold shadow-lg animate-toast flex items-center gap-2.5 ${colors[type]||colors.info}`;
  t.innerHTML = `<span>${msg}</span>`;
  t.setAttribute('role', 'status');
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);

  // Screen reader announcement
  const sr = document.getElementById('sr-announcements');
  if (sr) {
    sr.textContent = msg;
    setTimeout(() => { if (sr.textContent === msg) sr.textContent = ''; }, 4000);
  }
}

// â”€â”€ Practice normalization (singular/plural consistency) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PRACTICE_ALIASES = {
  'Forest': 'Forests', 'forest': 'Forests', 'FOREST': 'Forests',
  'Freshwater': 'Freshwater', 'freshwater': 'Freshwater',
  'Food': 'Food', 'food': 'Food',
  'Marine': 'Marine', 'marine': 'Marine',
  'Forests': 'Forests'
};
function normalizePractice(p) {
  if (!p) return 'Forests';
  const s = String(p).trim();
  return PRACTICE_ALIASES[s] || s;
}

// â”€â”€ Data normalizer (record â†” canonical shape) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function normalizeRecord(r) {
  return {
    Record_ID: r.Record_ID != null ? Number(r.Record_ID) : null,
    Practice: normalizePractice(r.Practice),
    Tab_Name: r.Tab_Name || '',
    Project_Name: r.Project_Name || '',
    Intervention_Category: r.Intervention_Category || '',
    Intervention_Code: r.Intervention_Code || '',
    Intervention_Name: r.Intervention_Name || '',
    Intervention_Description: r.Intervention_Description || '',
    Year: r.Year != null ? Number(r.Year) : 2024,
    Plants_Count: (r.Plants_Count != null && r.Plants_Count !== '' && !isNaN(Number(r.Plants_Count))) ? Number(r.Plants_Count) : null,
    Area_Covered_ha: (r.Area_Covered_ha != null && r.Area_Covered_ha !== '' && !isNaN(Number(r.Area_Covered_ha))) ? Number(r.Area_Covered_ha) : null,
    Survival_Rate_pct: (r.Survival_Rate_pct != null && r.Survival_Rate_pct !== '' && !isNaN(Number(r.Survival_Rate_pct))) ? Number(r.Survival_Rate_pct) : null,
    Remarks_Evidence: r.Remarks_Evidence || ''
  };
}

// â”€â”€ Google Sheets API Adapters with Multi-Source Fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchJSON(url, opts) {
  const res = await fetch(url, opts || {});
  if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching ' + url.substring(0, 60));
  return await res.json();
}

function raceWithTimeout(promise, ms, fallbackValue) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallbackValue), ms))
  ]);
}

async function fetchFullFromAppsScript(timeoutMs) {
  const start = Date.now();
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
  try {
    const opts = { headers: { Accept: 'application/json' } };
    if (ac) opts.signal = ac.signal;
    const data = await fetchJSON(APPS_SCRIPT_URL, opts);
    clearTimeout(timer);
    const records = (Array.isArray(data) ? data : (Array.isArray(data.records) ? data.records : [])).map(normalizeRecord);
    const wl = data.whitelist || {};
    const whitelist = {
      users: Array.isArray(wl.users) ? wl.users : [],
      domains: Array.isArray(wl.domains) ? wl.domains : [],
      pending: Array.isArray(wl.pending) ? wl.pending : []
    };
    console.log('[GAS] Fetched ' + records.length + ' records in ' + (Date.now() - start) + 'ms');
    return { ok: true, records, whitelist, source: 'gas' };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e.message, source: 'gas' };
  }
}

async function fetchFullFromLocalAPI() {
  try {
    const [recordsRaw, wlRaw] = await Promise.all([
      fetchJSON('/api/records').catch(() => null),
      fetchJSON('/api/whitelist').catch(() => null)
    ]);
    if (recordsRaw) {
      const records = recordsRaw.map(normalizeRecord);
      const whitelist = wlRaw ? {
        users: Array.isArray(wlRaw.users) ? wlRaw.users : [],
        domains: Array.isArray(wlRaw.domains) ? wlRaw.domains : [],
        pending: Array.isArray(wlRaw.pending) ? wlRaw.pending : []
      } : { users: [], domains: [], pending: [] };
      return { ok: true, records, whitelist, source: 'local-api' };
    }
  } catch (_) {}
  return { ok: false, error: 'local-api unavailable', source: 'local-api' };
}

async function fetchFullFromJSONFile() {
  try {
    const recordsRaw = await fetchJSON('forestry_data.json');
    const records = (Array.isArray(recordsRaw) ? recordsRaw : (recordsRaw && recordsRaw.records ? recordsRaw.records : [])).map(normalizeRecord);
    const DEFAULT_WHITELIST = {
      users: [
        { email: 'admin@wwf.org', name: 'WWF Admin', role: 'admin', addedAt: '2024-01-01' },
        { email: 'field.officer@wwf.org', name: 'KP Field Officer', role: 'editor', addedAt: '2024-01-15' },
        { email: 'mne.manager@wwf.org', name: 'M&E Coordinator', role: 'editor', addedAt: '2024-02-01' },
        { email: 'tayyab@wwf.org', name: 'Tayyab - Project Lead', role: 'editor', addedAt: '2024-02-10' },
        { email: 'viewer@wwf.org', name: 'Observer Viewer', role: 'viewer', addedAt: '2024-03-01' }
      ],
      domains: [
        { domain: 'wwf.org', role: 'editor', addedAt: '2024-01-01' },
        { domain: 'wwfpak.org', role: 'editor', addedAt: '2024-01-01' },
        { domain: 'wwf-pakistan.org', role: 'editor', addedAt: '2024-01-01' },
        { domain: 'panda.org', role: 'viewer', addedAt: '2024-01-01' }
      ],
      pending: []
    };
    return { ok: true, records, whitelist: DEFAULT_WHITELIST, source: 'json-file' };
  } catch (e) {
    return { ok: false, error: e.message, source: 'json-file' };
  }
}

// Save records back (always use bulk saveRecords â€” GAS & local API both support it)
async function saveAllRecords() {
  const normalized = records.map(normalizeRecord);
  // Fire & forget with parallel backends for reliability
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveRecords', records: normalized })
    }).catch(() => {});
  } catch (_) {}
  try {
    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    }).catch(() => {});
  } catch (_) {}
}

async function apiPost(action, payload = {}) {
  // Normalize legacy missing actions to bulk record-based saves
  if (action === 'addRecord' || action === 'updateRecord') {
    const rec = payload.record;
    if (rec) {
      if (action === 'addRecord') records.push(normalizeRecord(rec));
      else {
        const idx = records.findIndex(r => r.Record_ID === Number(rec.Record_ID));
        if (idx >= 0) records[idx] = normalizeRecord(rec);
      }
      saveAllRecords();
    }
    return { success: true };
  }
  if (action === 'deleteRecord') {
    const id = Number(payload.recordId);
    records = records.filter(r => r.Record_ID !== id);
    saveAllRecords();
    return { success: true };
  }
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    }).catch(() => {});
  } catch (_) {}
  try {
    if (action === 'saveRecords' && payload.records) {
      fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.records.map(normalizeRecord))
      }).catch(() => {});
    }
  } catch (_) {}
  return { success: true };
}

// â”€â”€ Composite Type Parser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function parseCompositeType(str) {
  const result = {
    Intervention_Category: '',
    Intervention_Code: '',
    Intervention_Name: '',
    Intervention_Description: '',
    parsed: false
  };
  if (!str) return result;
  const s = String(str).trim();
  const codeMatch = s.match(/^([A-Z]-[0-9]+)\.\s*/);
  let afterCode = s;
  if (codeMatch) {
    result.Intervention_Code = codeMatch[1];
    afterCode = s.slice(codeMatch[0].length);
  }
  const dashIdx = afterCode.indexOf(' â€” ');
  if (dashIdx >= 0) {
    result.Intervention_Name = afterCode.slice(0, dashIdx).trim();
    result.Intervention_Description = afterCode.slice(dashIdx + 3).trim();
  } else {
    result.Intervention_Name = afterCode.trim();
    result.Intervention_Description = '';
  }
  if (codeMatch) {
    const catItem = CATALOG.find(c => c.code === result.Intervention_Code);
    if (catItem) {
      result.Intervention_Category = catItem.cat;
    } else {
      const letter = result.Intervention_Code.charAt(0);
      const catMap = {
        'A': 'A. AFFORESTATION, REFORESTATION AND REVEGETATION',
        'B': 'B. RANGELAND AND GRASSLAND MANAGEMENT',
        'C': 'C. WATERSHED MANAGEMENT AND FLOOD-CONTROL MEASURES',
        'D': 'D. OTHER FORESTRY-RELATED MEASURES'
      };
      result.Intervention_Category = catMap[letter] || '';
    }
    result.parsed = true;
  } else {
    const nameLower = result.Intervention_Name.toLowerCase();
    const fallback = CATALOG.find(c => c.name.toLowerCase() === nameLower);
    if (fallback) {
      result.Intervention_Code = fallback.code;
      result.Intervention_Category = fallback.cat;
      if (!result.Intervention_Description) result.Intervention_Description = fallback.desc;
      result.parsed = true;
    }
  }
  return result;
}

// â”€â”€ Long â†’ Wide Transformation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function recordsToWide(recs, activeTab) {
  const filtered = activeTab ? recs.filter(r => (r.Tab_Name || '').trim() === activeTab.trim()) : recs;
  const groupMap = new Map();
  filtered.forEach(r => {
    const key = [
      r.Practice || '',
      r.Project_Name || '',
      r.Intervention_Category || '',
      r.Intervention_Code || '',
      r.Intervention_Name || '',
      r.Intervention_Description || '',
      r.Remarks_Evidence || ''
    ].join('|||');
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        Practice: r.Practice || '',
        Project_Name: r.Project_Name || '',
        Intervention_Category: r.Intervention_Category || '',
        Intervention_Code: r.Intervention_Code || '',
        Intervention_Name: r.Intervention_Name || '',
        Intervention_Description: r.Intervention_Description || '',
        Remarks_Evidence: r.Remarks_Evidence || '',
        years: {}
      });
    }
    const group = groupMap.get(key);
    group.years[r.Year] = {
      Plants_Count: r.Plants_Count,
      Area_Covered_ha: r.Area_Covered_ha,
      Survival_Rate_pct: r.Survival_Rate_pct
    };
  });
  const wideRows = [];
  groupMap.forEach(g => {
    const compType = g.Intervention_Code
      ? `${g.Intervention_Code}. ${g.Intervention_Name}${g.Intervention_Description ? ' â€” ' + g.Intervention_Description : ''}`
      : `${g.Intervention_Name}${g.Intervention_Description ? ' â€” ' + g.Intervention_Description : ''}`;
    const row = {
      Practice: g.Practice,
      Project_Name: g.Project_Name,
      Intervention_Category: g.Intervention_Category,
      Intervention_Code: g.Intervention_Code,
      Intervention_Name: g.Intervention_Name,
      Intervention_Description: g.Intervention_Description,
      compositeType: compType,
      Remarks_Evidence: g.Remarks_Evidence,
      _rawGroup: g
    };
    YEAR_RANGE.forEach(y => {
      const yd = g.years[y] || {};
      row['p_' + y] = yd.Plants_Count != null ? yd.Plants_Count : '';
      row['a_' + y] = yd.Area_Covered_ha != null ? yd.Area_Covered_ha : '';
      row['s_' + y] = yd.Survival_Rate_pct != null ? yd.Survival_Rate_pct : '';
    });
    wideRows.push(row);
  });
  wideRows.sort((a, b) => {
    const ca = (a.Intervention_Category || '').charAt(0);
    const cb = (b.Intervention_Category || '').charAt(0);
    if (ca !== cb) return ca.localeCompare(cb);
    if (a.Intervention_Code !== b.Intervention_Code) return (a.Intervention_Code || '').localeCompare(b.Intervention_Code || '');
    return (a.Project_Name || '').localeCompare(b.Project_Name || '');
  });
  return wideRows;
}

// â”€â”€ Wide â†’ Long Transformation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function wideToRecords(wideRows, tabName) {
  const out = [];
  wideRows.forEach(row => {
    const parsed = parseCompositeType(row.compositeType || '');
    YEAR_RANGE.forEach(y => {
      const pv = row['p_' + y];
      const av = row['a_' + y];
      const sv = row['s_' + y];
      const hasAny = (pv != null && pv !== '') || (av != null && av !== '') || (sv != null && sv !== '');
      if (!hasAny) return;
      out.push({
        Record_ID: null,
        Practice: row.Practice || '',
        Tab_Name: tabName || '',
        Project_Name: row.Project_Name || '',
        Intervention_Category: parsed.Intervention_Category || row.Intervention_Category || '',
        Intervention_Code: parsed.Intervention_Code || row.Intervention_Code || '',
        Intervention_Name: parsed.Intervention_Name || row.Intervention_Name || '',
        Intervention_Description: parsed.Intervention_Description || row.Intervention_Description || '',
        Year: y,
        Plants_Count: (pv != null && pv !== '') ? Number(pv) : null,
        Area_Covered_ha: (av != null && av !== '') ? Number(av) : null,
        Survival_Rate_pct: (sv != null && sv !== '') ? Number(sv) : null,
        Remarks_Evidence: row.Remarks_Evidence || ''
      });
    });
  });
  return out;
}

// â”€â”€ Confirmation Modal Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openConfirm({ title='Confirm Action', message='Are you sure?', okText='Confirm', okClass='bg-rose-600 hover:bg-rose-700', extraHTML='', onOk }) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').innerHTML = message;
  document.getElementById('confirm-extra').innerHTML = extraHTML || '';
  const okBtn = document.getElementById('confirm-ok-btn');
  okBtn.textContent = okText;
  okBtn.className = `px-5 py-2 text-xs font-bold text-white rounded-xl shadow transition ${okClass}`;
  pendingConfirmCallback = onOk;
  document.getElementById('confirm-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeConfirm(result) {
  document.getElementById('confirm-modal').classList.add('hidden');
  const cb = pendingConfirmCallback;
  pendingConfirmCallback = null;
  if (result && cb) cb();
}

// â”€â”€ Toggle Collapsible Observation Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function toggleTableExpand() {
  isTableExpanded = !isTableExpanded;
  const wrapper = document.getElementById('table-collapsible-wrapper');
  const txt = document.getElementById('table-toggle-text');
  const btn = document.getElementById('table-toggle-btn');
  const icon = document.getElementById('table-toggle-icon');
  if (isTableExpanded) {
    wrapper.classList.remove('hidden');
    txt.textContent = 'Collapse Observation Records';
    icon.setAttribute('data-lucide', 'chevron-up');
    btn.className = 'inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-700 text-white hover:bg-slate-800 shadow-sm transition';
  } else {
    wrapper.classList.add('hidden');
    txt.textContent = 'Expand Observation Records';
    icon.setAttribute('data-lucide', 'chevron-down');
    btn.className = 'inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-800 text-white hover:bg-brand-900 shadow-sm transition';
  }
  if (window.lucide) lucide.createIcons();
}

// â”€â”€ Page & View Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showLoginPage() {
  document.documentElement.classList.remove('user-logged-in');
  document.getElementById('login-page').classList.remove('page-hidden');
  document.getElementById('dashboard-page').classList.add('page-hidden');
}

function showDashboardPage() {
  document.documentElement.classList.add('user-logged-in');
  document.getElementById('login-page').classList.add('page-hidden');
  document.getElementById('dashboard-page').classList.remove('page-hidden');
}

function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const main = document.getElementById('app-main');
  const toggle = document.getElementById('sidebar-toggle');
  const collapsed = sidebar.classList.toggle('sidebar-collapsed');
  main.classList.toggle('sidebar-main-collapsed', collapsed);
  toggle.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  toggle.innerHTML = `<i data-lucide="panel-left-${collapsed ? 'open' : 'close'}" class="w-4 h-4"></i>`;
  localStorage.setItem('wwf_sidebar_collapsed', collapsed ? '1' : '0');
  if (window.lucide) lucide.createIcons();
}

function restoreSidebarState() {
  if (localStorage.getItem('wwf_sidebar_collapsed') === '0') toggleSidebar();
}

function switchNav(nav) {
  activeNav = nav;
  const dBtn = document.getElementById('nav-dashboard');
  const dB2 = document.getElementById('nav-data');
  const dView = document.getElementById('dashboard-view');
  const dataP = document.getElementById('data-page');
  const pgT = document.getElementById('page-title');
  const pgS = document.getElementById('page-subtitle');

  if (nav === 'dashboard') {
    dBtn.className = 'nav-link-luxury active w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition bg-white/10 text-white shadow-inner';
    dB2.className = 'nav-link-luxury w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition hover:bg-white/10 text-white/80';
    dView.classList.remove('page-hidden');
    dataP.classList.add('page-hidden');
    pgT.textContent = 'Forestry Dashboard';
    pgS.textContent = '2023â€“2026 Interventions Â· Interactive Reporting & Filtering';
  } else {
    dB2.className = 'nav-link-luxury active w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition bg-white/10 text-white shadow-inner';
    dBtn.className = 'nav-link-luxury w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition hover:bg-white/10 text-white/80';
    dView.classList.add('page-hidden');
    dataP.classList.remove('page-hidden');
    pgT.textContent = 'Project Worksheets';
    pgS.textContent = 'Multi-year reporting table (2023â€“2026) with inline editing';
    renderDataPage();
  }
  if (window.lucide) lucide.createIcons();
}

// â”€â”€ Login Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function switchLoginTab(tab) {
  ['email','admin'].forEach(t => {
    document.getElementById('login-tab-'+t).classList.toggle('hidden', t!==tab);
    const btn = document.getElementById('login-tab-'+t+'-btn');
    if (t===tab) {
      btn.className='flex-1 py-2.5 rounded-xl bg-white shadow-sm text-slate-800 font-bold transition';
    } else {
      btn.className='flex-1 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition';
    }
  });
  document.getElementById('login-error-alert').classList.add('hidden');
}

function showLoginError(msg, showCTA=false) {
  const el = document.getElementById('login-error-alert');
  document.getElementById('login-error-text').textContent = msg;
  document.getElementById('login-request-cta').classList.toggle('hidden', !showCTA);
  el.classList.remove('hidden');
}

// â”€â”€ Auth Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function isEmailInWhitelist(email) {
  const e = email.toLowerCase().trim();
  const user = whitelist.users.find(u => u.email && u.email.toLowerCase()===e);
  if (user) return { found:true, role: user.role, name: user.name };
  const domain = e.split('@')[1];
  const dom = whitelist.domains.find(d => d.domain && d.domain.toLowerCase()===domain);
  if (dom) return { found:true, role: dom.role, name: email };
  return { found:false };
}

async function doEmailLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  if (!email || !email.includes('@')) { showLoginError('Please enter a valid email address.'); return; }
  document.getElementById('email-login-spinner').classList.remove('hidden');
  document.getElementById('login-error-alert').classList.add('hidden');
  const check = isEmailInWhitelist(email);
  document.getElementById('email-login-spinner').classList.add('hidden');
  if (check.found) {
    loginSuccess(email, check.role, check.name||email);
  } else {
    showLoginError(`"${email}" is not found in the Google Sheet Whitelist. You may request access below.`, true);
  }
}

async function doAdminLogin() {
  const email = document.getElementById('admin-email').value.trim().toLowerCase();
  const password = document.getElementById('admin-password').value;
  document.getElementById('login-error-alert').classList.add('hidden');
  if (!email) { showLoginError('Please enter Admin Email.'); return; }
  if (!password) { showLoginError('Please enter Admin Password.'); return; }
  if (password !== ADMIN_PASSWORD) { showLoginError('Incorrect Admin Password.'); return; }
  const user = whitelist.users.find(u => u.email && u.email.toLowerCase()===email && u.role==='admin');
  if (user) {
    loginSuccess(email, 'admin', user.name||'WWF Administrator');
  } else {
    showLoginError(`"${email}" is not registered as an Administrator in your Google Sheet Whitelist.`);
  }
}

function loginSuccess(email, role, name) {
  currentUser = { email, role, name: name||email };
  localStorage.setItem('wwf_logged_user', JSON.stringify(currentUser));
  document.documentElement.classList.add('user-logged-in');
  showToast(`Welcome back, ${name||email}. Role: ${role.toUpperCase()}`, 'success');
  syncHeaderUI();
  showDashboardPage();
  renderDashboard();
  if (activeNav === 'data') renderDataPage();
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('wwf_logged_user');
  document.documentElement.classList.remove('user-logged-in');
  showLoginPage();
  showToast('Session ended. See you soon.', 'info');
}

function syncHeaderUI() {
  if (!currentUser) return;
  document.getElementById('hdr-email').textContent = currentUser.email;
  const roleEl = document.getElementById('hdr-role');
  roleEl.textContent = currentUser.role.toUpperCase();
  const roleColors = { admin:'bg-amber-500 text-white', editor:'bg-emerald-600 text-white', viewer:'bg-blue-600 text-white' };
  roleEl.className = 'text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block mt-0.5 ' + (roleColors[currentUser.role]||'bg-slate-500 text-white');
  document.getElementById('admin-wl-btn').classList.toggle('hidden', currentUser.role!=='admin');

  document.getElementById('sidebar-email').textContent = currentUser.email;
  const sRole = document.getElementById('sidebar-role');
  sRole.textContent = currentUser.role.toUpperCase();
  sRole.className = 'inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md ' + (roleColors[currentUser.role]||'bg-slate-500 text-white');
  const initial = (currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase();
  document.getElementById('sidebar-user-initial').textContent = initial;
}

async function handleRequestAccess() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  if (!email || !email.includes('@')) { showLoginError('Enter your email above first, then click Request Access.'); return; }
  const existing = whitelist.pending.find(p => p.email===email);
  if (existing) { showToast('Access already requested. Please wait for administrator approval.', 'info'); return; }
  try {
    await apiPost('requestAccess', { email });
    whitelist.pending.push({ email, requestedAt: new Date().toISOString().slice(0,10), status:'pending' });
    updatePendingBadge();
    showToast('Access requested! Recorded in Google Sheets PendingRequests tab.', 'success');
    document.getElementById('login-error-alert').classList.add('hidden');
  } catch(e) {
    showToast('Error requesting access: '+e.message, 'error');
  }
}

// â”€â”€ Google Sheets Data Loader (Fast: Cache â†’ Race â†’ Fallback Chain) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//   Priority: localStorage (0ms) â†’ parallel race (local-API vs GAS vs JSON)
//   Speed target: <200ms with cache, <2s with local server, GAS in background
async function loadAllFromGoogleSheet() {
  const statusBadge = document.getElementById('login-status-badge');

  function applyData(recs, wl, sourceLabel) {
    if (Array.isArray(recs) && recs.length) {
      records = recs.map(normalizeRecord);
    }
    if (wl) {
      whitelist.users   = Array.isArray(wl.users) ? wl.users : [];
      whitelist.domains = Array.isArray(wl.domains) ? wl.domains : [];
      whitelist.pending = Array.isArray(wl.pending) ? wl.pending : [];
      updatePendingBadge();
    }
    const tabs = getProjectTabs();
    const tabSel = document.getElementById('tab-select');
    if (tabSel) {
      const current = tabSel.value;
      tabSel.innerHTML = '<option value="ALL">All Project Tabs</option>' + tabs.map(t => `<option value="${t.replace(/"/g, '&quot;')}">${t}</option>`).join('');
      if (current && (current === 'ALL' || tabs.includes(current))) tabSel.value = current;
    }
    if (statusBadge) {
      statusBadge.textContent = `${sourceLabel} (${records.length.toLocaleString()} records Â· ${(whitelist.users||[]).length} users)`;
    }
    showSection('data');
    if (currentUser) {
      renderDashboard();
      if (activeNav === 'data') renderDataPage();
    }
  }

  function persistCache() {
    try {
      localStorage.setItem('wwf_cached_dataset', JSON.stringify({ records, whitelist, timestamp: Date.now() }));
    } catch (_) {}
  }

  // 1. INSTANT: localStorage cache (0ms paint)
  let hadCache = false;
  const cachedDataset = localStorage.getItem('wwf_cached_dataset');
  if (cachedDataset) {
    try {
      const parsed = JSON.parse(cachedDataset);
      if (Array.isArray(parsed.records) && parsed.records.length) {
        applyData(parsed.records, parsed.whitelist, 'Cached');
        hadCache = true;
      }
    } catch (_) {}
  }

  if (!hadCache) showSection('loading');

  // 2. PARALLEL RACE: Fastest of (local-API / JSON-file) wins for UI; GAS refreshes in background
  const pLocalAPI = fetchFullFromLocalAPI();
  const pJSON     = fetchFullFromJSONFile();
  const pGAS      = fetchFullFromAppsScript(45000);

  // Quick winner (<500ms) between local API and static JSON file
  const quickRace = Promise.race([
    pLocalAPI,
    pJSON,
    new Promise(resolve => setTimeout(() => resolve({ ok: false }), 800))
  ]);

  let usedQuickWinner = false;
  quickRace.then(quick => {
    if (quick && quick.ok) {
      if (!hadCache || (quick.records && quick.records.length > records.length)) {
        applyData(quick.records, quick.whitelist, quick.source === 'local-api' ? 'Local API' : 'Offline File');
        if (window.lucide) lucide.createIcons();
        persistCache();
        usedQuickWinner = true;
      }
    }
  });

  // 3. GAS result: always sync in (authoritative) and save to cache
  try {
    const gasResult = await pGAS;
    if (gasResult.ok) {
      applyData(gasResult.records, gasResult.whitelist, 'âœ“ Google Sheets Live');
      if (window.lucide) lucide.createIcons();
      persistCache();
      return;
    }
  } catch (err) {
    console.warn('GAS background sync failed:', err);
  }

  // 4. If GAS failed, ensure we at least have local-api data (wait for it if not used yet)
  if (!usedQuickWinner) {
    try {
      const local = await pLocalAPI;
      if (local.ok) {
        applyData(local.records, local.whitelist, 'Local API');
        if (window.lucide) lucide.createIcons();
        persistCache();
        return;
      }
    } catch (_) {}
    try {
      const json = await pJSON;
      if (json.ok) {
        applyData(json.records, json.whitelist, 'Offline File');
        if (window.lucide) lucide.createIcons();
        persistCache();
        return;
      }
    } catch (_) {}
  }

  // All failed
  if (!records.length) {
    showSection('error', 'Could not load data from any source (Google Sheets, Local API, Offline file). Retry or check network.');
    if (statusBadge) statusBadge.textContent = 'âš  Data Unavailable';
  }
}

function showSection(mode, errMsg='') {
  document.getElementById('data-loading-bar').classList.toggle('hidden', mode!=='loading');
  document.getElementById('data-error-bar').classList.toggle('hidden', mode!=='error');
  const sections = ['filter-section','kpi-section','charts-section','insights-section','matrix-section','table-section','hero-summary'];
  sections.forEach(id => document.getElementById(id).classList.toggle('hidden', mode!=='data'));
  if (mode === 'data') setDashboardSubtab(dashboardSubtab);
  if (mode==='error') document.getElementById('data-error-text').textContent = errMsg;
}

function setDashboardSubtab(tab) {
  dashboardSubtab = tab;
  document.querySelectorAll('.dashboard-subtab-btn').forEach(button => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('[data-dashboard-tab]').forEach(section => {
    section.classList.toggle('hidden', section.dataset.dashboardTab !== tab);
  });
  requestAnimationFrame(() => Object.values(charts).forEach(chart => chart && chart.resize()));
}

function updatePendingBadge() {
  const count = (whitelist.pending||[]).length;
  const badge = document.getElementById('pending-badge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count===0);
  }
}

// â”€â”€ Filtering Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getMonitoringStatus(row) {
  const fields = ['Plants_Count', 'Area_Covered_ha', 'Survival_Rate_pct'];
  const available = fields.filter(field => row[field] != null && row[field] !== '').length;
  return available === fields.length ? 'complete' : available === 0 ? 'missing' : 'partial';
}

function getFilteredData() {
  const q    = (document.getElementById('search-input').value||'').toLowerCase();
  const yr   = document.getElementById('year-select').value;
  const prac = document.getElementById('practice-select').value;
  const tab  = document.getElementById('tab-select').value;
  const cat  = document.getElementById('category-select').value;
  const hasFilter = q||yr!=='ALL'||prac!=='ALL'||tab!=='ALL'||cat!=='ALL';
  document.getElementById('active-filter-badge').classList.toggle('hidden', !hasFilter);
  const filtered = records.filter(d => {
    if (yr   !=='ALL' && String(d.Year)!==yr)                                      return false;
    if (prac !=='ALL' && d.Practice!==prac)                                        return false;
    if (tab  !=='ALL' && d.Tab_Name!==tab)                                         return false;
    if (cat  !=='ALL' && d.Intervention_Category!==cat)                            return false;
    if (q && !JSON.stringify(d).toLowerCase().includes(q))                         return false;
    return true;
  });
  const summary = document.getElementById('filter-summary');
  if (summary) summary.textContent = hasFilter ? `Showing ${filtered.length.toLocaleString()} of ${records.length.toLocaleString()} records across the selected filters` : 'Showing the full live portfolio';
  return filtered;
}

// â”€â”€ Animated Counter Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function animateCounter(el, target, suffix='', duration=800) {
  const start = 0;
  const startTime = performance.now();
  const isFloat = String(target).includes('.');
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString('en-US')) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// â”€â”€ Hero Narrative Strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateHeroNarrative(data) {
  const hero = document.getElementById('hero-summary');
  if (!hero) return;
  if (!data.length) {
    hero.classList.add('hidden');
    return;
  }
  const years = ['2023','2024','2025','2026'];
  const yearIndices = years.map((y,i) => data.some(d=>String(d.Year)===y) ? i : -1).filter(i => i >= 0);
  const currentYearIdx = yearIndices.length ? Math.max(...yearIndices) : years.length - 1;
  const currentYear = years[currentYearIdx] || '2026';
  const currentPlants = data.filter(d => String(d.Year)===currentYear).reduce((s,d)=>s+(d.Plants_Count||0),0);
  const priorYear = years[currentYearIdx - 1] || null;
  const priorPlants = priorYear ? data.filter(d => String(d.Year)===priorYear).reduce((s,d)=>s+(d.Plants_Count||0),0) : 0;
  const change = priorPlants ? (((currentPlants - priorPlants) / priorPlants) * 100).toFixed(1) : 0;
  const changeSymbol = change >= 0 ? '+' : '';
  const currentArea = data.filter(d => String(d.Year)===currentYear).reduce((s,d)=>s+(d.Area_Covered_ha||0),0);
  const projects = [...new Set(data.filter(d=>String(d.Year)===currentYear).map(d=>d.Project_Name).filter(Boolean))].length;

  document.getElementById('hero-text').textContent =
    `In ${currentYear}, WWF-Pakistan planted ${currentPlants.toLocaleString('en-US')} seedlings across ${projects} active projects, covering ${currentArea.toLocaleString('en-US',{minimumFractionDigits:1})} hectares of critical habitat.`;
  document.getElementById('hero-year').textContent = currentYear;
  document.getElementById('hero-change').textContent = `${changeSymbol}${change}%`;
  hero.classList.remove('hidden');
}

// â”€â”€ Render KPI Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateKPIs(data) {
  const plants   = data.reduce((s,d)=>s+(d.Plants_Count||0),0);
  const area     = data.reduce((s,d)=>s+(d.Area_Covered_ha||0),0);
  const survArr  = data.filter(d=>d.Survival_Rate_pct!=null && d.Survival_Rate_pct!=='').map(d=>{
    const n = Number(d.Survival_Rate_pct);
    return (n > 0 && n <= 1) ? n * 100 : n;
  });
  const avgSurv  = survArr.length ? (survArr.reduce((a,b)=>a+b,0)/survArr.length).toFixed(1) : null;

  const plantsEl = document.getElementById('kpi-plants');
  const areaEl = document.getElementById('kpi-area');
  const survEl = document.getElementById('kpi-survival');
  const recEl = document.getElementById('kpi-records');

  if (plantsEl) {
    animateCounter(plantsEl, plants, '', 900);
    document.getElementById('kpi-plants-sub').textContent = `${data.filter(d=>d.Plants_Count).length} rows with plant count`;
    const maxPlants = Math.max(plants, 1);
    const bar = document.getElementById('kpi-plants-bar');
    if (bar) bar.style.width = Math.min((plants / (records.reduce((s,d)=>s+(d.Plants_Count||0),0) || 1)) * 100, 100) + '%';
  }
  if (areaEl) {
    animateCounter(areaEl, area, '', 900);
    document.getElementById('kpi-area-sub').textContent = `${data.filter(d=>d.Area_Covered_ha).length} rows with area data`;
    const maxArea = Math.max(area, 1);
    const totalArea = records.reduce((s,d)=>s+(d.Area_Covered_ha||0),0);
    const bar = document.getElementById('kpi-area-bar');
    if (bar) bar.style.width = Math.min((area / (totalArea || 1)) * 100, 100) + '%';
  }
  if (survEl) {
    survEl.textContent = avgSurv!=null ? avgSurv+'%' : 'N/A';
    document.getElementById('kpi-survival-sub').textContent = `avg across ${survArr.length} monitored rows`;
    const bar = document.getElementById('kpi-survival-bar');
    if (bar) bar.style.width = avgSurv ? Math.min(Number(avgSurv), 100) + '%' : '0%';
  }
  if (recEl) {
    animateCounter(recEl, data.length, '', 900);
    document.getElementById('kpi-records-sub').textContent = `of ${records.length} total live records`;
    const bar = document.getElementById('kpi-records-bar');
    if (bar) bar.style.width = Math.min((data.length / Math.max(records.length,1)) * 100, 100) + '%';
  }
}

// â”€â”€ Render Charts (Luxury Dark Theming) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateCharts(data) {
  const years = ['2023','2024','2025','2026'];
  const plantsByYear = years.map(y => data.filter(d => String(d.Year)===y).reduce((s,d) => s + (d.Plants_Count||0), 0));

  // Chart.js luxury defaults
  const luxuryTooltip = {
    backgroundColor: 'rgba(6,33,21,0.92)',
    padding: 14,
    cornerRadius: 12,
    borderColor: 'rgba(197,160,89,0.3)',
    borderWidth: 1,
    titleFont: { family: 'Inter', size: 12, weight: '600' },
    bodyFont: { family: 'Inter', size: 11 },
    titleColor: '#e8c48a',
    bodyColor: '#ffffff',
    displayColors: true,
    boxPadding: 4,
  };

  if (charts.year) charts.year.destroy();
  charts.year = new Chart(document.getElementById('chart-year'), {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Plants Planted',
        data: plantsByYear,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.height, 0, 0);
          gradient.addColorStop(0, 'rgba(23,86,58,0.3)');
          gradient.addColorStop(1, 'rgba(23,86,58,0.9)');
          return gradient;
        },
        hoverBackgroundColor: '#15803d',
        borderRadius: 10,
        barThickness: 40,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: luxuryTooltip,
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: {
            color: '#64748b',
            font: { family: 'Inter', size: 10 },
            callback: v => v >= 1e6 ? v/1e6+'M' : v >= 1e3 ? v/1e3+'K' : v
          },
          border: { display: false }
        }
      }
    }
  });

  const practices = [...new Set(records.map(d => d.Practice).filter(Boolean))];
  const areaByPrac = practices.map(p => data.filter(d => d.Practice===p).reduce((s,d) => s + (d.Area_Covered_ha||0), 0));
  const colors = ['#17563A','#0284c7','#f59e0b','#10b981','#6366f1','#64748b'];

  if (charts.practice) charts.practice.destroy();
  charts.practice = new Chart(document.getElementById('chart-practice'), {
    type: 'doughnut',
    data: {
      labels: practices,
      datasets: [{
        data: areaByPrac,
        backgroundColor: colors.slice(0, practices.length),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: { size: 11, family: 'Inter' },
            color: '#475569',
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 8,
          }
        },
        tooltip: luxuryTooltip,
      }
    }
  });

  const tabs = getProjectTabs();
  const plantsByTab = tabs.map(tb => data.filter(d => (d.Tab_Name || '').trim()===tb).reduce((s,d) => s + (d.Plants_Count||0), 0));

  if (charts.province) charts.province.destroy();
  charts.province = new Chart(document.getElementById('chart-province'), {
    type: 'bar',
    data: {
      labels: tabs.map(p => p.length > 18 ? p.slice(0,16)+'â€¦' : p),
      datasets: [{
        label: 'Plants Count',
        data: plantsByTab,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, ctx.chart.width, 0);
          gradient.addColorStop(0, 'rgba(2,132,199,0.7)');
          gradient.addColorStop(1, 'rgba(2,132,199,0.3)');
          return gradient;
        },
        hoverBackgroundColor: '#0369a1',
        borderRadius: 8,
        barThickness: 22,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: luxuryTooltip,
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 }, callback: v => v >= 1e3 ? v/1e3+'K' : v },
          border: { display: false }
        },
        y: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#475569', font: { family: 'Inter', size: 10 } },
          border: { display: false }
        }
      }
    }
  });

  const categories = [
    'A. AFFORESTATION, REFORESTATION AND REVEGETATION',
    'B. RANGELAND AND GRASSLAND MANAGEMENT',
    'C. WATERSHED MANAGEMENT AND FLOOD-CONTROL MEASURES',
    'D. OTHER FORESTRY-RELATED MEASURES'
  ];
  const shortCats = ['A. Afforestation', 'B. Rangeland', 'C. Watershed', 'D. Other'];
  const survByCategory = categories.map(cat => {
    const rows = data.filter(d => d.Intervention_Category === cat && d.Survival_Rate_pct != null && d.Survival_Rate_pct !== '');
    if (!rows.length) return 0;
    const avg = rows.reduce((s,d) => {
      const n = Number(d.Survival_Rate_pct);
      return s + ((n > 0 && n <= 1) ? n * 100 : n);
    }, 0) / rows.length;
    return Number(avg.toFixed(1));
  });

  if (charts.category) charts.category.destroy();
  charts.category = new Chart(document.getElementById('chart-category'), {
    type: 'bar',
    data: {
      labels: shortCats,
      datasets: [{
        label: 'Avg Survival (%)',
        data: survByCategory,
        backgroundColor: ['rgba(23,86,58,0.8)','rgba(245,158,11,0.8)','rgba(2,132,199,0.8)','rgba(16,185,129,0.8)'],
        borderRadius: 10,
        barThickness: 36,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: luxuryTooltip,
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#475569', font: { family: 'Inter', size: 10 } },
          border: { display: false }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 }, callback: v => v + '%' },
          border: { display: false }
        }
      }
    }
  });

  const areaByYear = years.map(y => data.filter(d => String(d.Year)===y).reduce((s,d) => s + (Number(d.Area_Covered_ha)||0), 0));
  const interventionCounts = [...new Set(data.map(d => d.Intervention_Name).filter(Boolean))].map(name => ({ name, count: data.filter(d => d.Intervention_Name===name).length })).sort((a,b) => b.count-a.count).slice(0, 10);
  const statusCounts = ['complete','partial','missing'].map(status => data.filter(row => getMonitoringStatus(row)===status).length);
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: luxuryTooltip,
    }
  };
  Object.keys({areaTrend:1, quality:1, intervention:1}).forEach(key => { if (charts[key]) charts[key].destroy(); });
  charts.areaTrend = new Chart(document.getElementById('chart-area-trend'), {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Area covered',
        data: areaByYear,
        borderColor: '#6ee7b7',
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          gradient.addColorStop(0, 'rgba(52,211,153,0.25)');
          gradient.addColorStop(1, 'rgba(52,211,153,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#d1fae5',
        pointBorderColor: '#10b981',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, callback: value => value >= 1000 ? value/1000+'K' : value },
          border: { display: false }
        }
      }
    }
  });
  charts.quality = new Chart(document.getElementById('chart-quality'), {
    type: 'doughnut',
    data: {
      labels: ['Complete','Partial','Needs monitoring'],
      datasets: [{
        data: statusCounts,
        backgroundColor: ['rgba(16,185,129,0.85)','rgba(245,158,11,0.85)','rgba(244,63,94,0.85)'],
        borderWidth: 3,
        borderColor: '#0f172a',
        hoverOffset: 6,
      }]
    },
    options: {
      ...chartDefaults,
      cutout: '68%',
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false }
      }
    }
  });
  charts.intervention = new Chart(document.getElementById('chart-intervention'), {
    type: 'polarArea',
    data: {
      labels: interventionCounts.map(item => item.name),
      datasets: [{
        data: interventionCounts.map(item => item.count),
        backgroundColor: ['rgba(23,86,58,0.75)','rgba(2,132,199,0.75)','rgba(245,158,11,0.75)','rgba(16,185,129,0.75)','rgba(239,68,68,0.75)','rgba(100,116,139,0.75)','rgba(132,204,22,0.75)','rgba(14,165,233,0.75)','rgba(225,29,72,0.75)','rgba(161,98,7,0.75)'],
        borderWidth: 2,
        borderColor: '#0f172a',
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { display: false, backdropColor: 'transparent' },
          grid: { color: 'rgba(148,163,184,0.08)' },
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'right',
          labels: {
            boxWidth: 10,
            font: { size: 10, family: 'Inter' },
            color: '#475569',
            padding: 8,
            usePointStyle: true,
            pointStyleWidth: 8,
          }
        }
      }
    }
  });
  const qualitySummary = document.getElementById('quality-summary');
  if (qualitySummary) qualitySummary.innerHTML = [['Complete',statusCounts[0],'text-emerald-700'],['Partial',statusCounts[1],'text-amber-700'],['Missing',statusCounts[2],'text-rose-700']].map(item => `<div><div class="text-base font-extrabold ${item[2]}">${item[1]}</div><div class="text-[10px] font-bold uppercase tracking-wide text-slate-400">${item[0]}</div></div>`).join('');
}

// â”€â”€ Render Category Performance Matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateCategoryMatrix(data) {
  const cats = [
    'A. AFFORESTATION, REFORESTATION AND REVEGETATION',
    'B. RANGELAND AND GRASSLAND MANAGEMENT',
    'C. WATERSHED MANAGEMENT AND FLOOD-CONTROL MEASURES',
    'D. OTHER FORESTRY-RELATED MEASURES'
  ];
  const short = ['A. Afforestation & Revegetation', 'B. Rangeland & Grassland', 'C. Watershed Management', 'D. Other Measures'];
  const tbody = document.getElementById('category-matrix-body');
  tbody.innerHTML = '';
  let tp=0, ta=0, tss=0, tsc=0, tr=0;

  cats.forEach((cat,i) => {
     const rows = data.filter(d=>d.Intervention_Category===cat);
     const p = rows.reduce((s,d)=>s+(d.Plants_Count||0),0);
     const a = rows.reduce((s,d)=>s+(d.Area_Covered_ha||0),0);
     const sa = rows.filter(d=>d.Survival_Rate_pct!=null && d.Survival_Rate_pct!=='');
     const ss = sa.reduce((s,d)=>{
       const n = Number(d.Survival_Rate_pct);
       return s + ((n > 0 && n <= 1) ? n * 100 : n);
     },0);
     tp += p; ta += a; tss += ss; tsc += sa.length; tr += rows.length;
     const avg = sa.length ? (ss/sa.length).toFixed(1)+'%' : 'â€”';

     tbody.insertAdjacentHTML('beforeend', `
       <tr class="hover:bg-slate-50/80 transition border-l-4 border-l-transparent hover:border-l-gold-500">
         <td class="py-3.5 px-5 font-bold text-slate-800">${short[i]}</td>
         <td class="py-3.5 px-5 text-right font-extrabold text-emerald-700">${numFmt(p)}</td>
         <td class="py-3.5 px-5 text-right font-extrabold text-sky-700">${floatFmt(a)}</td>
         <td class="py-3.5 px-5 text-right font-bold text-slate-700">${avg}</td>
         <td class="py-3.5 px-5 text-center font-semibold text-slate-600">${rows.length}</td>
       </tr>
     `);
   });

  const oa = tsc > 0 ? (tss/tsc).toFixed(1)+'%' : 'â€”';
  document.getElementById('category-matrix-total').innerHTML = `
    <td class="py-3.5 px-5 font-extrabold uppercase tracking-wide">Grand Total</td>
    <td class="py-3.5 px-5 text-right font-extrabold text-emerald-300">${numFmt(tp)}</td>
    <td class="py-3.5 px-5 text-right font-extrabold text-sky-300">${floatFmt(ta)}</td>
    <td class="py-3.5 px-5 text-right font-extrabold text-amber-300">${oa}</td>
    <td class="py-3.5 px-5 text-center font-extrabold">${tr}</td>
  `;
}

// â”€â”€ Render Observation Table (Long Format) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateTable(data) {
  const tbody = document.getElementById('data-table-body');
  tbody.innerHTML = '';
  document.getElementById('table-row-count').textContent = `Displaying ${data.length} of ${records.length} records`;
  const canEdit = currentUser && currentUser.role !== 'viewer';

  data.forEach((d,i) => {
    let survBadge = '<span class="text-slate-300">â€”</span>';
    if (d.Survival_Rate_pct!=null && d.Survival_Rate_pct!=='') {
      const raw = Number(d.Survival_Rate_pct);
      const pct = (raw > 0 && raw <= 1) ? raw * 100 : raw;
      const cls = pct>=80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : pct>=70 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300';
      survBadge = `<span class="px-2 py-0.5 text-[11px] font-bold rounded-md border ${cls}">${pct.toFixed(1)}%</span>`;
    }

    const actions = canEdit
      ? `<div class="flex items-center justify-center gap-1">
           <button onclick="openEditModal(${d.Record_ID})" class="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition" title="Edit"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
           <button onclick="deleteRecord(${d.Record_ID})" class="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 transition" title="Delete"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
         </div>`
      : '<span class="text-slate-300 text-center block">â€”</span>';

    const tr = document.createElement('tr');
    tr.className = 'border-l-4 border-l-transparent hover:border-l-gold-500 hover:bg-emerald-50/40 transition';
    tr.innerHTML = `
      <td class="py-3 px-3.5 font-mono text-slate-400 text-[11px]">#${d.Record_ID}</td>
      <td class="py-3 px-3.5 font-extrabold text-brand-800">${d.Intervention_Code||'â€”'}</td>
      <td class="py-3 px-3.5 font-medium text-slate-800 max-w-xs truncate" title="${(d.Intervention_Description||'').replace(/"/g,"'")}">${d.Intervention_Name||'â€”'}</td>
      <td class="py-3 px-3.5"><span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700">${d.Practice||'â€”'}</span></td>
      <td class="py-3 px-3.5 text-slate-600 font-medium">${d.Tab_Name||'â€”'}</td>
      <td class="py-3 px-3.5 text-slate-600 max-w-xs truncate" title="${(d.Project_Name||'').replace(/"/g,"'")}">${d.Project_Name||'â€”'}</td>
      <td class="py-3 px-3.5 text-center font-bold text-slate-800">${d.Year}</td>
      <td class="py-3 px-3.5 text-right font-extrabold text-emerald-700">${numFmt(d.Plants_Count)}</td>
      <td class="py-3 px-3.5 text-right font-extrabold text-sky-700">${floatFmt(d.Area_Covered_ha)}</td>
      <td class="py-3 px-3.5 text-right">${survBadge}</td>
      <td class="py-3 px-3.5 text-slate-500 max-w-sm truncate" title="${(d.Remarks_Evidence||'').replace(/"/g,"'")}">${d.Remarks_Evidence||'â€”'}</td>
      <td class="py-3 px-3.5">${actions}</td>
    `;
    tbody.appendChild(tr);
  });
  if (window.lucide) lucide.createIcons();
}

function renderDashboard() {
  const data = getFilteredData();
  updateKPIs(data);
  updateCharts(data);
  updateCategoryMatrix(data);
  updateTable(data);
  updateHeroNarrative(data);
  if (window.lucide) lucide.createIcons();
}

function resetFilters() {
  ['search-input','year-select','practice-select','tab-select','category-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
  });
  renderDashboard();
}

// â”€â”€ Render Project Worksheets (Wide Format) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDataPage() {
  const tabs = getProjectTabs();
  const switcher = document.getElementById('data-tab-switcher');
  const selectedTab = document.getElementById('selected-data-tab');
  
  if (!activeDataTab || !tabs.includes(activeDataTab)) {
    activeDataTab = tabs.length ? tabs[0] : null;
  }
  
  if (selectedTab) selectedTab.textContent = activeDataTab || 'No project selected';

  switcher.innerHTML = tabs.map(t => {
    const isActive = t === activeDataTab;
    const count = records.filter(r => (r.Tab_Name || '').trim() === t).length;
    return `
      <button onclick="selectDataTab('${t.replace(/'/g,"\\'")}')"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition whitespace-nowrap shrink-0 ${
          isActive
            ? 'bg-brand-800 text-white border-brand-800 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200 hover:border-brand-800 hover:text-brand-800'
        }">
        <span>${t}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 font-semibold'}">${count}</span>
      </button>
    `;
  }).join('');

  const empty = document.getElementById('data-page-empty');
  const controls = document.getElementById('wide-table-controls');
  const wrapper = document.getElementById('wide-table-wrapper');
  const addRow = document.getElementById('add-row-wrapper');

  if (!activeDataTab) {
    empty.classList.remove('hidden');
    controls.classList.add('page-hidden');
    wrapper.classList.add('page-hidden');
    addRow.classList.add('page-hidden');
    return;
  }

  empty.classList.add('hidden');
  controls.classList.remove('page-hidden');
  wrapper.classList.remove('page-hidden');
  addRow.classList.remove('page-hidden');

  wideCurrentRows = recordsToWide(records, activeDataTab);
  renderWideTableBody();
  if (window.lucide) lucide.createIcons();
}

function selectDataTab(tab) {
  activeDataTab = tab;
  isWideEditMode = false;
  wideSearchQuery = '';
  const searchInput = document.getElementById('wide-search-input');
  if (searchInput) searchInput.value = '';
  document.getElementById('wide-save-btn').classList.add('hidden');
  document.getElementById('wide-edit-toggle-btn').innerHTML = `<i data-lucide="edit-3" class="w-3.5 h-3.5"></i><span>Edit Entire Tab</span>`;
  renderDataPage();
}

function toggleWideEditMode() {
  if (!currentUser || currentUser.role === 'viewer') { showToast('Editor or Admin access required.','error'); return; }
  isWideEditMode = !isWideEditMode;
  const toggleBtn = document.getElementById('wide-edit-toggle-btn');
  const saveBtn = document.getElementById('wide-save-btn');
  if (isWideEditMode) {
    toggleBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gold-600 text-white hover:bg-gold-700 shadow-sm transition';
    toggleBtn.innerHTML = `<i data-lucide="x-circle" class="w-3.5 h-3.5"></i><span>Cancel Edit</span>`;
    saveBtn.classList.remove('hidden');
  } else {
    toggleBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-700 text-white hover:bg-slate-800 shadow-sm transition';
    toggleBtn.innerHTML = `<i data-lucide="edit-3" class="w-3.5 h-3.5"></i><span>Edit Entire Tab</span>`;
    saveBtn.classList.add('hidden');
  }
  renderWideTableBody();
  if (window.lucide) lucide.createIcons();
}

let wideSearchQuery = '';

function filterWideTable(q) {
  wideSearchQuery = (q || '').toLowerCase().trim();
  renderWideTableBody();
}

function renderWideTableBody() {
  const tbody = document.getElementById('wide-table-body');
  tbody.innerHTML = '';
  let lastCat = null;
  const canEdit = currentUser && currentUser.role !== 'viewer';

  let filteredRows = wideCurrentRows;
  if (wideSearchQuery) {
    filteredRows = wideCurrentRows.filter(r => {
      const p = (r.Practice || '').toLowerCase();
      const pr = (r.Project_Name || '').toLowerCase();
      const comp = (r.compositeType || '').toLowerCase();
      const rem = (r.Remarks_Evidence || '').toLowerCase();
      const cat = (r.Intervention_Category || '').toLowerCase();
      return p.includes(wideSearchQuery) || pr.includes(wideSearchQuery) || comp.includes(wideSearchQuery) || rem.includes(wideSearchQuery) || cat.includes(wideSearchQuery);
    });
  }

  if (filteredRows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="17" class="py-12 text-center text-slate-400 text-xs font-medium bg-white">
      <div class="flex flex-col items-center justify-center gap-1.5">
        <i data-lucide="search-x" class="w-6 h-6 text-slate-300"></i>
        <span>${wideSearchQuery ? `No interventions matching "${wideSearchQuery}" in this worksheet.` : 'No intervention records found in this worksheet.'}</span>
      </div>
    </td>`;
    tbody.appendChild(tr);
    renderWideFooter(filteredRows);
    if (window.lucide) lucide.createIcons();
    return;
  }

  filteredRows.forEach((row, idx) => {
    if (row.Intervention_Category && row.Intervention_Category !== lastCat) {
      const spacer = document.createElement('tr');
      spacer.className = 'category-row cursor-pointer hover:bg-brand-50/50 transition';
      const catSafe = row.Intervention_Category.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const catVal = row.Intervention_Category;
      spacer.onclick = (e) => { if (e.target.closest('button')) return; openCategoryPreview(catVal); };
      spacer.innerHTML = `
        <td colspan="17" class="py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-brand-900 border-b border-slate-200 border-l-4 border-l-brand-800">
          <div class="sticky left-4 inline-flex items-center justify-between gap-2 w-full pr-2">
            <div class="inline-flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-brand-800 shrink-0"></span>
              <span class="truncate">${row.Intervention_Category}</span>
            </div>
            <button onclick="event.stopPropagation(); openCategoryPreview('${catSafe}')"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-[10px] font-bold shadow-sm transition shrink-0"
              title="Preview & download this category">
              <i data-lucide="eye" class="w-3 h-3"></i>
              <span>Preview</span>
            </button>
          </div>
        </td>`;
      tbody.appendChild(spacer);
      lastCat = row.Intervention_Category;
    }
    const tr = document.createElement('tr');
    tr.className = 'border-l-4 border-l-transparent hover:border-l-gold-500 hover:bg-emerald-50/40 transition';
    if (!isWideEditMode) {
      tr.classList.add('cursor-pointer');
      tr.onclick = (e) => { if (e.target.closest('button, input, textarea, select')) return; openRowPreview(idx); };
    }
    if (row._isNew) tr.classList.add('bg-amber-50/70');

    const newBadge = row._isNew ? `<span class="ml-1 px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md bg-amber-200 text-amber-900 align-middle">New Row</span>` : '';

    const cell = (content, cls='') => `<td class="py-2.5 px-3 align-middle border-r border-slate-100 ${cls}">${content}</td>`;
    const survBadge = val => {
      if (val == null || val === '') return '<span class="text-slate-300">â€”</span>';
      const raw = Number(val);
      const pct = (raw > 0 && raw <= 1) ? raw * 100 : raw;
      const cls = pct>=80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : pct>=70 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300';
      return `<span class="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md border ${cls}">${pct.toFixed(1)}%</span>`;
    };

    const numCell = (val, cls='') => cell(`<div class="text-right font-extrabold ${cls}">${numFmt(val)}</div>`);
    const inputNum = (field, val, step='1', min='') => {
      let displayVal = val == null || val === '' ? '' : val;
      if (field.startsWith('s_') && displayVal !== '') {
        const sn = Number(displayVal);
        displayVal = (sn > 0 && sn <= 1) ? (sn * 100).toFixed(1) : sn;
      }
      return `<input type="number" data-field="${field}" step="${step}" ${min!==''?`min="${min}"`:''} value="${displayVal}" class="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white" oninput="updateWideRowFromInput(${idx}, this)">`;
    };
    const inputText = (field, val, textarea=false) => textarea
      ? `<textarea data-field="${field}" rows="2" class="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono bg-white" oninput="updateWideRowFromInput(${idx}, this)">${val||''}</textarea>`
      : `<input type="text" data-field="${field}" value="${val==null?'':String(val).replace(/"/g,'&quot;')}" class="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white" oninput="updateWideRowFromInput(${idx}, this)">`;
    const inputSel = (field, val) => `<select data-field="${field}" class="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white" onchange="updateWideRowFromInput(${idx}, this)"><option${val==='Forests'?' selected':''}>Forests</option><option${val==='Freshwater'?' selected':''}>Freshwater</option><option${val==='Food'?' selected':''}>Food</option><option${val==='Marine'?' selected':''}>Marine</option></select>`;

    let c1, c2, c3;
    if (isWideEditMode) {
      c1 = cell(inputSel('Practice', row.Practice));
      c2 = cell(inputText('Project_Name', row.Project_Name));
      c3 = cell(inputText('compositeType', row.compositeType, true) + newBadge, '');
    } else {
      c1 = cell(`<span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">${row.Practice||'â€”'}</span>`);
      c2 = cell(`<div class="font-medium text-slate-800 max-w-[190px] truncate" title="${(row.Project_Name||'').replace(/"/g,"'")}">${row.Project_Name||'â€”'}</div>`);
      const tt = (row.compositeType||'').replace(/"/g,"'");
      c3 = cell(`<div class="max-w-[320px]"><div class="font-mono text-[11px] text-slate-700 leading-snug truncate" title="${tt}">${row.compositeType||'<span class="text-slate-300">â€”</span>'}</div>${newBadge}</div>`);
    }

    const yearCells = [];
    YEAR_RANGE.forEach(y => {
      if (isWideEditMode) {
        yearCells.push(cell(inputNum(`p_${y}`, row['p_'+y], '1', '0')));
        yearCells.push(cell(inputNum(`a_${y}`, row['a_'+y], '0.1', '0')));
        yearCells.push(cell(inputNum(`s_${y}`, row['s_'+y], '0.1', '0')));
      } else {
        yearCells.push(numCell(row['p_'+y], 'text-emerald-700'));
        yearCells.push(numCell(row['a_'+y], 'text-sky-700'));
        yearCells.push(cell(`<div class="text-right">${survBadge(row['s_'+y])}</div>`));
      }
    });

    let c16;
    if (isWideEditMode) {
      c16 = cell(inputText('Remarks_Evidence', row.Remarks_Evidence, true));
    } else {
      const re = (row.Remarks_Evidence||'').replace(/"/g,"'");
      c16 = cell(`<div class="text-slate-500 max-w-[240px] truncate text-[11px]" title="${re}">${row.Remarks_Evidence||'<span class="text-slate-300">â€”</span>'}</div>`);
    }

    let actions;
    if (canEdit) {
      actions = `
        <div class="flex items-center justify-center gap-1">
          <button onclick="event.stopPropagation(); openRowPreview(${idx})" class="p-1.5 text-brand-700 hover:text-brand-900 rounded-lg hover:bg-brand-50 transition" title="Preview & download card"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>
          <button onclick="event.stopPropagation(); openWideEditModal(${idx})" class="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition" title="Edit row modal"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
          <button onclick="event.stopPropagation(); deleteWideRow(${idx})" class="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 transition" title="Delete row"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
      `;
    } else {
      actions = `
        <div class="flex items-center justify-center gap-1">
          <button onclick="event.stopPropagation(); openRowPreview(${idx})" class="p-1.5 text-brand-700 hover:text-brand-900 rounded-lg hover:bg-brand-50 transition" title="Preview & download card"><i data-lucide="eye" class="w-3.5 h-3.5"></i></button>
        </div>
      `;
    }
    const c17 = cell(actions, 'text-center bg-slate-50/40 w-20');

    tr.innerHTML = c1 + c2 + c3 + yearCells.join('') + c16 + c17;
    tbody.appendChild(tr);
  });

  renderWideFooter(filteredRows);
}

function renderWideFooter(rows) {
  const targetRows = rows || wideCurrentRows;
  const footer = document.getElementById('wide-table-footer');
  const totals = {};
  YEAR_RANGE.forEach(y => {
    totals['p_'+y] = 0;
    totals['a_'+y] = 0;
  });
  targetRows.forEach(r => {
    YEAR_RANGE.forEach(y => {
      if (r['p_'+y] != null && r['p_'+y] !== '') totals['p_'+y] += Number(r['p_'+y]) || 0;
      if (r['a_'+y] != null && r['a_'+y] !== '') totals['a_'+y] += Number(r['a_'+y]) || 0;
    });
  });

  let html = `<tr>
    <td class="py-3 px-3.5 text-left font-extrabold uppercase tracking-wide border-r border-slate-700 bg-slate-900 text-white">Grand Totals</td>
    <td class="py-3 px-3.5 text-left font-semibold border-r border-slate-700 bg-slate-900 text-slate-400 text-[11px]">All Projects</td>
    <td class="py-3 px-3.5 text-left font-mono font-bold border-r border-slate-700 bg-slate-900 text-emerald-400 text-[11px]">${targetRows.length} Interventions</td>`;

  YEAR_RANGE.forEach(y => {
    const survRows = targetRows.filter(r => r['s_'+y] != null && r['s_'+y] !== '');
    let avgSurvHtml = '<span class="text-slate-500">â€”</span>';
    if (survRows.length > 0) {
      const sum = survRows.reduce((s, r) => {
        const raw = Number(r['s_'+y]);
        return s + ((raw > 0 && raw <= 1) ? raw * 100 : raw);
      }, 0);
      const avg = sum / survRows.length;
      const cls = avg >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : avg >= 70 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      avgSurvHtml = `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded border ${cls}">${avg.toFixed(1)}%</span>`;
    }

    html += `<td class="py-3 px-3 text-right font-extrabold text-emerald-300 border-r border-slate-700 bg-slate-900">${numFmt(totals['p_'+y]||0)}</td>`;
    html += `<td class="py-3 px-3 text-right font-extrabold text-sky-300 border-r border-slate-700 bg-slate-900">${floatFmt(totals['a_'+y]||0)}</td>`;
    html += `<td class="py-3 px-3 text-right border-r border-slate-700 bg-slate-900">${avgSurvHtml}</td>`;
  });

  html += `<td class="py-3 px-3 border-r border-slate-700 bg-slate-900"></td><td class="py-3 px-3 text-center bg-slate-950 text-slate-500 text-[10px] font-semibold">Summary</td></tr>`;
  footer.innerHTML = html;
}

function updateWideRowFromInput(idx, el) {
  if (!wideCurrentRows[idx]) return;
  const field = el.dataset.field;
  if (!field) return;
  if (el.tagName === 'INPUT' && el.type === 'number') {
    let val = el.value === '' ? '' : Number(el.value);
    if (field.startsWith('s_') && val !== '' && val > 1) {
      val = val / 100;
    }
    wideCurrentRows[idx][field] = val;
  } else {
    wideCurrentRows[idx][field] = el.value;
  }
  renderWideFooter();
}

function openWideEditModal(idx) {
  if (!currentUser || currentUser.role === 'viewer') { showToast('Editor or Admin access required.','error'); return; }
  const row = wideCurrentRows[idx];
  if (!row) return;
  document.getElementById('wide-edit-row-index').value = idx;
  document.getElementById('wide-edit-practice').value = row.Practice || 'Forests';
  document.getElementById('wide-edit-tab').value = activeDataTab || '';
  document.getElementById('wide-edit-project').value = row.Project_Name || '';
  document.getElementById('wide-edit-type').value = row.compositeType || '';
  YEAR_RANGE.forEach(y => {
    document.getElementById(`wide-edit-p${String(y).slice(-2)}`).value = row['p_'+y] != null && row['p_'+y] !== '' ? row['p_'+y] : '';
    document.getElementById(`wide-edit-a${String(y).slice(-2)}`).value = row['a_'+y] != null && row['a_'+y] !== '' ? row['a_'+y] : '';
    const sv = row['s_'+y];
    let displaySv = '';
    if (sv != null && sv !== '') {
      const n = Number(sv);
      displaySv = (n > 0 && n <= 1) ? (n * 100).toFixed(1) : String(n);
    }
    document.getElementById(`wide-edit-s${String(y).slice(-2)}`).value = displaySv;
  });
  document.getElementById('wide-edit-remarks').value = row.Remarks_Evidence || '';
  document.getElementById('wide-edit-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeWideEditModal() { document.getElementById('wide-edit-modal').classList.add('hidden'); }

// â”€â”€ Preview Card (Row & Category) & Download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _pSurvBadge(val) {
  if (val == null || val === '') return '<span class="text-slate-400 font-medium">â€”</span>';
  const raw = Number(val);
  const pct = (raw > 0 && raw <= 1) ? raw * 100 : raw;
  const cls = pct>=80 ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : pct>=70 ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-rose-100 text-rose-800 border-rose-200';
  return `<span class="inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${cls}">${pct.toFixed(1)}%</span>`;
}
function _pPracticeBadge(p) {
  const map = {
    Forests:    ['bg-emerald-100','text-emerald-800','border-emerald-200'],
    Freshwater: ['bg-sky-100',    'text-sky-800',    'border-sky-200'],
    Food:       ['bg-amber-100',  'text-amber-800',  'border-amber-200'],
    Marine:     ['bg-teal-100',   'text-teal-800',   'border-teal-200'],
  };
  const [bg,tx,bd] = map[p] || ['bg-slate-100','text-slate-700','border-slate-200'];
  return `<span class="inline-flex items-center px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${bg} ${tx} ${bd}">${p||'â€”'}</span>`;
}
function _pYearCard(y, p, a, s) {
  return `
    <div class="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/80 p-4 shadow-sm">
      <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">${y} Reporting</div>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <div class="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">Plants</div>
          <div class="text-lg font-extrabold text-emerald-700">${numFmt(p)}</div>
        </div>
        <div class="text-center border-l border-r border-slate-100">
          <div class="text-[9px] font-bold uppercase tracking-wider text-sky-700 mb-0.5">ha</div>
          <div class="text-lg font-extrabold text-sky-700">${floatFmt(a)}</div>
        </div>
        <div class="text-center">
          <div class="text-[9px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">Surv</div>
          <div class="pt-0.5">${_pSurvBadge(s)}</div>
        </div>
      </div>
    </div>`;
}

function openRowPreview(idx) {
  if (idx == null || !wideCurrentRows[idx]) { showToast('Row not found.','error'); return; }
  const row = wideCurrentRows[idx];
  previewMode = 'row';
  const code = (row.Intervention_Code || '').trim();
  const name = (row.Intervention_Name || '').trim();
  const desc = (row.Intervention_Description || '').trim();
  const titleText = code ? `${code}  ${name || row.Project_Name || 'Intervention'}` : (row.Project_Name || 'Intervention Record');
  previewMeta = { title: titleText, subtitle: row.Project_Name || activeDataTab || '' };
  document.getElementById('preview-title-text').textContent = titleText;

  const remarks = (row.Remarks_Evidence || '').trim();
  const yearsHtml = YEAR_RANGE.map(y => _pYearCard(y, row['p_'+y], row['a_'+y], row['s_'+y])).join('');

  // Totals for card
  const tPlants = YEAR_RANGE.reduce((s,y)=>s+(Number(row['p_'+y])||0),0);
  const tArea   = YEAR_RANGE.reduce((s,y)=>s+(Number(row['a_'+y])||0),0);
  const survAll = YEAR_RANGE.map(y=>row['s_'+y]).filter(v=>v!=null&&v!=='');
  const avgSurv = survAll.length
    ? survAll.reduce((s,v)=>{ const r=Number(v); return s+((r>0&&r<=1)?r*100:r); },0)/survAll.length
    : null;

  const content = `
    <div class="px-0 pt-6 pb-0">
      <!-- Luxury hero header -->
      <div class="relative px-8 pb-8 mb-0 border-b border-slate-100">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-800 via-gold-500 to-brand-800"></div>
        <div class="absolute -top-6 -right-6 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div class="space-y-2">
            ${_pPracticeBadge(row.Practice)}
            <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
              ${(row.Project_Name||'').replace(/</g,'&lt;')||'<span class="text-slate-400">Untitled Project</span>'}
            </h2>
            <p class="text-xs text-slate-500 font-medium">${(activeDataTab?activeDataTab+' Â· ':'')}WWF-Pakistan Forestry Intervention</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white flex items-center justify-center shadow-lg border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="m5 12 7-7 7 7"/></svg>
            </div>
          </div>
        </div>

        <!-- Intervention block -->
        <div class="relative bg-gradient-to-r from-slate-950 via-brand-900 to-slate-950 rounded-2xl p-5 text-white overflow-hidden border border-white/10 shadow-inner">
          <div class="absolute inset-0 opacity-40 pointer-events-none" style="background-image: radial-gradient(circle at 90% 20%, rgba(197,160,89,0.18), transparent 45%), radial-gradient(circle at 10% 80%, rgba(34,197,94,0.12), transparent 50%);"></div>
          <div class="relative">
            <div class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold-300/80 mb-1.5">Type of Intervention</div>
            ${code?`<div class="inline-flex items-center gap-2 mb-2"><span class="px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30">${code.replace(/</g,'&lt;')}</span></div>`:''}
            <h3 class="text-base font-bold text-white mb-1.5 font-display">${(name||'').replace(/</g,'&lt;')||'<span class="text-white/60">â€”</span>'}</h3>
            ${desc?`<p class="text-xs text-white/75 leading-relaxed">${desc.replace(/</g,'&lt;')}</p>`:''}
            ${(row.Intervention_Category||'')?`<div class="mt-3 pt-3 border-t border-white/10 text-[10px] font-semibold uppercase tracking-wider text-white/55">${(row.Intervention_Category).replace(/</g,'&lt;')}</div>`:''}
          </div>
        </div>
      </div>

      <!-- Impact KPIs strip -->
      <div class="px-8 py-5 bg-gradient-to-b from-slate-50/50 to-white border-b border-slate-100">
        <div class="grid grid-cols-4 gap-3">
          <div class="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1">Total Plants</div>
            <div class="text-2xl font-extrabold text-emerald-800">${numFmt(tPlants)}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-sky-50 border border-sky-100">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-sky-700 mb-1">Area (ha)</div>
            <div class="text-2xl font-extrabold text-sky-800">${floatFmt(tArea)}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 mb-1">Avg Survival</div>
            <div class="text-2xl font-extrabold text-amber-800">${avgSurv!=null?avgSurv.toFixed(1)+'%':'â€”'}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-purple-50 border border-purple-100">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-purple-700 mb-1">Reporting</div>
            <div class="text-2xl font-extrabold text-purple-800">${YEAR_RANGE.length}y</div>
          </div>
        </div>
      </div>

      <!-- Year cards grid -->
      <div class="px-8 py-6">
        <div class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-3">Multi-year Monitoring</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${yearsHtml}
        </div>
      </div>

      <!-- Remarks -->
      ${remarks?`
      <div class="px-8 pb-8">
        <div class="rounded-2xl border border-gold-200/60 bg-gradient-to-br from-amber-50/80 to-white p-5 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-gold-700 mb-2 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Remarks &amp; Evidence
          </div>
          <p class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">${remarks.replace(/</g,'&lt;')}</p>
        </div>
      </div>`:`<div class="px-8 pb-8"></div>`}

      <!-- Footer brand strip -->
      <div class="px-8 py-4 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 text-white/80 flex items-center justify-between border-t border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="m5 12 7-7 7 7"/></svg>
          </div>
          <div>
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-white">WWF-Pakistan</div>
            <div class="text-[9px] text-white/50 font-medium">Forestry Interventions Portal</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] font-extrabold text-gold-300">2023 â€“ 2026</div>
          <div class="text-[9px] text-white/50 font-medium">Generated ${new Date().toLocaleDateString('en-PK')}</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('preview-card-content').innerHTML = content;
  document.getElementById('preview-card-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function openCategoryPreview(catName) {
  if (!catName || !wideCurrentRows.length) { showToast('Category data not available.','error'); return; }
  const rows = wideCurrentRows.filter(r => (r.Intervention_Category || '') === catName);
  if (!rows.length) { showToast('No rows found for this category.','warning'); return; }
  previewMode = 'category';
  previewMeta = { title: catName, subtitle: `${rows.length} intervention${rows.length!==1?'s':''}` };
  document.getElementById('preview-title-text').textContent = catName;

  // Aggregate totals
  let tPlants = 0, tArea = 0, survVals = [];
  YEAR_RANGE.forEach(y => {
    rows.forEach(r => {
      tPlants += Number(r['p_'+y]) || 0;
      tArea   += Number(r['a_'+y]) || 0;
      if (r['s_'+y] != null && r['s_'+y] !== '') {
        const raw = Number(r['s_'+y]);
        survVals.push((raw > 0 && raw <= 1) ? raw * 100 : raw);
      }
    });
  });
  const avgSurv = survVals.length ? survVals.reduce((s,v)=>s+v,0)/survVals.length : null;

  // Category short code (e.g. "A")
  const catLetter = (catName.match(/^([A-Z])\./) || [])[1] || '';

  // Build per-intervention rows
  const rowsHtml = rows.map((row, i) => {
    const code = (row.Intervention_Code || '').trim();
    const name = (row.Intervention_Name || '').trim() || (row.compositeType || '').split('\n')[0] || 'Untitled';
    const yPlants = YEAR_RANGE.reduce((s,y)=>s+(Number(row['p_'+y])||0),0);
    const yArea   = YEAR_RANGE.reduce((s,y)=>s+(Number(row['a_'+y])||0),0);
    const rs = YEAR_RANGE.map(y=>row['s_'+y]).filter(v=>v!=null&&v!=='');
    const ra = rs.length ? rs.reduce((s,v)=>{const r=Number(v);return s+((r>0&&r<=1)?r*100:r);},0)/rs.length : null;
    const borderTop = i ? 'border-t border-slate-100' : '';
    return `
      <div class="px-6 py-4 ${borderTop} hover:bg-emerald-50/30 transition">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              ${code?`<span class="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-brand-50 text-brand-800 border border-brand-100">${code.replace(/</g,'&lt;')}</span>`:''}
              <span class="text-sm font-bold text-slate-900 truncate">${name.replace(/</g,'&lt;')}</span>
            </div>
            <div class="text-[11px] text-slate-500 truncate">${(row.Project_Name||'').replace(/</g,'&lt;')||activeDataTab||''}</div>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <div class="text-right">
              <div class="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Plants</div>
              <div class="text-sm font-extrabold text-emerald-700">${numFmt(yPlants)}</div>
            </div>
            <div class="text-right">
              <div class="text-[9px] font-bold uppercase tracking-wider text-sky-700">ha</div>
              <div class="text-sm font-extrabold text-sky-700">${floatFmt(yArea)}</div>
            </div>
            <div class="text-right min-w-[58px]">
              <div class="text-[9px] font-bold uppercase tracking-wider text-amber-700">Surv</div>
              <div class="pt-0.5">${ra!=null?_pSurvBadge(ra/100):'<span class="text-slate-400 text-xs">â€”</span>'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <div class="px-0 pt-6 pb-0">
      <!-- Category hero -->
      <div class="relative px-8 pb-7 mb-0 border-b border-slate-100 overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-800 via-gold-500 to-brand-800"></div>
        <div class="absolute -top-10 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative flex items-start gap-4 mb-5">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 text-white flex items-center justify-center shadow-xl border border-white/10 shrink-0">
            <span class="text-3xl font-extrabold font-display text-gold-300">${catLetter}</span>
          </div>
          <div class="flex-1 min-w-0 space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-600">Intervention Category</div>
            <h2 class="text-xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">${catName.replace(/</g,'&lt;')}</h2>
            <p class="text-xs text-slate-500 font-medium">${activeDataTab?activeDataTab+' Â· ':''}${rows.length} intervention${rows.length!==1?'s':''} Â· WWF-Pakistan Forestry Portfolio</p>
          </div>
        </div>

        <!-- Category KPIs -->
        <div class="relative grid grid-cols-4 gap-3">
          <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/70 shadow-sm">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1">Total Plants</div>
            <div class="text-2xl font-extrabold text-emerald-800">${numFmt(tPlants)}</div>
          </div>
          <div class="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-200/70 shadow-sm">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-sky-700 mb-1">Total Area (ha)</div>
            <div class="text-2xl font-extrabold text-sky-800">${floatFmt(tArea)}</div>
          </div>
          <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/70 shadow-sm">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 mb-1">Avg Survival</div>
            <div class="text-2xl font-extrabold text-amber-800">${avgSurv!=null?avgSurv.toFixed(1)+'%':'â€”'}</div>
          </div>
          <div class="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-brand-200/70 shadow-sm">
            <div class="text-[9px] font-extrabold uppercase tracking-wider text-brand-800 mb-1">Interventions</div>
            <div class="text-2xl font-extrabold text-brand-900">${rows.length}</div>
          </div>
        </div>
      </div>

      <!-- Intervention list -->
      <div class="px-0">
        <div class="px-8 pt-5 pb-2">
          <div class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Portfolio Roll-up</div>
        </div>
        <div class="bg-white">
          ${rowsHtml}
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-2 px-8 py-4 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 text-white/80 flex items-center justify-between border-t border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="m5 12 7-7 7 7"/></svg>
          </div>
          <div>
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-white">WWF-Pakistan</div>
            <div class="text-[9px] text-white/50 font-medium">Forestry Interventions Portal</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] font-extrabold text-gold-300">Category Report</div>
          <div class="text-[9px] text-white/50 font-medium">Generated ${new Date().toLocaleDateString('en-PK')}</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('preview-card-content').innerHTML = content;
  document.getElementById('preview-card-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closePreviewModal() {
  document.getElementById('preview-card-modal').classList.add('hidden');
  previewMode = '';
  previewMeta = { title: '', subtitle: '' };
}

async function downloadPreviewAsImage() {
  const card = document.getElementById('preview-card-outer');
  const btn = document.getElementById('preview-download-btn');
  if (!card) { showToast('Preview card not found.','error'); return; }
  const origText = btn.innerHTML;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Renderingâ€¦</span>`;
  btn.disabled = true;
  try {
    const canvas = await html2canvas(card, {
      backgroundColor: '#ffffff',
      scale: window.devicePixelRatio > 1.5 ? 2 : 1.5,
      useCORS: true,
      logging: false,
    });
    const blob = await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.95));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0,10);
    const safeFn = s => (s||'').replace(/[^\w\-]+/g,'_').slice(0,40) || 'preview';
    let fname;
    if (previewMode === 'row') {
      fname = `WWF_Intervention_${safeFn(previewMeta.title)}_${stamp}.png`;
    } else if (previewMode === 'category') {
      fname = `WWF_Category_${safeFn(previewMeta.title)}_${stamp}.png`;
    } else {
      fname = `WWF_Preview_${stamp}.png`;
    }
    a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 5000);
    showToast(`Downloaded ${fname}`,'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to render card image: '+ (e.message||e), 'error');
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  }
}

// Preview modal: ESC close & backdrop close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = document.getElementById('preview-card-modal');
    if (m && !m.classList.contains('hidden')) closePreviewModal();
  }
});
document.addEventListener('click', e => {
  const m = document.getElementById('preview-card-modal');
  if (m && !m.classList.contains('hidden') && e.target === m) closePreviewModal();
});

async function handleWideEditSubmit(e) {
  e.preventDefault();
  if (!currentUser || currentUser.role === 'viewer') return;
  const idx = Number(document.getElementById('wide-edit-row-index').value);
  const oldTab = activeDataTab;
  const newTab = document.getElementById('wide-edit-tab').value.trim();

  const practice = document.getElementById('wide-edit-practice').value;
  const project = document.getElementById('wide-edit-project').value;
  const composite = document.getElementById('wide-edit-type').value;
  const parsed = parseCompositeType(composite);

  const riskChecks = [];
  if (!parsed.parsed) riskChecks.push({ type:'parse', msg:'Intervention type could not be parsed into a standard code prefix (e.g. A-1).' });
  YEAR_RANGE.forEach(y => {
    const s = document.getElementById(`wide-edit-s${String(y).slice(-2)}`).value;
    if (s !== '' && s != null) {
      const sn = Number(s);
      if (sn < 0 || sn > 100) riskChecks.push({ type:'survival', msg:`20${String(y).slice(-2)} Survival rate ${sn}% is outside 0-100%.` });
    }
  });
  if (oldTab && newTab && oldTab !== newTab) riskChecks.push({ type:'tabrename', oldTab, newTab });

  const proceed = () => doWideEditSave(idx, practice, newTab, project, composite, parsed);
  if (riskChecks.length) {
    let msg = '<ul class="list-disc list-inside space-y-1 text-xs">';
    let extra = '';
    const hasRename = riskChecks.some(r => r.type === 'tabrename');
    riskChecks.forEach(r => {
      if (r.type === 'tabrename') return;
      msg += `<li>${r.msg}</li>`;
    });
    msg += '</ul>';
    if (hasRename) {
      const r = riskChecks.find(r => r.type === 'tabrename');
      extra = `<div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
        <div class="text-xs font-bold text-amber-900">Rename tab from "${r.oldTab}" to "${r.newTab}"?</div>
        <label class="flex items-center gap-2 text-xs"><input type="radio" name="tabrename_opt" value="cascade" checked class="rounded"> Cascade rename across all rows in this tab</label>
        <label class="flex items-center gap-2 text-xs"><input type="radio" name="tabrename_opt" value="only" class="rounded"> Only this row</label>
      </div>`;
    }
    openConfirm({
      title: 'Risk Warning â€” Proceed with Save?',
      message: msg || 'Proceed with saving?',
      extraHTML: extra,
      okText: 'Save Anyway',
      okClass: 'bg-amber-600 hover:bg-amber-700',
      onOk: () => {
        const renameOpt = document.querySelector('input[name="tabrename_opt"]:checked')?.value || 'cascade';
        doWideEditSave(idx, practice, newTab, project, composite, parsed, renameOpt);
      }
    });
  } else {
    proceed();
  }
}

async function doWideEditSave(idx, practice, newTab, project, composite, parsed, renameOpt='cascade') {
  const oldRow = wideCurrentRows[idx];
  const newRow = { ...oldRow };
  newRow.Practice = practice;
  newRow.Project_Name = project;
  newRow.compositeType = composite;
  newRow.Intervention_Category = parsed.Intervention_Category || newRow.Intervention_Category;
  newRow.Intervention_Code = parsed.Intervention_Code || newRow.Intervention_Code;
  newRow.Intervention_Name = parsed.Intervention_Name || newRow.Intervention_Name;
  newRow.Intervention_Description = parsed.Intervention_Description || newRow.Intervention_Description;
  YEAR_RANGE.forEach(y => {
    const pv = document.getElementById(`wide-edit-p${String(y).slice(-2)}`).value;
    const av = document.getElementById(`wide-edit-a${String(y).slice(-2)}`).value;
    const sv = document.getElementById(`wide-edit-s${String(y).slice(-2)}`).value;
    newRow['p_'+y] = pv !== '' ? Number(pv) : '';
    newRow['a_'+y] = av !== '' ? Number(av) : '';
    let svVal = '';
    if (sv !== '' && sv != null) {
      const sn = Number(sv);
      svVal = (sn > 1) ? sn / 100 : sn;
    }
    newRow['s_'+y] = svVal !== '' ? Number(svVal) : '';
  });
  newRow.Remarks_Evidence = document.getElementById('wide-edit-remarks').value;
  delete newRow._isNew;
  wideCurrentRows[idx] = newRow;
  closeWideEditModal();
  await commitWideToRecords(newTab, renameOpt);
}

async function commitWideToRecords(overrideTab, renameOpt='cascade') {
  const tabForRows = overrideTab || activeDataTab;
  const longRows = wideToRecords(wideCurrentRows.filter(r => !(r._isNew && YEAR_RANGE.every(y => (r['p_'+y] == null || r['p_'+y] === '') && (r['a_'+y] == null || r['a_'+y] === '') && (r['s_'+y] == null || r['s_'+y] === '')))), tabForRows);

  if (overrideTab && overrideTab !== activeDataTab && renameOpt === 'cascade') {
    records = records.map(r => (r.Tab_Name || '').trim() === activeDataTab ? { ...r, Tab_Name: overrideTab } : r);
  } else {
    records = records.filter(r => (r.Tab_Name || '').trim() !== activeDataTab);
  }
  let nextId = Math.max(0, ...records.map(r => r.Record_ID || 0));
  const merged = [...records];
  longRows.forEach(lr => {
    const match = merged.find(r =>
      r.Tab_Name === lr.Tab_Name && r.Practice === lr.Practice && r.Project_Name === lr.Project_Name &&
      r.Intervention_Code === lr.Intervention_Code && r.Intervention_Name === lr.Intervention_Name &&
      r.Year === lr.Year);
    if (match) {
      Object.assign(match, lr);
    } else {
      nextId += 1;
      merged.push({ ...lr, Record_ID: nextId });
    }
  });
  merged.forEach((r, i) => { if (r.Record_ID == null) r.Record_ID = i + 1; });
  records = merged;

  // Save to Google Sheets
  try {
    // Sync via POST action: saveRecords or addRecord
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveRecords', records: records })
    });
    showToast('Worksheet changes saved to Google Sheets.', 'success');
  } catch(e) {
    showToast('Error saving: ' + e.message, 'error');
  }

  if (overrideTab && overrideTab !== activeDataTab && renameOpt === 'cascade') {
    activeDataTab = overrideTab;
  }
  isWideEditMode = false;
  document.getElementById('wide-save-btn').classList.add('hidden');
  const toggleBtn = document.getElementById('wide-edit-toggle-btn');
  toggleBtn.className = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-700 text-white hover:bg-slate-800 shadow-sm transition';
  toggleBtn.innerHTML = `<i data-lucide="edit-3" class="w-3.5 h-3.5"></i><span>Edit Entire Tab</span>`;
  renderDataPage();
  renderDashboard();
}

function addWideRow() {
  if (!currentUser || currentUser.role === 'viewer') { showToast('Editor or Admin access required.','error'); return; }
  wideSearchQuery = '';
  const searchInput = document.getElementById('wide-search-input');
  if (searchInput) searchInput.value = '';

  const newRow = {
    Practice: 'Forests',
    Project_Name: '',
    Intervention_Category: '',
    Intervention_Code: '',
    Intervention_Name: '',
    Intervention_Description: '',
    compositeType: '',
    Remarks_Evidence: '',
    _isNew: true
  };
  YEAR_RANGE.forEach(y => { newRow['p_'+y]=''; newRow['a_'+y]=''; newRow['s_'+y]=''; });
  wideCurrentRows.push(newRow);
  isWideEditMode = true;
  document.getElementById('wide-edit-toggle-btn').className = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gold-600 text-white hover:bg-gold-700 shadow-sm transition';
  document.getElementById('wide-edit-toggle-btn').innerHTML = `<i data-lucide="x-circle" class="w-3.5 h-3.5"></i><span>Cancel Edit</span>`;
  document.getElementById('wide-save-btn').classList.remove('hidden');
  renderWideTableBody();
  if (window.lucide) lucide.createIcons();
}

function deleteWideRow(idx) {
  if (!currentUser || currentUser.role === 'viewer') { showToast('Editor or Admin access required.','error'); return; }
  const row = wideCurrentRows[idx];
  if (!row) return;
  openConfirm({
    title: 'Delete Intervention Row',
    message: `Are you sure you want to delete this intervention row across all years (2023â€“2026)?`,
    okText: 'Delete Row',
    okClass: 'bg-rose-600 hover:bg-rose-700',
    onOk: async () => {
      wideCurrentRows.splice(idx, 1);
      await commitWideToRecords(activeDataTab);
      showToast('Intervention row deleted.', 'info');
    }
  });
}

async function saveWideTabChanges() {
  if (!currentUser || currentUser.role === 'viewer') { showToast('Editor or Admin access required.','error'); return; }
  const risks = [];
  let maxPlants = 0, maxArea = 0;
  const tabRecs = records.filter(r => r.Tab_Name === activeDataTab);
  tabRecs.forEach(r => {
    if (r.Plants_Count != null) maxPlants = Math.max(maxPlants, Number(r.Plants_Count));
    if (r.Area_Covered_ha != null) maxArea = Math.max(maxArea, Number(r.Area_Covered_ha));
  });

  wideCurrentRows.forEach(row => {
    const p = parseCompositeType(row.compositeType);
    if (!p.parsed && (row.compositeType || '').trim()) risks.push({type:'parse', row:row.compositeType});
    YEAR_RANGE.forEach(y => {
      const sv = row['s_'+y];
      if (sv != null && sv !== '') {
        const n = Number(sv);
        if (n < 0 || n > 100) risks.push({type:'survival', val:n, y});
      }
      const pv = row['p_'+y];
      if (pv != null && pv !== '' && Number(pv) > 10 * maxPlants && maxPlants > 0) risks.push({type:'plants', val:pv, y, max:maxPlants});
      const av = row['a_'+y];
      if (av != null && av !== '' && Number(av) > 10 * maxArea && maxArea > 0) risks.push({type:'area', val:av, y, max:maxArea});
    });
  });

  const doSave = async () => {
    wideCurrentRows = wideCurrentRows.map(r => { const c = {...r}; delete c._isNew; return c; });
    await commitWideToRecords(activeDataTab);
  };

  if (risks.length) {
    let msg = '<p class="mb-2 font-semibold text-slate-800">The following validation anomalies were detected:</p><ul class="list-disc list-inside space-y-1 text-xs">';
    risks.slice(0, 8).forEach(r => {
      if (r.type==='parse') msg += `<li>Unparsed intervention type: <code class="bg-slate-100 px-1 rounded">${String(r.row).slice(0,40)}</code></li>`;
      else if (r.type==='survival') msg += `<li>20${String(r.y).slice(-2)} survival ${r.val}% out of range.</li>`;
      else if (r.type==='plants') msg += `<li>20${String(r.y).slice(-2)} plants count (${numFmt(r.val)}) is unusually high.</li>`;
      else if (r.type==='area') msg += `<li>20${String(r.y).slice(-2)} area (${floatFmt(r.val)} ha) is unusually high.</li>`;
    });
    if (risks.length > 8) msg += `<li>â€¦and ${risks.length - 8} more anomalies.</li>`;
    msg += '</ul>';
    openConfirm({
      title: 'Validation Anomalies Detected',
      message: msg,
      okText: 'Save Anyway',
      okClass: 'bg-amber-600 hover:bg-amber-700',
      onOk: doSave
    });
  } else {
    await doSave();
  }
}

// â”€â”€ Single Record Modal Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openDataEntryModal() {
  document.getElementById('data-entry-modal').classList.remove('hidden');
  document.getElementById('entry-record-id').value = '';
  document.getElementById('entry-modal-title').textContent = 'New Forestry Record';
  document.getElementById('entry-form').reset();
  const canEdit = currentUser && currentUser.role !== 'viewer';
  document.getElementById('entry-perm-alert').classList.toggle('hidden', canEdit);
  document.getElementById('entry-form').classList.toggle('hidden', !canEdit);
  onCategoryChange();
  if (window.lucide) lucide.createIcons();
}

function openEditModal(id) {
  const rec = records.find(r=>r.Record_ID===id);
  if (!rec) return;
  document.getElementById('data-entry-modal').classList.remove('hidden');
  document.getElementById('entry-record-id').value = id;
  document.getElementById('entry-modal-title').textContent = `Edit Record #${id}`;
  document.getElementById('entry-perm-alert').classList.add('hidden');
  document.getElementById('entry-form').classList.remove('hidden');

  const catEl = document.getElementById('entry-category');
  catEl.value = rec.Intervention_Category;
  onCategoryChange();
  document.getElementById('entry-code').value = rec.Intervention_Code;
  onCodeChange();

  document.getElementById('entry-practice').value  = rec.Practice||'Forests';
  document.getElementById('entry-tab').value       = rec.Tab_Name||'';
  document.getElementById('entry-year').value      = String(rec.Year);
  document.getElementById('entry-project').value   = rec.Project_Name||'';
  document.getElementById('entry-plants').value    = rec.Plants_Count!=null?rec.Plants_Count:'';
  document.getElementById('entry-area').value      = rec.Area_Covered_ha!=null?rec.Area_Covered_ha:'';
  const surv = rec.Survival_Rate_pct;
  document.getElementById('entry-survival').value  = surv!=null ? (surv > 1 ? surv : surv*100) : '';
  document.getElementById('entry-remarks').value   = rec.Remarks_Evidence||'';
  if (window.lucide) lucide.createIcons();
}

function closeDataEntryModal() {
  document.getElementById('data-entry-modal').classList.add('hidden');
}

function onCategoryChange() {
  const cat = document.getElementById('entry-category').value;
  const codes = CATALOG.filter(c=>c.cat===cat);
  const sel = document.getElementById('entry-code');
  sel.innerHTML = codes.map(c=>`<option value="${c.code}">${c.code} â€” ${c.name}</option>`).join('');
  onCodeChange();
}

function onCodeChange() {
  const code = document.getElementById('entry-code').value;
  const item = CATALOG.find(c=>c.code===code);
  if (item) {
    document.getElementById('entry-name-preview').textContent = item.name;
    document.getElementById('entry-desc-preview').textContent = item.desc;
    document.getElementById('entry-practice').value = item.practice;
  }
}

async function handleRecordSubmit(e) {
  e.preventDefault();
  if (!currentUser || currentUser.role==='viewer') return;

  const editId = document.getElementById('entry-record-id').value;
  const survivalRaw = document.getElementById('entry-survival').value;
  const code = document.getElementById('entry-code').value;
  const item = CATALOG.find(c=>c.code===code)||{};
  const newTab = document.getElementById('entry-tab').value;

  const survivalNum = survivalRaw!==''?Number(survivalRaw):null;
  const plantsNum = document.getElementById('entry-plants').value!==''?Number(document.getElementById('entry-plants').value):null;
  const areaNum = document.getElementById('entry-area').value!==''?Number(document.getElementById('entry-area').value):null;

  const newRec = {
    Record_ID        : editId ? Number(editId) : Math.max(0,...records.map(r=>r.Record_ID||0))+1,
    Practice         : document.getElementById('entry-practice').value,
    Tab_Name         : newTab,
    Project_Name     : document.getElementById('entry-project').value,
    Intervention_Category: document.getElementById('entry-category').value,
    Intervention_Code: code,
    Intervention_Name: item.name||'',
    Intervention_Description: item.desc||'',
    Year             : Number(document.getElementById('entry-year').value),
    Plants_Count     : plantsNum,
    Area_Covered_ha  : areaNum,
    Survival_Rate_pct: survivalRaw!==''?Number(survivalRaw):null,
    Remarks_Evidence : document.getElementById('entry-remarks').value||null,
  };

  try {
    const actionType = editId ? 'updateRecord' : 'addRecord';
    if (editId) {
      const idx = records.findIndex(r => r.Record_ID === Number(editId));
      if (idx >= 0) records[idx] = normalizeRecord(newRec);
      showToast(`Record #${editId} updated.`, 'success');
    } else {
      records.push(normalizeRecord(newRec));
      showToast(`Record #${newRec.Record_ID} saved.`, 'success');
    }
    saveAllRecords();
  } catch(err) {
    showToast('Error saving: ' + err.message, 'error');
  }

  closeDataEntryModal();
  renderDashboard();
  if (activeNav === 'data') renderDataPage();
}

async function deleteRecord(id) {
  if (!currentUser || currentUser.role==='viewer') return;
  openConfirm({
    title: `Delete Record #${id}`,
    message: `Are you sure you want to permanently delete record #${id} from Google Sheets?`,
    okText: 'Delete Record',
    okClass: 'bg-rose-600 hover:bg-rose-700',
    onOk: async () => {
      try {
        records = records.filter(r => r.Record_ID !== Number(id));
        saveAllRecords();
        showToast(`Record #${id} deleted.`, 'info');
        renderDashboard();
        if (activeNav === 'data') renderDataPage();
      } catch(err) {
        showToast('Error deleting record: ' + err.message, 'error');
      }
    }
  });
}

function exportToCSV() {
  const data = getFilteredData();
  if (!data.length) { showToast('No data to export.','warning'); return; }
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','),...data.map(row=>headers.map(h=>`"${(row[h]??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`WWF_Forestry_${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

// â”€â”€ New Tab Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openNewTabModal() {
  if (!currentUser || currentUser.role === 'viewer') { showToast('Editor or Admin access required.','error'); return; }
  document.getElementById('new-tab-form').reset();
  document.getElementById('new-tab-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}
function closeNewTabModal() { document.getElementById('new-tab-modal').classList.add('hidden'); }

async function handleNewTabSubmit(e) {
  e.preventDefault();
  if (!currentUser || currentUser.role === 'viewer') return;
  const tabName = document.getElementById('new-tab-name').value.trim();
  const practice = document.getElementById('new-tab-practice').value;
  const project = document.getElementById('new-tab-project').value.trim();
  if (!tabName || !project) { showToast('Tab name and project title are required.','warning'); return; }

  const placeholder = YEAR_RANGE.map(y => ({
    Record_ID: null,
    Practice: practice,
    Tab_Name: tabName,
    Project_Name: project,
    Intervention_Category: '',
    Intervention_Code: '',
    Intervention_Name: '',
    Intervention_Description: '',
    Year: y,
    Plants_Count: null,
    Area_Covered_ha: null,
    Survival_Rate_pct: null,
    Remarks_Evidence: ''
  }));

  try {
    const merged = [...records, ...placeholder];
    let nextId = Math.max(0, ...merged.map(r => r.Record_ID || 0));
    merged.forEach(r => { if (r.Record_ID == null) { nextId += 1; r.Record_ID = nextId; }});
    
    // Save to Google Sheets
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveRecords', records: merged })
    });

    records = merged;
    closeNewTabModal();
    activeDataTab = tabName;
    activeNav = 'data';
    switchNav('data');
    showToast(`Project tab "${tabName}" created with starter rows.`, 'success');
  } catch(e) {
    showToast('Error creating tab: '+e.message, 'error');
  }
}

// â”€â”€ Whitelist Modal Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function openWhitelistModal() {
  if (!currentUser||currentUser.role!=='admin') { showToast('Admin access required.','error'); return; }
  document.getElementById('whitelist-modal').classList.remove('hidden');
  switchWlTab('users');
  renderWlUsers();
  renderWlDomains();
  renderWlPending();
  if (window.lucide) lucide.createIcons();
}
function closeWhitelistModal() { document.getElementById('whitelist-modal').classList.add('hidden'); }

function switchWlTab(tab) {
  ['users','domains','requests'].forEach(t=>{
    document.getElementById('wl-section-'+t).classList.toggle('hidden',t!==tab);
    const btn=document.getElementById('wl-tab-'+t+'-btn');
    if(t===tab) {
      btn.className='px-4 py-2.5 border-b-2 border-brand-800 text-brand-900 font-bold flex items-center gap-1.5 whitespace-nowrap';
    } else {
      btn.className='px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 whitespace-nowrap';
    }
  });
}

function renderWlUsers() {
  const q=(document.getElementById('wl-search').value||'').toLowerCase();
  const list=document.getElementById('wl-users-list');
  const filtered=whitelist.users.filter(u=>!q||(u.email+u.name+u.role).toLowerCase().includes(q));
  document.getElementById('wl-users-count').textContent=whitelist.users.length;
  if(!filtered.length){list.innerHTML='<div class="p-6 text-xs text-slate-400 text-center">No whitelisted users found in Google Sheet. Add rows to Whitelist tab.</div>';return;}
  list.innerHTML=filtered.map(u=>`
    <div class="flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-50/80 transition">
      <div class="flex-1 min-w-0 mr-2">
        <span class="font-bold text-slate-800 block truncate">${u.email}</span>
        <span class="text-slate-400 text-[11px]">${u.name||'â€”'}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${u.role==='admin'?'bg-amber-100 text-amber-800':u.role==='editor'?'bg-emerald-100 text-emerald-800':'bg-blue-100 text-blue-800'}">${u.role}</span>
        <button onclick="wlRemoveUser('${u.email}')" class="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
      </div>
    </div>`).join('');
  if(window.lucide)lucide.createIcons();
}

function renderWlDomains() {
  const list=document.getElementById('wl-domains-list');
  document.getElementById('wl-domains-count').textContent=whitelist.domains.length;
  if(!whitelist.domains.length){list.innerHTML='<div class="p-6 text-xs text-slate-400 text-center">No allowed domains in Google Sheet. Add rows to AllowedDomains tab.</div>';return;}
  list.innerHTML=whitelist.domains.map(d=>`
    <div class="flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-50/80 transition">
      <div><span class="font-bold text-emerald-800 font-mono text-sm">@${d.domain}</span><span class="ml-2 text-slate-400">Default role: <strong>${d.role}</strong></span></div>
      <button onclick="wlRemoveDomain('${d.domain}')" class="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    </div>`).join('');
  if(window.lucide)lucide.createIcons();
}

function renderWlPending() {
  const list=document.getElementById('wl-requests-list');
  document.getElementById('wl-requests-count').textContent=whitelist.pending.length;
  if(!whitelist.pending.length){list.innerHTML='<div class="p-6 text-xs text-slate-400 text-center">No pending requests.</div>';return;}
  list.innerHTML=whitelist.pending.map(p=>`
    <div class="flex items-center justify-between px-4 py-3.5 text-xs hover:bg-slate-50/80 transition">
      <div><span class="font-bold text-slate-800 block">${p.email}</span><span class="text-slate-400 text-[11px]">Requested: ${p.requestedAt||'â€”'}</span></div>
      <div class="flex gap-1.5">
        <button onclick="approvePending('${p.email}','editor')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">âœ“ Editor</button>
        <button onclick="approvePending('${p.email}','viewer')" class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700">âœ“ Viewer</button>
        <button onclick="denyPending('${p.email}')" class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">âœ—</button>
      </div>
    </div>`).join('');
}

async function wlAddUser() {
  const email=(document.getElementById('wl-new-email').value||'').trim().toLowerCase();
  const name=document.getElementById('wl-new-name').value.trim();
  const role=document.getElementById('wl-new-role').value;
  if(!email||!email.includes('@')){showToast('Enter a valid email.','error');return;}
  if(whitelist.users.find(u=>u.email===email)){showToast('User already exists.','warning');return;}
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addUser', email, name, role })
    });
    whitelist.users.push({email,name,role,addedAt:new Date().toISOString().slice(0,10)});
    document.getElementById('wl-new-email').value=''; document.getElementById('wl-new-name').value='';
    renderWlUsers();
    showToast(`${email} added to Google Sheets Whitelist.`, 'success');
  } catch(e) {
    showToast('Error adding user: '+e.message, 'error');
  }
}

async function wlRemoveUser(email) {
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeUser', email })
    });
    whitelist.users=whitelist.users.filter(u=>u.email!==email);
    renderWlUsers();
    showToast(`${email} removed from Google Sheets.`, 'info');
  } catch(e) { showToast('Error removing user: '+e.message, 'error'); }
}

async function wlAddDomain() {
  let domain=(document.getElementById('wl-new-domain').value||'').trim().toLowerCase().replace(/^@/,'');
  const role=document.getElementById('wl-new-domain-role').value;
  if(!domain||!domain.includes('.')){showToast('Enter a valid domain (e.g. wwf.org).','error');return;}
  if(whitelist.domains.find(d=>d.domain===domain)){showToast('Domain already exists.','warning');return;}
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addDomain', domain, role })
    });
    whitelist.domains.push({domain,role,addedAt:new Date().toISOString().slice(0,10)});
    document.getElementById('wl-new-domain').value='';
    renderWlDomains();
    showToast(`@${domain} added to Google Sheets.`,'success');
  } catch(e) { showToast('Error adding domain: '+e.message, 'error'); }
}

async function wlRemoveDomain(domain) {
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeDomain', domain })
    });
    whitelist.domains=whitelist.domains.filter(d=>d.domain!==domain);
    renderWlDomains();
    showToast(`@${domain} removed from Google Sheets.`,'info');
  } catch(e) { showToast('Error removing domain: '+e.message, 'error'); }
}

async function approvePending(email,role) {
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addUser', email, name: email, role })
    });
    whitelist.pending=whitelist.pending.filter(p=>p.email!==email);
    whitelist.users.push({email,name:email,role,addedAt:new Date().toISOString().slice(0,10)});
    renderWlPending(); renderWlUsers();
    showToast(`${email} approved as ${role}.`,'success');
  } catch(e) { showToast('Error approving request: '+e.message, 'error'); }
}

async function denyPending(email) {
  try {
    whitelist.pending=whitelist.pending.filter(p=>p.email!==email);
    renderWlPending();
    showToast(`${email} request dismissed.`,'info');
  } catch(e) { showToast('Error dismissing request: '+e.message, 'error'); }
}

function approveAllPending() {
  whitelist.pending.forEach(p => {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addUser', email: p.email, name: p.email, role: 'editor' })
    });
    whitelist.users.push({email: p.email, name: p.email, role: 'editor', addedAt: new Date().toISOString().slice(0,10)});
  });
  whitelist.pending=[];
  renderWlPending(); renderWlUsers();
}

async function clearAllPending() {
  whitelist.pending=[];
  renderWlPending();
  showToast('Pending requests cleared.','info');
}

// â”€â”€ Event Listeners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
['search-input','year-select','practice-select','category-select'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener(el.tagName==='SELECT'?'change':'input', renderDashboard);
});
document.getElementById('tab-select')?.addEventListener('change', renderDashboard);

// â”€â”€ Initialization (Session Persistence & Google Sheets Live Sync) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.addEventListener('DOMContentLoaded', async () => {
  restoreSidebarState();
  const savedUser = localStorage.getItem('wwf_logged_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      syncHeaderUI();
      showDashboardPage();
    } catch(e) {
      currentUser = null;
      showLoginPage();
    }
  } else {
    showLoginPage();
  }
  await loadAllFromGoogleSheet();
  onCategoryChange();
  if (window.lucide) lucide.createIcons();
});
