/* S01 · בית — «אז מה יש׳ך בבית?»
   שדה + המצרכים שלי + נפוצים + זמן + כלים + «מצא לי מתכון». המונה חי. */
import { h } from "../dom.js";
import { header, bottomNav } from "../ui.js";
import { get, set, subscribe, addToPantry, removeFromPantry, togglePantry } from "../store.js";
import { loadRecipes } from "../data.js";
import { search, norm } from "../match.js";
import { navigate } from "../router.js";
import { loadIcons, ingIcon } from "../icons.js";
import { loadLexicon, suggest, canonical } from "../lexicon.js";

/* «מצרכים נפוצים» — במובייל 3 (השאר מוסתרים ב-CSS), בדסקטופ 14 קוביות (פיגמא S01 דסקטופ); רק מה שעוד לא נבחר. במובייל 3 בלבד, רק מה שעוד לא נבחר (כמו בפיגמא; שחק 01.10). השאר — בהקלדה. */
/* בדיוק 14 המצרכים של grid / מצרכים נפוצים בפיגמא, באותו סדר (מימין לשמאל). מה שכבר נבחר — מוסתר (שחק, 02.10) */
const COMMON = ["ביצים", "פיתה", "בצל", "תפוח אדמה", "שום", "מלפפון", "גזר",
  "גבינה", "אורז", "פסטה", "חומוס", "קמח", "חלב", "עגבנייה"];

/* הסדר כמו בפיגמא (שחק, 30.09): הקטן מימין, הגדול משמאל — «לא משנה»/«שעה+» בקצה השמאלי */
const TIME = [{ v: 10, label: "10 דק׳" }, { v: 30, label: "חצי שעה" }, { v: 60, label: "שעה" }, { v: 0, label: "שעה+" }];
const TOOLS = [{ v: 1, label: "1" }, { v: 2, label: "2" }, { v: 3, label: "3" }, { v: 0, label: "לא משנה" }];

function chip(name, { selected, onClick }) {
  return h("button", {
    class: "chip", type: "button",   /* נגישות (05.10): בלי aria-pressed — NVDA הקריא «הסרה: ביצים, כפתור מיתוג, לחוץ». השם כבר אומר מה הכפתור עושה */
    "aria-label": selected ? `הסרה: ${name}` : `הוספה: ${name}`, onClick,
  }, ingIcon(name, 17), name, selected && h("span", { class: "chip__x", "aria-hidden": "true" }, "✕"));   /* כמו בפיגמה: אייקון · טקסט · ✕ */
}

function segmented({ name, options, value, onChange, thin = false }) {
  const i = Math.max(0, options.findIndex((o) => o.v === value));
  const el = h("div", { class: "segmented" + (thin ? " segmented--thin" : ""), role: "radiogroup", "aria-label": name, style: { "--n": options.length, "--i": i } },
    h("div", { class: "segmented__indicator", "aria-hidden": "true" }),
    ...options.map((o) => h("button", {
      class: "segmented__seg", type: "button", role: "radio", "aria-checked": String(o.v === value),
      onClick: () => onChange(o.v),
    }, o.label)),
  );
  return el;
}

export async function renderHome() {
  const recipes = await loadRecipes(); await loadIcons(); await loadLexicon();
  let unsub = null;

  /* ביקורת #3 (שחק: «שניהם», 01.10): רשימה שנפתחת בזמן ההקלדה + השלמה בתוך השדה (מסומנת, אפשר להמשיך להקליד מעליה).
     מה שנשמר — תמיד השם האחיד (canonical). */
  const input = h("input", { type: "search", placeholder: "הקלד/י מצרך...", "aria-label": "הקלד/י מצרך", autocomplete: "off", enterkeyhint: "done",
    role: "combobox", "aria-autocomplete": "both", "aria-expanded": "false", "aria-controls": "ac-list" });
  const acList = h("ul", { class: "ac", id: "ac-list", role: "listbox", "aria-label": "הצעות", hidden: true });
  let items = [], active = -1;
  const add = (name) => { const v = canonical(name); if (v) addToPantry(v); input.value = ""; closeList(); input.focus(); };
  function closeList() { items = []; active = -1; acList.hidden = true; acList.replaceChildren(); input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
  function paintList() {
    acList.replaceChildren(...items.map((name, i) => h("li", { id: "ac-" + i, class: "ac__opt" + (i === active ? " is-active" : ""), role: "option", "aria-selected": String(i === active),
      onPointerdown: (e) => { e.preventDefault(); add(name); } }, ingIcon(name, 17), h("span", {}, name))));
    acList.hidden = !items.length; input.setAttribute("aria-expanded", String(items.length > 0));
    if (active >= 0) input.setAttribute("aria-activedescendant", "ac-" + active); else input.removeAttribute("aria-activedescendant");
  }
  input.addEventListener("input", (e) => {
    const typed = input.value; items = suggest(typed, get().pantry); active = -1; paintList();
    /* השלמה בתוך השדה — רק כשמוסיפים אותיות, ורק כשההצעה הראשונה מתחילה במה שהוקלד */
    const top = items[0];
    if (top && e.inputType && e.inputType.startsWith("insert") && top.startsWith(typed) && top !== typed) {
      input.value = top; input.setSelectionRange(typed.length, top.length);
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && items.length) { e.preventDefault(); active = (active + 1) % items.length; paintList(); }
    else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); active = (active - 1 + items.length) % items.length; paintList(); }
    else if (e.key === "Escape") { if (input.selectionStart !== input.selectionEnd) input.value = input.value.slice(0, input.selectionStart); closeList(); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); add(items[active]); }
  });
  input.addEventListener("blur", () => setTimeout(closeList, 120));
  const form = h("form", { class: "field field--ac", onSubmit: (e) => { e.preventDefault(); add(input.value); } }, input, acList);

  const pantryChips = h("div", { class: "chips" });
  const pantryEmpty = h("p", { class: "pantry__empty" }, "עוד לא הוספת כלום — הקלד/י או בחר/י למטה.");
  const commonChips = h("div", { class: "chips" });
  const counter = h("p", { class: "sticky-bar__count", "aria-live": "polite" });
  const findBtn = h("button", { class: "btn-primary btn-primary--block", type: "button", onClick: () => navigate("/results") }, "מצא לי מתכון");
  let timeSeg, toolsSeg;
  const timeWrap = h("div"), toolsWrap = h("div");

  /* נגישות (05.10, נמצא בבדיקת NVDA): כל שינוי מצייר את הרשימות מחדש, והפוקוס נפל לראש הדף.
     זוכרים איפה היה הפוקוס (באיזו רשימה ובאיזה מקום) ומחזירים אותו לאותו מקום אחרי הציור. */
  function focusSpot() {
    const a = document.activeElement;
    for (const box of [pantryChips, commonChips, timeWrap, toolsWrap]) {
      if (box.contains(a)) { const items = [...box.querySelectorAll("button")]; return { box, i: items.indexOf(a) }; }
    }
    return null;
  }
  function restoreFocus(spot) {
    if (!spot) return;
    const items = [...spot.box.querySelectorAll("button:not(:disabled)")];
    const target = items[Math.min(spot.i, items.length - 1)] || input;   /* הרשימה התרוקנה — חוזרים לשדה ההזנה */
    target.focus();
  }

  function paint() {
    const s = get();
    const spot = focusSpot();
    pantryChips.replaceChildren(...s.pantry.map((p) => chip(p, { selected: true, onClick: () => removeFromPantry(p) })));
    pantryEmpty.hidden = s.pantry.length > 0;
    commonChips.replaceChildren(...COMMON.filter((c) => !s.pantry.includes(c)).slice(0, 14).map((c) => chip(c, { selected: false, onClick: () => togglePantry(c) })));
    timeSeg = segmented({ name: "כמה זמן יש לך?", options: TIME, value: s.maxTime, onChange: (v) => set({ maxTime: v }), thin: true });   /* דק, כמו segmented / time בפיגמא */
    toolsSeg = segmented({ name: "כמה כלים מוכן לשטוף?", options: TOOLS, value: s.maxTools, onChange: (v) => set({ maxTools: v }) });
    timeWrap.replaceChildren(timeSeg); toolsWrap.replaceChildren(toolsSeg);
    const n = s.pantry.length ? search(recipes, s).length : 0;
    counter.textContent = !s.pantry.length ? "" : n === 0 ? "עוד לא מצאנו — נסה/י להוסיף מצרך" : n === 1 ? "מתכון אחד מתאים למה שיש לך" : `${n} מתכונים מתאימים למה שיש לך`;
    findBtn.disabled = s.pantry.length === 0;
    restoreFocus(spot);
  }

  const el = h("div", { dataset: { screen: "home", title: "אז מה יש לך בבית?" }   /* שם הלשונית — גם אותו NVDA מקריא (שחק 05.10) */ },
    header({ title: "אז מה יש׳ך בבית?", spoken: "אז מה יש לך בבית?" }),   /* שחק 05.10: קורא המסך אומר «יש לך», על המסך נשאר «יש׳ך» */
    h("div", { class: "home__content" },
      form,
      h("section", { class: "pantry", "aria-labelledby": "pantry-title" },
        h("h2", { class: "pantry__title", id: "pantry-title" }, "המצרכים שלי"), pantryEmpty, pantryChips),
      /* ביקורת #11 (30.09): הכלים — הקונספט המבדל — מעל הזמן ובולטים ממנו (משטח green/50, מסגרת green/200) */
      /* שחק 05.10: במובייל המסננים ראשונים — אחרי הוספת מצרכים הם «נבלעו» בתחתית ודרשו גלילה. המצרכים הנפוצים בסוף.
         זה גם הסדר בדסקטופ (שם המיקום נקבע ב-grid), אז סדר ה-Tab תואם למראה בשניהם */
      h("section", { class: "section section--tools home__tools" }, h("h2", { class: "section__title" }, "כמה כלים מוכן לשטוף?"), toolsWrap),
      h("section", { class: "section home__time" }, h("h2", { class: "section__title" }, "כמה זמן יש לך?"), timeWrap),
      h("section", { class: "section section--common", "aria-labelledby": "common-title" },
        h("h2", { class: "section__title", id: "common-title" }, "מצרכים נפוצים"), commonChips),
    ),
    h("div", { class: "sticky-bar" }, counter, findBtn),
    bottomNav("home"),
  );

  paint();
  unsub = subscribe(paint);
  /* כשהמסך מוחלף — מפסיקים להאזין */
  const obs = new MutationObserver(() => { if (!document.contains(el)) { unsub(); obs.disconnect(); } });
  obs.observe(document.getElementById("screen"), { childList: true });
  return el;
}
