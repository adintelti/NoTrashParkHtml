const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function element() {
  const classes = new Set();
  return {
    hidden: false, disabled: false, textContent: "", dataset: {},
    classList: {
      add(...items) { items.forEach((item) => classes.add(item)); },
      remove(...items) { items.forEach((item) => classes.delete(item)); },
      contains(item) { return classes.has(item); },
      toggle(item, active = !classes.has(item)) { active ? classes.add(item) : classes.delete(item); },
      [Symbol.iterator]() { return classes.values(); }
    },
    style: { setProperty() {} }, appendChild() {}, remove() {}, setAttribute() {},
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }
  };
}

function createGame() {
  const records = new Map();
  const context = vm.createContext({
    window: { NTP: {}, performance: { now: () => 1000 }, setTimeout: () => 1, clearTimeout() {} },
    document: { createElement: element }
  });
  function load(file) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
  load("src/constants.js");
  load("src/data.js");
  load("src/evaluation.js");
  load("src/state.js");
  load("src/i18n.js");
  const game = context.window.NTP;
  const dom = Object.fromEntries([
    "board", "menu", "game", "configPanel", "continueButton", "towerShop", "pauseButton",
    "speedButton", "deleteTowerButton", "tutorialPanel", "tutorialTitle", "tutorialInstructions",
    "tutorialObjective", "tutorialContinueButton"
  ].map((key) => [key, element()]));
  let pauseOpen = false;
  let victories = 0;
  Object.assign(game, {
    dom,
    records,
    coordKey: (x, y) => `${x},${y}`,
    doesTowerReachPath: () => true,
    buildBoard() {
      const map = game.maps[game.state.theme];
      game.state.pathSet = new Set(map.path.map(([x, y]) => `${x},${y}`));
      game.state.blockedSet = new Set(map.blocked);
      game.state.pathCenters = map.path.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
    },
    updateHud() { game.syncTutorialUi?.(); },
    ensureSelectedTowerUnlocked() {},
    setElementPosition() {},
    closeDifficultyPanel() {}, clearDynamicElements() {}, refreshPlacementPreview() {},
    showMessage() {}, showWaveTransition() {}, hideWaveTransition() {},
    hideCardChoice() {}, hideExitConfirm() {}, hideRestartConfirm() {}, hideTowerDeleteConfirm() {},
    hidePlacementPreview() {}, hideVictory() {}, syncThemeButtons() {},
    showCardChoice() {}, showGameOver() {}, showTowerDeleteConfirm() {},
    showPauseMenu() { pauseOpen = true; }, hidePauseMenu() { pauseOpen = false; },
    isPauseMenuOpen: () => pauseOpen, isVictoryOpen: () => false,
    showVictory() { victories += 1; }, victoryCount: () => victories,
    playSfx() {}, duckMusic() {}, stopMusic() {}, renderPhaseEvaluation() {},
    writePersistentJson(key, value) { records.set(key, JSON.parse(JSON.stringify(value))); return true; },
    readPersistentJsonSync(key) { return records.get(key) || null; },
    readPersistentJson(key) { return Promise.resolve(records.get(key) || null); },
    removePersistentJson(key) { records.delete(key); }
  });
  load("src/gameplay.js");
  load("src/tutorial.js");
  load("src/save-game.js");
  return game;
}

function build(game, type, x, y) {
  game.state.selectedTower = type;
  game.placeTower(x, y);
}

function finishTutorialWave(game) {
  for (let tick = 0; tick < 20000; tick += 1) {
    game.update(0.1, 0.1 / game.state.speed);
    if (game.state.tutorial.waiting || game.state.victoryPending) return;
  }
  assert.fail("Tutorial wave did not end");
}

test("tutorial is restricted to Park and five waves, and preserves the normal save through completion", () => {
  const game = createGame();
  game.settings.cardFrequency = 1;
  game.startGame("lagoon", { waveLimit: 20 });
  assert.equal(game.saveGame(), true);
  const saved = JSON.stringify(game.records.get("ntp.savedGame"));
  game.startGame("halloween", { gameMode: "tutorial", waveLimit: 99 });
  assert.equal(game.state.theme, "park");
  assert.equal(game.state.waveLimit, 5);
  assert.equal(game.canSaveGame(), false);
  assert.equal(game.autosaveGame("pagehide"), false);
  game.update(100);
  assert.equal(game.state.wave, 0);
  game.continueTutorial();
  assert.equal(game.state.wave, 0);

  build(game, "sentinel", 4, 1);
  game.continueTutorial();
  finishTutorialWave(game);
  assert.equal(game.state.wave, 1);
  assert.equal(game.state.cardChoice.active, false);
  game.continueTutorial();
  assert.equal(game.state.wave, 1);
  build(game, "slow", 5, 2);
  game.continueTutorial();
  finishTutorialWave(game);
  assert.equal(game.state.wave, 2);

  build(game, "sentinel", 7, 3);
  game.undoLastTowerPlacement();
  assert.equal(game.state.tutorial.removedTower, true);
  game.continueTutorial();
  finishTutorialWave(game);
  assert.equal(game.state.wave, 3);
  game.continueTutorial();
  assert.equal(game.state.wave, 3);
  game.openPauseMenu();
  game.closePauseMenu();
  game.toggleSpeed();
  game.continueTutorial();
  finishTutorialWave(game);
  assert.equal(game.state.wave, 4);
  game.continueTutorial();
  finishTutorialWave(game);

  assert.equal(game.state.wave, 5);
  assert.equal(game.state.phaseStats.completedWaves, 5);
  assert.equal(game.state.bossEncounters, 1);
  assert.equal(game.state.phaseStats.bossesSpawned, 1);
  assert.equal(game.state.phaseStats.defeated + game.state.phaseStats.escaped, game.state.phaseStats.enemiesSpawned);
  assert.equal(game.state.victoryPending, true);
  assert.equal(game.victoryCount(), 1);
  assert.equal(game.state.phaseResult, null);
  assert.equal(game.records.get("ntp.tutorialProgress").completed, true);
  assert.equal(JSON.stringify(game.records.get("ntp.savedGame")), saved);
  game.update(100);
  assert.equal(game.state.wave, 5);
  assert.equal(game.loadSavedGame(), true);
  assert.equal(game.state.theme, "lagoon");
  assert.equal(game.state.gameMode, "normal");
  assert.equal(game.state.tutorial, null);
});

test("tutorial leaks cannot end the practice, and replay keeps the five-wave limit", () => {
  const game = createGame();
  game.startTutorial();
  build(game, "sentinel", 4, 1);
  game.continueTutorial();
  game.state.lives = 1;
  game.update(0);
  game.state.enemies[0].pathIndex = game.maps.park.path.length - 1;
  game.update(0);
  assert.equal(game.state.lives, 1);
  assert.equal(game.state.gameOver, false);
  game.startGame(game.state.theme, { gameMode: game.state.gameMode, waveLimit: 12 });
  assert.equal(game.state.waveLimit, 5);
  assert.equal(game.state.wave, 0);
  assert.equal(game.state.tutorial.waiting, true);
});

test("rating thresholds count cumulative losses and require every boss for two or three stars", () => {
  const game = createGame();
  const stats = { ...game.createPhaseStats(), bossesSpawned: 2, bossesDefeated: 2 };
  assert.equal(game.evaluatePhase(stats, 10, true).stars, 3);
  assert.equal(game.evaluatePhase({ ...stats, damageTaken: 3 }, 10, true).stars, 2);
  assert.equal(game.evaluatePhase({ ...stats, damageTaken: 4 }, 10, true).stars, 1);
  assert.equal(game.evaluatePhase({ ...stats, bossesDefeated: 1 }, 10, true).stars, 1);
  assert.equal(game.evaluatePhase(stats, 10, false).stars, 0);
});

test("combat records losses even after healing, and defeat includes the current wave", () => {
  const game = createGame();
  game.startGame("park", { waveLimit: 5 });
  game.startNextWave();
  game.update(0);
  game.state.enemies[0].pathIndex = game.maps.park.path.length - 1;
  game.update(0);
  assert.equal(game.state.phaseStats.damageTaken, 1);
  assert.equal(game.state.phaseStats.escaped, 1);
  assert.equal(game.state.phaseStats.firstLeakWave, 1);
  game.state.lives = game.state.maxLives;
  assert.equal(game.evaluatePhase(game.state.phaseStats, 10, true).stars, 2);
  game.state.spawnTimer = 0;
  game.update(0);
  game.state.lives = 1;
  game.state.enemies[0].pathIndex = game.maps.park.path.length - 1;
  game.update(0);
  assert.equal(game.state.gameOver, true);
  assert.equal(game.state.phaseResult.stars, 0);
  assert.equal(game.state.phaseResult.stats.escaped, 2);
  assert.equal(game.state.phaseResult.stats.completedWaves, 0);
});

test("ratings survive save/load; legacy saves remain playable without inventing a rating", () => {
  const game = createGame();
  game.startGame("park", { waveLimit: 12 });
  game.state.phaseStats.damageTaken = 4;
  game.state.phaseStats.perfectWaves = 2;
  game.state.phaseStats.completedWaves = 3;
  const stats = JSON.stringify(game.state.phaseStats);
  game.saveGame();
  game.state.phaseStats.damageTaken = 0;
  game.loadSavedGame();
  assert.equal(JSON.stringify(game.state.phaseStats), stats);
  const legacy = JSON.parse(JSON.stringify(game.records.get("ntp.savedGame")));
  delete legacy.state.phaseStats;
  const legacyGame = createGame();
  legacyGame.records.set("ntp.savedGame", legacy);
  assert.equal(legacyGame.loadSavedGame(), true);
  assert.equal(legacyGame.state.phaseStats.eligible, false);
  assert.equal(legacyGame.evaluatePhase(legacyGame.state.phaseStats, 10, true).stars, null);
});

test("Halloween illusions do not inflate enemy or escape statistics", () => {
  const game = createGame();
  game.startGame("halloween", { waveLimit: 5 });
  game.state.wave = 5;
  game.state.waveInProgress = true;
  game.update(0);
  game.update(0, 2);
  const boss = game.state.enemies[0];
  assert.equal(boss.bossKey, "halloween");
  boss.hp = boss.maxHp * 0.5;
  game.update(0);
  game.update(2);
  const decoys = game.state.enemies.filter((enemy) => enemy.isDecoy);
  assert.equal(decoys.length, 2);
  assert.equal(game.state.phaseStats.enemiesSpawned, 1);
  decoys.forEach((enemy) => { enemy.pathIndex = game.maps.halloween.path.length - 1; });
  game.update(0);
  assert.equal(game.state.phaseStats.escaped, 0);
  assert.equal(game.state.phaseStats.damageTaken, 0);
  boss.pathIndex = game.maps.halloween.path.length - 1;
  game.update(0);
  assert.equal(game.state.phaseStats.escaped, 1);
  assert.equal(game.state.phaseStats.bossesDefeated, 0);
});

test("speed does not affect stars, and records are separated by gameplay settings", () => {
  const game = createGame();
  const stats = game.createPhaseStats();
  game.state.speed = 1;
  const first = game.evaluatePhase(stats, 10, true);
  game.state.speed = 2;
  assert.deepEqual(game.evaluatePhase(stats, 10, true), first);
  const normal = game.getPhaseRecordKey(game.state);
  assert.notEqual(game.getPhaseRecordKey({ ...game.state, theme: "lagoon" }), normal);
  assert.notEqual(game.getPhaseRecordKey({ ...game.state, waveLimit: 20 }), normal);
  assert.notEqual(game.getPhaseRecordKey({ ...game.state, phaseCardFrequency: 0 }), normal);
  assert.notEqual(game.getPhaseRecordKey({ ...game.state, bossEncountersAtBiomeStart: 2 }), normal);
});

test("a weaker victory or a defeat never overwrites the best record", async () => {
  const game = createGame();
  game.startGame("park", { waveLimit: 5 });
  const key = game.getPhaseRecordKey(game.state);
  game.records.set(key, { stars: 3, damageTaken: 0, perfectWaves: 5 });
  game.state.phaseStats.damageTaken = 3;
  game.finishPhaseEvaluation(true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(game.records.get(key).stars, 3);
  assert.equal(game.state.phaseResult.newRecord, false);
  assert.equal(game.state.phaseResult.bestStars, 3);
  game.state.phaseResult = null;
  game.finishPhaseEvaluation(false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(game.records.get(key).stars, 3);
});

test("first victory creates a record and all new messages resolve in every language", async () => {
  const game = createGame();
  game.startGame("park", { waveLimit: 5 });
  game.finishPhaseEvaluation(true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(game.state.phaseResult.newRecord, true);
  assert.equal(game.records.get(game.getPhaseRecordKey(game.state)).stars, 3);
  for (const language of game.SUPPORTED_LANGUAGES) {
    game.settings.language = language;
    for (const key of ["tutorial.menu", "tutorial.steps.boss", "tutorial.objectives.tools", "evaluation.criteria", "evaluation.tips.leak"]) {
      assert.notEqual(game.t(key), key);
    }
  }
});
