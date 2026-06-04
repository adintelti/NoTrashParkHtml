(() => {
  const ntp = window.NTP = window.NTP || {};
  const { COLS, ROWS, coordKey, dom, maps, state, towers } = ntp;

  let placementPreview = null;
  let highlightedPreviewTiles = [];
  let lastPreviewSignature = "";

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
    placementPreview = null;
    highlightedPreviewTiles = [];
    lastPreviewSignature = "";
    createPlacementPreviewElements();
    measureBoard();
  }

  function clearDynamicElements() {
    hidePlacementPreview();
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
    renderPlacementPreview();
  }

  function isBuildableTile(x, y) {
    const key = coordKey(x, y);
    return Boolean(state.pathSet)
      && !state.pathSet.has(key)
      && !state.blockedSet.has(key)
      && !state.occupied.has(key);
  }

  function doesTowerReachPath(x, y, range) {
    return getPathTilesInRange(x + 0.5, y + 0.5, range).length > 0;
  }

  function getTileAt(x, y) {
    return dom.board.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  }

  function createPlacementPreviewElements() {
    const rangeEl = document.createElement("div");
    rangeEl.className = "placement-range";
    rangeEl.setAttribute("aria-hidden", "true");
    rangeEl.hidden = true;

    const ghostEl = document.createElement("div");
    ghostEl.className = "tower placement-ghost";
    ghostEl.setAttribute("aria-hidden", "true");
    ghostEl.hidden = true;

    dom.board.append(rangeEl, ghostEl);
    placementPreview = {
      x: null,
      y: null,
      rangeEl,
      ghostEl,
      visible: false
    };
  }

  function updatePlacementPreview(x, y) {
    if (!placementPreview) createPlacementPreviewElements();
    if (!state.running || state.paused || state.gameOver || !Number.isFinite(x) || !Number.isFinite(y)) {
      hidePlacementPreview();
      return;
    }

    const towerDef = towers[state.selectedTower];
    if (!towerDef) {
      hidePlacementPreview();
      return;
    }

    placementPreview.x = x;
    placementPreview.y = y;
    placementPreview.visible = true;
    renderPlacementPreview();
  }

  function refreshPlacementPreview() {
    if (!placementPreview?.visible) return;
    renderPlacementPreview();
  }

  function hidePlacementPreview() {
    if (!placementPreview) return;
    placementPreview.x = null;
    placementPreview.y = null;
    placementPreview.visible = false;
    placementPreview.rangeEl.hidden = true;
    placementPreview.ghostEl.hidden = true;
    clearPreviewTileHighlights();
    lastPreviewSignature = "";
  }

  function renderPlacementPreview() {
    if (!placementPreview?.visible || !state.cellW || !state.cellH) return;
    if (!state.running || state.paused || state.gameOver || state.victoryPending) {
      hidePlacementPreview();
      return;
    }

    const towerDef = towers[state.selectedTower];
    if (!towerDef) {
      hidePlacementPreview();
      return;
    }

    const { x, y, rangeEl, ghostEl } = placementPreview;
    const reachesPath = doesTowerReachPath(x, y, towerDef.range);
    const isAvailable = isBuildableTile(x, y) && state.coins >= towerDef.cost && reachesPath;
    const signature = [
      x,
      y,
      state.selectedTower,
      towerDef.range,
      state.cellW,
      state.cellH,
      isAvailable,
      reachesPath
    ].join("|");

    if (signature === lastPreviewSignature) return;
    lastPreviewSignature = signature;

    const centerX = x + 0.5;
    const centerY = y + 0.5;
    const rangeDiameter = towerDef.range * 2;

    rangeEl.hidden = false;
    rangeEl.dataset.tower = state.selectedTower;
    rangeEl.style.width = `${rangeDiameter * state.cellW}px`;
    rangeEl.style.height = `${rangeDiameter * state.cellH}px`;
    rangeEl.classList.toggle("is-unavailable", !isAvailable);
    setElementPosition(rangeEl, centerX, centerY);

    ghostEl.hidden = false;
    ghostEl.className = `tower placement-ghost ${towerDef.className}`;
    ghostEl.dataset.tower = state.selectedTower;
    ghostEl.classList.toggle("is-unavailable", !isAvailable);
    setElementPosition(ghostEl, centerX, centerY);

    applyPreviewTileHighlights(centerX, centerY, towerDef.range, isAvailable);
  }

  function applyPreviewTileHighlights(centerX, centerY, range, isAvailable) {
    clearPreviewTileHighlights();

    getPathTilesInRange(centerX, centerY, range).forEach((tile) => {
      tile.classList.add("placement-preview-path");
      tile.classList.toggle("placement-preview-unavailable", !isAvailable);
      highlightedPreviewTiles.push(tile);
    });
  }

  function getPathTilesInRange(centerX, centerY, range) {
    return Array.from(dom.board.querySelectorAll(".tile.path")).filter((tile) => {
      const tileCenterX = Number(tile.dataset.x) + 0.5;
      const tileCenterY = Number(tile.dataset.y) + 0.5;
      return Math.hypot(tileCenterX - centerX, tileCenterY - centerY) <= range;
    });
  }

  function clearPreviewTileHighlights() {
    highlightedPreviewTiles.forEach((tile) => {
      tile.classList.remove("placement-preview-path", "placement-preview-unavailable");
    });
    highlightedPreviewTiles = [];
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
    doesTowerReachPath,
    getTileAt,
    updatePlacementPreview,
    refreshPlacementPreview,
    hidePlacementPreview
  });
})();
