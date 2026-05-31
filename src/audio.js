(() => {
  const ntp = window.NTP = window.NTP || {};
  const { musicTracks, sfxTracks, sfxVolumes } = ntp;

  const MUSIC_VOLUME = 0.42;
  const DEFAULT_SFX_VOLUME = 0.58;
  const SFX_POOL_SIZE = 5;
  const FADE_OUT_MS = 650;
  const FADE_IN_MS = 900;
  const MENU_START_FADE_IN_MS = 220;
  const FADE_INTERVAL_MS = 40;

  const trackAudio = new Map();
  const sfxPools = new Map();
  let activeAudio;
  let activeTrack = "";
  let desiredTrack = "menu";
  let transitionId = 0;
  let unlockEventsBound = false;

  function getAudio(track) {
    if (trackAudio.has(track)) {
      return trackAudio.get(track);
    }

    const audio = new Audio(musicTracks[track]);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    trackAudio.set(track, audio);
    return audio;
  }

  function preloadMusic() {
    Object.keys(musicTracks).forEach((track) => getAudio(track).load());
  }

  function getSfxPool(sfx) {
    if (sfxPools.has(sfx)) {
      return sfxPools.get(sfx);
    }

    const pool = Array.from({ length: SFX_POOL_SIZE }, () => {
      const audio = new Audio(sfxTracks[sfx]);
      audio.preload = "auto";
      audio.volume = getSfxVolume(sfx);
      return audio;
    });
    sfxPools.set(sfx, { index: 0, pool });
    return sfxPools.get(sfx);
  }

  function getSfxVolume(sfx) {
    return sfxVolumes?.[sfx] ?? DEFAULT_SFX_VOLUME;
  }

  function preloadSfx() {
    Object.keys(sfxTracks).forEach((sfx) => {
      getSfxPool(sfx).pool.forEach((audio) => audio.load());
    });
  }

  function pauseOtherTracks(allowedAudio) {
    trackAudio.forEach((audio) => {
      if (audio === allowedAudio) return;
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });
  }

  function fadeVolume(audio, targetVolume, duration, token) {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const steps = Math.max(1, Math.ceil(duration / FADE_INTERVAL_MS));
      let step = 0;

      const timer = window.setInterval(() => {
        if (token !== transitionId) {
          window.clearInterval(timer);
          resolve(false);
          return;
        }

        step += 1;
        const progress = Math.min(1, step / steps);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress >= 1) {
          window.clearInterval(timer);
          resolve(true);
        }
      }, FADE_INTERVAL_MS);
    });
  }

  async function safelyPlay(audio) {
    try {
      await audio.play();
      return true;
    } catch (error) {
      return false;
    }
  }

  async function playMusic(track) {
    if (!musicTracks[track]) return;

    desiredTrack = track;
    const token = transitionId + 1;
    transitionId = token;

    if (activeTrack === track && activeAudio) {
      pauseOtherTracks(activeAudio);
      const didPlay = await safelyPlay(activeAudio);
      if (!didPlay || token !== transitionId) return;
      await fadeVolume(activeAudio, MUSIC_VOLUME, getFadeInDuration(track), token);
      return;
    }

    if (activeAudio) {
      const didFadeOut = await fadeVolume(activeAudio, 0, FADE_OUT_MS, token);
      if (!didFadeOut || token !== transitionId) return;
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }

    if (token !== transitionId) return;

    activeTrack = track;
    activeAudio = getAudio(track);
    activeAudio.currentTime = 0;
    activeAudio.volume = 0;
    pauseOtherTracks(activeAudio);

    const didPlay = await safelyPlay(activeAudio);
    if (!didPlay || token !== transitionId) return;

    await fadeVolume(activeAudio, MUSIC_VOLUME, getFadeInDuration(track), token);
  }

  function getFadeInDuration(track) {
    return track === "menu" ? MENU_START_FADE_IN_MS : FADE_IN_MS;
  }

  function resumeDesiredMusic() {
    playMusic(desiredTrack);
  }

  function initializeBackgroundMusic() {
    preloadMusic();
    preloadSfx();
    playMusic("menu");
    bindUnlockEvents();
  }

  function bindUnlockEvents() {
    if (unlockEventsBound) return;
    unlockEventsBound = true;
    window.addEventListener("pointerdown", resumeDesiredMusic, { passive: true });
    window.addEventListener("keydown", resumeDesiredMusic);
    window.addEventListener("touchstart", resumeDesiredMusic, { passive: true });
  }

  function playMenuMusic() {
    playMusic("menu");
  }

  function playThemeMusic(theme) {
    playMusic(theme);
  }

  function playSfx(sfx) {
    if (!sfxTracks[sfx]) return;

    const sfxPool = getSfxPool(sfx);
    const audio = sfxPool.pool[sfxPool.index];
    sfxPool.index = (sfxPool.index + 1) % sfxPool.pool.length;
    audio.currentTime = 0;
    audio.volume = getSfxVolume(sfx);
    safelyPlay(audio);
  }

  function getBackgroundMusicState() {
    return {
      activeTrack,
      desiredTrack,
      activePaused: activeAudio ? activeAudio.paused : true,
      activeVolume: activeAudio ? Number(activeAudio.volume.toFixed(2)) : 0,
      playingTracks: Array.from(trackAudio.entries())
        .filter(([, audio]) => !audio.paused)
        .map(([track]) => track)
    };
  }

  Object.assign(ntp, {
    initializeBackgroundMusic,
    playMenuMusic,
    playThemeMusic,
    playSfx,
    resumeDesiredMusic,
    getBackgroundMusicState
  });
})();
