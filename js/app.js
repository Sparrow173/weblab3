"use strict";
import {
  mountModals,
  showModal,
  hideAllModals,
  resetGameOverUI,
  setGameOverSavedUI,
  renderLeadersTable,
} from "./ui.js";
import { createEmptyGrid, spawnRandomTiles, applyMove, canMove, cloneGrid } from "./game.js";
import { saveGameState, loadGameState, clearGameState } from "./storage.js";
import { loadLeaders, addLeaderRecord } from "./storage.js";

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  if (opts.children) {
    for (const ch of opts.children) node.appendChild(ch);
  }
  return node;
}

function buildLayout(root) {
  const title = el("h1", { className: "title", text: "2048" });

  const scoreLabel = el("div", { className: "score-label", text: "Очки" });
  const scoreValue = el("div", { className: "score-value", text: "0", attrs: { id: "score" } });
  const scoreBox = el("div", { className: "score-box", children: [scoreLabel, scoreValue] });

  const btnNew = el("button", { className: "btn", text: "Новая игра", attrs: { id: "btnNew", type: "button" } });
  const btnUndo = el("button", {className: "btn", text: "Отмена хода", attrs: { id: "btnUndo", type: "button" }});
  const btnLeaders = el("button", { className: "btn btn-secondary", text: "Лидеры", attrs: { id: "btnLeaders", type: "button" } });

  const actions = el("div", { className: "actions", children: [btnNew, btnUndo, btnLeaders] });
  const header = el("div", { className: "header", children: [title, scoreBox, actions] });

  const board = el("div", {
    className: "board",
    attrs: { id: "board", role: "application", "aria-label": "Игровое поле 2048" }
  });

  for (let i = 0; i < 16; i++) {
  const cell = el("div", { className: "cell", attrs: { "data-idx": String(i) } });
  board.appendChild(cell);
  }

  const mUp = el("button", { className: "mbtn", text: "↑", attrs: { id: "mUp", type: "button" } });
  const mLeft = el("button", { className: "mbtn", text: "←", attrs: { id: "mLeft", type: "button" } });
  const mDown = el("button", { className: "mbtn", text: "↓", attrs: { id: "mDown", type: "button" } });
  const mRight = el("button", { className: "mbtn", text: "→", attrs: { id: "mRight", type: "button" } });

  const mobile = el("div", {
    className: "mobile-controls hidden",
    attrs: { id: "mobileControls" },
    children: [
      el("div", { className: "mobile-row", children: [mUp] }),
      el("div", { className: "mobile-row", children: [mLeft, mDown, mRight] }),
    ],
  });

  const main = el("div", { className: "main", children: [header, board, mobile] });
  root.appendChild(main);
}

buildLayout(document.querySelector("#app"));
mountModals(document.body);

let grid = createEmptyGrid();
let prevGrid = createEmptyGrid();
let score = 0;
let isGameOver = false;
let undoState = null;

// 1) пытаемся восстановить игру
const saved = loadGameState();

if (saved && saved.grid) {
  grid = saved.grid;
  score = saved.score || 0;

  // если сохранённое состояние уже без ходов — фиксируем game over
  isGameOver = !canMove(grid);
} else {
  // 2) если сохранять нечего — стартуем новую
  spawnRandomTiles(grid, 2);
  saveGameState({ grid, score });
}
// показываем или скрываем мобильные кнопки
setMobileControlsVisible(!isGameOver);

function setMobileControlsVisible(visible) {
  const block = document.querySelector("#mobileControls");
  if (!block) return;
  block.classList.toggle("hidden", !visible);
}

function render() {
  document.querySelector("#score").textContent = String(score);

  const cells = document.querySelectorAll("#board .cell");

  let idx = 0;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {

      const value = grid[r][c];
      const prev = prevGrid[r][c];

      const cell = cells[idx++];

      cell.className = "cell";

      if (value !== 0) {
        cell.textContent = value;
        cell.classList.add(`tile--${value}`);

        // если плитка появилась
        if (prev === 0) {
          cell.classList.add("new-tile");
        }

      } else {
        cell.textContent = "";
      }

    }
  }

  // сохраняем текущее поле как предыдущее
  prevGrid = cloneGrid(grid);
}

setMobileControlsVisible(!isGameOver);
render();

function openLeaders() {
  const list = loadLeaders();
  renderLeadersTable(list);
  showModal("#modalLeaders");
  setMobileControlsVisible(false);
}

function closeLeaders() {
  hideAllModals();
  setMobileControlsVisible(!isGameOver);
}

function startNewGame() {
  grid = createEmptyGrid();
  score = 0;
  isGameOver = false;
  undoState = null;

  // стартовые плитки: можно 1–3, но обычно 2
  spawnRandomTiles(grid, 2);
  setMobileControlsVisible(true);
  clearGameState();
saveGameState({ grid, score });
  render();
}

function undo() {
  
  if (isGameOver) return;

  if (!undoState) return;

  grid = cloneGrid(undoState.grid);
  score = undoState.score;

  // один шаг — после отката очищаем undo, чтобы не откатываться бесконечно
  undoState = null;
    saveGameState({ grid, score });
  render();
}

function tryMove(dir) {
  if (isGameOver) return;

  const beforeGrid = cloneGrid(grid);
  const beforeScore = score;

  const res = applyMove(grid, dir);

  // если ход ничего не поменял — undo не трогаем и новых тайлов не спавним
  if (!res.changed) return;

  // фиксируем undo только для успешного хода
  undoState = { grid: beforeGrid, score: beforeScore };

  grid = res.grid;
  score += res.scoreGained;

  const spawnCount = Math.random() < 0.25 ? 2 : 1;
  spawnRandomTiles(grid, spawnCount);

  if (!canMove(grid)) {
  isGameOver = true;

  // готовим модалку к показу (сбрасываем "рекорд сохранен" и возвращаем input)
  resetGameOverUI();

  // показываем модалку окончания игры
  showModal("#modalGameOver");

  // скрываем мобильное управление, т.к. мы больше "не в игре"
  setMobileControlsVisible(false);
}
 saveGameState({ grid, score });
  render();
}

document.addEventListener("keydown", (e) => {
  const map = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
  };

  const dir = map[e.key];
  if (!dir) return;

  e.preventDefault(); // чтобы не скроллилась страница
  tryMove(dir);
});

document.querySelector("#btnNew").addEventListener("click", startNewGame);
document.querySelector("#btnUndo").addEventListener("click", undo);
document.querySelector("#mLeft").addEventListener("click", () => tryMove("left"));
document.querySelector("#mRight").addEventListener("click", () => tryMove("right"));
document.querySelector("#mUp").addEventListener("click", () => tryMove("up"));
document.querySelector("#mDown").addEventListener("click", () => tryMove("down"));
document.querySelector("#goRestart").addEventListener("click", () => {
  hideAllModals();
  startNewGame();
});
document.querySelector("#goSave").addEventListener("click", () => {
  const input = document.querySelector("#goName");
  const name = (input.value || "").trim();

  // минимальная валидация, иначе будут пустые записи
  if (!name) {
    input.focus();
    return;
  }

  addLeaderRecord(name, score);

  setGameOverSavedUI();
});
document.querySelector("#btnLeaders").addEventListener("click", openLeaders);
document.querySelector("#leadersClose").addEventListener("click", closeLeaders);

(function enableSwipes() {
  const board = document.querySelector("#board");
  if (!board) return;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const SWIPE_MIN_DIST = 28;     // минимальная дистанция (px)
  const SWIPE_MAX_TIME = 900;    // чтобы слишком долгие "протаскивания" не считались (ms)

  board.addEventListener("touchstart", (e) => {
    if (isGameOver) return;
    // если открыта модалка, свайпы не нужны
    const overlay = document.querySelector("#overlay");
    if (overlay && !overlay.classList.contains("hidden")) return;

    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
  }, { passive: true });

  board.addEventListener("touchend", (e) => {
    if (isGameOver) return;
    const overlay = document.querySelector("#overlay");
    if (overlay && !overlay.classList.contains("hidden")) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const dt = Date.now() - startTime;

    if (dt > SWIPE_MAX_TIME) return;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // слишком маленький жест — игнор
    if (Math.max(absX, absY) < SWIPE_MIN_DIST) return;

    // определяем направление по преобладающей оси
    if (absX > absY) {
      tryMove(dx > 0 ? "right" : "left");
    } else {
      tryMove(dy > 0 ? "down" : "up");
    }
  }, { passive: true });
})();