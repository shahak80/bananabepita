/* S05 · הזנת מתכון — 1 שתי דלתות · 2 ככה הבנתי · 2ב לא הצלחתי · 3 עוד רגע וסיימנו · 4 נשלח
   הדבקה/הקלדה בלבד, בלי מצלמה. כפתורים אומרים תוצאה. בלי השהיות מלאכותיות. */
import { h, announce } from "../dom.js";
import { header, bottomNav, icon } from "../ui.js";
import { addPending } from "../store.js";
import { navigate, back } from "../router.js";
import { parseRecipe, formatAmount, isBasic, understandSteps, toolsList, ALL_TOOLS } from "../parse.js";
import { toolIcon } from "../icons.js";
import { loadLexicon } from "../lexicon.js";

/* הטיוטה — חיה בין המסכים, נמחקת אחרי שליחה */
let draft = null;
const newDraft = () => ({ text: "", title: "", ingredients: [], steps: [], stepTools: [], tools: [], tips: [], prep: [], questions: [], servings: null, minutes: null, toolsCount: null, photo: null, self: false, author: "", city: "" });

function progress(step) {
  /* שלוש גלולות, מתמלאות מימין לשמאל. פעיל = לבן עם צל, כבוי = לבן 35% */
  return h("div", { class: "progress", role: "progressbar", "aria-valuemin": 1, "aria-valuemax": 3, "aria-valuenow": step, "aria-label": `שלב ${step} מתוך 3` },
    [1, 2, 3].map((i) => h("span", { class: "progress__pill" + (i <= step ? " is-on" : "") })));
}

function stickyCta(label, { onClick, disabled = false, href } = {}) {
  const b = h(href ? "a" : "button", { class: "btn-primary entry-cta", type: href ? null : "button", href, onClick, disabled: disabled || null }, label);
  return h("div", { class: "sticky-cta" }, b);
}

/* card / preview · המתכון שלך — דסקטופ בלבד, בשמאל (S05 · דסקטופ בפיגמא). במסך הכתיבה: «ככה זה יעבוד». */
function side(done) {
  const card = (...kids) => h("aside", { class: "entry__side", "aria-label": "המתכון שלך" }, h("p", { class: "ui-meta muted" }, "המתכון שלך"), ...kids);
  if (done) {   /* S05·4 — המתכון שנשלח */
    const n = done.ingredients.length, k = done.instructions.length;
    return card(h("p", { class: "ui-body-strong" }, done.title), h("p", { class: "ui-meta muted" }, `${n} מצרכים · ${k} שלבים`),
      h("div", { class: "entry__side-photo", style: done.image ? { backgroundImage: `url("${done.image}")` } : null, "aria-hidden": "true" }));
  }
  if (!draft || !draft.ingredients.length)
    return card(h("p", { class: "ui-meta" }, "ככה זה יעבוד"),
      h("div", { class: "entry__side-example ui-body-sm" }, ...["פיתה או בגט", "פחית טונה", "פלפלים מתוקים", "פטרוזיליה"].map((t) => h("p", {}, t))),
      h("p", { class: "ui-caption muted" }, "לא צריך כמויות מדויקות. בערך זה מספיק."));
  const n = draft.ingredients.length, k = draft.steps.length;
  return card(h("p", { class: "ui-body-strong" }, draft.title || "מתכון חדש"),
    h("p", { class: "ui-meta muted" }, `${n === 1 ? "מצרך אחד" : n + " מצרכים"} · ${k === 1 ? "שלב אחד" : k + " שלבים"}`),
    h("div", { class: "entry__side-photo", style: draft.photo ? { backgroundImage: `url("${draft.photo}")` } : null, "aria-hidden": "true" }));
}

/* --- 1 · שתי דלתות --- */
export function renderAdd1() {
  if (!draft) draft = newDraft();
  loadLexicon();   /* המאגר נדרש כדי למצוא מצרכים במתכון שנכתב כפסקה (05.10) */
  const ta = h("textarea", { class: "paste-box__input", placeholder: "כתבו את המתכון כאן!", "aria-label": "כתבו את המתכון כאן", rows: 14 });
  ta.value = draft.text;
  const cta = stickyCta("המשך", { onClick: () => { draft.text = ta.value; const p = parseRecipe(draft.text); const u = understandSteps(p.steps);
    Object.assign(draft, { title: p.title || draft.title, ingredients: p.ingredients, steps: u.steps, stepTools: u.stepTools, tools: toolsList(u.stepTools), tips: u.tips, prep: u.prep, questions: u.questions });
    navigate(p.ok ? "/add/2" : "/add/2b"); } });
  const btn = cta.firstChild; btn.disabled = !ta.value.trim();
  ta.addEventListener("input", () => { btn.disabled = !ta.value.trim(); });
  const pasteLink = h("button", { class: "chip", type: "button", onClick: async () => {
    try { const t = await navigator.clipboard.readText(); if (t) { ta.value = (ta.value ? ta.value + "\n" : "") + t; ta.dispatchEvent(new Event("input")); } } catch { ta.focus(); }
  } }, "הדבק קישור");
  return h("div", { dataset: { screen: "add", title: "מתכון חדש" } },
    header({ title: "מתכון חדש", logo: false, closeTo: "/" }), progress(1),
    h("div", { class: "entry__body" },
      h("div", { class: "entry__content" },
      /* «טעמתם?» · בפתיחת ההזנה (נוסח מאושר, חוקי המוצר §2) */
      h("p", { class: "ui-body-sm muted" }, "כאן משתפים רק מתכונים שהכנתם בעצמכם, טעמתם ויצאו לכם טעימים."),
      /* hint / מה לכתוב — מכוונים מראש, שואלים אחר כך רק מה שלא ברור (שחק 02.10) */
      h("div", { class: "entry__hint" },
        h("p", { class: "ui-body-strong" }, "נבין הכי טוב אם תכתבו:"),
        h("ul", {}, ...["מה צריך, וכמה בערך", "איך מכינים, שלב אחרי שלב", "במה מבשלים (סיר, מחבת, תנור…)", "יש טיפ? כתבו גם אותו"].map((t) => h("li", { class: "ui-body-sm" }, t)))),
      h("div", { class: "paste-box" }, ta, h("div", { class: "paste-box__row" }, pasteLink))),
      side(), cta), bottomNav(null));
}

/* --- 2 · ככה הבנתי. תקן אותי. --- */
function amountChip(ing, onChange) {
  const label = formatAmount(ing);
  const chip = h("button", { class: "pchip" + (label ? "" : " pchip--empty"), type: "button", "aria-label": label ? `כמות: ${label} — לחיצה לתיקון` : "הוספת כמות" }, label || "+ כמה?");
  chip.addEventListener("click", () => {
    const input = h("input", { class: "pchip__input", type: "text", value: label || "", placeholder: "למשל: 2 כפות", "aria-label": "כמות" });
    chip.replaceWith(input); input.focus();
    const done = () => { onChange(input.value.trim()); };
    input.addEventListener("blur", done); input.addEventListener("keydown", (e) => { if (e.key === "Enter") input.blur(); });
  });
  return chip;
}

export function renderAdd2() {
  if (!draft || !draft.ingredients.length) { navigate("/add/1", { replace: true }); return null; }
  const specials = draft.ingredients.filter((i) => !isBasic(i.name)).length;
  const showSpecial = specials > 2;   /* «לא בכל בית» — רק כשזה מה שעלול לעכב את המתכון */

  const list = h("div", { class: "entry__list" });
  function paintList() {
    list.replaceChildren(...draft.ingredients.map((ing, idx) => h("div", { class: "ing" },
      h("div", { class: "ing__head" },
        h("p", { class: "ing__name ui-body-sm" }, ing.name),
        h("button", { class: "ing__remove", type: "button", "aria-label": `הסרת ${ing.name}`, onClick: () => { draft.ingredients.splice(idx, 1); paintList(); } }, icon("close", { width: 16, height: 16 }))),
      h("div", { class: "ing__chips" },
        amountChip(ing, (v) => { const p = v ? parseAmountText(v) : {}; Object.assign(ing, { amount: p.amount ?? null, amountMax: p.amountMax ?? null, unit: p.unit ?? null }); paintList(); }),
        showSpecial && !isBasic(ing.name) && h("span", { class: "pchip pchip--special" }, "לא בכל בית"),
        h("button", { class: "pchip pchip--opt" + (ing.necessity === "optional" ? " is-on" : ""), type: "button", "aria-pressed": String(ing.necessity === "optional"),
          onClick: () => { ing.necessity = ing.necessity === "optional" ? "required" : "optional"; paintList(); } }, "לא חייב")))));
  }
  paintList();

  const stepsBox = h("div", { class: "panel steps-preview" });
  let open = false;
  const chips = (list) => list.map((t) => h("span", { class: "toolchip" }, h("span", {}, t), toolIcon(t, 16)));
  function paintSteps() {
    const shown = open ? draft.steps : draft.steps.slice(0, 2);
    stepsBox.replaceChildren(...shown.map((s, i) => h("div", { class: "steps-preview__row" },
        h("p", { class: "ui-meta" }, `${i + 1} · ${s}`),
        (draft.stepTools[i] || []).length > 0 && h("span", { class: "toolchips" }, ...chips(draft.stepTools[i])))),
      draft.steps.length > 2 && h("button", { class: "steps-preview__more", type: "button", onClick: () => { open = !open; paintSteps(); } }, open ? "פחות ▴" : `עוד ${draft.steps.length - 2} שלבים ▾`));
  }

  /* card / שאלת הבהרה — רק מה שלא ברור, אחת בכל פעם. התשובה = כלי, והוא נכנס לשלב ול«מה צריך». */
  const qBox = h("div", { "aria-live": "polite" });
  function paintQuestion() {
    const q = draft.questions[0];
    qBox.replaceChildren(q ? h("div", { class: "qcard", role: "group", "aria-label": "שאלת הבהרה" },
      h("p", { class: "ui-body-strong" }, q.text),
      h("div", { class: "qcard__answers" }, ...q.options.map((t) => h("button", { class: "toolchip toolchip--btn", type: "button", onClick: () => {
        draft.stepTools[q.step] = [...new Set([...(draft.stepTools[q.step] || []), t])];
        if (!draft.tools.includes(t)) draft.tools.push(t);
        draft.questions.shift(); announce("תודה"); paintQuestion(); paintTools(); paintSteps();
      } }, h("span", {}, t), toolIcon(t, 16))))) : "");
  }

  /* «מה צריך» — קוביות הכלים; לחיצה מסירה, «+ להוסיף כלי» פותח את 25 הכלים */
  const toolsHead = h("p", { class: "ui-meta muted" });
  const toolsGrid = h("div", { class: "toolgrid toolgrid--entry" });
  const addRow = h("div", { class: "toolchips", hidden: true });
  const addBtn = h("button", { class: "entry__link", type: "button", "aria-expanded": "false", onClick: () => { addRow.hidden = !addRow.hidden; addBtn.setAttribute("aria-expanded", String(!addRow.hidden)); paintTools(); } }, "+ להוסיף כלי");
  function paintTools() {
    const n = draft.tools.length;
    toolsHead.textContent = n === 1 ? "מה צריך · כלי אחד לשטוף" : `מה צריך · ${n} כלים לשטוף`;
    toolsGrid.replaceChildren(...draft.tools.map((t) => h("button", { class: "toolgrid__item", type: "button", "aria-label": `${t} — לחיצה להסרה`, onClick: () => {
      draft.tools = draft.tools.filter((x) => x !== t); draft.stepTools = draft.stepTools.map((l) => l.filter((x) => x !== t)); paintTools(); paintSteps(); } }, toolIcon(t, 28), h("span", {}, t))));
    addRow.replaceChildren(...ALL_TOOLS.filter((t) => !draft.tools.includes(t)).map((t) => h("button", { class: "toolchip toolchip--btn", type: "button", onClick: () => { draft.tools.push(t); paintTools(); } }, h("span", {}, t), toolIcon(t, 16))));
  }
  paintSteps(); paintQuestion(); paintTools();

  return h("div", { dataset: { screen: "add", title: "הזנת מתכון" } },
    header({ title: "הזנת מתכון", logo: false, backTo: "/add/1" }), progress(2),
    h("div", { class: "entry__body" },
      h("div", { class: "entry__content entry__content--long" },
      h("h2", { class: "display-h2" }, "ככה הבנתי. תקן אותי."),
      h("p", { class: "ui-body-sm muted" }, "כמויות אפשר בערך. \"3–4 כפות\" עדיף על ניחוש מדויק."),
      qBox,
      h("p", { class: "ui-meta muted" }, `מצרכים · ${draft.ingredients.length}`),
      list,
      toolsHead, toolsGrid, addBtn, addRow,
      draft.steps.length > 0 && h("p", { class: "ui-meta muted" }, `הוראות · ${draft.steps.length} שלבים`),
      draft.steps.length > 0 && stepsBox,
      draft.prep.length > 0 && h("p", { class: "ui-meta muted" }, "לפני שמבשלים"),
      ...draft.prep.map((t) => h("p", { class: "ui-body-sm" }, t)),
      draft.tips.length > 0 && h("p", { class: "ui-meta muted" }, `טיפים · ${draft.tips.length}`),
      ...draft.tips.map((t) => { const m = t.match(/^([^:]{1,14}):\s*/); return h("div", { class: "tipnote" }, h("b", {}, m ? m[1] : "טיפ"), m ? t.slice(m[0].length) : t); })),
      side(), stickyCta("המשך", { onClick: () => navigate("/add/3") })), bottomNav(null));
}

function parseAmountText(v) { return parseRecipe(v + " x").ingredients[0] || {}; }

/* --- 2ב · לא הצלחתי לפרק --- */
export function renderAdd2b() {
  if (!draft) { navigate("/add/1", { replace: true }); return null; }
  return h("div", { dataset: { screen: "add", title: "הזנת מתכון" } },
    header({ title: "הזנת מתכון", logo: false, backTo: "/add/1" }), progress(2),
    h("div", { class: "entry__body" },
      h("div", { class: "entry__content entry__content--long" },
      h("h2", { class: "display-h2" }, "לא הצלחתי לפרק את זה."),
      h("p", { class: "ui-body-sm muted" }, "תעזור לי קצת — שים כל מצרך בשורה נפרדת, ואני אמשיך מכאן."),
      h("p", { class: "ui-meta muted" }, "מה שהדבקת"),
      h("div", { class: "panel ui-body-sm quote" }, draft.text.slice(0, 160) + (draft.text.length > 160 ? "…" : "")),
      h("p", { class: "ui-meta muted" }, "ככה זה יעבוד"),
      h("div", { class: "panel ui-body-sm" }, ["שקית שעועית ירוקה", "3 כפות שמן זית", "חצי בקבוק רוטב טריאקי", "שום כתוש"].map((t) => h("p", {}, t))),
      h("p", { class: "ui-meta muted" }, "לא צריך כמויות מדויקות. בערך זה מספיק.")),
      side(), stickyCta("נסה שוב", { onClick: () => navigate("/add/1") })), bottomNav(null));
}

/* --- 3 · עוד רגע וסיימנו --- */
function numField(label, key, { unit = "", min = 1, max = 99 } = {}) {
  const input = h("input", { class: "slot", type: "number", inputmode: "numeric", min, max, "aria-label": label, value: draft[key] ?? "" });
  input.addEventListener("input", () => { draft[key] = input.value ? Number(input.value) : null; draft._touch?.(); });
  return h("label", { class: "field-card" }, h("span", { class: "ui-body" }, label), h("span", { class: "field-card__slot" }, input, unit && h("span", { class: "ui-meta muted" }, unit)));
}

function textField(label, key) {
  const input = h("input", { class: "slot slot--wide", type: "text", "aria-label": `${label} (לא חובה)`, autocomplete: key === "author" ? "given-name" : "address-level2", value: draft[key] || "" });
  input.addEventListener("input", () => { draft[key] = input.value.trim(); });
  return h("label", { class: "field-card field-card--opt" }, h("span", { class: "ui-body" }, label), input);
}

function derived() {
  const names = draft.ingredients.map((i) => i.name).join(" ");
  const chips = [];
  const meat = /בשר|עוף|הודו|דג|טונה|סלמון|נקניק|כבד|טלה|בקר/.test(names);
  const dairy = /חלב|גבינ|חמאה|שמנת|יוגורט|לבנה|קוטג/.test(names);
  const egg = /ביצ/.test(names);
  if (!meat) chips.push("צמחוני");
  if (!meat && !dairy && !egg) chips.push("טבעוני");
  const steps = draft.steps.join(" ");
  if (/תנור|אפ[הו]|אופים/.test(steps)) chips.push("תנור");
  if (/מחבת|סיר|טגן|בשל|מרתיח|כיריים/.test(steps)) chips.push("כיריים");
  return chips;
}

export function renderAdd3() {
  if (!draft || !draft.ingredients.length) { navigate("/add/1", { replace: true }); return null; }
  if (draft.toolsCount == null && draft.tools.length) draft.toolsCount = draft.tools.length;   /* «כמה כלים לשטוף?» — כבר הבנו מהשלבים */
  const cta = stickyCta("פרסמו!", { onClick: publish });
  const btn = cta.firstChild;
  const check = () => { btn.disabled = !(draft.photo && draft.self); };
  draft._touch = check;

  /* תמונה — חובה */
  const file = h("input", { type: "file", accept: "image/*", class: "visually-hidden", id: "photo-input" });
  const slot = h("label", { class: "photo-slot", for: "photo-input" }, draft.photo ? h("img", { src: draft.photo, alt: "התמונה שבחרת" }) : h("span", { class: "photo-slot__plus", "aria-hidden": "true" }, "+"), h("span", { class: "visually-hidden" }, "הוספת תמונה של המנה"));
  /* נגישות #7 (04.10): השדה עצמו בגודל 1px — בפוקוס מקלדת מגלגלים את התיבה שרואים אל מעל הכפתור הדביק «פרסמו!» */
  file.addEventListener("focus", () => { if (file.matches(":focus-visible")) slot.scrollIntoView({ block: "nearest" }); });
  file.addEventListener("change", async () => {
    const f = file.files[0]; if (!f) return;
    draft.photo = await shrink(f, 900);
    slot.replaceChildren(h("img", { src: draft.photo, alt: "התמונה שבחרת" }), h("span", { class: "visually-hidden" }, "החלפת התמונה"));
    check();
  });

  const box = h("span", { class: "checkbox__box", "aria-hidden": "true" }, draft.self ? icon("check", { width: 16, height: 16 }) : null);
  const checkbox = h("button", { class: "checkbox", type: "button", role: "checkbox", "aria-checked": String(draft.self), onClick: () => {
    draft.self = !draft.self; checkbox.setAttribute("aria-checked", String(draft.self)); box.replaceChildren(draft.self ? icon("check", { width: 16, height: 16 }) : ""); check();
  } }, box, h("span", { class: "ui-body" }, "הכנתי את זה בעצמי"));

  const titleInput = h("input", { class: "slot slot--wide", type: "text", "aria-label": "שם המתכון", placeholder: "שם המתכון", value: draft.title || "" });
  titleInput.addEventListener("input", () => { draft.title = titleInput.value; });

  check();
  return h("div", { dataset: { screen: "add", title: "הזנת מתכון" } },
    header({ title: "הזנת מתכון", logo: false, backTo: "/add/2" }), progress(3),
    h("div", { class: "entry__body" },
      h("div", { class: "entry__content entry__content--long" },
      h("h2", { class: "display-h2" }, "עוד רגע וסיימנו"),
      h("p", { class: "ui-body-sm muted" }, "רק כמה דברים קטנים."),
      !draft.title && h("label", { class: "field-card" }, h("span", { class: "ui-body" }, "איך קוראים למנה?"), titleInput),
      h("div", { class: "entry__fields" },   /* row / שדות — בדסקטופ שלושה בשורה */
        numField("לכמה אנשים?", "servings", { max: 20 }),
        numField("כמה זמן בערך?", "minutes", { unit: "דק׳", max: 300 }),
        numField("כמה כלים לשטוף?", "toolsCount", { max: 10 })),
      h("p", { class: "ui-meta muted" }, "מה שכבר הבנתי לבד"),
      h("div", { class: "chips" }, ...derived().map((c) => h("span", { class: "pchip" }, c))),
      h("div", { class: "panel photo-card" },
        h("p", { class: "ui-body-sm" }, "תמונה של המנה שהכנת"),
        h("p", { class: "ui-caption muted" }, "חובה — ככה נדע שהמתכון באמת עובד."),
        slot, file),
      /* «נטעם ע״י» — רשות. התאריך נרשם לבד (שחק 02.10) */
      h("p", { class: "ui-meta muted" }, "נטעם ע״י · לא חובה"),
      h("div", { class: "entry__row" }, textField("שם", "author"), textField("עיר", "city")),
      /* «טעמתם?» · ליד «הכנתי את זה בעצמי» (נוסח מאושר) */
      h("p", { class: "ui-body-sm muted" }, "הכוח של בננה בפיתה הוא אמון: כל מתכון כאן מישהו כבר הכין, טעם ואהב. אולי מישהו יבשל את המתכון שלכם כבר הערב, אז שתפו רק מה שהכנתם בעצמכם ויצא לכם טעים. תודה שאתם שומרים על זה."),
      checkbox),
      side(), cta), bottomNav(null));
}

async function shrink(file, max) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.82);
}

function publish() {
  const d = draft;
  const recipe = {
    id: "mine-" + Date.now().toString(36),
    title: d.title || d.ingredients.slice(0, 2).map((i) => i.name).join(" ו"),
    source: "user", status: "pending", createdAt: new Date().toISOString(),
    author: d.author || null, city: d.city || null, testedAt: new Date().toISOString().slice(0, 10),   /* התאריך — אוטומטי */
    prep: d.prep, notes: d.tips.join("\n"), toolsList: d.tools, stepTools: d.stepTools,
    prepTimeMinutes: d.minutes, servings: d.servings, tools: d.toolsCount ?? d.tools.length,     dietary: derived().filter((c) => c === "צמחוני" || c === "טבעוני"),
    equipment: derived().filter((c) => c === "תנור" || c === "כיריים"),
    ingredients: d.ingredients.map((i) => ({ name: i.name, amount: i.amount ?? null, amountMax: i.amountMax ?? null, unit: i.unit ?? null, type: isBasic(i.name) ? "main" : "special", necessity: i.necessity || "required" })),
    instructions: d.steps, image: d.photo, selfMade: d.self,
  };
  addPending(recipe);
  /* TODO (צנרת): שליחה למתווך → גיליון גוגל. עד אז נשמר מקומית בלבד. */
  draft = null;
  navigate("/add/4?id=" + recipe.id, { replace: true });
}

/* --- 4 · נשלח --- */
export function renderAdd4(_, { query }) {
  const id = query.get("id");
  const r = (JSON.parse(localStorage.getItem("bp-state-v1") || "{}").pending || []).find((p) => p.id === id);
  announce("המתכון נשלח");
  return h("div", { dataset: { screen: "add", title: "המתכון נשלח!" } },
    header({ title: "הזנת מתכון", logo: false }), progress(3),
    h("div", { class: "entry__body" },
      h("div", { class: "entry__content entry__content--center" },
      h("div", { class: "success-mark", "aria-hidden": "true" }, "✓"),
      h("h2", { class: "display-h2" }, "המתכון נשלח!"),
      h("p", { class: "ui-body-sm muted" }, "נבדוק אותו בקרוב. בינתיים הוא כבר ב«המתכונים שלי»."),
      r && h("div", { class: "summary-card" }, h("p", { class: "ui-body-strong" }, r.title), h("span", { class: "status-pending" }, "ממתין לאישור"))),
      side(r), stickyCta("למתכונים שלי", { href: "#/mine" })), bottomNav(null));
}
