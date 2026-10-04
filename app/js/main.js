/* בננה בפיתה — נקודת הכניסה */
import { route, start, navigate } from "./router.js";
import { get } from "./store.js";
import { renderIntro } from "./screens/intro.js";
import { renderHome } from "./screens/home.js";
import { renderResults } from "./screens/results.js";
import { renderRecipe } from "./screens/recipe.js";
import { renderMine } from "./screens/mine.js";
import { renderAdd1, renderAdd2, renderAdd2b, renderAdd3, renderAdd4 } from "./screens/add.js";

route("/intro", renderIntro);
route("/", () => (get().introSeen ? renderHome() : renderIntro()));
route("/results", renderResults);
route("/recipe/:id", renderRecipe);
route("/mine", renderMine);
route("/add/1", renderAdd1);
route("/add/2", renderAdd2);
route("/add/2b", renderAdd2b);
route("/add/3", renderAdd3);
route("/add/4", renderAdd4);

start();

/* PWA — רישום ה־Service Worker (רק ב־https או localhost) */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
