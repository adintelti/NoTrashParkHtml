(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    dom,
    GAME_VERSION,
    getNextTheme,
    getUnlockedTowerKeys,
    isTowerUnlocked,
    maps,
    saveControllerLayout,
    settings,
    state,
    towers,
    victoryTitles
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
    dom.versionText.textContent = `Versao ${GAME_VERSION}`;
  }

  function updateHud() {
    dom.coinText.textContent = String(state.coins);
    dom.livesText.textContent = String(state.lives);
    dom.waveText.textContent = getWaveProgressText();
    dom.defeatedText.textContent = String(state.sessionDefeated);
    dom.sessionTimeText.textContent = formatSessionTime(state.sessionTime);
    dom.comboCounter.textContent = `${state.waveDefeated}X`;
    dom.comboCounter.hidden = !state.waveComboVisible;
    dom.comboCounter.classList.toggle("is-active", state.waveDefeated > 0);
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
      const towerDef = towers[towerKey];
      const isUnlocked = isTowerUnlocked(towerKey, state.theme);
      const isActive = isUnlocked && towerKey === state.selectedTower;
      const priceEl = button.querySelector("strong");
      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-locked", !isUnlocked);
      button.disabled = !isUnlocked || state.coins < towerDef.cost;
      button.title = isUnlocked ? "" : "Bloqueada neste bioma";
      button.setAttribute("aria-label", `${towerDef.label} ${isUnlocked ? `$${towerDef.cost}` : "bloqueada"}`);
      if (priceEl) {
        priceEl.textContent = isUnlocked ? `$${towerDef.cost}` : "Bloq.";
      }
    });

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
    dom.victoryTitle.textContent = victoryTitles[state.theme] || "Vitoria!";
    updateResultDetails();
    dom.victoryContinueButton.hidden = !hasNextTheme;
    dom.victoryOverlay.classList.toggle("is-final-victory", !hasNextTheme);
    dom.victoryOverlay.classList.remove("is-game-over");
    dom.victoryOverlay.hidden = false;
    dom.floatingMessage.classList.remove("is-visible");
    messageTimer = 0;
  }

  function showGameOver() {
    const levelName = maps[state.theme]?.name || "Fase";
    hideRestartConfirm();
    hideExitConfirm();
    dom.victoryTitle.textContent = `Fim de jogo, ${levelName} destruído(a)`;
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
    dom.restartConfirmOverlay.hidden = false;
    dom.restartConfirmNoButton.focus({ preventScroll: true });
  }

  function hideRestartConfirm() {
    dom.restartConfirmOverlay.hidden = true;
  }

  function showExitConfirm() {
    hideRestartConfirm();
    dom.exitConfirmOverlay.hidden = false;
    dom.exitConfirmNoButton.focus({ preventScroll: true });
  }

  function hideExitConfirm() {
    dom.exitConfirmOverlay.hidden = true;
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

  Object.assign(ntp, {
    updateVersionText,
    updateHud,
    ensureSelectedTowerUnlocked,
    setControllerLayout,
    syncControllerLayout,
    showMessage,
    showWaveTransition,
    hideWaveTransition,
    tickMessageTimer,
    showVictory,
    showGameOver,
    hideVictory,
    formatSessionTime,
    showRestartConfirm,
    hideRestartConfirm,
    showExitConfirm,
    hideExitConfirm,
    showMenuNote,
    syncThemeButtons,
    isMenuVisible,
    isVictoryOpen,
    isRestartConfirmOpen,
    isExitConfirmOpen
  });
})();
