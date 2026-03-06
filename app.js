/**
 * 欣聯大心社區委員輪值抽籤系統
 * 住戶資料與抽籤邏輯
 */

// =====================
// 住戶資料定義
// =====================

function generateUnits() {
  const units = [];

  // ---- A棟 ----
  // A1-1F (1樓只有A1)
  units.push({
    id: "A1-1F",
    building: "A",
    unit: "A1",
    floor: 1,
    label: "A1-1F",
  });
  // A1, A2 從2~9樓
  for (let f = 2; f <= 9; f++) {
    units.push({
      id: `A1-${f}F`,
      building: "A",
      unit: "A1",
      floor: f,
      label: `A1-${f}F`,
    });
    units.push({
      id: `A2-${f}F`,
      building: "A",
      unit: "A2",
      floor: f,
      label: `A2-${f}F`,
    });
  }

  // ---- B棟 ----
  // B1~B4 從2~14樓
  for (let f = 2; f <= 14; f++) {
    for (let u = 1; u <= 4; u++) {
      units.push({
        id: `B${u}-${f}F`,
        building: "B",
        unit: `B${u}`,
        floor: f,
        label: `B${u}-${f}F`,
      });
    }
  }

  // ---- C棟 ----
  // 2樓只有C2, C3
  units.push({
    id: "C2-2F",
    building: "C",
    unit: "C2",
    floor: 2,
    label: "C2-2F",
  });
  units.push({
    id: "C3-2F",
    building: "C",
    unit: "C3",
    floor: 2,
    label: "C3-2F",
  });
  // C1~C3 從3~14樓
  for (let f = 3; f <= 14; f++) {
    for (let u = 1; u <= 3; u++) {
      units.push({
        id: `C${u}-${f}F`,
        building: "C",
        unit: `C${u}`,
        floor: f,
        label: `C${u}-${f}F`,
      });
    }
  }

  return units;
}

const ALL_UNITS = generateUnits();
let drawResult = [];
let isDrawing = false;

// =====================
// 初始化
// =====================

document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const year = now.getFullYear();
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

  // 1樓：只有A1
  const row1 = createFloorRowA(1, ["A1-1F"]);
  container.appendChild(row1);

  // 9樓 → 2樓（由上到下渲染高樓層）
  for (let f = 9; f >= 2; f--) {
    const row = createFloorRowA(f, [`A1-${f}F`, `A2-${f}F`]);
    container.insertBefore(row, container.firstChild);
  }
  // 把1樓放最底
  container.appendChild(row1);
}

function createFloorRowA(floor, unitIds) {
  const row = document.createElement("div");
  row.className = "floor-row";

  const label = document.createElement("div");
  label.className = "floor-label";
  label.textContent = floor + "F";
  row.appendChild(label);

  unitIds.forEach((uid) => {
    const cell = document.createElement("div");
    cell.className = "unit-cell unit-cell-a undrawn";
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

function renderBuildingB() {
  const container = document.getElementById("floorsB");
  container.innerHTML = "";

  for (let f = 14; f >= 2; f--) {
    const row = document.createElement("div");
    row.className = "floor-row";

    const label = document.createElement("div");
    label.className = "floor-label";
    label.textContent = f + "F";
    row.appendChild(label);

    for (let u = 1; u <= 4; u++) {
      const uid = `B${u}-${f}F`;
      const cell = document.createElement("div");
      cell.className = "unit-cell unit-cell-b undrawn";
      cell.id = "cell-" + uid;
      cell.setAttribute("data-unit", uid);
      cell.setAttribute("title", uid);

      const inner = document.createElement("div");
      inner.className = "unit-rank";
      inner.innerHTML = `<span class="unit-id-text">${uid}</span>`;
      cell.appendChild(inner);
      row.appendChild(cell);
    }

    container.appendChild(row);
  }
}

function renderBuildingC() {
  const container = document.getElementById("floorsC");
  container.innerHTML = "";

  // 14F → 3F: C1, C2, C3
  for (let f = 14; f >= 3; f--) {
    const row = document.createElement("div");
    row.className = "floor-row";

    const label = document.createElement("div");
    label.className = "floor-label";
    label.textContent = f + "F";
    row.appendChild(label);

    for (let u = 1; u <= 3; u++) {
      const uid = `C${u}-${f}F`;
      const cell = document.createElement("div");
      cell.className = "unit-cell unit-cell-c undrawn";
      cell.id = "cell-" + uid;
      cell.setAttribute("data-unit", uid);
      cell.setAttribute("title", uid);

      const inner = document.createElement("div");
      inner.className = "unit-rank";
      inner.innerHTML = `<span class="unit-id-text">${uid}</span>`;
      cell.appendChild(inner);
      row.appendChild(cell);
    }

    container.appendChild(row);
  }

  // 2F: C2, C3 only
  const row2 = document.createElement("div");
  row2.className = "floor-row";
  const label2 = document.createElement("div");
  label2.className = "floor-label";
  label2.textContent = "2F";
  row2.appendChild(label2);

  ["C2-2F", "C3-2F"].forEach((uid) => {
    const cell = document.createElement("div");
    cell.className = "unit-cell unit-cell-c undrawn";
    cell.id = "cell-" + uid;
    cell.setAttribute("data-unit", uid);
    cell.setAttribute("title", uid);

    const inner = document.createElement("div");
    inner.className = "unit-rank";
    inner.innerHTML = `<span class="unit-id-text">${uid}</span>`;
    cell.appendChild(inner);
    row2.appendChild(cell);
  });

  container.appendChild(row2);
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

  // Show overlay
  const overlay = document.getElementById("drawerOverlay");
  const ballsContainer = document.getElementById("lotteryBalls");
  ballsContainer.innerHTML = `
    <div class="lottery-ball">A</div>
    <div class="lottery-ball">B</div>
    <div class="lottery-ball">C</div>
  `;
  overlay.style.display = "flex";

  // Simulate draw delay for suspense
  setTimeout(() => {
    drawResult = shuffleArray(ALL_UNITS);
    overlay.style.display = "none";

    btnDraw.classList.remove("loading");
    btnDraw.disabled = false;
    document.getElementById("btnClear").disabled = false;
    isDrawing = false;

    // Animate cells
    animateCells(drawResult);

    // Update table
    renderResultTable(drawResult);

    // Save result
    saveResult(drawResult);

    // Show status
    const status = document.getElementById("drawStatus");
    status.style.display = "block";
    status.textContent = `✅ 抽籤完成！共 ${drawResult.length} 戶完成排序`;
  }, 2200);
}

function animateCells(result) {
  result.forEach((unit, index) => {
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
      Math.min(index * 12, 2000) + Math.random() * 80,
    );
  });
}

function clearDraw() {
  drawResult = [];
  localStorage.removeItem("dutyDrawResult");

  // Reset all cells
  document.querySelectorAll(".unit-cell").forEach((cell) => {
    cell.classList.remove("drawn");
    cell.classList.add("undrawn");

    const uid = cell.getAttribute("data-unit");
    const inner = cell.querySelector(".unit-rank");
    inner.innerHTML = `<span class="unit-id-text">${uid}</span>`;
  });

  // Clear table
  document.getElementById("emptyState").style.display = "block";
  document.getElementById("tableWrapper").style.display = "none";

  // Hide status
  document.getElementById("drawStatus").style.display = "none";

  // Reset buttons
  document.getElementById("btnClear").disabled = true;
}

// =====================
// 結果表格
// =====================

function renderResultTable(result) {
  const body = document.getElementById("resultsBody");
  body.innerHTML = "";

  result.forEach((unit, index) => {
    const rank = index + 1;
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${Math.min(index * 8, 400)}ms`;

    const buildingTag = `<span class="building-tag tag-${unit.building.toLowerCase()}">${unit.building} 棟</span>`;
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
      <td>${buildingTag}</td>
      <td>${unit.floor} 樓</td>
      <td style="color:var(--clr-text-muted);font-size:0.82rem">${note}</td>
    `;
    body.appendChild(tr);
  });

  document.getElementById("emptyState").style.display = "none";
  document.getElementById("tableWrapper").style.display = "block";

  const now = new Date();
  document.getElementById("tableTimestamp").textContent =
    `抽籤時間：${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// =====================
// 本地儲存 (LocalStorage)
// =====================

function saveResult(result) {
  try {
    localStorage.setItem(
      "dutyDrawResult",
      JSON.stringify({
        result,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (e) {
    console.warn("Unable to save to localStorage:", e);
  }
}

function loadSavedResult() {
  try {
    const saved = localStorage.getItem("dutyDrawResult");
    if (!saved) return;

    const { result, timestamp } = JSON.parse(saved);
    if (!result || result.length === 0) return;

    drawResult = result;

    // Restore cells immediately
    result.forEach((unit, index) => {
      const cell = document.getElementById("cell-" + unit.id);
      if (!cell) return;
      cell.classList.remove("undrawn");
      cell.classList.add("drawn");
      const inner = cell.querySelector(".unit-rank");
      inner.innerHTML = `
        <span class="unit-id-text">${unit.id}</span>
        <span class="unit-rank-num">#${index + 1}</span>
      `;
    });

    renderResultTable(result);
    document.getElementById("btnClear").disabled = false;

    // Update timestamp from saved
    const d = new Date(timestamp);
    document.getElementById("tableTimestamp").textContent =
      `抽籤時間：${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}（已儲存結果）`;

    const status = document.getElementById("drawStatus");
    status.style.display = "block";
    status.textContent = `✅ 已載入上次抽籤結果（共 ${result.length} 戶）`;
  } catch (e) {
    console.warn("Unable to load from localStorage:", e);
  }
}
