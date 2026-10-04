/* S00 · פתיחה — מוצג פעם אחת. «קדימה!» → הבית.
   מובייל: «S00 · פתיחה». דסקטופ (≥1024): «S00 · דסקטופ · פתיחה» (921:3622) — hero כהה 800 (תבנית Z: לוגו בפינה,
   כותרת, «קדימה!»), טלפון שמריץ את המסע (mockup / טלפון · הדגמה 968:772), ומתחת שלושת הצעדים. */
import { h, reducedMotion } from "../dom.js";
import { set } from "../store.js";
import { navigate } from "../router.js";

/* button / חנות · Google Play (זמני, 974:488) — שחק יוסיף את הקישור כשהאפליקציה תעלה לחנות.
   כל עוד ריק: הכפתור מוצג אבל לא לחיץ (קישור בלי יעד). */
const PLAY_URL = "";

/* חמשת מסכי ההדגמה — יוצאו מהפיגמא (27:85, 23:116, 23:105, 277:95, 861:2851) ב-2x.
   הזמנים והמעברים כמו בפרוטוטייפ: השהיה → מעבר; בלי לולאה (שחק) — נעצר ב«הכנה». */
const DEMO = [
  { src: "assets/demo/1-search.webp", hold: 1800, fade: 350 },
  { src: "assets/demo/2-loading.webp", hold: 1200, fade: 300 },
  { src: "assets/demo/3-results.webp", hold: 2200, fade: 350 },
  { src: "assets/demo/4-recipe.webp", hold: 2000, fade: 300 },
  { src: "assets/demo/5-prep.webp" },
];

/* הטקסטים — מילה במילה מהפיגמא */
const STEPS = [
  { title: "מזין מה שיש", body: "ביצים, בצל, גבינה. וכמה כלים אתה מוכן לשטוף." },
  { title: "מקבל מתכון מתאים", body: "מתכון אחד, ולא מציפים אותך ב-80 מתכונים ש\"עשויים לעניין אותך...\" אתה רוצה לראות עוד מתכונים? בחירה שלך, דפדף הלאה." },
  { title: "אתה מכין, אתה אוכל, יצא טעים? – תלחץ \"יצא לי טוב!\"", body: "והמונה של המתכון הזה עולה באחד." },
];

function phone() {
  const shots = DEMO.map((d, i) => h("img", { class: "phone__shot" + (i === 0 ? " is-on" : ""), src: d.src, alt: "", width: 360, height: 800, loading: i ? "lazy" : "eager", decoding: "async" }));
  const el = h("div", { class: "phone only-desk-block", "aria-hidden": "true" },
    h("div", { class: "phone__body" }, h("div", { class: "phone__screen" }, ...shots)),
    h("span", { class: "phone__btn phone__btn--power" }),
    h("span", { class: "phone__btn phone__btn--vol-up" }),
    h("span", { class: "phone__btn phone__btn--vol-down" }));
  if (reducedMotion() || !matchMedia("(min-width: 1024px)").matches) return el;
  let i = 0;
  const next = () => {
    if (!el.isConnected || i >= DEMO.length - 1) return;
    const { hold, fade } = DEMO[i];
    setTimeout(() => {
      if (!el.isConnected) return;
      shots[i + 1].style.transitionDuration = fade + "ms";
      shots[i + 1].classList.add("is-on");
      setTimeout(() => { shots[i].classList.remove("is-on"); i++; next(); }, fade);
    }, hold);
  };
  requestAnimationFrame(() => requestAnimationFrame(next));   /* מתחיל אחרי שהמסך הוצג */
  return el;
}

function anim() {
  return h("div", { class: "intro__anim", "aria-hidden": "true" }, h("span", {}, "אנימציה", h("br"), "Lottie"));
}

export function renderIntro() {
  const go = () => { set({ introSeen: true }); navigate("/", { replace: true }); };
  const el = h("section", { class: "intro", dataset: { screen: "intro", title: "ברוכים הבאים" } },
    h("div", { class: "intro__hero" },
      h("div", { class: "intro__glow", "aria-hidden": "true" }),
      h("div", { class: "intro__inner" },
        h("img", { class: "intro__logo", src: "assets/logo/logo-full-on-dark.svg", alt: "בננה בפיתה", width: 206, height: 184 }),
        h("h1", { class: "intro__title display-h2" }, "תגיד לנו מה יש לך,", h("br"), "נגיד לך מה לבשל"),
        h("p", { class: "intro__lead ui-body-lg" }, "בלי קניות, בלי תכנון.", h("br"), "רק מה שכבר יש לך במטבח."),
        h("div", { class: "intro__cta" },
          h("button", { class: "btn-primary btn-primary--hero", type: "button", onClick: go }, "קדימה!")),
        h("a", { class: "btn-store only-desk-block", ...(PLAY_URL ? { href: PLAY_URL, target: "_blank", rel: "noopener" } : { "aria-disabled": "true" }) }, "להורדה ב-Google Play"),
        phone())),
    h("section", { class: "intro__steps only-desk-block", "aria-labelledby": "intro-steps-title" },
      h("p", { class: "ui-meta intro__steps-meta" }, "שלוש דקות מהמקרר להחלטה!"),
      h("h2", { class: "display-h2", id: "intro-steps-title" }, "שלושה מסכים, ואתה מבשל!"),
      h("ol", { class: "intro__steps-row" },
        ...STEPS.map((s, i) => h("li", { class: "intro__step" },
          anim(),
          h("span", { class: "ui-meta intro__step-num" }, String(i + 1)),
          h("h3", { class: "intro__step-title" }, s.title),
          h("p", { class: "ui-body-sm intro__step-body" }, s.body))))),
  );
  return el;
}
