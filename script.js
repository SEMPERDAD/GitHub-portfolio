/* ==========================================
   FLOWAI — LANDING PAGE SCRIPTS
   ========================================== */

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// --- Mobile hamburger menu ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav__links');
const navCta = document.querySelector('.nav__cta');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.style.display === 'flex';
  navLinks.style.cssText = isOpen ? '' : 'display:flex;flex-direction:column;position:absolute;top:70px;left:0;right:0;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);padding:24px;gap:20px;border-bottom:1px solid #e5e7eb;z-index:99;box-shadow:0 8px 32px rgba(0,0,0,.1);';
  navCta.style.cssText = isOpen ? '' : 'display:flex;flex-direction:column;position:absolute;top:calc(70px + 140px);left:0;right:0;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);padding:0 24px 24px;gap:10px;border-bottom:1px solid #e5e7eb;z-index:99;';
});

// --- Intersection Observer for scroll animations ---
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .testi-card, .price-card, .step').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// --- Animated stat counters ---
function animateCounter(el, target) {
  const suffix = target >= 1000 ? '+' : (el.closest('.stat-item') && el.closest('.stats-section') && target < 100 ? '%' : (target < 1000 && target >= 100 ? '+' : '+'));
  const duration = 2000;
  const start = performance.now();

  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(eased * target);

    if (target >= 1000) {
      el.textContent = current.toLocaleString() + '+';
    } else if (target <= 100 && el.dataset.target === '94') {
      el.textContent = current + '%';
    } else {
      el.textContent = current + '+';
    }

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-target]').forEach((el) => {
  statsObserver.observe(el);
});

// --- Pricing toggle (monthly / annual) ---
const billingToggle = document.getElementById('billing-toggle');
const monthlyLabel = document.getElementById('monthly-label');
const annualLabel = document.getElementById('annual-label');

billingToggle.addEventListener('change', () => {
  const isAnnual = billingToggle.checked;
  monthlyLabel.classList.toggle('active', !isAnnual);
  annualLabel.classList.toggle('active', isAnnual);

  document.querySelectorAll('.price-amount[data-monthly]').forEach((el) => {
    const val = isAnnual ? el.dataset.annual : el.dataset.monthly;
    const num = parseInt(val, 10);
    el.textContent = num === 0 ? '$0' : `$${num}`;
  });
});

// Initialize active label
monthlyLabel.classList.add('active');

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; // navbar height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// --- Staggered feature card entrance ---
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.08}s`;
});

// --- Staggered testimonial entrance ---
const testiCards = document.querySelectorAll('.testi-card');
testiCards.forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.1}s`;
});
