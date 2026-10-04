/* S03 · דף מתכון — «תבנית המתכונים» (29.09):
   תמונה → שם → שורת מטא קטנה (זמן · מנות −/+) → «מה צריך» — קוביות כלים בלבד (הקונספט המבדל — בולט)
   → לשוניות: מצרכים | הכנה | טיפים
     מצרכים — חלונית, מקובצת («לירוק», «לתיבול», «לסיום»…)
     הכנה — חלונית שלבים: כרטיס אחד בכל פעם, החלקה/חיצים; «לפני שמבשלים משהו» = הכרטיס הראשון;
            רמז החלקה מעל; «המסך לא נכבה בזמן בישול» מתחת (Wake Lock); מעבר לרשימה רציפה.
     «יצא לי טוב!» מופיע רק בשלב האחרון.
   ♥ = שמירה במקום. חזרה ← לאותו כרטיס. */
import { h, announce, reducedMotion } from "../dom.js";
import { icon, toast, header } from "../ui.js";
import { get, isSaved, toggleSaved, markTried } from "../store.js";
import { loadRecipes, getRecipe, ingredientParts } from "../data.js";
import { evaluate, norm, has, toolsFor } from "../match.js";
import { back, navigate } from "../router.js";
import { loadIcons, ingIcon, toolIcon } from "../icons.js";
import { equipmentLabel, timeLabel, photo } from "./results.js";

/* בסיס שיש בכל בית (שחק 02.10): מים, מלח, פלפל שחור, שמן רגיל (קנולה/חמניות — לא זית), סוכר */
const STAPLE = /^(מים|מלח|פלפל שחור|שמן(?! זית)|סוכר)(\s|$)/;

const MIN_SERVINGS = 1, MAX_SERVINGS = 12;

/* «עד ש…» — מצב־יעד, מודגש. כאן ייכנסו האנימציות. */
const firstTarget = (text) => (String(text).match(/עד ש[^,.!;—()]+|עד ל[^,.!;—()]+/) || [""])[0].trim();
function withTargets(text) {
  return String(text).split(/(עד ש[^,.!;—()]+|עד ל[^,.!;—()]+)/).map((p, i) => (i % 2 ? h("span", { class: "until" }, p.trim()) : p));
}

/* המסך לא נכבה בזמן בישול — Wake Lock. עובד ב־https/מותקן; אחרת שקט. */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && "wakeLock" in navigator) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { wakeLock = null; }
}

export async function renderRecipe({ id }) {
  await Promise.all([loadRecipes(), loadIcons()]);
  const r = getRecipe(id) || get().pending.find((p) => p.id === id);
  if (!r) { navigate("/", { replace: true }); return null; }

  const pantry = get().pantry.map(norm);
  const e = evaluate(r, pantry);
  const tools = r.toolsList || [];
  const toolsCount = r.tools ?? toolsFor(r);
  /* ביקורת #1 (30.09) — הכלים מלווים את המתכון: chip / tool = אייקון 16 + שם, כמו בפיגמא */
  /* נגישות (05.10, בדיקת NVDA): הכלים הוקראו צמודים — «מוציאים מראש:מחבתקרשכף עץ». מוסיפים פסיקים ורווח שרק קורא המסך שומע */
  const sr = (t) => h("span", { class: "visually-hidden" }, t);
  const toolChips = (list) => list.map((t, i) => h("span", { class: "toolchip" }, h("span", {}, t, i < list.length - 1 ? sr(", ") : sr(".")), toolIcon(t, 16)));
  const toolRow = (label, list) => h("div", { class: "toolrow" }, h("span", { class: "toolrow__label" }, label, sr(" ")), ...toolChips(list));
  const washRow = h("div", { class: "toolrow toolrow--wash", hidden: true }, h("span", { class: "toolrow__label" }, "בסוף נשאר לשטוף:", sr(" ")), ...toolChips(tools));
  const base = r.servings || 4;
  let servings = base;

  /* ---------- שמירה / «יצא לי טוב!» ---------- */
  const saveBtn = h("button", { class: "round-btn recipe__save", type: "button", "aria-label": "שמירה במתכונים שלי" });
  const ctaBtn = h("button", { class: "btn-primary btn-primary--green", type: "button" }, "יצא לי טוב!");
  /* מצב «בוצע» — כמו בפיגמה (btn / marked (done)): לא כפתור, אישור שקט. */
  const ctaDone = h("p", { class: "btn-primary btn-primary--green is-done", role: "status", hidden: true }, "✓  נהדר! נשמר במתכונים");
  const ctaWrap = h("div", { class: "recipe__cta", hidden: true }, ctaBtn, ctaDone);
  /* חוק «יצא לי טוב!»: מופיע בשלב האחרון רק אם המתכון עוד לא נשמר. אחרי לחיצה — «נהדר!» ל־4 שניות
     (או עד שזזים משלב), ואז הכפתור והמקום שלו נעלמים כאילו לא היו. פעם אחת — אחר כך הלב בכותרת אומר הכול. */
  let doneTimer = 0;
  function paintSaved() {
    const on = isSaved(id);
    saveBtn.replaceChildren(icon(on ? "heartFilled" : "heart"));
    saveBtn.setAttribute("aria-pressed", String(on)); saveBtn.classList.toggle("is-on", on);
  }
  function showCta(atEnd) {                  /* atEnd — בשלב האחרון / ברשימה המלאה */
    washRow.hidden = !(atEnd && tools.length);  /* «בסוף נשאר לשטוף:» — מעל «יצא לי טוב!», גם כשהמתכון כבר שמור */
    clearTimeout(doneTimer); doneTimer = 0;
    ctaWrap.hidden = !(atEnd && !isSaved(id)); ctaBtn.hidden = false; ctaDone.hidden = true;
  }
  function showDone() {
    ctaBtn.hidden = true; ctaDone.hidden = false;
    doneTimer = setTimeout(() => { ctaWrap.hidden = true; }, 4000);
  }
  saveBtn.addEventListener("click", () => {
    const on = toggleSaved(id); paintSaved();
    if (on) { toast("נשמר במתכונים שלי", { link: "#/mine" }); announce("נשמר במתכונים שלי"); } else announce("הוסר מהמתכונים שלי");
  });
  ctaBtn.addEventListener("click", () => {
    if (!isSaved(id)) { toggleSaved(id); markTried(id); paintSaved(); showDone(); toast("נשמר במתכונים שלי", { link: "#/mine" }); announce("נהדר! נשמר במתכונים"); }
  });

  /* ---------- מנות + מצרכים (מקובצים) ---------- */
  /* נגישות (05.10): ב-Tab NVDA אמר רק «פחות מנות / יותר מנות» — בלי כמה מנות יש עכשיו. הכפתורים מתוארים ע״י המספר */
  const servingsVal = h("b", { "aria-live": "polite", id: "servings-val" });
  const ingPanel = h("div", { class: "panel ing-panel" });
  let optOpen = false;
  function paintIngredients() {
    servingsVal.textContent = servings === 1 ? "מנה אחת" : `${servings} מנות`;
    const groups = [];
    /* ביקורת #5 (שחק, 01.10): מצרכי רשות — בקבוצה נפרדת בסוף הרשימה, ופחות בולטים */
    const OPT = "אם יש לך";
    for (const ing of r.ingredients) {
      const g = ing.necessity === "optional" ? OPT : (ing.group || "");
      let slot = groups.find((x) => x.name === g); if (!slot) { slot = { name: g, items: [] }; groups.push(slot); }
      slot.items.push(ing);
    }
    groups.sort((a, b) => (a.name === OPT) - (b.name === OPT));
    const row = (ing) => {
        const have = e.hits.includes(ing.name) || (ing.type === "seasoning" && has(pantry, ing.name));
        const { qty, label, note } = ingredientParts(ing, servings, base);
        const optional = ing.necessity === "optional";
        const text = [qty, label, note].filter(Boolean).join(" ");
        /* שחק (02.10, אפשרות 1): בסיס שיש בכל בית — בלי תווית; תבלינים ושמן זית — «אם יש»; רק מצרך אמיתי — «חסר» */
        const staple = !have && STAPLE.test(norm(ing.name));
        const ifAny = !have && !staple && !optional && ing.type === "seasoning";
        const state = have ? "✓ יש" : staple || optional ? "" : ifAny ? "אם יש" : "חסר";
        return h("li", { class: "ingredients__row" + (have ? " is-have" : "") + (ifAny ? " is-ifany" : ""), "aria-label": (have ? "יש לך: " : staple ? "" : optional ? "לא חובה: " : ifAny ? "אם יש: " : "חסר: ") + text },
          h("span", { class: "ingredients__qty" }, qty),   /* שחק (01.10): הכמות בצד ימין, האייקון צמוד לשם */
          ingIcon(ing.name) || h("span", { class: "ing-icon ing-icon--none", "aria-hidden": "true" }),
          h("span", { class: "ingredients__text" }, label, note && h("span", { class: "ingredients__note" }, " " + note)),
          h("span", { class: "ingredients__state", "aria-hidden": "true" }, state));
    };
    /* רשות — סגור כברירת מחדל: «אם יש לך · N תוספות לשדרוג», הקשה פותחת (שחק אישר, 01.10) */
    ingPanel.replaceChildren(...groups.flatMap((g) => g.name === OPT
      ? [h("details", { class: "ing-optional", open: optOpen || undefined, onToggle: (ev) => { optOpen = ev.target.open; } },
          h("summary", { class: "ing-group ing-group--optional" }, `${OPT} · ${g.items.length === 1 ? "תוספת אחת לשדרוג" : g.items.length + " תוספות לשדרוג"}`, h("span", { class: "ing-optional__chev", "aria-hidden": "true" }, icon("back"))),   /* החץ = icon / חזרה מהפיגמא, מסובב */
          h("ul", { class: "ingredients ingredients--optional" }, ...g.items.map(row)))]
      : [g.name && h("p", { class: "ing-group" }, g.name), h("ul", { class: "ingredients" }, ...g.items.map(row))]));
  }
  const stepServings = (d) => { servings = Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, servings + d)); paintIngredients(); };

  /* ---------- הכנה — חלונית שלבים ---------- */
  /* כרטיסים: [לפני שמבשלים משהו] + שלבים. ההכנה המוקדמת היא הכרטיס הראשון, מובחן, לא חלונית נוספת. */
  const cards = [];
  if (r.prep?.length) cards.push({ kind: "prep", items: r.prep });
  (r.instructions || []).forEach((t, i) => cards.push({ kind: "step", n: i + 1, text: t, tools: (r.stepTools || [])[i] || [] }));
  const nSteps = (r.instructions || []).length;
  let idx = 0, listMode = false;

  const deck = h("div", { class: "deck", role: "region", "aria-roledescription": "שלבי הכנה", "aria-label": "אופן ההכנה" });
  const dots = h("div", { class: "dots", "aria-hidden": "true" });
  const hint = h("p", { class: "deck__hint ui-caption muted" }, "מחליקים ימינה ושמאלה בין השלבים");
  const awake = h("p", { class: "deck__awake ui-caption muted" }, "המסך לא נכבה בזמן בישול");
  const prevBtn = h("button", { class: "deck__arrow deck__arrow--prev", type: "button", "aria-label": "השלב הקודם" }, icon("back"));
  const nextBtn = h("button", { class: "deck__arrow deck__arrow--next", type: "button", "aria-label": "השלב הבא" }, icon("back"));
  const stage = h("div", { class: "deck__stage" });
  const listBox = h("ol", { class: "panel steps", hidden: true });
  const modeBtn = h("button", { class: "mode-toggle", type: "button", "aria-pressed": "false" }, "רשימה מלאה");

  function cardEl(c) {
    if (c.kind === "prep") return h("div", { class: "stepcard stepcard--prep" },
      h("div", { class: "stepcard__top" }, h("span", { class: "stepcard__k" }, "לפני שמבשלים משהו")),
      h("ul", { class: "stepcard__prep" }, ...c.items.map((t) => h("li", {}, ...withTargets(t)))),
      tools.length > 0 && toolRow("מוציאים מראש:", tools));
    const target = (firstTarget(c.text) || "").split(/ ו(?=[^\s])/)[0];   /* «עד שהביצים מחליפות צבע ומתבשלות» → «…צבע», כמו בפיגמא */
    /* כרטיס שלב — לפי card / step בפיגמא (שחק, 01.10): למעלה «שלב n מתוך N» + תגית «עד ש…» (סימן שהשלב נגמר),
       מתחת — הכלים של השלב (שחק: «תעלה את הכלים למעלה»), מקום לאנימציה כשיש «עד ש…», ואז הטקסט. */
    return h("div", { class: "stepcard" },
      h("div", { class: "stepcard__top" },
        h("span", { class: "stepcard__k" }, `שלב ${c.n} מתוך ${nSteps}`),
        target && h("span", { class: "until" }, target)),
      c.tools.length > 0 && h("div", { class: "toolchips", "aria-label": "כלים בשלב הזה" }, ...toolChips(c.tools)),
      target && h("div", { class: "stepcard__anim", "aria-hidden": "true" }, c.anim ? "" : h("span", {}, "אנימציה:", h("br"), target)),
      h("p", { class: "stepcard__text" }, c.text));
  }

  function go(to, dir) {
    if (to < 0 || to >= cards.length) return;
    const old = stage.firstElementChild; idx = to;
    const el = cardEl(cards[idx]);
    if (old && !reducedMotion()) {
      old.classList.add("is-leaving"); el.classList.add(dir > 0 ? "in-next" : "in-prev"); stage.append(el);
      requestAnimationFrame(() => { el.classList.remove("in-next", "in-prev"); old.classList.add(dir > 0 ? "out-prev" : "out-next"); });
      setTimeout(() => old.remove(), 240);
    } else stage.replaceChildren(el);
    dots.replaceChildren(...cards.map((c, i) => h("i", { class: (i === idx ? "on " : "") + (c.kind === "prep" ? "is-prep" : "") })));
    prevBtn.disabled = idx === 0; nextBtn.disabled = idx === cards.length - 1;
    const last = idx === cards.length - 1;
    showCta(last);                                              /* «יצא לי טוב!» — רק בשלב האחרון, רק אם עוד לא נשמר */
    announce(cards[idx].kind === "prep" ? "לפני שמבשלים משהו" : `שלב ${cards[idx].n} מתוך ${nSteps}`);
  }
  prevBtn.addEventListener("click", () => go(idx - 1, -1));
  nextBtn.addEventListener("click", () => go(idx + 1, 1));
  /* החלקה — RTL: החלקה שמאלה = הבא */
  let x0 = null;
  stage.addEventListener("pointerdown", (ev) => { x0 = ev.clientX; });
  stage.addEventListener("pointerup", (ev) => { if (x0 == null) return; const dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  stage.addEventListener("keydown", (ev) => { if (ev.key === "ArrowLeft") go(idx + 1, 1); if (ev.key === "ArrowRight") go(idx - 1, -1); });
  stage.tabIndex = 0;

  modeBtn.addEventListener("click", () => {
    listMode = !listMode;
    modeBtn.setAttribute("aria-pressed", String(listMode)); modeBtn.textContent = listMode ? "שלב אחר שלב" : "רשימה מלאה";
    deck.hidden = listMode; listBox.hidden = !listMode; showCta(listMode || idx === cards.length - 1);
  });
  listBox.append(
    ...(r.prep?.length ? [h("li", { class: "steps__prep" }, h("b", {}, "לפני שמבשלים משהו"), h("ul", {}, ...r.prep.map((t) => h("li", {}, ...withTargets(t)))))] : []),
    ...(r.instructions || []).map((t) => h("li", { class: "steps__item" }, ...withTargets(t))));

  deck.append(hint, h("div", { class: "deck__frame" }, prevBtn, stage, nextBtn), dots, awake);

  /* ---------- לשוניות ---------- */
  const tabs = [["ing", "מצרכים"], ["steps", "הכנה"], ...(r.notes ? [["tips", "טיפים"]] : [])];
  let tab = "ing";
  const tabBar = h("div", { class: "tabs", role: "tablist" });
  const panes = {
    ing: h("div", { role: "tabpanel", id: "pane-ing" }, r.servingsNote && h("p", { class: "ui-caption muted", style: { margin: "0 0 8px" } }, r.servingsNote), ingPanel),
    steps: h("div", { role: "tabpanel", id: "pane-steps" }, deck, listBox, h("div", { class: "steps-foot" }, modeBtn), washRow, ctaWrap),   /* «רשימה מלאה» מתחת, כמו בפיגמא */
    tips: h("div", { role: "tabpanel", id: "pane-tips" }, ...(r.notes ? r.notes.split("\n").filter(Boolean).map((line) => { const m = line.match(/^([^:]{1,14}):\s*/); return h("div", { class: "tipnote" }, h("b", {}, m ? m[1] : "טיפ"), m ? line.slice(m[0].length) : line); }) : [])),
  };
  function paintTabs() {
    tabBar.replaceChildren(...tabs.map(([k, label]) => h("button", { class: "tabs__tab" + (k === tab ? " is-on" : ""), type: "button", role: "tab", "aria-selected": String(k === tab), "aria-controls": "pane-" + k, onClick: () => { tab = k; paintTabs(); keepAwake(k === "steps"); } }, label)));
    for (const k of Object.keys(panes)) panes[k].hidden = k !== tab;
  }

  const el = h("article", { class: "recipe", dataset: { screen: "recipe", title: r.title } },
    /* דסקטופ (S03 · דסקטופ): כותרת עם שם המתכון; במובייל מוסתרת. ה-h1 האמיתי נשאר בגוף (מוסתר ויזואלית בדסקטופ). */
    header({ title: r.title, logo: true, cls: "recipe__header", titleTag: "p" }),
    h("div", { class: "recipe__hero" },
      photo(r) && h("img", { src: photo(r), alt: r.title, onError: (ev) => { ev.target.hidden = true; } }),
      h("button", { class: "round-btn recipe__back", type: "button", "aria-label": "חזרה", onClick: () => back("/results") }, icon("back")),
      saveBtn),
    h("div", { class: "recipe__body" },
      h("h1", { class: "recipe__title" }, r.title),
      r.description && h("p", { class: "ui-body-sm" }, r.description),
      /* מטא — שורה אחת, קטנה: זמן · מנות −/+ */
      h("div", { class: "metarow", role: "group", "aria-label": "פרטי המתכון" },
        h("span", { class: "metarow__item" }, timeLabel(r.prepTimeMinutes) || "—"),
        h("span", { class: "metarow__item metarow__servings", role: "group", "aria-label": "כמה מנות?" },
          h("button", { class: "metarow__step", type: "button", "aria-label": "פחות מנות", "aria-describedby": "servings-val", onClick: () => stepServings(-1) }, "−"),
          servingsVal,
          h("button", { class: "metarow__step", type: "button", "aria-label": "יותר מנות", "aria-describedby": "servings-val", onClick: () => stepServings(1) }, "+"))),
      /* «מה צריך» — הכלים. הקונספט שמבדל אותנו: קוביות, בולט, כלים בלבד. */
      h("h2", { class: "recipe__h2 ui-body-strong" }, toolsCount === 1 ? "מה צריך · כלי אחד לשטוף" : `מה צריך · ${toolsCount} כלים לשטוף`),
      h("div", { class: "toolgrid", "aria-label": "כלים" }, ...tools.map((t) => h("div", { class: "toolgrid__item" }, toolIcon(t, 28), h("span", {}, t)))),
      tabBar, panes.ing, panes.steps, panes.tips,
    ),
  );
  paintSaved(); paintIngredients(); go(0, 1); paintTabs();

  /* כשיוצאים מהמסך — משחררים את נעילת המסך */
  const obs = new MutationObserver(() => { if (!document.contains(el)) { keepAwake(false); obs.disconnect(); } });
  obs.observe(document.getElementById("screen"), { childList: true });
  return el;
}
