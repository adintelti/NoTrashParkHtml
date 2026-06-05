(() => {
  const {
    buildBoard,
    bindEvents,
    clearGamepadButtonFocus,
    clearGamepadCursor,
    configureGameplayHooks,
    dom,
    focusGamepadButton,
    initializeBackgroundMusic,
    isGamepadConnected,
    playMenuMusic,
    playThemeMusic,
    resetGamepadCursor,
    startLoop,
    state,
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
  syncControllerLayout();
  syncDifficultyButtons();
  updateVersionText();
  updateHud();
  initializeBackgroundMusic();
  startLoop();
})();
