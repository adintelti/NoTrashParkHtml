(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    beginWaveSpawn,
    cancelTowerDelete,
    clearGamepadButtonFocus,
    closePauseMenu,
    continueCardChoice,
    confirmTowerDelete,
    dom,
    focusGamepadButton,
    getFirstTheme,
    getNextTheme,
    handleGamepadConnected,
    handleGamepadDisconnected,
    hideExitConfirm,
    hidePauseSoundPanel,
    hidePlacementPreview,
    hideRestartConfirm,
    hideVictory,
    closeDifficultyPanel,
    isCardChoiceOpen,
    isCardFrequencyInput,
    isExitConfirmOpen,
    isDifficultyPanelOpen,
    isPauseMenuOpen,
    isPauseSoundPanelOpen,
    isRestartConfirmOpen,
    isTowerDeleteConfirmOpen,
    loadSavedGame,
    markPointerInputActive,
    measureBoard,
    normalizeCustomWaves,
    openDifficultyPanel,
    openPauseMenu,
    placeTower,
    refreshPlacementPreview,
    requestTowerDeleteAt,
    returnToMenu,
    sanitizeCustomWavesInput,
    selectCardChoice,
    setCardFrequency,
    setBgmEnabled,
    setControllerLayout,
    setDeleteMode,
    setDifficulty,
    setLanguage,
    setSfxEnabled,
    setBgmMasterVolume,
    setSfxMasterVolume,
    setTheme,
    settings,
    getSoundSettings,
    saveGame,
    showExitConfirm,
    showPauseSoundPanel,
    showRestartConfirm,
    showMenuNote,
    startGame,
    state,
    syncDifficultyButtons,
    syncPauseSaveButton,
    syncSavedGameButton,
    syncThemeButtons,
    t,
    toggleDeleteMode,
    toggleSpeed,
    undoLastTowerPlacement,
    updatePlacementPreview,
    updateHud
  } = ntp;

  let resizeObserver;
  let restartConfirmPreviousPaused = false;
  let exitConfirmPreviousPaused = false;
  let touchPreviewSignature = "";
  let suppressBoardClickUntil = 0;

  function openRestartConfirm() {
    if (!state.running) return;
    setDeleteMode(false, { silent: true });
    restartConfirmPreviousPaused = state.paused;
    state.paused = true;
    updateHud();
    showRestartConfirm();
  }

  function closeRestartConfirm() {
    hideRestartConfirm();
    state.paused = restartConfirmPreviousPaused;
    updateHud();
  }

  function confirmRestart() {
    hideRestartConfirm();
    startGame(state.theme);
  }

  function openExitConfirm() {
    if (!state.running) return;
    setDeleteMode(false, { silent: true });
    exitConfirmPreviousPaused = state.paused;
    state.paused = true;
    updateHud();
    showExitConfirm();
  }

  function closeExitConfirm() {
    hideExitConfirm();
    state.paused = exitConfirmPreviousPaused;
    updateHud();
  }

  function confirmExit() {
    hideExitConfirm();
    returnToMenu();
  }

  function saveAndExitFromPause() {
    if (!saveGame?.()) {
      syncPauseSaveButton?.();
      return;
    }

    closePauseMenu?.();
    returnToMenu();
    syncSavedGameButton?.();
  }

  function bindEvents() {
    dom.continueButton.addEventListener("click", () => {
      if (!loadSavedGame?.()) {
        syncSavedGameButton?.();
      }
    });
    dom.playButton.addEventListener("click", () => {
      openDifficultyPanel();
      focusGamepadButton(dom.difficultyPanel.querySelector("[data-difficulty]"));
    });
    dom.difficultyBackButton.addEventListener("click", () => {
      closeDifficultyPanel();
      focusGamepadButton(dom.playButton);
    });
    dom.startGameButton.addEventListener("click", () => {
      if (dom.startGameButton.disabled) return;
      normalizeCustomWaves();
      closeDifficultyPanel();
      startGame(getFirstTheme());
    });
    dom.configButton.addEventListener("click", () => {
      closeDifficultyPanel();
      dom.configPanel.hidden = !dom.configPanel.hidden;
    });
    dom.configBackButton.addEventListener("click", () => {
      dom.configPanel.hidden = true;
      focusGamepadButton(dom.configButton);
    });
    dom.exitButton.addEventListener("click", () => {
      dom.configPanel.hidden = true;
      closeDifficultyPanel();
      showMenuNote(t("menu.demoReady"));
    });
    dom.backToMenuButton.addEventListener("click", openExitConfirm);
    dom.pauseButton.addEventListener("click", openPauseMenu);
    dom.pauseResumeButton.addEventListener("click", closePauseMenu);
    dom.pauseSoundButton.addEventListener("click", showPauseSoundPanel);
    dom.pauseSoundBackButton.addEventListener("click", hidePauseSoundPanel);
    dom.pauseSaveExitButton.addEventListener("click", saveAndExitFromPause);
    dom.speedButton.addEventListener("click", toggleSpeed);
    dom.undoTowerButton.addEventListener("click", undoLastTowerPlacement);
    dom.deleteTowerButton.addEventListener("click", () => {
      resetTouchPreviewSelection();
      toggleDeleteMode();
    });
    dom.restartButton.addEventListener("click", openRestartConfirm);
    dom.restartConfirmYesButton.addEventListener("click", confirmRestart);
    dom.restartConfirmNoButton.addEventListener("click", closeRestartConfirm);
    dom.restartConfirmOverlay.addEventListener("click", (event) => {
      if (event.target === dom.restartConfirmOverlay) {
        closeRestartConfirm();
      }
    });
    dom.exitConfirmYesButton.addEventListener("click", confirmExit);
    dom.exitConfirmNoButton.addEventListener("click", closeExitConfirm);
    dom.exitConfirmOverlay.addEventListener("click", (event) => {
      if (event.target === dom.exitConfirmOverlay) {
        closeExitConfirm();
      }
    });
    dom.towerDeleteConfirmYesButton.addEventListener("click", confirmTowerDelete);
    dom.towerDeleteConfirmNoButton.addEventListener("click", cancelTowerDelete);
    dom.towerDeleteConfirmOverlay.addEventListener("click", (event) => {
      if (event.target === dom.towerDeleteConfirmOverlay) {
        cancelTowerDelete();
      }
    });
    dom.cardChoiceCards.addEventListener("click", (event) => {
      const button = event.target.closest("[data-card-choice]");
      if (!button || button.disabled) return;
      selectCardChoice(button.dataset.cardChoice);
    });
    dom.cardChoiceContinueButton.addEventListener("click", continueCardChoice);
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

    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => {
        const difficulty = button.dataset.difficulty;
        setDifficulty(difficulty);
        if (difficulty === "custom") {
          focusGamepadButton(dom.customWavesInput);
          dom.customWavesInput.select();
        }
      });
    });

    dom.customWavesInput.addEventListener("focus", () => setDifficulty("custom"));
    dom.customWavesInput.addEventListener("input", () => {
      sanitizeCustomWavesInput();
      settings.difficulty = "custom";
      syncDifficultyButtons();
    });
    dom.customWavesInput.addEventListener("change", normalizeCustomWaves);
    dom.customWavesInput.addEventListener("blur", normalizeCustomWaves);
    dom.cardFrequencyInput.addEventListener("input", () => {
      setCardFrequency(Number(dom.cardFrequencyInput.value));
    });

    document.querySelectorAll("[data-sound-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.soundToggle === "bgm") {
          setBgmEnabled(!getSoundSettings().bgmEnabled);
          return;
        }

        setSfxEnabled(!getSoundSettings().sfxEnabled);
      });
    });
    document.querySelectorAll("[data-controller-layout]").forEach((button) => {
      button.addEventListener("click", () => setControllerLayout(button.dataset.controllerLayout));
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });
    document.querySelectorAll("[data-sound-volume]").forEach((input) => {
      input.addEventListener("input", () => {
        if (input.dataset.soundVolume === "bgm") {
          setBgmMasterVolume(Number(input.value) / 100);
          return;
        }

        setSfxMasterVolume(Number(input.value) / 100);
      });
    });

    dom.towerShop.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tower]");
      if (!button || button.disabled) return;
      setDeleteMode(false, { silent: true });
      state.selectedTower = button.dataset.tower;
      resetTouchPreviewSelection();
      updateHud();
      refreshPlacementPreview();
    });

    dom.board.addEventListener("pointerdown", handleBoardPointerDown);
    dom.board.addEventListener("pointermove", previewPlacementFromEvent);
    dom.board.addEventListener("pointerleave", handleBoardPointerLeave);
    dom.board.addEventListener("focusin", previewPlacementFromEvent);
    dom.board.addEventListener("focusout", (event) => {
      if (!dom.board.contains(event.relatedTarget)) {
        resetTouchPreviewSelection();
        hidePlacementPreview();
      }
    });

    dom.board.addEventListener("click", handleBoardClick);
    dom.board.addEventListener("contextmenu", preventBoardContextMenu);

    window.addEventListener("gamepadconnected", (event) => handleGamepadConnected(event.gamepad));
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
    window.addEventListener("pointerdown", () => {
      markPointerInputActive();
      clearGamepadButtonFocus();
    });
    window.addEventListener("keydown", (event) => {
      markPointerInputActive();
      if (isCardFrequencyInput(document.activeElement)) {
        return;
      } else if (event.key === "Escape" && isCardChoiceOpen()) {
        event.preventDefault();
      } else if (event.key === "Escape" && isTowerDeleteConfirmOpen()) {
        event.preventDefault();
        cancelTowerDelete();
      } else if (event.key === "Escape" && state.deleteMode) {
        event.preventDefault();
        setDeleteMode(false);
      } else if (event.key === "Escape" && isRestartConfirmOpen()) {
        event.preventDefault();
        closeRestartConfirm();
      } else if (event.key === "Escape" && isExitConfirmOpen()) {
        event.preventDefault();
        closeExitConfirm();
      } else if (event.key === "Escape" && isDifficultyPanelOpen()) {
        event.preventDefault();
        closeDifficultyPanel();
        focusGamepadButton(dom.playButton);
      } else if (event.key === "Escape" && isPauseSoundPanelOpen?.()) {
        event.preventDefault();
        hidePauseSoundPanel?.();
      } else if (event.key === "Escape" && isPauseMenuOpen?.()) {
        event.preventDefault();
        closePauseMenu?.();
      }
    });
    window.addEventListener("resize", measureBoard);

    resizeObserver = new ResizeObserver(measureBoard);
    resizeObserver.observe(dom.board);
  }

  function handleBoardClick(event) {
    if (shouldSuppressBoardClick()) {
      event.preventDefault();
      return;
    }

    const tile = event.target.closest(".tile");
    if (!tile) return;

    const x = Number(tile.dataset.x);
    const y = Number(tile.dataset.y);
    resetTouchPreviewSelection();
    if (state.deleteMode) {
      requestTowerDeleteAt(x, y);
      return;
    }

    placeTower(x, y);
  }

  function handleBoardPointerDown(event) {
    const tile = event.target.closest(".tile");

    if (!isDirectPointer(event)) {
      if (tile && !state.deleteMode) {
        updatePlacementPreview(Number(tile.dataset.x), Number(tile.dataset.y));
      }
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    suppressNextBoardClick();
    markPointerInputActive();
    clearGamepadButtonFocus();

    if (!tile) {
      resetTouchPreviewSelection();
      hidePlacementPreview();
      return;
    }

    const x = Number(tile.dataset.x);
    const y = Number(tile.dataset.y);
    if (state.deleteMode) {
      resetTouchPreviewSelection();
      requestTowerDeleteAt(x, y);
      return;
    }

    updatePlacementPreview(x, y);

    const signature = getTouchPreviewSignature(x, y);
    if (touchPreviewSignature === signature) {
      resetTouchPreviewSelection();
      placeTower(x, y);
      return;
    }

    touchPreviewSignature = signature;
  }

  function handleBoardPointerLeave(event) {
    if (isDirectPointer(event)) return;
    resetTouchPreviewSelection();
    hidePlacementPreview();
  }

  function preventBoardContextMenu(event) {
    event.preventDefault();
  }

  function previewPlacementFromEvent(event) {
    const tile = event.target.closest(".tile");
    if (!tile) {
      hidePlacementPreview();
      return;
    }

    if (event.type === "pointermove" && isDirectPointer(event)) {
      return;
    }

    if (event.type === "pointermove") {
      markPointerInputActive();
      clearGamepadButtonFocus();
    }

    if (state.deleteMode) {
      hidePlacementPreview();
      return;
    }

    updatePlacementPreview(Number(tile.dataset.x), Number(tile.dataset.y));
  }

  function isDirectPointer(event) {
    return event.pointerType === "touch" || event.pointerType === "pen";
  }

  function getTouchPreviewSignature(x, y) {
    return `${x}|${y}|${state.selectedTower}`;
  }

  function resetTouchPreviewSelection() {
    touchPreviewSignature = "";
  }

  function getInteractionNow() {
    return window.performance?.now?.() || Date.now();
  }

  function suppressNextBoardClick() {
    suppressBoardClickUntil = getInteractionNow() + 700;
  }

  function shouldSuppressBoardClick() {
    if (!suppressBoardClickUntil) return false;

    const shouldSuppress = getInteractionNow() <= suppressBoardClickUntil;
    suppressBoardClickUntil = 0;
    return shouldSuppress;
  }

  Object.assign(ntp, {
    bindEvents,
    getResizeObserver: () => resizeObserver
  });
})();
