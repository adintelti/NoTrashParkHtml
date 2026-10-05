(() => {
  const ntp = window.NTP = window.NTP || {};
  const STAT_FIELDS = [
    "damageTaken", "enemiesSpawned", "defeated", "escaped", "completedWaves",
    "perfectWaves", "bossesSpawned", "bossesDefeated", "firstLeakWave"
  ];

  function createPhaseStats() {
    return Object.fromEntries([...STAT_FIELDS.map((key) => [key, 0]), ["eligible", true]]);
  }

  function restorePhaseStats(saved) {
    const stats = createPhaseStats();
    stats.eligible = saved?.eligible === true;
    STAT_FIELDS.forEach((key) => {
      stats[key] = Number.isFinite(saved?.[key]) ? Math.max(0, Math.floor(saved[key])) : 0;
    });
    return stats;
  }

  function evaluatePhase(stats, maxLives, won) {
    if (!stats.eligible) return { stars: null, label: "unavailable", tip: "unavailable" };
    const allBossesDefeated = stats.bossesDefeated === stats.bossesSpawned;
    const stars = !won ? 0
      : stats.damageTaken === 0 && allBossesDefeated ? 3
        : stats.damageTaken <= Math.floor(maxLives * 0.3) && allBossesDefeated ? 2 : 1;
    const label = ["defeat", "protected", "solid", "perfect"][stars];
    const tip = !allBossesDefeated ? "boss"
      : stats.firstLeakWave > 0 ? "leak" : won ? "perfect" : "defeat";
    return { stars, label, tip };
  }

  function getPhaseRecordKey(state) {
    return `ntp.phaseResults.v1.${JSON.stringify([
      state.theme, state.phaseDifficulty, state.waveLimit,
      state.phaseCardFrequency, state.bossEncountersAtBiomeStart
    ])}`;
  }

  function isBetterPhaseRecord(candidate, best) {
    if (!best || !Number.isFinite(best.stars)) return true;
    return candidate.stars > best.stars
      || (candidate.stars === best.stars && candidate.damageTaken < best.damageTaken)
      || (candidate.stars === best.stars && candidate.damageTaken === best.damageTaken
        && candidate.perfectWaves > best.perfectWaves);
  }

  function finishPhaseEvaluation(won) {
    const { state } = ntp;
    if (state.gameMode === "tutorial" || state.phaseResult) return;
    const result = {
      ...evaluatePhase(state.phaseStats, state.maxLives, won),
      stats: { ...state.phaseStats },
      won,
      newRecord: false,
      bestStars: null
    };
    state.phaseResult = result;
    if (!state.phaseStats.eligible) return;

    const key = getPhaseRecordKey(state);
    const candidate = {
      stars: result.stars,
      damageTaken: result.stats.damageTaken,
      perfectWaves: result.stats.perfectWaves,
      savedAt: Date.now()
    };
    const read = ntp.readPersistentJson
      ? ntp.readPersistentJson(key)
      : Promise.resolve(ntp.readPersistentJsonSync?.(key));
    Promise.resolve(read).catch(() => null).then((best) => {
      result.newRecord = won && isBetterPhaseRecord(candidate, best);
      result.bestStars = result.newRecord ? candidate.stars : best?.stars ?? null;
      if (result.newRecord) ntp.writePersistentJson?.(key, candidate);
      if (ntp.state.phaseResult === result) ntp.renderPhaseEvaluation?.();
    });
  }

  function renderPhaseEvaluation() {
    const { dom, state, t } = ntp;
    const result = state.phaseResult;
    dom.phaseEvaluation.hidden = state.gameMode === "tutorial" || !result;
    if (dom.phaseEvaluation.hidden) return;

    const { stats, stars } = result;
    dom.ratingStars.textContent = stars === null ? "—" : "★".repeat(stars) + "☆".repeat(3 - stars);
    dom.ratingStars.setAttribute("aria-label", stars === null
      ? t("evaluation.unavailable") : t("evaluation.starsAria", { stars }));
    dom.ratingLabel.textContent = t(`evaluation.${result.label}`);
    dom.ratingCriteria.textContent = t("evaluation.criteria", { limit: Math.floor(state.maxLives * 0.3) });
    dom.ratingDamageText.textContent = stats.eligible ? String(stats.damageTaken) : "—";
    dom.ratingEscapedText.textContent = stats.eligible ? String(stats.escaped) : "—";
    dom.ratingPerfectText.textContent = stats.eligible ? `${stats.perfectWaves}/${stats.completedWaves}` : "—";
    dom.ratingBossText.textContent = stats.eligible ? `${stats.bossesDefeated}/${stats.bossesSpawned}` : "—";
    dom.ratingTip.textContent = t(`evaluation.tips.${result.tip}`, { wave: stats.firstLeakWave });
    dom.ratingRecord.hidden = result.bestStars === null;
    dom.ratingRecord.textContent = result.newRecord ? t("evaluation.newRecord")
      : t("evaluation.best", { stars: result.bestStars });
  }

  Object.assign(ntp, {
    createPhaseStats, restorePhaseStats, evaluatePhase, getPhaseRecordKey,
    isBetterPhaseRecord, finishPhaseEvaluation, renderPhaseEvaluation
  });
})();
