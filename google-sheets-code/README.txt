# Google Sheets Backend — Deployment Instructions
========================================

The WWF Forestry Portal stores data in ONE Google Spreadsheet (single flat table)
when deployed to GitHub Pages (static hosting, no Node backend).

A — The frontend talks to this Google Apps Script Web App backend.

## Step 1 — Create the Spreadsheet (once)
---------
1. Create a new Google Spreadsheet in Drive.
2. Give it a name (e.g. WWF Pakistan Forestry Achievements Live").
3. You do NOT need to manually add any sheets — Apps Script creates these on first load.
3. Open Extensions → Apps Script.

Step 2 — Paste Apps Script Code]
---------
1. In the Apps Script editor, delete the default Code.gs tab (empty project:
- Copy all the contents of:
  google-sheets-code/Code.gs → into the Code editor tab and paste it in the project.
2. Add a appsscript.json:
  File → Project Settings → ✅ Show "appsscript.json" manifest file in editor.
  Replace its contents with: google-sheets-code/appsscript.json (set Runtime V8 and Anyone access anyone) with correct timezone (Asia/Karachi).
3. SAVE the project (disk icon, project name: WWF-Forestry-Backend).

Step 3 — FIRST RUN — Permissions / Authorize
---------
1. In the Apps Script editor:
Run → Run → doGet function the the the Run)
- Apps Script will prompt "Authorization required".
- Review Permissions → Allow (unsafe" warning because it's custom unverified app):
  Click Advanced → Go to project name anyway).
- After first creates the 4 sheets (Fact_Forestry_Data, Whitelist, Whitelist, AllowedDomains, PendingRequests) and seeds default data using default whitelist entries.

Step 4 — DEPLOY as Web App
---------
1. Click Deploy → New deployment.
2. Click the gear wheel icon (select type: Web app.
3. Settings:
  Execute as: Me (your email — spreadsheet's creator email)
  Who has access: Anyone (even anonymous / no login)
4. Click Deploy.
5. Accept any additional auth prompts.
6. Copy the Web app URL → it looks like this:
     https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec

Step 5 — Paste URL into the Portal)
---------
Open forestry_dashboard.html:
  Find line where APPS_SCRIPT_URL = "...";
  Replace with your new deployed Web App URL.

Step 6 — Seed Data)
---------
- Localhost dev: server.js provides /api/records uses Excel fallback.
- GitHub deployed: only APPS_SCRIPT_URL is used (CORS-enabled on the Apps Script handles it).

The flat table columns (Fact_Forestry_Data):

Record_ID | Practice | Tab_Name | Project_Name | Intervention_Category | Intervention_Code | Intervention_Name | Intervention_Description | Year | Plants_Count | Area_Covered_ha | Survival_Rate_pct | Remarks_Evidence

The Data page in the portal renders this into the original 9-tab wide format.

Backend actions supported over POST:
{action:"  saveRecords":  addUser, removeUser, updateDomain, removeDomain, approveRequest, rejectRequest, clearPending, requestAccess
