/* S04 · המתכונים שלי — ריק / מלא, עם ממתינים לאישור בראש.
   לעולם לא «נעלמים» מתכונים: שמור = כאן, ממתין = כאן. */
import { h, announce } from "../dom.js";
import { header, bottomNav, icon, toast } from "../ui.js";
import { get, set, toggleSaved } from "../store.js";
import { loadRecipes, getRecipe } from "../data.js";
import { toolsFor, evaluate, norm } from "../match.js";
import { navigate } from "../router.js";
import { equipmentLabel, toolsLabel, timeLabel, photo, card } from "./results.js";

const desktop = () => matchMedia("(min-width: 1024px)").matches;

function row(r, { pending = false, onSelect, onRemove } = {}) {
  const meta = pending ? null : [timeLabel(r.prepTimeMinutes), equipmentLabel(r), toolsLabel(r.tools ?? toolsFor(r))].filter(Boolean).join(" · ");
  /* השורה = div; הקישור והכפתור אחים (כפתור בתוך קישור — לא תקין ולא נגיש) */
  const main = h(pending ? "div" : "a", { class: "saved-row__main", href: pending ? null : "#/recipe/" + r.id, "aria-label": pending ? `${r.title} — ממתין לאישור` : r.title,
      onClick: (ev) => { if (!pending && onSelect && desktop()) { ev.preventDefault(); onSelect(); } } },
    h("span", { class: "saved-row__thumb", "aria-hidden": "true", style: !pending && photo(r) ? { backgroundImage: `url("${photo(r)}")` } : null }),   /* ממתין — אין עדיין תמונה במאגר: הדפוס, כמו בפיגמא */
    h("div", { class: "saved-row__text" },
      h("p", { class: "saved-row__title ui-body-strong" }, r.title),
      pending ? h("span", { class: "status-pending" }, "ממתין לאישור") : h("p", { class: "saved-row__meta ui-meta muted" }, meta)));
  return h("div", { class: "saved-row" + (pending ? " saved-row--pending" : "") }, main,
    /* btn / remove — מובייל ודסקטופ (שחק 02.10: «שיהיו גם במובייל»): הסרה מהמתכונים שלי */
    !pending && onRemove && h("button", { class: "saved-row__remove", type: "button", "aria-label": `הסרה מהמתכונים שלי: ${r.title}`,
      onClick: (ev) => { ev.preventDefault(); ev.stopPropagation(); onRemove(); } }, icon("close")));
}

let mineKeys = null;
addEventListener("keydown", (ev) => mineKeys?.(ev));

export async function renderMine() {
  await loadRecipes();
  const s = get();
  const saved = s.saved.map(getRecipe).filter(Boolean).reverse();
  const pending = [...s.pending].reverse();
  const hasAny = saved.length + pending.length > 0;

  /* דסקטופ (S04 · דסקטופ): הרשימה מימין, הכרטיס של המתכון הנבחר משמאל; ↑ ↓ מעבר, Enter פתיחה */
  let sel = 0;
  const preview = h("div", { class: "mine__preview" });
  const rows = saved.map((r, i) => row(r, { onSelect: () => select(i), onRemove: () => {
    const before = [...get().saved];   /* לביטול — חוזר בדיוק לאותו מקום */
    toggleSaved(r.id); navigate("/mine", { replace: true }); announce("הוסר מהמתכונים שלי");
    toast("הוסר מהמתכונים שלי", { ms: 5000, action: { label: "ביטול", onClick: () => { set({ saved: before }); navigate("/mine", { replace: true }); announce("המתכון חזר"); } } });
  } }));
  const pantry = s.pantry.map(norm);
  function select(i) {
    if (!saved.length) return;
    sel = (i + saved.length) % saved.length;
    rows.forEach((el, k) => el.classList.toggle("is-selected", k === sel));
    const r = saved[sel];
    preview.replaceChildren(card(r, evaluate(r, pantry), saved.filter((x) => x !== r).slice(0, 4), { onOpen: () => navigate("/recipe/" + r.id) }));
  }
  select(0);
  mineKeys = (ev) => {
    if (document.body.dataset.screen !== "mine" || !desktop() || !saved.length) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); select(sel + 1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); select(sel - 1); }
    else if (ev.key === "Enter" && document.activeElement === document.body) navigate("/recipe/" + saved[sel].id);
  };

  const body = hasAny
    ? h("div", { class: "mine__split" },
        h("div", { class: "mine__list" }, ...pending.map((r) => row(r, { pending: true })), ...rows),
        saved.length > 0 && preview,
        saved.length > 0 && h("p", { class: "kbd-hint mine__hint" }, "↑ ↓ מעבר בין המתכונים  ·  Enter פתיחה"))
    : h("div", { class: "mine__empty" },
        h("div", { class: "empty-state" },
          h("div", { class: "empty-state__well" }, icon("heartFilled")),
          h("p", { class: "ui-body-strong" }, "עוד לא שמרת מתכונים"),
          h("p", { class: "ui-body-sm muted" }, "כשתמצא מתכון שאהבת, לחץ על הלב", h("br"), "והוא יחכה לך כאן.")),
        h("p", { class: "mine__invite ui-body" }, "יש לכם מתכון משלכם? תוסיפו לנו!", h("br"), "תהיו חלק פעיל מקהילת \"בננה בפיתה\"!", h("br"), "בשביל כל אותם רעבים שלא יודעים לבשל :)"),
        h("a", { class: "btn-secondary", href: "#/add/1" }, "שתפו מתכון"));

  return h("div", { dataset: { screen: "mine", title: "המתכונים שלי" } },
    header({ title: "המתכונים שלי", logo: false, plusTo: hasAny ? "/add/1" : undefined }),
    h("div", { class: "mine__content" }, body),
    bottomNav("mine"),
  );
}
