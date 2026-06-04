(() => {
  const ntp = window.NTP = window.NTP || {};
  const { state, tickMessageTimer, update, updateGamepadInput } = ntp;

  let lastFrame = performance.now();

  function startLoop() {
    requestAnimationFrame(tick);
  }

  function tick(now) {
    const rawDt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    tickMessageTimer(rawDt);
    updateGamepadInput(rawDt);
    update(rawDt * state.speed, rawDt);
    requestAnimationFrame(tick);
  }

  Object.assign(ntp, {
    startLoop
  });
})();
