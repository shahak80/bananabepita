/* המאגר — recipes.json. נטען פעם אחת, נשמר בזיכרון. */

let cache = null;

export async function loadRecipes() {
  if (cache) return cache;
  const res = await fetch("data/recipes.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("recipes.json: " + res.status);
  const json = await res.json();
  cache = Array.isArray(json) ? json : json.recipes;
  return cache;
}

export function getRecipe(id) {
  return cache ? cache.find((r) => r.id === id) : undefined;
}

/* כמות לפי מנות — כמות × מנות ÷ מנות־בסיס, מעוגל למידות מטבח.
   כוסות/כפות/כפיות → שברים נפוצים. גרם/מ״ל → עשרות. יחידות → שלמים או חצאים. */
const FRACTIONS = [[0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]];

export function scaleAmount(amount, unit, servings, baseServings) {
  if (amount == null || !baseServings) return null;
  const x = amount * servings / baseServings;
  const u = unit || "";
  if (/גרם|מ״ל|מ"ל|מל/.test(u)) return x >= 100 ? Math.round(x / 10) * 10 : Math.round(x / 5) * 5;
  if (/כוס|כף|כפית/.test(u)) {
    const whole = Math.floor(x);
    const frac = x - whole;
    let best = FRACTIONS[0];
    for (const f of FRACTIONS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
    if (best[0] === 1) return String(whole + 1);
    if (whole === 0 && best[0] === 0) return "מעט";
    return (whole || "") + best[1];
  }
  /* יחידות (30.09): מה שנספר שלם במתכון (4 ביצים, שן שום) — מספר שלם, לפחות 1.
     מה שנכתב כחצי (½ בצל) — נשאר בחצאים, לפחות ½. */
  if (Number.isInteger(amount)) return String(Math.max(1, Math.round(x)));
  return String(Math.max(0.5, Math.round(x * 2) / 2)).replace(".5", "½").replace(/^0½$/, "½");
}

export function formatIngredient(ing, servings, baseServings) {
  if (ing.display && servings === baseServings) return ing.display;
  if (ing.amount == null) return ing.name;
  let amt = scaleAmount(ing.amount, ing.unit, servings, baseServings);
  if (ing.amountMax != null) {
    const max = scaleAmount(ing.amountMax, ing.unit, servings, baseServings);
    if (max !== amt) amt += "–" + max;          /* «1–1 כפות» → «1 כפות» כשהטווח מתכווץ במנות מעטות */
  }
  const unit = ing.unit && ing.unit !== "יחידות" ? " " + ing.unit : "";
  return `${amt}${unit} ${ing.name}`.trim();
}

/* ביקורת #6 (שחק בחר «עמודה», 01.10): שורת מצרך בשלושה חלקים — כמות מודגשת בעמודה משלה · שם · הערה.
   גם מתקן את הבאג הישן: הנוסח (display) לא אבד כשמשנים מנות, כי ההערה שמורה בנפרד. */
export function ingredientParts(ing, servings, baseServings) {
  if (ing.amount == null) return { qty: "", label: ing.display || ing.name, note: "" };
  let amt = scaleAmount(ing.amount, ing.unit, servings, baseServings);
  if (ing.amountMax != null) {
    const max = scaleAmount(ing.amountMax, ing.unit, servings, baseServings);
    if (max !== amt) amt += "–" + max;
  }
  /* שחק (04.10, «לימון: ב»): «1 לימון | מיץ», «חצי לימון | מיץ». countNoun = [יחיד, רבים] — המילה מתחלפת לפי הכמות. */
  if (ing.countNoun) {
    const n = parseFloat(String(amt).split("–").pop().replace("½", ".5"));
    return { qty: `${fractionWords(amt)} ${n > 1 ? ing.countNoun[1] : ing.countNoun[0]}`, label: ing.label || ing.name, note: ing.note || "" };
  }
  const unit = ing.unit && ing.unit !== "יחידות" ? " " + ing.unit : "";
  return { qty: `${fractionWords(amt)}${unit}`, label: ing.label || ing.name, note: ing.note || "" };
}

/* שחק (01.10): שבר שאינו יותר מאחד — במילים. «½ שקית» → «חצי שקית», «¼–½ כוס» → «רבע–חצי כוס». 1½ נשאר כמו שהוא. */
const FRACTION_WORDS = { "½": "חצי", "¼": "רבע", "⅓": "שליש", "⅔": "שני שלישי", "¾": "שלושת רבעי" };
export function fractionWords(amt) {
  return String(amt).split("–").map((p) => FRACTION_WORDS[p] ?? p).join("–");
}
