/**
 * 欣聯大心社區委員輪值抽籤系統
 * A、B、C 三棟各自獨立抽籤排序 + Google Sheets 雲端資料庫
 */

// =====================
// ⚙️ 設定：請將 Apps Script Web App URL 貼在這裡
// =====================
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzLOPcNMRb2d6uf4xZQIQwQOYs2-D87e_aKvItwrUuOa_SYiG9md0Nc6I-nWSyWR-2z/exec";
// 如果留空，只使用 LocalStorage（離線模式）

// =====================
// 住戶資料定義
// =====================

function generateUnits() {
  const aUnits = [],
    bUnits = [],
    cUnits = [];

  // ---- A棟 ----
  aUnits.push({
    id: "A1-1F",
    building: "A",
    unit: "A1",
    floor: 1,
    label: "A1-1F",
  });
  for (let f = 2; f <= 9; f++) {
    aUnits.push({
      id: `A1-${f}F`,
      building: "A",
      unit: "A1",
      floor: f,
      label: `A1-${f}F`,
    });
    aUnits.push({
      id: `A2-${f}F`,
      building: "A",
      unit: "A2",
      floor: f,
      label: `A2-${f}F`,
    });
  }

  // ---- B棟 ----
  for (let f = 2; f <= 14; f++) {
    for (let u = 1; u <= 4; u++) {
      bUnits.push({
        id: `B${u}-${f}F`,
        building: "B",
        unit: `B${u}`,
        floor: f,
        label: `B${u}-${f}F`,
      });
    }
  }

  // ---- C棟 ----
  cUnits.push({
    id: "C2-2F",
    building: "C",
    unit: "C2",
    floor: 2,
    label: "C2-2F",
  });
  cUnits.push({
    id: "C3-2F",
    building: "C",
    unit: "C3",
    floor: 2,
    label: "C3-2F",
  });
  for (let f = 3; f <= 14; f++) {
    for (let u = 1; u <= 3; u++) {
      cUnits.push({
        id: `C${u}-${f}F`,
        building: "C",
        unit: `C${u}`,
        floor: f,
        label: `C${u}-${f}F`,
      });
    }
  }

  return { A: aUnits, B: bUnits, C: cUnits };
}

const ALL_UNITS = generateUnits();
let drawResults = { A: [], B: [], C: [] };
let isDrawing = false;

// =====================
// 初始化
// =====================

document.addEventListener("DOMContentLoaded", () => {
  const year = new Date().getFullYear();
  document.getElementById("currentYear").textContent = year + " 年";
  document.getElementById("footerYear").textContent = year;
  document.getElementById("saveNameInput").value = year + " 年度輪值抽籤";

  // 判斷雲端模式或離線模式
  if (APPS_SCRIPT_URL) {
    document.getElementById("cloudBadge").style.display = "inline-flex";
    loadCloudHistory();
  } else {
    document.getElementById("cloudBadge").style.display = "none";
    document.getElementById("offlineBadge").style.display = "inline-flex";
  }

  renderBuildings();
  loadSavedResult();
});

// =====================
// 建築圖渲染
// =====================

function renderBuildings() {
  renderBuildingA();
  renderBuildingB();
  renderBuildingC();
}

function renderBuildingA() {
  const container = document.getElementById("floorsA");
  container.innerHTML = "";
  for (let f = 9; f >= 2; f--) {
    container.appendChild(createFloorRow("A", f, [`A1-${f}F`, `A2-${f}F`]));
  }
  container.appendChild(createFloorRow("A", 1, ["A1-1F"]));
}

function renderBuildingB() {
  const container = document.getElementById("floorsB");
  container.innerHTML = "";
  for (let f = 14; f >= 2; f--) {
    const ids = [];
    for (let u = 1; u <= 4; u++) ids.push(`B${u}-${f}F`);
    container.appendChild(createFloorRow("B", f, ids));
  }
}

function renderBuildingC() {
  const container = document.getElementById("floorsC");
  container.innerHTML = "";
  for (let f = 14; f >= 3; f--) {
    const ids = [];
    for (let u = 1; u <= 3; u++) ids.push(`C${u}-${f}F`);
    container.appendChild(createFloorRow("C", f, ids));
  }
  container.appendChild(createFloorRow("C", 2, ["C2-2F", "C3-2F"]));
}

function createFloorRow(building, floor, unitIds) {
  const row = document.createElement("div");
  row.className = "floor-row";

  const label = document.createElement("div");
  label.className = "floor-label";
  label.textContent = floor + "F";
  row.appendChild(label);

  unitIds.forEach((uid) => {
    const cell = document.createElement("div");
    cell.className = `unit-cell unit-cell-${building.toLowerCase()} undrawn`;
    cell.id = "cell-" + uid;
    cell.setAttribute("data-unit", uid);
    cell.setAttribute("title", uid);
    const inner = document.createElement("div");
    inner.className = "unit-rank";
    inner.innerHTML = `<span class="unit-id-text">${uid}</span>`;
    cell.appendChild(inner);
    row.appendChild(cell);
  });

  return row;
}

// =====================
// 抽籤邏輯
// =====================

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startDraw() {
  if (isDrawing) return;
  isDrawing = true;

  const btnDraw = document.getElementById("btnDraw");
  btnDraw.classList.add("loading");
  btnDraw.disabled = true;
  document.getElementById("btnClear").disabled = true;
  document.getElementById("savePanel").style.display = "none";

  const overlay = document.getElementById("drawerOverlay");
  document.getElementById("lotteryBalls").innerHTML = `
    <div class="lottery-ball">A</div>
    <div class="lottery-ball">B</div>
    <div class="lottery-ball">C</div>
  `;
  overlay.style.display = "flex";

  setTimeout(() => {
    drawResults.A = shuffleArray(ALL_UNITS.A);
    drawResults.B = shuffleArray(ALL_UNITS.B);
    drawResults.C = shuffleArray(ALL_UNITS.C);

    overlay.style.display = "none";
    btnDraw.classList.remove("loading");
    btnDraw.disabled = false;
    document.getElementById("btnClear").disabled = false;
    isDrawing = false;

    animateBuildingCells("A", drawResults.A);
    animateBuildingCells("B", drawResults.B);
    animateBuildingCells("C", drawResults.C);

    renderResultTable(drawResults);
    saveLocalResult(drawResults);

    const status = document.getElementById("drawStatus");
    status.style.display = "block";
    status.textContent = `✅ 抽籤完成！A棟 ${drawResults.A.length} 戶 ／ B棟 ${drawResults.B.length} 戶 ／ C棟 ${drawResults.C.length} 戶`;

    // 顯示儲存面板
    document.getElementById("savePanel").style.display = "flex";
  }, 2200);
}

function animateBuildingCells(building, result) {
  result.forEach((unit, index) => {
    const baseDelay = { A: 0, B: 50, C: 100 }[building] || 0;
    setTimeout(
      () => {
        const cell = document.getElementById("cell-" + unit.id);
        if (!cell) return;
        cell.classList.remove("undrawn");
        cell.classList.add("drawn");
        cell.querySelector(".unit-rank").innerHTML = `
        <span class="unit-id-text">${unit.id}</span>
        <span class="unit-rank-num">#${index + 1}</span>
      `;
      },
      baseDelay + Math.min(index * 18, 2400) + Math.random() * 60,
    );
  });
}

function clearDraw() {
  drawResults = { A: [], B: [], C: [] };
  localStorage.removeItem("dutyDrawResult");

  document.querySelectorAll(".unit-cell").forEach((cell) => {
    cell.classList.remove("drawn");
    cell.classList.add("undrawn");
    const uid = cell.getAttribute("data-unit");
    cell.querySelector(".unit-rank").innerHTML =
      `<span class="unit-id-text">${uid}</span>`;
  });

  document.getElementById("emptyState").style.display = "block";
  document.getElementById("tableWrapper").style.display = "none";
  document.getElementById("drawStatus").style.display = "none";
  document.getElementById("btnClear").disabled = true;
  document.getElementById("savePanel").style.display = "none";
}

// =====================
// 結果表格
// =====================

function renderResultTable(results) {
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("tableWrapper").style.display = "block";
  renderBuildingTable("A", results.A);
  renderBuildingTable("B", results.B);
  renderBuildingTable("C", results.C);

  const now = new Date();
  document.getElementById("tableTimestamp").textContent =
    `抽籤時間：${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function renderBuildingTable(building, units) {
  const tbody = document.getElementById(`resultsBody${building}`);
  if (!tbody) return;
  tbody.innerHTML = "";

  units.forEach((unit, index) => {
    const rank = index + 1;
    const tr = document.createElement("tr");
    let rankClass = "rank-other";
    if (rank === 1) rankClass = "rank-1";
    else if (rank === 2) rankClass = "rank-2";
    else if (rank === 3) rankClass = "rank-3";
    const note =
      rank <= 3
        ? ["🥇 第一順位委員", "🥈 第二順位委員", "🥉 第三順位委員"][rank - 1]
        : "";

    tr.innerHTML = `
      <td><span class="rank-badge ${rankClass}">${rank}</span></td>
      <td><span class="unit-code">${unit.label}</span></td>
      <td>${unit.floor} 樓</td>
      <td style="color:var(--clr-text-muted);font-size:0.82rem">${note}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =====================
// LocalStorage (離線備份)
// =====================

function saveLocalResult(results) {
  try {
    localStorage.setItem(
      "dutyDrawResult",
      JSON.stringify({
        results,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (e) {}
}

function loadSavedResult() {
  try {
    const saved = localStorage.getItem("dutyDrawResult");
    if (!saved) return;
    const { results, timestamp } = JSON.parse(saved);
    if (!results || !results.A || results.A.length === 0) return;

    drawResults = results;
    ["A", "B", "C"].forEach((b) => {
      (results[b] || []).forEach((unit, index) => {
        const cell = document.getElementById("cell-" + unit.id);
        if (!cell) return;
        cell.classList.remove("undrawn");
        cell.classList.add("drawn");
        cell.querySelector(".unit-rank").innerHTML = `
          <span class="unit-id-text">${unit.id}</span>
          <span class="unit-rank-num">#${index + 1}</span>
        `;
      });
    });

    renderResultTable(results);
    document.getElementById("btnClear").disabled = false;
    document.getElementById("savePanel").style.display = "flex";

    const d = new Date(timestamp);
    document.getElementById("tableTimestamp").textContent =
      `抽籤時間：${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}（已儲存記錄）`;

    document.getElementById("drawStatus").style.display = "block";
    document.getElementById("drawStatus").textContent =
      `✅ 已載入本機記錄（A棟 ${results.A.length} 户 ／ B棟 ${results.B.length} 户 ／ C棟 ${results.C.length} 户）`;
  } catch (e) {}
}

// =====================
// ☁️ Google Sheets 雲端功能
// =====================

async function saveToCloud() {
  if (!APPS_SCRIPT_URL) {
    showCloudMsg("⚠️ 尚未設定 Apps Script URL，請參閱設定說明", "warn");
    return;
  }
  if (!drawResults.A || drawResults.A.length === 0) {
    showCloudMsg("⚠️ 請先完成抽籤再儲存", "warn");
    return;
  }

  const name =
    document.getElementById("saveNameInput").value.trim() || "未命名";
  const year = new Date().getFullYear();

  const btnSave = document.getElementById("btnSaveCloud");
  btnSave.disabled = true;
  btnSave.textContent = "儲存中...";

  try {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "save",
        name,
        year,
        results: drawResults,
      }),
    });
    const data = await resp.json();

    if (data.success) {
      showCloudMsg("☁️ " + data.message, "success");
      loadCloudHistory(); // 重新載入歷史清單
    } else {
      showCloudMsg("❌ 儲存失敗：" + data.error, "error");
    }
  } catch (e) {
    showCloudMsg("❌ 連線失敗：" + e.message, "error");
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "☁️ 儲存到試算表";
  }
}

async function loadCloudHistory() {
  if (!APPS_SCRIPT_URL) return;

  const container = document.getElementById("historyList");
  container.innerHTML = '<div class="history-loading">載入中...</div>';

  try {
    const resp = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    const data = await resp.json();

    if (!data.success) {
      container.innerHTML = `<div class="history-empty">載入失敗：${data.error}</div>`;
      return;
    }

    if (!data.records || data.records.length === 0) {
      container.innerHTML = '<div class="history-empty">尚無儲存記錄</div>';
      return;
    }

    container.innerHTML = "";
    data.records.forEach((rec) => {
      const item = createHistoryItem(rec);
      container.appendChild(item);
    });
  } catch (e) {
    container.innerHTML = `<div class="history-empty">連線失敗</div>`;
  }
}

function createHistoryItem(rec) {
  // 優先使用已格式化的 drawDate，否則自行格式化 timestamp
  let dateStr = rec.drawDate || "";
  if (!dateStr && rec.timestamp) {
    const d = new Date(rec.timestamp);
    dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  const seqLabel = rec.seq ? `#${rec.seq}` : rec.id;

  const item = document.createElement("div");
  item.className = "history-item";
  item.innerHTML = `
    <div class="history-item-info">
      <div class="history-item-name">
        <span class="history-seq">${escapeHtml(seqLabel)}</span>
        ${escapeHtml(rec.name)}
      </div>
      <div class="history-item-meta">${dateStr} ｜ A棟 ${rec.totalA} 戶 ／ B棟 ${rec.totalB} 戶 ／ C棟 ${rec.totalC} 戶</div>
    </div>
    <div class="history-item-actions">
      <button class="btn-history-load" onclick="loadHistoryRecord('${rec.id}')">📋 載入</button>
      <button class="btn-history-delete" onclick="deleteHistoryRecord('${rec.id}', this)">🗑 刪除</button>
    </div>
  `;
  item.setAttribute("data-id", rec.id);
  item.setAttribute("data-results", JSON.stringify(rec.results));
  return item;
}

function loadHistoryRecord(id) {
  const item = document.querySelector(`.history-item[data-id="${id}"]`);
  if (!item) return;

  try {
    const results = JSON.parse(item.getAttribute("data-results"));
    if (!results || !results.A) return;

    drawResults = results;

    // 先清除所有格子
    document.querySelectorAll(".unit-cell").forEach((cell) => {
      cell.classList.remove("drawn");
      cell.classList.add("undrawn");
      const uid = cell.getAttribute("data-unit");
      cell.querySelector(".unit-rank").innerHTML =
        `<span class="unit-id-text">${uid}</span>`;
    });

    // 重新顯示已儲存的結果
    ["A", "B", "C"].forEach((b) => {
      (results[b] || []).forEach((unit, index) => {
        const cell = document.getElementById("cell-" + unit.id);
        if (!cell) return;
        cell.classList.remove("undrawn");
        cell.classList.add("drawn");
        cell.querySelector(".unit-rank").innerHTML = `
          <span class="unit-id-text">${unit.id}</span>
          <span class="unit-rank-num">#${index + 1}</span>
        `;
      });
    });

    renderResultTable(results);
    saveLocalResult(results);
    document.getElementById("btnClear").disabled = false;
    document.getElementById("savePanel").style.display = "flex";

    const name = item.querySelector(".history-item-name").textContent;
    document.getElementById("drawStatus").style.display = "block";
    document.getElementById("drawStatus").textContent =
      `☁️ 已載入雲端記錄：${name}`;

    // 捲動到結果表格
    document
      .getElementById("resultsContainer")
      .scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    showCloudMsg("❌ 載入失敗：" + e.message, "error");
  }
}

async function deleteHistoryRecord(id, btn) {
  if (!confirm("確定要刪除這筆記錄嗎？")) return;

  btn.disabled = true;
  btn.textContent = "刪除中...";

  try {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = await resp.json();

    if (data.success) {
      const item = document.querySelector(`.history-item[data-id="${id}"]`);
      if (item) {
        item.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => item.remove(), 300);
      }
      showCloudMsg("🗑 記錄已刪除", "success");
    } else {
      showCloudMsg("❌ 刪除失敗：" + data.error, "error");
      btn.disabled = false;
      btn.textContent = "刪除";
    }
  } catch (e) {
    showCloudMsg("❌ 連線失敗", "error");
    btn.disabled = false;
    btn.textContent = "刪除";
  }
}

function showCloudMsg(msg, type = "info") {
  const el = document.getElementById("cloudMsg");
  el.textContent = msg;
  el.className = `cloud-msg cloud-msg-${type}`;
  el.style.display = "block";
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
