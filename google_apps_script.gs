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
 * 6. 部署後複製 Web App URL，填入 app.js 的 APPS_SCRIPT_URL 變數
 */

const SHEET_NAME = "輪值記錄";

// =====================
// GET 請求：列出所有記錄
// =====================
function doGet(e) {
  try {
    const action =
      e.parameter && e.parameter.action ? e.parameter.action : "list";
    if (action === "list") return listRecords();
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
    if (body.action === "save") return saveRecord(body);
    if (body.action === "delete") return deleteRecord(body.id);
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
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    let resultData = {};
    try {
      resultData = JSON.parse(row[6] || "{}");
    } catch (e) {}

    records.push({
      id: String(row[0]),
      seq: row[1],
      name: row[2],
      year: row[3],
      timestamp: row[4],
      drawDate: row[5],
      results: resultData,
      totalA: row[7] || 0,
      totalB: row[8] || 0,
      totalC: row[9] || 0,
    });
  }

  records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return jsonResponse({ success: true, records });
}

// =====================
// 儲存一筆記錄
// =====================
function saveRecord(body) {
  const sheet = getOrCreateSheet();

  // 計算下一個流水號
  const lastRow = sheet.getLastRow();
  const seq = lastRow; // 標題佔1列，所以第1筆資料在第2列，seq=1

  const now = new Date();
  const id = "R" + String(seq).padStart(4, "0");

  // 格式化日期時間供顯示
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const drawDate = `${y}/${mo}/${d} ${h}:${mi}`;

  const results = body.results || { A: [], B: [], C: [] };
  const totalA = (results.A || []).length;
  const totalB = (results.B || []).length;
  const totalC = (results.C || []).length;

  sheet.appendRow([
    id, // A: 編號
    seq, // B: 序號
    body.name || "未命名", // C: 名稱
    body.year || y, // D: 年度
    now.toISOString(), // E: 時間戳記（排序用）
    drawDate, // F: 顯示時間
    JSON.stringify(results), // G: 結果 JSON（隱藏）
    totalA, // H: A棟戶數
    totalB, // I: B棟戶數
    totalC, // J: C棟戶數
  ]);

  // 格式化新增的列
  formatLastRow(sheet);

  return jsonResponse({
    success: true,
    id: id,
    message: `✅ 第 ${seq} 筆記錄已儲存（${drawDate}）`,
  });
}

// =====================
// 刪除一筆記錄（依 ID）
// =====================
function deleteRecord(id) {
  if (!id) return jsonResponse({ success: false, error: "缺少 ID" });

  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
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
    setupSheet(sheet);
  }

  return sheet;
}

// =====================
// 初始化試算表格式
// =====================
function setupSheet(sheet) {
  // 標題列
  const headers = [
    "編號",
    "序號",
    "名稱",
    "年度",
    "時間戳記(ISO)",
    "抽籤時間",
    "結果JSON",
    "A棟戶數",
    "B棟戶數",
    "C棟戶數",
  ];
  sheet.appendRow(headers);

  // 標題列樣式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1a73e8");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setFontSize(11);

  // 欄寬設定
  sheet.setColumnWidth(1, 80); // 編號
  sheet.setColumnWidth(2, 60); // 序號
  sheet.setColumnWidth(3, 200); // 名稱
  sheet.setColumnWidth(4, 70); // 年度
  sheet.setColumnWidth(5, 180); // 時間戳記
  sheet.setColumnWidth(6, 150); // 抽籤時間
  sheet.setColumnWidth(7, 60); // JSON (隱藏)
  sheet.setColumnWidth(8, 90); // A棟
  sheet.setColumnWidth(9, 90); // B棟
  sheet.setColumnWidth(10, 90); // C棟

  // 隱藏 JSON 欄位 (G = col 7) 和 ISO時間 (E = col 5)
  sheet.hideColumns(5);
  sheet.hideColumns(7);

  // 凍結標題列
  sheet.setFrozenRows(1);
}

// =====================
// 格式化最後一列資料
// =====================
function formatLastRow(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const range = sheet.getRange(lastRow, 1, 1, 10);

  // 交替背景色
  const bg = lastRow % 2 === 0 ? "#f8f9ff" : "#ffffff";
  range.setBackground(bg);

  // 編號欄位：粗體、置中
  sheet
    .getRange(lastRow, 1)
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.getRange(lastRow, 2).setHorizontalAlignment("center");
  sheet.getRange(lastRow, 4).setHorizontalAlignment("center");
  sheet.getRange(lastRow, 8).setHorizontalAlignment("center");
  sheet.getRange(lastRow, 9).setHorizontalAlignment("center");
  sheet.getRange(lastRow, 10).setHorizontalAlignment("center");

  // 戶數欄位加數字格式
  sheet.getRange(lastRow, 8, 1, 3).setNumberFormat('0 "戶"');
}
