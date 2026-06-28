(() => {
  const {
    buildBoard,
    bindEvents,
    clearGamepadButtonFocus,
    clearGamepadCursor,
    configureGameplayHooks,
    dom,
    focusGamepadButton,
    applyTranslations,
    initializeBackgroundMusic,
    isGamepadConnected,
    playMenuMusic,
    playThemeMusic,
    refreshSavedGameFromStorage,
    registerServiceWorker,
    requestPersistentStorage,
    resetGamepadCursor,
    startLoop,
    state,
    syncCardFrequencyControl,
    syncControllerLayout,
    syncDifficultyButtons,
    syncGamepadCursor,
    syncSavedGameButton,
    bindAutosaveLifecycle,
    updateHud,
    updateVersionText
  } = window.NTP;

  configureGameplayHooks({
    afterStartGame() {
      playThemeMusic(state.theme);
      resetGamepadCursor();
      clearGamepadButtonFocus();
    },
    afterReturnToMenu() {
      playMenuMusic();
      clearGamepadCursor();
      if (isGamepadConnected()) {
        focusGamepadButton(dom.continueButton.hidden ? dom.playButton : dom.continueButton);
      }
    },
    afterTowerPlaced() {
      syncGamepadCursor();
    }
  });

  bindEvents();
  buildBoard();
  applyTranslations();
  syncControllerLayout();
  syncCardFrequencyControl();
  syncDifficultyButtons();
  syncSavedGameButton();
  refreshSavedGameFromStorage?.();
  updateHud();
  initializeBackgroundMusic();
  requestPersistentStorage?.();
  bindAutosaveLifecycle?.();
  registerServiceWorker?.();
  startLoop();
})();
