(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    buildBoard,
    COLS,
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
    hidePauseMenu,
    hidePlacementPreview,
    hideRestartConfirm,
    hideTowerDeleteConfirm,
    hideWaveTransition,
    hideVictory,
    isTowerUnlocked,
    isVictoryOpen,
    maps,
    MAX_TOWER_RANGE,
    playSfx,
    resetState,
    refreshPlacementPreview,
    ROWS,
    setElementPosition,
    settings,
    showCardChoice,
    showGameOver,
    showMessage,
    showPauseMenu,
    showTowerDeleteConfirm,
    showWaveTransition,
    showVictory,
    state,
    syncThemeButtons,
    t,
    towerOrder,
    towers,
    updateHud,
    ensureSelectedTowerUnlocked,
    isPauseMenuOpen
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
  const DAMAGE_BUFF_MULTIPLIER = 1.3;
  const DAMAGE_SETBACK_MULTIPLIER = 1 / DAMAGE_BUFF_MULTIPLIER;
  const POWER_SURGE_MULTIPLIER = 2;
  const DAMAGE_MAX_EPSILON = 0.001;
  const RANGE_BUFF_MULTIPLIER = 1.25;
  const RANGE_SETBACK_MULTIPLIER = 1 / RANGE_BUFF_MULTIPLIER;
  const RANGE_MAX_EPSILON = 0.001;
  const PROJECTILE_POOL_LIMIT = 80;
  const IMPACT_POOL_LIMIT = 32;
  const projectileElementPool = [];
  const impactElementPool = [];
  let waveTransitionCallback = null;
  let cardChoiceCallback = null;
  let undoHideTimer = 0;

  function acquirePooledElement(pool, className) {
    const el = pool.pop() || document.createElement("div");
    el.className = className;
    dom.board.appendChild(el);
    return el;
  }

  function releasePooledElement(pool, limit, el) {
    if (!el) return;
    el.remove();
    if (pool.length >= limit) return;
    el.className = "";
    pool.push(el);
  }

  function configureGameplayHooks(hooks) {
    Object.assign(gameplayHooks, hooks);
  }

  function logDebug(category, message, details) {
    ntp.debugLog?.(category, message, details);
  }

  function roundDebugNumber(value) {
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
  }

  function getDebugTowerStats(stats = {}) {
    return {
      cost: stats.cost,
      damage: stats.damage,
      maxDamage: stats.maxDamage,
      range: roundDebugNumber(stats.range),
      fireRate: roundDebugNumber(stats.fireRate),
      projectileSpeed: roundDebugNumber(stats.projectileSpeed),
      slowFactor: roundDebugNumber(stats.slowFactor),
      slowDuration: roundDebugNumber(stats.slowDuration),
      splash: roundDebugNumber(stats.splash)
    };
  }

  function getDebugCardDetails(card) {
    return {
      id: card.id,
      kind: card.kind,
      title: card.title,
      description: card.description,
      effect: card.effect || {}
    };
  }

  function startGame(theme = state.theme) {
    ntp.clearSavedGame?.();
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
    hidePauseMenu();
    hideCardChoice();
    hideWaveTransition();
    hideVictory();
    waveTransitionCallback = null;
    cardChoiceCallback = null;
    buildBoard();
    gameplayHooks.afterStartGame();
    updateHud();
    showMessage(t("messages.start"));
    logDebug("system", "Game started", {
      theme: state.theme,
      waveLimit: state.waveLimit,
      cardFrequency: settings.cardFrequency
    });
  }

  function returnToMenu() {
    logDebug("system", "Returned to menu", {
      theme: state.theme,
      wave: state.wave,
      defeated: state.sessionDefeated
    });
    state.running = false;
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hidePauseMenu();
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
    logDebug("towers", "Tower placed", {
      id: tower.id,
      type: tower.type,
      label: getTowerLabel(tower.type),
      tileX: tower.tileX,
      tileY: tower.tileY,
      cost: tower.cost,
      coins: state.coins,
      stats: getDebugTowerStats(towerStats)
    });
    logDebug("economy", "Coins spent", {
      reason: "tower",
      amount: -tower.cost,
      coins: state.coins
    });
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
    const refund = Number.isFinite(options.refund) && options.refund > 0
      ? Math.round(options.refund)
      : 0;
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

    if (refund > 0) {
      state.coins += refund;
    }

    refreshPlacementPreview();
    ntp.syncGamepadCursor?.();
    logDebug("towers", "Tower removed", {
      id: tower.id,
      type: tower.type,
      label: getTowerLabel(tower.type),
      tileX,
      tileY,
      refund,
      coins: state.coins
    });
    if (refund > 0) {
      logDebug("economy", "Tower refund", {
        amount: refund,
        coins: state.coins
      });
    }
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
    if (isPauseMenuOpen?.()) {
      closePauseMenu();
      return;
    }
    openPauseMenu();
  }

  function openPauseMenu() {
    if (
      !state.running
      || state.gameOver
      || state.cardChoice.active
      || state.waveTransitionActive
      || state.victoryPending
      || isVictoryOpen()
    ) {
      return false;
    }

    setDeleteMode(false, { silent: true });
    hidePlacementPreview();
    state.paused = true;
    updateHud();
    showPauseMenu();
    return true;
  }

  function closePauseMenu() {
    if (!isPauseMenuOpen?.()) return false;
    hidePauseMenu();
    if (state.running && !state.gameOver && !state.victoryPending) {
      state.paused = false;
    }
    updateHud();
    refreshPlacementPreview();
    return true;
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
      ntp.clearSavedGame?.();
      showVictory();
      updateHud();
      logDebug("system", "Victory pending", {
        theme: state.theme,
        wave: state.wave,
        defeated: state.sessionDefeated
      });
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
    logDebug("waves", "Wave started", {
      wave: state.wave,
      spawnRemaining: state.spawnRemaining,
      enemies: state.enemies.length,
      activeEnemyModifiers: state.cardEffects.enemyModifiers.length
    });
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
    logDebug("cards", "Card options generated", {
      wave: state.wave,
      count: state.cardChoice.cards.length,
      cards: state.cardChoice.cards.map(getDebugCardDetails)
    });
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
    logDebug("cards", "Card selected", {
      wave: state.wave,
      card: getDebugCardDetails(card),
      result: state.cardChoice.resultText
    });
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
    const towerTypeClearCard = createTowerTypeClearCardConfig();
    if (towerTypeClearCard) {
      const powerSurgeCard = createPowerSurgeCardConfig();
      const boonCount = powerSurgeCard ? 1 : 2;
      const cards = [
        createNeutralCard(),
        ...createBoonCards(boonCount),
        buildCard("bane", towerTypeClearCard)
      ];

      if (powerSurgeCard) {
        cards.push(buildCard("boon", powerSurgeCard));
      }

      return shuffleCards(cards);
    }

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
    const configs = [];
    const damageTowerKey = getRandomDamageBuffTowerKey();
    const rangeTowerKey = getRandomRangeBuffTowerKey();

    if (damageTowerKey) {
      configs.push(createDamageBuffCardConfig(damageTowerKey));
    }

    if (rangeTowerKey) {
      configs.push(createRangeBuffCardConfig(rangeTowerKey));
    }

    configs.push(
      {
        title: t("cards.coinsGain.title"),
        description: t("cards.coinsGain.description", { amount: CARD_COIN_GAIN }),
        result: t("cards.coinsGain.result", { amount: CARD_COIN_GAIN }),
        effect: {
          type: "coins",
          amount: CARD_COIN_GAIN
        }
      }
    );

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

  function createDamageBuffCardConfig(towerKey) {
    const towerLabel = getTowerLabel(towerKey);
    const maxDamage = getTowerMaxDamage(towerKey);
    return {
      title: t("cards.damage.title", { tower: towerLabel }),
      description: t("cards.damage.description", { tower: towerLabel, max: maxDamage }),
      result: t("cards.damage.result", { tower: towerLabel, max: maxDamage }),
      effect: {
        type: "towerBuff",
        towerType: towerKey,
        stat: "damage",
        multiplier: DAMAGE_BUFF_MULTIPLIER,
        permanent: true
      }
    };
  }

  function createRangeBuffCardConfig(towerKey) {
    const towerLabel = getTowerLabel(towerKey);
    return {
      title: t("cards.range.title", { tower: towerLabel }),
      description: t("cards.range.description", { tower: towerLabel }),
      result: t("cards.range.result", { tower: towerLabel }),
      effect: {
        type: "towerBuff",
        towerType: towerKey,
        stat: "range",
        multiplier: RANGE_BUFF_MULTIPLIER,
        permanent: true
      }
    };
  }

  function createPowerSurgeCardConfig() {
    const tower = getRandomPlacedTower();
    if (!tower) return null;

    const towerLabel = getTowerLabel(tower.type);
    return {
      title: t("cards.powerSurge.title", { tower: towerLabel }),
      description: t("cards.powerSurge.description", { tower: towerLabel }),
      result: t("cards.powerSurge.result", { tower: towerLabel }),
      effect: {
        type: "towerBuff",
        towerId: tower.id,
        towerType: tower.type,
        stat: "damage",
        multiplier: POWER_SURGE_MULTIPLIER,
        durationWaves: CARD_EFFECT_DURATION_WAVES,
        ignoreMaxDamage: true
      }
    };
  }

  function createBaneCard() {
    const towerTypeClearCard = createTowerTypeClearCardConfig();
    if (towerTypeClearCard) {
      return buildCard("bane", towerTypeClearCard);
    }

    const damageSetbackCard = createDamageSetbackCardConfig();
    if (damageSetbackCard) {
      return buildCard("bane", damageSetbackCard);
    }

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

    const rangeSetbackCard = createRangeSetbackCardConfig();
    if (rangeSetbackCard) {
      cards.push(rangeSetbackCard);
    }

    return buildCard("bane", randomItem(cards));
  }

  function createTowerTypeClearCardConfig() {
    if (!isBoardFilledWithTowers()) return null;

    const towerKey = getRandomPlacedTowerKey();
    if (!towerKey) return null;

    const towerLabel = getTowerLabel(towerKey);
    const towerCount = getPlacedTowerCountByType(towerKey);
    return {
      title: t("cards.towerTypeClear.title", { tower: towerLabel }),
      description: t("cards.towerTypeClear.description", { tower: towerLabel, count: towerCount }),
      result: t("cards.towerTypeClear.result", { tower: towerLabel, count: towerCount }),
      effect: {
        type: "removeTowerType",
        towerType: towerKey
      }
    };
  }

  function createDamageSetbackCardConfig() {
    const towerKey = getRandomMaxDamageTowerKey();
    if (!towerKey) return null;

    const towerLabel = getTowerLabel(towerKey);
    return {
      title: t("cards.damageSetback.title", { tower: towerLabel }),
      description: t("cards.damageSetback.description", { tower: towerLabel }),
      result: t("cards.damageSetback.result", { tower: towerLabel }),
      effect: {
        type: "towerBuff",
        towerType: towerKey,
        stat: "damage",
        multiplier: DAMAGE_SETBACK_MULTIPLIER,
        permanent: true
      }
    };
  }

  function createRangeSetbackCardConfig() {
    const towerKey = getRandomMaxRangeTowerKey();
    if (!towerKey) return null;

    const towerLabel = getTowerLabel(towerKey);
    return {
      title: t("cards.rangeSetback.title", { tower: towerLabel }),
      description: t("cards.rangeSetback.description", { tower: towerLabel }),
      result: t("cards.rangeSetback.result", { tower: towerLabel }),
      effect: {
        type: "towerBuff",
        towerType: towerKey,
        stat: "range",
        multiplier: RANGE_SETBACK_MULTIPLIER,
        permanent: true
      }
    };
  }

  function buildCard(kind, config) {
    return {
      id: `${kind}-${state.wave}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      category: getCardCategory(kind, config.effect),
      ...config
    };
  }

  function getCardCategory(kind, effect = {}) {
    if (kind === "bane") return "setback";
    if (effect.type === "towerBuff" && effect.multiplier > 1) return "improvement";
    if (effect.type === "coins" && effect.amount > 0) return "bonus";
    if (kind === "boon") return "bonus";
    return kind;
  }

  function getRandomDamageBuffTowerKey() {
    const towerKeys = getUnlockedTowerKeys(state.theme).filter((towerKey) => {
      return towers[towerKey] && canOfferDamageBuff(towerKey);
    });
    return towerKeys.length ? randomItem(towerKeys) : "";
  }

  function getRandomRangeBuffTowerKey() {
    const towerKeys = getUnlockedTowerKeys(state.theme).filter((towerKey) => {
      return towers[towerKey] && canOfferRangeBuff(towerKey);
    });
    return towerKeys.length ? randomItem(towerKeys) : "";
  }

  function getRandomPlacedTowerKey() {
    const towerKeys = Array.from(new Set(state.placedTowers.map((tower) => tower.type)))
      .filter((towerKey) => towers[towerKey]);
    return towerKeys.length ? randomItem(towerKeys) : "";
  }

  function getRandomPlacedTower() {
    const placedTowers = state.placedTowers.filter((tower) => towers[tower.type]);
    return placedTowers.length ? randomItem(placedTowers) : null;
  }

  function getPlacedTowerCountByType(towerType) {
    return state.placedTowers.filter((tower) => tower.type === towerType).length;
  }

  function getTerrainTileSets() {
    const map = maps[state.theme];
    if (!map) return null;

    return {
      map,
      pathSet: state.pathSet || new Set(map.path.map(([x, y]) => coordKey(x, y))),
      blockedSet: state.blockedSet || new Set(map.blocked)
    };
  }

  function canAnyUnlockedTowerReachPathFromTile(x, y, map) {
    const unlockedTowerKeys = getUnlockedTowerKeys(state.theme).filter((towerKey) => towers[towerKey]);
    return unlockedTowerKeys.some((towerKey) => {
      const towerStats = getTowerCombatStats(towerKey);
      if (!towerStats) return false;

      const towerCenterX = x + 0.5;
      const towerCenterY = y + 0.5;
      return map.path.some(([pathX, pathY]) => {
        return Math.hypot(pathX + 0.5 - towerCenterX, pathY + 0.5 - towerCenterY) <= towerStats.range;
      });
    });
  }

  function isBoardFilledWithTowers() {
    const terrain = getTerrainTileSets();
    if (!terrain) return false;

    let fillableTileCount = 0;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const key = coordKey(x, y);
        if (terrain.pathSet.has(key) || terrain.blockedSet.has(key)) {
          continue;
        }
        if (!canAnyUnlockedTowerReachPathFromTile(x, y, terrain.map)) {
          continue;
        }

        fillableTileCount += 1;
        if (!state.occupied.has(key)) {
          return false;
        }
      }
    }

    return fillableTileCount > 0;
  }

  function getTowerMaxDamage(towerType) {
    const maxDamage = towers[towerType]?.maxDamage;
    return Number.isFinite(maxDamage) ? maxDamage : Infinity;
  }

  function canOfferDamageBuff(towerType) {
    const towerStats = getTowerCombatStats(towerType);
    const maxDamage = getTowerMaxDamage(towerType);
    return Boolean(towerStats)
      && (!Number.isFinite(maxDamage) || towerStats.damage < maxDamage - DAMAGE_MAX_EPSILON);
  }

  function canOfferRangeBuff(towerType) {
    const towerStats = getTowerCombatStats(towerType);
    return Boolean(towerStats) && towerStats.range < MAX_TOWER_RANGE - RANGE_MAX_EPSILON;
  }

  function getRandomMaxDamageTowerKey() {
    const maxDamageTowerKeys = getUnlockedTowerKeys(state.theme).filter((towerKey) => {
      return towers[towerKey] && !canOfferDamageBuff(towerKey);
    });
    return maxDamageTowerKeys.length ? randomItem(maxDamageTowerKeys) : "";
  }

  function getRandomMaxRangeTowerKey() {
    const maxRangeTowerKeys = getUnlockedTowerKeys(state.theme).filter((towerKey) => {
      return towers[towerKey] && !canOfferRangeBuff(towerKey);
    });
    return maxRangeTowerKeys.length ? randomItem(maxRangeTowerKeys) : "";
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
      logDebug("economy", "Card changed coins", {
        requestedAmount: effect.amount,
        actualAmount: coinDifference,
        coins: state.coins
      });

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
      logDebug("economy", "Card removed all coins", {
        actualAmount: -previousCoins,
        coins: state.coins
      });
      return previousCoins > 0
        ? t("cards.coinsLoss.result", { amount: previousCoins })
        : t("cards.noCoinsLost");
    }

    if (effect.type === "removeTowerType") {
      return removeTowersByType(effect.towerType);
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

  function removeTowersByType(towerType) {
    const towerLabel = getTowerLabel(towerType);
    const towersToRemove = state.placedTowers.filter((tower) => tower.type === towerType);

    towersToRemove.forEach((tower) => {
      removeTower(tower);
    });

    logDebug("towers", "Tower type cleared by card", {
      type: towerType,
      label: towerLabel,
      count: towersToRemove.length
    });

    return towersToRemove.length > 0
      ? t("cards.towerTypeClear.result", { tower: towerLabel, count: towersToRemove.length })
      : t("cards.towerTypeClear.none", { tower: towerLabel });
  }

  function getCardEffectExpirationWave(effect) {
    if (effect.permanent) return Infinity;
    return state.wave + (effect.durationWaves || CARD_EFFECT_DURATION_WAVES);
  }

  function addTowerBuff(effect) {
    const buff = {
      towerId: effect.towerId,
      towerType: effect.towerType,
      stat: effect.stat,
      multiplier: effect.multiplier,
      permanent: Boolean(effect.permanent),
      ignoreMaxDamage: Boolean(effect.ignoreMaxDamage),
      expiresAfterWave: getCardEffectExpirationWave(effect)
    };
    state.cardEffects.towerBuffs.push(buff);
    logDebug("towers", "Tower buff applied", buff);
  }

  function addEnemyModifier(effect) {
    state.cardEffects.enemyModifiers = state.cardEffects.enemyModifiers.filter((modifier) => {
      return modifier.stat !== effect.stat;
    });
    const modifier = {
      stat: effect.stat,
      multiplier: effect.multiplier,
      expiresAfterWave: getCardEffectExpirationWave(effect)
    };
    state.cardEffects.enemyModifiers.push(modifier);
    logDebug("cards", "Enemy modifier applied", modifier);
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

  function getTowerCombatStats(towerOrType) {
    const towerType = typeof towerOrType === "string" ? towerOrType : towerOrType?.type;
    const towerId = typeof towerOrType === "string" ? undefined : towerOrType?.id;
    const towerDef = towers[towerType];
    if (!towerDef) return null;
    const stats = { ...towerDef };
    const maxDamage = getTowerMaxDamage(towerType);
    let ignoreMaxDamage = false;
    state.cardEffects.towerBuffs
      .filter((buff) => {
        return buff.towerType === towerType
          && (!buff.towerId || buff.towerId === towerId)
          && isCardEffectActive(buff);
      })
      .forEach((buff) => {
        if (buff.stat === "damage") {
          const nextDamage = Math.max(1, Math.round(stats.damage * buff.multiplier));
          if (buff.ignoreMaxDamage) {
            ignoreMaxDamage = true;
            stats.damage = nextDamage;
          } else {
            stats.damage = Number.isFinite(maxDamage) ? Math.min(maxDamage, nextDamage) : nextDamage;
          }
        } else if (buff.stat === "range") {
          stats.range = Math.min(MAX_TOWER_RANGE, stats.range * buff.multiplier);
        }
      });
    if (Number.isFinite(maxDamage) && !ignoreMaxDamage) {
      stats.damage = Math.min(maxDamage, stats.damage);
    }
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
    const hpLostThisWave = state.waveHpLost;
    state.waveInProgress = false;
    state.sessionDefeated += defeatedThisWave;
    state.waveDefeated = 0;
    state.waveComboVisible = false;
    clearExpiredCardEffects(finishedWave);

    const steps = [t("wave.end", { wave: finishedWave, defeated: defeatedThisWave })];
    const willOfferCards = shouldOfferCardChoice(finishedWave);
    logDebug("waves", "Wave completed", {
      wave: finishedWave,
      defeated: defeatedThisWave,
      hpLost: hpLostThisWave,
      willOfferCards
    });

    if (willOfferCards) {
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
    const healthEl = document.createElement("div");
    const healthBar = document.createElement("span");
    healthEl.className = "health";
    healthEl.appendChild(healthBar);
    el.appendChild(healthEl);
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
      healthBar,
      el
    };

    state.nextEnemyId += 1;
    state.enemies.push(enemy);
    state.enemiesById?.set(enemy.id, enemy);
    setElementPosition(el, enemy.x, enemy.y);
  }

  function moveEnemies(dt) {
    const path = state.pathCenters?.length
      ? state.pathCenters
      : maps[state.theme].path.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
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
      logDebug("combat", "Enemy reached exit", {
        id: enemy.id,
        wave: state.wave,
        lives: state.lives,
        waveHpLost: state.waveHpLost
      });
      if (state.lives <= 0) endGame();
    });
  }

  function updateTowers(dt) {
    state.placedTowers.forEach((tower) => {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) return;

      const towerDef = getTowerCombatStats(tower);
      if (!towerDef) return;
      const target = findTarget(tower, towerDef.range);
      if (!target) return;

      tower.cooldown = 1 / towerDef.fireRate;
      fireProjectile(tower, target, towerDef);
    });
  }

  function findTarget(tower, range) {
    let best = null;
    let bestProgress = -1;
    const rangeSq = range * range;

    state.enemies.forEach((enemy) => {
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > rangeSq) return;

      const distance = Math.sqrt(distanceSq);
      const progress = enemy.pathIndex + distance / 10;
      if (progress > bestProgress) {
        best = enemy;
        bestProgress = progress;
      }
    });

    return best;
  }

  function fireProjectile(tower, target, towerDef) {
    const el = acquirePooledElement(
      projectileElementPool,
      `projectile ${towerDef.projectileClass || ""}`.trim()
    );

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
      const target = state.enemiesById?.get(projectile.targetId)
        || state.enemies.find((enemy) => enemy.id === projectile.targetId);
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
    if (enemy.healthBar) {
      enemy.healthBar.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
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
    state.enemiesById?.delete(enemy.id);
    enemy.el?.remove();
    if (awardCoins) {
      playSfx("enemyDeath");
      state.waveDefeated += 1;
      state.coins += enemy.reward;
      logDebug("combat", "Enemy defeated", {
        id: enemy.id,
        wave: state.wave,
        reward: enemy.reward,
        waveDefeated: state.waveDefeated
      });
      logDebug("economy", "Enemy reward collected", {
        amount: enemy.reward,
        coins: state.coins
      });
    }
  }

  function removeProjectile(projectile) {
    const index = state.projectiles.indexOf(projectile);
    if (index >= 0) {
      state.projectiles.splice(index, 1);
    }
    releasePooledElement(projectileElementPool, PROJECTILE_POOL_LIMIT, projectile.el);
  }

  function createImpact(x, y) {
    const el = acquirePooledElement(impactElementPool, "impact");
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
        releasePooledElement(impactElementPool, IMPACT_POOL_LIMIT, impact.el);
        return false;
      }
      return true;
    });
  }

  function endGame() {
    if (state.gameOver) return;
    state.gameOver = true;
    state.waveComboVisible = false;
    ntp.clearSavedGame?.();
    setDeleteMode(false, { silent: true });
    clearUndoPlacement();
    hidePauseMenu();
    hideVictory();
    state.lives = 0;
    showGameOver();
    updateHud();
    logDebug("system", "Game over", {
      theme: state.theme,
      wave: state.wave,
      defeated: state.sessionDefeated
    });
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
    openPauseMenu,
    closePauseMenu,
    toggleSpeed,
    cycleSelectedTower,
    startNextWave,
    beginWaveSpawn
  });
})();
