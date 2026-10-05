import { entryOf, findIngredients } from "./lexicon.js";

/* המפרק המקומי — טקסט חופשי → מצרכים + שלבים.
   כללים, לא ניחוש. כשיהיה חיבור ל־Gemini (דרך המתווך) — הוא יחליף את זה, וזה נשאר כגיבוי אופליין. */

const UNITS = ["כוס", "כוסות", "כף", "כפות", "כפית", "כפיות", "גרם", "ג׳", "ג'", "קילו", "ק״ג", "מ״ל", "מ\"ל", "ליטר", "יחידה", "יחידות", "חבילה", "חבילות", "שקית", "שקיות", "קופסה", "קופסאות", "פחית", "בקבוק", "צרור", "שן", "שיני", "פרוסה", "פרוסות", "קורט", "חופן"];
const FRACTION = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
const WORD_NUM = { "חצי": 0.5, "רבע": 0.25, "שליש": 1 / 3, "שלושת רבעי": 0.75, "אחד": 1, "אחת": 1, "שני": 2, "שתי": 2, "שניים": 2, "שתיים": 2, "שלוש": 3, "שלושה": 3, "ארבע": 4, "ארבעה": 4, "חמש": 5, "חמישה": 5, "שש": 6, "שישה": 6 };
const VERBS = /^(ערבב|ערבבי|קצוץ|קצצי|חתוך|חתכי|טגן|טגני|בשל|בשלי|אפה|אפי|הוסף|הוסיפי|הכן|הכיני|חמם|חממי|שים|שימי|סנן|סנני|הגש|הגישי|לוש|רדד|קלף|קלפי|מלא|מלאי|פזר|פזרי|יצוק|כסה|הנח|הניחי|הרתח|הקפץ|מרתיחים|מחממים|מקפיצים|מוסיפים|מערבבים|מפזרים|מגישים|מטגנים|מבשלים|אופים|קוצצים|חותכים|שמים|מכניסים|מוציאים|ממלאים|מסננים|שוטפים|מקציפים|לשים|מרדדים|קולפים|מגררים|יוצקים|מכסים|מניחים|מחכים|ממתינים|מצננים|מורידים|מנמיכים|מגבירים|טוחנים|מועכים|מרסקים|מקפלים|מפרידים|מחלקים|מורחים|מפוררים|מוזגים|להרתיח|לחמם|לערבב|להוסיף|לקצוץ|לחתוך|לטגן|לבשל|לאפות|לשים|לסנן|להגיש|למלא|לפזר|לכסות|להניח|בזמן|אחרי|לפני|כש|אז|ואז|עכשיו|בסוף|בינתיים)\b/;
const PLURAL_VERB = /^מ[א-ת]{2,}ים\s/;   /* «מרתיחים חמש דקות» — רק כשיש עוד מילים */

/* המזווה הבסיסי — מה שכמעט בכל בית. כל השאר = «לא בכל בית». */
export const BASIC = ["ביצה", "ביצים", "בצל", "שום", "עגבני", "מלפפון", "תפוח אדמה", "תפוחי אדמה", "גזר", "לימון", "אורז", "פסטה", "קמח", "סוכר", "מלח", "פלפל", "שמן", "חמאה", "חלב", "גבינה", "לחם", "פיתה", "טונה", "עדשים", "חומוס", "טחינה", "מים", "קטשופ", "מיונז", "חרדל", "פפריקה", "כמון", "כורכום", "אבקת אפייה", "סודה", "חומץ", "דבש", "שיבולת שועל", "קורנפלור", "יוגורט", "שמנת", "בשר טחון", "עוף", "נקניקיה", "תירס", "אפונה", "כרוב", "פטרוזיליה", "כוסברה", "בזיליקום", "פלפל", "רסק", "שוקולד", "קפה", "תה", "וניל", "קינמון", "פירורי לחם", "זיתים"];
export function isBasic(name) {
  const words = String(name).split(/\s+/).map((w) => w.replace(/^[וב]/, ""));   /* «ובצל», «בשום» */
  return BASIC.some((b) => b.includes(" ") ? name.includes(b) : words.some((w) => w === b || (b.length >= 4 && w.startsWith(b)) || (w.length >= 4 && b.startsWith(w) && b.length - w.length <= 2)));
}

export function parseAmount(line) {
  let s = line.trim().replace(/^[-•*·]\s*/, "");
  let amount = null, amountMax = null, unit = null;
  const m = s.match(/^(~|כ-?|בערך\s)?\s*(\d+(?:[.,]\d+)?|[½¼¾⅓⅔])(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*([½¼¾⅓⅔])?\s*/);
  if (m) {
    const n = (x) => (x == null ? null : FRACTION[x] ?? parseFloat(x.replace(",", ".")));
    amount = n(m[2]); if (m[4]) amount += FRACTION[m[4]]; if (m[3]) amountMax = n(m[3]);
    s = s.slice(m[0].length);
  } else {
    for (const [w, v] of Object.entries(WORD_NUM)) if (s.startsWith(w + " ")) { amount = v; s = s.slice(w.length + 1); break; }
  }
  const um = s.match(new RegExp("^(" + UNITS.join("|") + ")\\s+(של\\s+)?"));
  if (um) { unit = um[1]; s = s.slice(um[0].length); }
  else if (amount != null) unit = "יחידות";
  return { amount, amountMax, unit, name: s.trim() };
}

function isIngredientLine(line) {
  const t = line.trim();
  if (!t || t.length > 70) return false;
  if (/^(\d|[½¼¾⅓⅔]|חצי |רבע |שליש |כ-|~|בערך)/.test(t)) return true;
  if (new RegExp("^(" + UNITS.join("|") + ")\\s").test(t)) return true;
  if (VERBS.test(t)) return false;
  const words = t.split(/\s+/);
  /* «שמים שתי פרוסות לחם», «לוקחים…», «מוציאים לצלחת» — פועל בגוף רבים בתחילת השורה = שלב (שחק 05.10).
     אבל «פלפלים אדומים», «זיתים ירוקים» — מצרך: המילה הראשונה מוכרת כמצרך */
  if (words.length >= 2 && /^[א-ת]{2,}ים$/.test(words[0]) && !isBasic(words[0]) && !entryOf(words[0])) return false;
  if (words.length > 2 && PLURAL_VERB.test(t)) return false;
  if (/ או /.test(t) && words.length <= 8 && !/[.!?]$/.test(t)) return true;   /* «שום כתוש או אבקת שום» — חלופה, לא שלב */
  return words.length <= 4 && !/[.!?]$/.test(t);
}

/* כותרות של חלקים — גם עם תוכן באותה שורה («מצרכים: 4 ביצים, 2 עגבניות») */
const HEAD_ING = /^(מצרכים|רכיבים|חומרים|מה צריך|מה צריך להכין)\s*(?:[:\-–]\s*|$)(.*)$/;
const HEAD_STEPS = /^(אופן ה?הכנה|דרך ה?הכנה|הוראות(?: ה?הכנה)?|ה?הכנה|שלבים|שלבי ה?הכנה)\s*(?:[:\-–]\s*|$)(.*)$/;
const NUMBERED = /^\d{1,2}\s*[.)]\s+/;   /* «1. מטגנים…» — מספור של שלב, לא כמות */
const splitList = (t) => t.split(/[,،]\s*/).map((x) => x.trim()).filter((x) => x && x.length <= 40);

export function parseRecipe(text) {
  const lines = String(text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let title = null, mode = null;   /* mode: null (מנחשים) · "ing" (אחרי «מצרכים») · "steps" (אחרי «אופן הכנה») */
  const ingredients = [], steps = [];
  const addIng = (t) => { const i = parseAmount(t); if (i.name) ingredients.push(i); };
  for (const raw of lines) {
    let line = raw;
    const hi = line.match(HEAD_ING), hs = !hi && line.match(HEAD_STEPS);
    if (hi) { mode = "ing"; const rest = hi[2].trim(); if (rest) (splitList(rest).length >= 2 ? splitList(rest) : [rest]).forEach(addIng); continue; }
    if (hs) { mode = "steps"; const rest = hs[2].trim(); if (rest) steps.push(rest.replace(NUMBERED, "")); continue; }
    /* השורה הראשונה = שם המנה, אם אין בה כמות ויש עוד שורות אחריה */
    if (!title && mode === null && ingredients.length === 0 && steps.length === 0 && lines.length >= 3 && line.length <= 40 && !NUMBERED.test(line) && !/^(\d|[½¼¾⅓⅔]|חצי |רבע |כ-|~)/.test(line) && !new RegExp("^(" + UNITS.join("|") + ")\\s").test(line)) { title = line.replace(/:$/, ""); continue; }
    if (mode === "steps") { steps.push(line.replace(NUMBERED, "")); continue; }
    const numbered = NUMBERED.test(line);
    if (numbered) line = line.replace(NUMBERED, "");
    if (mode === "ing") {
      /* בחלק המצרכים — מצרך, אלא אם זה בבירור משפט של הכנה */
      if (VERBS.test(line) || line.length > 70) { steps.push(line); continue; }
      (splitList(line).length >= 3 ? splitList(line) : [line]).forEach(addIng); continue;
    }
    /* בלי כותרות: שורה ממוספרת = שלב; שורה עם 3 פריטים ומעלה בפסיקים = רשימת מצרכים */
    if (numbered) { steps.push(line); continue; }
    if (splitList(line).length >= 3 && !VERBS.test(line) && !/[.!?]$/.test(line)) { splitList(line).forEach(addIng); continue; }
    if (isIngredientLine(line)) addIng(line);
    else steps.push(line);
  }
  /* שורה אחת עם פסיקים = רשימת מצרכים */
  if (ingredients.length < 2 && lines.length <= 2) {
    const parts = lines.join(" ").split(/[,،]\s*/).map((p) => p.trim()).filter((p) => p && p.length <= 40);
    if (parts.length >= 3) { ingredients.length = 0; steps.length = 0; parts.forEach(addIng); }
  }
  /* אין רשימת מצרכים — המתכון כתוב כפסקה. מחפשים את המצרכים בתוך השלבים, מול המאגר */
  if (ingredients.length < 2) {
    const found = findIngredients(steps.join("\n"));
    if (found.length >= 2) {
      ingredients.length = 0;
      for (const f of found) {
        const a = parseAmount(f.phrase);   /* «שתי פרוסות לחם» → 2 פרוסות */
        const ok = a.amount != null && entryOf(a.name) === f.entry;
        ingredients.push({ name: f.entry.name, amount: ok ? a.amount : null, amountMax: ok ? a.amountMax : null, unit: ok ? a.unit : null, necessity: f.optional ? "optional" : "required" });
      }
    }
  }
  return { title, ingredients, steps, ok: ingredients.length >= 2 };
}

export function formatAmount(ing) {
  if (ing.amount == null) return ing.unit && ing.unit !== "יחידות" ? ing.unit : null;
  const f = (x) => (Number.isInteger(x) ? String(x) : (Object.entries(FRACTION).find(([, v]) => Math.abs(v - (x % 1)) < 0.02) || [String(x)])[0].replace(/^/, x >= 1 ? Math.floor(x) : ""));
  const range = ing.amountMax != null ? `${f(ing.amount)}–${f(ing.amountMax)}` : f(ing.amount);
  return ing.unit && ing.unit !== "יחידות" ? `${range} ${ing.unit}` : range;
}

/* ── הבנת השלבים (02.10, החלטות 30.09) — כלים לכל שלב, טיפים, «לפני שמבשלים», ושאלות הבהרה.
   כללים בלבד: מזיזים ומפצלים, לא מנסחים מחדש את המילים של המזין. ── */

/* 25 הכלים (השם = האייקון ב-TOOL_SVGS) ומה שמזהה אותם בשלב. כף/כפית לא נספרות (רק בשורת השטיפה). */
const TOOL_WORDS = [
  ["מחבת", /מחבת|מטגנ|לטגן|מקפיצ|להקפיץ/], ["סיר", /סיר|מרתיח|להרתיח|רותחים/], ["קערה", /קערה|קערת|קעריות/],
  ["תבנית", /תבנית|בתנור|לתנור|אופים|לאפות/], ["מסננת", /מסננת|מסננים|לסנן/], ["קרש", /קרש|קוצצ|לקצוץ|חותכ|לחתוך/],
  ["כף עץ", /כף עץ/], ["בלנדר מוט", /בלנדר (מוט|יד)/], ["בלנדר", /בלנדר(?! (מוט|יד))/], ["מעבד מזון", /מעבד מזון/],
  ["מטרפה", /מטרפה|מקציפ|טורפים|לטרוף/], ["מרית", /מרית/], ["מצקת", /מצקת/], ["מלקחיים", /מלקחיים/],
  ["פומפייה", /פומפייה|מגרר|לגרר/], ["מקלף", /מקלף|קולפ|לקלף/], ["מועך", /מועך|מועכים|למעוך/],
  ["מסחטת לימון", /מסחטת|סוחט|לסחוט/], ["מיקסר", /מיקסר/], ["מערוך", /מערוך|מרדד|לרדד/],
  ["כוס מדידה", /כוס מדידה/], ["טוסטר לחיצה", /טוסטר/], ["צלחת", /צלחת/], ["מזלג", /מזלג/], ["סכין", /סכין/],
];
export const ALL_TOOLS = TOOL_WORDS.map(([t]) => t);
export const toolsInStep = (s) => TOOL_WORDS.filter(([, re]) => re.test(s)).map(([t]) => t);

const TIP = /^(טיפ( זהב)?|למשדרגים|שימו לב)\s*:|יוצא (ממש |הכי |יותר )?טוב אם|^(כדאי|עדיף) /;   /* משפט שלם = טיפ רק עם סימן ברור; «אפשר גם» באמצע שלב — לא */
const PREP = /^לפני ש|מראש|להשרות|משרים|להפשיר|מפשירים|לילה קודם/;
const VAGUE = /על האש|מבשלים|לבשל(?! במים)/;   /* חום — אבל לא כתוב במה */

const sentences = (s) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);

export function understandSteps(rawSteps) {
  const steps = [], tips = [], prep = [];
  for (const raw of rawSteps) {
    let keep = [];
    for (let sen of sentences(raw)) {
      /* סוגריים עם עצה → טיפ, והסוגריים יוצאים מהשלב */
      sen = sen.replace(/\s*\(([^)]{6,})\)/g, (m, inner) => (TIP.test(inner) || /אפשר|כדאי|עדיף/.test(inner) ? (tips.push(inner.trim()), "") : m));
      if (TIP.test(sen)) tips.push(sen);
      else if (PREP.test(sen) && !steps.length && !keep.length) prep.push(sen);
      else keep.push(sen);
    }
    if (keep.length) steps.push(keep.join(" "));
  }
  const stepTools = steps.map(toolsInStep);
  /* שאלת הבהרה: יש חום, אין כלי — אחת לכל שלב כזה */
  const questions = [];
  steps.forEach((s, i) => {
    const m = s.match(/על האש/) || s.match(VAGUE);
    if (m && !stepTools[i].some((t) => t === "סיר" || t === "מחבת" || t === "תבנית"))
      questions.push({ step: i, text: `בשלב ${i + 1} כתבת «${m[0]}». במה מבשלים?`, options: ["סיר", "מחבת"] });
  });
  return { steps, tips, prep, stepTools, questions };
}

export function toolsList(stepTools) {
  return [...new Set(stepTools.flat())];
}
