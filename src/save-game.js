(() => {
  const ntp = window.NTP = window.NTP || {};

  const SAVE_STORAGE_KEY = "ntp.savedGame";
  const SAVE_VERSION = 1;

  const savedStateFields = [
    "theme",
    "waveLimit",
    "selectedTower",
    "coins",
    "maxLives",
    "lives",
    "sessionDefeated",
    "waveDefeated",
    "waveHpLost",
    "waveComboVisible",
    "waveInProgress",
    "wave",
    "spawnRemaining",
    "spawnTimer",
    "waveCooldown",
    "speed",
    "sessionTime",
    "simTime",
    "nextEnemyId",
    "nextTowerId",
    "nextProjectileId"
  ];

  function canSaveGame() {
    const { state } = ntp;
    return Boolean(
      state?.running
      && !state.gameOver
      && !state.victoryPending
      && !state.waveTransitionActive
      && !state.cardChoice?.active
      && !ntp.isCardChoiceOpen?.()
      && !ntp.isVictoryOpen?.()
      && !ntp.isRestartConfirmOpen?.()
      && !ntp.isExitConfirmOpen?.()
      && !ntp.isTowerDeleteConfirmOpen?.()
    );
  }

  function saveGame() {
    if (!canSaveGame()) return false;

    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(createSaveSnapshot()));
      syncSavedGameButton();
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadSavedGame() {
    const snapshot = readSavedSnapshot();
    if (!snapshot) return false;

    restoreSavedSnapshot(snapshot);
    syncSavedGameButton();
    return true;
  }

  function hasSavedGame() {
    return Boolean(readSavedSnapshot());
  }

  function clearSavedGame() {
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch (error) {
      // The in-memory game can continue even when storage is unavailable.
    }
    syncSavedGameButton();
  }

  function syncSavedGameButton() {
    if (!ntp.dom?.continueButton) return;
    ntp.dom.continueButton.hidden = !hasSavedGame();
  }

  function createSaveSnapshot() {
    const { state } = ntp;
    const savedState = {};

    savedStateFields.forEach((field) => {
      savedState[field] = state[field];
    });

    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      state: {
        ...savedState,
        paused: false,
        cardEffects: serializeCardEffects(state.cardEffects),
        towers: state.placedTowers.map(serializeTower),
        enemies: state.enemies.map(serializeEnemy),
        projectiles: state.projectiles.map(serializeProjectile),
        impacts: state.impacts.map(serializeImpact)
      }
    };
  }

  function serializeTower(tower) {
    return {
      id: tower.id,
      x: tower.x,
      y: tower.y,
      tileX: tower.tileX,
      tileY: tower.tileY,
      type: tower.type,
      cost: tower.cost,
      cooldown: tower.cooldown
    };
  }

  function serializeEnemy(enemy) {
    return {
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      pathIndex: enemy.pathIndex,
      maxHp: enemy.maxHp,
      hp: enemy.hp,
      speed: enemy.speed,
      reward: enemy.reward,
      slowUntil: enemy.slowUntil,
      slowFactor: enemy.slowFactor,
      className: getClassToken(enemy.el, "enemy-") || "enemy-runner"
    };
  }

  function serializeProjectile(projectile) {
    return {
      id: projectile.id,
      sourceTowerId: projectile.sourceTowerId,
      x: projectile.x,
      y: projectile.y,
      targetId: projectile.targetId,
      damage: projectile.damage,
      speed: projectile.speed,
      slowFactor: projectile.slowFactor,
      slowDuration: projectile.slowDuration,
      splash: projectile.splash,
      projectileClass: getClassToken(projectile.el, "projectile-")
    };
  }

  function serializeImpact(impact) {
    return {
      x: impact.x,
      y: impact.y,
      life: impact.life
    };
  }

  function serializeCardEffects(cardEffects = {}) {
    return {
      towerBuffs: (cardEffects.towerBuffs || []).map(serializeEffect),
      enemyModifiers: (cardEffects.enemyModifiers || []).map(serializeEffect)
    };
  }

  function serializeEffect(effect) {
    return {
      ...effect,
      expiresAfterWave: Number.isFinite(effect.expiresAfterWave) ? effect.expiresAfterWave : "Infinity"
    };
  }

  function restoreCardEffects(cardEffects = {}) {
    return {
      towerBuffs: (cardEffects.towerBuffs || []).map(restoreEffect),
      enemyModifiers: (cardEffects.enemyModifiers || []).map(restoreEffect)
    };
  }

  function restoreEffect(effect) {
    return {
      ...effect,
      expiresAfterWave: effect.expiresAfterWave === "Infinity" ? Infinity : effect.expiresAfterWave
    };
  }

  function getClassToken(el, prefix) {
    return Array.from(el?.classList || []).find((className) => className.startsWith(prefix)) || "";
  }

  function readSavedSnapshot() {
    let snapshot;

    try {
      snapshot = JSON.parse(window.localStorage.getItem(SAVE_STORAGE_KEY) || "null");
    } catch (error) {
      clearCorruptSave();
      return null;
    }

    if (!isValidSnapshot(snapshot)) {
      if (snapshot) clearCorruptSave();
      return null;
    }

    return snapshot;
  }

  function clearCorruptSave() {
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch (error) {
      // Ignore corrupt storage cleanup failures.
    }
  }

  function isValidSnapshot(snapshot) {
    const savedState = snapshot?.state;
    return snapshot?.version === SAVE_VERSION
      && savedState
      && Boolean(ntp.maps?.[savedState.theme])
      && Array.isArray(savedState.towers)
      && Array.isArray(savedState.enemies)
      && Array.isArray(savedState.projectiles)
      && Array.isArray(savedState.impacts);
  }

  function restoreSavedSnapshot(snapshot) {
    const savedState = snapshot.state;
    const { dom, state } = ntp;

    ntp.resetState(savedState.theme, savedState.waveLimit);
    Object.assign(state, buildRestoredBaseState(savedState));

    ntp.closeDifficultyPanel?.();
    dom.configPanel.hidden = true;
    ntp.hideRestartConfirm?.();
    ntp.hideExitConfirm?.();
    ntp.hideTowerDeleteConfirm?.();
    ntp.hidePauseMenu?.();
    ntp.hideCardChoice?.();
    ntp.hideWaveTransition?.();
    ntp.hideVictory?.();

    ntp.syncThemeButtons?.(state.theme);
    dom.menu.classList.add("is-hidden");
    dom.game.classList.remove("is-hidden");

    ntp.buildBoard?.();
    restoreTowerElements(savedState.towers);
    restoreEnemyElements(savedState.enemies);
    restoreProjectileElements(savedState.projectiles);
    restoreImpactElements(savedState.impacts);

    ntp.ensureSelectedTowerUnlocked?.();
    ntp.updateHud?.();
    ntp.playThemeMusic?.(state.theme);
    ntp.resetGamepadCursor?.();
    ntp.clearGamepadButtonFocus?.();
    ntp.syncGamepadCursor?.();
  }

  function buildRestoredBaseState(savedState) {
    return {
      theme: savedState.theme,
      waveLimit: asNumber(savedState.waveLimit, ntp.difficultyOptions?.medium || 12),
      selectedTower: savedState.selectedTower || "sentinel",
      coins: asNumber(savedState.coins, 300),
      maxLives: asNumber(savedState.maxLives, 10),
      lives: asNumber(savedState.lives, 10),
      sessionDefeated: asNumber(savedState.sessionDefeated, 0),
      waveDefeated: asNumber(savedState.waveDefeated, 0),
      waveHpLost: asNumber(savedState.waveHpLost, 0),
      waveComboVisible: Boolean(savedState.waveComboVisible),
      waveInProgress: Boolean(savedState.waveInProgress),
      wave: asNumber(savedState.wave, 0),
      enemies: [],
      enemiesById: new Map(),
      placedTowers: [],
      projectiles: [],
      impacts: [],
      occupied: new Set(),
      lastPlacedTower: null,
      undoExpiresAt: 0,
      deleteMode: false,
      pendingDeleteTower: null,
      deleteConfirmPreviousPaused: false,
      spawnRemaining: asNumber(savedState.spawnRemaining, 0),
      spawnTimer: asNumber(savedState.spawnTimer, 0),
      waveCooldown: asNumber(savedState.waveCooldown, 1.2),
      waveTransitionActive: false,
      waveTransitionSteps: [],
      waveTransitionIndex: 0,
      waveTransitionTimer: 0,
      speed: asNumber(savedState.speed, 1),
      paused: false,
      running: true,
      gameOver: false,
      victoryShown: false,
      victoryPending: false,
      cardChoice: {
        active: false,
        revealed: false,
        cards: [],
        selectedCardId: "",
        resultText: "",
        previousPaused: false
      },
      cardEffects: restoreCardEffects(savedState.cardEffects),
      sessionTime: asNumber(savedState.sessionTime, 0),
      simTime: asNumber(savedState.simTime, 0),
      nextEnemyId: asNumber(savedState.nextEnemyId, 1),
      nextTowerId: asNumber(savedState.nextTowerId, 1),
      nextProjectileId: asNumber(savedState.nextProjectileId, 1)
    };
  }

  function restoreTowerElements(savedTowers) {
    savedTowers.forEach((savedTower) => {
      const towerDef = ntp.towers?.[savedTower.type];
      if (!towerDef) return;

      const tileX = asNumber(savedTower.tileX, Math.floor(savedTower.x));
      const tileY = asNumber(savedTower.tileY, Math.floor(savedTower.y));
      const el = document.createElement("div");
      el.className = `tower ${towerDef.className}`;
      el.dataset.tower = savedTower.type;
      ntp.dom.board.appendChild(el);

      const tower = {
        id: asNumber(savedTower.id, ntp.state.nextTowerId),
        x: asNumber(savedTower.x, tileX + 0.5),
        y: asNumber(savedTower.y, tileY + 0.5),
        tileX,
        tileY,
        type: savedTower.type,
        cost: asNumber(savedTower.cost, towerDef.cost),
        cooldown: asNumber(savedTower.cooldown, 0),
        el
      };

      ntp.state.placedTowers.push(tower);
      ntp.state.occupied.add(ntp.coordKey(tileX, tileY));
      ntp.setElementPosition?.(el, tower.x, tower.y);
    });
  }

  function restoreEnemyElements(savedEnemies) {
    savedEnemies.forEach((savedEnemy) => {
      const el = document.createElement("div");
      const healthEl = document.createElement("div");
      const healthBar = document.createElement("span");
      const maxHp = asNumber(savedEnemy.maxHp, 1);
      const hp = Math.max(0, Math.min(maxHp, asNumber(savedEnemy.hp, maxHp)));

      el.className = `enemy ${savedEnemy.className || "enemy-runner"}`;
      healthEl.className = "health";
      healthEl.appendChild(healthBar);
      el.appendChild(healthEl);
      ntp.dom.board.appendChild(el);

      const enemy = {
        id: asNumber(savedEnemy.id, ntp.state.nextEnemyId),
        x: asNumber(savedEnemy.x, 0.5),
        y: asNumber(savedEnemy.y, 0.5),
        pathIndex: asNumber(savedEnemy.pathIndex, 0),
        maxHp,
        hp,
        speed: asNumber(savedEnemy.speed, 1),
        reward: asNumber(savedEnemy.reward, 0),
        slowUntil: asNumber(savedEnemy.slowUntil, 0),
        slowFactor: asNumber(savedEnemy.slowFactor, 1),
        healthBar,
        el
      };

      healthBar.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
      el.classList.toggle("slowed", enemy.slowUntil > ntp.state.simTime);
      ntp.state.enemies.push(enemy);
      ntp.state.enemiesById.set(enemy.id, enemy);
      ntp.setElementPosition?.(el, enemy.x, enemy.y);
    });
  }

  function restoreProjectileElements(savedProjectiles) {
    savedProjectiles.forEach((savedProjectile) => {
      const el = document.createElement("div");
      el.className = `projectile ${savedProjectile.projectileClass || ""}`.trim();
      ntp.dom.board.appendChild(el);

      const projectile = {
        id: asNumber(savedProjectile.id, ntp.state.nextProjectileId),
        sourceTowerId: asNumber(savedProjectile.sourceTowerId, 0),
        x: asNumber(savedProjectile.x, 0),
        y: asNumber(savedProjectile.y, 0),
        targetId: asNumber(savedProjectile.targetId, 0),
        damage: asNumber(savedProjectile.damage, 1),
        speed: asNumber(savedProjectile.speed, 1),
        slowFactor: savedProjectile.slowFactor,
        slowDuration: savedProjectile.slowDuration,
        splash: savedProjectile.splash || 0,
        el
      };

      ntp.state.projectiles.push(projectile);
      ntp.setElementPosition?.(el, projectile.x, projectile.y);
    });
  }

  function restoreImpactElements(savedImpacts) {
    savedImpacts.forEach((savedImpact) => {
      const el = document.createElement("div");
      el.className = "impact";
      ntp.dom.board.appendChild(el);

      const impact = {
        x: asNumber(savedImpact.x, 0),
        y: asNumber(savedImpact.y, 0),
        life: asNumber(savedImpact.life, 0.22),
        el
      };

      ntp.state.impacts.push(impact);
      ntp.setElementPosition?.(el, impact.x, impact.y);
    });
  }

  function asNumber(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  Object.assign(ntp, {
    canSaveGame,
    saveGame,
    loadSavedGame,
    hasSavedGame,
    clearSavedGame,
    syncSavedGameButton
  });
})();
