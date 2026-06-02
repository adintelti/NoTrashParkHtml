(() => {
  const ntp = window.NTP = window.NTP || {};

  ntp.COLS = 12;
  ntp.ROWS = 9;
  ntp.GAME_VERSION = "1.5.0";
  ntp.MIN_CUSTOM_WAVES = 20;
  ntp.GAMEPAD_DEADZONE = 0.35;
  ntp.GAMEPAD_MOVE_REPEAT = 0.16;
  ntp.GAMEPAD_NAV_REPEAT = 0.18;

  ntp.difficultyOptions = {
    easy: 5,
    medium: 12,
    hard: 20
  };

  ntp.musicTracks = {
    menu: "sound/bmg/menu.ogg",
    park: "sound/bmg/level1-park.ogg",
    lagoon: "sound/bmg/level2-water.ogg",
    lava: "sound/bmg/level3-fire.ogg"
  };

  ntp.sfxTracks = {
    projectileThrow: "sound/sfx/tap_stone.wav",
    enemyDeath: "sound/sfx/tail_whip.flac"
  };

  ntp.sfxVolumes = {
    projectileThrow: 0.05,
    enemyDeath: 1
  };

  ntp.gamepadButtons = {
    a: 0,
    b: 1,
    x: 2,
    y: 3,
    lb: 4,
    rb: 5,
    lt: 6,
    rt: 7,
    back: 8,
    start: 9,
    dpadUp: 12,
    dpadDown: 13,
    dpadLeft: 14,
    dpadRight: 15
  };
})();
