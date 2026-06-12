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
        focusGamepadButton(dom.playButton);
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
  updateHud();
  initializeBackgroundMusic();
  startLoop();
})();
