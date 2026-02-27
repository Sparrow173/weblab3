"use strict";

const LS_GAME = "gameState2048";
const LS_LEADERS = "leaders2048";

export function saveGameState(state) {
  localStorage.setItem(LS_GAME, JSON.stringify(state));
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(LS_GAME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGameState() {
  localStorage.removeItem(LS_GAME);
}

export function loadLeaders() {
  try {
    const raw = localStorage.getItem(LS_LEADERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLeaders(list) {
  localStorage.setItem(LS_LEADERS, JSON.stringify(list));
}

export function addLeaderRecord(name, score) {
  const leaders = loadLeaders();

  leaders.push({
    name,
    score,
    dateISO: new Date().toISOString(),
  });

  // сортируем по очкам по убыванию
  leaders.sort((a, b) => b.score - a.score);

  // оставляем top-10
  const top10 = leaders.slice(0, 10);
  saveLeaders(top10);

  return top10;
}
