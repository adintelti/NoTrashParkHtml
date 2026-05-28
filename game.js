(() => {
  const {
    buildBoard,
    bindEvents,
    clearGamepadButtonFocus,
    clearGamepadCursor,
    configureGameplayHooks,
    dom,
    focusGamepadButton,
    isGamepadConnected,
    resetGamepadCursor,
    startLoop,
    syncDifficultyButtons,
    syncGamepadCursor,
    updateHud,
    updateVersionText
  } = window.NTP;

  configureGameplayHooks({
    afterStartGame() {
      resetGamepadCursor();
      clearGamepadButtonFocus();
    },
    afterReturnToMenu() {
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
  syncDifficultyButtons();
  updateVersionText();
  updateHud();
  startLoop();
})();
