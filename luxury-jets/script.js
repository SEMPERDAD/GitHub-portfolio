// Minimal entrance choreography — IntersectionObserver, transform+opacity only.
// No perpetual rAF, no heavy libraries. Respects prefers-reduced-motion.

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => io.observe(el));

  // Live UTC in the nav — tabular numerals, no layout shift.
  const status = document.querySelector('.nav__status');
  if (status) {
    const stamp = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      status.innerHTML =
        '<i class="dot"></i> LFPB &middot; ' + hh + ':' + mm + ' UTC';
    };
    stamp();
    setInterval(stamp, 30_000);
  }
})();
