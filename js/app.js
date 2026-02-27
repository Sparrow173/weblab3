"use strict";
import { mountModals } from "./ui.js";
import { createEmptyGrid, spawnRandomTiles, applyMove, canMove, cloneGrid } from "./game.js";

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
  const btnUndo = el("button", { className: "btn", text: "Undo", attrs: { id: "btnUndo", type: "button" } });
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

buildLayout(document.querySelector("#app"));
mountModals(document.body);

let grid = createEmptyGrid();
let score = 0;
let isGameOver = false;
let undoState = null;

// стартовые плитки
spawnRandomTiles(grid, 2);

function render() {
  document.querySelector("#score").textContent = String(score);

  const cells = document.querySelectorAll("#board .cell");
  let idx = 0;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      const cell = cells[idx++];

      cell.textContent = v === 0 ? "" : String(v);
      cell.className = "cell";
      if (v !== 0) cell.classList.add(`tile--${v}`);
    }
  }
}

render();

function startNewGame() {
  grid = createEmptyGrid();
  score = 0;
  isGameOver = false;
  undoState = null;

  spawnRandomTiles(grid, 2);

  render();
}

function undo() {
  if (isGameOver) return;

  if (!undoState) return;

  grid = cloneGrid(undoState.grid);
  score = undoState.score;

  // один шаг — после отката очищаем undo, чтобы не откатываться бесконечно
  undoState = null;

  render();
}

function tryMove(dir) {
  if (isGameOver) return;

  const beforeGrid = cloneGrid(grid);
  const beforeScore = score;

  const res = applyMove(grid, dir);

  if (!res.changed) return;

  undoState = { grid: beforeGrid, score: beforeScore };

  grid = res.grid;
  score += res.scoreGained;

  const spawnCount = Math.random() < 0.25 ? 2 : 1;
  spawnRandomTiles(grid, spawnCount);

  if (!canMove(grid)) {
    isGameOver = true;
  }

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