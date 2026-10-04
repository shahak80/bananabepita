/* S02 · תוצאות — «מצאנו לך משהו!»
   כרטיס אחד בכל פעם, ערימה מאחור. ✕ או גרירה לצד = דילוג (הכרטיס עף באלכסון).
   לחיצה או ♥ = דף המתכון. חזרה מהמתכון מחזירה לאותו כרטיס. */
import { h, svg, announce, reducedMotion } from "../dom.js";
import { header, icon } from "../ui.js";
import { get, set, addToPantry } from "../store.js";
import { loadRecipes } from "../data.js";
import { search, norm, evaluate } from "../match.js";
import { loadIcons, ingIcon } from "../icons.js";
import { entryOf } from "../lexicon.js";
import { navigate } from "../router.js";

/* ✕ ו-♥ של button / action-skip · action-cook — קווי המתאר של הגליפים מהפיגמא (Inter Black 26 / Medium 52), כדי שייראו זהה בכל מכשיר */
const SKIP_X = `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M1.40407 19.9682L7.23377e-05 18.5642L8.52807 9.98419L7.23377e-05 1.40419L1.40407 0.000186682L9.93207 8.58019L18.4081 0.000186682L19.8121 1.40419L11.2841 9.98419L19.8121 18.5642L18.4081 19.9682L9.93207 11.4402L1.40407 19.9682Z"/></svg>`;
const COOK_HEART = `<svg viewBox="0 0 45.5 39.6" fill="currentColor"><path d="M22.7501 39.2218L3.76713 20.2388C2.25293 18.7246 1.24346 16.9642 0.738725 14.9576C0.246301 12.9509 0.252456 10.9566 0.757191 8.97461C1.26193 6.98029 2.26524 5.24449 3.76713 3.76722C5.30596 2.25302 7.06022 1.2497 9.02992 0.75728C11.0119 0.252544 12.9878 0.252544 14.9575 0.75728C16.9395 1.26201 18.6999 2.26533 20.2387 3.76722L22.7501 6.20472L25.2615 3.76722C26.8126 2.26533 28.573 1.26201 30.5427 0.75728C32.5124 0.252544 34.4821 0.252544 36.4518 0.75728C38.4338 1.2497 40.1942 2.25302 41.733 3.76722C43.2349 5.24449 44.2383 6.98029 44.743 8.97461C45.2477 10.9566 45.2477 12.9509 44.743 14.9576C44.2506 16.9642 43.2472 18.7246 41.733 20.2388L22.7501 39.2218Z"/></svg>`;

let cardIndex = 0;        // הכרטיס הנוכחי — נשמר בין מסכים
let queueKey = "";        // המזווה+מסננים שמהם נבנה התור; משתנה → מתחילים מההתחלה

const TIME_LABEL = { 0: "שעה+", 60: "שעה", 30: "חצי שעה", 10: "10 דק׳" };

export function equipmentLabel(r) {
  const eq = (r.equipment || []).map((e) => e.replace(/\s*\(.*?\)\s*/g, "").trim()).filter((e) => /^(תנור|כיריים|מיקרוגל|טוסטר)$/.test(e));
  return eq.length ? eq.join(" ו") : "בלי בישול";
}
export const toolsLabel = (n) => (n === 1 ? "כלי אחד לשטוף" : `${n} כלים לשטוף`);
export const timeLabel = (m) => (m ? `${m} דק׳` : "");
export const photo = (r) => r.image === null ? "" : (r.image || `assets/recipes/${r.id}.jpg`);

export function card(r, e, nextUp, { onOpen, onSkip }) {
  /* נגישות #10 (04.10): הכרטיס כבר לא «כפתור» — היו בתוכו כפתורים («למתכון», «לא טוב לי»), וקורא מסך מתבלבל מכפתור בתוך כפתור.
     לחיצה על הכרטיס עדיין פותחת (עכבר ומגע); במקלדת — הכפתורים עצמם, וגם Enter במסך התוצאות. */
  const el = h("article", { class: "card" },
    h("div", { class: "card__media" },
      h("img", { src: photo(r), alt: "", loading: "eager", onError: (ev) => { ev.target.hidden = true; } }),
      h("div", { class: "card__scrim", "aria-hidden": "true" })),
    h("div", { class: "card__body" },
      h("h2", { class: "card__title" }, r.title),
      h("div", { class: "card__meta" },
        h("span", { class: "pill" }, `${equipmentLabel(r)} · ${toolsLabel(e.tools)}`),
        r.prepTimeMinutes && h("span", { class: "ui-meta muted" }, timeLabel(r.prepTimeMinutes))),
      /* ביקורת #2: יש הכול → שורה אחת. חסר פריט אחד → מה שיש + «חסר לך רק פריט אחד: X» (כמו בפיגמא) */
      e.missing.length === 0 && h("p", { class: "card__have" }, "✓  יש לך הכול"),
      e.missing.length > 0 && h("p", { class: "card__have" }, "✓  יש לך: " + e.hits.slice(0, 4).join(", ") + (e.hits.length > 4 ? "…" : "")),
      e.missing.length === 1 && h("p", { class: "card__miss" }, "✕  חסר לך רק פריט אחד: " + e.missing[0]),
      /* כמו card / recipe בפיגמא: קו · «נטעם ע״י {שם} · {עיר}» · קו · הבאים בתור. התאריך לא מוצג (שחק 02.10). */
      r.author && h("div", { class: "card__divider" }),
      r.author && h("p", { class: "card__taster" }, "נטעם ע״י " + r.author + (r.city ? " · " + r.city : "")),
      nextUp.length > 0 && h("div", { class: "card__divider" }),
      nextUp.length > 0 && h("div", { class: "card__next", "aria-hidden": "true" },   /* נגישות #10: תמונות-קישוט בלבד; קורא מסך יגיע לכרטיסים הבאים עצמם */
        ...nextUp.map((n) => h("span", { class: "card__thumb", style: photo(n) ? { backgroundImage: `url("${photo(n)}")` } : null }))),
      /* דסקטופ (card / recipe · דסקטופ): הכפתורים בתוך הכרטיס — «למתכון» + «לא טוב לי». במובייל מוסתרים (יש ✕/♥ מתחת). */
      h("div", { class: "card__actions" },
        h("button", { class: "card-btn card-btn--open", type: "button", "aria-label": `למתכון: ${r.title}`, onClick: (ev) => { ev.stopPropagation(); onOpen(); } }, icon("heart"), "למתכון"),
        onSkip && h("button", { class: "card-btn card-btn--skip", type: "button", "aria-label": `לא טוב לי: ${r.title}`, onClick: (ev) => { ev.stopPropagation(); onSkip(); } }, icon("thumbsDown"), "לא טוב לי")),
    ),
  );
  el.addEventListener("click", onOpen);
  return el;
}

/* גרירה לצד — עוקב אחרי האצבע, משחרר: או חוזר או עף */
function attachDrag(el, { onFly }) {
  let x0 = 0, y0 = 0, dx = 0, dy = 0, active = false, moved = false;
  const down = (ev) => { if (ev.button || ev.target.closest("button, a, input")) return;   /* מכפתור לא גוררים — אחרת הלכידה גונבת את הלחיצה (באג «לא טוב לי» → נפתח המתכון, שחק 02.10) */
    active = true; moved = false; x0 = ev.clientX; y0 = ev.clientY; dx = dy = 0; el.setPointerCapture(ev.pointerId); el.style.transition = "none"; };
  const move = (ev) => {
    if (!active) return; dx = ev.clientX - x0; dy = ev.clientY - y0;
    if (Math.abs(dx) > 6) moved = true;
    if (!moved) return;
    el.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx / 18}deg)`;
  };
  const up = () => {
    if (!active) return; active = false;
    if (moved) el.dataset.dragged = "1";   // כדי שלחיצה בסוף גרירה לא תפתח — גם כשהכרטיס עף
    if (Math.abs(dx) > 110) { onFly(Math.sign(dx)); return; }
    el.style.transition = ""; el.style.transform = "";
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("click", (ev) => { if (el.dataset.dragged) { ev.stopImmediatePropagation(); delete el.dataset.dragged; } }, true);
}


/* ---------- «לא מצאנו» — 6 תרחישים + 2 שגיאות, לפי state / empty בפיגמא (שחק: «לבנות», 01.10) ---------- */
const NUM_RECIPES = (n) => (n === 1 ? "מתכון אחד" : n === 2 ? "שני מתכונים" : n === 3 ? "שלושה מתכונים" : `${n} מתכונים`);
const NUM_TOOLS = (n) => (n === 1 ? "כלי אחד" : n === 2 ? "שני כלים" : n === 3 ? "שלושה כלים" : `${n} כלים`);
const TIME_WORDS = { 10: "10 דקות", 30: "חצי שעה", 60: "שעה" };
/* «מצרך שפותח הכי הרבה» (שחק בחר ב׳, 03.10 — במקום «מתכון שתמיד אפשר להכין», שלא היה נכון):
   בודקים כל מצרך עיקרי מהמתכונים שעוד אין בסל — אם יתווסף, כמה מתכונים יימצאו. מחזירים את הטוב ביותר. */
function bestAddition(recipes, s) {
  const have = new Set(s.pantry.map(norm));
  const cands = new Set();
  for (const r of recipes) for (const i of r.ingredients) {
    if (i.type === "seasoning" || i.necessity === "optional") continue;
    const e = entryOf(i.name); if (e && !have.has(norm(e.name))) cands.add(e.name);
  }
  let best = null;
  for (const c of cands) {
    const n = search(recipes, { ...s, pantry: [...s.pantry, c] }).length;
    if (n && (!best || n > best.n)) best = { name: c, n };
  }
  return best;
}
/* «יש לך X? הוסיפו» (שחק אישר 04.10): האפליקציה עובדת על מה שיש בבית — הכפתור שואל, לא מניח */
const addAndSearch = (name) => () => { addToPantry(name); navigate("/results", { replace: true }); };

function scenario(recipes, s) {
  const best = bestAddition(recipes, s);
  /* במסכי «זמן קצר» ו«מעט כלים» הכפתור הראשי פותר את הזמן/הכלים (שחק 03.10); הקישור המשני חוזר למצרכים רק כשזה עוזר (04.10) */
  const addBtn = { label: "הוסיפו מצרך", href: "#/" };
  if (s.pantry.length <= 1) return { title: "בואו נתחיל ממשהו אחר",
    body: best ? `עוד מצרך אחד כבר פותח מתכונים. עם ${best.name} יש ${NUM_RECIPES(best.n)}.` : "עם מצרך אחד עוד אין מתכון שמתאים. הוסיפו עוד כמה דברים שיש בבית.",
    btn: best ? { label: `יש לך ${best.name}? הוסיפו`, onClick: addAndSearch(best.name) } : addBtn,
    sec: best ? { text: "או: מצרך אחר", href: "#/" } : null };
  if (s.maxTime) {
    const opts = [30, 60, 0].filter((t) => t === 0 || t > s.maxTime);
    const t = opts.find((t) => search(recipes, { ...s, maxTime: t }).length);
    if (t !== undefined) return { title: `לא מצאנו משהו ל-${TIME_WORDS[s.maxTime]}`,
      /* «, או להוסיף מצרך אחד» — רק כשזה נכון (best מחושב עם הגבלת הזמן). המילים של שחק, מותנות (שחק אישר 04.10) */
      body: `${t ? `אפשר להאריך ל${TIME_WORDS[t]}` : "אפשר לחפש בלי הגבלת זמן"}${best ? ", או להוסיף מצרך אחד" : ""} — ואז נמצא לך משהו.`,
      btn: { label: t ? `האריכו ל${TIME_WORDS[t]}` : "בלי הגבלת זמן", onClick: () => { set({ maxTime: t }); navigate("/results", { replace: true }); } },
      /* שחק (04.10): חזרה לדף המצרכים, הסל נשמר — רק כשמצרך אחד באמת פותח מתכון בזמן הזה (best מחושב עם הגבלת הזמן) */
      sec: best ? { text: "או: מצרך אחר", href: "#/" } : null };
  }
  if (s.maxTools) {
    const found = search(recipes, { ...s, maxTools: 0 });
    if (found.length) {
      const min = Math.min(...found.map((x) => x.e.tools));
      return { title: "כל המתכונים דורשים עוד כלי", body: found.length === 1 ? `מצאנו מתכון אחד, אבל הוא דורש ${NUM_TOOLS(min)} לשטוף.` : `מצאנו ${NUM_RECIPES(found.length)}, אבל הקל שבהם דורש ${NUM_TOOLS(min)} לשטוף.`,
        btn: { label: `אפשרו ${NUM_TOOLS(min)}`, onClick: () => { set({ maxTools: min <= 3 ? min : 0 }); navigate("/results", { replace: true }); } },
        sec: best ? { text: "או: מצרך אחר", href: "#/" } : null };
    }
  }
  /* «שני מצרכים» — גם כאן ההצעה מחושבת (ב׳, שחק 03.10): במקום 3 מצרכי יסוד קבועים */
  if (s.pantry.length === 2) return { title: "שני מצרכים זה קצת מעט",
    body: best ? `עוד מצרך אחד כבר פותח מתכונים. עם ${best.name} יש ${NUM_RECIPES(best.n)}.` : "עם שני מצרכים עוד אין מתכון שמתאים. הוסיפו עוד כמה דברים שיש בבית.",
    btn: best ? { label: `יש לך ${best.name}? הוסיפו`, onClick: addAndSearch(best.name) } : addBtn,
    sec: best ? { text: "או: מצרך אחר", href: "#/" } : null };
  /* המסך הנפוץ: 3 מצרכים ומעלה ואין מתכון — הסיבה היא המצרכים, לא הזמן (שחק בחר א׳, 03.10) */
  return { title: "לא מצאנו מתכון עם מה שיש לך",
    body: best ? `עם ${best.name} יש ${NUM_RECIPES(best.n)}.` : "הוסיפו עוד כמה דברים שיש בבית.",
    btn: best ? { label: `יש לך ${best.name}? הוסיפו`, onClick: addAndSearch(best.name) } : addBtn,
    sec: best ? { text: "או: מצרך אחר", href: "#/" } : null };
}
const ERRORS = {
  offline: { title: "אין חיבור לרשת", body: "לא הצלחנו לחפש. המצרכים שלך נשמרו — אפשר לנסות שוב בעוד רגע." },
  failed: { title: "משהו השתבש אצלנו", body: "החיפוש לא הושלם, וזו לא אשמתך. נסו שוב — ואם זה חוזר, נסו עוד כמה רגעים." },
};
function emptyState(sc, { error = false } = {}) {
  const b = sc.btn;
  /* האנימציה קודם, אחריה החלונית (שחק 03.10) */
  return h("div", { class: "results__empty" },
    h("div", { class: "state-empty__anim", "aria-hidden": "true" }, h("span", {}, "אנימציה", h("br"), "Lottie")),
    h("div", { class: "state-empty" },
      h("h2", { class: "display-h3" }, sc.title),
      h("p", { class: "ui-body-sm muted" }, sc.body),
      b && (b.href ? h("a", { class: "btn-primary", href: b.href }, b.label) : h("button", { class: "btn-primary", type: "button", onClick: b.onClick }, b.label)),
      sc.sec && (sc.sec.href ? h("a", { class: "state-empty__sec", href: sc.sec.href }, sc.sec.text)
        : sc.sec.onClick ? h("button", { class: "state-empty__sec state-empty__sec--btn", type: "button", onClick: sc.sec.onClick }, sc.sec.text)
        : h("p", { class: "state-empty__sec" }, sc.sec.text))),
    !error && h("a", { class: "state-empty__community", href: "#/add/1" }, "יש לכם מתכון מנצח? שתפו עם כולם!"));
}

let keyHandler = null;
addEventListener("keydown", (ev) => keyHandler?.(ev));

/* מצב טעינה — אמיתי, לא מומצא (שחק, 02.10): מופיע רק אם החיפוש לא הסתיים תוך 0.3 שנ׳,
   וכשהופיע — נשאר לפחות 0.4 שנ׳, כדי שלא יהבהב. היום: בפתיחה ראשונה / רשת איטית. עם שרת — מעצמו. */
const SHOW_AFTER = 300, MIN_VISIBLE = 400;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function renderResults() {
  const s = get();
  if (!s.pantry.length) { navigate("/", { replace: true }); return null; }
  const toolsMeta = s.maxTools ? `  ·  ${NUM_TOOLS(s.maxTools)}` : "";
  const meta = `${TIME_LABEL[s.maxTime] || ""}  ·  ${s.pantry.length === 1 ? "מצרך אחד" : s.pantry.length + " מצרכים"}${toolsMeta}`;
  const loading = Promise.all([loadRecipes(), loadIcons()]).then(([r]) => ({ r }), (err) => ({ err }));
  const quick = await Promise.race([loading, wait(SHOW_AFTER).then(() => null)]);
  if (quick) return quick.err ? failedView(meta) : buildResults(quick.r, s, meta);

  const sk = skeletonView(s, meta);
  const shownAt = performance.now();
  loading.then(async (res) => {
    await wait(Math.max(0, MIN_VISIBLE - (performance.now() - shownAt)));
    if (!sk.isConnected) return;   /* המשתמש כבר עבר מסך */
    const el = res.err ? failedView(meta) : buildResults(res.r, s, meta);
    sk.replaceWith(el);
    document.title = el.dataset.title + " · בננה בפיתה"; announce(el.dataset.title);
    const h1 = el.querySelector("h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  });
  return sk;
}

/* שגיאה · אין חיבור / טעינה נכשלה — «נסו שוב» טוען מחדש */
function failedView(meta) {
  const err = { ...ERRORS[navigator.onLine === false ? "offline" : "failed"], btn: { label: "נסו שוב", onClick: () => location.reload() }, sec: { text: "המתכונים ששמרת זמינים גם בלי חיבור", href: "#/mine" } };
  return h("div", { dataset: { screen: "results", title: "לא הצלחנו לחפש" } },
    header({ title: "לא הצלחנו לחפש", logo: false, context: { change: "#/", meta } }), emptyState(err, { error: true }));
}

/* panel / מה בחרת · דסקטופ — בשמאל, קריאה בלבד; «שינוי» מחזיר לבית. במובייל מוסתר (יש שורת הקשר בכותרת). */
const TOOLS_WORDS = { 0: "לא משנה", 1: "כלי אחד", 2: "2 כלים", 3: "3 כלים" };
function chosenPanel(s) {
  return h("aside", { class: "chosen", "aria-label": "מה בחרת" },
    h("div", { class: "chosen__head" }, h("h2", { class: "chosen__title display-h2" }, "מה בחרת"), h("a", { class: "context-row__change", href: "#/" }, "שינוי")),
    h("p", { class: "chosen__label" }, "המצרכים שלי"),
    h("div", { class: "chosen__tags" }, ...s.pantry.map((p) => h("span", { class: "chosen__tag" }, ingIcon(p, 16), p))),
    h("div", { class: "card__divider" }),
    h("p", { class: "chosen__row" }, h("span", {}, "זמן"), h("b", {}, TIME_LABEL[s.maxTime] || "")),
    h("p", { class: "chosen__row" }, h("span", {}, "כלים לשטוף"), h("b", {}, TOOLS_WORDS[s.maxTools] ?? s.maxTools)));
}

/* «S02 · תוצאות — מצב טעינה» (23:116) + «· דסקטופ» (935:3605): card / recipe-skeleton + skeleton-shine */
function skeletonView(s, meta) {
  const bar = (cls) => h("span", { class: "sk-bar " + cls });
  return h("div", { dataset: { screen: "results", title: "מחפשים לך משהו…" }, "aria-busy": "true" },
    header({ title: "מחפשים לך משהו…", logo: false, context: { change: "#/", meta } }),
    h("div", { class: "results__body" },
      h("div", { class: "results__main" },
        h("div", { class: "results__stage" }, h("div", { class: "stack" },
          h("div", { class: "card card--skeleton", "aria-hidden": "true" },
            h("div", { class: "sk-media" }),
            h("div", { class: "sk-body" },
              h("div", { class: "sk-lines" }, bar("sk-bar--title"), bar("sk-bar--l1"), bar("sk-bar--l2"), bar("sk-bar--l3")),
              h("div", { class: "sk-actions" }, bar("sk-bar--pill1"), bar("sk-bar--pill2"))),
            h("div", { class: "sk-shine" })))),
        h("div", { class: "results__actions results__actions--busy", "aria-hidden": "true" },
          h("span", { class: "action action--cook" }, svg(COOK_HEART, { width: 45, height: 39 })),
          h("span", { class: "action action--skip" }, svg(SKIP_X, { width: 20, height: 20 })))),
      chosenPanel(s)));
}

function buildResults(recipes, s, meta) {
  const key = JSON.stringify([s.pantry, s.maxTime, s.maxTools]);
  if (key !== queueKey) { queueKey = key; cardIndex = 0; }
  const queue = search(recipes, s);
  const pantry = s.pantry.map(norm);

  const stack = h("div", { class: "stack" });
  const more = h("p", { class: "results__more ui-meta muted", "aria-live": "polite" });
  const skipBtn = h("button", { class: "action action--skip", type: "button", "aria-label": "דילוג — משהו אחר" }, svg(SKIP_X, { width: 20, height: 20 }));
  const cookBtn = h("button", { class: "action action--cook", type: "button", "aria-label": "פתיחת המתכון" }, svg(COOK_HEART, { width: 45, height: 39 }));

  function paint(pop = true) {
    const rest = queue.length - cardIndex;
    /* נגישות (05.10): «לא טוב לי» מחליף את הכרטיס — הפוקוס היה נופל לראש הדף. זוכרים על איזה כפתור הוא היה ומחזירים לאותו כפתור בכרטיס החדש */
    const focusedBtn = stack.contains(document.activeElement) ? [...document.activeElement.classList].find((k) => k.startsWith("card-btn--")) : null;
    stack.replaceChildren();
    if (rest <= 0) {
      if (!queue.length) { stack.parentElement?.classList.add("results__stage--empty"); stack.replaceWith(emptyState(scenario(recipes, s))); more.textContent = ""; skipBtn.hidden = cookBtn.hidden = true; return; }
      stack.append(h("div", { class: "results__end" },
        h("h2", { class: "display-h2", tabindex: "-1" }, "זהו, עברת על הכול"),
        h("p", { class: "ui-body" }, "אפשר לחזור לכרטיס הראשון, או לשנות את המצרכים."),
        h("button", { class: "btn-primary", type: "button", onClick: () => { cardIndex = 0; paint(); } }, "מההתחלה"),
        h("a", { class: "btn-primary", href: "#/" }, "שינוי המצרכים")));
      more.textContent = ""; skipBtn.hidden = cookBtn.hidden = true;
      if (focusedBtn) stack.querySelector(".results__end h2")?.focus();
      return;
    }
    skipBtn.hidden = cookBtn.hidden = false;
    const cur = queue[cardIndex];
    /* נגישות (05.10, בדיקת NVDA): ב-Tab שומעים רק את הכפתורים — בלי שם המתכון לא ברור על מה מדובר */
    cookBtn.setAttribute("aria-label", `פתיחת המתכון: ${cur.r.title}`);
    skipBtn.setAttribute("aria-label", `דילוג על ${cur.r.title} — משהו אחר`);
    const e = evaluate(cur.r, pantry);
    const nextUp = queue.slice(cardIndex + 1, cardIndex + 5).map((x) => x.r);
    const c = card(cur.r, e, nextUp, { onOpen: () => open(cur.r.id), onSkip: () => fly(-1) });
    if (cardIndex === 0) c.classList.add("card--best");   /* הכרטיס הראשון = ההתאמה הטובה ביותר (שחק בחר א׳, 01.10) */
    attachDrag(c, { onFly: (dir) => fly(dir) });
    /* כמו בפיגמא: קלף מסובב מאחור + הכרטיס הבא עצמו, ישר, 16px למטה */
    if (rest > 1) {
      stack.append(h("div", { class: "ghost ghost--1", "aria-hidden": "true" }));
      const nx = queue[cardIndex + 1];
      const behind = card(nx.r, evaluate(nx.r, pantry), queue.slice(cardIndex + 2, cardIndex + 6).map((x) => x.r), { onOpen: () => {} });
      behind.classList.add("card--behind"); behind.setAttribute("aria-hidden", "true"); behind.removeAttribute("tabindex"); behind.removeAttribute("role"); behind.inert = true;   /* הכרטיס שמאחור — לא נגיש ב-Tab */
      stack.append(behind);
      requestAnimationFrame(() => { const cur = stack.querySelector(".card:not(.card--behind)"); if (cur) behind.style.height = cur.offsetHeight + "px"; });   /* באותו גובה, כדי שהשוליים התחתונים ייראו */
    }
    stack.append(c);
    if (pop && !reducedMotion()) c.classList.add("card--pop");
    if (focusedBtn) c.querySelector("." + focusedBtn)?.focus({ preventScroll: true });
    more.textContent = rest - 1 === 0 ? "זה האחרון שמצאנו" : rest - 1 === 1 ? "עוד מתכון אחד מתאים לך" : `עוד ${rest - 1} מתכונים מתאימים לך`;
  }

  function fly(dir) {
    const c = stack.querySelector(".card:not(.card--behind)"); if (!c) return;
    announce("דילגת");
    if (reducedMotion()) { cardIndex++; paint(false); return; }
    c.style.transition = "transform 450ms ease-in, opacity 450ms ease-in";
    c.style.transform = `translate(${dir * 420}px, 300px) rotate(${dir * 28}deg)`;
    c.style.opacity = "0.3";
    c.addEventListener("transitionend", () => { cardIndex++; paint(); }, { once: true });
  }

  function open(id) {
    const c = stack.querySelector(".card:not(.card--behind)");
    if (c && !reducedMotion()) { c.classList.add("card--expand"); setTimeout(() => navigate("/recipe/" + id), 180); }
    else navigate("/recipe/" + id);
  }

  skipBtn.addEventListener("click", () => fly(-1));
  cookBtn.addEventListener("click", () => { const cur = queue[cardIndex]; if (cur) open(cur.r.id); });

  const side = chosenPanel(s);
  const n = queue.length;
  const titleDesk = n === 1 ? "מצאנו לך מתכון אחד" : `מצאנו לך ${n} מתכונים`;
  const el = h("div", { dataset: { screen: "results", title: "מצאנו לך משהו!" } },
    header({ title: n ? h("span", {}, h("span", { class: "only-mobile" }, "מצאנו לך משהו!"), h("span", { class: "only-desktop" }, titleDesk)) : "חיפשנו בכל המקרר", logo: false, context: { change: "#/", meta } }),
    h("div", { class: "results__body" },
      h("div", { class: "results__main" },
        h("div", { class: "results__stage" }, stack),
        h("div", { class: "results__actions" }, cookBtn, skipBtn),
        more,
        n > 0 && h("p", { class: "kbd-hint" }, "← → דילוג  ·  Enter למתכון")),
      side),
  );
  /* מקלדת (דסקטופ): ← / → דילוג, Enter פתיחה — כמו hint / מקלדת בפיגמא */
  keyHandler = (ev) => {
    if (document.body.dataset.screen !== "results" || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") { if (queue[cardIndex]) { ev.preventDefault(); fly(ev.key === "ArrowLeft" ? -1 : 1); } }
    else if (ev.key === "Enter" && document.activeElement === document.body && queue[cardIndex]) open(queue[cardIndex].r.id);
  };
  paint();
  return el;
}
