const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function createGame() {
  const board = { appendChild() {} };
  const document = {
    createElement() {
      return {
        className: "",
        classList: { toggle() {}, add() {}, remove() {} },
        appendChild() {},
        style: { setProperty() {} }
      };
    }
  };
  const context = vm.createContext({ window: { NTP: {} }, document });

  function load(file) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }

  load("src/constants.js");
  load("src/data.js");
  load("src/state.js");
  load("src/i18n.js");
  Object.assign(context.window.NTP, {
    dom: { board },
    showMessage() {},
    showWaveTransition() {},
    hideWaveTransition() {},
    updateHud() {},
    setElementPosition() {}
  });
  load("src/gameplay.js");
  return context.window.NTP;
}

function spawnWave(game, theme, wave) {
  game.resetState(theme, 20);
  const { state } = game;
  state.running = true;
  state.waveInProgress = true;
  state.wave = wave;
  state.spawnRemaining = 6 + wave * 2;
  const count = state.spawnRemaining;

  for (let index = 0; index < count; index += 1) {
    state.spawnTimer = 0;
    game.update(0);
  }

  return {
    classes: state.enemies.map((enemy) => enemy.el.className),
    firstHp: state.enemies[0].maxHp,
    firstSpeed: state.enemies[0].speed,
    spawnInterval: state.spawnTimer
  };
}

test("each biome introduces its enemy mix while increasing baseline pressure", () => {
  const game = createGame();
  const themes = ["park", "lagoon", "lava", "halloween"];
  const opening = themes.map((theme) => spawnWave(game, theme, 1));

  opening.forEach(({ classes }) => {
    assert.ok(classes.every((className) => className.includes("enemy-runner")));
  });
  for (let index = 1; index < opening.length; index += 1) {
    assert.ok(opening[index].firstHp > opening[index - 1].firstHp);
    assert.ok(opening[index].firstSpeed > opening[index - 1].firstSpeed);
    assert.ok(opening[index].spawnInterval < opening[index - 1].spawnInterval);
  }

  const lagoon = spawnWave(game, "lagoon", 2).classes;
  const lava = spawnWave(game, "lava", 2).classes;
  const halloween = spawnWave(game, "halloween", 2).classes;
  assert.ok(lagoon.some((className) => className.includes("enemy-sprinter")));
  assert.ok(lava.some((className) => className.includes("enemy-shield")));
  assert.ok(halloween.some((className) => className.includes("enemy-sprinter")));
  assert.ok(halloween.some((className) => className.includes("enemy-shield")));
  assert.ok(spawnWave(game, "park", 2).classes.every((className) => className.includes("enemy-runner")));
});

test("the fifth wave still has one boss that scales with each encounter", () => {
  const game = createGame();

  function bossAtRank(previousEncounters) {
    spawnWave(game, "lagoon", 5);
    const { state } = game;
    state.bossEncounters = previousEncounters;
    state.enemies = [];
    state.enemiesById.clear();
    game.update(0);
    game.update(0, 2);
    const bosses = state.enemies.filter((enemy) => enemy.bossKey);
    assert.equal(bosses.length, 1);
    assert.equal(state.bossEncounters, previousEncounters + 1);
    return bosses[0];
  }

  const first = bossAtRank(0);
  const second = bossAtRank(1);
  assert.ok(second.maxHp > first.maxHp);
  assert.ok(second.speed > first.speed);
});
