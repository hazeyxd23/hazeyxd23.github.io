/* ============================================================
   theme.js — loaded in <head> on every page (the desktop and the blog
   posts), so the saved theme is on <html> before anything paints.

   This is the one place that knows which themes share the Windows 98
   window chrome: everything but matrix. style.css keys its window
   furniture off data-chrome, so a theme is a variable block plus the
   chrome it picks here.
   ============================================================ */
(function () {
  var THEMES = ['win98', 'soft', 'retro', 'hacker'];
  var WIN_CHROME = ['win98', 'soft', 'retro'];
  var root = document.documentElement;

  /* unknown names (an old theme left in someone's storage) are ignored —
     setting one would leave the page with no colour variables at all */
  function set(t) {
    if (THEMES.indexOf(t) < 0) return false;
    root.dataset.theme = t;
    root.dataset.chrome = WIN_CHROME.indexOf(t) > -1 ? 'win' : 'flat';
    return true;
  }

  /* light up the swatch for the current theme */
  function mark() {
    var t = root.dataset.theme;
    document.querySelectorAll('.sw').forEach(function (x) {
      x.classList.toggle('on', x.dataset.t === t);
    });
  }

  try { set(localStorage.getItem('theme')); } catch (e) {}

  window.THEME = {
    apply: function (t) {
      if (!set(t)) return;
      try { localStorage.setItem('theme', t); } catch (e) {}
      mark();
    },
    mark: mark
  };
})();
