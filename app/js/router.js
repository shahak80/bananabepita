/* ניתוב — hash. «אחורה» של הדפדפן/הטלפון עובד, כל מסך הוא כתובת.
   מסכים נרשמים כ־{ path: "/recipe/:id", render(params, ctx) → Element | Promise<Element> } */

import { $, announce } from "./dom.js";

const routes = [];
let current = null;

export function route(path, render, opts = {}) {
  const keys = [];
  const re = new RegExp("^" + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$");
  routes.push({ path, re, keys, render, opts });
}

export function navigate(path, { replace = false } = {}) {
  const hash = "#" + path;
  if (replace) history.replaceState(null, "", hash); else location.hash = path;
  if (replace) dispatch();
}

export function back(fallback = "/") {
  if (history.length > 1) history.back(); else navigate(fallback, { replace: true });
}

function parse() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path: path.startsWith("/") ? path : "/" + path, query: new URLSearchParams(query) };
}

async function dispatch() {
  const { path, query } = parse();
  const match = routes.find((r) => r.re.test(path));
  if (!match) { navigate("/", { replace: true }); return; }
  const params = {};
  path.match(match.re).slice(1).forEach((v, i) => { params[match.keys[i]] = decodeURIComponent(v); });

  const screen = $("#screen");
  const el = await match.render(params, { query, from: current });
  if (!el) return;
  screen.replaceChildren(el);
  screen.className = "screen " + (el.dataset.screen ? "screen--" + el.dataset.screen : "");
  document.body.dataset.screen = el.dataset.screen || "";

  if (!match.opts.keepScroll) window.scrollTo(0, 0);
  const heading = el.querySelector("h1");
  if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
  else screen.focus({ preventScroll: true });
  if (el.dataset.title) { document.title = el.dataset.title + " · בננה בפיתה"; announce(el.dataset.title); }
  current = path;
}

export function start() {
  window.addEventListener("hashchange", dispatch);
  dispatch();
}

export function currentPath() { return current; }
