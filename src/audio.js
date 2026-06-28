(() => {
  const ntp = window.NTP = window.NTP || {};
  const { dom, musicTracks, sfxTracks, sfxVolumes, t } = ntp;

  const SOUND_STORAGE_KEY = "ntp.soundSettings";
  const MUSIC_VOLUME = 0.42;
  const DEFAULT_SFX_VOLUME = 0.58;
  const SFX_POOL_SIZE = 5;
  const SFX_MIN_INTERVAL_MS = {
    projectileThrow: 45,
    enemyDeath: 70
  };
  const SFX_MAX_OVERLAP = {
    projectileThrow: 4,
    enemyDeath: 3
  };
  const FADE_OUT_MS = 650;
  const FADE_IN_MS = 900;
  const MENU_START_FADE_IN_MS = 220;
  const FADE_INTERVAL_MS = 40;

  const trackAudio = new Map();
  const sfxPools = new Map();
  const sfxBuffers = new Map();
  const sfxLoading = new Map();
  const sfxLoadFailures = new Set();
  const sfxLastPlayedAt = new Map();
  const sfxActiveCounts = new Map();
  const soundSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
    bgmVolume: 1,
    sfxVolume: 1
  };
  let activeAudio;
  let activeTrack = "";
  let desiredTrack = "menu";
  let transitionId = 0;
  let unlockEventsBound = false;
  let audioContext;
  let webAudioUnavailable = false;

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
    return (sfxVolumes?.[sfx] ?? DEFAULT_SFX_VOLUME) * soundSettings.sfxVolume;
  }

  function getBgmVolume() {
    return soundSettings.bgmEnabled ? MUSIC_VOLUME * soundSettings.bgmVolume : 0;
  }

  function preloadSfx() {
    Object.keys(sfxTracks).forEach((sfx) => {
      loadSfxBuffer(sfx);
    });
  }

  function getAudioContext() {
    if (webAudioUnavailable) return undefined;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      webAudioUnavailable = true;
      return undefined;
    }

    if (!audioContext) {
      try {
        audioContext = new AudioContextCtor();
      } catch (error) {
        webAudioUnavailable = true;
      }
    }

    return audioContext;
  }

  function resumeSfxContext() {
    const context = getAudioContext();
    if (!context || context.state !== "suspended") return;
    context.resume().catch(() => {});
  }

  function unlockAudio() {
    resumeDesiredMusic();
    resumeSfxContext();
  }

  function loadSfxBuffer(sfx) {
    if (sfxBuffers.has(sfx)) {
      return Promise.resolve(sfxBuffers.get(sfx));
    }
    if (sfxLoading.has(sfx)) {
      return sfxLoading.get(sfx);
    }
    if (sfxLoadFailures.has(sfx)) {
      return Promise.resolve(undefined);
    }

    const context = getAudioContext();
    if (!context || !window.fetch) {
      return Promise.resolve(undefined);
    }

    const loading = window.fetch(sfxTracks[sfx])
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load SFX: ${sfx}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => decodeSfxAudio(context, arrayBuffer))
      .then((audioBuffer) => {
        sfxBuffers.set(sfx, audioBuffer);
        return audioBuffer;
      })
      .catch(() => {
        sfxLoadFailures.add(sfx);
        return undefined;
      })
      .finally(() => {
        sfxLoading.delete(sfx);
      });

    sfxLoading.set(sfx, loading);
    return loading;
  }

  function decodeSfxAudio(context, arrayBuffer) {
    return new Promise((resolve, reject) => {
      const decodePromise = context.decodeAudioData(arrayBuffer, resolve, reject);
      if (decodePromise?.then) {
        decodePromise.then(resolve).catch(reject);
      }
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

    if (!soundSettings.bgmEnabled || soundSettings.bgmVolume <= 0) {
      stopActiveMusic();
      return;
    }

    const token = transitionId + 1;
    transitionId = token;

    if (activeTrack === track && activeAudio) {
      pauseOtherTracks(activeAudio);
      const didPlay = await safelyPlay(activeAudio);
      if (!didPlay || token !== transitionId) return;
      await fadeVolume(activeAudio, getBgmVolume(), getFadeInDuration(track), token);
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

    await fadeVolume(activeAudio, getBgmVolume(), getFadeInDuration(track), token);
  }

  function stopActiveMusic() {
    transitionId += 1;
    if (!activeAudio) return;
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio.volume = 0;
    activeAudio = undefined;
    activeTrack = "";
  }

  function getFadeInDuration(track) {
    return track === "menu" ? MENU_START_FADE_IN_MS : FADE_IN_MS;
  }

  function resumeDesiredMusic() {
    playMusic(desiredTrack);
  }

  function initializeBackgroundMusic() {
    loadSoundSettings();
    preloadMusic();
    preloadSfx();
    syncSoundControls();
    playMusic("menu");
    bindUnlockEvents();
  }

  function bindUnlockEvents() {
    if (unlockEventsBound) return;
    unlockEventsBound = true;
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
  }

  function playMenuMusic() {
    playMusic("menu");
  }

  function playThemeMusic(theme) {
    playMusic(theme);
  }

  function playSfx(sfx) {
    if (!sfxTracks[sfx] || !soundSettings.sfxEnabled || soundSettings.sfxVolume <= 0) return;
    if (!canPlaySfxNow(sfx)) return;

    const buffer = sfxBuffers.get(sfx);
    if (buffer) {
      playBufferedSfx(sfx, buffer);
      return;
    }

    if (!sfxLoadFailures.has(sfx)) {
      loadSfxBuffer(sfx);
    }

    playHtmlSfx(sfx);
  }

  function canPlaySfxNow(sfx) {
    const now = performance.now();
    const minInterval = SFX_MIN_INTERVAL_MS[sfx] ?? 0;
    const lastPlayed = sfxLastPlayedAt.get(sfx) ?? -Infinity;
    if (now - lastPlayed < minInterval) {
      return false;
    }

    const maxOverlap = SFX_MAX_OVERLAP[sfx] ?? 4;
    if ((sfxActiveCounts.get(sfx) || 0) >= maxOverlap) {
      return false;
    }

    sfxLastPlayedAt.set(sfx, now);
    return true;
  }

  function markSfxActive(sfx, duration) {
    sfxActiveCounts.set(sfx, (sfxActiveCounts.get(sfx) || 0) + 1);
    window.setTimeout(() => {
      const nextCount = Math.max(0, (sfxActiveCounts.get(sfx) || 0) - 1);
      if (nextCount) {
        sfxActiveCounts.set(sfx, nextCount);
      } else {
        sfxActiveCounts.delete(sfx);
      }
    }, Math.ceil(duration * 1000) + 80);
  }

  function playBufferedSfx(sfx, buffer) {
    const context = getAudioContext();
    if (!context) {
      playHtmlSfx(sfx);
      return;
    }

    resumeSfxContext();

    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = getSfxVolume(sfx);
      source.connect(gain);
      gain.connect(context.destination);
      source.start(0);
      markSfxActive(sfx, buffer.duration);
    } catch (error) {
      playHtmlSfx(sfx);
    }
  }

  function playHtmlSfx(sfx) {
    const sfxPool = getSfxPool(sfx);
    const audio = sfxPool.pool[sfxPool.index];
    sfxPool.index = (sfxPool.index + 1) % sfxPool.pool.length;
    audio.currentTime = 0;
    audio.volume = getSfxVolume(sfx);
    safelyPlay(audio);
    markSfxActive(sfx, audio.duration || 0.65);
  }

  function setBgmEnabled(enabled) {
    soundSettings.bgmEnabled = Boolean(enabled);
    saveSoundSettings();
    syncSoundControls();

    if (soundSettings.bgmEnabled) {
      resumeDesiredMusic();
      return;
    }

    stopActiveMusic();
  }

  function setSfxEnabled(enabled) {
    soundSettings.sfxEnabled = Boolean(enabled);
    saveSoundSettings();
    syncSoundControls();
  }

  function setBgmMasterVolume(volume) {
    soundSettings.bgmVolume = clampVolume(volume);
    saveSoundSettings();
    syncSoundControls();

    if (activeAudio && soundSettings.bgmEnabled) {
      activeAudio.volume = getBgmVolume();
    } else if (soundSettings.bgmEnabled && soundSettings.bgmVolume > 0) {
      resumeDesiredMusic();
    }
  }

  function setSfxMasterVolume(volume) {
    soundSettings.sfxVolume = clampVolume(volume);
    saveSoundSettings();
    syncSoundControls();
    sfxPools.forEach((sfxPool, sfx) => {
      sfxPool.pool.forEach((audio) => {
        audio.volume = getSfxVolume(sfx);
      });
    });
  }

  function getSoundSettings() {
    return { ...soundSettings };
  }

  function getSoundToggleButtons(type) {
    return Array.from(document.querySelectorAll(`[data-sound-toggle="${type}"]`));
  }

  function getSoundVolumeInputs(type) {
    return Array.from(document.querySelectorAll(`[data-sound-volume="${type}"]`));
  }

  function getSoundVolumeTexts(type) {
    return Array.from(document.querySelectorAll(`[data-sound-volume-text="${type}"]`));
  }

  function isSoundVolumeInput(el) {
    return Boolean(el?.dataset?.soundVolume);
  }

  function adjustSoundVolumeFromGamepad(input, direction) {
    if (!isSoundVolumeInput(input)) return;

    const step = Number(input.step || 5);
    const currentValue = Number(input.value || 0);
    const directionStep = direction.x || -direction.y;
    if (!directionStep) return;

    const nextValue = Math.max(
      Number(input.min || 0),
      Math.min(Number(input.max || 100), currentValue + directionStep * step)
    );
    input.value = String(nextValue);

    if (input.dataset.soundVolume === "bgm") {
      setBgmMasterVolume(nextValue / 100);
      return;
    }

    setSfxMasterVolume(nextValue / 100);
  }

  function syncSoundControls() {
    getSoundToggleButtons("bgm").forEach((button) => {
      button.classList.toggle("is-active", soundSettings.bgmEnabled);
      button.textContent = `BGM ${t(soundSettings.bgmEnabled ? "sound.on" : "sound.off")}`;
      button.setAttribute("aria-pressed", String(soundSettings.bgmEnabled));
    });
    getSoundToggleButtons("sfx").forEach((button) => {
      button.classList.toggle("is-active", soundSettings.sfxEnabled);
      button.textContent = `SFX ${t(soundSettings.sfxEnabled ? "sound.on" : "sound.off")}`;
      button.setAttribute("aria-pressed", String(soundSettings.sfxEnabled));
    });

    const bgmPercent = Math.round(soundSettings.bgmVolume * 100);
    const sfxPercent = Math.round(soundSettings.sfxVolume * 100);
    getSoundVolumeInputs("bgm").forEach((input) => {
      input.value = String(bgmPercent);
    });
    getSoundVolumeInputs("sfx").forEach((input) => {
      input.value = String(sfxPercent);
    });
    getSoundVolumeTexts("bgm").forEach((text) => {
      text.textContent = `${bgmPercent}%`;
    });
    getSoundVolumeTexts("sfx").forEach((text) => {
      text.textContent = `${sfxPercent}%`;
    });
  }

  function loadSoundSettings() {
    try {
      const savedSettings = JSON.parse(window.localStorage.getItem(SOUND_STORAGE_KEY) || "{}");
      if (typeof savedSettings.bgmEnabled === "boolean") {
        soundSettings.bgmEnabled = savedSettings.bgmEnabled;
      }
      if (typeof savedSettings.sfxEnabled === "boolean") {
        soundSettings.sfxEnabled = savedSettings.sfxEnabled;
      }
      if (Number.isFinite(savedSettings.bgmVolume)) {
        soundSettings.bgmVolume = clampVolume(savedSettings.bgmVolume);
      }
      if (Number.isFinite(savedSettings.sfxVolume)) {
        soundSettings.sfxVolume = clampVolume(savedSettings.sfxVolume);
      }
    } catch (error) {
      // Keep defaults when local storage is unavailable or has stale data.
    }
  }

  function saveSoundSettings() {
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundSettings));
    } catch (error) {
      // Sound still works when local storage is unavailable.
    }
  }

  function clampVolume(volume) {
    return Math.max(0, Math.min(1, Number(volume) || 0));
  }

  function getBackgroundMusicState() {
    return {
      activeTrack,
      desiredTrack,
      activePaused: activeAudio ? activeAudio.paused : true,
      activeVolume: activeAudio ? Number(activeAudio.volume.toFixed(2)) : 0,
      settings: getSoundSettings(),
      sfxEngine: sfxBuffers.size > 0 ? "web-audio" : "html-audio",
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
    setBgmEnabled,
    setSfxEnabled,
    setBgmMasterVolume,
    setSfxMasterVolume,
    getSoundSettings,
    isSoundVolumeInput,
    adjustSoundVolumeFromGamepad,
    resumeDesiredMusic,
    syncSoundControls,
    getBackgroundMusicState
  });
})();
