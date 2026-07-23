/* animations.js — small, reusable motion helpers shared across pages */

// Reveals elements with class "reveal-on-scroll" as they enter the viewport,
// by adding "reveal" (which triggers the fadeInUp keyframe in styles.css).
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal-on-scroll');
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
}

// Animates a number counting up from 0 to `target` inside `el`, formatted
// with thousands separators and an optional prefix/suffix (e.g. "$", "/mo").
function countUp(el, target, { duration = 900, prefix = '', suffix = '' } = {}) {
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.round(target * eased);
    el.textContent = prefix + value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Any element with data-count-to="18000" (optionally data-prefix="$" and
// data-suffix="/mo") will count up from 0 once it scrolls into view.
function initCountOnScroll() {
  const targets = document.querySelectorAll('[data-count-to]');
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.countTo, 10) || 0;
          countUp(el, target, { prefix: el.dataset.prefix || '', suffix: el.dataset.suffix || '' });
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );
  targets.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCountOnScroll();
});
