/* בננה בפיתה — Service Worker
   בכל עדכון של האתר: להעלות את VERSION. אחרת מבקר קודם נשאר
   תקוע על הגרסה הישנה — זו התקלה מספר אחת בשלב הזה. */
var VERSION = "bp-v1";
var SHELL = ["./", "./index.html", "./app.html", "./styles/tokens.css",
             "./assets/pattern/pattern-tile.svg", "./assets/logo/logo-dark.svg",
             "./assets/logo/logo-full-dark.svg", "./icon-192.png"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.allSettled(SHELL.map(function (u) { return c.add(u); }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; })
                           .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* רשת קודם, מטמון כגיבוי. כך עדכון נראה מיד וגם אופליין עובד. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match("./app.html");
      });
    })
  );
});
