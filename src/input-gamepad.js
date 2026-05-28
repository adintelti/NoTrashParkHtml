(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    adjustCustomWavesFromGamepad,
    clamp,
    COLS,
    cycleSelectedTower,
    dom,
    focusGamepadButton,
    GAMEPAD_DEADZONE,
    GAMEPAD_MOVE_REPEAT,
    GAMEPAD_NAV_REPEAT,
    gamepadButtons,
    getTileAt,
    isBuildableTile,
    isCustomWavesInput,
    isMenuVisible,
    isVictoryOpen,
    normalizeCustomWaves,
    placeTower,
    returnToMenu,
    ROWS,
    setDifficulty,
    showMenuNote,
    showMessage,
    state,
    togglePause,
    toggleSpeed
  } = ntp;

  const gamepadInput = {
    index: null,
    connected: false,
    cursorX: 0,
    cursorY: 0,
    moveCooldown: 0,
    navCooldown: 0,
    lastButtons: [],
    lastDirection: { x: 0, y: 0 },
    lastNavDirection: { x: 0, y: 0 },
    usingGamepad: false
  };

  function isGamepadConnected() {
    return gamepadInput.connected;
  }

  function clearGamepadCursor() {
    const currentTile = dom.board.querySelector(".gamepad-target");
    currentTile?.classList.remove("gamepad-target", "gamepad-unavailable");
  }

  function syncGamepadCursor() {
    clearGamepadCursor();
    if (!gamepadInput.connected || !state.running || dom.game.classList.contains("is-hidden")) return;

    const tile = getTileAt(gamepadInput.cursorX, gamepadInput.cursorY);
    if (tile) {
      tile.classList.add("gamepad-target");
      tile.classList.toggle("gamepad-unavailable", !isBuildableTile(gamepadInput.cursorX, gamepadInput.cursorY));
    }
  }

  function resetGamepadCursor() {
    const centerX = Math.floor(COLS / 2);
    const centerY = Math.floor(ROWS / 2);
    const tile = getNearestBuildableTile(centerX, centerY) || { x: centerX, y: centerY };
    gamepadInput.cursorX = tile.x;
    gamepadInput.cursorY = tile.y;
    syncGamepadCursor();
  }

  function moveGamepadCursor(dx, dy) {
    if (!state.running || isVictoryOpen()) return;

    const nextX = clamp(gamepadInput.cursorX + dx, 0, COLS - 1);
    const nextY = clamp(gamepadInput.cursorY + dy, 0, ROWS - 1);
    if (nextX === gamepadInput.cursorX && nextY === gamepadInput.cursorY) return;

    gamepadInput.cursorX = nextX;
    gamepadInput.cursorY = nextY;
    syncGamepadCursor();
  }

  function clearGamepadButtonFocus() {
    document.querySelector(".gamepad-focused")?.classList.remove("gamepad-focused");
  }

  function localFocusGamepadButton(button) {
    if (!button) return;
    clearGamepadButtonFocus();
    button.classList.add("gamepad-focused");
    button.focus({ preventScroll: true });
  }

  function updateGamepadInput(dt) {
    const gamepad = getActiveGamepad();
    if (!gamepad) {
      if (gamepadInput.connected) {
        handleGamepadDisconnected();
      }
      return;
    }

    if (!gamepadInput.connected || gamepadInput.index !== gamepad.index) {
      handleGamepadConnected(gamepad);
    }

    const buttons = readGamepadButtons(gamepad);
    const justPressed = (buttonIndex) => wasGamepadButtonPressed(buttons, buttonIndex);
    const direction = readGamepadDirection(gamepad, buttons);

    if (hasGamepadActivity(buttons, direction)) {
      markGamepadInputActive();
    }

    if (isVictoryOpen() || isMenuVisible()) {
      updateMenuGamepadInput(dt, direction, justPressed);
    } else if (state.running) {
      updateGameplayGamepadInput(dt, direction, justPressed);
    }

    gamepadInput.lastButtons = buttons;
  }

  function handleGamepadConnected(gamepad) {
    gamepadInput.index = gamepad.index;
    gamepadInput.connected = true;
    gamepadInput.usingGamepad = true;
    gamepadInput.lastButtons = readGamepadButtons(gamepad);
    syncGamepadVisualState();
    syncGamepadCursor();
    showGamepadNotice("Controle conectado.");
  }

  function handleGamepadDisconnected() {
    gamepadInput.index = null;
    gamepadInput.connected = false;
    gamepadInput.usingGamepad = false;
    gamepadInput.lastButtons = [];
    syncGamepadVisualState();
    clearGamepadCursor();
    clearGamepadButtonFocus();
    showGamepadNotice("Controle desconectado.");
  }

  function markGamepadInputActive() {
    if (gamepadInput.usingGamepad) return;
    gamepadInput.usingGamepad = true;
    syncGamepadVisualState();
  }

  function markPointerInputActive() {
    if (!gamepadInput.usingGamepad) return;
    gamepadInput.usingGamepad = false;
    syncGamepadVisualState();
  }

  function syncGamepadVisualState() {
    dom.app.classList.toggle("gamepad-connected", gamepadInput.connected);
    dom.app.classList.toggle("using-gamepad", gamepadInput.connected && gamepadInput.usingGamepad);
  }

  function getNearestBuildableTile(originX, originY) {
    let bestTile = null;
    let bestScore = Infinity;

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!isBuildableTile(x, y)) continue;
        const score = Math.hypot(x - originX, y - originY);
        if (score < bestScore) {
          bestTile = { x, y };
          bestScore = score;
        }
      }
    }

    return bestTile;
  }

  function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0
      && rect.height > 0
      && style.visibility !== "hidden"
      && style.display !== "none";
  }

  function getGamepadFocusableButtons() {
    const root = isVictoryOpen()
      ? dom.victoryOverlay
      : isMenuVisible()
        ? dom.menu
        : null;

    if (!root) return [];

    return Array.from(root.querySelectorAll("button, input"))
      .filter((el) => !el.disabled && !el.hidden && isElementVisible(el));
  }

  function moveGamepadButtonFocus(direction) {
    const buttons = getGamepadFocusableButtons();
    if (!buttons.length) return;

    const current = buttons.includes(document.activeElement) ? document.activeElement : null;
    if (!current) {
      localFocusGamepadButton(buttons.find((button) => button.classList.contains("is-active")) || buttons[0]);
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const currentCenter = getRectCenter(currentRect);
    const axis = Math.abs(direction.x) >= Math.abs(direction.y) ? "x" : "y";
    const sign = axis === "x" ? Math.sign(direction.x) : Math.sign(direction.y);
    const scoredButtons = buttons
      .filter((button) => button !== current)
      .map((button) => {
        const center = getRectCenter(button.getBoundingClientRect());
        const primary = axis === "x" ? center.x - currentCenter.x : center.y - currentCenter.y;
        const cross = axis === "x" ? center.y - currentCenter.y : center.x - currentCenter.x;
        return {
          button,
          primary,
          score: Math.abs(primary) + Math.abs(cross) * 0.45
        };
      })
      .filter((candidate) => candidate.primary * sign > 4)
      .sort((a, b) => a.score - b.score);

    if (scoredButtons.length) {
      localFocusGamepadButton(scoredButtons[0].button);
      return;
    }

    const currentIndex = buttons.indexOf(current);
    const fallbackStep = sign >= 0 ? 1 : -1;
    const fallbackIndex = (currentIndex + fallbackStep + buttons.length) % buttons.length;
    localFocusGamepadButton(buttons[fallbackIndex]);
  }

  function getRectCenter(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  function activateFocusedGamepadButton() {
    const buttons = getGamepadFocusableButtons();
    if (!buttons.length) return;

    const activeButton = buttons.includes(document.activeElement)
      ? document.activeElement
      : buttons.find((button) => button.classList.contains("is-active")) || buttons[0];

    localFocusGamepadButton(activeButton);

    if (isCustomWavesInput(activeButton)) {
      setDifficulty("custom");
      normalizeCustomWaves();
      activeButton.select();
      return;
    }

    activeButton.click();

    if (activeButton === dom.configButton && !dom.configPanel.hidden) {
      const firstConfigButton = dom.configPanel.querySelector("button");
      localFocusGamepadButton(firstConfigButton);
    }
  }

  function getActiveGamepad() {
    if (!navigator.getGamepads) return null;

    const gamepads = Array.from(navigator.getGamepads()).filter(Boolean);
    if (gamepadInput.index !== null) {
      const selectedGamepad = gamepads.find((gamepad) => gamepad.index === gamepadInput.index);
      if (selectedGamepad) return selectedGamepad;
    }

    return gamepads.find((gamepad) => gamepad.mapping === "standard") || gamepads[0] || null;
  }

  function readGamepadButtons(gamepad) {
    return gamepad.buttons.map((button) => button.pressed || button.value > 0.62);
  }

  function wasGamepadButtonPressed(buttons, buttonIndex) {
    return Boolean(buttons[buttonIndex] && !gamepadInput.lastButtons[buttonIndex]);
  }

  function readGamepadDirection(gamepad, buttons) {
    const axisX = Math.abs(gamepad.axes[0] || 0) > GAMEPAD_DEADZONE ? Math.sign(gamepad.axes[0]) : 0;
    const axisY = Math.abs(gamepad.axes[1] || 0) > GAMEPAD_DEADZONE ? Math.sign(gamepad.axes[1]) : 0;
    const dpadX = (buttons[gamepadButtons.dpadRight] ? 1 : 0) - (buttons[gamepadButtons.dpadLeft] ? 1 : 0);
    const dpadY = (buttons[gamepadButtons.dpadDown] ? 1 : 0) - (buttons[gamepadButtons.dpadUp] ? 1 : 0);

    return {
      x: dpadX || axisX,
      y: dpadY || axisY
    };
  }

  function hasGamepadActivity(buttons, direction) {
    return buttons.some(Boolean) || direction.x !== 0 || direction.y !== 0;
  }

  function shouldRepeatDirection(direction, cooldownKey, lastDirectionKey, repeatDelay, dt) {
    const hasDirection = direction.x !== 0 || direction.y !== 0;
    if (!hasDirection) {
      gamepadInput[cooldownKey] = 0;
      gamepadInput[lastDirectionKey] = { x: 0, y: 0 };
      return false;
    }

    const lastDirection = gamepadInput[lastDirectionKey];
    const changedDirection = direction.x !== lastDirection.x || direction.y !== lastDirection.y;
    gamepadInput[cooldownKey] -= dt;

    if (changedDirection || gamepadInput[cooldownKey] <= 0) {
      gamepadInput[cooldownKey] = repeatDelay;
      gamepadInput[lastDirectionKey] = { ...direction };
      return true;
    }

    return false;
  }

  function updateMenuGamepadInput(dt, direction, justPressed) {
    if (isCustomWavesInput(document.activeElement)) {
      if (shouldRepeatDirection(direction, "navCooldown", "lastNavDirection", GAMEPAD_NAV_REPEAT, dt)) {
        adjustCustomWavesFromGamepad(direction);
      }

      if (justPressed(gamepadButtons.a) || justPressed(gamepadButtons.b) || justPressed(gamepadButtons.start)) {
        normalizeCustomWaves();
        localFocusGamepadButton(dom.configPanel.querySelector("[data-difficulty='custom']"));
      }
      return;
    }

    if (shouldRepeatDirection(direction, "navCooldown", "lastNavDirection", GAMEPAD_NAV_REPEAT, dt)) {
      moveGamepadButtonFocus(direction);
    }

    if (justPressed(gamepadButtons.a) || justPressed(gamepadButtons.start)) {
      activateFocusedGamepadButton();
    }

    if (justPressed(gamepadButtons.b)) {
      if (isVictoryOpen()) {
        dom.victoryMenuButton.click();
      } else if (!dom.configPanel.hidden) {
        dom.configPanel.hidden = true;
        localFocusGamepadButton(dom.configButton);
      }
    }
  }

  function updateGameplayGamepadInput(dt, direction, justPressed) {
    clearGamepadButtonFocus();

    if (shouldRepeatDirection(direction, "moveCooldown", "lastDirection", GAMEPAD_MOVE_REPEAT, dt)) {
      moveGamepadCursor(direction.x, direction.y);
    }

    if (justPressed(gamepadButtons.a) || justPressed(gamepadButtons.rt)) {
      placeTower(gamepadInput.cursorX, gamepadInput.cursorY);
    }

    if (justPressed(gamepadButtons.lb)) {
      cycleSelectedTower(-1);
    }

    if (justPressed(gamepadButtons.rb)) {
      cycleSelectedTower(1);
    }

    if (justPressed(gamepadButtons.x) || justPressed(gamepadButtons.start)) {
      togglePause();
    }

    if (justPressed(gamepadButtons.y)) {
      toggleSpeed();
    }

    if (justPressed(gamepadButtons.back)) {
      returnToMenu();
    }
  }

  function showGamepadNotice(text) {
    if (state.running && !dom.game.classList.contains("is-hidden")) {
      showMessage(text);
      return;
    }

    if (isMenuVisible()) {
      showMenuNote(text);
    }
  }

  Object.assign(ntp, {
    isGamepadConnected,
    clearGamepadCursor,
    syncGamepadCursor,
    resetGamepadCursor,
    moveGamepadCursor,
    clearGamepadButtonFocus,
    focusGamepadButton: localFocusGamepadButton,
    updateGamepadInput,
    handleGamepadConnected,
    handleGamepadDisconnected,
    markGamepadInputActive,
    markPointerInputActive
  });
})();
