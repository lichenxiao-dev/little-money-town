function findChange(target, stock) {
  const values = [1, 2, 5, 10], result = [0, 0, 0, 0];
  function search(index, left) {
    if (index < 0) return left === 0;
    for (let count = Math.min(stock[index], Math.floor(left / values[index])); count >= 0; count--) {
      result[index] = count;
      if (search(index - 1, left - count * values[index])) return true;
    }
    return false;
  }
  return search(3, target) ? result : null;
}

function findPacking(items, columns, rows) {
  const occupied = Array(columns * rows).fill(false), result = [], failed = new Set();
  function search(remaining) {
    const index = occupied.indexOf(false);
    if (index < 0) return remaining.length === 0;
    const key = occupied.map(Number).join("") + ":" + remaining.map((p) => [p.w, p.h].sort((a, b) => a - b).join("x")).sort().join(",");
    if (failed.has(key)) return false;
    const x = index % columns, y = Math.floor(index / columns);
    for (const item of remaining) {
      for (const [w, h] of item.w === item.h ? [[item.w, item.h]] : [[item.w, item.h], [item.h, item.w]]) {
        if (x + w > columns || y + h > rows) continue;
        const cells = Array.from({ length: h }, (_, dy) => Array.from({ length: w }, (_, dx) => (y + dy) * columns + x + dx)).flat();
        if (cells.some((cell) => occupied[cell])) continue;
        cells.forEach((cell) => { occupied[cell] = true; });
        result.push({ id: item.id, x, y, w, h });
        if (search(remaining.filter((p) => p.id !== item.id))) return true;
        result.pop();
        cells.forEach((cell) => { occupied[cell] = false; });
      }
    }
    failed.add(key);
    return false;
  }
  return search([...items].sort((a, b) => b.w * b.h - a.w * a.h)) ? result : null;
}

module.exports = { findChange, findPacking };
