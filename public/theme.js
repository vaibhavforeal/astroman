// Theme toggle. The initial theme is applied by a tiny inline <head> script on
// each page (before paint, to avoid a flash); this only handles the toggle.
(function () {
  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    apply(dark ? "light" : "dark");
  });
})();
