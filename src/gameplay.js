(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    buildBoard,
    closeDifficultyPanel,
    clearDynamicElements,
    coordKey,
    doesTowerReachPath,
    dom,
    enemyTypes,
    getConfiguredWaveLimit,
    getFirstTheme,
    getTowerLabel,
    getUnlockedTowerKeys,
    hideCardChoice,
    hideExitConfirm,
    hidePlacementPreview,
    hideRestartConfirm,
    hideTowerDeleteConfirm,
    hideWaveTransition,
    hideVictory,
    isTowerUnlocked,
    isVictoryOpen,
    maps,
    playSfx,
    resetState,
    refreshPlacementPreview,
    setElementPosition,
    settings,
    showCardChoice,
    showGameOver,
    showMessage,
    showTowerDeleteConfirm,
    showWaveTransition,
    showVictory,
    state,
    syncThemeButtons,
    t,
    towerOrder,
    towers,
    updateHud,
    ensureSelectedTowerUnlocked
  } = ntp;

  const gameplayHooks = {
    afterStartGame() {},
    afterReturnToMenu() {},
    afterTowerPlaced() {}
  };

  const WAVE_TRANSITION_DURATION = 1.25;
  const UNDO_PLACEMENT_WINDOW_MS = 5000;
  const CARD_EFFECT_DURATION_WAVES = 1;
  const CARD_COIN_GAIN = 100;
  const CARD_COIN_LOSS = 70;
  let waveTransitionCallback = null;
  let cardChoiceCallback = null;
  let undoHideTimer = 0;

  function configureGameplayHooks(hooks) {
    Object.assign(gameplayHooks, hooks);
  }

  function startGame(theme = state.theme) {
    resetState(theme, getConfiguredWaveLimit());
    clearUndoPlacement();
    ensureSelectedTowerUnlocked();
    state.running = true;
    syncThemeButtons(theme);
    dom.menu.classList.add("is-hidden");
    dom.game.classList.remove("is-hidden");
    closeDifficultyPanel();
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hideCardChoice();
    hideWaveTransition();
    hideVictory();
    waveTransitionCallback = null;
    cardChoiceCallback = null;
    buildBoard();
    gameplayHooks.afterStartGame();
    updateHud();
    showMessage(t("messages.start"));
  }

  function returnToMenu() {
    state.running = false;
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hideCardChoice();
    hideWaveTransition();
    hideVictory();
    waveTransitionCallback = null;
    cardChoiceCallback = null;
    resetCardChoiceState();
    clearDynamicElements();
    state.theme = getFirstTheme();
    syncThemeButtons(state.theme);
    dom.game.classList.add("is-hidden");
    dom.menu.classList.remove("is-hidden");
    gameplayHooks.afterReturnToMenu();
  }

  function setTheme(theme) {
    const hadStarted = state.running;
    state.theme = theme;
    syncThemeButtons(theme);
    if (hadStarted) {
      startGame(theme);
    }
  }

  function placeTower(x, y) {
    if (!state.running || state.paused || state.gameOver) return;
    if (state.deleteMode) {
      showMessage(t("messages.cancelDeleteToBuild"));
      return;
    }

    const key = coordKey(x, y);
    const towerDef = towers[state.selectedTower];
    if (!towerDef || !isTowerUnlocked(state.selectedTower, state.theme)) {
      showMessage(t("messages.towerLocked"));
      return;
    }
    if (state.pathSet.has(key) || state.blockedSet.has(key) || state.occupied.has(key)) {
      showMessage(t("messages.spaceBlocked"));
      return;
    }
    if (state.coins < towerDef.cost) {
      showMessage(t("messages.notEnoughCoins"));
      return;
    }
    const towerStats = getTowerCombatStats(state.selectedTower);
    if (!doesTowerReachPath(x, y, towerStats.range)) {
      showMessage(t("messages.towerNoTargets"));
      return;
    }

    state.coins -= towerDef.cost;
    state.occupied.add(key);

    const el = document.createElement("div");
    el.className = `tower ${towerDef.className}`;
    el.dataset.tower = state.selectedTower;
    dom.board.appendChild(el);

    const tower = {
      id: state.nextTowerId,
      x: x + 0.5,
      y: y + 0.5,
      tileX: x,
      tileY: y,
      type: state.selectedTower,
      cost: towerDef.cost,
      cooldown: 0,
      el
    };

    state.nextTowerId += 1;
    state.placedTowers.push(tower);
    setElementPosition(el, tower.x, tower.y);
    startUndoPlacement(tower);
    gameplayHooks.afterTowerPlaced();
    updateHud();
  }

  function getInteractionNow() {
    return window.performance?.now?.() || Date.now();
  }

  function clearUndoTimer() {
    if (!undoHideTimer) return;
    window.clearTimeout(undoHideTimer);
    undoHideTimer = 0;
  }

  function startUndoPlacement(tower) {
    clearUndoTimer();
    state.lastPlacedTower = tower;
    state.undoExpiresAt = getInteractionNow() + UNDO_PLACEMENT_WINDOW_MS;
    undoHideTimer = window.setTimeout(expireUndoPlacement, UNDO_PLACEMENT_WINDOW_MS);
  }

  function expireUndoPlacement() {
    undoHideTimer = 0;
    if (!isUndoPlacementAvailable()) {
      clearUndoPlacement();
      updateHud();
    }
  }

  function clearUndoPlacement() {
    clearUndoTimer();
    state.lastPlacedTower = null;
    state.undoExpiresAt = 0;
  }

  function isUndoPlacementAvailable() {
    return Boolean(
      state.lastPlacedTower
      && state.running
      && !state.gameOver
      && !state.victoryPending
      && state.placedTowers.includes(state.lastPlacedTower)
      && getInteractionNow() < state.undoExpiresAt
    );
  }

  function getUndoPlacementSecondsRemaining() {
    if (!isUndoPlacementAvailable()) return 0;
    return Math.max(1, Math.ceil((state.undoExpiresAt - getInteractionNow()) / 1000));
  }

  function undoLastTowerPlacement() {
    if (!isUndoPlacementAvailable()) {
      clearUndoPlacement();
      updateHud();
      return;
    }

    const tower = state.lastPlacedTower;
    const refund = tower.cost ?? towers[tower.type]?.cost ?? 0;
    if (removeTower(tower, { refund })) {
      showMessage(t("messages.towerUndone"));
    }
    clearUndoPlacement();
    updateHud();
  }

  function getTowerAtTile(x, y) {
    return state.placedTowers.find((tower) => {
      const tileX = tower.tileX ?? Math.floor(tower.x);
      const tileY = tower.tileY ?? Math.floor(tower.y);
      return tileX === x && tileY === y;
    });
  }

  function removeTower(tower, options = {}) {
    const index = state.placedTowers.indexOf(tower);
    if (index < 0) return false;

    const tileX = tower.tileX ?? Math.floor(tower.x);
    const tileY = tower.tileY ?? Math.floor(tower.y);
    state.placedTowers.splice(index, 1);
    state.occupied.delete(coordKey(tileX, tileY));

    state.projectiles.slice().forEach((projectile) => {
      if (projectile.sourceTowerId === tower.id) {
        removeProjectile(projectile);
      }
    });

    tower.el?.remove();

    if (state.lastPlacedTower === tower) {
      clearUndoPlacement();
    }
    if (state.pendingDeleteTower === tower) {
      state.pendingDeleteTower = null;
    }

    if (Number.isFinite(options.refund) && options.refund > 0) {
      state.coins += Math.round(options.refund);
    }

    refreshPlacementPreview();
    ntp.syncGamepadCursor?.();
    return true;
  }

  function setDeleteMode(active, options = {}) {
    const nextDeleteMode = Boolean(active);
    if (nextDeleteMode && (!state.running || state.gameOver || state.victoryPending)) return false;

    state.deleteMode = nextDeleteMode;
    if (nextDeleteMode) {
      state.pendingDeleteTower = null;
      hidePlacementPreview();
      if (!options.silent) {
        showMessage(t("messages.selectTowerToRemove"));
      }
    } else {
      state.pendingDeleteTower = null;
      hideTowerDeleteConfirm();
      refreshPlacementPreview();
      if (!options.silent) {
        showMessage(t("messages.buildModeRestored"));
      }
    }

    updateHud();
    ntp.syncGamepadCursor?.();
    return state.deleteMode;
  }

  function toggleDeleteMode() {
    return setDeleteMode(!state.deleteMode);
  }

  function requestTowerDelete(tower) {
    if (!state.deleteMode || !tower || !state.placedTowers.includes(tower)) {
      showMessage(t("messages.selectTower"));
      return false;
    }

    state.pendingDeleteTower = tower;
    state.deleteConfirmPreviousPaused = state.paused;
    state.paused = true;
    hidePlacementPreview();
    showTowerDeleteConfirm();
    updateHud();
    return true;
  }

  function requestTowerDeleteAt(x, y) {
    const tower = getTowerAtTile(x, y);
    if (!tower) {
      showMessage(t("messages.selectTower"));
      return false;
    }
    return requestTowerDelete(tower);
  }

  function confirmTowerDelete() {
    const tower = state.pendingDeleteTower;
    const previousPaused = state.deleteConfirmPreviousPaused;
    hideTowerDeleteConfirm();

    if (tower && removeTower(tower)) {
      showMessage(t("messages.towerRemoved"));
    } else {
      showMessage(t("messages.towerNotFound"));
    }

    state.paused = previousPaused;
    setDeleteMode(false, { silent: true });
    updateHud();
  }

  function cancelTowerDelete() {
    const previousPaused = state.deleteConfirmPreviousPaused;
    hideTowerDeleteConfirm();
    state.pendingDeleteTower = null;
    state.paused = previousPaused;
    setDeleteMode(false, { silent: true });
    showMessage(t("messages.buildModeRestored"));
    updateHud();
  }

  function update(dt, rawDt = dt) {
    if (!state.running || state.paused || state.gameOver || state.victoryPending) return;

    state.sessionTime += rawDt;
    state.simTime += dt;

    if (state.waveTransitionActive) {
      updateWaveTransition(rawDt);
      updateHud();
      return;
    }

    if (state.spawnRemaining <= 0 && state.enemies.length === 0) {
      if (state.waveInProgress) {
        completeCurrentWave();
        updateHud();
        return;
      }

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

  function togglePause() {
    if (!state.running || state.gameOver || state.cardChoice.active || isVictoryOpen()) return;
    state.paused = !state.paused;
    updateHud();
  }

  function toggleSpeed() {
    if (!state.running || state.gameOver || state.cardChoice.active || isVictoryOpen()) return;
    state.speed = state.speed === 1 ? 2 : 1;
    updateHud();
  }

  function cycleSelectedTower(step) {
    const unlockedTowerKeys = towerOrder.filter((towerKey) => isTowerUnlocked(towerKey, state.theme));
    const affordableTowerKeys = unlockedTowerKeys.filter((towerKey) => state.coins >= towers[towerKey].cost);
    const availableTowerKeys = affordableTowerKeys.length ? affordableTowerKeys : unlockedTowerKeys;
    if (!availableTowerKeys.length) return;
    const currentIndex = availableTowerKeys.indexOf(state.selectedTower);
    const nextIndex = currentIndex >= 0
      ? (currentIndex + step + availableTowerKeys.length) % availableTowerKeys.length
      : 0;

    state.selectedTower = availableTowerKeys[nextIndex];
    updateHud();
    refreshPlacementPreview();
  }

  function startNextWave() {
    if (state.gameOver) return;
    if (state.wave >= state.waveLimit && !state.victoryShown) {
      setDeleteMode(false, { silent: true });
      clearUndoPlacement();
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
    state.waveDefeated = 0;
    state.waveHpLost = 0;
    state.waveComboVisible = false;
    state.waveInProgress = true;
    state.spawnRemaining = 6 + state.wave * 2;
    state.spawnTimer = 0;
    state.victoryPending = false;
    showMessage(t("messages.waveStart", { wave: state.wave }));
    updateHud();
  }

  function resetCardChoiceState() {
    Object.assign(state.cardChoice, {
      active: false,
      revealed: false,
      cards: [],
      selectedCardId: "",
      resultText: "",
      previousPaused: false
    });
  }

  function shouldOfferCardChoice(finishedWave) {
    const offerInterval = settings.cardFrequency;
    return finishedWave < state.waveLimit
      && Number.isFinite(offerInterval)
      && offerInterval > 0
      && state.waveHpLost <= 0
      && finishedWave % offerInterval === 0;
  }

  function startCardChoice(callback) {
    if (!settings.cardFrequency) {
      if (callback) callback();
      return;
    }

    cardChoiceCallback = callback;
    setDeleteMode(false, { silent: true });
    clearUndoPlacement();
    state.cardChoice.active = true;
    state.cardChoice.revealed = false;
    state.cardChoice.cards = createCardChoices();
    state.cardChoice.selectedCardId = "";
    state.cardChoice.resultText = "";
    state.cardChoice.previousPaused = state.paused;
    state.paused = true;
    showCardChoice();
    updateHud();
  }

  function selectCardChoice(cardId) {
    if (!state.cardChoice.active || state.cardChoice.revealed) return false;

    const card = state.cardChoice.cards.find((candidate) => candidate.id === cardId);
    if (!card) return false;

    state.cardChoice.selectedCardId = card.id;
    state.cardChoice.revealed = true;
    state.cardChoice.resultText = applyCardEffect(card);
    showCardChoice();
    updateHud();
    return true;
  }

  function continueCardChoice() {
    if (!state.cardChoice.active || !state.cardChoice.revealed) return false;

    const callback = cardChoiceCallback;
    const previousPaused = state.cardChoice.previousPaused;
    cardChoiceCallback = null;
    resetCardChoiceState();
    hideCardChoice();
    state.paused = previousPaused;
    updateHud();
    if (callback) callback();
    return true;
  }

  function createCardChoices() {
    return shuffleCards([
      createNeutralCard(),
      ...createBoonCards(2),
      createBaneCard()
    ]);
  }

  function createNeutralCard() {
    return buildCard("neutral", {
      title: t("cards.neutral.title"),
      description: t("cards.neutral.description"),
      result: t("cards.neutral.result"),
      effect: { type: "none" }
    });
  }

  function createBoonCards(count = 2) {
    return shuffleCards(createBoonCardConfigs())
      .slice(0, count)
      .map((config) => buildCard("boon", config));
  }

  function createBoonCardConfigs() {
    const towerKey = getRandomUnlockedTowerKey();
    const towerLabel = getTowerLabel(towerKey);
    const configs = [
      {
        title: t("cards.damage.title", { tower: towerLabel }),
        description: t("cards.damage.description", { tower: towerLabel }),
        result: t("cards.damage.result", { tower: towerLabel }),
        effect: {
          type: "towerBuff",
          towerType: towerKey,
          stat: "damage",
          multiplier: 1.3,
          permanent: true
        }
      },
      {
        title: t("cards.range.title", { tower: towerLabel }),
        description: t("cards.range.description", { tower: towerLabel }),
        result: t("cards.range.result", { tower: towerLabel }),
        effect: {
          type: "towerBuff",
          towerType: towerKey,
          stat: "range",
          multiplier: 1.25,
          permanent: true
        }
      },
      {
        title: t("cards.coinsGain.title"),
        description: t("cards.coinsGain.description", { amount: CARD_COIN_GAIN }),
        result: t("cards.coinsGain.result", { amount: CARD_COIN_GAIN }),
        effect: {
          type: "coins",
          amount: CARD_COIN_GAIN
        }
      }
    ];

    if (state.lives < state.maxLives) {
      configs.push({
        title: t("cards.heal.title"),
        description: t("cards.heal.description"),
        result: t("cards.heal.result"),
        effect: {
          type: "heal",
          amount: 1
        }
      });
    }

    return configs;
  }

  function createBaneCard() {
    const cards = [
      {
        title: t("cards.enemyHp.title"),
        description: t("cards.enemyHp.description"),
        result: t("cards.enemyHp.result"),
        effect: {
          type: "enemyModifier",
          stat: "hp",
          multiplier: 1.18,
          durationWaves: CARD_EFFECT_DURATION_WAVES
        }
      },
      {
        title: t("cards.enemySpeed.title"),
        description: t("cards.enemySpeed.description"),
        result: t("cards.enemySpeed.result"),
        effect: {
          type: "enemyModifier",
          stat: "speed",
          multiplier: 1.15,
          durationWaves: CARD_EFFECT_DURATION_WAVES
        }
      },
      {
        title: t("cards.coinsLoss.title"),
        description: t("cards.coinsLoss.description", { amount: CARD_COIN_LOSS }),
        result: t("cards.coinsLoss.result", { amount: CARD_COIN_LOSS }),
        effect: {
          type: "coins",
          amount: -CARD_COIN_LOSS
        }
      },
      {
        title: t("cards.coinsAll.title"),
        description: t("cards.coinsAll.description"),
        result: t("cards.coinsAll.result"),
        effect: {
          type: "coinsAll"
        }
      }
    ];

    return buildCard("bane", randomItem(cards));
  }

  function buildCard(kind, config) {
    return {
      id: `${kind}-${state.wave}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      ...config
    };
  }

  function getRandomUnlockedTowerKey() {
    const unlockedTowerKeys = getUnlockedTowerKeys(state.theme).filter((towerKey) => towers[towerKey]);
    return randomItem(unlockedTowerKeys.length ? unlockedTowerKeys : towerOrder);
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffleCards(cards) {
    return cards
      .map((card) => ({ card, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((entry) => entry.card);
  }

  function applyCardEffect(card) {
    const effect = card.effect || {};
    if (effect.type === "heal") {
      const previousLives = state.lives;
      state.lives = Math.min(state.maxLives, state.lives + effect.amount);
      return state.lives > previousLives ? card.result : t("cards.heal.full");
    }

    if (effect.type === "coins") {
      const previousCoins = state.coins;
      state.coins = Math.max(0, state.coins + effect.amount);
      const coinDifference = state.coins - previousCoins;

      if (coinDifference > 0) {
        return t("cards.coinsGain.result", { amount: coinDifference });
      }

      if (coinDifference < 0) {
        return t("cards.coinsLoss.result", { amount: Math.abs(coinDifference) });
      }

      return t("cards.noCoinsChanged");
    }

    if (effect.type === "coinsAll") {
      const previousCoins = state.coins;
      state.coins = 0;
      return previousCoins > 0
        ? t("cards.coinsLoss.result", { amount: previousCoins })
        : t("cards.noCoinsLost");
    }

    if (effect.type === "towerBuff") {
      addTowerBuff(effect);
      return card.result;
    }

    if (effect.type === "enemyModifier") {
      addEnemyModifier(effect);
      return card.result;
    }

    return card.result;
  }

  function getCardEffectExpirationWave(effect) {
    if (effect.permanent) return Infinity;
    return state.wave + (effect.durationWaves || CARD_EFFECT_DURATION_WAVES);
  }

  function addTowerBuff(effect) {
    state.cardEffects.towerBuffs.push({
      towerType: effect.towerType,
      stat: effect.stat,
      multiplier: effect.multiplier,
      permanent: Boolean(effect.permanent),
      expiresAfterWave: getCardEffectExpirationWave(effect)
    });
  }

  function addEnemyModifier(effect) {
    state.cardEffects.enemyModifiers = state.cardEffects.enemyModifiers.filter((modifier) => {
      return modifier.stat !== effect.stat;
    });
    state.cardEffects.enemyModifiers.push({
      stat: effect.stat,
      multiplier: effect.multiplier,
      expiresAfterWave: getCardEffectExpirationWave(effect)
    });
  }

  function clearExpiredCardEffects(finishedWave) {
    state.cardEffects.towerBuffs = state.cardEffects.towerBuffs.filter((buff) => {
      return buff.expiresAfterWave > finishedWave;
    });
    state.cardEffects.enemyModifiers = state.cardEffects.enemyModifiers.filter((modifier) => {
      return modifier.expiresAfterWave > finishedWave;
    });
  }

  function isCardEffectActive(effect) {
    return effect.expiresAfterWave >= state.wave;
  }

  function getTowerCombatStats(towerType) {
    const towerDef = towers[towerType];
    if (!towerDef) return null;
    const stats = { ...towerDef };
    state.cardEffects.towerBuffs
      .filter((buff) => buff.towerType === towerType && isCardEffectActive(buff))
      .forEach((buff) => {
        if (buff.stat === "damage") {
          stats.damage = Math.max(1, Math.round(stats.damage * buff.multiplier));
        } else if (buff.stat === "range") {
          stats.range *= buff.multiplier;
        }
      });
    return stats;
  }

  function getEnemyModifierMultiplier(stat) {
    return state.cardEffects.enemyModifiers
      .filter((modifier) => modifier.stat === stat && isCardEffectActive(modifier))
      .reduce((multiplier, modifier) => multiplier * modifier.multiplier, 1);
  }

  function completeCurrentWave() {
    const finishedWave = state.wave;
    const defeatedThisWave = state.waveDefeated;
    state.waveInProgress = false;
    state.sessionDefeated += defeatedThisWave;
    state.waveDefeated = 0;
    state.waveComboVisible = false;
    clearExpiredCardEffects(finishedWave);

    const steps = [t("wave.end", { wave: finishedWave, defeated: defeatedThisWave })];
    if (shouldOfferCardChoice(finishedWave)) {
      startWaveTransition(steps, () => startCardChoice(startNextWave));
      return;
    }

    if (finishedWave < state.waveLimit) {
      steps.push(t("wave.start", { wave: finishedWave + 1 }));
    }

    startWaveTransition(steps, startNextWave);
  }

  function startWaveTransition(steps, callback) {
    state.waveTransitionActive = true;
    state.waveTransitionSteps = steps;
    state.waveTransitionIndex = 0;
    state.waveTransitionTimer = WAVE_TRANSITION_DURATION;
    waveTransitionCallback = callback;
    showWaveTransition(steps[0]);
  }

  function updateWaveTransition(dt) {
    state.waveTransitionTimer -= dt;
    if (state.waveTransitionTimer > 0) return;

    state.waveTransitionIndex += 1;
    if (state.waveTransitionIndex < state.waveTransitionSteps.length) {
      state.waveTransitionTimer = WAVE_TRANSITION_DURATION;
      showWaveTransition(state.waveTransitionSteps[state.waveTransitionIndex]);
      return;
    }

    finishWaveTransition();
  }

  function finishWaveTransition() {
    const callback = waveTransitionCallback;
    state.waveTransitionActive = false;
    state.waveTransitionSteps = [];
    state.waveTransitionIndex = 0;
    state.waveTransitionTimer = 0;
    waveTransitionCallback = null;
    hideWaveTransition();
    if (callback) callback();
  }

  function spawnEnemy() {
    const path = maps[state.theme].path;
    const tier = state.wave > 4 && state.spawnRemaining % 5 === 0
      ? 2
      : state.wave > 2 && state.spawnRemaining % 3 === 0
        ? 1
        : 0;
    const type = enemyTypes[tier];
    const maxHp = Math.round(type.hp * (1 + state.wave * 0.12) * getEnemyModifierMultiplier("hp"));
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
      speed: type.speed * (1 + Math.min(state.wave, 8) * 0.025) * getEnemyModifierMultiplier("speed"),
      reward: type.reward,
      slowUntil: 0,
      slowFactor: 1,
      el
    };

    state.nextEnemyId += 1;
    state.enemies.push(enemy);
    setElementPosition(el, enemy.x, enemy.y);
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
      if (state.gameOver) return;
      state.waveHpLost += 1;
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives <= 0) endGame();
    });
  }

  function updateTowers(dt) {
    state.placedTowers.forEach((tower) => {
      const towerDef = getTowerCombatStats(tower.type);
      if (!towerDef) return;
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
      sourceTowerId: tower.id,
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
    playSfx("projectileThrow");
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
    if (state.waveInProgress) {
      state.waveComboVisible = true;
    }
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
      playSfx("enemyDeath");
      state.waveDefeated += 1;
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
    if (state.gameOver) return;
    state.gameOver = true;
    state.waveComboVisible = false;
    setDeleteMode(false, { silent: true });
    clearUndoPlacement();
    hideVictory();
    state.lives = 0;
    showGameOver();
    updateHud();
  }

  Object.assign(ntp, {
    configureGameplayHooks,
    startGame,
    returnToMenu,
    setTheme,
    placeTower,
    removeTower,
    getTowerAtTile,
    undoLastTowerPlacement,
    clearUndoPlacement,
    isUndoPlacementAvailable,
    getUndoPlacementSecondsRemaining,
    setDeleteMode,
    toggleDeleteMode,
    requestTowerDelete,
    requestTowerDeleteAt,
    confirmTowerDelete,
    cancelTowerDelete,
    selectCardChoice,
    continueCardChoice,
    getTowerCombatStats,
    update,
    togglePause,
    toggleSpeed,
    cycleSelectedTower,
    startNextWave,
    beginWaveSpawn
  });
})();
