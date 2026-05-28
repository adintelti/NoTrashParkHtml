(() => {
  const ntp = window.NTP = window.NTP || {};
  const { COLS, ROWS, coordKey, dom, maps, state } = ntp;

  function buildBoard() {
    const map = maps[state.theme];
    const pathSet = getPathSet(map);
    const blockedSet = new Set(map.blocked);
    dom.board.className = `board ${map.boardClass}`;
    dom.board.innerHTML = "";
    dom.board.style.setProperty("--board-cols", COLS);
    dom.board.style.setProperty("--board-rows", ROWS);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const key = coordKey(x, y);
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tile";
        tile.dataset.x = String(x);
        tile.dataset.y = String(y);
        tile.setAttribute("aria-label", `Tile ${x + 1}, ${y + 1}`);
        if (pathSet.has(key)) {
          tile.classList.add("path", "blocked");
        } else if (blockedSet.has(key)) {
          tile.classList.add("terrain", "blocked");
        } else {
          tile.classList.add("terrain", "can-place", detailClass(x, y));
        }
        dom.board.appendChild(tile);
      }
    }

    state.pathSet = pathSet;
    state.blockedSet = blockedSet;
    measureBoard();
  }

  function clearDynamicElements() {
    state.enemies.forEach((enemy) => enemy.el?.remove());
    state.placedTowers.forEach((tower) => tower.el?.remove());
    state.projectiles.forEach((projectile) => projectile.el?.remove());
    state.impacts.forEach((impact) => impact.el?.remove());
    state.enemies = [];
    state.placedTowers = [];
    state.projectiles = [];
    state.impacts = [];
  }

  function detailClass(x, y) {
    const value = (x * 17 + y * 31) % 5;
    if (value === 1) return "detail-b";
    if (value === 3) return "detail-c";
    return "detail-a";
  }

  function getPathSet(map) {
    return new Set(map.path.map(([x, y]) => coordKey(x, y)));
  }

  function measureBoard() {
    const rect = dom.board.getBoundingClientRect();
    state.cellW = rect.width / COLS;
    state.cellH = rect.height / ROWS;
    dom.board.style.setProperty("--cell-size", `${Math.min(state.cellW, state.cellH)}px`);
    renderAllPositions();
  }

  function setElementPosition(el, gridX, gridY) {
    el.style.left = `${gridX * state.cellW}px`;
    el.style.top = `${gridY * state.cellH}px`;
  }

  function renderAllPositions() {
    if (!state.cellW || !state.cellH) return;
    state.placedTowers.forEach((tower) => setElementPosition(tower.el, tower.x, tower.y));
    state.enemies.forEach((enemy) => setElementPosition(enemy.el, enemy.x, enemy.y));
    state.projectiles.forEach((projectile) => setElementPosition(projectile.el, projectile.x, projectile.y));
    state.impacts.forEach((impact) => setElementPosition(impact.el, impact.x, impact.y));
  }

  function isBuildableTile(x, y) {
    const key = coordKey(x, y);
    return Boolean(state.pathSet)
      && !state.pathSet.has(key)
      && !state.blockedSet.has(key)
      && !state.occupied.has(key);
  }

  function getTileAt(x, y) {
    return dom.board.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  }

  Object.assign(ntp, {
    buildBoard,
    clearDynamicElements,
    detailClass,
    getPathSet,
    measureBoard,
    setElementPosition,
    renderAllPositions,
    isBuildableTile,
    getTileAt
  });
})();
