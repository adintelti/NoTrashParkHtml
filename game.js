const COLS = 12;
const ROWS = 9;
const WAVES_TO_WIN = 3;

const towers = {
  sentinel: {
    label: "Sentinela",
    cost: 100,
    range: 2.75,
    fireRate: 1,
    damage: 18,
    projectileSpeed: 7.5,
    className: "tower-sentinel",
    projectileClass: ""
  },
  slow: {
    label: "Gelida",
    cost: 75,
    range: 2.35,
    fireRate: 0.8,
    damage: 7,
    projectileSpeed: 6.6,
    slowFactor: 0.45,
    slowDuration: 1.8,
    className: "tower-slow",
    projectileClass: "projectile-slow"
  },
  splash: {
    label: "Canhao",
    cost: 125,
    range: 2.45,
    fireRate: 0.55,
    damage: 24,
    projectileSpeed: 6,
    splash: 0.82,
    className: "tower-splash",
    projectileClass: "projectile-splash"
  },
  flame: {
    label: "Chama",
    cost: 150,
    range: 1.85,
    fireRate: 2.8,
    damage: 9,
    projectileSpeed: 8.5,
    className: "tower-flame",
    projectileClass: "projectile-flame"
  }
};

const maps = {
  park: {
    boardClass: "theme-park",
    name: "Parque",
    blocked: ["0,1", "1,4", "10,1", "11,6", "2,8", "9,8"],
    path: [
      [3, 0], [3, 1], [3, 2], [4, 2], [4, 3], [5, 3], [6, 3],
      [6, 4], [7, 4], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6], [10, 7], [10, 8]
    ]
  },
  lagoon: {
    boardClass: "theme-lagoon",
    name: "Lagoa",
    blocked: ["0,6", "1,8", "3,1", "4,0", "6,1", "8,7", "10,5"],
    path: [
      [4, 0], [5, 0], [6, 0], [7, 0], [7, 1], [7, 2], [6, 2],
      [5, 2], [5, 3], [5, 4], [6, 4], [7, 4], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6], [11, 6]
    ]
  },
  lava: {
    boardClass: "theme-lava",
    name: "Fogo",
    blocked: ["2,2", "3,2", "8,2", "9,5", "5,7"],
    path: [
      [1, 0], [2, 0], [3, 0], [3, 1], [4, 1], [4, 2], [5, 2],
      [5, 3], [6, 3], [7, 3], [8, 3], [8, 4], [8, 5], [9, 5], [10, 5], [10, 6], [10, 7], [10, 8]
    ]
  }
};

const enemyTypes = [
  { className: "enemy-runner", hp: 42, speed: 1.22, reward: 8 },
  { className: "enemy-brute", hp: 78, speed: 0.78, reward: 14 },
  { className: "enemy-shield", hp: 105, speed: 0.64, reward: 18 }
];

const themeOrder = ["park", "lagoon", "lava"];
const victoryTitles = {
  park: "Parque Protegido!",
  lagoon: "Lagoa Protegida!",
  lava: "Parabéns você protegeu todos os biomas"
};

const dom = {
  menu: document.getElementById("menuScreen"),
  game: document.getElementById("gameScreen"),
  board: document.getElementById("board"),
  playButton: document.getElementById("playButton"),
  configButton: document.getElementById("configButton"),
  configPanel: document.getElementById("configPanel"),
  exitButton: document.getElementById("exitButton"),
  backToMenuButton: document.getElementById("backToMenuButton"),
  coinText: document.getElementById("coinText"),
  livesText: document.getElementById("livesText"),
  waveText: document.getElementById("waveText"),
  heartStack: document.getElementById("heartStack"),
  floatingMessage: document.getElementById("floatingMessage"),
  victoryOverlay: document.getElementById("victoryOverlay"),
  victoryTitle: document.getElementById("victoryTitle"),
  victoryContinueButton: document.getElementById("victoryContinueButton"),
  victoryRestartButton: document.getElementById("victoryRestartButton"),
  victoryMenuButton: document.getElementById("victoryMenuButton"),
  pauseButton: document.getElementById("pauseButton"),
  speedButton: document.getElementById("speedButton"),
  restartButton: document.getElementById("restartButton"),
  towerShop: document.getElementById("towerShop")
};

let state = createFreshState("park");
let lastFrame = performance.now();
let messageTimer = 0;
let resizeObserver;

function createFreshState(theme = "park") {
  return {
    theme,
    selectedTower: "sentinel",
    coins: 300,
    lives: 10,
    wave: 0,
    enemies: [],
    placedTowers: [],
    projectiles: [],
    impacts: [],
    occupied: new Set(),
    spawnRemaining: 0,
    spawnTimer: 0,
    waveCooldown: 1.2,
    speed: 1,
    paused: false,
    running: false,
    gameOver: false,
    victoryShown: false,
    victoryPending: false,
    simTime: 0,
    nextEnemyId: 1,
    nextProjectileId: 1
  };
}

function startGame(theme = state.theme) {
  state = createFreshState(theme);
  state.running = true;
  syncThemeButtons(theme);
  dom.menu.classList.add("is-hidden");
  dom.game.classList.remove("is-hidden");
  hideVictory();
  buildBoard();
  updateHud();
  showMessage("Escolha uma torre e clique no mapa.");
}

function returnToMenu() {
  state.running = false;
  hideVictory();
  clearDynamicElements();
  dom.game.classList.add("is-hidden");
  dom.menu.classList.remove("is-hidden");
}

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

function coordKey(x, y) {
  return `${x},${y}`;
}

function getPathSet(map) {
  return new Set(map.path.map(([x, y]) => coordKey(x, y)));
}

function detailClass(x, y) {
  const value = (x * 17 + y * 31) % 5;
  if (value === 1) return "detail-b";
  if (value === 3) return "detail-c";
  return "detail-a";
}

function measureBoard() {
  const rect = dom.board.getBoundingClientRect();
  state.cellW = rect.width / COLS;
  state.cellH = rect.height / ROWS;
  dom.board.style.setProperty("--cell-size", `${Math.min(state.cellW, state.cellH)}px`);
  renderAllPositions();
}

function setTheme(theme) {
  const hadStarted = state.running;
  state.theme = theme;
  syncThemeButtons(theme);
  if (hadStarted) {
    startGame(theme);
  }
}

function syncThemeButtons(theme) {
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === theme);
  });
  document.querySelectorAll("[data-menu-theme]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.menuTheme === theme);
  });
}

function getNextTheme(theme) {
  const index = themeOrder.indexOf(theme);
  return index >= 0 ? themeOrder[index + 1] : undefined;
}

function placeTower(x, y) {
  if (!state.running || state.paused || state.gameOver) return;

  const key = coordKey(x, y);
  const towerDef = towers[state.selectedTower];
  if (state.pathSet.has(key) || state.blockedSet.has(key) || state.occupied.has(key)) {
    showMessage("Espaco bloqueado.");
    return;
  }
  if (state.coins < towerDef.cost) {
    showMessage("Moedas insuficientes.");
    return;
  }

  state.coins -= towerDef.cost;
  state.occupied.add(key);

  const el = document.createElement("div");
  el.className = `tower ${towerDef.className}`;
  el.dataset.tower = state.selectedTower;
  dom.board.appendChild(el);

  const tower = {
    x: x + 0.5,
    y: y + 0.5,
    type: state.selectedTower,
    cooldown: 0,
    el
  };

  state.placedTowers.push(tower);
  setElementPosition(el, tower.x, tower.y);
  updateHud();
}

function startNextWave() {
  if (state.gameOver) return;
  if (state.wave + 1 >= WAVES_TO_WIN && !state.victoryShown) {
    state.wave = WAVES_TO_WIN;
    state.victoryShown = true;
    state.victoryPending = true;
    showVictory();
    updateHud();
    return;
  }
  state.wave += 1;
  beginWaveSpawn();
}

function beginWaveSpawn() {
  state.spawnRemaining = 6 + state.wave * 2;
  state.spawnTimer = 0;
  state.victoryPending = false;
  showMessage(`Onda ${state.wave}`);
  updateHud();
}

function spawnEnemy() {
  const path = maps[state.theme].path;
  const tier = state.wave > 4 && state.spawnRemaining % 5 === 0
    ? 2
    : state.wave > 2 && state.spawnRemaining % 3 === 0
      ? 1
      : 0;
  const type = enemyTypes[tier];
  const maxHp = Math.round(type.hp * (1 + state.wave * 0.12));
  const el = document.createElement("div");
  el.className = `enemy ${type.className}`;
  el.innerHTML = '<div class="health"><span></span></div>';
  dom.board.appendChild(el);

  const enemy = {
    id: state.nextEnemyId,
    x: path[0][0] + 0.5,
    y: path[0][1] + 0.5,
    pathIndex: 0,
    maxHp,
    hp: maxHp,
    speed: type.speed * (1 + Math.min(state.wave, 8) * 0.025),
    reward: type.reward,
    slowUntil: 0,
    slowFactor: 1,
    el
  };

  state.nextEnemyId += 1;
  state.enemies.push(enemy);
  setElementPosition(el, enemy.x, enemy.y);
}

function update(dt) {
  if (!state.running || state.paused || state.gameOver || state.victoryPending) return;

  state.simTime += dt;

  if (state.spawnRemaining <= 0 && state.enemies.length === 0) {
    state.waveCooldown -= dt;
    if (state.waveCooldown <= 0) {
      state.waveCooldown = 2.4;
      startNextWave();
    }
  }

  if (state.spawnRemaining > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy();
      state.spawnRemaining -= 1;
      state.spawnTimer = Math.max(0.36, 0.86 - state.wave * 0.025);
    }
  }

  moveEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateImpacts(dt);
  updateHud();
}

function moveEnemies(dt) {
  const path = maps[state.theme].path.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
  const leaked = [];

  state.enemies.forEach((enemy) => {
    let distance = enemy.speed * (enemy.slowUntil > state.simTime ? enemy.slowFactor : 1) * dt;
    while (distance > 0 && enemy.pathIndex < path.length - 1) {
      const target = path[enemy.pathIndex + 1];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const segmentLength = Math.hypot(dx, dy);

      if (segmentLength <= distance) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.pathIndex += 1;
        distance -= segmentLength;
      } else {
        enemy.x += (dx / segmentLength) * distance;
        enemy.y += (dy / segmentLength) * distance;
        distance = 0;
      }
    }

    if (enemy.pathIndex >= path.length - 1) {
      leaked.push(enemy);
    } else {
      enemy.el.classList.toggle("slowed", enemy.slowUntil > state.simTime);
      setElementPosition(enemy.el, enemy.x, enemy.y);
    }
  });

  leaked.forEach((enemy) => {
    removeEnemy(enemy, false);
    state.lives -= 1;
    if (state.lives <= 0) endGame();
  });
}

function updateTowers(dt) {
  state.placedTowers.forEach((tower) => {
    const towerDef = towers[tower.type];
    tower.cooldown -= dt;
    if (tower.cooldown > 0) return;

    const target = findTarget(tower, towerDef.range);
    if (!target) return;

    tower.cooldown = 1 / towerDef.fireRate;
    fireProjectile(tower, target, towerDef);
  });
}

function findTarget(tower, range) {
  let best = null;
  let bestProgress = -1;

  state.enemies.forEach((enemy) => {
    const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    const progress = enemy.pathIndex + distance / 10;
    if (distance <= range && progress > bestProgress) {
      best = enemy;
      bestProgress = progress;
    }
  });

  return best;
}

function fireProjectile(tower, target, towerDef) {
  const el = document.createElement("div");
  el.className = `projectile ${towerDef.projectileClass || ""}`.trim();
  dom.board.appendChild(el);

  const projectile = {
    id: state.nextProjectileId,
    x: tower.x,
    y: tower.y - 0.15,
    targetId: target.id,
    damage: towerDef.damage,
    speed: towerDef.projectileSpeed,
    slowFactor: towerDef.slowFactor,
    slowDuration: towerDef.slowDuration,
    splash: towerDef.splash || 0,
    el
  };

  state.nextProjectileId += 1;
  state.projectiles.push(projectile);
  setElementPosition(el, projectile.x, projectile.y);
}

function updateProjectiles(dt) {
  const finished = [];

  state.projectiles.forEach((projectile) => {
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId);
    if (!target) {
      finished.push(projectile);
      return;
    }

    const dx = target.x - projectile.x;
    const dy = target.y - projectile.y;
    const distance = Math.hypot(dx, dy);
    const travel = projectile.speed * dt;

    if (distance <= travel) {
      projectile.x = target.x;
      projectile.y = target.y;
      hitEnemy(projectile, target);
      finished.push(projectile);
    } else {
      projectile.x += (dx / distance) * travel;
      projectile.y += (dy / distance) * travel;
      setElementPosition(projectile.el, projectile.x, projectile.y);
    }
  });

  finished.forEach(removeProjectile);
}

function hitEnemy(projectile, target) {
  if (projectile.splash) {
    createImpact(projectile.x, projectile.y);
    state.enemies.slice().forEach((enemy) => {
      const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
      if (distance <= projectile.splash) {
        damageEnemy(enemy, Math.round(projectile.damage * (1 - distance / (projectile.splash * 1.55))));
      }
    });
  } else {
    damageEnemy(target, projectile.damage);
  }

  if (projectile.slowFactor) {
    target.slowFactor = projectile.slowFactor;
    target.slowUntil = Math.max(target.slowUntil, state.simTime + projectile.slowDuration);
  }
}

function damageEnemy(enemy, amount) {
  enemy.hp -= Math.max(1, amount);
  const bar = enemy.el.querySelector(".health span");
  if (bar) {
    bar.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
  }
  if (enemy.hp <= 0) {
    removeEnemy(enemy, true);
  }
}

function removeEnemy(enemy, awardCoins) {
  const index = state.enemies.indexOf(enemy);
  if (index >= 0) {
    state.enemies.splice(index, 1);
  }
  enemy.el?.remove();
  if (awardCoins) {
    state.coins += enemy.reward;
  }
}

function removeProjectile(projectile) {
  const index = state.projectiles.indexOf(projectile);
  if (index >= 0) {
    state.projectiles.splice(index, 1);
  }
  projectile.el?.remove();
}

function createImpact(x, y) {
  const el = document.createElement("div");
  el.className = "impact";
  dom.board.appendChild(el);
  const impact = {
    x,
    y,
    life: 0.22,
    el
  };
  state.impacts.push(impact);
  setElementPosition(el, x, y);
}

function updateImpacts(dt) {
  state.impacts = state.impacts.filter((impact) => {
    impact.life -= dt;
    if (impact.life <= 0) {
      impact.el.remove();
      return false;
    }
    return true;
  });
}

function endGame() {
  state.gameOver = true;
  hideVictory();
  state.lives = 0;
  showMessage(`Fim de jogo. Onda ${state.wave}.`);
  updateHud();
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

function updateHud() {
  dom.coinText.textContent = String(state.coins);
  dom.livesText.textContent = String(state.lives);
  dom.waveText.textContent = String(state.wave);
  dom.pauseButton.textContent = state.paused ? "Retomar" : "Pause";
  dom.speedButton.textContent = `${state.speed}x`;
  dom.heartStack.innerHTML = "";
  const shownLives = Math.min(5, state.lives);
  for (let i = 0; i < shownLives; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart-dot";
    dom.heartStack.appendChild(heart);
  }

  document.querySelectorAll(".shop-button[data-tower]").forEach((button) => {
    const towerKey = button.dataset.tower;
    button.classList.toggle("is-active", towerKey === state.selectedTower);
    button.disabled = state.coins < towers[towerKey].cost;
  });
}

function showMessage(text) {
  dom.floatingMessage.textContent = text;
  dom.floatingMessage.classList.add("is-visible");
  messageTimer = 2.2;
}

function showVictory() {
  const hasNextTheme = Boolean(getNextTheme(state.theme));
  dom.victoryTitle.textContent = victoryTitles[state.theme] || "Vitoria!";
  dom.victoryContinueButton.hidden = !hasNextTheme;
  dom.victoryOverlay.classList.toggle("is-final-victory", !hasNextTheme);
  dom.victoryOverlay.hidden = false;
  dom.floatingMessage.classList.remove("is-visible");
  messageTimer = 0;
}

function hideVictory() {
  dom.victoryOverlay.hidden = true;
  dom.victoryContinueButton.hidden = false;
  dom.victoryOverlay.classList.remove("is-final-victory");
}

function tick(now) {
  const rawDt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  if (messageTimer > 0) {
    messageTimer -= rawDt;
    if (messageTimer <= 0) {
      dom.floatingMessage.classList.remove("is-visible");
    }
  }

  update(rawDt * state.speed);
  requestAnimationFrame(tick);
}

function bindEvents() {
  dom.playButton.addEventListener("click", () => startGame(state.theme));
  dom.configButton.addEventListener("click", () => {
    dom.configPanel.hidden = !dom.configPanel.hidden;
  });
  dom.exitButton.addEventListener("click", () => {
    dom.configPanel.hidden = true;
    showMenuNote("Demo pronta no navegador.");
  });
  dom.backToMenuButton.addEventListener("click", returnToMenu);
  dom.pauseButton.addEventListener("click", () => {
    state.paused = !state.paused;
    updateHud();
  });
  dom.speedButton.addEventListener("click", () => {
    state.speed = state.speed === 1 ? 2 : 1;
    updateHud();
  });
  dom.restartButton.addEventListener("click", () => startGame(state.theme));
  dom.victoryContinueButton.addEventListener("click", () => {
    const nextTheme = getNextTheme(state.theme);
    if (nextTheme) {
      startGame(nextTheme);
      return;
    }
    hideVictory();
    beginWaveSpawn();
  });
  dom.victoryRestartButton.addEventListener("click", () => startGame(state.theme));
  dom.victoryMenuButton.addEventListener("click", returnToMenu);

  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
  });

  document.querySelectorAll("[data-menu-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.menuTheme;
      state.theme = theme;
      syncThemeButtons(theme);
    });
  });

  dom.towerShop.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tower]");
    if (!button || button.disabled) return;
    state.selectedTower = button.dataset.tower;
    updateHud();
  });

  dom.board.addEventListener("click", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    placeTower(Number(tile.dataset.x), Number(tile.dataset.y));
  });

  window.addEventListener("resize", measureBoard);

  resizeObserver = new ResizeObserver(measureBoard);
  resizeObserver.observe(dom.board);
}

function showMenuNote(text) {
  const note = document.createElement("div");
  note.className = "config-panel";
  note.textContent = text;
  note.style.top = "auto";
  note.style.bottom = "24px";
  note.style.right = "24px";
  dom.menu.appendChild(note);
  setTimeout(() => note.remove(), 1800);
}

bindEvents();
buildBoard();
updateHud();
requestAnimationFrame(tick);
