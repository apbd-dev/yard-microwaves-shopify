/* Toggle a `ym-over-hero` class on <body> while the torn-edge rip sits below
   the bottom of the sticky header. Once the rip crosses the header's lower
   edge, flip to the solid scheme — that's the moment the rip "hits" the nav.
   See #40. The `ym-has-hero` class is set permanently when a hero exists so
   the scrolled-state styling can scope to the homepage. */
(function () {
  function init() {
    var hero = document.querySelector('.ym-hero');
    // ym-has-hero is also added by Liquid in layout/theme.liquid for FOUC-free
    // styling on first paint. JS keeps it in sync for safety.
    if (!hero) return;
    document.body.classList.add('ym-has-hero');
    var torn = hero.querySelector('.ym-hero__torn-edge');
    var header = document.getElementById('header-component');

    function update() {
      var ref = torn || hero;
      var rect = ref.getBoundingClientRect();
      var headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      var overHero = rect.bottom > headerBottom;
      document.body.classList.toggle('ym-over-hero', overHero);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
