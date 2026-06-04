(() => {
  const ntp = window.NTP = window.NTP || {};
  const { dom, GAME_VERSION, getNextTheme, state, towers, victoryTitles } = ntp;

  let messageTimer = 0;

  function updateVersionText() {
    dom.versionText.textContent = `Versao ${GAME_VERSION}`;
  }

  function updateHud() {
    dom.coinText.textContent = String(state.coins);
    dom.livesText.textContent = String(state.lives);
    dom.waveText.textContent = `${state.wave}/${state.waveLimit}`;
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
      button.classList.toggle("is-active", towerKey === state.selectedTower);
      button.disabled = state.coins < towers[towerKey].cost;
    });

    ntp.refreshPlacementPreview?.();
  }

  function showMessage(text) {
    dom.floatingMessage.textContent = text;
    dom.floatingMessage.classList.add("is-visible");
    messageTimer = 2.2;
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
    dom.victoryContinueButton.hidden = !hasNextTheme;
    dom.victoryOverlay.classList.toggle("is-final-victory", !hasNextTheme);
    dom.victoryOverlay.hidden = false;
    dom.floatingMessage.classList.remove("is-visible");
    messageTimer = 0;
  }

  function hideVictory() {
    dom.victoryOverlay.hidden = true;
    dom.victoryContinueButton.hidden = false;
    dom.victoryOverlay.classList.remove("is-final-victory");
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
    showMessage,
    tickMessageTimer,
    showVictory,
    hideVictory,
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
