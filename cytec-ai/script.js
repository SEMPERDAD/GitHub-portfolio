// Cytec Ops — entrance choreography + live ticket rotation.
// Transform + opacity only. IntersectionObserver. Respects reduced motion.

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Reveal on scroll ------------------------------------------------
  const targets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(el => io.observe(el));
  }

  // --- Live "on call · Florida" clock ---------------------------------
  const status = document.querySelector('.nav__status');
  if (status) {
    const stamp = () => {
      const now = new Date();
      // Approximate ET (UTC-4). Illustrative only — no libs, no shift.
      const et = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const hh = String(et.getUTCHours()).padStart(2, '0');
      const mm = String(et.getUTCMinutes()).padStart(2, '0');
      status.innerHTML =
        '<i class="dot"></i> On call &middot; ' + hh + ':' + mm + ' ET';
    };
    stamp();
    setInterval(stamp, 30_000);
  }

  // --- Rotating hero ticket -------------------------------------------
  const tickets = [
    {
      id: '0724',
      client: 'Lake Worth Senior Center',
      type: 'Digital literacy · Week 3 of 10',
      loc: 'On-site · Palm Beach County',
      status: 'In progress',
      progress: 30,
      opened: 'Mon 08:14',
      next: 'Thu 10:00'
    },
    {
      id: '0725',
      client: 'Wellington Dental',
      type: 'Network rebuild · 6 workstations',
      loc: 'On-site · Wellington',
      status: 'Cabling',
      progress: 55,
      opened: 'Tue 07:40',
      next: 'Wed 16:00'
    },
    {
      id: '0726',
      client: 'Delray service firm',
      type: 'ElevenLabs v3 voice agent',
      loc: 'Remote · after-hours routing',
      status: 'QA',
      progress: 82,
      opened: 'Wed 11:02',
      next: 'Fri 09:00'
    },
    {
      id: '0727',
      client: 'Boca growth studio',
      type: 'Onboarding automation · Sheets + Resend',
      loc: 'Remote',
      status: 'Building',
      progress: 44,
      opened: 'Wed 14:20',
      next: 'Mon 10:30'
    }
  ];

  const el = {
    id:       document.querySelector('[data-ticket-id]'),
    client:   document.querySelector('[data-ticket-client]'),
    type:     document.querySelector('[data-ticket-type]'),
    loc:      document.querySelector('[data-ticket-loc]'),
    status:   document.querySelector('[data-ticket-status]'),
    fill:     document.querySelector('[data-ticket-fill]'),
    progress: document.querySelector('[data-ticket-progress]'),
    opened:   document.querySelector('[data-ticket-opened]'),
    next:     document.querySelector('[data-ticket-next]')
  };
  const card = document.getElementById('ticket');

  if (card && el.id) {
    let i = 0;
    const paint = (t) => {
      el.id.textContent       = t.id;
      el.client.textContent   = t.client;
      el.type.textContent     = t.type;
      el.loc.textContent      = t.loc;
      el.status.textContent   = t.status;
      el.progress.textContent = t.progress + '%';
      el.fill.style.width     = t.progress + '%';
      el.opened.textContent   = t.opened;
      el.next.textContent     = t.next;
    };

    if (!reduce) {
      setInterval(() => {
        i = (i + 1) % tickets.length;
        // opacity fade only — no layout thrash
        card.animate(
          [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
          { duration: 900, easing: 'cubic-bezier(.2,.7,.25,1)' }
        );
        setTimeout(() => paint(tickets[i]), 300);
      }, 5200);
    }
  }
})();
