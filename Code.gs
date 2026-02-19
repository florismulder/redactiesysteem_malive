// ============================================================
// MaLive Draaiboek — Google Apps Script API
// Plak dit in: Extensions > Apps Script > Code.gs
// Daarna: Deploy > New deployment > Web app
//   - Execute as: Me
//   - Who has access: Anyone
// Kopieer de deployment URL naar de webapp.
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ---- CORS helper ----
function setCorsHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ---- GET: lees data ----
function doGet(e) {
  const action = e.parameter.action || "getRundown";
  const uitzendingId = e.parameter.uitzendingId || "default";
  let result;

  try {
    if (action === "getRundown") result = getRundown(uitzendingId);
    else if (action === "getGasten") result = getGasten(uitzendingId);
    else if (action === "getRedactie") result = getRedactie(uitzendingId);
    else if (action === "getUitzendingen") result = getUitzendingen();
    else result = { error: "Onbekende actie" };
  } catch (err) {
    result = { error: err.message };
  }

  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify(result))
  );
}

// ---- POST: schrijf data ----
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ error: "Ongeldige JSON" }))
    );
  }

  const { action, uitzendingId, data } = body;
  let result;

  try {
    if (action === "saveRundownItem") result = saveRundownItem(uitzendingId, data);
    else if (action === "saveGasten") result = saveGasten(uitzendingId, data);
    else if (action === "saveRedactie") result = saveRedactie(uitzendingId, data);
    else if (action === "createUitzending") result = createUitzending(data);
    else result = { error: "Onbekende actie" };
  } catch (err) {
    result = { error: err.message };
  }

  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify(result))
  );
}

// ============================================================
// RUNDOWN
// Tabblad: "Rundown"
// Kolommen: uitzendingId | itemId | extraJson | updatedAt
// ============================================================

function getRundown(uitzendingId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Rundown");
  if (!sheet) {
    sheet = ss.insertSheet("Rundown");
    sheet.appendRow(["uitzendingId", "itemId", "extraJson", "updatedAt"]);
  }
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1).filter(r => r[0] === uitzendingId);
  const result = {};
  rows.forEach(r => {
    try { result[r[1]] = JSON.parse(r[2]); } catch (e) { result[r[1]] = {}; }
  });
  return { ok: true, data: result };
}

function saveRundownItem(uitzendingId, { itemId, extra }) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Rundown");
  if (!sheet) {
    sheet = ss.insertSheet("Rundown");
    sheet.appendRow(["uitzendingId", "itemId", "extraJson", "updatedAt"]);
  }
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === uitzendingId && String(data[i][1]) === String(itemId)) {
      sheet.getRange(i + 1, 3).setValue(JSON.stringify(extra));
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return { ok: true, action: "updated" };
    }
  }
  sheet.appendRow([uitzendingId, itemId, JSON.stringify(extra), new Date().toISOString()]);
  return { ok: true, action: "created" };
}

// ============================================================
// GASTEN
// Tabblad: "Gasten"
// Kolommen: uitzendingId | gastenJson | updatedAt
// ============================================================

function getGasten(uitzendingId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Gasten");
  if (!sheet) {
    sheet = ss.insertSheet("Gasten");
    sheet.appendRow(["uitzendingId", "gastenJson", "updatedAt"]);
  }
  const data = sheet.getDataRange().getValues();
  const row = data.slice(1).find(r => r[0] === uitzendingId);
  if (!row) return { ok: true, data: [] };
  try { return { ok: true, data: JSON.parse(row[1]) }; } catch (e) { return { ok: true, data: [] }; }
}

function saveGasten(uitzendingId, gasten) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Gasten");
  if (!sheet) {
    sheet = ss.insertSheet("Gasten");
    sheet.appendRow(["uitzendingId", "gastenJson", "updatedAt"]);
  }
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === uitzendingId) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(gasten));
      sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
      return { ok: true };
    }
  }
  sheet.appendRow([uitzendingId, JSON.stringify(gasten), new Date().toISOString()]);
  return { ok: true };
}

// ============================================================
// REDACTIE
// Tabblad: "Redactie"
// Kolommen: uitzendingId | redactieJson | updatedAt
// ============================================================

function getRedactie(uitzendingId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Redactie");
  if (!sheet) {
    sheet = ss.insertSheet("Redactie");
    sheet.appendRow(["uitzendingId", "redactieJson", "updatedAt"]);
  }
  const data = sheet.getDataRange().getValues();
  const row = data.slice(1).find(r => r[0] === uitzendingId);
  if (!row) return { ok: true, data: [] };
  try { return { ok: true, data: JSON.parse(row[1]) }; } catch (e) { return { ok: true, data: [] }; }
}

function saveRedactie(uitzendingId, redactie) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Redactie");
  if (!sheet) {
    sheet = ss.insertSheet("Redactie");
    sheet.appendRow(["uitzendingId", "redactieJson", "updatedAt"]);
  }
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === uitzendingId) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(redactie));
      sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
      return { ok: true };
    }
  }
  sheet.appendRow([uitzendingId, JSON.stringify(redactie), new Date().toISOString()]);
  return { ok: true };
}

// ============================================================
// UITZENDINGEN (overzicht)
// Tabblad: "Uitzendingen"
// Kolommen: id | datum | titel | aangemaakt
// ============================================================

function getUitzendingen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Uitzendingen");
  if (!sheet) {
    sheet = ss.insertSheet("Uitzendingen");
    sheet.appendRow(["id", "datum", "titel", "aangemaakt"]);
    // Voeg standaard uitzending toe
    sheet.appendRow(["default", "2026-02-19", "Donderdag 19 februari 2026", new Date().toISOString()]);
  }
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1).map(r => ({ id: r[0], datum: r[1], titel: r[2], aangemaakt: r[3] }));
  return { ok: true, data: rows };
}

function createUitzending({ datum, titel }) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Uitzendingen");
  if (!sheet) {
    sheet = ss.insertSheet("Uitzendingen");
    sheet.appendRow(["id", "datum", "titel", "aangemaakt"]);
  }
  const id = "uitz_" + Date.now();
  sheet.appendRow([id, datum, titel, new Date().toISOString()]);
  return { ok: true, id };
}
