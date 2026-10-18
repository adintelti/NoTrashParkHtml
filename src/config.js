(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    DEFAULT_CARD_FREQUENCY,
    durationOptions,
    dom,
    MAX_CARD_FREQUENCY,
    MAX_CUSTOM_WAVES,
    MIN_CARD_FREQUENCY,
    MIN_CUSTOM_WAVES,
    formatCardFrequencyLabel,
    saveCardFrequency,
    settings
  } = ntp;

  let difficultySelectedForStart = false;

  function getConfiguredWaveLimit() {
    if (settings.duration === "custom") {
      return clampCustomWaves(getRawCustomWaves());
    }
    return durationOptions[settings.duration] || durationOptions.standard;
  }

  function openDifficultyPanel() {
    difficultySelectedForStart = true;
    dom.configPanel.hidden = true;
    dom.difficultyPanel.hidden = false;
    syncDifficultyButtons();
    syncStartGameButton();
  }

  function closeDifficultyPanel() {
    dom.difficultyPanel.hidden = true;
    syncDifficultyButtons();
  }

  function isDifficultyPanelOpen() {
    return !dom.difficultyPanel.hidden;
  }

  function syncStartGameButton() {
    dom.startGameButton.disabled = !difficultySelectedForStart;
  }

  function getRawCustomWaves() {
    const parsedValue = Number.parseInt(dom.customWavesInput.value, 10);
    if (Number.isNaN(parsedValue)) {
      return settings.customWaves;
    }
    return parsedValue;
  }

  function clampCustomWaves(waveCount) {
    return Math.min(MAX_CUSTOM_WAVES, Math.max(MIN_CUSTOM_WAVES, waveCount));
  }

  function sanitizeCustomWavesInput() {
    const digitsOnly = dom.customWavesInput.value.replace(/\D/g, "");
    if (digitsOnly === "") {
      dom.customWavesInput.value = "";
      return;
    }

    const cappedValue = Math.min(MAX_CUSTOM_WAVES, Number.parseInt(digitsOnly, 10));
    dom.customWavesInput.value = String(cappedValue);
    settings.customWaves = clampCustomWaves(cappedValue);
  }

  function normalizeCustomWaves() {
    const waveCount = clampCustomWaves(getRawCustomWaves());
    settings.customWaves = waveCount;
    dom.customWavesInput.value = String(waveCount);
    return waveCount;
  }

  function setDifficulty(difficulty) {
    if (!ntp.combatDifficulties[difficulty]) return;
    settings.difficulty = difficulty;
    difficultySelectedForStart = true;
    syncDifficultyButtons();
    syncStartGameButton();
  }

  function setDuration(duration) {
    if (!durationOptions[duration] && duration !== "custom") return;
    settings.duration = duration;
    syncDifficultyButtons();
  }

  function syncDifficultyButtons() {
    document.querySelectorAll("[data-duration]").forEach((button) => {
      const selected = button.dataset.duration === settings.duration;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    dom.customWavesInput.hidden = settings.duration !== "custom";
    if (dom.combatDescription) dom.combatDescription.textContent = ntp.t(`difficulty.${settings.difficulty}Description`);
    if (dom.matchSetupSummary) dom.matchSetupSummary.textContent = ntp.t("difficulty.summary", {
      difficulty: ntp.t(`difficulty.${settings.difficulty}`),
      waves: getConfiguredWaveLimit(), bosses: Math.floor(getConfiguredWaveLimit() / 5)
    });
    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      const isSelected = difficultySelectedForStart && button.dataset.difficulty === settings.difficulty;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function isCustomWavesInput(el) {
    return el === dom.customWavesInput;
  }

  function adjustCustomWavesFromGamepad(direction) {
    const increase = direction.x > 0 || direction.y < 0;
    const decrease = direction.x < 0 || direction.y > 0;
    if (!increase && !decrease) return;

    const currentValue = clampCustomWaves(getRawCustomWaves());
    const nextValue = clampCustomWaves(currentValue + (increase ? 1 : -1));
    settings.customWaves = nextValue;
    dom.customWavesInput.value = String(nextValue);
    setDuration("custom");
    syncDifficultyButtons();
  }

  function clampCardFrequency(value) {
    return Math.min(MAX_CARD_FREQUENCY, Math.max(MIN_CARD_FREQUENCY, value));
  }

  function getRawCardFrequency() {
    const parsedValue = Number.parseInt(dom.cardFrequencyInput.value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : settings.cardFrequency;
  }

  function getCardFrequencyLabel(cardFrequency = settings.cardFrequency) {
    return formatCardFrequencyLabel(cardFrequency);
  }

  function syncCardFrequencyControl() {
    const cardFrequency = clampCardFrequency(settings.cardFrequency ?? DEFAULT_CARD_FREQUENCY);
    settings.cardFrequency = cardFrequency;
    dom.cardFrequencyInput.value = String(cardFrequency);
    dom.cardFrequencyText.textContent = getCardFrequencyLabel(cardFrequency);
  }

  function setCardFrequency(cardFrequency) {
    settings.cardFrequency = clampCardFrequency(cardFrequency);
    saveCardFrequency(settings.cardFrequency);
    syncCardFrequencyControl();
  }

  function isCardFrequencyInput(el) {
    return el === dom.cardFrequencyInput;
  }

  function adjustCardFrequencyFromGamepad(direction) {
    const directionStep = direction.x || -direction.y;
    if (!directionStep) return;
    setCardFrequency(getRawCardFrequency() + directionStep);
  }

  Object.assign(ntp, {
    getConfiguredWaveLimit,
    getRawCustomWaves,
    normalizeCustomWaves,
    sanitizeCustomWavesInput,
    openDifficultyPanel,
    closeDifficultyPanel,
    isDifficultyPanelOpen,
    setDifficulty,
    setDuration,
    syncDifficultyButtons,
    isCustomWavesInput,
    adjustCustomWavesFromGamepad,
    getCardFrequencyLabel,
    syncCardFrequencyControl,
    setCardFrequency,
    isCardFrequencyInput,
    adjustCardFrequencyFromGamepad
  });
})();
