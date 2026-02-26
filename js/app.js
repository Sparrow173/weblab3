"use strict";
import { mountModals } from "./ui.js";

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
