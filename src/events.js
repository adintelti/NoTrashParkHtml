(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    beginWaveSpawn,
    clearGamepadButtonFocus,
    dom,
    focusGamepadButton,
    getNextTheme,
    handleGamepadConnected,
    handleGamepadDisconnected,
    hideVictory,
    markPointerInputActive,
    measureBoard,
    normalizeCustomWaves,
    placeTower,
    returnToMenu,
    setDifficulty,
    setTheme,
    settings,
    showMenuNote,
    startGame,
    state,
    syncDifficultyButtons,
    syncThemeButtons,
    togglePause,
    toggleSpeed,
    updateHud
  } = ntp;

  let resizeObserver;

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
    dom.pauseButton.addEventListener("click", togglePause);
    dom.speedButton.addEventListener("click", toggleSpeed);
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
      const digitsOnly = dom.customWavesInput.value.replace(/\D/g, "");
      if (dom.customWavesInput.value !== digitsOnly) {
        dom.customWavesInput.value = digitsOnly;
      }
      settings.difficulty = "custom";
      syncDifficultyButtons();
    });
    dom.customWavesInput.addEventListener("change", normalizeCustomWaves);
    dom.customWavesInput.addEventListener("blur", normalizeCustomWaves);

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

    window.addEventListener("gamepadconnected", (event) => handleGamepadConnected(event.gamepad));
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
    window.addEventListener("pointerdown", () => {
      markPointerInputActive();
      clearGamepadButtonFocus();
    });
    window.addEventListener("keydown", markPointerInputActive);
    window.addEventListener("resize", measureBoard);

    resizeObserver = new ResizeObserver(measureBoard);
    resizeObserver.observe(dom.board);
  }

  Object.assign(ntp, {
    bindEvents,
    getResizeObserver: () => resizeObserver
  });
})();
