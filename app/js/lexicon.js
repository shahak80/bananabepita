/* מאגר המצרכים — שם אחיד + השלמה אוטומטית (ביקורת #3, שחק בחר «שניהם», 01.10).
   «ביצה» / «ביצים» → ביצים. «ביצה קשה» — מצרך נפרד. */
import { norm } from "./match.js";

let list = null;
export async function loadLexicon() {
  if (list) return list;
  try { list = (await (await fetch("data/ingredients.json")).json()).ingredients; } catch { list = []; }
  return list;
}

const clean = (s) => norm(s).replace(/^[וה](?=[א-ת]{3,})/, "");   /* «ובצל» → בצל */

/* הרשומה במאגר למה שהוקלד: התאמה מלאה לשם או לכינוי; אחרת null */
export function entryOf(q) {
  const t = norm(q); if (!t || !list) return null;
  for (const w of [t, clean(t)]) {
    const hit = list.find((i) => norm(i.name) === w || i.aliases.some((a) => norm(a) === w));
    if (hit) return hit;
  }
  return null;
}

/* שם אחיד למה שהוקלד: התאמה מלאה לשם או לכינוי; אחרת — מה שהוקלד, כמו שהוא */
export function canonical(q) {
  const t = norm(q);
  return entryOf(q)?.name ?? t;
}

/* הצעות לרשימה: קודם מה שמתחיל במה שהוקלד, אחר כך מה שמכיל. בלי מה שכבר במזווה. */
export function suggest(q, exclude = [], max = 6) {
  const t = norm(q); if (!t || !list) return [];
  const score = (s) => { const n = norm(s); return n.startsWith(t) ? 0 : n.split(" ").some((w) => w.startsWith(t)) ? 1 : n.includes(t) ? 2 : 9; };
  return list
    .filter((i) => !exclude.includes(i.name))
    /* התאמה מדויקת לשם או לכינוי — תמיד ראשונה: «תרד» → עלי תרד (חי), לא «תרד קפוא» (באג שנמצא בבדיקת המסע, 03.10) */
    .map((i) => ({ name: i.name, s: [i.name, ...i.aliases].some((a) => norm(a) === t) ? -1 : Math.min(score(i.name), ...i.aliases.map((a) => score(a) + 0.5)) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || a.name.length - b.name.length)
    .slice(0, max).map((x) => x.name);
}

/* מצרכים בתוך טקסט חופשי (שחק 05.10: «טוסט גבינה» נכתב כפסקה — בלי רשימת מצרכים).
   סורקים צירופים של 3, 2 ומילה אחת מול המאגר (שם + כינויים). מקדימות ו/ה/ב/ל בלבד — לא ש/מ («שמים» ≠ מים).
   «מי שרוצה / אפשר להוסיף / לשדרג / אם יש» במשפט → המצרכים שאחריו במשפט הזה = לא חובה. */
const OPTIONAL_CUE = /(מי שרוצה|אפשר להוסיף|אפשר גם|לשדרג|אם יש|לא חובה|לבחירה|רשות)/;
export function findIngredients(text) {
  if (!list) return [];
  const byName = new Map();
  for (const i of list) for (const a of [i.name, ...i.aliases]) byName.set(norm(a), i);
  const found = [];
  for (const sentence of String(text || "").split(/[.!?\n]+/)) {
    const words = norm(sentence).split(" ").filter(Boolean);
    const cueAt = (() => { const m = sentence.match(OPTIONAL_CUE); return m ? norm(sentence.slice(0, m.index)).split(" ").filter(Boolean).length : Infinity; })();
    for (let i = 0; i < words.length; i++) {
      let hit = null, len = 0;
      for (const n of [3, 2, 1]) {
        if (i + n > words.length) continue;
        const phrase = words.slice(i, i + n).join(" ");
        const stripped = /^[והבל][א-ת]{3,}/.test(phrase) ? phrase.slice(1) : null;
        hit = byName.get(phrase) || (stripped && byName.get(stripped));
        if (hit) { len = n; break; }
      }
      if (!hit) continue;
      if (!found.some((f) => f.entry === hit)) found.push({ entry: hit, phrase: words.slice(Math.max(0, i - 1), i + len).join(" "), optional: i >= cueAt });
      i += len - 1;
    }
  }
  return found;
}
