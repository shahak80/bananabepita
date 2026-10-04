/* מצב האפליקציה — דבר אחד, נשמר בדפדפן, מודיע על שינויים.
   מה שנשמר: המזווה, המסננים, שמורים, ממתינים לאישור, האם ראו את הפתיחה.
   מה שלא נשמר: תור התוצאות (נבנה מחדש מהמזווה בכל כניסה). */

/* דף התצוגה (viewer.html) פותח את האפליקציה עם ?demo — וזוכר בנפרד, כדי שמצבי ההדגמה
   לא ייכנסו לאפליקציה האמיתית (שחק 03.10: «הסל מגיע מלא — אפליקציה שמישה, לא פרזנטציה»). */
const KEY = new URLSearchParams(location.search).has("demo") ? "bp-demo-v1" : "bp-state-v1";

const DEFAULTS = {
  introSeen: false,
  pantry: [],            // ["ביצים", "בצל", ...] — מנורמל
  maxTime: 60,           // דקות: 10 / 30 / 60 (0 = בלי הגבלה)
  maxTools: 3,           // 1 / 2 / 3 (0 = בלי הגבלה)
  saved: [],             // מזהי מתכונים שנשמרו (♥), לפי סדר השמירה
  pending: [],           // מתכונים שהמשתמש שלח וממתינים לאישור — נשמרים מקומית
  tried: {},             // { recipeId: count } — «יצא לי טוב»
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

const state = load();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* מצב פרטי / אחסון מלא — ממשיכים בזיכרון */ }
}

export function get() { return state; }

export function set(patch) {
  Object.assign(state, patch);
  persist();
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/* --- מזווה --- */
export function addToPantry(item) {
  if (!item || state.pantry.includes(item)) return;
  set({ pantry: [...state.pantry, item] });
}
export function removeFromPantry(item) { set({ pantry: state.pantry.filter((p) => p !== item) }); }
export function togglePantry(item) { state.pantry.includes(item) ? removeFromPantry(item) : addToPantry(item); }

/* --- שמירה (♥) — משנה מצב במקום, לעולם לא מנווטת --- */
export function isSaved(id) { return state.saved.includes(id); }
export function toggleSaved(id) {
  set({ saved: isSaved(id) ? state.saved.filter((x) => x !== id) : [...state.saved, id] });
  return isSaved(id);
}

/* --- «יצא לי טוב» --- */
export function markTried(id) {
  set({ tried: { ...state.tried, [id]: (state.tried[id] || 0) + 1 } });
}

/* --- מתכונים שנשלחו --- */
export function addPending(recipe) { set({ pending: [...state.pending, recipe] }); }
