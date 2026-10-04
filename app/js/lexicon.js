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
