(() => {
  const ntp = window.NTP = window.NTP || {};

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function coordKey(x, y) {
    return `${x},${y}`;
  }

  Object.assign(ntp, {
    clamp,
    coordKey
  });
})();
