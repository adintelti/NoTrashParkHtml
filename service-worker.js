const CACHE_NAME = "ntp-static-v2.1.6";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles/base.css",
  "./styles/menu.css",
  "./styles/game-layout.css",
  "./styles/gamepad-hints.css",
  "./styles/board.css",
  "./styles/entities.css",
  "./styles/overlays.css",
  "./styles/debug.css",
  "./styles/responsive.css",
  "./game.js",
  "./src/constants.js",
  "./src/data.js",
  "./src/dom.js",
  "./src/state.js",
  "./src/i18n.js",
  "./src/utils.js",
  "./src/board.js",
  "./src/config.js",
  "./src/ui.js",
  "./src/audio.js",
  "./src/gameplay.js",
  "./src/storage.js",
  "./src/save-game.js",
  "./src/input-gamepad.js",
  "./src/events.js",
  "./src/loop.js",
  "./src/debug.js",
  "./src/pwa.js",
  "./manifest.webmanifest",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./sound/bmg/menu.mp3",
  "./sound/bmg/level1-park.mp3",
  "./sound/bmg/level2-water.mp3",
  "./sound/bmg/level3-fire.mp3",
  "./sound/sfx/tap_stone.mp3",
  "./sound/sfx/tail_whip.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || request.headers.has("range")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
