/* בננה בפיתה — Service Worker
   בכל שחרור: להעלות את VERSION. אחרת מי שכבר התקין נשאר על הגרסה הישנה. */
const VERSION = "bp-2026-10-05-1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./styles/tokens.css", "./styles/app.css",
  "./js/main.js", "./js/router.js", "./js/store.js", "./js/data.js", "./js/match.js", "./js/dom.js",
  "./js/ui.js", "./js/screens/intro.js", "./js/screens/home.js", "./js/screens/results.js", "./js/screens/recipe.js", "./js/screens/mine.js", "./js/screens/add.js", "./js/parse.js", "./js/icons.js", "./js/lexicon.js", "./assets/ingredients/index.json",
  "./data/recipes.json", "./data/ingredients.json",
  "./assets/logo/logo-on-dark.svg", "./assets/logo/logo-on-light.svg", "./assets/logo/logo-full-on-dark.svg", "./assets/logo/logo-wordmark-on-dark.svg",
  "./assets/pattern/pattern-tile@2x.png",
  "./assets/fonts/rubik-hebrew-700-normal.woff2", "./assets/fonts/rubik-latin-700-normal.woff2", "./assets/fonts/rubik-hebrew-900-normal.woff2", "./assets/fonts/rubik-latin-900-normal.woff2", "./assets/fonts/heebo-hebrew-400-normal.woff2", "./assets/fonts/heebo-latin-400-normal.woff2", "./assets/fonts/heebo-hebrew-600-normal.woff2", "./assets/fonts/heebo-latin-600-normal.woff2", "./assets/fonts/heebo-hebrew-700-normal.woff2", "./assets/fonts/heebo-latin-700-normal.woff2",
  "./assets/icons/icon-192.png", "./assets/icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* רשת קודם, מטמון כגיבוי — לכל דבר. כך כל שינוי נראה מיד ברענון אחד,
   ובלי רשת האפליקציה עדיין עולה מהמטמון. (מטמון־קודם דרש שני רענונים לכל עדכון.) */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req))
  );
});
