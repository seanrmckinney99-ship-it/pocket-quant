// Pocket Quant — minimal app-shell service worker.
// Purpose: let the PWA launch instantly with something on screen instead of Safari's blank
// "no internet" page if you open it with no signal. It does NOT cache or intercept live data —
// every call to the Worker/Finnhub/Stooq/Yahoo goes straight to the network, always, untouched.
// Bump CACHE_NAME any time you want to force-invalidate the cached shell.

const CACHE_NAME = "pocket-quant-shell-v1";
const SHELL_FILES = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isShell =
    url.origin === location.origin &&
    (url.pathname === "/" || SHELL_FILES.some((f) => url.pathname.endsWith(f.replace("./", "/"))));

  if (!isShell) return; // anything else (the Worker, Finnhub, etc.) — don't touch, just let it hit the network normally

  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
