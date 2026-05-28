(() => {
  const ntp = window.NTP = window.NTP || {};
  const { difficultyOptions, dom, MIN_CUSTOM_WAVES, settings } = ntp;

  function getConfiguredWaveLimit() {
    if (settings.difficulty === "custom") {
      return normalizeCustomWaves();
    }
    return difficultyOptions[settings.difficulty] || difficultyOptions.medium;
  }

  function getRawCustomWaves() {
    const parsedValue = Number.parseInt(dom.customWavesInput.value, 10);
    if (Number.isNaN(parsedValue)) {
      return settings.customWaves;
    }
    return parsedValue;
  }

  function normalizeCustomWaves() {
    const waveCount = Math.max(MIN_CUSTOM_WAVES, getRawCustomWaves());
    settings.customWaves = waveCount;
    dom.customWavesInput.value = String(waveCount);
    return waveCount;
  }

  function setDifficulty(difficulty) {
    settings.difficulty = difficulty;
    if (difficulty === "custom" && dom.customWavesInput.value.trim() === "") {
      dom.customWavesInput.value = String(settings.customWaves);
    }
    syncDifficultyButtons();
  }

  function syncDifficultyButtons() {
    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.difficulty === settings.difficulty);
    });
  }

  function isCustomWavesInput(el) {
    return el === dom.customWavesInput;
  }

  function adjustCustomWavesFromGamepad(direction) {
    const increase = direction.x > 0 || direction.y < 0;
    const decrease = direction.x < 0 || direction.y > 0;
    if (!increase && !decrease) return;

    const currentValue = Math.max(MIN_CUSTOM_WAVES, getRawCustomWaves());
    const nextValue = Math.max(MIN_CUSTOM_WAVES, currentValue + (increase ? 1 : -1));
    settings.customWaves = nextValue;
    dom.customWavesInput.value = String(nextValue);
    setDifficulty("custom");
  }

  Object.assign(ntp, {
    getConfiguredWaveLimit,
    getRawCustomWaves,
    normalizeCustomWaves,
    setDifficulty,
    syncDifficultyButtons,
    isCustomWavesInput,
    adjustCustomWavesFromGamepad
  });
})();
