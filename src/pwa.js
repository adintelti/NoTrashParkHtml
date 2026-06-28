(() => {
  const ntp = window.NTP = window.NTP || {};

  function canRegisterServiceWorker() {
    return "serviceWorker" in navigator
      && (window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname));
  }

  function registerServiceWorker() {
    if (!canRegisterServiceWorker()) {
      ntp.debugLog?.("system", "Service worker skipped", {
        secureContext: window.isSecureContext,
        host: window.location.hostname
      });
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .then((registration) => {
          ntp.debugLog?.("system", "Service worker registered", {
            scope: registration.scope
          });
        })
        .catch((error) => {
          ntp.debugLog?.("system", "Service worker registration failed", {
            error: error?.message || String(error)
          });
        });
    });
  }

  Object.assign(ntp, {
    registerServiceWorker
  });
})();
