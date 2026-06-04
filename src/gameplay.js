(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    buildBoard,
    clearDynamicElements,
    coordKey,
    doesTowerReachPath,
    dom,
    enemyTypes,
    getConfiguredWaveLimit,
    hideExitConfirm,
    hideRestartConfirm,
    hideVictory,
    isVictoryOpen,
    maps,
    playSfx,
    resetState,
    refreshPlacementPreview,
    setElementPosition,
    showGameOver,
    showMessage,
    showVictory,
    state,
    syncThemeButtons,
    towerOrder,
    towers,
    updateHud
  } = ntp;

  const gameplayHooks = {
    afterStartGame() {},
    afterReturnToMenu() {},
    afterTowerPlaced() {}
  };

  function configureGameplayHooks(hooks) {
    Object.assign(gameplayHooks, hooks);
  }

  function startGame(theme = state.theme) {
    resetState(theme, getConfiguredWaveLimit());
    state.running = true;
    syncThemeButtons(theme);
    dom.menu.classList.add("is-hidden");
    dom.game.classList.remove("is-hidden");
    hideRestartConfirm();
    hideExitConfirm();
    hideVictory();
    buildBoard();
    gameplayHooks.afterStartGame();
    updateHud();
    showMessage("Escolha uma torre e proteja o mapa.");
  }

  function returnToMenu() {
    state.running = false;
    hideRestartConfirm();
    hideExitConfirm();
    hideVictory();
    clearDynamicElements();
    dom.game.classList.add("is-hidden");
    dom.menu.classList.remove("is-hidden");
    gameplayHooks.afterReturnToMenu();
  }

  function setTheme(theme) {
    const hadStarted = state.running;
    state.theme = theme;
    syncThemeButtons(theme);
    if (hadStarted) {
      startGame(theme);
    }
  }

  function placeTower(x, y) {
    if (!state.running || state.paused || state.gameOver) return;

    const key = coordKey(x, y);
    const towerDef = towers[state.selectedTower];
    if (state.pathSet.has(key) || state.blockedSet.has(key) || state.occupied.has(key)) {
      showMessage("Espaco bloqueado.");
      return;
    }
    if (state.coins < towerDef.cost) {
      showMessage("Moedas insuficientes.");
      return;
    }
    if (!doesTowerReachPath(x, y, towerDef.range)) {
      showMessage("Torre não pode ser criada sem alcançar alvos");
      return;
    }

    state.coins -= towerDef.cost;
    state.occupied.add(key);

    const el = document.createElement("div");
    el.className = `tower ${towerDef.className}`;
    el.dataset.tower = state.selectedTower;
    dom.board.appendChild(el);

    const tower = {
      x: x + 0.5,
      y: y + 0.5,
      type: state.selectedTower,
      cooldown: 0,
      el
    };

    state.placedTowers.push(tower);
    setElementPosition(el, tower.x, tower.y);
    gameplayHooks.afterTowerPlaced();
    updateHud();
  }

  function update(dt, rawDt = dt) {
    if (!state.running || state.paused || state.gameOver || state.victoryPending) return;

    state.sessionTime += rawDt;
    state.simTime += dt;

    if (state.spawnRemaining <= 0 && state.enemies.length === 0) {
      state.waveCooldown -= dt;
      if (state.waveCooldown <= 0) {
        state.waveCooldown = 2.4;
        startNextWave();
      }
    }

    if (state.spawnRemaining > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnEnemy();
        state.spawnRemaining -= 1;
        state.spawnTimer = Math.max(0.36, 0.86 - state.wave * 0.025);
      }
    }

    moveEnemies(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateImpacts(dt);
    updateHud();
  }

  function togglePause() {
    if (!state.running || state.gameOver || isVictoryOpen()) return;
    state.paused = !state.paused;
    updateHud();
  }

  function toggleSpeed() {
    if (!state.running || state.gameOver || isVictoryOpen()) return;
    state.speed = state.speed === 1 ? 2 : 1;
    updateHud();
  }

  function cycleSelectedTower(step) {
    const enabledTowerKeys = towerOrder.filter((towerKey) => {
      const button = dom.towerShop.querySelector(`[data-tower="${towerKey}"]`);
      return !button?.disabled;
    });
    const availableTowerKeys = enabledTowerKeys.length ? enabledTowerKeys : towerOrder;
    const currentIndex = availableTowerKeys.indexOf(state.selectedTower);
    const nextIndex = currentIndex >= 0
      ? (currentIndex + step + availableTowerKeys.length) % availableTowerKeys.length
      : 0;

    state.selectedTower = availableTowerKeys[nextIndex];
    updateHud();
    refreshPlacementPreview();
  }

  function startNextWave() {
    if (state.gameOver) return;
    if (state.wave >= state.waveLimit && !state.victoryShown) {
      state.victoryShown = true;
      state.victoryPending = true;
      showVictory();
      updateHud();
      return;
    }
    state.wave += 1;
    beginWaveSpawn();
  }

  function beginWaveSpawn() {
    state.spawnRemaining = 6 + state.wave * 2;
    state.spawnTimer = 0;
    state.victoryPending = false;
    showMessage(`Onda ${state.wave}`);
    updateHud();
  }

  function spawnEnemy() {
    const path = maps[state.theme].path;
    const tier = state.wave > 4 && state.spawnRemaining % 5 === 0
      ? 2
      : state.wave > 2 && state.spawnRemaining % 3 === 0
        ? 1
        : 0;
    const type = enemyTypes[tier];
    const maxHp = Math.round(type.hp * (1 + state.wave * 0.12));
    const el = document.createElement("div");
    el.className = `enemy ${type.className}`;
    el.innerHTML = '<div class="health"><span></span></div>';
    dom.board.appendChild(el);

    const enemy = {
      id: state.nextEnemyId,
      x: path[0][0] + 0.5,
      y: path[0][1] + 0.5,
      pathIndex: 0,
      maxHp,
      hp: maxHp,
      speed: type.speed * (1 + Math.min(state.wave, 8) * 0.025),
      reward: type.reward,
      slowUntil: 0,
      slowFactor: 1,
      el
    };

    state.nextEnemyId += 1;
    state.enemies.push(enemy);
    setElementPosition(el, enemy.x, enemy.y);
  }

  function moveEnemies(dt) {
    const path = maps[state.theme].path.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
    const leaked = [];

    state.enemies.forEach((enemy) => {
      let distance = enemy.speed * (enemy.slowUntil > state.simTime ? enemy.slowFactor : 1) * dt;
      while (distance > 0 && enemy.pathIndex < path.length - 1) {
        const target = path[enemy.pathIndex + 1];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const segmentLength = Math.hypot(dx, dy);

        if (segmentLength <= distance) {
          enemy.x = target.x;
          enemy.y = target.y;
          enemy.pathIndex += 1;
          distance -= segmentLength;
        } else {
          enemy.x += (dx / segmentLength) * distance;
          enemy.y += (dy / segmentLength) * distance;
          distance = 0;
        }
      }

      if (enemy.pathIndex >= path.length - 1) {
        leaked.push(enemy);
      } else {
        enemy.el.classList.toggle("slowed", enemy.slowUntil > state.simTime);
        setElementPosition(enemy.el, enemy.x, enemy.y);
      }
    });

    leaked.forEach((enemy) => {
      removeEnemy(enemy, false);
      if (state.gameOver) return;
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives <= 0) endGame();
    });
  }

  function updateTowers(dt) {
    state.placedTowers.forEach((tower) => {
      const towerDef = towers[tower.type];
      tower.cooldown -= dt;
      if (tower.cooldown > 0) return;

      const target = findTarget(tower, towerDef.range);
      if (!target) return;

      tower.cooldown = 1 / towerDef.fireRate;
      fireProjectile(tower, target, towerDef);
    });
  }

  function findTarget(tower, range) {
    let best = null;
    let bestProgress = -1;

    state.enemies.forEach((enemy) => {
      const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
      const progress = enemy.pathIndex + distance / 10;
      if (distance <= range && progress > bestProgress) {
        best = enemy;
        bestProgress = progress;
      }
    });

    return best;
  }

  function fireProjectile(tower, target, towerDef) {
    const el = document.createElement("div");
    el.className = `projectile ${towerDef.projectileClass || ""}`.trim();
    dom.board.appendChild(el);

    const projectile = {
      id: state.nextProjectileId,
      x: tower.x,
      y: tower.y - 0.15,
      targetId: target.id,
      damage: towerDef.damage,
      speed: towerDef.projectileSpeed,
      slowFactor: towerDef.slowFactor,
      slowDuration: towerDef.slowDuration,
      splash: towerDef.splash || 0,
      el
    };

    state.nextProjectileId += 1;
    state.projectiles.push(projectile);
    setElementPosition(el, projectile.x, projectile.y);
    playSfx("projectileThrow");
  }

  function updateProjectiles(dt) {
    const finished = [];

    state.projectiles.forEach((projectile) => {
      const target = state.enemies.find((enemy) => enemy.id === projectile.targetId);
      if (!target) {
        finished.push(projectile);
        return;
      }

      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const travel = projectile.speed * dt;

      if (distance <= travel) {
        projectile.x = target.x;
        projectile.y = target.y;
        hitEnemy(projectile, target);
        finished.push(projectile);
      } else {
        projectile.x += (dx / distance) * travel;
        projectile.y += (dy / distance) * travel;
        setElementPosition(projectile.el, projectile.x, projectile.y);
      }
    });

    finished.forEach(removeProjectile);
  }

  function hitEnemy(projectile, target) {
    if (projectile.splash) {
      createImpact(projectile.x, projectile.y);
      state.enemies.slice().forEach((enemy) => {
        const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
        if (distance <= projectile.splash) {
          damageEnemy(enemy, Math.round(projectile.damage * (1 - distance / (projectile.splash * 1.55))));
        }
      });
    } else {
      damageEnemy(target, projectile.damage);
    }

    if (projectile.slowFactor) {
      target.slowFactor = projectile.slowFactor;
      target.slowUntil = Math.max(target.slowUntil, state.simTime + projectile.slowDuration);
    }
  }

  function damageEnemy(enemy, amount) {
    enemy.hp -= Math.max(1, amount);
    const bar = enemy.el.querySelector(".health span");
    if (bar) {
      bar.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
    }
    if (enemy.hp <= 0) {
      removeEnemy(enemy, true);
    }
  }

  function removeEnemy(enemy, awardCoins) {
    const index = state.enemies.indexOf(enemy);
    if (index >= 0) {
      state.enemies.splice(index, 1);
    }
    enemy.el?.remove();
    if (awardCoins) {
      playSfx("enemyDeath");
      state.coins += enemy.reward;
    }
  }

  function removeProjectile(projectile) {
    const index = state.projectiles.indexOf(projectile);
    if (index >= 0) {
      state.projectiles.splice(index, 1);
    }
    projectile.el?.remove();
  }

  function createImpact(x, y) {
    const el = document.createElement("div");
    el.className = "impact";
    dom.board.appendChild(el);
    const impact = {
      x,
      y,
      life: 0.22,
      el
    };
    state.impacts.push(impact);
    setElementPosition(el, x, y);
  }

  function updateImpacts(dt) {
    state.impacts = state.impacts.filter((impact) => {
      impact.life -= dt;
      if (impact.life <= 0) {
        impact.el.remove();
        return false;
      }
      return true;
    });
  }

  function endGame() {
    if (state.gameOver) return;
    state.gameOver = true;
    hideVictory();
    state.lives = 0;
    showGameOver();
    updateHud();
  }

  Object.assign(ntp, {
    configureGameplayHooks,
    startGame,
    returnToMenu,
    setTheme,
    placeTower,
    update,
    togglePause,
    toggleSpeed,
    cycleSelectedTower,
    startNextWave,
    beginWaveSpawn
  });
})();
