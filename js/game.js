"use strict";

export const SIZE = 4;

export function createEmptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function cloneGrid(grid) {
  return grid.map(row => row.slice());
}

function emptyCells(grid) {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

export function spawnRandomTiles(grid, count = 1) {
  const empties = emptyCells(grid);
  if (empties.length === 0) return false;

  const n = Math.min(count, empties.length);
  for (let i = 0; i < n; i++) {
    const now = emptyCells(grid);
    if (now.length === 0) break;

    const idx = Math.floor(Math.random() * now.length);
    const { r, c } = now[idx];

    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  return true;
}

export function compressAndMergeLine(line) {
  const original = line.slice();
  let arr = line.filter(x => x !== 0);

  let gained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gained += arr[i];
      arr[i + 1] = 0;
      i++; 
    }
  }

  arr = arr.filter(x => x !== 0);
  while (arr.length < SIZE) arr.push(0);

  const changed = arr.some((v, i) => v !== original[i]);
  return { line: arr, gained, changed };
}

function reverseRows(grid) {
  return grid.map(row => row.slice().reverse());
}

function transpose(grid) {
  const t = createEmptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      t[r][c] = grid[c][r];
    }
  }
  return t;
}

function moveLeft(grid) {
  const g = cloneGrid(grid);
  let gained = 0;
  let changedAny = false;

  for (let r = 0; r < SIZE; r++) {
    const res = compressAndMergeLine(g[r]);
    g[r] = res.line;
    gained += res.gained;
    if (res.changed) changedAny = true;
  }

  return { grid: g, scoreGained: gained, changed: changedAny };
}

export function applyMove(grid, dir) {
  let work = cloneGrid(grid);
  let res;

  if (dir === "left") {
    res = moveLeft(work);
  } else if (dir === "right") {
    work = reverseRows(work);
    res = moveLeft(work);
    res.grid = reverseRows(res.grid);
  } else if (dir === "up") {
    work = transpose(work);
    res = moveLeft(work);
    res.grid = transpose(res.grid);
  } else if (dir === "down") {
    work = transpose(work);
    work = reverseRows(work);
    res = moveLeft(work);
    res.grid = reverseRows(res.grid);
    res.grid = transpose(res.grid);
  } else {
    res = { grid: cloneGrid(grid), scoreGained: 0, changed: false };
  }

  return res;
}

export function canMove(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
    }
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
    }
  }
  return false;
}
