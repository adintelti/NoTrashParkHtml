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
    resetGamepadCursor,
    startLoop,
    state,
    syncCardFrequencyControl,
    syncControllerLayout,
    syncDifficultyButtons,
    syncGamepadCursor,
    syncSavedGameButton,
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
  updateHud();
  initializeBackgroundMusic();
  startLoop();
})();
