(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    beginWaveSpawn,
    clearGamepadButtonFocus,
    dom,
    focusGamepadButton,
    getFirstTheme,
    getNextTheme,
    handleGamepadConnected,
    handleGamepadDisconnected,
    hideExitConfirm,
    hidePlacementPreview,
    hideRestartConfirm,
    hideVictory,
    closeDifficultyPanel,
    isExitConfirmOpen,
    isDifficultyPanelOpen,
    isRestartConfirmOpen,
    markPointerInputActive,
    measureBoard,
    normalizeCustomWaves,
    openDifficultyPanel,
    placeTower,
    refreshPlacementPreview,
    returnToMenu,
    sanitizeCustomWavesInput,
    setBgmEnabled,
    setControllerLayout,
    setDifficulty,
    setSfxEnabled,
    setBgmMasterVolume,
    setSfxMasterVolume,
    setTheme,
    settings,
    getSoundSettings,
    showExitConfirm,
    showRestartConfirm,
    showMenuNote,
    startGame,
    state,
    syncDifficultyButtons,
    syncThemeButtons,
    togglePause,
    toggleSpeed,
    updatePlacementPreview,
    updateHud
  } = ntp;

  let resizeObserver;
  let restartConfirmPreviousPaused = false;
  let exitConfirmPreviousPaused = false;

  function openRestartConfirm() {
    if (!state.running) return;
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

  function bindEvents() {
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
      showMenuNote("Demo pronta no navegador.");
    });
    dom.backToMenuButton.addEventListener("click", openExitConfirm);
    dom.pauseButton.addEventListener("click", togglePause);
    dom.speedButton.addEventListener("click", toggleSpeed);
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

    dom.bgmToggleButton.addEventListener("click", () => {
      setBgmEnabled(!getSoundSettings().bgmEnabled);
    });
    dom.sfxToggleButton.addEventListener("click", () => {
      setSfxEnabled(!getSoundSettings().sfxEnabled);
    });
    document.querySelectorAll("[data-controller-layout]").forEach((button) => {
      button.addEventListener("click", () => setControllerLayout(button.dataset.controllerLayout));
    });
    dom.bgmVolumeInput.addEventListener("input", () => {
      setBgmMasterVolume(Number(dom.bgmVolumeInput.value) / 100);
    });
    dom.sfxVolumeInput.addEventListener("input", () => {
      setSfxMasterVolume(Number(dom.sfxVolumeInput.value) / 100);
    });

    dom.towerShop.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tower]");
      if (!button || button.disabled) return;
      state.selectedTower = button.dataset.tower;
      updateHud();
      refreshPlacementPreview();
    });

    dom.board.addEventListener("pointermove", previewPlacementFromEvent);
    dom.board.addEventListener("pointerleave", hidePlacementPreview);
    dom.board.addEventListener("focusin", previewPlacementFromEvent);
    dom.board.addEventListener("focusout", (event) => {
      if (!dom.board.contains(event.relatedTarget)) {
        hidePlacementPreview();
      }
    });

    dom.board.addEventListener("click", (event) => {
      const tile = event.target.closest(".tile");
      if (!tile) return;
      placeTower(Number(tile.dataset.x), Number(tile.dataset.y));
    });

    window.addEventListener("gamepadconnected", (event) => handleGamepadConnected(event.gamepad));
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
    window.addEventListener("pointerdown", () => {
      markPointerInputActive();
      clearGamepadButtonFocus();
    });
    window.addEventListener("keydown", (event) => {
      markPointerInputActive();
      if (event.key === "Escape" && isRestartConfirmOpen()) {
        event.preventDefault();
        closeRestartConfirm();
      } else if (event.key === "Escape" && isExitConfirmOpen()) {
        event.preventDefault();
        closeExitConfirm();
      } else if (event.key === "Escape" && isDifficultyPanelOpen()) {
        event.preventDefault();
        closeDifficultyPanel();
        focusGamepadButton(dom.playButton);
      }
    });
    window.addEventListener("resize", measureBoard);

    resizeObserver = new ResizeObserver(measureBoard);
    resizeObserver.observe(dom.board);
  }

  function previewPlacementFromEvent(event) {
    const tile = event.target.closest(".tile");
    if (!tile) {
      hidePlacementPreview();
      return;
    }

    if (event.type === "pointermove") {
      markPointerInputActive();
      clearGamepadButtonFocus();
    }

    updatePlacementPreview(Number(tile.dataset.x), Number(tile.dataset.y));
  }

  Object.assign(ntp, {
    bindEvents,
    getResizeObserver: () => resizeObserver
  });
})();
