(() => {
  const ntp = window.NTP = window.NTP || {};

  const settings = {
    difficulty: "medium",
    customWaves: ntp.MIN_CUSTOM_WAVES
  };

  function createFreshState(theme = "park", waveLimit = ntp.difficultyOptions.medium) {
    return {
      theme,
      waveLimit,
      selectedTower: "sentinel",
      coins: 300,
      lives: 10,
      wave: 0,
      enemies: [],
      placedTowers: [],
      projectiles: [],
      impacts: [],
      occupied: new Set(),
      spawnRemaining: 0,
      spawnTimer: 0,
      waveCooldown: 1.2,
      speed: 1,
      paused: false,
      running: false,
      gameOver: false,
      victoryShown: false,
      victoryPending: false,
      sessionTime: 0,
      simTime: 0,
      nextEnemyId: 1,
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
    state,
    createFreshState,
    resetState
  });
})();
