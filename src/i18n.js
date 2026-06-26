(() => {
  const ntp = window.NTP = window.NTP || {};
  const {
    DEFAULT_LANGUAGE = "pt-BR",
    SUPPORTED_LANGUAGES = ["pt-BR", "en", "es"],
    saveLanguage,
    settings
  } = ntp;

  const translations = {
    "pt-BR": {
      document: {
        title: "No Trash Park - Demo no navegador"
      },
      version: {
        label: "Versao {version}",
        aria: "Versao do jogo"
      },
      common: {
        back: "Voltar",
        start: "Iniciar",
        continue: "Continuar",
        menu: "Menu",
        yes: "Sim",
        no: "Nao",
        cancel: "Cancelar",
        remove: "Remover"
      },
      menu: {
        screenAria: "Menu principal",
        controlsAria: "Controles do menu por controle",
        actionsAria: "Menu",
        play: "Jogar",
        config: "Config.",
        exit: "Sair",
        demoReady: "Demo pronta no navegador."
      },
      controls: {
        navigate: "Navegar",
        confirm: "Confirmar",
        back: "Voltar",
        adjust: "Ajustar",
        cursor: "Cursor",
        build: "Construir",
        tower: "Torre",
        pause: "Pausa",
        speed: "Vel."
      },
      settings: {
        controller: "Controle",
        controllerLayout: "Layout do controle",
        language: "Idioma",
        languageOptions: "Opcoes de idioma",
        cards: "Cartas",
        frequency: "Freq.",
        cardFrequencyAria: "Frequencia de exibicao das cartas",
        cardFrequencyOff: "Off",
        cardFrequencyOne: "1 onda",
        cardFrequencyMany: "{count} ondas",
        sound: "Som",
        soundToggles: "Opcoes de som",
        bgmVolumeAria: "Volume principal da musica",
        sfxVolumeAria: "Volume principal dos efeitos"
      },
      sound: {
        on: "Lig",
        off: "Des"
      },
      difficulty: {
        title: "Dificuldade",
        aria: "Dificuldade",
        easy: "Facil",
        medium: "Medio",
        hard: "Dificil",
        custom: "Custom",
        waves: "Ondas",
        customWavesAria: "Quantidade de ondas customizada"
      },
      game: {
        screenAria: "Demo tower defense",
        boardAria: "Campo de batalha",
        boardControlsAria: "Controles do campo de batalha por controle"
      },
      hud: {
        wave: "Onda",
        defeated: "Derrotou",
        time: "Tempo"
      },
      shop: {
        title: "LOJA",
        aria: "Loja",
        coinsAria: "Moedas",
        actionsAria: "Acoes",
        restart: "Reiniciar",
        menu: "Menu",
        controlsAria: "Controles da loja por controle",
        towerChoicesAria: "Opcoes de torres",
        toolsAria: "Ferramentas",
        undo: "Desfazer",
        delete: "Excluir",
        select: "Selecionar",
        lockedShort: "Bloq.",
        lockedBiome: "Bloqueada neste bioma",
        towerAria: "{tower} ${price}",
        towerLockedAria: "{tower} bloqueada",
        undoAria: "Desfazer ultima torre {seconds}"
      },
      actions: {
        pause: "Pause",
        resume: "Retomar"
      },
      confirm: {
        restartTitle: "Deseja realmente reiniciar o jogo?",
        restartAria: "Confirmar reinicio",
        exitTitle: "Deseja realmente sair do jogo atual?",
        exitAria: "Confirmar saida",
        towerDeleteTitle: "Remover esta torre?",
        towerDeleteAria: "Confirmar remocao"
      },
      towers: {
        sentinel: "Sentinela",
        slow: "Gelida",
        splash: "Canhao",
        flame: "Chama"
      },
      maps: {
        park: "Parque",
        lagoon: "Lagoa",
        lava: "Fogo"
      },
      victory: {
        park: "Parque Protegido!",
        lagoon: "Lagoa Protegida!",
        lava: "Parabens voce protegeu todos os biomas",
        default: "Vitoria!",
        gameOver: "Fim de jogo, {map} destruido(a)",
        statsAria: "Resumo da sessao",
        optionsAria: "Opcoes de resultado",
        restart: "Jogar novamente!"
      },
      cards: {
        kicker: "Evento da onda",
        choose: "Escolha uma carta",
        mysteryAria: "Cartas misteriosas",
        defaultKind: "Carta",
        cardAria: "Carta {index}",
        cardIndex: "Carta {index}",
        kind: {
          neutral: "Neutro",
          boon: "Ajuda",
          bane: "Risco"
        },
        neutral: {
          title: "Nada mudou",
          description: "A proxima onda segue normal.",
          result: "Nada acontece. A proxima onda vem no ritmo normal."
        },
        damage: {
          title: "{tower} reforcada",
          description: "{tower}: +30% dano permanente, max. {max}.",
          result: "{tower} ganhou dano permanente ate {max}."
        },
        powerSurge: {
          title: "Pico de poder {tower}",
          description: "Uma torre {tower}: dano dobrado na proxima onda.",
          result: "Uma torre {tower} tera dano dobrado na proxima onda."
        },
        damageSetback: {
          title: "{tower} desregulada",
          description: "{tower}: -23% dano permanente.",
          result: "{tower} perdeu 23% de dano permanente."
        },
        range: {
          title: "{tower} ampliada",
          description: "{tower}: +25% raio permanente.",
          result: "{tower} ganhou +25% de raio permanente."
        },
        rangeSetback: {
          title: "{tower} sobrecarregada",
          description: "{tower}: -20% raio permanente.",
          result: "{tower} perdeu 20% de raio permanente."
        },
        towerTypeClear: {
          title: "Varredura de {tower}",
          description: "Remova todas as torres {tower} do tabuleiro.",
          result: "Foram removidas {count} torres {tower}.",
          none: "Nenhuma torre {tower} para remover."
        },
        coinsGain: {
          title: "Coleta premiada",
          description: "Ganhe {amount} moedas agora.",
          result: "Voce ganhou {amount} moedas."
        },
        heal: {
          title: "Folego extra",
          description: "Recupere 1 HP agora.",
          result: "Voce recuperou 1 HP.",
          full: "Vida ja estava cheia. Nada mudou."
        },
        enemyHp: {
          title: "Lixo reforcado",
          description: "Inimigos: +18% HP na proxima onda.",
          result: "Inimigos terao +18% HP na proxima onda."
        },
        enemySpeed: {
          title: "Correria toxica",
          description: "Inimigos: +15% velocidade na proxima onda.",
          result: "Inimigos terao +15% de velocidade na proxima onda."
        },
        coinsLoss: {
          title: "Pedagio de limpeza",
          description: "Perca ate {amount} moedas agora.",
          result: "Voce perdeu {amount} moedas."
        },
        coinsAll: {
          title: "Confisco total",
          description: "Perca todas as moedas agora.",
          result: "Voce perdeu todas as moedas."
        },
        noCoinsChanged: "Sem moedas para alterar. Nada mudou.",
        noCoinsLost: "Sem moedas para perder. Nada mudou."
      },
      messages: {
        start: "Escolha uma torre e proteja o mapa.",
        cancelDeleteToBuild: "Cancele Excluir para construir.",
        towerLocked: "Torre bloqueada neste bioma.",
        spaceBlocked: "Espaco bloqueado.",
        notEnoughCoins: "Moedas insuficientes.",
        towerNoTargets: "Torre nao pode ser criada sem alcancar alvos.",
        towerUndone: "Torre desfeita.",
        selectTowerToRemove: "Selecione uma torre para remover.",
        buildModeRestored: "Modo de construcao retomado.",
        selectTower: "Selecione uma torre.",
        towerRemoved: "Torre removida.",
        towerNotFound: "Torre nao encontrada.",
        waveStart: "Onda {wave}",
        gamepadConnected: "Controle conectado.",
        gamepadDisconnected: "Controle desconectado."
      },
      wave: {
        end: "Fim da onda {wave}\nDerrotou: {defeated}",
        start: "Inicio da onda {wave}"
      },
      board: {
        tileAria: "Celula {x}, {y}"
      }
    },
    en: {
      document: {
        title: "No Trash Park - Browser Demo"
      },
      version: {
        label: "Version {version}",
        aria: "Game version"
      },
      common: {
        back: "Back",
        start: "Start",
        continue: "Continue",
        menu: "Menu",
        yes: "Yes",
        no: "No",
        cancel: "Cancel",
        remove: "Remove"
      },
      menu: {
        screenAria: "Main menu",
        controlsAria: "Gamepad menu controls",
        actionsAria: "Menu",
        play: "Play",
        config: "Settings",
        exit: "Exit",
        demoReady: "Demo ready in the browser."
      },
      controls: {
        navigate: "Navigate",
        confirm: "Confirm",
        back: "Back",
        adjust: "Adjust",
        cursor: "Cursor",
        build: "Build",
        tower: "Tower",
        pause: "Pause",
        speed: "Spd."
      },
      settings: {
        controller: "Controller",
        controllerLayout: "Controller layout",
        language: "Language",
        languageOptions: "Language options",
        cards: "Cards",
        frequency: "Freq.",
        cardFrequencyAria: "Card display frequency",
        cardFrequencyOff: "Off",
        cardFrequencyOne: "1 wave",
        cardFrequencyMany: "{count} waves",
        sound: "Sound",
        soundToggles: "Sound toggles",
        bgmVolumeAria: "BGM master volume",
        sfxVolumeAria: "SFX master volume"
      },
      sound: {
        on: "On",
        off: "Off"
      },
      difficulty: {
        title: "Difficulty",
        aria: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        custom: "Custom",
        waves: "Waves",
        customWavesAria: "Custom wave count"
      },
      game: {
        screenAria: "Tower defense demo",
        boardAria: "Battlefield",
        boardControlsAria: "Gamepad battlefield controls"
      },
      hud: {
        wave: "Wave",
        defeated: "Defeated",
        time: "Time"
      },
      shop: {
        title: "SHOP",
        aria: "Shop",
        coinsAria: "Coins",
        actionsAria: "Actions",
        restart: "Restart",
        menu: "Menu",
        controlsAria: "Gamepad shop controls",
        towerChoicesAria: "Tower choices",
        toolsAria: "Tools",
        undo: "Undo",
        delete: "Delete",
        select: "Select",
        lockedShort: "Lock",
        lockedBiome: "Locked in this biome",
        towerAria: "{tower} ${price}",
        towerLockedAria: "{tower} locked",
        undoAria: "Undo last tower {seconds}"
      },
      actions: {
        pause: "Pause",
        resume: "Resume"
      },
      confirm: {
        restartTitle: "Do you really want to restart the game?",
        restartAria: "Confirm restart",
        exitTitle: "Do you really want to leave the current game?",
        exitAria: "Confirm exit",
        towerDeleteTitle: "Remove this tower?",
        towerDeleteAria: "Confirm removal"
      },
      towers: {
        sentinel: "Sentinel",
        slow: "Frost",
        splash: "Cannon",
        flame: "Flame"
      },
      maps: {
        park: "Park",
        lagoon: "Lagoon",
        lava: "Fire"
      },
      victory: {
        park: "Park Protected!",
        lagoon: "Lagoon Protected!",
        lava: "Congratulations, you protected every biome",
        default: "Victory!",
        gameOver: "Game over, {map} destroyed",
        statsAria: "Session summary",
        optionsAria: "Result options",
        restart: "Play again!"
      },
      cards: {
        kicker: "Wave event",
        choose: "Choose a card",
        mysteryAria: "Mystery cards",
        defaultKind: "Card",
        cardAria: "Card {index}",
        cardIndex: "Card {index}",
        kind: {
          neutral: "Neutral",
          boon: "Boost",
          bane: "Risk"
        },
        neutral: {
          title: "Nothing changed",
          description: "The next wave stays normal.",
          result: "Nothing happens. The next wave keeps its usual pace."
        },
        damage: {
          title: "{tower} reinforced",
          description: "{tower}: +30% permanent damage, max {max}.",
          result: "{tower} gained permanent damage up to {max}."
        },
        powerSurge: {
          title: "{tower} power surge",
          description: "One {tower} tower: double damage next wave.",
          result: "One {tower} tower will deal double damage next wave."
        },
        damageSetback: {
          title: "{tower} destabilized",
          description: "{tower}: -23% permanent damage.",
          result: "{tower} lost 23% permanent damage."
        },
        range: {
          title: "{tower} expanded",
          description: "{tower}: +25% permanent range.",
          result: "{tower} gained +25% permanent range."
        },
        rangeSetback: {
          title: "{tower} overloaded",
          description: "{tower}: -20% permanent range.",
          result: "{tower} lost 20% permanent range."
        },
        towerTypeClear: {
          title: "{tower} sweep",
          description: "Remove every {tower} tower from the board.",
          result: "Removed {count} {tower} towers.",
          none: "No {tower} towers to remove."
        },
        coinsGain: {
          title: "Prize collection",
          description: "Gain {amount} coins now.",
          result: "You gained {amount} coins."
        },
        heal: {
          title: "Extra breath",
          description: "Recover 1 HP now.",
          result: "You recovered 1 HP.",
          full: "Life was already full. Nothing changed."
        },
        enemyHp: {
          title: "Reinforced trash",
          description: "Enemies: +18% HP next wave.",
          result: "Enemies will have +18% HP next wave."
        },
        enemySpeed: {
          title: "Toxic rush",
          description: "Enemies: +15% speed next wave.",
          result: "Enemies will have +15% speed next wave."
        },
        coinsLoss: {
          title: "Cleanup toll",
          description: "Lose up to {amount} coins now.",
          result: "You lost {amount} coins."
        },
        coinsAll: {
          title: "Total confiscation",
          description: "Lose all coins now.",
          result: "You lost all coins."
        },
        noCoinsChanged: "No coins to change. Nothing changed.",
        noCoinsLost: "No coins to lose. Nothing changed."
      },
      messages: {
        start: "Choose a tower and protect the map.",
        cancelDeleteToBuild: "Cancel Delete to build.",
        towerLocked: "Tower locked in this biome.",
        spaceBlocked: "Blocked space.",
        notEnoughCoins: "Not enough coins.",
        towerNoTargets: "Tower cannot be built without reaching targets.",
        towerUndone: "Tower undone.",
        selectTowerToRemove: "Select a tower to remove.",
        buildModeRestored: "Build mode restored.",
        selectTower: "Select a tower.",
        towerRemoved: "Tower removed.",
        towerNotFound: "Tower not found.",
        waveStart: "Wave {wave}",
        gamepadConnected: "Controller connected.",
        gamepadDisconnected: "Controller disconnected."
      },
      wave: {
        end: "End of wave {wave}\nDefeated: {defeated}",
        start: "Start of wave {wave}"
      },
      board: {
        tileAria: "Tile {x}, {y}"
      }
    },
    es: {
      document: {
        title: "No Trash Park - Demo en navegador"
      },
      version: {
        label: "Version {version}",
        aria: "Version del juego"
      },
      common: {
        back: "Volver",
        start: "Iniciar",
        continue: "Continuar",
        menu: "Menu",
        yes: "Si",
        no: "No",
        cancel: "Cancelar",
        remove: "Quitar"
      },
      menu: {
        screenAria: "Menu principal",
        controlsAria: "Controles del menu con mando",
        actionsAria: "Menu",
        play: "Jugar",
        config: "Config.",
        exit: "Salir",
        demoReady: "Demo lista en el navegador."
      },
      controls: {
        navigate: "Navegar",
        confirm: "Confirmar",
        back: "Volver",
        adjust: "Ajustar",
        cursor: "Cursor",
        build: "Construir",
        tower: "Torre",
        pause: "Pausa",
        speed: "Vel."
      },
      settings: {
        controller: "Control",
        controllerLayout: "Layout del control",
        language: "Idioma",
        languageOptions: "Opciones de idioma",
        cards: "Cartas",
        frequency: "Frec.",
        cardFrequencyAria: "Frecuencia de aparicion de cartas",
        cardFrequencyOff: "Off",
        cardFrequencyOne: "1 oleada",
        cardFrequencyMany: "{count} oleadas",
        sound: "Sonido",
        soundToggles: "Opciones de sonido",
        bgmVolumeAria: "Volumen principal de musica",
        sfxVolumeAria: "Volumen principal de efectos"
      },
      sound: {
        on: "Act",
        off: "Des"
      },
      difficulty: {
        title: "Dificultad",
        aria: "Dificultad",
        easy: "Facil",
        medium: "Medio",
        hard: "Dificil",
        custom: "Custom",
        waves: "Oleadas",
        customWavesAria: "Cantidad de oleadas personalizada"
      },
      game: {
        screenAria: "Demo tower defense",
        boardAria: "Campo de batalla",
        boardControlsAria: "Controles del campo con mando"
      },
      hud: {
        wave: "Oleada",
        defeated: "Derroto",
        time: "Tiempo"
      },
      shop: {
        title: "TIENDA",
        aria: "Tienda",
        coinsAria: "Monedas",
        actionsAria: "Acciones",
        restart: "Reiniciar",
        menu: "Menu",
        controlsAria: "Controles de tienda con mando",
        towerChoicesAria: "Opciones de torres",
        toolsAria: "Herramientas",
        undo: "Deshacer",
        delete: "Borrar",
        select: "Seleccionar",
        lockedShort: "Bloq.",
        lockedBiome: "Bloqueada en este bioma",
        towerAria: "{tower} ${price}",
        towerLockedAria: "{tower} bloqueada",
        undoAria: "Deshacer ultima torre {seconds}"
      },
      actions: {
        pause: "Pausa",
        resume: "Retomar"
      },
      confirm: {
        restartTitle: "Realmente quieres reiniciar el juego?",
        restartAria: "Confirmar reinicio",
        exitTitle: "Realmente quieres salir del juego actual?",
        exitAria: "Confirmar salida",
        towerDeleteTitle: "Quitar esta torre?",
        towerDeleteAria: "Confirmar eliminacion"
      },
      towers: {
        sentinel: "Centinela",
        slow: "Helada",
        splash: "Canon",
        flame: "Llama"
      },
      maps: {
        park: "Parque",
        lagoon: "Laguna",
        lava: "Fuego"
      },
      victory: {
        park: "Parque Protegido!",
        lagoon: "Laguna Protegida!",
        lava: "Felicidades, protegiste todos los biomas",
        default: "Victoria!",
        gameOver: "Fin del juego, {map} destruido(a)",
        statsAria: "Resumen de la sesion",
        optionsAria: "Opciones de resultado",
        restart: "Jugar otra vez!"
      },
      cards: {
        kicker: "Evento de oleada",
        choose: "Elige una carta",
        mysteryAria: "Cartas misteriosas",
        defaultKind: "Carta",
        cardAria: "Carta {index}",
        cardIndex: "Carta {index}",
        kind: {
          neutral: "Neutro",
          boon: "Ayuda",
          bane: "Riesgo"
        },
        neutral: {
          title: "Nada cambio",
          description: "La proxima oleada sigue normal.",
          result: "Nada sucede. La proxima oleada mantiene su ritmo normal."
        },
        damage: {
          title: "{tower} reforzada",
          description: "{tower}: +30% dano permanente, max. {max}.",
          result: "{tower} gano dano permanente hasta {max}."
        },
        powerSurge: {
          title: "Pico de poder {tower}",
          description: "Una torre {tower}: dano doble en la proxima oleada.",
          result: "Una torre {tower} tendra dano doble en la proxima oleada."
        },
        damageSetback: {
          title: "{tower} desregulada",
          description: "{tower}: -23% dano permanente.",
          result: "{tower} perdio 23% de dano permanente."
        },
        range: {
          title: "{tower} ampliada",
          description: "{tower}: +25% alcance permanente.",
          result: "{tower} gano +25% de alcance permanente."
        },
        rangeSetback: {
          title: "{tower} sobrecargada",
          description: "{tower}: -20% alcance permanente.",
          result: "{tower} perdio 20% de alcance permanente."
        },
        towerTypeClear: {
          title: "Barrida de {tower}",
          description: "Quita todas las torres {tower} del tablero.",
          result: "Se quitaron {count} torres {tower}.",
          none: "No hay torres {tower} para quitar."
        },
        coinsGain: {
          title: "Recoleccion premiada",
          description: "Gana {amount} monedas ahora.",
          result: "Ganaste {amount} monedas."
        },
        heal: {
          title: "Aliento extra",
          description: "Recupera 1 HP ahora.",
          result: "Recuperaste 1 HP.",
          full: "La vida ya estaba llena. Nada cambio."
        },
        enemyHp: {
          title: "Basura reforzada",
          description: "Enemigos: +18% HP en la proxima oleada.",
          result: "Los enemigos tendran +18% HP en la proxima oleada."
        },
        enemySpeed: {
          title: "Carrera toxica",
          description: "Enemigos: +15% velocidad en la proxima oleada.",
          result: "Los enemigos tendran +15% de velocidad en la proxima oleada."
        },
        coinsLoss: {
          title: "Peaje de limpieza",
          description: "Pierde hasta {amount} monedas ahora.",
          result: "Perdiste {amount} monedas."
        },
        coinsAll: {
          title: "Confiscacion total",
          description: "Pierde todas las monedas ahora.",
          result: "Perdiste todas las monedas."
        },
        noCoinsChanged: "No hay monedas para cambiar. Nada cambio.",
        noCoinsLost: "No hay monedas para perder. Nada cambio."
      },
      messages: {
        start: "Elige una torre y protege el mapa.",
        cancelDeleteToBuild: "Cancela Borrar para construir.",
        towerLocked: "Torre bloqueada en este bioma.",
        spaceBlocked: "Espacio bloqueado.",
        notEnoughCoins: "Monedas insuficientes.",
        towerNoTargets: "La torre no puede crearse sin alcanzar objetivos.",
        towerUndone: "Torre deshecha.",
        selectTowerToRemove: "Selecciona una torre para quitar.",
        buildModeRestored: "Modo de construccion retomado.",
        selectTower: "Selecciona una torre.",
        towerRemoved: "Torre quitada.",
        towerNotFound: "Torre no encontrada.",
        waveStart: "Oleada {wave}",
        gamepadConnected: "Control conectado.",
        gamepadDisconnected: "Control desconectado."
      },
      wave: {
        end: "Fin de la oleada {wave}\nDerroto: {defeated}",
        start: "Inicio de la oleada {wave}"
      },
      board: {
        tileAria: "Casilla {x}, {y}"
      }
    }
  };

  function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
  }

  function getLanguage() {
    settings.language = normalizeLanguage(settings.language);
    return settings.language;
  }

  function getTranslationEntry(dictionary, key) {
    return key.split(".").reduce((entry, part) => {
      if (entry && Object.prototype.hasOwnProperty.call(entry, part)) {
        return entry[part];
      }
      return undefined;
    }, dictionary);
  }

  function interpolate(text, params = {}) {
    return String(text).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
  }

  function t(key, params = {}, fallback = key) {
    const language = getLanguage();
    const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
    const fallbackDictionary = translations[DEFAULT_LANGUAGE] || {};
    const value = getTranslationEntry(dictionary, key)
      ?? getTranslationEntry(fallbackDictionary, key)
      ?? fallback;

    return interpolate(value, params);
  }

  function getTowerLabel(towerKey) {
    return t(`towers.${towerKey}`, {}, ntp.towers?.[towerKey]?.label || towerKey);
  }

  function getMapName(theme) {
    return t(`maps.${theme}`, {}, ntp.maps?.[theme]?.name || theme);
  }

  function getVictoryTitle(theme) {
    return t(`victory.${theme}`, {}, t("victory.default"));
  }

  function formatCardFrequencyLabel(cardFrequency) {
    if (cardFrequency <= 0) return t("settings.cardFrequencyOff");
    return cardFrequency === 1
      ? t("settings.cardFrequencyOne")
      : t("settings.cardFrequencyMany", { count: cardFrequency });
  }

  function applyAttributeTranslations(attributeName, setter) {
    document.querySelectorAll(`[${attributeName}]`).forEach((el) => {
      const key = el.getAttribute(attributeName);
      if (key) setter(el, t(key));
    });
  }

  function syncLanguageControls() {
    document.querySelectorAll("[data-language]").forEach((button) => {
      const isSelected = button.dataset.language === getLanguage();
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function applyTranslations() {
    document.documentElement.lang = getLanguage();
    document.title = t("document.title");

    applyAttributeTranslations("data-i18n", (el, text) => {
      el.textContent = text;
    });
    applyAttributeTranslations("data-i18n-aria-label", (el, text) => {
      el.setAttribute("aria-label", text);
    });
    applyAttributeTranslations("data-i18n-title", (el, text) => {
      el.setAttribute("title", text);
    });

    syncLanguageControls();
    ntp.updateVersionText?.();
    ntp.syncCardFrequencyControl?.();
    ntp.syncSoundControls?.();
    ntp.updateHud?.();
  }

  function setLanguage(language) {
    settings.language = normalizeLanguage(language);
    saveLanguage?.(settings.language);
    applyTranslations();
  }

  Object.assign(ntp, {
    translations,
    t,
    getLanguage,
    setLanguage,
    syncLanguageControls,
    applyTranslations,
    getTowerLabel,
    getMapName,
    getVictoryTitle,
    formatCardFrequencyLabel
  });
})();
