(() => {
  const ntp = window.NTP = window.NTP || {};

  const CONTROLLER_LAYOUT_STORAGE_KEY = "ntp.controllerLayout";
  const CARD_FREQUENCY_STORAGE_KEY = "ntp.cardFrequency";
  const LANGUAGE_STORAGE_KEY = "ntp.language";
  const controllerLayouts = ["xbox", "switch"];
  const supportedLanguages = ntp.SUPPORTED_LANGUAGES || ["pt-BR", "en", "es"];

  function loadControllerLayout() {
    try {
      const savedLayout = window.localStorage.getItem(CONTROLLER_LAYOUT_STORAGE_KEY);
      return controllerLayouts.includes(savedLayout) ? savedLayout : "xbox";
    } catch (error) {
      return "xbox";
    }
  }

  function clampCardFrequency(value) {
    return Math.min(ntp.MAX_CARD_FREQUENCY, Math.max(ntp.MIN_CARD_FREQUENCY, value));
  }

  function loadCardFrequency() {
    try {
      const savedFrequency = Number.parseInt(window.localStorage.getItem(CARD_FREQUENCY_STORAGE_KEY), 10);
      return Number.isFinite(savedFrequency) ? clampCardFrequency(savedFrequency) : ntp.DEFAULT_CARD_FREQUENCY;
    } catch (error) {
      return ntp.DEFAULT_CARD_FREQUENCY;
    }
  }

  function loadLanguage() {
    try {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return supportedLanguages.includes(savedLanguage) ? savedLanguage : ntp.DEFAULT_LANGUAGE;
    } catch (error) {
      return ntp.DEFAULT_LANGUAGE;
    }
  }

  const settings = {
    difficulty: "medium",
    customWaves: ntp.MIN_CUSTOM_WAVES,
    cardFrequency: loadCardFrequency(),
    language: loadLanguage(),
    controllerLayout: loadControllerLayout()
  };

  function saveControllerLayout(controllerLayout) {
    try {
      window.localStorage.setItem(CONTROLLER_LAYOUT_STORAGE_KEY, controllerLayout);
    } catch (error) {
      // Keep the in-memory setting when local storage is unavailable.
    }
  }

  function saveCardFrequency(cardFrequency) {
    try {
      window.localStorage.setItem(CARD_FREQUENCY_STORAGE_KEY, String(cardFrequency));
    } catch (error) {
      // Keep the in-memory setting when local storage is unavailable.
    }
  }

  function saveLanguage(language) {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      // Keep the in-memory setting when local storage is unavailable.
    }
  }

  function createFreshState(theme = "park", waveLimit = ntp.difficultyOptions.medium) {
    return {
      theme,
      waveLimit,
      selectedTower: "sentinel",
      coins: 300,
      maxLives: 10,
      lives: 10,
      sessionDefeated: 0,
      waveDefeated: 0,
      waveHpLost: 0,
      waveComboVisible: false,
      waveInProgress: false,
      wave: 0,
      enemies: [],
      placedTowers: [],
      projectiles: [],
      impacts: [],
      occupied: new Set(),
      lastPlacedTower: null,
      undoExpiresAt: 0,
      deleteMode: false,
      pendingDeleteTower: null,
      deleteConfirmPreviousPaused: false,
      spawnRemaining: 0,
      spawnTimer: 0,
      waveCooldown: 1.2,
      waveTransitionActive: false,
      waveTransitionSteps: [],
      waveTransitionIndex: 0,
      waveTransitionTimer: 0,
      speed: 1,
      paused: false,
      running: false,
      gameOver: false,
      victoryShown: false,
      victoryPending: false,
      cardChoice: {
        active: false,
        revealed: false,
        cards: [],
        selectedCardId: "",
        resultText: "",
        previousPaused: false
      },
      cardEffects: {
        towerBuffs: [],
        enemyModifiers: []
      },
      sessionTime: 0,
      simTime: 0,
      nextEnemyId: 1,
      nextTowerId: 1,
      nextProjectileId: 1
    };
  }

  const state = createFreshState("park");

  function resetState(theme = "park", waveLimit = ntp.difficultyOptions.medium) {
    const freshState = createFreshState(theme, waveLimit);
    Object.keys(state).forEach((key) => {
      delete state[key];
    });
    Object.assign(state, freshState);
    return state;
  }

  Object.assign(ntp, {
    settings,
    controllerLayouts,
    supportedLanguages,
    saveControllerLayout,
    saveCardFrequency,
    saveLanguage,
    state,
    createFreshState,
    resetState
  });
})();
