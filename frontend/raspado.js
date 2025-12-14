const baseCanvas = document.getElementById("baseCanvas");
const overlayCanvas = document.getElementById("overlayCanvas");
const baseCtx = baseCanvas.getContext("2d");
const overlayCtx = overlayCanvas.getContext("2d");

const img = new Image();
img.src = "img/navidad.png";

const GRID_ROWS = 4;
const GRID_COLS = 4;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;
const radius = 25;

const MAX_CANVAS_WIDTH = 900;
const MAX_CANVAS_HEIGHT = 700;

const currentUser = localStorage.getItem("currentUserName") || "anon";
const saveKey = `raspaData_${currentUser}`;
const chancesKey = `raspaChances_${currentUser}`;

let raspaData = JSON.parse(localStorage.getItem(saveKey)) || [];
let raspaChances = parseInt(localStorage.getItem(chancesKey)) || 1;

let _saveTimeout = null;

function initializeCanvas() {
  raspaChances = parseInt(localStorage.getItem(chancesKey)) || 1;
  raspaData = JSON.parse(localStorage.getItem(saveKey)) || [];
  
  console.log("raspaChances después de recargar:", raspaChances);
  console.log("raspaData length después de recargar:", raspaData.length);

  const scale = Math.min(MAX_CANVAS_WIDTH / img.width, MAX_CANVAS_HEIGHT / img.height, 1);
  const newWidth = Math.round(img.width * scale);
  const newHeight = Math.round(img.height * scale);

  baseCanvas.width = overlayCanvas.width = newWidth;
  baseCanvas.height = overlayCanvas.height = newHeight;

  baseCtx.drawImage(img, 0, 0, newWidth, newHeight);

  overlayCtx.fillStyle = "rgba(180,180,180,1)";
  overlayCtx.fillRect(0, 0, newWidth, newHeight);

  drawGrid(newWidth, newHeight);

  raspaData.forEach(p => drawErase(p.x, p.y, false));
}

img.onload = () => {
  initializeCanvas();
};

if (img.complete) {
  setTimeout(initializeCanvas, 10);
}

function drawGrid(w, h) {
  const cellWidth = w / GRID_COLS;
  const cellHeight = h / GRID_ROWS;

  overlayCtx.lineWidth = 2;
  overlayCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i <= GRID_ROWS; i++) {
    const y = i * cellHeight;
    overlayCtx.beginPath();
    overlayCtx.moveTo(0, y);
    overlayCtx.lineTo(w, y);
    overlayCtx.stroke();
  }
  for (let j = 0; j <= GRID_COLS; j++) {
    const x = j * cellWidth;
    overlayCtx.beginPath();
    overlayCtx.moveTo(x, 0);
    overlayCtx.lineTo(x, h);
    overlayCtx.stroke();
  }
}

let isErasing = false;
overlayCanvas.addEventListener("mousedown", () => (isErasing = true));
overlayCanvas.addEventListener("mouseup", () => (isErasing = false));
overlayCanvas.addEventListener("mouseleave", () => (isErasing = false));
overlayCanvas.addEventListener("mousemove", e => {
  if (!isErasing) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor((x / overlayCanvas.width) * GRID_COLS);
  const row = Math.floor((y / overlayCanvas.height) * GRID_ROWS);
  const cellIndex = row * GRID_COLS + col;

  console.log("Mouse move - cellIndex:", cellIndex, "raspaChances:", raspaChances, "allowed:", cellIndex < raspaChances);

  if (cellIndex < raspaChances) {
    drawErase(x, y);
  }
});

function drawErase(x, y, save = true) {
  overlayCtx.globalCompositeOperation = "destination-out";
  overlayCtx.beginPath();
  overlayCtx.arc(x, y, radius, 0, Math.PI * 2, false);
  overlayCtx.fill();
  overlayCtx.globalCompositeOperation = "source-over";

  drawGrid(overlayCanvas.width, overlayCanvas.height);

  if (!save) return;

  raspaData.push({ x, y });
  if (raspaData.length > 5000) {
    raspaData.splice(0, raspaData.length - 5000);
  }

  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(saveKey, JSON.stringify(raspaData));
    } catch (e) {
      console.warn("Failed to save raspaData", e);
    }
    _saveTimeout = null;
  }, 200);
}

document.getElementById("volverBtn").onclick = () => {
  window.location.href = "index.html";
};