(() => {
  const ntp = window.NTP = window.NTP || {};

  const DEBUG_CATEGORIES = ["system", "waves", "towers", "cards", "combat", "economy", "input"];
  const DEBUG_REFRESH_MS = 180;

  const debugState = {
    open: false,
    logs: [],
    filters: DEBUG_CATEGORIES.reduce((filters, category) => {
      filters[category] = true;
      return filters;
    }, {}),
    maxLogs: 200,
    nextLogId: 1,
    refreshTimer: 0,
    position: null,
    drag: {
      active: false,
      pointerId: null,
      offsetX: 0,
      offsetY: 0
    }
  };

  const els = {};

  function cacheElements() {
    els.panel = document.getElementById("debugConsole");
    els.header = els.panel?.querySelector(".debug-console-header");
    els.closeButton = document.getElementById("debugCloseButton");
    els.clearButton = document.getElementById("debugClearButton");
    els.filters = document.getElementById("debugFilters");
    els.stateSummary = document.getElementById("debugStateSummary");
    els.towerStatus = document.getElementById("debugTowerStatus");
    els.cardOptions = document.getElementById("debugCardOptions");
    els.logList = document.getElementById("debugLogList");
  }

  function initDebugConsole() {
    cacheElements();
    if (!els.panel) return;

    window.addEventListener("keydown", handleDebugKeydown);
    window.addEventListener("resize", keepDebugPanelInBounds);
    els.header?.addEventListener("pointerdown", startDebugPanelDrag);
    els.closeButton?.addEventListener("click", () => toggleDebugConsole(false));
    els.clearButton?.addEventListener("click", clearDebugLogs);
    els.filters?.querySelectorAll("[data-debug-filter]").forEach((input) => {
      const category = input.dataset.debugFilter;
      input.checked = Boolean(debugState.filters[category]);
      input.addEventListener("change", () => {
        debugState.filters[category] = input.checked;
        debugLog("input", "Debug filter changed", {
          category,
          visible: input.checked
        });
        renderDebugConsole();
      });
    });

    debugLog("system", "Debug console ready", { toggleKey: "F9" });
  }

  function handleDebugKeydown(event) {
    if (event.key !== "F9") return;
    if (isEditableTarget(event.target)) return;

    event.preventDefault();
    toggleDebugConsole();
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest("input, textarea, select")) return true;
    return Boolean(target.closest("[contenteditable=''], [contenteditable='true']"));
  }

  function toggleDebugConsole(forceOpen) {
    if (!els.panel) return false;

    const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !debugState.open;
    if (nextOpen === debugState.open) return debugState.open;

    debugState.open = nextOpen;
    els.panel.hidden = !debugState.open;

    if (debugState.open) {
      startDebugRefresh();
      keepDebugPanelInBounds();
      debugLog("input", "Debug console opened", { toggleKey: "F9" });
      renderDebugConsole();
    } else {
      stopDebugRefresh();
      debugLog("input", "Debug console closed", { toggleKey: "F9" });
    }

    return debugState.open;
  }

  function startDebugPanelDrag(event) {
    if (!els.panel || event.button !== 0 || isInteractiveTarget(event.target)) return;

    const panelRect = els.panel.getBoundingClientRect();
    const parentRect = getDebugPanelParentRect();

    debugState.drag.active = true;
    debugState.drag.pointerId = event.pointerId;
    debugState.drag.offsetX = event.clientX - panelRect.left;
    debugState.drag.offsetY = event.clientY - panelRect.top;

    els.panel.style.width = `${panelRect.width}px`;
    els.panel.style.right = "auto";
    els.panel.classList.add("is-dragging");
    setDebugPanelPosition(panelRect.left - parentRect.left, panelRect.top - parentRect.top);

    els.header?.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", dragDebugPanel);
    window.addEventListener("pointerup", stopDebugPanelDrag);
    window.addEventListener("pointercancel", stopDebugPanelDrag);
    event.preventDefault();
  }

  function dragDebugPanel(event) {
    if (!debugState.drag.active || event.pointerId !== debugState.drag.pointerId) return;

    const parentRect = getDebugPanelParentRect();
    const nextLeft = event.clientX - parentRect.left - debugState.drag.offsetX;
    const nextTop = event.clientY - parentRect.top - debugState.drag.offsetY;
    setDebugPanelPosition(nextLeft, nextTop);
  }

  function stopDebugPanelDrag(event) {
    if (event?.pointerId !== undefined && event.pointerId !== debugState.drag.pointerId) return;

    debugState.drag.active = false;
    debugState.drag.pointerId = null;
    els.panel?.classList.remove("is-dragging");
    if (event?.pointerId !== undefined) {
      els.header?.releasePointerCapture?.(event.pointerId);
    }
    window.removeEventListener("pointermove", dragDebugPanel);
    window.removeEventListener("pointerup", stopDebugPanelDrag);
    window.removeEventListener("pointercancel", stopDebugPanelDrag);
  }

  function keepDebugPanelInBounds() {
    if (!debugState.position || !els.panel || els.panel.hidden) return;
    setDebugPanelPosition(debugState.position.left, debugState.position.top);
  }

  function setDebugPanelPosition(left, top) {
    if (!els.panel) return;

    const parentRect = getDebugPanelParentRect();
    const panelRect = els.panel.getBoundingClientRect();
    const maxLeft = Math.max(0, parentRect.width - panelRect.width);
    const maxTop = Math.max(0, parentRect.height - panelRect.height);
    const nextLeft = clampDebugPosition(left, 0, maxLeft);
    const nextTop = clampDebugPosition(top, 0, maxTop);

    debugState.position = {
      left: nextLeft,
      top: nextTop
    };

    els.panel.style.left = `${Math.round(nextLeft)}px`;
    els.panel.style.top = `${Math.round(nextTop)}px`;
    els.panel.style.right = "auto";
  }

  function getDebugPanelParentRect() {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  function clampDebugPosition(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function isInteractiveTarget(target) {
    return target instanceof Element
      && Boolean(target.closest("button, input, textarea, select, label, a"));
  }

  function startDebugRefresh() {
    stopDebugRefresh();
    debugState.refreshTimer = window.setInterval(renderDebugConsole, DEBUG_REFRESH_MS);
  }

  function stopDebugRefresh() {
    if (!debugState.refreshTimer) return;
    window.clearInterval(debugState.refreshTimer);
    debugState.refreshTimer = 0;
  }

  function clearDebugLogs() {
    debugState.logs = [];
    debugLog("system", "Debug log cleared");
  }

  function debugLog(category, message, details) {
    const safeCategory = DEBUG_CATEGORIES.includes(category) ? category : "system";
    const entry = {
      id: debugState.nextLogId,
      category: safeCategory,
      message: String(message || ""),
      details: cloneLogDetails(details),
      wallTime: Date.now(),
      sessionTime: ntp.state?.sessionTime || 0,
      wave: ntp.state?.wave || 0
    };

    debugState.nextLogId += 1;
    debugState.logs.push(entry);
    while (debugState.logs.length > debugState.maxLogs) {
      debugState.logs.shift();
    }

    if (debugState.open) {
      renderDebugConsole();
    }

    return entry;
  }

  function cloneLogDetails(details) {
    if (details === undefined) return undefined;

    const seen = new WeakSet();
    try {
      return JSON.parse(JSON.stringify(details, (key, value) => {
        if (key === "el") return "[element]";
        if (value === Infinity) return "Infinity";
        if (typeof value === "number" && Number.isNaN(value)) return "NaN";
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[circular]";
          seen.add(value);
        }
        return value;
      }));
    } catch (error) {
      return String(details);
    }
  }

  function renderDebugConsole() {
    if (!debugState.open || !els.panel || els.panel.hidden) return;

    renderStateSummary();
    renderTowerStatus();
    renderCardOptions();
    renderLogList();
  }

  function renderStateSummary() {
    const state = ntp.state || {};
    clearNode(els.stateSummary);

    appendKv(els.stateSummary, "Running", formatBoolean(state.running));
    appendKv(els.stateSummary, "Paused", formatBoolean(state.paused));
    appendKv(els.stateSummary, "Theme", state.theme || "-");
    appendKv(els.stateSummary, "Wave", `${formatRaw(state.wave)}/${formatRaw(state.waveLimit)}`);
    appendKv(els.stateSummary, "Coins", formatRaw(state.coins));
    appendKv(els.stateSummary, "Lives", `${formatRaw(state.lives)}/${formatRaw(state.maxLives)}`);
    appendKv(els.stateSummary, "Selected", formatTowerType(state.selectedTower));
    appendKv(els.stateSummary, "Speed", `${formatRaw(state.speed)}x`);
    appendKv(els.stateSummary, "Time", formatSessionTime(state.sessionTime || 0));
    appendKv(els.stateSummary, "Enemies", formatCount(state.enemies));
    appendKv(els.stateSummary, "Projectiles", formatCount(state.projectiles));
    appendKv(els.stateSummary, "Spawn", `${formatRaw(state.spawnRemaining)} left, ${formatNumber(state.spawnTimer)}s`);
    appendKv(els.stateSummary, "Cards", formatCardChoiceState(state.cardChoice));
  }

  function renderTowerStatus() {
    const state = ntp.state || {};
    const placedTowers = state.placedTowers || [];
    clearNode(els.towerStatus);

    const selectedStats = getTowerStats(state.selectedTower);
    if (selectedStats) {
      appendDebugItem(
        els.towerStatus,
        "debug-item",
        `Selected ${formatTowerType(state.selectedTower)}`,
        [
          formatStatsLine(selectedStats),
          formatTowerBuffs(state.selectedTower)
        ].filter(Boolean)
      );
    }

    if (!placedTowers.length) {
      appendDebugItem(els.towerStatus, "debug-item is-empty", "No placed towers", [
        "Build a tower to inspect per-instance cooldown and position."
      ]);
      return;
    }

    placedTowers.forEach((tower) => {
      const stats = getTowerStats(tower.type);
      const lines = [
        `tile ${formatRaw(tower.tileX)},${formatRaw(tower.tileY)} | pos ${formatNumber(tower.x)},${formatNumber(tower.y)}`,
        `cost ${formatRaw(tower.cost)} | cooldown ${formatNumber(tower.cooldown)}s`,
        formatStatsLine(stats),
        formatTowerBuffs(tower.type)
      ].filter(Boolean);

      appendDebugItem(
        els.towerStatus,
        "debug-item",
        `#${tower.id} ${formatTowerType(tower.type)}`,
        lines
      );
    });
  }

  function renderCardOptions() {
    const choice = ntp.state?.cardChoice || {};
    const cards = choice.cards || [];
    clearNode(els.cardOptions);

    appendDebugItem(els.cardOptions, "debug-item", "Choice state", [
      `active ${formatBoolean(choice.active)} | revealed ${formatBoolean(choice.revealed)}`,
      `selected ${choice.selectedCardId || "-"} | options ${cards.length}`
    ]);

    if (!cards.length) {
      appendDebugItem(els.cardOptions, "debug-item is-empty", "No card options generated", [
        "Card options appear here during eligible between-wave choices."
      ]);
      return;
    }

    cards.forEach((card, index) => {
      const isSelected = choice.selectedCardId === card.id;
      appendDebugItem(
        els.cardOptions,
        `debug-item is-card-${card.kind || "neutral"}`,
        `${index + 1}. ${card.title || card.id}${isSelected ? " [selected]" : ""}`,
        [
          `kind ${card.kind || "-"} | id ${card.id || "-"}`,
          card.description || "-",
          describeCardEffect(card.effect)
        ]
      );
    });
  }

  function renderLogList() {
    clearNode(els.logList);

    const visibleLogs = debugState.logs
      .filter((entry) => debugState.filters[entry.category])
      .slice()
      .reverse();

    if (!visibleLogs.length) {
      appendDebugItem(els.logList, "debug-item is-empty", "No visible logs", [
        "Enable categories or trigger gameplay events to populate the log."
      ]);
      return;
    }

    visibleLogs.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "debug-log-entry";
      item.dataset.category = entry.category;

      const head = document.createElement("div");
      head.className = "debug-log-head";

      const label = document.createElement("span");
      label.textContent = entry.message;

      const stamp = document.createElement("span");
      stamp.className = "debug-log-time";
      stamp.textContent = `#${entry.id} ${formatSessionTime(entry.sessionTime)} w${entry.wave}`;

      head.append(label, stamp);

      const category = document.createElement("span");
      category.className = "debug-log-category";
      category.textContent = entry.category;

      item.append(head, category);

      if (entry.details !== undefined) {
        const details = document.createElement("pre");
        details.className = "debug-log-details";
        details.textContent = formatLogDetails(entry.details);
        item.appendChild(details);
      }

      els.logList.appendChild(item);
    });
  }

  function appendKv(parent, key, value) {
    if (!parent) return;

    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = value;
    parent.append(dt, dd);
  }

  function appendDebugItem(parent, className, title, lines = []) {
    if (!parent) return;

    const item = document.createElement("div");
    item.className = className;

    const titleEl = document.createElement("div");
    titleEl.className = "debug-item-title";
    titleEl.textContent = title;
    item.appendChild(titleEl);

    lines.forEach((line) => {
      const meta = document.createElement("div");
      meta.className = "debug-item-meta";
      meta.textContent = line;
      item.appendChild(meta);
    });

    parent.appendChild(item);
  }

  function clearNode(node) {
    if (!node) return;
    node.textContent = "";
  }

  function getTowerStats(towerType) {
    return ntp.getTowerCombatStats?.(towerType) || ntp.towers?.[towerType] || null;
  }

  function formatTowerType(towerType) {
    if (!towerType) return "-";
    const label = ntp.getTowerLabel?.(towerType) || ntp.towers?.[towerType]?.label || towerType;
    return `${label} (${towerType})`;
  }

  function formatStatsLine(stats) {
    if (!stats) return "";

    const pairs = [
      ["cost", stats.cost],
      ["damage", stats.damage],
      ["range", stats.range],
      ["fireRate", stats.fireRate],
      ["projectile", stats.projectileSpeed],
      ["slow", stats.slowFactor],
      ["slowTime", stats.slowDuration],
      ["splash", stats.splash]
    ].filter(([, value]) => value !== undefined && value !== null);

    return pairs.map(([key, value]) => `${key} ${formatNumber(value)}`).join(" | ");
  }

  function formatTowerBuffs(towerType) {
    const buffs = (ntp.state?.cardEffects?.towerBuffs || [])
      .filter((buff) => buff.towerType === towerType && isEffectActive(buff))
      .map(formatEffect);

    return buffs.length ? `active buffs: ${buffs.join(", ")}` : "";
  }

  function isEffectActive(effect) {
    return effect.expiresAfterWave === "Infinity"
      || effect.expiresAfterWave === Infinity
      || effect.expiresAfterWave >= (ntp.state?.wave || 0);
  }

  function formatEffect(effect = {}) {
    const duration = effect.permanent || effect.expiresAfterWave === Infinity
      ? "permanent"
      : `until wave ${formatRaw(effect.expiresAfterWave)}`;
    const target = effect.towerType ? `${effect.towerType} ` : "";
    const stat = effect.stat ? `${effect.stat} ` : "";
    const multiplier = effect.multiplier !== undefined ? `x${formatNumber(effect.multiplier)}` : "";
    const amount = effect.amount !== undefined ? formatSigned(effect.amount) : "";
    return `${target}${stat}${multiplier || amount} ${duration}`.trim();
  }

  function describeCardEffect(effect = {}) {
    if (!effect.type || effect.type === "none") return "effect none";
    if (effect.type === "towerBuff") {
      return `effect towerBuff | ${formatEffect(effect)}`;
    }
    if (effect.type === "enemyModifier") {
      return `effect enemyModifier | ${effect.stat} x${formatNumber(effect.multiplier)} for ${formatRaw(effect.durationWaves)} wave`;
    }
    if (effect.type === "coins") {
      return `effect coins | ${formatSigned(effect.amount)}`;
    }
    if (effect.type === "coinsAll") {
      return "effect coinsAll | remove all coins";
    }
    if (effect.type === "heal") {
      return `effect heal | +${formatRaw(effect.amount)} life`;
    }
    if (effect.type === "enemyHealthBars") {
      return "effect enemyHealthBars | reveal enemy health bars";
    }
    return `effect ${effect.type}`;
  }

  function formatCardChoiceState(choice = {}) {
    if (!choice.active && !(choice.cards || []).length) return "inactive";
    return `active ${formatBoolean(choice.active)}, revealed ${formatBoolean(choice.revealed)}, options ${(choice.cards || []).length}`;
  }

  function formatLogDetails(details) {
    if (typeof details === "string") return details;
    return JSON.stringify(details, null, 2);
  }

  function formatBoolean(value) {
    return value ? "yes" : "no";
  }

  function formatCount(value) {
    return Array.isArray(value) ? String(value.length) : "0";
  }

  function formatRaw(value) {
    if (value === undefined || value === null || value === "") return "-";
    if (value === Infinity || value === "Infinity") return "permanent";
    return String(value);
  }

  function formatNumber(value) {
    if (value === undefined || value === null || value === "") return "-";
    if (value === Infinity || value === "Infinity") return "permanent";
    if (!Number.isFinite(Number(value))) return String(value);
    return Number(value).toFixed(2).replace(/\.?0+$/, "");
  }

  function formatSigned(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return formatRaw(value);
    return number > 0 ? `+${formatNumber(number)}` : formatNumber(number);
  }

  function formatSessionTime(totalSeconds) {
    return ntp.formatSessionTime?.(totalSeconds) || `${formatNumber(totalSeconds)}s`;
  }

  Object.assign(ntp, {
    debugState,
    debugLog,
    renderDebugConsole,
    toggleDebugConsole
  });

  initDebugConsole();
})();
