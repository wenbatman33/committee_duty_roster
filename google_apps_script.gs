/**
 * 欣聯大心社區委員輪值抽籤系統
 * Google Apps Script 後端 API（精簡版）
 *
 * 試算表欄位：
 * A: 編號 | B: 名稱 | C: 年度 | D: 抽籤時間 | E: A棟順序 | F: B棟順序 | G: C棟順序
 *
 * 部署步驟：
 * 1. 試算表 → 擴充功能 → Apps Script → 貼上此程式碼 → 儲存
 * 2. 部署 → 新增部署作業 → 類型：網路應用程式
 * 3. 執行身分：我 ／ 存取權：所有人 → 部署
 * 4. 複製 URL 貼入 app.js 的 APPS_SCRIPT_URL
 */

const SHEET_NAME = "輪值記錄";

// ---- GET：列出所有記錄 ----
function doGet(e) {
  try {
    return listRecords();
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ---- POST：儲存或刪除 ----
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

// ---- 列出所有記錄 ----
function listRecords() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse({ success: true, records: [] });

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    records.push({
      id: String(row[0]),
      name: String(row[1]),
      year: row[2],
      drawDate: String(row[3]),
      orderA: String(row[4]), // 逗號分隔的 A 棟 ID 順序
      orderB: String(row[5]), // 逗號分隔的 B 棟 ID 順序
      orderC: String(row[6]), // 逗號分隔的 C 棟 ID 順序
      totalA: row[7] || 0,
      totalB: row[8] || 0,
      totalC: row[9] || 0,
    });
  }

  // 由新到舊（利用第 1 欄編號 R0001, R0002... 反排）
  records.sort((a, b) => b.id.localeCompare(a.id));
  return jsonResponse({ success: true, records });
}

// ---- 儲存一筆記錄 ----
function saveRecord(body) {
  const sheet = getOrCreateSheet();
  const seq = sheet.getLastRow(); // 標題佔 1 列
  const id = "R" + String(seq).padStart(4, "0");

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const drawDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // 只存順序 ID（逗號分隔），不存整個物件
  const orderA = (body.orderA || []).join(",");
  const orderB = (body.orderB || []).join(",");
  const orderC = (body.orderC || []).join(",");

  const totalA = body.totalA || 0;
  const totalB = body.totalB || 0;
  const totalC = body.totalC || 0;

  sheet.appendRow([
    id,
    body.name || "未命名",
    body.year || now.getFullYear(),
    drawDate,
    orderA,
    orderB,
    orderC,
    totalA,
    totalB,
    totalC,
  ]);

  formatLastRow(sheet);

  return jsonResponse({
    success: true,
    id,
    message: `✅ 第 ${seq} 筆記錄已儲存（${drawDate}）`,
  });
}

// ---- 刪除一筆記錄 ----
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

// ---- 取得或建立 Sheet ----
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupSheet(sheet);
  }
  return sheet;
}

// ---- 初始化試算表格式 ----
function setupSheet(sheet) {
  const headers = [
    "編號",
    "名稱",
    "年度",
    "抽籤時間",
    "A棟輪值順序(ID)",
    "B棟輪值順序(ID)",
    "C棟輪值順序(ID)",
    "A棟戶數",
    "B棟戶數",
    "C棟戶數",
  ];
  sheet.appendRow(headers);

  const hr = sheet.getRange(1, 1, 1, headers.length);
  hr.setBackground("#1a73e8")
    .setFontColor("#fff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setFontSize(11);

  sheet.setColumnWidth(1, 80); // 編號
  sheet.setColumnWidth(2, 180); // 名稱
  sheet.setColumnWidth(3, 65); // 年度
  sheet.setColumnWidth(4, 150); // 抽籤時間
  sheet.setColumnWidth(5, 300); // A棟順序
  sheet.setColumnWidth(6, 400); // B棟順序
  sheet.setColumnWidth(7, 350); // C棟順序
  sheet.setColumnWidth(8, 80); // A棟戶數
  sheet.setColumnWidth(9, 80); // B棟戶數
  sheet.setColumnWidth(10, 80); // C棟戶數

  sheet.setFrozenRows(1);
}

// ---- 格式化最後一列 ----
function formatLastRow(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const bg = lastRow % 2 === 0 ? "#f0f4ff" : "#ffffff";
  sheet
    .getRange(lastRow, 1, 1, 10)
    .setBackground(bg)
    .setVerticalAlignment("middle");
  sheet
    .getRange(lastRow, 1)
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.getRange(lastRow, 3).setHorizontalAlignment("center");
  sheet
    .getRange(lastRow, 8, 1, 3)
    .setHorizontalAlignment("center")
    .setNumberFormat('0"戶"');
  // 讓順序欄位文字換行
  sheet.getRange(lastRow, 5, 1, 3).setWrap(true);
  sheet.setRowHeight(lastRow, 60);
}

// ---- JSON 回應 ----
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
