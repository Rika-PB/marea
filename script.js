/* =========================================================
   MAREA — interactions & motion
   ========================================================= */
(() => {
  const WHATSAPP = '393663610084';
  const EMAIL = 'info.blueridereastern@gmail.com';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !hasGSAP) root.classList.add('reduced');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- split text into words ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
            w.append(i); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.wi', el);
  };
  $$('[data-split]').forEach(splitWords);

  // manifesto words for scrub
  $$('[data-scrub-words]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="sw">${w}</span>`).join(' ');
  });

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (hasGSAP && !reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const navH = () => parseInt(getComputedStyle(root).getPropertyValue('--nav-h')) || 76;
  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : -navH() + 1, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    scrollToEl(el);
    history.replaceState(null, '', id);
  });

  /* ---------- mobile menu ---------- */
  const toggle = $('#navToggle');
  function setMenu(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- live widget (EAT = UTC+3) ---------- */
  const seasonOf = (m) => ([11, 0, 1, 2].includes(m) ? 'kaskazi' : [5, 6, 7, 8].includes(m) ? 'kusi' : 'transition');
  const seasonName = { kaskazi: 'Kaskazi · 15+ kn', kusi: 'Kusi · 20+ kn', transition: 'Transition' };
  const eatNow = () => new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
  const tickLive = () => {
    const d = eatNow();
    $('#liveTime').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    $('#liveSeason').textContent = seasonName[seasonOf(d.getMonth())];
  };
  tickLive(); setInterval(tickLive, 30000);

  /* ---------- tide switch ---------- */
  const spot = $('#spot');
  let tideTouched = false;
  const setTide = (t) => {
    spot.classList.toggle('is-high', t === 'high');
    $$('.tide-switch button').forEach((b) => { const on = b.dataset.tide === t; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $$('[data-tide-copy]').forEach((p) => p.classList.toggle('is-active', p.dataset.tideCopy === t));
    $('#tideLabel').textContent = t === 'high' ? 'High' : 'Low';
  };
  $$('.tide-switch button').forEach((b) => b.addEventListener('click', () => { tideTouched = true; setTide(b.dataset.tide); }));
  $('.spot__visual').addEventListener('click', () => { tideTouched = true; setTide(spot.classList.contains('is-high') ? 'low' : 'high'); });

  /* ---------- wind wheel ---------- */
  const wheelWrap = $('#wheelWrap');
  const svg = $('#windWheel');
  const NS = 'http://www.w3.org/2000/svg';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const nowMonth = eatNow().getMonth();
  const fill = { kaskazi: '#3f8d8f', kusi: '#c3d7e0', transition: 'rgba(245,240,232,.06)' };
  const ink = { kaskazi: '#f5f0e8', kusi: '#1e3640', transition: '#f5f0e8' };
  const cx = 170, cy = 170, R = 158, r = 92, gap = 0.014, step = (Math.PI * 2) / 12;
  const pt = (rad, a) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  const ring = document.createElementNS(NS, 'g'); ring.id = 'wheelRing';
  months.forEach((m, i) => {
    const s = seasonOf(i);
    const a0 = i * step - step / 2 + gap, a1 = a0 + step - gap * 2;
    const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1), [x2, y2] = pt(r, a1), [x3, y3] = pt(r, a0);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `seg ${s}${i === nowMonth ? ' is-now' : ''}`);
    g.dataset.season = s;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 0 0 ${x3},${y3} Z`);
    p.setAttribute('fill', fill[s]);
    if (s === 'transition') { p.setAttribute('stroke', 'rgba(245,240,232,.35)'); p.setAttribute('stroke-width', '1'); }
    const [tx, ty] = pt((R + r) / 2, i * step);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', tx); t.setAttribute('y', ty);
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('fill', ink[s]);
    t.setAttribute('style', 'font: 500 11px Jost, sans-serif; letter-spacing: .14em');
    t.setAttribute('transform', `rotate(${i * 30} ${tx} ${ty})`);
    t.textContent = m;
    g.append(p, t);
    ring.append(g);
  });
  // compass ticks
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, [x0, y0] = pt(R + 8, a), [x1, y1] = pt(R + (i % 6 ? 12 : 18), a);
    const l = document.createElementNS(NS, 'line');
    Object.entries({ x1: x0, y1: y0, x2: x1, y2: y1, stroke: 'rgba(245,240,232,.35)', 'stroke-width': 1 }).forEach(([k, v]) => l.setAttribute(k, v));
    ring.append(l);
  }
  svg.append(ring);
  const center = document.createElementNS(NS, 'g');
  center.innerHTML = `<circle cx="170" cy="170" r="84" fill="#f5f0e8"/>
    <text x="170" y="158" text-anchor="middle" style="font: 400 28px Fraunces, serif" fill="#1e3640">Wind</text>
    <text x="170" y="186" text-anchor="middle" style="font: italic 400 21px Fraunces, serif" fill="#2b6b6e">seasons</text>
    <text x="170" y="212" text-anchor="middle" style="font: 500 9px Jost, sans-serif; letter-spacing: .3em" fill="#4a5f66">WATAMU</text>`;
  svg.append(center);
  $('#windNow').textContent = `Now in Watamu · ${eatNow().toLocaleDateString('en-GB', { month: 'long' })}`;

  const setSeason = (s) => {
    wheelWrap.className = `wind__wheel hl-${s}`;
    $$('.season-tab').forEach((b) => { const on = b.dataset.season === s; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $$('.season-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === s));
  };
  $$('.season-tab').forEach((b) => {
    b.addEventListener('click', () => setSeason(b.dataset.season));
    if (finePointer) b.addEventListener('mouseenter', () => setSeason(b.dataset.season));
  });
  $$('.seg', svg).forEach((g) => {
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => setSeason(g.dataset.season));
    if (finePointer) g.addEventListener('mouseenter', () => setSeason(g.dataset.season));
  });
  setSeason(seasonOf(nowMonth));

  /* ---------- who panels ---------- */
  const panels = $$('.panel');
  const openPanel = (p) => panels.forEach((x) => x.classList.toggle('is-open', x === p));
  panels.forEach((p) => {
    if (finePointer) p.addEventListener('mouseenter', () => openPanel(p));
    p.addEventListener('click', () => openPanel(p));
    p.addEventListener('focus', () => openPanel(p));
  });

  /* ---------- rooms ---------- */
  const rooms = $$('.room-list li');
  const setRoom = (li) => {
    rooms.forEach((x) => x.classList.toggle('is-active', x === li));
    $$('[data-room-img]').forEach((img) => img.classList.toggle('is-active', img.dataset.roomImg === li.dataset.room));
    $('.rooms__stage').dataset.caption = $('h4', li).textContent;
  };
  // inline photo per room (used on phones/tablets as an accordion)
  rooms.forEach((li) => {
    const src = $(`[data-room-img="${li.dataset.room}"]`).getAttribute('src');
    const fig = document.createElement('figure');
    fig.className = 'room-list__img';
    fig.innerHTML = `<img src="${src}" alt="${$('h4', li).textContent}" loading="lazy">`;
    li.append(fig);
  });
  setRoom(rooms[0]);
  rooms.forEach((li) => {
    if (finePointer) li.addEventListener('mouseenter', () => setRoom(li));
    li.addEventListener('click', () => setRoom(li));
    li.addEventListener('focus', () => setRoom(li));
  });

  /* ---------- explore: mobile swipe layout ---------- */
  const xIntro = $('.explore__intro'), xTrack = $('#exploreTrack'), xPin = $('.explore__pin');
  const mqDesk = matchMedia('(min-width: 900px)');
  const placeIntro = () => {
    if (mqDesk.matches) { if (xIntro.parentElement !== xTrack) xTrack.prepend(xIntro); }
    else if (xIntro.parentElement === xTrack) xPin.before(xIntro);
  };
  placeIntro();
  mqDesk.addEventListener('change', () => { placeIntro(); if (hasGSAP) ScrollTrigger.refresh(); });
  const xBar = $('#exploreBar');
  const updBar = () => {
    const max = xTrack.scrollWidth - xTrack.clientWidth;
    xBar.style.transform = `scaleX(${max > 0 ? Math.max(0.12, xTrack.scrollLeft / max) : 1})`;
  };
  xTrack.addEventListener('scroll', updBar, { passive: true });
  const xHint = $('.explore__hint');
  xHint.style.cursor = 'pointer';
  xHint.addEventListener('click', () => { if (!mqDesk.matches) xTrack.scrollBy({ left: xTrack.clientWidth * 0.8, behavior: 'smooth' }); });
  // gentle one-time nudge so visitors see the row moves sideways
  const nudgeIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting || mqDesk.matches || reduced) return;
    nudgeIO.disconnect();
    setTimeout(() => {
      xTrack.scrollBy({ left: 140, behavior: 'smooth' });
      setTimeout(() => xTrack.scrollBy({ left: -140, behavior: 'smooth' }), 750);
    }, 400);
  }), { threshold: 0.6 });
  nudgeIO.observe(xTrack);

  /* ---------- estimator ---------- */
  const PKG = {
    villa: { name: 'Villa only', rate: 390, incl: 10, extra: 0 },
    breakfast: { name: 'Villa & breakfast', rate: 490, incl: 8, extra: 25 },
    all: { name: 'All inclusive', rate: 590, incl: 8, extra: 50 },
  };
  const nightsEl = $('#calcNights'), guestsEl = $('#calcGuests'), kiteEl = $('#calcKite');
  const fmt = (n) => n.toLocaleString('en-GB');
  let shownTotal = 0;
  const calc = () => {
    const key = $('input[name="calcPkg"]:checked').value;
    const p = PKG[key];
    const n = +nightsEl.value, g = +guestsEl.value;
    const extraGuests = Math.max(0, g - p.incl);
    const base = p.rate * n;
    const extra = extraGuests * p.extra * n;
    const weeks = Math.ceil(n / 7);
    const kite = kiteEl.checked ? g * 25 * weeks : 0;
    const total = base + extra + kite;
    $('#outNights').textContent = n;
    $('#outGuests').textContent = g;
    [nightsEl, guestsEl].forEach((el) => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%'));
    const lines = [[`${p.name} · ${n} nights × €${p.rate}`, base]];
    if (extra) lines.push([`${extraGuests} extra guest${extraGuests > 1 ? 's' : ''} × €${p.extra} × ${n}`, extra]);
    if (kite) lines.push([`Kite assistance · ${g} × €25 × ${weeks} wk`, kite]);
    $('#calcLines').innerHTML = lines.map(([l, v]) => `<li><span>${l}</span><b>€${fmt(v)}</b></li>`).join('');
    $('#calcPP').textContent = fmt(Math.round(total / g / n));
    if (hasGSAP && !reduced) {
      const o = { v: shownTotal };
      gsap.to(o, { v: total, duration: 0.8, ease: 'power3.out', onUpdate: () => ($('#calcTotal').textContent = fmt(Math.round(o.v))) });
    } else $('#calcTotal').textContent = fmt(total);
    shownTotal = total;
    return { p, n, g, total, kite: kiteEl.checked };
  };
  $$('#calc input').forEach((el) => el.addEventListener('input', calc));
  calc();
  $$('[data-choose]').forEach((b) => b.addEventListener('click', () => {
    $(`input[name="calcPkg"][value="${b.dataset.choose}"]`).checked = true;
    calc();
    scrollToEl($('#calc'));
  }));

  /* ---------- contact form ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  const F = form.elements;
  $('#calcCta').addEventListener('click', () => {
    const c = calc();
    $('#packageSelect').value = c.p.name;
    F.guests.value = c.g;
    if (!F.message.value) F.message.value = `Estimate: ${c.n} nights, ${c.g} guests, ${c.p.name}${c.kite ? ' + beach kite assistance' : ''} ≈ €${fmt(c.total)}.`;
    F.message.dispatchEvent(new Event('input'));
  });
  const fmtDate = (v) => (v ? new Date(v + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
  const summary = (d) => [
    `Name: ${d.name}`, `Email: ${d.email || '–'}`,
    `Dates: ${fmtDate(d.arrival)} – ${fmtDate(d.departure)}`,
    `Group size: ${d.guests || '–'}`, `Trip type: ${d.type}`, `Package: ${d.package || 'Not sure yet'}`,
    '', d.message || '',
  ].join('\n').trim();
  const validate = (requireEmail = true) => {
    let ok = true;
    $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    const mark = (el) => { (el.closest('.field') || el.closest('label')).classList.add('is-invalid'); ok = false; };
    if (!F.name.value.trim()) mark(F.name);
    if (requireEmail && !/^\S+@\S+\.\S+$/.test(F.email.value.trim())) mark(F.email);
    if (F.arrival.value && F.departure.value && F.departure.value < F.arrival.value) mark(F.departure);
    if (!F.privacy.checked) mark(F.privacy);
    return ok;
  };
  const data = () => Object.fromEntries(new FormData(form).entries());
  const say = (msg, err) => { status.textContent = msg; status.classList.toggle('is-error', !!err); };
  const waUrl = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return say('Please check the highlighted fields.', true);
    const d = data();
    const endpoint = form.getAttribute('action');
    if (endpoint) { // e.g. Formspree – set <form action="https://formspree.io/f/xxxx">
      try {
        say('Sending…');
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error();
        form.reset();
        return say('Thank you! We’ll get back to you shortly.');
      } catch { return say('Sending failed – please try WhatsApp or email us directly.', true); }
    }
    const subject = `Marea enquiry – ${d.name}${d.guests ? ', ' + d.guests + ' guests' : ''}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary(d))}`;
    say('Your email app is opening with your enquiry – just hit send.');
  });
  $('#formWa').addEventListener('click', () => {
    if (!validate(false)) return say('Please add your name and accept the privacy note.', true);
    window.open(waUrl('Hi Federica! Enquiry for Marea:\n\n' + summary(data())), '_blank', 'noopener');
    say('WhatsApp is opening with your enquiry.');
  });
  $$('.js-wa').forEach((a) => (a.href = waUrl('Hi Federica! I found Marea online and would like to ask about availability.')));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- cursor + magnetic ---------- */
  if (finePointer && !reduced && hasGSAP) {
    const cur = $('#cursor'), label = $('#cursorLabel');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); cur.classList.add('is-on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, input, select, textarea, label, .panel, .room-list li');
      cur.classList.toggle('is-label', !!lab);
      label.textContent = lab ? lab.dataset.cursor : '';
      cur.classList.toggle('is-link', !lab && !!link);
    });
    $$('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
    // 3D tilt on price cards
    $$('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, y: -6, duration: 0.6, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .5)' }));
    });
  }

  /* ---------- counters ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count;
    if (!hasGSAP || reduced) { el.textContent = end; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) });
  };

  /* ---------- no-GSAP fallback ---------- */
  const nav = $('#nav');
  if (!hasGSAP || reduced) {
    $('#loader')?.remove();
    const onScroll = () => nav.classList.toggle('is-solid', scrollY > innerHeight - 100);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    $$('[data-count]').forEach(countUp);
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      const m = en.target;
      $('#clock').textContent = m.dataset.time; $('#clockLabel').textContent = m.dataset.label;
      $$('.moment').forEach((x) => x.classList.toggle('is-active', x === m));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.moment').forEach((m) => io.observe(m));
    return;
  }

  /* =========================================================
     GSAP motion
     ========================================================= */

  /* ---------- loader → hero intro ---------- */
  const heroWords = $$('.hero__title .wi');
  gsap.set(heroWords, { yPercent: 115 });
  gsap.set(['.hero__logo', '.hero__eyebrow', '.hero__sub', '.hero__actions', '.live', '.hero__scroll'], { autoAlpha: 0, y: 24 });
  gsap.set('.hero__media img', { scale: 1.3 });

  const loaderCount = { v: 0 };
  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { $('#loader')?.remove(); lenis && lenis.start(); } });
    tl.to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
      .to('.hero__media img', { scale: 1, duration: 2.4 }, '<0.2')
      .to(heroWords, { yPercent: 0, duration: 1.4, stagger: 0.07 }, '<0.35')
      .to(['.hero__logo', '.hero__eyebrow', '.hero__sub', '.hero__actions', '.live', '.hero__scroll'], { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, '<0.4');
  };
  const heroImg = $('.hero__media img');
  const imgReady = new Promise((res) => (heroImg.complete ? res() : (heroImg.onload = heroImg.onerror = res)));
  const minTime = new Promise((res) => setTimeout(res, 1500));
  const maxTime = new Promise((res) => setTimeout(res, 3500));
  gsap.to(loaderCount, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => ($('#loaderCount').textContent = Math.round(loaderCount.v)) });
  Promise.race([Promise.all([imgReady, minTime, document.fonts ? document.fonts.ready : 0]), maxTime]).then(intro);

  /* ---------- hero scroll parallax ---------- */
  gsap.to('.hero__media img', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__logo', { y: -80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* ---------- nav: solid / dark / hide on scroll ---------- */
  ScrollTrigger.create({
    start: () => innerHeight - 100, end: 'max',
    onToggle: (self) => nav.classList.toggle('is-solid', self.isActive),
  });
  $$('.wind, .explore, .footer').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: () => `top ${navH()}`, end: () => `bottom ${navH()}`,
    onToggle: (self) => nav.classList.toggle('is-dark', self.isActive),
  }));
  const wave = $('#progressWave');
  const wl = wave.getTotalLength();
  gsap.set(wave, { strokeDasharray: wl, strokeDashoffset: wl });
  gsap.to(wave, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // scroll spy
  const links = $$('.nav__menu a[href^="#"]:not(.nav__cta)');
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && links.forEach((l) => l.classList.toggle('is-active', l === a)) });
  });
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom 50%', onEnter: () => links.forEach((l) => l.classList.remove('is-active')), onEnterBack: () => links.forEach((l) => l.classList.remove('is-active')) });

  /* ---------- heading reveals ---------- */
  $$('[data-split]').forEach((el) => {
    if (el.closest('.hero')) return;
    const words = $$('.wi', el);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.045 }) });
  });

  // generic fade-up for paragraphs & blocks
  const fadeTargets = $$('.eyebrow:not(.hero__eyebrow), .lead, .chapter__no, .spot__facts, .tide-switch, .seasons, .stats .stat, .tags, .room-list li, .services-strip > div, .price, .calc, .pull, .federica__text > p, .wa-card, .contact__list, .contact__media, .form, .signature-line, .inside__text > p, .xcard, .wind__note');
  fadeTargets.forEach((el) => {
    if (el.closest('.explore')) return;
    gsap.from(el, { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // counters
  $$('[data-count]').forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* ---------- manifesto ---------- */
  const sw = $$('.manifesto__text .sw');
  gsap.to(sw, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true } });
  $$('.manifesto__float').forEach((el) => {
    const s = +el.dataset.speed;
    gsap.fromTo(el, { yPercent: -s * 2, rotate: s / 6 }, { yPercent: s * 2, rotate: -s / 6, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- parallax images ---------- */
  $$('.media img[data-speed]').forEach((img) => {
    const s = +img.dataset.speed || 8;
    gsap.fromTo(img, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.wind__bg img, .contact__bg img').forEach((img) => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* ---------- spot: auto-rise tide ---------- */
  gsap.from('.spot__visual', { clipPath: 'inset(18% 10% 18% 10% round 24px)', ease: 'none', scrollTrigger: { trigger: '.spot__visual', start: 'top 95%', end: 'top 35%', scrub: true } });
  ScrollTrigger.create({
    trigger: '.spot__visual', start: 'top 20%', end: 'bottom top',
    onEnter: () => !tideTouched && setTide('high'),
    onLeaveBack: () => !tideTouched && setTide('low'),
  });

  /* ---------- wind wheel rotation ---------- */
  gsap.fromTo('#wheelRing', { rotation: -60, svgOrigin: '170 170' }, { rotation: 0, svgOrigin: '170 170', ease: 'none', scrollTrigger: { trigger: '.wind__grid', start: 'top bottom', end: 'center center', scrub: 1 } });
  gsap.from('.wind__wheel', { scale: 0.8, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.wind__wheel', start: 'top 85%', once: true } });

  /* ---------- villa reveal ---------- */
  gsap.fromTo('.clip-reveal', { clipPath: 'inset(14% 18% 14% 18% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.villa__reveal', start: 'top 85%', end: 'top top', scrub: true } });
  gsap.fromTo('.clip-reveal img', { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.villa__reveal', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- inside collage stagger ---------- */
  gsap.from('.inside__collage figure', { y: 80, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.inside__collage', start: 'top 85%', once: true } });

  /* ---------- a day at Marea ---------- */
  const daySec = $('#day');
  const clockEl = $('#clock'), clockLabel = $('#clockLabel');
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const clock = { m: toMin('07:00') };
  const renderClock = () => { const m = Math.round(clock.m); clockEl.textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const moments = $$('.moment');
  const activate = (m) => {
    moments.forEach((x) => x.classList.toggle('is-active', x === m));
    gsap.to(clock, { m: toMin(m.dataset.time), duration: 1.1, ease: 'power2.inOut', onUpdate: renderClock });
    clockLabel.textContent = m.dataset.label;
    gsap.to(daySec, { backgroundColor: m.dataset.bg, color: m.dataset.fg, duration: 1.2, ease: 'power2.out' });
    daySec.style.setProperty('--day-bg', m.dataset.bg);
    daySec.classList.toggle('is-night', m === moments[moments.length - 1]);
  };
  moments.forEach((m) => ScrollTrigger.create({ trigger: m, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && activate(m) }));
  ScrollTrigger.create({ trigger: daySec, start: 'top bottom', end: 'top 55%', onLeaveBack: () => { gsap.to(daySec, { backgroundColor: '#f5f0e8', color: '#1e3640', duration: 0.6 }); daySec.classList.remove('is-night'); } });
  ScrollTrigger.create({ trigger: daySec, start: 'bottom 40%', onEnter: () => {}, onLeaveBack: () => activate(moments[moments.length - 1]) });
  const sun = $('#sun');
  const sunPos = { p: 0 };
  const placeSun = () => {
    const a = Math.PI * (1 - sunPos.p); // 0..π left→right over the arc
    sun.setAttribute('cx', 150 + 130 * Math.cos(a));
    sun.setAttribute('cy', 150 - 130 * Math.sin(a) * (sunPos.p > 0.86 ? 1 - (sunPos.p - 0.86) * 4 : 1));
  };
  gsap.to(sunPos, { p: 1, ease: 'none', onUpdate: placeSun, scrollTrigger: { trigger: '.timeline', start: 'top 55%', end: 'bottom 55%', scrub: 0.6 } });
  placeSun();

  /* ---------- explore horizontal ---------- */
  ScrollTrigger.matchMedia({
    '(min-width: 900px)': () => {
      const track = $('#exploreTrack');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.explore', start: 'top top', end: () => '+=' + dist(), pin: '.explore__pin', scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      $$('.xcard').forEach((card) => {
        gsap.fromTo($('img', card), { scale: 1.3, xPercent: 8 }, { scale: 1.05, xPercent: -8, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.from(card, { y: 60, rotate: 2, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 110%', end: 'left 60%', scrub: true } });
      });
    },
  });

  /* ---------- federica ---------- */
  gsap.from('.federica__badge', { scale: 0, duration: 1.4, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: '.federica__photos', start: 'top 70%', once: true } });

  /* ---------- whatsapp float hides at contact ---------- */
  const waFloat = $('.wa-float');
  const wa = { past: false, contact: false };
  const syncWa = () => { const on = wa.past && !wa.contact; gsap.to(waFloat, { autoAlpha: on ? 1 : 0, y: on ? 0 : 20, duration: 0.5, overwrite: true }); };
  gsap.set(waFloat, { autoAlpha: 0, y: 20 });
  ScrollTrigger.create({ start: () => innerHeight * 0.6, end: 'max', onToggle: (s) => { wa.past = s.isActive; syncWa(); } });
  ScrollTrigger.create({ trigger: '#contact', start: 'top 60%', end: 'bottom 40%', onToggle: (s) => { wa.contact = s.isActive; syncWa(); } });

  /* ---------- footer tide fill ---------- */
  gsap.fromTo('.footer__word--fill', { '--fill': '0%' }, { '--fill': '62%', ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
