/**
 * 欣聯大心社區委員輪值抽籤系統
 * Google Apps Script 後端 API
 *
 * 部署步驟：
 * 1. 在 Google 試算表中開啟「擴充功能 → Apps Script」
 * 2. 貼上此程式碼，儲存
 * 3. 點選「部署 → 新增部署作業」
 * 4. 類型選「網路應用程式」
 * 5. 執行身分：「我」；存取權：「所有人（甚至匿名）」
 * 6. 部署後複製 Web App URL，填入 index.html 的 APPS_SCRIPT_URL 變數
 */

const SHEET_NAME = "輪值記錄";

// =====================
// GET 請求：列出所有記錄
// =====================
function doGet(e) {
  try {
    const action = e.parameter.action || "list";

    if (action === "list") {
      return listRecords();
    }

    return jsonResponse({ success: false, error: "未知操作" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// =====================
// POST 請求：儲存或刪除記錄
// =====================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "save") {
      return saveRecord(body);
    } else if (action === "delete") {
      return deleteRecord(body.id);
    }

    return jsonResponse({ success: false, error: "未知操作" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// =====================
// 列出所有記錄
// =====================
function listRecords() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return jsonResponse({ success: true, records: [] });
  }

  const records = [];
  // 跳過第一列（標題列）
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // 跳過空行

    let resultData = {};
    try {
      resultData = JSON.parse(row[4] || "{}");
    } catch (parseErr) {
      resultData = {};
    }

    records.push({
      id: row[0],
      name: row[1],
      year: row[2],
      timestamp: row[3],
      results: resultData,
      totalA: row[5] || 0,
      totalB: row[6] || 0,
      totalC: row[7] || 0,
    });
  }

  // 由新到舊排序
  records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return jsonResponse({ success: true, records });
}

// =====================
// 儲存一筆記錄
// =====================
function saveRecord(body) {
  const sheet = getOrCreateSheet();
  const id = Utilities.getUuid();
  const now = new Date().toISOString();

  const results = body.results || { A: [], B: [], C: [] };
  const resultsJson = JSON.stringify(results);

  sheet.appendRow([
    id,
    body.name || "未命名",
    body.year || new Date().getFullYear(),
    now,
    resultsJson,
    (results.A || []).length,
    (results.B || []).length,
    (results.C || []).length,
  ]);

  return jsonResponse({
    success: true,
    id: id,
    message: "✅ 記錄已儲存至 Google 試算表",
  });
}

// =====================
// 刪除一筆記錄（依 ID）
// =====================
function deleteRecord(id) {
  if (!id) {
    return jsonResponse({ success: false, error: "缺少 ID" });
  }

  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1); // Sheet row 是 1-indexed，且有標題列
      return jsonResponse({ success: true, message: "✅ 記錄已刪除" });
    }
  }

  return jsonResponse({ success: false, error: "找不到該記錄" });
}

// =====================
// 取得或建立試算表
// =====================
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 建立標題列
    sheet.appendRow([
      "ID",
      "名稱",
      "年度",
      "抽籤時間",
      "結果資料(JSON)",
      "A棟戶數",
      "B棟戶數",
      "C棟戶數",
    ]);

    // 設定標題列格式
    const headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground("#1a73e8");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");

    // 凍結標題列
    sheet.setFrozenRows(1);

    // 隱藏 JSON 欄位（太長）
    sheet.hideColumns(5);

    // 自動調整欄寬
    sheet.autoResizeColumns(1, 8);
  }

  return sheet;
}

// =====================
// 統一 JSON 回應（加入 CORS header）
// =====================
function jsonResponse(data) {
  const output = ContentService.createTextOutput(
    JSON.stringify(data),
  ).setMimeType(ContentService.MimeType.JSON);
  return output;
}
