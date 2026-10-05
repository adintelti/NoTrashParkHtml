(() => {
  const ntp = window.NTP = window.NTP || {};
  const STAGES = ["build", "slow", "tools", "controls", "boss"];
  let lastHighlight = "";
  let lastUi = "";

  function initializeTutorial() {
    const { state, dom } = ntp;
    clearTutorialHighlights();
    state.tutorial = state.gameMode === "tutorial" ? {
      waiting: true, removedTower: false, usedPause: false, usedSpeed: false, navigation: false
    } : null;
    dom.game.classList.toggle("is-tutorial", state.gameMode === "tutorial");
    lastHighlight = "";
    lastUi = "";
    syncTutorialUi();
  }

  function startTutorial() {
    ntp.startGame("park", { gameMode: "tutorial" });
  }

  function isTutorialReady() {
    const { state } = ntp;
    if (!state.tutorial?.waiting) return false;
    if (!state.placedTowers.length) return false;
    if (state.wave === 0) return state.placedTowers.some((tower) => tower.type === "sentinel");
    if (state.wave === 1) return state.placedTowers.some((tower) => tower.type === "slow");
    if (state.wave === 2) return state.tutorial.removedTower;
    if (state.wave === 3) return state.tutorial.usedPause && state.tutorial.usedSpeed;
    return true;
  }

  function continueTutorial() {
    const { state } = ntp;
    if (!isTutorialReady() || state.paused || state.deleteMode || state.victoryPending) return;
    state.tutorial.waiting = false;
    state.tutorial.navigation = false;
    ntp.clearGamepadButtonFocus?.();
    ntp.startNextWave();
    ntp.updateHud();
  }

  function prepareTutorialWave() {
    const { state } = ntp;
    if (!state.tutorial || state.wave >= 5) return false;
    state.tutorial.waiting = true;
    // Extra practice funds keep removal and rebuilding from blocking a lesson.
    state.coins = Math.max(state.coins, 300);
    ntp.updateHud();
    return true;
  }

  function recordTutorialAction(action) {
    const tutorial = ntp.state.tutorial;
    if (!tutorial) return;
    if (action === "remove") tutorial.removedTower = true;
    if (action === "pause") tutorial.usedPause = true;
    if (action === "speed") tutorial.usedSpeed = true;
  }

  function completeTutorial() {
    if (!ntp.state.tutorial) return;
    ntp.state.tutorial.waiting = false;
    ntp.state.tutorial.navigation = false;
    ntp.writePersistentJson?.("ntp.tutorialProgress", { completed: true, savedAt: Date.now() });
    syncTutorialUi();
  }

  function syncTutorialUi() {
    const { dom, state, t } = ntp;
    const tutorial = state.tutorial;
    const hidden = !tutorial || !state.running || state.victoryPending;
    if (dom.tutorialPanel.hidden !== hidden) dom.tutorialPanel.hidden = hidden;
    if (!tutorial || dom.tutorialPanel.hidden) {
      if (lastHighlight) clearTutorialHighlights();
      lastUi = "";
      return;
    }
    const ready = isTutorialReady();
    const signature = [state.wave, tutorial.waiting, ready, state.paused,
      state.deleteMode, state.placedTowers.length, ntp.settings.language].join("|");
    if (lastUi === signature) return;
    lastUi = signature;
    const stage = STAGES[Math.max(0, Math.min(tutorial.waiting ? state.wave : state.wave - 1, 4))];
    dom.tutorialTitle.textContent = t("tutorial.title", { wave: Math.min(5, state.wave + (tutorial.waiting ? 1 : 0)) });
    dom.tutorialInstructions.textContent = t(`tutorial.steps.${stage}`);
    dom.tutorialObjective.textContent = !state.placedTowers.length && state.wave > 0
      ? t("tutorial.needTower") : t(tutorial.waiting ? `tutorial.objectives.${stage}`
        : state.wave === 5 ? "tutorial.defendFinal" : "tutorial.defend");
    dom.tutorialContinueButton.hidden = !tutorial.waiting;
    dom.tutorialContinueButton.disabled = !ready || state.deleteMode || state.paused;
    dom.tutorialContinueButton.textContent = t("tutorial.startWave", { wave: state.wave + 1 });
    dom.tutorialContinueButton.setAttribute("aria-describedby", "tutorialObjective");

    const highlight = tutorial.waiting ? `${stage}|${state.placedTowers.length}` : "";
    if (lastHighlight === highlight) return;
    clearTutorialHighlights();
    lastHighlight = highlight;
    if (!tutorial.waiting) return;
    const towerKey = stage === "slow" ? "slow" : "sentinel";
    if (stage === "build" || stage === "slow" || !state.placedTowers.length) {
      dom.towerShop.querySelector(`[data-tower="${towerKey}"]`)?.classList.add("tutorial-highlight");
      ["4,1", "5,2", "7,3", "7,5", "9,5"].forEach((key) => {
        if (!state.occupied.has(key)) state.tileByCoord.get(key)?.classList.add("tutorial-tile");
      });
    }
    if (stage === "tools") dom.deleteTowerButton.classList.add("tutorial-highlight");
    if (stage === "controls") {
      dom.pauseButton.classList.add("tutorial-highlight");
      dom.speedButton.classList.add("tutorial-highlight");
    }
  }

  function clearTutorialHighlights() {
    ntp.dom.game.querySelectorAll(".tutorial-highlight, .tutorial-tile").forEach((el) => {
      el.classList.remove("tutorial-highlight", "tutorial-tile");
    });
    lastHighlight = "";
  }

  Object.assign(ntp, {
    initializeTutorial, startTutorial, isTutorialReady, continueTutorial,
    prepareTutorialWave, recordTutorialAction, completeTutorial, syncTutorialUi
  });
})();
