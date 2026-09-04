/**
 * WWF-Pakistan Forestry Portal — Google Apps Script Web App Backend
 * Binds to a Google Spreadsheet that stores forestry intervention data
 * in a single flat table "Fact_Forestry_Data" plus auth sheets.
 *
 * Deploy as:
 *   Execute as: Me (your account — owner of the Sheet)
 *   Who has access: Anyone (anonymous, no sign-in required)
 *
 * Sheets required in the bound Spreadsheet:
 *   - Fact_Forestry_Data  (Records: flat long-format table)
 *   - Whitelist           ({email, name, role, addedAt})
 *   - AllowedDomains      ({domain, role, addedAt})
 *   - PendingRequests     ({email, requestedAt, status})
 */

const SHEET = {
  DATA: "Fact_Forestry_Data",
  WHITELIST: "Whitelist",
  DOMAINS: "AllowedDomains",
  PENDING: "PendingRequests",
};

const DATA_COLS = [
  "Record_ID",
  "Practice",
  "Tab_Name",
  "Project_Name",
  "Intervention_Category",
  "Intervention_Code",
  "Intervention_Name",
  "Intervention_Description",
  "Year",
  "Plants_Count",
  "Area_Covered_ha",
  "Survival_Rate_pct",
  "Remarks_Evidence",
];

const DEFAULT_WHITELIST = [
  {
    email: "admin@wwf.org",
    name: "WWF Admin",
    role: "admin",
    addedAt: "2024-01-01",
  },
  {
    email: "field.officer@wwf.org",
    name: "KP Field Officer",
    role: "editor",
    addedAt: "2024-01-15",
  },
  {
    email: "mne.manager@wwf.org",
    name: "M&E Coordinator",
    role: "editor",
    addedAt: "2024-02-01",
  },
  {
    email: "tayyab@wwf.org",
    name: "Tayyab - Project Lead",
    role: "editor",
    addedAt: "2024-02-10",
  },
  {
    email: "viewer@wwf.org",
    name: "Observer Viewer",
    role: "viewer",
    addedAt: "2024-03-01",
  },
];

const DEFAULT_DOMAINS = [
  { domain: "wwf.org", role: "editor", addedAt: "2024-01-01" },
  { domain: "wwfpak.org", role: "editor", addedAt: "2024-01-01" },
  { domain: "wwf-pakistan.org", role: "editor", addedAt: "2024-01-01" },
  { domain: "panda.org", role: "viewer", addedAt: "2024-01-01" },
];

/**
 * HTTP GET entry point. Returns { records, whitelist: {users,domains,pending} } as JSON.
 * Accelerated with Google Apps Script CacheService (in-memory sub-150ms responses).
 */
function doGet(e) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("wwf_forestry_full_cache");
  if (cached != null) {
    return enableCors(ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON));
  }

  const data = handleGet(e);
  const jsonText = JSON.stringify({ ok: true, ...data });
  try {
    cache.put("wwf_forestry_full_cache", jsonText, 900); // Cache in memory for 15 minutes
  } catch (_) {}
  
  return enableCors(ContentService.createTextOutput(jsonText).setMimeType(ContentService.MimeType.JSON));
}

/**
 * HTTP POST entry point. Body JSON with { action, ...payload }.
 * Automatically invalidates in-memory cache on any data change.
 */
function doPost(e) {
  try {
    CacheService.getScriptCache().remove("wwf_forestry_full_cache");
  } catch (_) {}

  let res;
  try {
    const payload = parseBody(e);
    res = jsonResponse(handlePost(payload));
  } catch (err) {
    res = jsonResponse({ error: err.message || String(err) }, 400);
  }
  return enableCors(res);
}

/**
 * CORS preflight handler.
 */
function doOptions(e) {
  return enableCors(ContentService.createTextOutput(""));
}

function enableCors(out) {
  try {
    return out.setMimeType(ContentService.MimeType.JSON).setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Max-Age": "3600",
    });
  } catch (_) {
    return out;
  }
}

function jsonResponse(obj, code) {
  const body = {
    ok: code === undefined || String(code).startsWith("2") || !code,
    ...obj,
  };
  if (code) body.statusCode = code;
  const text = JSON.stringify(body);
  return ContentService.createTextOutput(text).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function parseBody(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {
      /* fallthrough */
    }
  }
  if (e.parameter) {
    const p = e.parameter;
    if (p.payload)
      try {
        return JSON.parse(p.payload);
      } catch (_) {
        /* fallthrough */
      }
    return p;
  }
  return {};
}

// ============== HANDLERS ==============

function handleGet() {
  ensureSheets();
  return {
    records: sheetToArrayOfObjects(SHEET.DATA, DATA_COLS),
    whitelist: {
      users: sheetToArrayOfObjects(SHEET.WHITELIST, [
        "email",
        "name",
        "role",
        "addedAt",
      ]),
      domains: sheetToArrayOfObjects(SHEET.DOMAINS, [
        "domain",
        "role",
        "addedAt",
      ]),
      pending: sheetToArrayOfObjects(SHEET.PENDING, [
        "email",
        "requestedAt",
        "status",
      ]),
    },
    sheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
  };
}

function handlePost(p) {
  ensureSheets();
  const action = String(p.action || "").trim();

  switch (action) {
    case "saveRecords":
      return saveRecords(p.records);
    case "addRecord":
      return addRecord(p.record);
    case "updateRecord":
      return updateRecord(p.record);
    case "deleteRecord":
      return deleteRecord(p.recordId);
    case "addUser":
      return addUser(p.user);
    case "removeUser":
      return removeUser(p.email);
    case "updateDomain":
      return updateDomain(p.domain);
    case "removeDomain":
      return removeDomain(p.domain);
    case "approveRequest":
      return approveRequest(p.email, p.role);
    case "rejectRequest":
      return rejectRequest(p.email);
    case "clearPending":
      return clearPending();
    case "requestAccess":
      return requestAccess(p.email, p.name);
    default:
      throw new Error("Unknown action: " + action);
  }
}

function addRecord(record) {
  const rows = sheetToArrayOfObjects(SHEET.DATA, DATA_COLS);
  const nextId = rows.reduce((m, r) => Math.max(m, Number(r.Record_ID) || 0), 0) + 1;
  const clean = {};
  DATA_COLS.forEach((c) => { clean[c] = (record && record[c] != null) ? record[c] : ""; });
  clean.Record_ID = nextId;
  rows.push(clean);
  writeArrayOfObjects(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DATA), DATA_COLS, rows);
  return { added: 1, Record_ID: nextId, total: rows.length };
}

function updateRecord(record) {
  if (!record || record.Record_ID == null) throw new Error("updateRecord requires Record_ID");
  const rows = sheetToArrayOfObjects(SHEET.DATA, DATA_COLS);
  const targetId = Number(record.Record_ID);
  const idx = rows.findIndex((r) => Number(r.Record_ID) === targetId);
  if (idx < 0) throw new Error("Record not found: " + targetId);
  DATA_COLS.forEach((c) => {
    if (c !== "Record_ID" && record[c] !== undefined) {
      rows[idx][c] = (record[c] != null) ? record[c] : "";
    }
  });
  writeArrayOfObjects(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DATA), DATA_COLS, rows);
  return { updated: 1, Record_ID: targetId };
}

function deleteRecord(recordId) {
  if (recordId == null) throw new Error("deleteRecord requires recordId");
  let rows = sheetToArrayOfObjects(SHEET.DATA, DATA_COLS);
  const before = rows.length;
  const targetId = Number(recordId);
  rows = rows.filter((r) => Number(r.Record_ID) !== targetId);
  // Re-sequence
  rows.forEach((r, i) => { r.Record_ID = i + 1; });
  writeArrayOfObjects(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DATA), DATA_COLS, rows);
  return { deleted: before - rows.length, remaining: rows.length };
}

// ============== DATA: CRUD on flat table ==============

function saveRecords(records) {
  if (!Array.isArray(records))
    throw new Error("saveRecords: expected records array");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET.DATA);
  // Re-number Record_ID to sequential 1..N on save for integrity
  const clean = records.map((r, i) => {
    const row = {};
    DATA_COLS.forEach((c) => {
      row[c] = r[c] !== undefined && r[c] !== null ? r[c] : "";
    });
    row.Record_ID = i + 1;
    return row;
  });
  writeArrayOfObjects(sheet, DATA_COLS, clean);
  return { saved: clean.length };
}

// ============== WHITELIST ==============

function addUser(user) {
  if (!user || !user.email) throw new Error("addUser: email required");
  const rows = sheetToArrayOfObjects(SHEET.WHITELIST, [
    "email",
    "name",
    "role",
    "addedAt",
  ]);
  const idx = rows.findIndex(
    (r) => String(r.email).toLowerCase() === String(user.email).toLowerCase(),
  );
  const record = {
    email: user.email,
    name: user.name || user.email,
    role: ["admin", "editor", "viewer"].includes(user.role)
      ? user.role
      : "viewer",
    addedAt: user.addedAt || new Date().toISOString().slice(0, 10),
  };
  if (idx >= 0) rows[idx] = record;
  else rows.push(record);
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.WHITELIST),
    ["email", "name", "role", "addedAt"],
    rows,
  );
  return { updated: true, count: rows.length };
}

function removeUser(email) {
  if (!email) throw new Error("removeUser: email required");
  let rows = sheetToArrayOfObjects(SHEET.WHITELIST, [
    "email",
    "name",
    "role",
    "addedAt",
  ]);
  const before = rows.length;
  rows = rows.filter(
    (r) => String(r.email).toLowerCase() !== String(email).toLowerCase(),
  );
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.WHITELIST),
    ["email", "name", "role", "addedAt"],
    rows,
  );
  return { removed: before - rows.length, remaining: rows.length };
}

function updateDomain(domain) {
  if (!domain || !domain.domain)
    throw new Error("updateDomain: domain required");
  let rows = sheetToArrayOfObjects(SHEET.DOMAINS, [
    "domain",
    "role",
    "addedAt",
  ]);
  const idx = rows.findIndex(
    (r) =>
      String(r.domain).toLowerCase() === String(domain.domain).toLowerCase(),
  );
  const rec = {
    domain: domain.domain,
    role: ["admin", "editor", "viewer"].includes(domain.role)
      ? domain.role
      : "viewer",
    addedAt: domain.addedAt || new Date().toISOString().slice(0, 10),
  };
  if (idx >= 0) rows[idx] = rec;
  else rows.push(rec);
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DOMAINS),
    ["domain", "role", "addedAt"],
    rows,
  );
  return { updated: true, count: rows.length };
}

function removeDomain(domain) {
  if (!domain) throw new Error("removeDomain: domain required");
  let rows = sheetToArrayOfObjects(SHEET.DOMAINS, [
    "domain",
    "role",
    "addedAt",
  ]);
  const before = rows.length;
  rows = rows.filter(
    (r) => String(r.domain).toLowerCase() !== String(domain).toLowerCase(),
  );
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DOMAINS),
    ["domain", "role", "addedAt"],
    rows,
  );
  return { removed: before - rows.length, remaining: rows.length };
}

// ============== PENDING REQUESTS ==============

function requestAccess(email, name) {
  if (!email) throw new Error("requestAccess: email required");
  let rows = sheetToArrayOfObjects(SHEET.PENDING, [
    "email",
    "requestedAt",
    "status",
  ]);
  const exists = rows.find(
    (r) => String(r.email).toLowerCase() === String(email).toLowerCase(),
  );
  if (!exists) {
    rows.push({
      email,
      requestedAt: new Date().toISOString(),
      status: "pending",
    });
    writeArrayOfObjects(
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.PENDING),
      ["email", "requestedAt", "status"],
      rows,
    );
  }
  return { requested: true, email, name: name || null };
}

function approveRequest(email, role) {
  if (!email) throw new Error("approveRequest: email required");
  let rows = sheetToArrayOfObjects(SHEET.PENDING, [
    "email",
    "requestedAt",
    "status",
  ]);
  const idx = rows.findIndex(
    (r) => String(r.email).toLowerCase() === String(email).toLowerCase(),
  );
  if (idx >= 0) {
    rows[idx].status = "approved";
  }
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.PENDING),
    ["email", "requestedAt", "status"],
    rows,
  );
  // Also add to whitelist as editor
  return addUser({ email, name: email, role: role || "editor" });
}

function rejectRequest(email) {
  if (!email) throw new Error("rejectRequest: email required");
  let rows = sheetToArrayOfObjects(SHEET.PENDING, [
    "email",
    "requestedAt",
    "status",
  ]);
  const idx = rows.findIndex(
    (r) => String(r.email).toLowerCase() === String(email).toLowerCase(),
  );
  if (idx >= 0) {
    rows[idx].status = "rejected";
  }
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.PENDING),
    ["email", "requestedAt", "status"],
    rows,
  );
  return { rejected: email };
}

function clearPending() {
  writeArrayOfObjects(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.PENDING),
    ["email", "requestedAt", "status"],
    [],
  );
  return { cleared: true };
}

// ============== SHEET HELPERS ==============

function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET.DATA, DATA_COLS);
  ensureSheet(
    ss,
    SHEET.WHITELIST,
    ["email", "name", "role", "addedAt"],
    DEFAULT_WHITELIST,
  );
  ensureSheet(
    ss,
    SHEET.DOMAINS,
    ["domain", "role", "addedAt"],
    DEFAULT_DOMAINS,
  );
  ensureSheet(ss, SHEET.PENDING, ["email", "requestedAt", "status"]);
}

function ensureSheet(ss, name, cols, seedRows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    if (seedRows && seedRows.length) {
      const data = seedRows.map((r) =>
        cols.map((c) => (r[c] !== undefined ? r[c] : "")),
      );
      sheet.getRange(2, 1, data.length, cols.length).setValues(data);
    }
    sheet.setFrozenRows(1);
  }
}

function sheetToArrayOfObjects(sheetName, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const vals = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();
  const out = [];
  for (const row of vals) {
    // Skip fully empty rows
    if (row.every((c) => c === "" || c === null || c === undefined)) continue;
    const obj = {};
    cols.forEach((c, i) => {
      obj[c] = row[i] !== undefined && row[i] !== null ? row[i] : "";
    });
    out.push(obj);
  }
  return out;
}

function writeArrayOfObjects(sheet, cols, rows) {
  const header = cols.slice();
  const data = (rows || []).map((r) =>
    cols.map((c) => (r[c] !== undefined && r[c] !== null ? r[c] : "")),
  );
  const neededRows = 1 + data.length;
  const curRows = sheet.getMaxRows();
  if (curRows < neededRows)
    sheet.insertRowsAfter(curRows, neededRows - curRows);
  const curCols = sheet.getMaxColumns();
  if (curCols < cols.length)
    sheet.insertColumnsAfter(curCols, cols.length - curCols);
  // Clear any existing data beyond new rows
  const oldLastRow = sheet.getLastRow();
  if (oldLastRow > neededRows) {
    sheet
      .getRange(neededRows + 1, 1, oldLastRow - neededRows, cols.length)
      .clearContent();
  }
  sheet.getRange(1, 1, 1, cols.length).setValues([header]);
  if (data.length) {
    sheet.getRange(2, 1, data.length, cols.length).setValues(data);
  }
  sheet.setFrozenRows(1);
}
