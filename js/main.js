/* CCB — main.js */

document.addEventListener('DOMContentLoaded', () => {

  /* === Nav scroll === */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* === Mobile burger === */
  const burger = document.querySelector('.nav-burger');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* === Fade-in on scroll === */
  const faders = document.querySelectorAll('.fade-in');
  if (faders.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    faders.forEach(el => obs.observe(el));
  }

  /* === Project filter (chantiers page) === */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const chantierCards = document.querySelectorAll('.chantier-card[data-categories]');
  if (filterBtns.length && chantierCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        chantierCards.forEach(card => {
          const cats = card.dataset.categories.split(',');
          const show = cat === 'all' || cats.includes(cat);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* === Contact form === */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type=submit]');
      btn.textContent = 'Envoi…';
      btn.disabled = true;

      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          contactForm.style.display = 'none';
          const success = document.querySelector('.form-success');
          if (success) success.style.display = 'block';
        } else {
          throw new Error('server error');
        }
      } catch {
        btn.textContent = 'Erreur — réessayez';
        btn.disabled = false;
      }
    });
  }

  /* === Active nav link === */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-mobile .nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.style.color = 'var(--color-gold)';
    }
  });

  /* === Sketch architectural parallax === */
  const sketchLayers = document.querySelectorAll('.sketch-layer');
  if (sketchLayers.length && !window.matchMedia('(max-width: 768px)').matches) {
    const updateSketches = () => {
      sketchLayers.forEach(layer => {
        const svg = layer.querySelector('svg');
        if (!svg) return;
        const section = layer.parentElement;
        const rect = section.getBoundingClientRect();
        const ratio = (rect.top + rect.height * 0.5 - window.innerHeight * 0.5) / window.innerHeight;
        svg.style.transform = `translateY(calc(-50% + ${ratio * -70}px))`;
      });
    };
    window.addEventListener('scroll', updateSketches, { passive: true });
    updateSketches();
  }

  /* === Timeline horizontale sticky === */
  (function initStickyTimeline() {
    const wrapper = document.querySelector('.tl-wrapper');
    if (!wrapper) return;

    const slides   = Array.from(wrapper.querySelectorAll('.tl-slide'));
    const dots     = Array.from(wrapper.querySelectorAll('.tl-dot'));
    const curLabel = wrapper.querySelector('.tl-year-cur');
    const nxtLabel = wrapper.querySelector('.tl-year-nxt');

    const YEARS    = ['1968', '1981', '1984', '1994', '2000', '2020'];
    const DOT_POS  = ['8%', '24.8%', '41.6%', '58.4%', '75.2%', '92%'];
    const N        = slides.length;
    let   activeIdx = -1;

    function setSlide(idx) {
      if (idx === activeIdx) return;
      activeIdx = idx;

      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
        d.classList.toggle('is-next',   i === idx + 1);
        d.classList.toggle('is-past',   i < idx);
        d.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
      });

      if (curLabel) {
        curLabel.textContent = YEARS[idx] || '';
        curLabel.style.left  = DOT_POS[idx];
      }
      if (nxtLabel) {
        const hasNext = idx < N - 1;
        nxtLabel.textContent  = hasNext ? YEARS[idx + 1] : '';
        nxtLabel.style.left   = hasNext ? DOT_POS[idx + 1] : DOT_POS[idx];
        nxtLabel.style.opacity = hasNext ? '0.8' : '0';
      }
    }

    function onScroll() {
      if (window.matchMedia('(max-width: 768px)').matches) return;
      const rect       = wrapper.getBoundingClientRect();
      const totalRange = wrapper.offsetHeight - window.innerHeight;
      if (totalRange <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / totalRange));
      const idx      = Math.min(Math.floor(progress * N), N - 1);
      setSlide(idx);
    }

    /* Clic sur un point → scroll vers la slide correspondante */
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const totalRange  = wrapper.offsetHeight - window.innerHeight;
        const targetScroll = wrapper.offsetTop + (i / N) * totalRange;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    setSlide(0);
    onScroll();
  })();

  /* === Team columns parallax === */
  (() => {
    const section = document.querySelector('.team-section');
    const colA = document.querySelector('.team-col--a');
    const colB = document.querySelector('.team-col--b');
    const colC = document.querySelector('.team-col--c');
    if (!section || !colA) return;

    // Vitesses différentes par colonne (valeur relative au scroll de la section)
    const SPEED_A =  0.04;   // légèrement vers le bas
    const SPEED_B = -0.06;   // légèrement vers le haut (plus rapide)
    const SPEED_C =  0.03;   // neutre/lent

    const BASE_B = -56; // offset initial de la colonne B (3.5rem ≈ 56px)

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const sectionH = section.offsetHeight;
        // progress : 0 quand le haut de la section entre dans le viewport,
        //            1 quand le bas en sort
        const progress = -rect.top / (sectionH + window.innerHeight);
        const delta = (progress - 0.3) * window.innerHeight;

        colA.style.transform = `translateY(${delta * SPEED_A}px)`;
        colB.style.transform = `translateY(${BASE_B + delta * SPEED_B}px)`;
        if (colC) colC.style.transform = `translateY(${delta * SPEED_C}px)`;

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* === Sketch draw-on animation === */
  (() => {
    const layer   = document.querySelector('.sketch-layer');
    const section = document.querySelector('.has-sketch');
    if (!layer || !section) return;

    const els = [...layer.querySelectorAll('svg > *')];
    if (!els.length) return;

    // Durée de chaque trait + stagger entre traits
    const DUR_S    = 0.65;   // durée d'un trait individuel (s)
    const STAGGER  = 0.045;  // décalage entre chaque trait (s)

    // Ordre de dessin : entablature → shafts → chapiteaux/bases → cannelures → arcs → claveaux → cotes
    // Les éléments sont déjà dans cet ordre dans le SVG — on anime dans l'ordre du DOM
    els.forEach((el, i) => {
      el.style.setProperty('--sd', `${DUR_S}s`);
      el.style.setProperty('--si', `${i * STAGGER}s`);
    });

    const totalDuration = (els.length - 1) * STAGGER + DUR_S;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        layer.classList.add('sketch-drawn');
        // Une fois terminé, nettoyer les dasharray pour éviter de bloquer les repaint
        setTimeout(() => layer.classList.add('sketch-done'), (totalDuration + 0.2) * 1000);
        observer.disconnect();
      }
    }, { threshold: 0.15 });

    observer.observe(section);
  })();

  /* === Réseau B2B — accordéon + carrousel image === */
  (() => {
    const items = document.querySelectorAll('.b2b-item');
    if (items.length) {
      items.forEach(item => {
        const head = item.querySelector('.b2b-item-head');
        head.addEventListener('click', () => {
          const isOpen = item.classList.contains('is-open');
          // Ferme les autres (comportement accordéon)
          items.forEach(other => {
            other.classList.remove('is-open');
            other.querySelector('.b2b-item-head').setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            item.classList.add('is-open');
            head.setAttribute('aria-expanded', 'true');
          }
        });
      });
    }

    const img = document.querySelector('.b2b-visual-img');
    const navBtns = document.querySelectorAll('.b2b-nav-btn');
    if (img && navBtns.length) {
      const sources = ['img/hero/58.jpg', 'img/hero/74095.jpg', 'img/hero/2150760977.jpg'];
      let idx = 0;
      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = parseInt(btn.dataset.dir, 10);
          idx = (idx + dir + sources.length) % sources.length;
          img.style.opacity = '0';
          setTimeout(() => {
            img.src = sources[idx];
            img.style.opacity = '1';
          }, 200);
        });
      });
    }
  })();

});

  /* === Avis clients — carrousel manuel === */
  (() => {
    const track = document.getElementById('reviews-track');
    if (!track) return;

    const cards = [...track.querySelectorAll('.review-card')];
    const N = cards.length;
    let idx = 0;

    const indicator = document.getElementById('rev-track-indicator');
    const prevBtn = document.getElementById('rev-prev');
    const nextBtn = document.getElementById('rev-next');

    function getCardWidth() {
      return cards[0].offsetWidth + parseInt(getComputedStyle(track).gap || '24');
    }

    function go(newIdx) {
      idx = Math.max(0, Math.min(N - 1, newIdx));
      track.style.transform = `translateX(-${idx * getCardWidth()}px)`;
      if (indicator) indicator.style.setProperty('--rev-pos', `${(idx / (N - 1)) * 80}%`);
      // Mettre à jour la barre de progression
      if (indicator) {
        const after = indicator.querySelector ? null : null;
        indicator.style.background = `linear-gradient(to right, var(--color-gold) ${(idx / (N-1)) * 100}%, var(--color-border) ${(idx / (N-1)) * 100}%)`;
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1));

    // Swipe mobile
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
    });

    go(0);
  })();

  /* === Stats — dessin de bordure + compteur === */
  (() => {
    const group = document.querySelector('.stat-draw-group');
    if (!group) return;

    function countUp(el) {
      const target = parseInt(el.dataset.target);
      const prefix = el.dataset.prefix || '';
      const span = el.querySelector('span');
      if (!span) return;

      const duration = 1200;
      const start = Date.now();
      const from = target > 100 ? Math.floor(target * 0.6) : 0;

      function tick() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (target - from) * ease);
        span.textContent = current;
        if (progress < 1) requestAnimationFrame(tick);
        else span.textContent = target;
      }

      el.innerHTML = prefix + '<span>' + from + '</span>';
      requestAnimationFrame(tick);
    }

    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      group.classList.add('is-drawn');
      group.querySelectorAll('.stat-count').forEach((el, i) => {
        setTimeout(() => countUp(el), i * 250);
      });
      obs.disconnect();
    }, { threshold: 0.3 });

    obs.observe(group);
  })();

  /* === Team sketch (fond beige) === */
  (() => {
    const layer = document.querySelector('.team-sketch-layer');
    const section = document.querySelector('.team-section--light');
    if (!layer || !section) return;

    // Appliquer le --si depuis le CSS (déjà défini) et lancer l'animation
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      layer.classList.add('sketch-drawn');
      setTimeout(() => layer.classList.add('sketch-done'), 2200);
      obs.disconnect();
    }, { threshold: 0.1 });

    obs.observe(section);
  })();


  /* === Étapes — apparition en cascade === */
  (() => {
    const items = document.querySelectorAll('.etape-col, .etape-item');
    if (!items.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(el => obs.observe(el));
  })();


/* === Bandeau de consentement cookies === */
(() => {
  const STORAGE_KEY = 'ccb_cookie_consent';

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch { return null; }
  }
  function setConsent(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, date: new Date().toISOString() }));
    } catch (e) { /* stockage indisponible */ }
  }

  function buildBanner() {
    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Consentement aux cookies');
    banner.innerHTML = `
      <h4>🍪 Nous respectons votre vie privée</h4>
      <p>Ce site utilise des cookies pour assurer son bon fonctionnement et, avec votre accord, mesurer son audience. Vous pouvez accepter ou refuser les cookies non essentiels. En savoir plus dans notre <a href="politique-cookies.html">politique de cookies</a>.</p>
      <div class="cookie-actions">
        <button type="button" class="cookie-btn cookie-btn--refuse" data-cookie="refuse">Continuer sans accepter</button>
        <button type="button" class="cookie-btn cookie-btn--accept" data-cookie="accept">Tout accepter</button>
      </div>`;
    document.body.appendChild(banner);

    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('is-visible')));

    banner.querySelectorAll('[data-cookie]').forEach(btn => {
      btn.addEventListener('click', () => {
        setConsent(btn.dataset.cookie);
        banner.classList.remove('is-visible');
        setTimeout(() => banner.remove(), 500);
        // Emplacement pour (dé)activer d'éventuels scripts de mesure d'audience
        // if (btn.dataset.cookie === 'accept') { /* charger l'analytics ici */ }
      });
    });
  }

  // Afficher le bandeau si aucun choix mémorisé
  if (!getConsent()) buildBanner();

  // Rouvrir depuis la page cookies ("Gérer mes préférences")
  document.querySelectorAll('[data-cookie-reopen]').forEach(el => {
    el.addEventListener('click', () => {
      if (!document.querySelector('.cookie-banner')) buildBanner();
    });
  });
})();

/* === FAQ pages prestation — accordéon === */
(() => {
  const items = document.querySelectorAll('.svc-faq-item');
  if (!items.length) return;
  items.forEach(item => {
    const head = item.querySelector('.svc-faq-head');
    head.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      items.forEach(o => { o.classList.remove('is-open'); o.querySelector('.svc-faq-head').setAttribute('aria-expanded','false'); });
      if (!open) { item.classList.add('is-open'); head.setAttribute('aria-expanded','true'); }
    });
  });
})();

/* === Images chantiers : fallback auto vers placeholder tant que la vraie photo n'est pas déposée === */
(() => {
  // <img data-fb="url-placeholder">
  document.querySelectorAll('img[data-fb]').forEach(img => {
    const swap = () => { if (img.dataset.fb && img.src !== img.dataset.fb) img.src = img.dataset.fb; };
    img.addEventListener('error', swap, { once: true });
    if (img.complete && img.naturalWidth === 0) swap(); // déjà en échec au chargement du script
  });
  // Éléments avec background-image (hero chantier) data-fb="url-placeholder"
  document.querySelectorAll('[data-fb]:not(img)').forEach(el => {
    const m = (el.getAttribute('style') || '').match(/url\(['"]?([^'")]+)['"]?\)/);
    if (!m) return;
    const test = new Image();
    test.onerror = () => { el.style.backgroundImage = `url('${el.dataset.fb}')`; };
    test.src = m[1];
  });
})();

/* === Section « Notre méthode » — flèches pointillées animées entre les cartes === */
(() => {
  const flow = document.querySelector('.methode-flow');
  if (!flow) return;
  const svg = flow.querySelector('.methode-lines');
  const cards = [...flow.querySelectorAll('.methode-card')];
  if (!svg || cards.length < 2) return;

  const NS = 'http://www.w3.org/2000/svg';
  let paths = [];
  let drawn = false;

  function build() {
    // positions de layout (ignorent la transform d'entrée des cartes)
    const W = flow.offsetWidth, H = flow.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    paths = [];

    // marqueur flèche
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = '<marker id="methode-arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">' +
      '<path d="M1 1 L6 5 L1 9" fill="none" stroke="#B8935A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>';
    svg.appendChild(defs);

    for (let i = 0; i < cards.length - 1; i++) {
      const a = cards[i], b = cards[i + 1];
      const x1 = a.offsetLeft + a.offsetWidth * 0.5;
      const y1 = a.offsetTop + a.offsetHeight;
      const x2 = b.offsetLeft + Math.min(b.offsetWidth * 0.35, 70);
      const y2 = b.offsetTop;
      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2 - 6}`;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', 'methode-line');
      p.setAttribute('marker-end', 'url(#methode-arrow)');
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = drawn ? '0' : `${len}`;
      svg.appendChild(p);
      paths.push(p);
    }
  }

  function animate() {
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.transition = 'none';
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      p.getBoundingClientRect(); // reflow
      p.style.transition = `stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1) ${0.35 + i * 0.55}s`;
      p.style.strokeDashoffset = '0';
    });
  }

  build();
  window.addEventListener('resize', () => { build(); }, { passive: true });

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      flow.classList.add('is-in');
      build();
      animate();
      drawn = true;
      obs.disconnect();
    }
  }, { threshold: 0.25 });
  obs.observe(flow);
})();
