"use strict";

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.html != null) node.innerHTML = opts.html;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  if (opts.children) for (const ch of opts.children) node.appendChild(ch);
  return node;
}

export function mountModals(root = document.body) {
  const overlay = el("div", { className: "modal-overlay hidden", attrs: { id: "overlay" } });

  // Game Over modal
  const goTitle = el("div", { className: "modal-title", text: "Игра окончена" });
  const goMsg = el("div", { className: "modal-text", attrs: { id: "goMsg" }, text: "Нет возможных ходов." });

  const nameInput = el("input", {
    className: "modal-input",
    attrs: { id: "goName", placeholder: "Ваше имя", maxlength: "20" }
  });

  const btnSave = el("button", { className: "btn", text: "Сохранить результат", attrs: { id: "goSave", type: "button" } });
  const btnRestart = el("button", { className: "btn btn-secondary", text: "Начать заново", attrs: { id: "goRestart", type: "button" } });

  const goActions = el("div", { className: "modal-actions", children: [btnSave, btnRestart] });
  const gameOverModal = el("div", {
    className: "modal hidden",
    attrs: { id: "modalGameOver", role: "dialog", "aria-modal": "true" },
    children: [goTitle, goMsg, nameInput, goActions]
  });

  // Leaders modal
  const leadersTitle = el("div", { className: "modal-title", text: "Таблица лидеров (Top-10)" });
  const closeLeaders = el("button", { className: "btn btn-secondary", text: "Закрыть", attrs: { id: "leadersClose", type: "button" } });
  const table = el("table", { className: "leaders-table", attrs: { id: "leadersTable" } });

  const leadersModal = el("div", {
    className: "modal hidden",
    attrs: { id: "modalLeaders", role: "dialog", "aria-modal": "true" },
    children: [leadersTitle, table, closeLeaders]
  });

  overlay.appendChild(gameOverModal);
  overlay.appendChild(leadersModal);
  root.appendChild(overlay);
}

export function showModal(selector) {
  const overlay = document.querySelector("#overlay");
  const go = document.querySelector("#modalGameOver");
  const лид = document.querySelector("#modalLeaders");
  overlay.classList.remove("hidden");
  go.classList.add("hidden");
  лид.classList.add("hidden");
  document.querySelector(selector).classList.remove("hidden");
}

export function hideAllModals() {
  document.querySelector("#overlay").classList.add("hidden");
  document.querySelector("#modalGameOver").classList.add("hidden");
  document.querySelector("#modalLeaders").classList.add("hidden");
}

export function resetGameOverUI() {
  const msg = document.querySelector("#goMsg");
  const input = document.querySelector("#goName");
  msg.textContent = "Нет возможных ходов.";
  input.classList.remove("hidden");
  input.value = "";
}

export function setGameOverSavedUI() {
  const msg = document.querySelector("#goMsg");
  const input = document.querySelector("#goName");
  msg.textContent = "Ваш рекорд сохранён.";
  input.classList.add("hidden");
}

export function renderLeadersTable(list) {
  const table = document.querySelector("#leadersTable");
  const head = `
    <thead>
      <tr><th>#</th><th>Имя</th><th>Очки</th><th>Дата</th></tr>
    </thead>
  `;
  const rows = list.map((x, i) => {
    const d = new Date(x.dateISO);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `<tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(x.name)}</td>
      <td>${x.score}</td>
      <td>${dd}.${mm}.${yy} ${hh}:${mi}</td>
    </tr>`;
  }).join("");

  table.innerHTML = head + `<tbody>${rows || `<tr><td colspan="4">Пока нет рекордов</td></tr>`}</tbody>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
