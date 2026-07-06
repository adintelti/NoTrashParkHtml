(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    dom,
    GAME_VERSION,
    getMapName,
    getNextTheme,
    getTowerLabel,
    getUnlockedTowerKeys,
    getVictoryTitle,
    isTowerUnlocked,
    maps,
    saveControllerLayout,
    settings,
    state,
    t,
    towers
  } = ntp;

  const GAMEPAD_FACE_CLASSES = ["is-a", "is-b", "is-x", "is-y"];
  const controllerLayoutLabels = {
    xbox: {
      faceSouth: { text: "A", faceClass: "is-a" },
      faceEast: { text: "B", faceClass: "is-b" },
      faceWest: { text: "X", faceClass: "is-x" },
      faceNorth: { text: "Y", faceClass: "is-y" },
      leftBumper: { text: "LB" },
      rightBumper: { text: "RB" },
      rightTrigger: { text: "RT" },
      back: { text: "View" },
      leftStick: { text: "LS" }
    },
    switch: {
      faceSouth: { text: "B", faceClass: "is-b" },
      faceEast: { text: "A", faceClass: "is-a" },
      faceWest: { text: "Y", faceClass: "is-y" },
      faceNorth: { text: "X", faceClass: "is-x" },
      leftBumper: { text: "L" },
      rightBumper: { text: "R" },
      rightTrigger: { text: "ZR" },
      back: { text: "-" },
      leftStick: { text: "LS" }
    }
  };

  let messageTimer = 0;
  let hudCache = {};
  let shopButtonCache = null;
  let undoSecondsEl = null;
  let deleteActionLabelEl = null;

  function invalidateHud() {
    hudCache = {};
    shopButtonCache = null;
    undoSecondsEl = null;
    deleteActionLabelEl = null;
  }

  function setCachedText(cacheKey, el, text) {
    if (hudCache[cacheKey] === text) return;
    el.textContent = text;
    hudCache[cacheKey] = text;
  }

  function setCachedHidden(cacheKey, el, hidden) {
    if (hudCache[cacheKey] === hidden) return;
    el.hidden = hidden;
    hudCache[cacheKey] = hidden;
  }

  function setCachedClass(cacheKey, el, className, active) {
    if (hudCache[cacheKey] === active) return;
    el.classList.toggle(className, active);
    hudCache[cacheKey] = active;
  }

  function getShopButtons() {
    if (!shopButtonCache) {
      shopButtonCache = Array.from(document.querySelectorAll(".shop-button[data-tower]")).map((button) => ({
        button,
        labelEl: button.querySelector("span"),
        priceEl: button.querySelector("strong"),
        attackEl: ensureShopStatEl(button, "shop-attack"),
        rangeEl: ensureShopStatEl(button, "shop-range")
      }));
    }

    return shopButtonCache;
  }

  function ensureShopStatEl(button, className) {
    let statEl = button.querySelector(`.${className}`);
    if (!statEl) {
      statEl = document.createElement("small");
      button.appendChild(statEl);
    }

    statEl.classList.add("shop-stat", className);
    return statEl;
  }

  function getTowerShopStats(towerKey) {
    return ntp.getTowerCombatStats?.(towerKey) || towers[towerKey];
  }

  function getTowerAttackValue(towerKey) {
    const towerStats = getTowerShopStats(towerKey);
    return Number.isFinite(towerStats?.damage) ? Math.round(towerStats.damage) : null;
  }

  function getTowerRangeValue(towerKey) {
    const towerStats = getTowerShopStats(towerKey);
    return Number.isFinite(towerStats?.range) ? towerStats.range : null;
  }

  function formatTowerRangeValue(rangeValue) {
    if (!Number.isFinite(rangeValue)) return "";
    return Number.isInteger(rangeValue)
      ? String(rangeValue)
      : rangeValue.toFixed(1).replace(/\.0$/, "");
  }

  function getShopStatsSignature() {
    return Object.keys(towers)
      .map((towerKey) => `${towerKey}:${getTowerAttackValue(towerKey) ?? ""}:${formatTowerRangeValue(getTowerRangeValue(towerKey))}`)
      .join(",");
  }

  function getUndoSecondsEl() {
    if (!undoSecondsEl) {
      undoSecondsEl = dom.undoTowerButton.querySelector("strong");
    }
    return undoSecondsEl;
  }

  function getDeleteActionLabelEl() {
    if (!deleteActionLabelEl) {
      deleteActionLabelEl = dom.deleteTowerButton.querySelector("strong");
    }
    return deleteActionLabelEl;
  }

  function formatSessionTime(totalSeconds = 0) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const seconds = String(safeSeconds % 60).padStart(2, "0");
    const minutes = Math.floor(safeSeconds / 60) % 60;
    const hours = Math.floor(safeSeconds / 3600);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
    }

    return `${String(minutes).padStart(2, "0")}:${seconds}`;
  }

  function getWaveProgressText() {
    return `${state.wave}/${state.waveLimit}`;
  }

  function updateVersionText() {
    dom.versionText.textContent = t("version.label", { version: GAME_VERSION });
  }

  function updateHud() {
    setCachedText("coins", dom.coinText, String(state.coins));
    setCachedText("lives", dom.livesText, String(state.lives));
    setCachedText("wave", dom.waveText, getWaveProgressText());
    setCachedText("defeated", dom.defeatedText, String(state.sessionDefeated));
    setCachedText("sessionTime", dom.sessionTimeText, formatSessionTime(state.sessionTime));
    setCachedText("comboText", dom.comboCounter, `${state.waveDefeated}X`);
    setCachedHidden("comboHidden", dom.comboCounter, !state.waveComboVisible);
    setCachedClass("comboActive", dom.comboCounter, "is-active", state.waveDefeated > 0);
    setCachedText("pauseLabel", dom.pauseButton, t("actions.pause"));
    setCachedText("speedLabel", dom.speedButton, `${state.speed}x`);

    const shownLives = Math.min(5, state.lives);
    if (hudCache.shownLives !== shownLives) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < shownLives; i += 1) {
        const heart = document.createElement("span");
        heart.className = "heart-dot";
        fragment.appendChild(heart);
      }
      dom.heartStack.replaceChildren(fragment);
      hudCache.shownLives = shownLives;
    }

    const shopSignature = `${state.coins}|${state.theme}|${state.selectedTower}|${settings.language}|${getShopStatsSignature()}`;
    if (hudCache.shopSignature !== shopSignature) {
      syncShopButtons();
      hudCache.shopSignature = shopSignature;
    }

    syncTowerActionUi();
    syncPlacementPreviewFromHud();
  }

  function syncShopButtons() {
    getShopButtons().forEach(({ button, labelEl, priceEl, attackEl, rangeEl }) => {
      const towerKey = button.dataset.tower;
      const towerDef = towers[towerKey];
      const towerLabel = getTowerLabel(towerKey);
      const isUnlocked = isTowerUnlocked(towerKey, state.theme);
      const isActive = isUnlocked && towerKey === state.selectedTower;
      const attackValue = getTowerAttackValue(towerKey);
      const rangeValue = getTowerRangeValue(towerKey);
      const rangeLabel = formatTowerRangeValue(rangeValue);
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-locked", !isUnlocked);
      button.disabled = !isUnlocked || state.coins < towerDef.cost;
      button.title = isUnlocked ? "" : t("shop.lockedBiome");
      button.setAttribute(
        "aria-label",
        isUnlocked
          ? t("shop.towerAria", { tower: towerLabel, price: towerDef.cost, attack: attackValue, range: rangeLabel })
          : t("shop.towerLockedAria", { tower: towerLabel })
      );
      if (labelEl) {
        labelEl.textContent = towerLabel;
      }
      if (priceEl) {
        priceEl.textContent = isUnlocked ? `$${towerDef.cost}` : t("shop.lockedShort");
      }
      if (attackEl) {
        const showAttack = isUnlocked && attackValue !== null;
        attackEl.hidden = !showAttack;
        attackEl.textContent = showAttack ? t("shop.attackShort", { attack: attackValue }) : "";
      }
      if (rangeEl) {
        const showRange = isUnlocked && rangeLabel !== "";
        rangeEl.hidden = !showRange;
        rangeEl.textContent = showRange ? t("shop.rangeShort", { range: rangeLabel }) : "";
      }
    });
  }

  function syncTowerActionUi() {
    const canUndo = Boolean(ntp.isUndoPlacementAvailable?.());
    const undoSecondsRemaining = ntp.getUndoPlacementSecondsRemaining?.() || 0;
    setCachedHidden("undoHidden", dom.undoTowerButton, !canUndo);
    if (hudCache.undoDisabled !== !canUndo) {
      dom.undoTowerButton.disabled = !canUndo;
      hudCache.undoDisabled = !canUndo;
    }
    if (canUndo) {
      const secondsLabel = `${undoSecondsRemaining}s`;
      const priceEl = getUndoSecondsEl();
      const undoAria = t("shop.undoAria", { seconds: secondsLabel });
      if (hudCache.undoAria !== undoAria) {
        dom.undoTowerButton.setAttribute("aria-label", undoAria);
        hudCache.undoAria = undoAria;
      }
      if (priceEl) {
        setCachedText("undoSeconds", priceEl, secondsLabel);
      }
    }

    setCachedClass("deleteActive", dom.deleteTowerButton, "is-active", state.deleteMode);
    const deletePressed = String(state.deleteMode);
    if (hudCache.deletePressed !== deletePressed) {
      dom.deleteTowerButton.setAttribute("aria-pressed", deletePressed);
      hudCache.deletePressed = deletePressed;
    }
    const deleteLabel = getDeleteActionLabelEl();
    if (deleteLabel) {
      setCachedText("deleteLabel", deleteLabel, state.deleteMode ? t("common.cancel") : t("shop.select"));
    }

    syncTowerDeleteHighlights();
  }

  function syncTowerDeleteHighlights() {
    const towerSignature = state.deleteMode
      ? state.placedTowers.map((tower) => `${tower.id}:${tower.tileX},${tower.tileY}`).join(",")
      : "";
    const signature = `${state.deleteMode}|${state.pendingDeleteTower?.id || 0}|${towerSignature}`;
    if (hudCache.deleteHighlights === signature) return;
    hudCache.deleteHighlights = signature;

    dom.board.classList.toggle("is-delete-mode", state.deleteMode);
    dom.board.querySelectorAll(".tile.delete-candidate, .tile.delete-target").forEach((tile) => {
      tile.classList.remove("delete-candidate", "delete-target");
    });

    state.placedTowers.forEach((tower) => {
      const isPending = tower === state.pendingDeleteTower;
      tower.el?.classList.toggle("is-removable", state.deleteMode);
      tower.el?.classList.toggle("is-delete-target", isPending);
      if (!state.deleteMode) return;

      const tile = ntp.getTileAt?.(tower.tileX, tower.tileY);
      if (!tile) return;
      tile.classList.add(isPending ? "delete-target" : "delete-candidate");
    });
  }

  function syncPlacementPreviewFromHud() {
    const signature = [
      state.coins,
      state.selectedTower,
      state.theme,
      state.wave,
      state.cardEffects?.towerBuffs?.length || 0,
      state.deleteMode,
      state.paused,
      state.running,
      state.gameOver,
      state.victoryPending
    ].join("|");

    if (hudCache.placementPreview === signature) return;
    hudCache.placementPreview = signature;
    ntp.refreshPlacementPreview?.();
  }

  function ensureSelectedTowerUnlocked() {
    if (isTowerUnlocked(state.selectedTower, state.theme)) return;
    state.selectedTower = getUnlockedTowerKeys(state.theme)[0] || state.selectedTower;
  }

  function setControllerLayout(controllerLayout) {
    settings.controllerLayout = controllerLayout === "switch" ? "switch" : "xbox";
    saveControllerLayout(settings.controllerLayout);
    syncControllerLayout();
  }

  function syncControllerLayout() {
    const layout = controllerLayoutLabels[settings.controllerLayout] ? settings.controllerLayout : "xbox";
    settings.controllerLayout = layout;
    dom.app.dataset.controllerLayout = layout;

    document.querySelectorAll("[data-controller-layout]").forEach((button) => {
      const isSelected = button.dataset.controllerLayout === layout;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    document.querySelectorAll("[data-gamepad-token]").forEach((el) => {
      const config = controllerLayoutLabels[layout][el.dataset.gamepadToken];
      if (!config) return;

      el.textContent = config.text;
      if (el.classList.contains("pad-key-face")) {
        el.classList.remove(...GAMEPAD_FACE_CLASSES);
        el.classList.add(config.faceClass);
      }
    });
  }

  function showMessage(text) {
    dom.floatingMessage.textContent = text;
    dom.floatingMessage.classList.add("is-visible");
    messageTimer = 2.2;
  }

  function showWaveTransition(text) {
    dom.waveTransition.textContent = text;
    dom.waveTransition.hidden = false;
    dom.waveTransition.classList.add("is-visible");
  }

  function hideWaveTransition() {
    dom.waveTransition.classList.remove("is-visible");
    dom.waveTransition.hidden = true;
    dom.waveTransition.textContent = "";
  }

  function appendCardText(parent, tagName, className, text) {
    const el = document.createElement(tagName);
    el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  function renderCardChoiceCard(card, index) {
    const isRevealed = state.cardChoice.revealed;
    const isSelected = state.cardChoice.selectedCardId === card.id;
    const button = document.createElement("button");
    button.className = `card-choice-card is-${card.kind}`;
    button.type = "button";
    button.dataset.cardChoice = card.id;
    button.disabled = isRevealed;
    button.classList.toggle("is-revealed", isRevealed && isSelected);
    button.classList.toggle("is-dimmed", isRevealed && !isSelected);
    button.setAttribute("aria-label", isRevealed && isSelected ? card.title : t("cards.cardAria", { index: index + 1 }));

    if (isRevealed && isSelected) {
      const categoryKey = card.category || card.kind;
      appendCardText(button, "span", "card-choice-kind", t(`cards.kind.${categoryKey}`, {}, t("cards.defaultKind")));
      appendCardText(button, "strong", "card-choice-name", card.title);
      return button;
    }

    appendCardText(button, "span", "card-choice-back", "?");
    appendCardText(button, "span", "card-choice-index", t("cards.cardIndex", { index: index + 1 }));
    return button;
  }

  function renderCardChoice() {
    dom.cardChoiceCards.textContent = "";
    dom.cardChoiceCards.classList.toggle("is-revealed", state.cardChoice.revealed);
    state.cardChoice.cards.forEach((card, index) => {
      dom.cardChoiceCards.appendChild(renderCardChoiceCard(card, index));
    });

    const hasResult = Boolean(state.cardChoice.revealed && state.cardChoice.resultText);
    dom.cardChoiceResult.hidden = !hasResult;
    dom.cardChoiceResult.textContent = hasResult ? state.cardChoice.resultText : "";
    dom.cardChoiceContinueButton.hidden = !state.cardChoice.revealed;
  }

  function showCardChoice() {
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hidePauseMenu();
    renderCardChoice();
    dom.cardChoiceOverlay.hidden = false;
    dom.floatingMessage.classList.remove("is-visible");
    messageTimer = 0;

    const focusTarget = state.cardChoice.revealed
      ? dom.cardChoiceContinueButton
      : dom.cardChoiceCards.querySelector("button");
    focusCardChoiceTarget(focusTarget);
  }

  function focusCardChoiceTarget(focusTarget) {
    if (!focusTarget) return;

    window.requestAnimationFrame(() => {
      ntp.clearGamepadButtonFocus?.();

      if (dom.app.classList.contains("using-gamepad")) {
        ntp.focusGamepadButton?.(focusTarget);
        return;
      }

      focusTarget.focus({ preventScroll: true });
    });
  }

  function hideCardChoice() {
    dom.cardChoiceOverlay.hidden = true;
    dom.cardChoiceCards.textContent = "";
    dom.cardChoiceResult.textContent = "";
    dom.cardChoiceResult.hidden = true;
    dom.cardChoiceContinueButton.hidden = true;
  }

  function isCardChoiceOpen() {
    return !dom.cardChoiceOverlay.hidden;
  }

  function tickMessageTimer(rawDt) {
    if (messageTimer <= 0) return;
    messageTimer -= rawDt;
    if (messageTimer <= 0) {
      dom.floatingMessage.classList.remove("is-visible");
    }
  }

  function showVictory() {
    const hasNextTheme = Boolean(getNextTheme(state.theme));
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hidePauseMenu();
    hideCardChoice();
    dom.victoryTitle.textContent = getVictoryTitle(state.theme);
    updateResultDetails();
    dom.victoryContinueButton.hidden = !hasNextTheme;
    dom.victoryOverlay.classList.toggle("is-final-victory", !hasNextTheme);
    dom.victoryOverlay.classList.remove("is-game-over");
    dom.victoryOverlay.hidden = false;
    dom.floatingMessage.classList.remove("is-visible");
    messageTimer = 0;
  }

  function showGameOver() {
    const levelName = getMapName(state.theme) || maps[state.theme]?.name || "Fase";
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hidePauseMenu();
    hideCardChoice();
    dom.victoryTitle.textContent = t("victory.gameOver", { map: levelName });
    updateResultDetails();
    dom.victoryContinueButton.hidden = true;
    dom.victoryOverlay.classList.remove("is-final-victory");
    dom.victoryOverlay.classList.add("is-game-over");
    dom.victoryOverlay.hidden = false;
    dom.floatingMessage.classList.remove("is-visible");
    messageTimer = 0;
  }

  function updateResultDetails() {
    dom.victoryTimeText.textContent = formatSessionTime(state.sessionTime);
    dom.victoryWaveText.textContent = getWaveProgressText();
    dom.victoryDefeatedText.textContent = String(state.sessionDefeated);
  }

  function hideVictory() {
    dom.victoryOverlay.hidden = true;
    dom.victorySummary.hidden = false;
    dom.victoryContinueButton.hidden = false;
    dom.victoryOverlay.classList.remove("is-final-victory", "is-game-over");
  }

  function showRestartConfirm() {
    hideExitConfirm();
    hideTowerDeleteConfirm();
    hidePauseMenu();
    dom.restartConfirmOverlay.hidden = false;
    dom.restartConfirmNoButton.focus({ preventScroll: true });
  }

  function hideRestartConfirm() {
    dom.restartConfirmOverlay.hidden = true;
  }

  function showExitConfirm() {
    hideRestartConfirm();
    hideTowerDeleteConfirm();
    hidePauseMenu();
    dom.exitConfirmOverlay.hidden = false;
    dom.exitConfirmNoButton.focus({ preventScroll: true });
  }

  function hideExitConfirm() {
    dom.exitConfirmOverlay.hidden = true;
  }

  function showTowerDeleteConfirm() {
    hideRestartConfirm();
    hideExitConfirm();
    hidePauseMenu();
    dom.towerDeleteConfirmOverlay.hidden = false;
    dom.towerDeleteConfirmNoButton.focus({ preventScroll: true });
  }

  function hideTowerDeleteConfirm() {
    dom.towerDeleteConfirmOverlay.hidden = true;
  }

  function showPauseMenu() {
    hideRestartConfirm();
    hideExitConfirm();
    hideTowerDeleteConfirm();
    dom.pauseMenuActions.hidden = false;
    dom.pauseSoundPanel.hidden = true;
    syncPauseSaveButton();
    dom.pauseMenuOverlay.hidden = false;
    dom.floatingMessage.classList.remove("is-visible");
    messageTimer = 0;
    focusPauseTarget(dom.pauseResumeButton);
  }

  function hidePauseMenu() {
    dom.pauseMenuOverlay.hidden = true;
    dom.pauseMenuActions.hidden = false;
    dom.pauseSoundPanel.hidden = true;
  }

  function showPauseSoundPanel() {
    dom.pauseMenuActions.hidden = true;
    dom.pauseSoundPanel.hidden = false;
    ntp.syncSoundControls?.();
    focusPauseTarget(dom.pauseSoundPanel.querySelector("[data-sound-toggle]") || dom.pauseSoundBackButton);
  }

  function hidePauseSoundPanel() {
    dom.pauseSoundPanel.hidden = true;
    dom.pauseMenuActions.hidden = false;
    focusPauseTarget(dom.pauseSoundButton);
  }

  function syncPauseSaveButton() {
    const canSave = Boolean(ntp.canSaveGame?.());
    dom.pauseSaveExitButton.disabled = !canSave;
    dom.pauseSaveExitButton.setAttribute("aria-disabled", String(!canSave));
    dom.pauseSaveExitButton.title = canSave ? "" : t("pause.saveUnavailable");
  }

  function focusPauseTarget(focusTarget) {
    if (!focusTarget) return;

    window.requestAnimationFrame(() => {
      ntp.clearGamepadButtonFocus?.();

      if (dom.app.classList.contains("using-gamepad")) {
        ntp.focusGamepadButton?.(focusTarget);
        return;
      }

      focusTarget.focus({ preventScroll: true });
    });
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

  function syncThemeButtons(theme) {
    document.querySelectorAll("[data-theme]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.theme === theme);
    });
    document.querySelectorAll("[data-menu-theme]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.menuTheme === theme);
    });
  }

  function isMenuVisible() {
    return !dom.menu.classList.contains("is-hidden");
  }

  function isVictoryOpen() {
    return !dom.victoryOverlay.hidden;
  }

  function isRestartConfirmOpen() {
    return !dom.restartConfirmOverlay.hidden;
  }

  function isExitConfirmOpen() {
    return !dom.exitConfirmOverlay.hidden;
  }

  function isTowerDeleteConfirmOpen() {
    return !dom.towerDeleteConfirmOverlay.hidden;
  }

  function isPauseMenuOpen() {
    return !dom.pauseMenuOverlay.hidden;
  }

  function isPauseSoundPanelOpen() {
    return isPauseMenuOpen() && !dom.pauseSoundPanel.hidden;
  }

  Object.assign(ntp, {
    invalidateHud,
    updateVersionText,
    updateHud,
    ensureSelectedTowerUnlocked,
    setControllerLayout,
    syncControllerLayout,
    showMessage,
    showWaveTransition,
    hideWaveTransition,
    showCardChoice,
    hideCardChoice,
    isCardChoiceOpen,
    tickMessageTimer,
    showVictory,
    showGameOver,
    hideVictory,
    formatSessionTime,
    showRestartConfirm,
    hideRestartConfirm,
    showExitConfirm,
    hideExitConfirm,
    showTowerDeleteConfirm,
    hideTowerDeleteConfirm,
    showPauseMenu,
    hidePauseMenu,
    showPauseSoundPanel,
    hidePauseSoundPanel,
    syncPauseSaveButton,
    showMenuNote,
    syncThemeButtons,
    isMenuVisible,
    isVictoryOpen,
    isRestartConfirmOpen,
    isExitConfirmOpen,
    isTowerDeleteConfirmOpen,
    isPauseMenuOpen,
    isPauseSoundPanelOpen
  });
})();
