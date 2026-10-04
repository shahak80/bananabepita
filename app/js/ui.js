/* רכיבים משותפים — header / screen, nav / bottom-bar, אייקונים */
import { h, svg } from "./dom.js";
import { back } from "./router.js";

/* אייקוני ממשק — מיוצאים מהפיגמה (icons / nav (24px), icon / לב · מתאר, icon / סגירה). צבע דרך currentColor.
   plus, check — עדיין לא קיימים בפיגמה (לפי חוק הקומפוננטות: להוסיף כקומפוננטות). */
export const ICONS = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"><path d="M4.46925 9.59821C4.36936 8.74494 4.59393 7.88556 5.09816 7.19C5.60242 6.49443 6.34985 6.01374 7.19191 5.84332C8.03385 5.67303 8.90912 5.82539 9.64406 6.27008C10.3788 6.71477 10.9199 7.41902 11.1597 8.24371C11.2683 8.6173 11.6105 8.87436 11.9995 8.87457C12.3887 8.87457 12.7317 8.61746 12.8403 8.24371C13.0801 7.41901 13.6212 6.71477 14.356 6.27008C15.0909 5.82538 15.9662 5.67302 16.8081 5.84332C17.6502 6.01374 18.3976 6.49443 18.9019 7.19C19.4061 7.88556 19.6307 8.74494 19.5308 9.59821C19.5268 9.6319 19.5249 9.66584 19.5249 9.69977C19.5249 10.8258 19.0845 12.0073 18.3462 13.1851C17.6109 14.3581 16.6155 15.4702 15.5962 16.441C14.58 17.4088 13.56 18.2172 12.7925 18.7838C12.4792 19.015 12.2084 19.2038 11.9995 19.3472C11.7907 19.2039 11.5205 19.0147 11.2075 18.7838C10.44 18.2172 9.42006 17.4088 8.40382 16.441C7.38451 15.4702 6.38913 14.3581 5.65382 13.1851C4.91552 12.0073 4.47511 10.8258 4.47511 9.69977C4.4751 9.66584 4.4732 9.6319 4.46925 9.59821Z"/></svg>`,
  heartFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.3999C12 20.3999 3.59998 15.0999 3.59998 9.69994C3.47456 8.62864 3.75633 7.54932 4.38942 6.67604C5.02251 5.80277 5.96068 5.19931 7.01787 4.98536C8.07505 4.7714 9.17404 4.96258 10.0969 5.52097C11.0197 6.07935 11.699 6.96417 12 7.99994C12.301 6.96417 12.9803 6.07935 13.9031 5.52097C14.8259 4.96258 15.9249 4.7714 16.9821 4.98536C18.0393 5.19931 18.9775 5.80277 19.6105 6.67604C20.2436 7.54932 20.5254 8.62864 20.4 9.69994C20.4 15.0999 12 20.3999 12 20.3999Z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.19995L2.80003 11.1C2.64466 11.2328 2.53375 11.4101 2.48223 11.6079C2.43071 11.8058 2.44106 12.0146 2.51188 12.2064C2.58271 12.3982 2.7106 12.5636 2.87834 12.6805C3.04608 12.7973 3.2456 12.86 3.45003 12.86H5.00003V20.0599C5.00003 20.3252 5.10539 20.5795 5.29292 20.7671C5.48046 20.9546 5.73481 21.0599 6.00003 21.0599H10V15.46H14V21.0599H18C18.2652 21.0599 18.5196 20.9546 18.7071 20.7671C18.8947 20.5795 19 20.3252 19 20.0599V12.86H20.55C20.7545 12.86 20.954 12.7973 21.1217 12.6805C21.2895 12.5636 21.4174 12.3982 21.4882 12.2064C21.559 12.0146 21.5693 11.8058 21.5178 11.6079C21.4663 11.4101 21.3554 11.2328 21.2 11.1L12 3.19995Z"/></svg>`,
  pan: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.59998 10.9H15.2V13.5C15.2 15.1709 14.5362 16.7733 13.3547 17.9548C12.1733 19.1363 10.5708 19.8 8.89998 19.8C7.22911 19.8 5.62668 19.1363 4.4452 17.9548C3.26372 16.7733 2.59998 15.1709 2.59998 13.5V10.9ZM15.4 11.7H17.8C18.1182 11.7 18.4235 11.5736 18.6485 11.3486C18.8735 11.1235 19 10.8183 19 10.5V6.80005H20.6V10.5C20.6 11.2427 20.305 11.9548 19.7799 12.4799C19.2548 13.005 18.5426 13.3 17.8 13.3H15.4V11.7Z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 4.5L15.75 12L8.25 19.5"/></svg>`,
  thumbsDown: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.4828 15.0938L21.3578 6.09375C21.2892 5.54989 21.0245 5.04975 20.6134 4.68724C20.2022 4.32474 19.6728 4.12481 19.1246 4.125H2.99963C2.60181 4.125 2.22028 4.28304 1.93897 4.56434C1.65767 4.84564 1.49963 5.22718 1.49963 5.625V13.875C1.49963 14.2728 1.65767 14.6544 1.93897 14.9357C2.22028 15.217 2.60181 15.375 2.99963 15.375H7.03651L10.5784 22.4606C10.6407 22.5852 10.7366 22.69 10.8551 22.7632C10.9737 22.8364 11.1103 22.8751 11.2496 22.875C12.2442 22.875 13.198 22.4799 13.9013 21.7766C14.6045 21.0734 14.9996 20.1196 14.9996 19.125V17.625H20.2496C20.5689 17.6251 20.8846 17.5573 21.1756 17.426C21.4667 17.2947 21.7264 17.103 21.9377 16.8635C22.1489 16.6241 22.3067 16.3425 22.4007 16.0373C22.4947 15.7322 22.5227 15.4105 22.4828 15.0938ZM6.74963 13.875H2.99963V5.625H6.74963V13.875ZM20.8121 15.8709C20.7422 15.9513 20.6558 16.0157 20.5587 16.0595C20.4616 16.1034 20.3562 16.1257 20.2496 16.125H14.2496C14.0507 16.125 13.86 16.204 13.7193 16.3447C13.5787 16.4853 13.4996 16.6761 13.4996 16.875V19.125C13.4998 19.6452 13.3197 20.1494 12.99 20.5517C12.6602 20.9541 12.2013 21.2298 11.6912 21.3319L8.24963 14.4478V5.625H19.1246C19.3074 5.62494 19.4838 5.69158 19.6209 5.81242C19.7579 5.93325 19.8462 6.09996 19.869 6.28125L20.994 15.2812C21.0081 15.3868 20.9991 15.4942 20.9677 15.596C20.9363 15.6978 20.8832 15.7916 20.8121 15.8709Z"/></svg>`,   /* icon / אגודל למטה (פיגמא 944:121) */
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7L17 17M17 7L7 17"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
};

export const icon = (name, attrs = {}) => svg(ICONS[name], { width: 24, height: 24, ...attrs });

/* header / screen — פס ירוק + כותרת. אופציונלי: חזרה, סגירה, פלוס, לוגו. */
export function header({ title, logo = true, backTo, closeTo, plusTo, meta, context, cls = "", titleTag = "h1" } = {}) {
  /* nav / top — דסקטופ בלבד (header / screen · דסקטופ בפיגמא): המתכונים שלי · + הוספת מתכון; הלוגו = בית. במובייל מוסתר (יש פס תחתון). */
  const at = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  const link = (href, label, on) => h("a", { class: "top-nav__link", href: "#" + href, "aria-current": on ? "page" : null }, label);
  const topNav = h("nav", { class: "top-nav", "aria-label": "ניווט ראשי" },
    link("/mine", "המתכונים שלי", at.startsWith("/mine")), link("/add/1", "+ הוספת מתכון", at.startsWith("/add")));   /* «בית» הוסר — הלוגו מחזיר הביתה (שחק 02.10) */
  return h("header", { class: "anchor-bar" + (cls ? " " + cls : "") }, topNav,
    /* brand / logo-wordmark (פיגמא 674:1617) — הקובץ כולל את שוליים הצל, לכן 79×52 */
    /* בדסקטופ הלוגו מופיע בכל מסך (header / screen · דסקטופ); במובייל רק כש-logo=true */
    h("a", { class: "anchor-bar__logo" + (logo ? "" : " anchor-bar__logo--desk"), href: "#/", "aria-label": "בננה בפיתה — לדף הבית" },
      h("img", { src: "assets/logo/logo-wordmark-on-dark.svg", alt: "", width: 79, height: 52 })),
    /* nav / context-row — המסננים הפעילים. «שינוי» הוא הלחיץ היחיד ולכן בליים. */
    context && h("div", { class: "context-row" },
      h("a", { class: "context-row__change", href: context.change }, "שינוי"),
      h("span", { class: "context-row__meta ui-meta" }, context.meta)),
    h(titleTag, { class: "anchor-bar__title display-h2", "aria-hidden": titleTag === "h1" ? null : "true" }, title),
    meta && h("p", { class: "anchor-bar__meta ui-meta" }, meta),
    backTo !== undefined && h("button", { class: "anchor-bar__btn anchor-bar__btn--back", type: "button", "aria-label": "חזרה", onClick: () => back(backTo) }, icon("back")),
    closeTo && h("a", { class: "anchor-bar__btn anchor-bar__btn--close", href: "#" + closeTo, "aria-label": "סגירה" }, icon("close")),
    plusTo && h("a", { class: "anchor-bar__btn anchor-bar__btn--plus", href: "#" + plusTo, "aria-label": "הוספת מתכון" }, icon("plus")),
  );
}

/* nav / bottom-bar — בית · המתכונים שלי. active: "home" | "mine" | null */
/* הסימון הלבן מחליק בין הלשוניות — כמו בפרוטוטייפ (Smart Animate, 0.3 שנ׳, ease-out).
   המסך נבנה מחדש בכל מעבר, לכן זוכרים איפה הסימון היה ומחליקים ממנו. */
const NAV = ["home", "mine"];
let navFrom = null;
export function bottomNav(active) {
  const item = (key, href, label, ic) =>
    h("a", { class: "bottom-nav__item", href, "aria-current": active === key ? "page" : null }, icon(ic), label);
  const to = NAV.indexOf(active);
  const ind = to < 0 ? null : h("span", { class: "bottom-nav__indicator", "aria-hidden": "true", style: { "--i": navFrom ?? to } });
  if (ind && navFrom !== null && navFrom !== to) requestAnimationFrame(() => requestAnimationFrame(() => ind.style.setProperty("--i", to)));
  if (to >= 0) navFrom = to;
  return h("nav", { class: "bottom-nav", "aria-label": "ניווט ראשי" },
    item("home", "#/", "בית", "home"),
    item("mine", "#/mine", "המתכונים שלי", "heartFilled"),   /* פיגמה nav / bottom-bar: שני האייקונים מלאים, הלא־פעיל מעומעם */
    ind,
  );
}

/* toast / saved — הודעה קטנה למטה, 2.5 שניות. «הצג» מוביל ל«המתכונים שלי». */
let toastTimer = null;
/* toast / removed — «הוסר מהמתכונים שלי · ביטול», 5 שניות (שחק 02.10). action = כפתור במקום קישור. */
export function toast(text, { link, linkLabel = "הצג", action, ms = 2500 } = {}) {
  document.querySelector(".toast")?.remove();
  clearTimeout(toastTimer);
  const close = () => { el.classList.remove("toast--in"); setTimeout(() => el.remove(), 250); };
  const el = h("div", { class: "toast", role: "status" }, text,
    link && h("a", { class: "toast__link", href: link }, linkLabel),
    action && h("button", { class: "toast__link toast__btn", type: "button", onClick: () => { clearTimeout(toastTimer); close(); action.onClick(); } }, action.label));
  document.getElementById("app").append(el);
  requestAnimationFrame(() => el.classList.add("toast--in"));
  toastTimer = setTimeout(close, ms);
  return el;
}
