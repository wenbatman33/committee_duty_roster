/**
 * 欣聯大心社區委員輪值抽籤系統
 * A、B、C 三棟各自獨立抽籤排序
 */

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

// 各棟抽籤結果（各自排序）
let drawResults = { A: [], B: [], C: [] };
let isDrawing = false;

// =====================
// 初始化
// =====================

document.addEventListener("DOMContentLoaded", () => {
  const year = new Date().getFullYear();
  document.getElementById("currentYear").textContent = year + " 年";
  document.getElementById("footerYear").textContent = year;

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

  // 9F → 2F 由上至下，最後是 1F
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

  // Show overlay with animated balls
  const overlay = document.getElementById("drawerOverlay");
  document.getElementById("lotteryBalls").innerHTML = `
    <div class="lottery-ball">A</div>
    <div class="lottery-ball">B</div>
    <div class="lottery-ball">C</div>
  `;
  overlay.style.display = "flex";

  setTimeout(() => {
    // 三棟各自洗牌
    drawResults.A = shuffleArray(ALL_UNITS.A);
    drawResults.B = shuffleArray(ALL_UNITS.B);
    drawResults.C = shuffleArray(ALL_UNITS.C);

    overlay.style.display = "none";
    btnDraw.classList.remove("loading");
    btnDraw.disabled = false;
    document.getElementById("btnClear").disabled = false;
    isDrawing = false;

    // 各棟動畫展示號碼
    animateBuildingCells("A", drawResults.A);
    animateBuildingCells("B", drawResults.B);
    animateBuildingCells("C", drawResults.C);

    // 渲染分棟表格
    renderResultTable(drawResults);
    saveResult(drawResults);

    const totalA = drawResults.A.length;
    const totalB = drawResults.B.length;
    const totalC = drawResults.C.length;
    const status = document.getElementById("drawStatus");
    status.style.display = "block";
    status.textContent = `✅ 抽籤完成！A棟 ${totalA} 戶 ／ B棟 ${totalB} 戶 ／ C棟 ${totalC} 戶，各自完成獨立排序`;
  }, 2200);
}

function animateBuildingCells(building, result) {
  result.forEach((unit, index) => {
    // 錯開各棟動畫起始時間，讓三棟看起來同步但有細微差異
    const baseDelay = { A: 0, B: 50, C: 100 }[building] || 0;
    setTimeout(
      () => {
        const cell = document.getElementById("cell-" + unit.id);
        if (!cell) return;
        cell.classList.remove("undrawn");
        cell.classList.add("drawn");

        const inner = cell.querySelector(".unit-rank");
        inner.innerHTML = `
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
}

// =====================
// 結果表格（三棟分頁）
// =====================

function renderResultTable(results) {
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("tableWrapper").style.display = "block";

  // 填寫各棟 tbody
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
// 本地儲存
// =====================

function saveResult(results) {
  try {
    localStorage.setItem(
      "dutyDrawResult",
      JSON.stringify({
        results,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (e) {
    console.warn("Unable to save:", e);
  }
}

function loadSavedResult() {
  try {
    const saved = localStorage.getItem("dutyDrawResult");
    if (!saved) return;
    const { results, timestamp } = JSON.parse(saved);
    if (!results || !results.A) return;

    drawResults = results;

    // 還原各棟格子顯示
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

    const d = new Date(timestamp);
    document.getElementById("tableTimestamp").textContent =
      `抽籤時間：${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}（已儲存結果）`;

    const status = document.getElementById("drawStatus");
    status.style.display = "block";
    status.textContent = `✅ 已載入上次抽籤結果（A棟 ${results.A.length} 戶 ／ B棟 ${results.B.length} 戶 ／ C棟 ${results.C.length} 戶）`;
  } catch (e) {
    console.warn("Unable to load:", e);
  }
}
