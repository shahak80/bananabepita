/* ההתאמה — מה מתאים למה שיש בבית.
   הועבר מהגרסה הקודמת (app.html) — לקסיקון, לא ניחוש. */

/* כלים שנשטפים. תנור, כיריים, מקרר — לא. */
const VESSELS = [
  ["סיר", "סיר"], ["מחבת", "מחבת"], ["ווק", "ווק"],
  ["קערה", "קערה"], ["קערת", "קערה"], ["קעריות", "קערה"],
  ["תבנית", "תבנית"], ["מסננת", "מסננת"], ["בלנדר", "בלנדר"],
  ["מעבד מזון", "מעבד מזון"], ["מערוך", "מערוך"], ["קרש", "קרש חיתוך"],
  ["מטרפה", "מטרפה"], ["כף עץ", "כף"], ["סכין", "סכין"], ["מגרדת", "מגרדת"],
  ["מחית", "כלי מחית"], ["פומפייה", "פומפייה"],
];
const NOT_WASHED = /תנור|כיריים|מקרר|מיקרוגל|גז/;

export function toolsFor(r) {
  if (typeof r.tools === "number") return r.tools;   // מתכון חדש — נספר בהזנה
  const text = (r.instructions || []).join(" ") + " " +
    (r.equipment || []).filter((e) => !NOT_WASHED.test(e)).join(" ");
  const found = new Set();
  for (const [needle, tool] of VESSELS) if (text.includes(needle)) found.add(tool);
  return Math.max(1, found.size);
}

export function norm(s) {
  return String(s || "").replace(/\([^)]*\)/g, " ").replace(/[״"'`.,()]/g, " ").replace(/\s+/g, " ").trim();   /* פירוט בסוגריים — «עלי תרד (חי)» — לא משפיע על ההתאמה */
}

/* האם המצרך נמצא במזווה — כולל «עגבניות» מול «עגבנייה» */
/* מילה שבתוך שם של מוצר אחר: «חומוס» (הממרח) ≠ «גרגירי חומוס» (שחק 02.10) */
export const NOT_INSIDE = { "חומוס": /גרגי?רי חומוס/ };

export function has(pantry, name) {
  const n = norm(name);
  return pantry.some((p) => {
    if (p.length < 2) return false;
    if (NOT_INSIDE[p]?.test(n)) return false;
    if (n.includes(p)) return true;
    return p.length > 3 && n.includes(p.slice(0, -1));
  });
}

/* required שלא נמצא = חסר · swappable = חסר רק אם גם התחליף לא נמצא · optional = לעולם לא חסר */
export function evaluate(r, pantry) {
  const missing = [], hits = [], swaps = [];
  for (const ing of r.ingredients) {
    const name = ing.name;
    if (has(pantry, ing.name)) { if (ing.type !== "seasoning") hits.push(name); continue; }
    if (ing.necessity === "optional" || ing.type === "seasoning") continue;   /* תיבול לא נספר כחסר (FR-2.6) */
    if (ing.necessity === "swappable") {
      if (ing.substitute && has(pantry, ing.substitute)) { hits.push(name); continue; }
      swaps.push(name);
    }
    missing.push(name);
  }
  return { missing, hits, swaps, tools: toolsFor(r) };
}

/* התור (ביקורת #2, שחק בחר ב׳ · 30.09): קודם מתכונים שיש לך בהם הכול, אחריהם בלבד — מתכונים שחסר בהם
   פריט אחד. 2 חסרים ומעלה — לא מוצגים. תיבול לא נחשב חסר. בתוך הזמן והכלים; אז הכי הרבה שיש. */
export const MAX_MISSING = 1;
export function search(recipes, { pantry, maxTools = 0, maxTime = 0, excluded = null }) {
  const p = pantry.map(norm);
  return recipes
    .map((r) => ({ r, e: evaluate(r, p) }))
    .filter((x) => x.e.hits.length > 0 && x.e.missing.length <= MAX_MISSING)
    .filter((x) => !maxTools || x.e.tools <= maxTools)
    .filter((x) => !maxTime || (x.r.prepTimeMinutes || 0) <= maxTime)
    .filter((x) => !excluded || !x.e.missing.includes(excluded))
    .sort((a, b) =>
      (a.e.missing.length - b.e.missing.length) ||
      (b.e.hits.length - a.e.hits.length) ||          /* יותר ממה שיש לך — קודם */
      (a.e.tools - b.e.tools) ||
      ((a.r.prepTimeMinutes || 999) - (b.r.prepTimeMinutes || 999)));
}
