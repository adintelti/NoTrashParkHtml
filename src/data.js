(() => {
  const ntp = window.NTP = window.NTP || {};

  const towers = {
    sentinel: {
      label: "Sentinela",
      cost: 100,
      range: 2.75,
      fireRate: 1,
      damage: 18,
      projectileSpeed: 7.5,
      className: "tower-sentinel",
      projectileClass: ""
    },
    slow: {
      label: "Gelida",
      cost: 75,
      range: 2.35,
      fireRate: 0.8,
      damage: 7,
      projectileSpeed: 6.6,
      slowFactor: 0.45,
      slowDuration: 1.8,
      className: "tower-slow",
      projectileClass: "projectile-slow"
    },
    splash: {
      label: "Canhao",
      cost: 125,
      range: 2.45,
      fireRate: 0.55,
      damage: 24,
      projectileSpeed: 6,
      splash: 0.82,
      className: "tower-splash",
      projectileClass: "projectile-splash"
    },
    flame: {
      label: "Chama",
      cost: 150,
      range: 1.85,
      fireRate: 2.8,
      damage: 9,
      projectileSpeed: 8.5,
      className: "tower-flame",
      projectileClass: "projectile-flame"
    }
  };

  const maps = {
    park: {
      boardClass: "theme-park",
      name: "Parque",
      blocked: ["0,1", "1,4", "10,1", "11,6", "2,8", "9,8"],
      path: [
        [3, 0], [3, 1], [3, 2], [4, 2], [4, 3], [5, 3], [6, 3],
        [6, 4], [7, 4], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6], [10, 7], [10, 8]
      ]
    },
    lagoon: {
      boardClass: "theme-lagoon",
      name: "Lagoa",
      blocked: ["0,6", "1,8", "3,1", "4,0", "6,1", "8,7", "10,5"],
      path: [
        [4, 0], [5, 0], [6, 0], [7, 0], [7, 1], [7, 2], [6, 2],
        [5, 2], [5, 3], [5, 4], [6, 4], [7, 4], [8, 4], [8, 5], [8, 6], [9, 6], [10, 6], [11, 6]
      ]
    },
    lava: {
      boardClass: "theme-lava",
      name: "Fogo",
      blocked: ["2,2", "3,2", "8,2", "9,5", "5,7"],
      path: [
        [1, 0], [2, 0], [3, 0], [3, 1], [4, 1], [4, 2], [5, 2],
        [5, 3], [6, 3], [7, 3], [8, 3], [8, 4], [8, 5], [9, 5], [10, 5], [10, 6], [10, 7], [10, 8]
      ]
    }
  };

  const enemyTypes = [
    { className: "enemy-runner", hp: 42, speed: 1.22, reward: 8 },
    { className: "enemy-brute", hp: 78, speed: 0.78, reward: 14 },
    { className: "enemy-shield", hp: 105, speed: 0.64, reward: 18 }
  ];

  const themeOrder = ["park", "lagoon", "lava"];
  const towerOrder = Object.keys(towers);
  const towerUnlocksByTheme = {
    park: ["sentinel", "slow"],
    lagoon: ["sentinel", "slow", "splash"],
    lava: towerOrder
  };
  const victoryTitles = {
    park: "Parque Protegido!",
    lagoon: "Lagoa Protegida!",
    lava: "Parabens voce protegeu todos os biomas"
  };

  function getNextTheme(theme) {
    const index = themeOrder.indexOf(theme);
    return index >= 0 ? themeOrder[index + 1] : undefined;
  }

  function getFirstTheme() {
    return themeOrder[0] || "park";
  }

  function getUnlockedTowerKeys(theme) {
    return towerUnlocksByTheme[theme] || towerOrder;
  }

  function isTowerUnlocked(towerKey, theme) {
    return getUnlockedTowerKeys(theme).includes(towerKey);
  }

  Object.assign(ntp, {
    towers,
    maps,
    enemyTypes,
    themeOrder,
    towerOrder,
    getUnlockedTowerKeys,
    isTowerUnlocked,
    victoryTitles,
    getNextTheme,
    getFirstTheme
  });
})();
